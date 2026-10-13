import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedNatalReading } from "./helpers/natal-fixtures.mjs";
let h, candidate, retention;
before(async () => {
  h = await createRecordsHarness();
  ({ WRITING_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/writing-candidate-bundle.ts",
  ));
  retention = await h.vite.ssrLoadModule("/src/lib/retention.server.ts");
});
beforeEach(async () => h.reset());
after(async () => h?.close());
async function prepare(context, { stress = false } = {}) {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const seeded = await seedNatalReading(h);
  await h.records().from("content_releases").delete();
  await h.records().from("content_releases").insert({
    version: candidate.version,
    bundle: candidate,
    checksum: "writing-local",
    is_active: true,
  });
  if (stress) {
    await h.app.setConsent(h.records(), h.userA, "WEL-03", true);
    await h.records().from("check_ins").insert({ user_id: h.userA, day: "2026-10-11", stress: 5 });
  }
  h.setGateway(() => new Response(null, { status: 503 }));
  return seeded;
}
const savedRow = (id) => {
  const row = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(id);
  return { ...row, language_meta: JSON.parse(row.language_meta) };
};
test("new writing questions, source scenes and exact paragraph evidence are encrypted and reopen without generation", async (context) => {
  const { dek } = await prepare(context);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.language.dailyWriting.status, "saved");
  const row = savedRow(first.reading.id);
  assert.equal(row.prompt, null);
  const envelope = await h.cryptoModule.decryptJson(dek, row.language_meta.daily_writing_ct);
  assert.equal(envelope.reflection.question, first.reading.prompt);
  assert.ok(!JSON.stringify(row.language_meta).includes(envelope.reflection.question));
  assert.ok(!JSON.stringify(row.language_meta).includes(envelope.plan.scenes[0].situation));
  assert.deepEqual(envelope, first.language.dailyWriting.evidence);
  const historyQueries = () =>
    h.requests.filter(
      (r) =>
        /FROM\s+"?daily_readings"?/i.test(r.sql) &&
        ["2026-10-10", "2026-10-09", "2026-10-08"].some((day) => r.params.includes(day)),
    ).length;
  const historyBefore = historyQueries();
  assert.equal(historyBefore, 3);
  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(cached.reading.id, first.reading.id);
  assert.deepEqual(cached.language, first.language);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(historyQueries(), historyBefore);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  const output = exported.readings.find((r) => r.id === first.reading.id);
  assert.equal(output.prompt, envelope.reflection.question);
  assert.deepEqual(output.language.dailyWriting, first.language.dailyWriting);
});
test("present corrupt or incorrectly bound writing evidence fails closed without a model retry or current-content reconstruction", async (context) => {
  const { dek } = await prepare(context);
  const first = await h.app.getToday(h.records(), h.userA, "UTC"),
    row = savedRow(first.reading.id),
    original = await h.cryptoModule.decryptJson(dek, row.language_meta.daily_writing_ct);
  for (const mutate of [
    (e) => (e.readingId = "wrong"),
    (e) => (e.snapshotId = "wrong"),
    (e) => (e.releaseVersion = "wrong"),
    (e) => (e.primaryCycleKey = "wrong"),
    (e) => (e.plan.theme.sourceKey = "wrong"),
    (e) => (e.sceneUse[0].paragraph = 4),
    (e) => (e.astroParagraphCount = 4),
    (e) => (e.reflection.question = "Which unrelated topic matters?"),
    (e) => {
      e.reflection.question = "Which unrelated topic matters?";
      e.reflection.variant = "fallback";
    },
    (e) => {
      e.reflection.question = "Which unrelated topic matters?";
      e.reflection.variant = "legacy";
    },
    (e) => {
      e.renderMode = "unframed";
      e.sceneUse = [];
    },
    (e) => (e.plan.templateSources[0].sentences[0] = "An invented source sentence."),
    (e) => (e.historyAvailability.bodies = ["Private history sentinel."]),
  ]) {
    const envelope = structuredClone(original);
    mutate(envelope);
    const changed = {
      ...row,
      language_meta: {
        ...row.language_meta,
        daily_writing_ct: await h.cryptoModule.encryptJson(dek, envelope),
      },
    };
    await assert.rejects(
      h.app.readingLanguage(changed, dek),
      /writing evidence|could not be loaded/i,
    );
  }
  await assert.rejects(
    h.app.readingLanguage(
      { ...row, language_meta: { ...row.language_meta, daily_writing_ct: "broken" } },
      dek,
    ),
    /writing evidence/i,
  );
  await assert.rejects(
    h.app.readingLanguage(row, await h.app.getDek(h.records(), h.userB)),
    /could not be loaded/i,
  );
  assert.equal(h.gatewayRequests.length, 1);
});
test("an explicitly reviewed later sentence index survives generation, encryption and archive restoration", async (context) => {
  const { dek } = await prepare(context);
  const bundle = structuredClone(candidate);
  const source = bundle.cycles.find((c) => c.key === "square:saturn:sun");
  source.mechanism = Array.from(
    { length: 11 },
    () => "An ordinary choice can be compared with the effort it would require.",
  ).join(" ");
  bundle.dailyWritingFrames.find(
    (f) => f.source.kind === "interpretation" && f.source.key === source.key,
  ).templateSentenceIndex = 10;
  await h.records().from("content_releases").update({ bundle }).eq("version", bundle.version);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.language.dailyWriting.evidence.plan.frame.templateSentenceIndex, 10);
  const saved = savedRow(first.reading.id);
  assert.equal(
    (await h.app.readingLanguage(saved, dek)).dailyWriting.evidence.plan.frame
      .templateSentenceIndex,
    10,
  );
});
test("wellness-selected questions have a retention binding, are withheld after revocation and leave no retained question copy", async (context) => {
  const { dek } = await prepare(context, { stress: true });
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.language.dailyWriting.evidence.reflection.localSource, "WEL-03");
  const question = first.reading.prompt,
    row = savedRow(first.reading.id);
  assert.equal(row.prompt, null);
  assert.ok(!JSON.stringify(row.language_meta).includes(question));
  if (row.local_context_ct)
    assert.ok(
      !(await h.cryptoModule.decryptJson(dek, row.local_context_ct)).prompt.includes(question),
    );
  await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
  const purged = savedRow(first.reading.id);
  assert.equal(purged.language_meta.daily_writing_ct, undefined);
  assert.equal(purged.local_context_ct, null);
  const language = await h.app.readingLanguage(purged, dek);
  assert.deepEqual(language.dailyWriting, { status: "unavailable", reason: "revoked" });
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exported.readings.find((r) => r.id === first.reading.id).prompt, null);
});
test("the scheduled retention purge removes expired writing selection while preserving its astronomical body and other owners", async (context) => {
  const { dek } = await prepare(context, { stress: true });
  const first = await h.app.getToday(h.records(), h.userA, "UTC"),
    before = savedRow(first.reading.id);
  const expiry = before.language_meta.dailyWritingRetention.expiresAt;
  const result = await retention.purgeExpiredContext(
    { now: new Date(expiry), cursor: null, limit: 100 },
    h.records(),
  );
  assert.equal(result.counts.writing_copies, 1);
  const after = savedRow(first.reading.id);
  assert.equal(after.body_ct, before.body_ct);
  assert.equal(after.language_meta.daily_writing_ct, undefined);
  assert.deepEqual((await h.app.readingLanguage(after, dek)).dailyWriting, {
    status: "unavailable",
    reason: "expired",
  });
  assert.ok(h.sqlite.prepare("SELECT id FROM users WHERE id=?").get(h.userB));
});
