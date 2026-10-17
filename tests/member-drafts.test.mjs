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

const birthValues = {
  birthDate: "1990-02-03",
  birthTime: "08:15",
  accuracy: "exact",
  placeLabel: "Cambridge, England, United Kingdom",
  latitude: "52.205",
  longitude: "0.119",
  timezone: "Europe/London",
  placeResolution: "lookup",
};
function birthDraft(overrides = {}) {
  return m.createMemberDraft({
    ownerId: "account-a",
    generation: "generation-a",
    kind: "birth-details",
    entityKey: "birth",
    values: { ...birthValues, ...overrides },
    baseline: {
      values: { ...birthValues, birthTime: "", accuracy: "unknown", placeResolution: "saved" },
      version: "birth-revision-1",
    },
    now,
  });
}
test("birth drafts round-trip partial and invalid answers without treating them as valid birth data", () => {
  const d = birthDraft({
    birthDate: "1990-",
    birthTime: "",
    latitude: "-",
    longitude: "999",
    timezone: "Not/A_Timezone",
    placeResolution: "manual",
  });
  const pending = m.withDraftSubmission(d, "birth-operation-a");
  assert.deepEqual(m.parseMemberDraft(JSON.parse(JSON.stringify(pending))), pending);
  assert.equal(pending.baseline.version, "birth-revision-1");
  assert.equal(pending.expiresAt, now + 7 * 86400000);
  const firstRun = { ...d, baseline: { ...d.baseline, version: null } };
  assert.deepEqual(m.parseMemberDraft(firstRun), firstRun);
});
test("birth drafts reject malformed enums, entity scope and oversized answers in every snapshot", () => {
  const d = birthDraft();
  assert.ok(m.parseMemberDraft(d));
  for (const bad of [
    { ...d, entityKey: "another-birth" },
    { ...d, kind: "birth" },
    { ...d, values: { ...d.values, accuracy: "approximate" } },
    { ...d, values: { ...d.values, placeResolution: "trusted" } },
    { ...d, values: { ...d.values, latitude: 52.205 } },
    { ...d, values: { ...d.values, birthDate: undefined } },
    { ...d, baseline: { ...d.baseline, version: 1 } },
  ])
    assert.equal(m.parseMemberDraft(bad), null);

  const limits = {
    birthDate: 32,
    birthTime: 32,
    placeLabel: 500,
    latitude: 64,
    longitude: 64,
    timezone: 240,
  };
  for (const [key, limit] of Object.entries(limits)) {
    assert.ok(m.parseMemberDraft({ ...d, values: { ...d.values, [key]: "x".repeat(limit) } }));
    const oversized = { ...d.values, [key]: "x".repeat(limit + 1) };
    assert.equal(m.parseMemberDraft({ ...d, values: oversized }), null, `${key} current value`);
    assert.equal(
      m.parseMemberDraft({ ...d, baseline: { values: oversized, version: null } }),
      null,
      `${key} baseline`,
    );
    const pending = m.withDraftSubmission(d, "birth-operation-a");
    assert.equal(
      m.parseMemberDraft({ ...pending, submission: { ...pending.submission, values: oversized } }),
      null,
      `${key} submission`,
    );
    assert.equal(
      m.parseMemberDraft({
        ...pending,
        submission: { ...pending.submission, baseline: { values: oversized, version: null } },
      }),
      null,
      `${key} submission baseline`,
    );
  }
});
test("acknowledging a saved birth preserves edits made after its submitted snapshot", () => {
  const pending = m.withDraftSubmission(birthDraft(), "birth-operation-a");
  const later = m.editMemberDraft(pending, { ...birthValues, birthTime: "09:30" }, now + 1000);
  const result = m.acknowledgeMemberDraft(
    later,
    pending.submission,
    birthValues,
    "birth-revision-2",
  );
  assert.equal(result.values.birthTime, "09:30");
  assert.equal(result.baseline.values.birthTime, "08:15");
  assert.equal(result.baseline.version, "birth-revision-2");
  assert.equal(result.submission, null);
  assert.equal(pending.submission.values.birthTime, "08:15");
  assert.equal(
    m.acknowledgeMemberDraft(pending, pending.submission, birthValues, "birth-revision-2"),
    null,
  );
});
test("birth draft copy includes every answer and never represents unknown noon as an exact time", () => {
  const text = m.draftText(birthDraft());
  for (const value of Object.values(birthValues)) assert.ok(text.includes(value), value);
  assert.match(text, /Birth date: 1990-02-03/);
  assert.match(text, /Birth time: 08:15/);
  assert.match(text, /Time accuracy: exact/);
  assert.match(text, /Latitude: 52\.205/);
  assert.match(text, /Longitude: 0\.119/);
  assert.match(text, /Timezone: Europe\/London/);
  const unknown = m.draftText(birthDraft({ birthTime: "12:00", accuracy: "unknown" }));
  assert.match(unknown, /Birth time: Unknown/);
  assert.match(unknown, /Time accuracy: unknown/);
  assert.doesNotMatch(unknown, /12:00|exact/);
});
