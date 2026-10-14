import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemberDraft, editMemberDraft } from "../src/lib/member-drafts.ts";
let m = {};
try {
  m = await import("../src/lib/journal-submit.ts");
} catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}
const values = {
  occurredOn: "2026-10-14",
  domain: "general",
  label: " Title ",
  body: " Note ",
  cycleKey: "",
  featureKey: "",
};
const make = () =>
  createMemberDraft({
    ownerId: "a",
    generation: "g",
    kind: "journal-new",
    entityKey: "new",
    values,
    baseline: { values: { ...values, label: "", body: "" }, version: null },
  });
test("a slow journal acknowledgement never clears a newer revision", () => {
  assert.equal(
    typeof m.createJournalSubmission,
    "function",
    "immutable submission helper is missing",
  );
  const d = make(),
    submission = m.createJournalSubmission(d, "operation");
  const newer = editMemberDraft(d, { ...values, body: "Newer note" });
  const canonical = {
    id: "entry",
    occurred_on: values.occurredOn,
    domain: "general",
    label: "Title",
    body: "Note",
    cycle_key: null,
    feature_key: null,
    revision: 0,
  };
  const result = m.reconcileJournalSubmission(newer, submission, canonical);
  assert.equal(result.kind, "newer-local-edits");
  assert.equal(result.draft.values.body, "Newer note");
  assert.equal(m.reconcileJournalSubmission(d, submission, canonical).kind, "acknowledged");
  assert.equal(
    m.reconcileJournalSubmission(d, submission, { ...canonical, body: "Other device" }).kind,
    "different-server-value",
  );
});
test("journal payload normalizes text once without mutating local values", () => {
  assert.equal(typeof m.journalPayload, "function");
  const payload = m.journalPayload(values);
  assert.equal(payload.label, "Title");
  assert.equal(payload.body, "Note");
  assert.equal(payload.cycleKey, null);
  assert.equal(values.label, " Title ");
});
