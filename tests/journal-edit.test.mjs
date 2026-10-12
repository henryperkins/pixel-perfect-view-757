import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h;
before(async () => {
  h = await createRecordsHarness();
});
after(async () => h?.close());
beforeEach(async () => h.reset());
const client = () => h.records();
async function seed(user = h.userA) {
  await h.app.addLifeEvent(
    client(),
    user,
    "2026-10-10",
    "work",
    "Original private title",
    "Original private body",
    "saved-cycle",
    "saved-chapter",
  );
  return h.sqlite.prepare("SELECT * FROM life_events WHERE user_id=?").get(user);
}
function edit(row, changes = {}, user = h.userA) {
  assert.equal(typeof h.app.updateLifeEvent, "function", "journal editing is missing");
  return h.app.updateLifeEvent(client(), user, {
    id: row.id,
    label: "Revised private title",
    body: "Revised private body",
    expectedRevision: row.revision,
    ...changes,
  });
}

test("editing encrypts the changed text, increments revision and preserves historical attachments", async () => {
  const original = await seed();
  const result = await edit(original);
  const row = h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id);
  assert.equal(result.id, original.id);
  assert.equal(result.revision, 1);
  assert.ok(Number.isFinite(Date.parse(result.updatedAt)));
  assert.notEqual(row.label_ct, original.label_ct);
  assert.notEqual(row.label_ct, "Revised private title");
  assert.notEqual(row.body_ct, "Revised private body");
  for (const field of [
    "user_id",
    "occurred_on",
    "domain",
    "cycle_key",
    "feature_key",
    "created_at",
  ])
    assert.equal(row[field], original[field], field);
  await h.reopen();
  const saved = (await h.app.listJournal(client(), h.userA)).events[0];
  assert.equal(saved.label, "Revised private title");
  assert.equal(saved.body, "Revised private body");
  assert.equal(saved.revision, 1);
});

test("wrong owners and missing entries cannot be edited", async () => {
  const original = await seed(h.userB);
  await assert.rejects(edit(original), /entry.*not found/i);
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id),
    original,
  );
  await assert.rejects(edit({ id: "missing-entry", revision: 0 }), /entry.*not found/i);
});

test("a stale tab cannot overwrite newer entry text", async () => {
  const original = await seed();
  await edit(original);
  const saved = h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id);
  await assert.rejects(edit(original, { label: "Stale tab title" }), /changed.*another tab/i);
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id),
    saved,
  );
  await edit(saved, { label: "Explicitly reconciled title" });
  assert.equal(
    (await h.app.listJournal(client(), h.userA)).events[0].label,
    "Explicitly reconciled title",
  );
});

test("a concurrent change after the ownership read is protected by the write predicate", async () => {
  const original = await seed();
  const dek = await h.app.getDek(client(), h.userA);
  const otherCiphertext = await h.cryptoModule.encryptField(dek, "Other tab's newer title");
  let changed = false;
  h.setFault({
    matches: (sql) => {
      if (!changed && sql.startsWith('update "life_events"')) {
        changed = true;
        h.sqlite
          .prepare("UPDATE life_events SET label_ct=?,revision=revision+1 WHERE id=?")
          .run(otherCiphertext, original.id);
      }
      return false;
    },
  });
  await assert.rejects(edit(original), /changed.*another tab/i);
  const saved = h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id);
  assert.equal(saved.label_ct, otherCiphertext);
  assert.equal(saved.revision, 1);
  assert.equal(saved.body_ct, original.body_ct);
});

test("invalid editing inputs fail before reading or writing records", async () => {
  const original = await seed();
  for (const changes of [
    { label: " " },
    { label: "x".repeat(401) },
    { body: "x".repeat(4001) },
    { expectedRevision: -1 },
    { expectedRevision: 0.5 },
  ]) {
    const count = h.requests.length;
    await assert.rejects(edit(original, changes), /title|characters|revision/i);
    assert.equal(h.requests.length, count);
  }
});

test("clearing an optional body preserves the label and attachments", async () => {
  const original = await seed();
  await edit(original, { body: null });
  const saved = (await h.app.listJournal(client(), h.userA)).events[0];
  assert.equal(saved.body, null);
  assert.equal(saved.cycle_key, original.cycle_key);
  assert.equal(saved.feature_key, original.feature_key);
});

test("failed writes and broken encryption keys preserve the original entry", async () => {
  const original = await seed();
  h.setFault({ matches: (sql) => sql.startsWith('update "life_events"') });
  await assert.rejects(edit(original), /could not be saved|503/i);
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id),
    original,
  );
  h.setFault(null);
  h.sqlite
    .prepare("UPDATE profiles SET wrapped_dek=? WHERE id=?")
    .run("malformed-wrapped-key", h.userA);
  await assert.rejects(edit(original));
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM life_events WHERE id=?").get(original.id),
    original,
  );
});
