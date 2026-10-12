import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let harness;
let data;
before(async () => {
  harness = await createRecordsHarness();
  data = await harness.vite.ssrLoadModule("/src/lib/d1.server.ts");
});
after(async () => harness?.close());
beforeEach(async () => harness.reset());

test("signed batches commit together and return statement results in order", async () => {
  assert.equal(typeof data.execBatch, "function", "the signed atomic batch client is missing");
  const results = await data.execBatch([
    {
      sql: "INSERT INTO life_events(id,user_id,occurred_on,label_ct) VALUES (?,?,?,?)",
      params: ["batch-event", harness.userA, "2026-10-12", "ciphertext-original"],
    },
    { sql: "SELECT label_ct FROM life_events WHERE id = ?", params: ["batch-event"] },
  ]);
  assert.equal(results.length, 2);
  assert.equal(results[1].results[0].label_ct, "ciphertext-original");
  assert.equal(harness.sqlite.prepare("SELECT COUNT(*) AS n FROM life_events").get().n, 1);
});

test("a failed middle statement rolls back every earlier batch mutation", async () => {
  assert.equal(typeof data.execBatch, "function", "the signed atomic batch client is missing");
  await assert.rejects(
    data.execBatch([
      {
        sql: "INSERT INTO life_events(id,user_id,occurred_on,label_ct) VALUES (?,?,?,?)",
        params: ["rollback-event", harness.userA, "2026-10-12", "ciphertext-original"],
      },
      { sql: "INSERT INTO missing_table(id) VALUES (?)", params: ["invalid"] },
      { sql: "DELETE FROM users WHERE id = ?", params: [harness.userB] },
    ]),
    /batch.*failed|missing_table/i,
  );
  assert.equal(harness.sqlite.prepare("SELECT COUNT(*) AS n FROM life_events").get().n, 0);
  assert.equal(harness.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get().n, 2);
});

test("empty and malformed batches fail before any data-plane request", async () => {
  assert.equal(typeof data.execBatch, "function", "the signed atomic batch client is missing");
  const count = harness.requests.length;
  await assert.rejects(data.execBatch([]), /batch.*statement/i);
  await assert.rejects(data.execBatch([{ sql: "" }]), /statement/i);
  assert.equal(harness.requests.length, count);
});

test("a data-plane failure is surfaced without replaying the write", async () => {
  assert.equal(typeof data.execBatch, "function", "the signed atomic batch client is missing");
  harness.setFault({ matches: (sql) => sql.includes("life_events") });
  const count = harness.requests.length;
  await assert.rejects(data.execBatch([{ sql: "DELETE FROM life_events" }]), /503/);
  assert.equal(harness.requests.length, count + 1);
});
