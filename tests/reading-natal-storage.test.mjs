import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedNatalReading, natalReadingResponse } from "./helpers/natal-fixtures.mjs";
let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => h.reset());
after(async () => h?.close());
async function prepare(context, options = {}) {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const seeded = await seedNatalReading(h, options);
  h.setGateway(natalReadingResponse);
  return seeded;
}
function row(id) {
  return h.sqlite.prepare("SELECT * FROM daily_readings WHERE id = ?").get(id);
}
test("natal_copy_and_origin_are_not_clear_metadata", async (context) => {
  const { dek } = await prepare(context);
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(today.language.mode, "model", today.language.reason);
  const saved = row(today.reading.id),
    meta = JSON.parse(saved.language_meta);
  assert.ok(meta.natal_lens_ct);
  assert.ok(!meta.facts.some((f) => f.id === "N1"));
  const clear = JSON.stringify({ ...meta, natal_lens_ct: "encrypted" });
  // The seeded Sun is unscreened, so the deterministic Moon fallback is selected.
  assert.equal(today.language.natalLens.plan.lens.ruleKey, "nl-moon-10-aspect-01");
  for (const value of [
    today.language.natalLens.plan.lens.mechanism,
    today.language.natalLens.plan.lens.ruleKey,
    "nl-moon-10",
    "Capricorn",
    "marginsDeg",
    "sampleEngines",
    "longitudes",
  ])
    assert.ok(!clear.includes(value), value);
  const sources = JSON.stringify(
    h.sqlite
      .prepare("SELECT detail,label FROM reading_sources WHERE reading_id=?")
      .all(today.reading.id),
  );
  assert.ok(!sources.includes("nl-moon") && !sources.includes("Capricorn"));
  const envelope = await h.cryptoModule.decryptJson(dek, meta.natal_lens_ct);
  assert.deepEqual(envelope.usedParagraphs, [2]);
  assert.deepEqual(envelope, today.language.natalLens);
});
test("cached_natal_evidence_is_exact_saved_evidence", async (context) => {
  await prepare(context);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(cached.reading.id, first.reading.id);
  assert.deepEqual(cached.language, first.language);
  assert.deepEqual(cached.provenance, first.provenance);
  assert.equal(h.gatewayRequests.length, 1);
});
test("manifest_upgrade_changes_reading_identity_but_reencryption_does_not", async (context) => {
  const { dek, manifest, snapshotId } = await prepare(context, { legacy: true });
  const legacy = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(legacy.language.natalLens, null);
  await h.app.submitFeedback(h.records(), h.userA, legacy.reading.id, 1, []);
  const houses = JSON.parse(
    h.sqlite.prepare("SELECT houses FROM chart_snapshots WHERE id=?").get(snapshotId).houses,
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    houses.natalReliability_ct = await h.cryptoModule.encryptJson(dek, manifest);
    await h.records().from("chart_snapshots").update({ houses }).eq("id", snapshotId);
    const current = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.notEqual(current.reading.id, legacy.reading.id);
    assert.equal(h.gatewayRequests.length, 2);
  }
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM reading_feedback").get().n, 1);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM daily_readings").get().n, 2);
});
test("broken_saved_natal_envelope_fails_read_including_cross_account_keys", async (context) => {
  const { dek } = await prepare(context);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  const saved = row(first.reading.id),
    meta = JSON.parse(saved.language_meta);
  const ownerRow = { ...saved, language_meta: meta };
  await assert.rejects(
    h.app.readingLanguage(ownerRow, await h.app.getDek(h.records(), h.userB)),
    /could not be loaded/,
  );
  for (const changed of [
    { ...meta, natal_lens_ct: "broken" },
    { ...meta, natal_lens_ct: undefined },
    { ...meta, factOrder: [...meta.factOrder, "N1"] },
    { ...meta, citations: meta.citations.map((c) => ({ ...c, facts: [...c.facts, "N2"] })) },
    { ...meta, citations: meta.citations.slice(1) },
  ]) {
    await assert.rejects(
      h.app.readingLanguage({ ...ownerRow, language_meta: changed }, dek),
      /could not be loaded/,
    );
  }
  const envelope = await h.cryptoModule.decryptJson(dek, meta.natal_lens_ct);
  for (const change of [
    (e) => (e.plan.releaseVersion = "wrong"),
    (e) => (e.plan.lens.anchorCycleKey = "wrong"),
    (e) => (e.usedParagraphs = [1]),
    (e) => (e.fact.natalEvidenceId = "NL2"),
  ]) {
    const tampered = structuredClone(envelope);
    change(tampered);
    await assert.rejects(
      h.app.readingLanguage(
        {
          ...ownerRow,
          language_meta: {
            ...meta,
            natal_lens_ct: await h.cryptoModule.encryptJson(dek, tampered),
          },
        },
        dek,
      ),
      /could not be loaded/,
    );
  }
});
test("template_consumption_is_private", async (context) => {
  await prepare(context);
  h.setGateway(() => new Response(null, { status: 503 }));
  const template = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(template.language.mode, "template");
  assert.deepEqual(template.language.natalLens.usedParagraphs, [1]);
  const saved = row(template.reading.id);
  assert.ok(!saved.language_meta.includes(template.language.natalLens.plan.lens.mechanism));
  h.reopen();
  assert.deepEqual((await h.app.getToday(h.records(), h.userA, "UTC")).language, template.language);
});
test("admin_quality_has_only_natal_ids_and_closed_codes", async (context) => {
  await prepare(context);
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  const quality = await h.app.readingQuality(h.records(), h.userA);
  const output = JSON.stringify(quality);
  assert.ok(output.includes("Published natal lens"));
  for (const secret of [
    today.language.natalLens.plan.lens.mechanism,
    "nl-moon",
    "Capricorn",
    "natal_lens_ct",
    "sampleEngines",
    "marginsDeg",
  ])
    assert.ok(!output.includes(secret), secret);
});
test("failed_natal_source_insert_removes_only_the_new_reading", async (context) => {
  await prepare(context);
  h.setFault({ matches: (sql) => /insert into "reading_sources"/i.test(sql) });
  await assert.rejects(h.app.getToday(h.records(), h.userA, "UTC"), /sources could not be saved/);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM daily_readings").get().n, 0);
  h.setFault(null);
  const reading = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.ok(reading.language.natalLens);
});
test("local_context_edits_leave_the_natal_provider_request_identical", async (context) => {
  await prepare(context);
  await h.app.getToday(h.records(), h.userA, "UTC");
  const request = structuredClone(h.gatewayRequests[0]);
  await h.app.setConsent(h.records(), h.userA, "USR-04", true);
  await h.app.setConsent(h.records(), h.userA, "WEL-01", true);
  await h.app.setConsent(h.records(), h.userA, "WEL-03", true);
  await h.app.saveCheckIn(h.records(), h.userA, "2026-10-11", 1, 2, "PRIVATE_NATAL_NOTE", 1, 5);
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.deepEqual(h.gatewayRequests.at(-1), request);
});

