import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => h.reset());
after(async () => h?.close());
const create = (operation, user = h.userA, label = "Private title") =>
  h.app.addLifeEvent(
    h.records(),
    user,
    "2026-10-14",
    "general",
    label,
    "Private body",
    null,
    null,
    operation,
  );
test("concurrent replay of one journal operation creates only one entry", async () => {
  const operation = randomUUID();
  const [a, b] = await Promise.all([create(operation), create(operation)]);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM life_events").get().n, 1);
  assert.equal(typeof a.id, "string");
  assert.equal(a.id, b.id);
  assert.equal(a.entry.label, "Private title");
  const raw = h.sqlite.prepare("SELECT * FROM life_events").get();
  assert.notEqual(raw.label_ct, "Private title");
  assert.notEqual(raw.body_ct, "Private body");
});
test("an uncertain save can be found after restart without another write", async () => {
  const operation = randomUUID();
  const first = await create(operation);
  await h.reopen();
  assert.equal(
    typeof h.app.resolveLifeEventSubmission,
    "function",
    "submission resolution is missing",
  );
  const resolved = await h.app.resolveLifeEventSubmission(h.records(), h.userA, operation);
  assert.equal(resolved.state, "saved");
  assert.equal(resolved.entry.id, first.id);
  assert.deepEqual(await h.app.resolveLifeEventSubmission(h.records(), h.userB, operation), {
    state: "missing",
  });
});
test("operation identity is scoped to account and cannot overwrite edited content", async () => {
  const operation = randomUUID();
  const first = await create(operation);
  const other = await create(operation, h.userB);
  assert.notEqual(first.id, other.id);
  await h.app.updateLifeEvent(h.records(), h.userA, {
    id: first.id,
    label: "Later version",
    body: null,
    expectedRevision: 0,
  });
  const replay = await create(operation, h.userA, "Different retry");
  assert.equal(replay.replayed, true);
  assert.equal(replay.entry.label, "Later version");
  assert.equal(replay.entry.revision, 1);
});
test("legacy callers still create separate entries and invalid operation ids fail before records access", async () => {
  const a = await create(undefined),
    b = await create(undefined);
  assert.notEqual(a.id, b.id);
  const count = h.requests.length;
  await assert.rejects(create("invalid-operation"), /operation/i);
  assert.equal(h.requests.length, count);
});
