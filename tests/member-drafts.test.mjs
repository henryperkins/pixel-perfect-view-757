import assert from "node:assert/strict";
import { test } from "node:test";
let m = {};
try {
  m = await import("../src/lib/member-drafts.ts");
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}
const now = Date.parse("2026-10-14T12:00:00Z");
const values = {
  day: "2026-10-14",
  timezone: "UTC",
  mood: 3,
  energy: 4,
  sleep: 2,
  stress: 5,
  note: "Private unfinished reflection",
};
function draft() {
  assert.equal(typeof m.createMemberDraft, "function", "draft recovery model is missing");
  return m.createMemberDraft({
    ownerId: "account-a",
    generation: "generation-a",
    kind: "check-in",
    entityKey: values.day,
    values,
    baseline: { values: { ...values, note: "" }, version: null },
    now,
  });
}
test("drafts expire seven days after their latest edit and retain their original day", () => {
  const d = draft();
  assert.equal(d.expiresAt, now + 7 * 86400000);
  assert.equal(m.isDraftExpired(d, d.expiresAt), true);
  const edited = m.editMemberDraft(d, { ...values, note: "Next revision" }, now + 1000);
  assert.equal(edited.entityKey, values.day);
  assert.equal(edited.revision, d.revision + 1);
  assert.equal(edited.expiresAt, now + 1000 + 7 * 86400000);
  assert.equal(d.values.note, values.note);
});
test("validation rejects unknown schemas, invalid bands, mismatched day scope, and invalid owner", () => {
  const d = draft();
  assert.ok(m.parseMemberDraft(d));
  for (const bad of [
    { ...d, schemaVersion: 2 },
    { ...d, ownerId: "" },
    { ...d, entityKey: "2026-10-15" },
    { ...d, values: { ...values, mood: 9 } },
  ])
    assert.equal(m.parseMemberDraft(bad), null);
});
test("revoking optional sources strips values from current, baseline, and pending snapshot", () => {
  const d = draft();
  const pending = m.withDraftSubmission(d, "operation-a");
  const safe = m.restrictDraftWellness(pending, { sleep: false, stress: false });
  for (const value of [
    safe.values,
    safe.baseline.values,
    safe.submission.values,
    safe.submission.baseline.values,
  ]) {
    assert.equal(value.sleep, null);
    assert.equal(value.stress, null);
    assert.equal(value.note === "" || value.note === values.note, true);
  }
  assert.equal(d.values.sleep, 2);
});
test("a submitted revision is immutable while later edits remain recoverable", () => {
  const submitted = m.withDraftSubmission(draft(), "operation-a");
  const later = m.editMemberDraft(submitted, { ...values, note: "Newer text" }, now + 1000);
  assert.equal(later.submission.values.note, values.note);
  const reconciled = m.acknowledgeMemberDraft(later, submitted.submission, values, "saved-v1");
  assert.equal(reconciled.values.note, "Newer text");
  assert.equal(reconciled.baseline.version, "saved-v1");
  assert.equal(reconciled.submission, null);
  assert.equal(m.acknowledgeMemberDraft(submitted, submitted.submission, values, "saved-v1"), null);
});
test("a different canonical result never acknowledges unsaved text", () => {
  const submitted = m.withDraftSubmission(draft(), "operation-a");
  const result = m.acknowledgeMemberDraft(
    submitted,
    submitted.submission,
    { ...values, note: "Another device" },
    "saved-v2",
  );
  assert.equal(result.values.note, values.note);
  assert.equal(result.baseline.values.note, "Another device");
});
test("a checkpoint cannot mutate its callers nested values or submission baseline", () => {
  const d = draft();
  const pending = m.withDraftSubmission(d, "operation-a");
  d.values.note = "Changed caller";
  d.baseline.values.note = "Changed baseline";
  assert.equal(pending.submission.values.note, values.note);
  assert.equal(pending.submission.baseline.values.note, "");
});