test("new_catalogue_and_legacy_rollback_preserve_the_exact_archived_lens", async (context) => {
  const { dek } = await prepare(context);
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  const original = await h.app.getToday(h.records(), h.userA, "UTC");
  const { NATAL_CANDIDATE_BUNDLE: DEFAULT_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const changed = structuredClone(DEFAULT_BUNDLE);
  changed.version = "natal-updated-1";
  changed.natalLenses.find(
    (r) => r.key === original.language.natalLens.plan.lens.ruleKey,
  ).mechanism =
    "Useful support can provide a workable distinction. A manageable task may distinguish agreement from taking on every part of an arrangement.";
  const inserted = await h
    .records()
    .from("content_releases")
    .insert({
      version: changed.version,
      bundle: changed,
      checksum: "synthetic-copy-identity",
      is_active: false,
    })
    .select("id")
    .single();
  await h.app.activateRelease(h.records(), h.userA, inserted.data.id);
  const updated = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.notEqual(updated.reading.id, original.reading.id);
  assert.notEqual(
    updated.language.natalLens.fact.statement,
    original.language.natalLens.fact.statement,
  );
  const legacy = structuredClone(DEFAULT_BUNDLE);
  legacy.version = "natal-rollback-1";
  legacy.schemaVersion = 2;
  delete legacy.natalLenses;
  const rollback = await h
    .records()
    .from("content_releases")
    .insert({
      version: legacy.version,
      bundle: legacy,
      checksum: "synthetic-prior-identity",
      is_active: false,
    })
    .select("id")
    .single();
  await h.app.activateRelease(h.records(), h.userA, rollback.data.id);
  const rolledBack = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(rolledBack.language.natalLens, null);
  assert.ok(!rolledBack.language.facts.some((f) => f.id === "N1"));
  const archived = row(original.reading.id);
  const revived = await h.app.readingLanguage(
    { ...archived, language_meta: JSON.parse(archived.language_meta) },
    dek,
  );
  assert.deepEqual(revived.natalLens, original.language.natalLens);
  assert.equal(h.gatewayRequests.length, 3);
});

test("screened_transited_sign_is_the_saved_lens_and_reopens_exactly", async (context) => {
  const { sun } = await prepare(context, { ownTarget: true });
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  const lens = today.language.natalLens.plan.lens;
  assert.equal(lens.ruleKey, `nl-sun-${String(Math.floor(sun / 30) + 1).padStart(2, "0")}`);
  assert.deepEqual(
    lens.evidence.map((e) => `${e.kind}:${e.body}`),
    ["sign:sun"],
  );
  const origins = today.provenance
    .filter((entry) => entry.label === "Published natal lens reference · N1")
    .map((entry) => entry.source_id)
    .sort();
  assert.deepEqual(origins, ["AST-05", "AST-20"]);
  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(cached.reading.id, today.reading.id);
  assert.deepEqual(cached.language.natalLens, today.language.natalLens);
  assert.equal(h.gatewayRequests.length, 1);
});
