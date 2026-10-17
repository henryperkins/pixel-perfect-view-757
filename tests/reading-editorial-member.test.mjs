import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";

// Real member assembly, SQL, encryption and archive reload in an isolated
// database. Provider replies and birth inputs are synthetic, never live proof.
let h, candidate, baseline, language;
const now = new Date("2026-10-17T12:00:00.000Z");
before(async () => {
  h = await createRecordsHarness();
  const source = await h.vite.ssrLoadModule("/src/lib/content/editorial-candidate-bundle.ts");
  candidate = { ...structuredClone(source.EDITORIAL_CANDIDATE_BUNDLE), version: "0.9.0" };
  const data = await h.vite.ssrLoadModule("/src/lib/content/editorial-candidate-data.json");
  baseline = data.default.baseline.value;
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => h?.close());
beforeEach(async (context) => {
  await h.reset();
  context.mock.timers.enable({ apis: ["Date"], now });
});

async function activate(bundle) {
  await h.records().from("content_releases").update({ is_active: false }).eq("is_active", true);
  const saved = await h
    .records()
    .from("content_releases")
    .insert({
      version: bundle.version,
      bundle,
      checksum: `isolated-member-${bundle.version}`,
      is_active: true,
    });
  assert.equal(saved.error, null);
}

async function preferences(tone = "warm", depth = "standard") {
  await h.app.updatePrefs(h.records(), h.userA, "Synthetic member", tone, depth);
  await h.app.setConsent(h.records(), h.userA, "USR-01", true);
  await h.app.setConsent(h.records(), h.userA, "USR-02", true);
}

async function birth() {
  // This date selects Jupiter trine Sun on the fixed test day with a wide
  // ranking margin. Unknown time legitimately omits natal/story context.
  await h.app.saveBirth(
    h.records(),
    h.userA,
    {
      birthDate: "1980-04-11",
      birthTime: "12:00",
      placeLabel: "Synthetic member fixture",
      latitude: 0,
      longitude: 0,
    },
    "unknown",
    "UTC",
  );
}

const today = () => h.app.getToday(h.records(), h.userA, "UTC");
const rowFor = (id) => h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(id);
const frame = () =>
  candidate.dailyEditorial.frames.find((entry) => entry.cycleKeys[0] === "jupiter_trine_sun");
function forbidEditorialProviderCalls() {
  const unexpected = () => {
    throw Error("The reviewed authored release must not request a provider");
  };
  h.setGateway(unexpected);
  h.setGeminiEnterprise(unexpected);
}

test("eligible member authored prose is encrypted, saved and reopened without any provider request", async () => {
  await activate(candidate);
  await preferences();
  await birth();
  forbidEditorialProviderCalls();
  const first = await today();
  assert.equal(first.reading.primary_cycle_key, "jupiter_trine_sun");
  assert.equal(first.reading.release_version, "0.9.0");
  assert.equal(first.language.mode, "template");
  assert.equal(first.language.model, null);
  assert.equal(first.language.dailyWriting.status, "saved");
  assert.equal(first.language.dailyWriting.evidence.plan.editorial.entry.key, frame().key);
  assert.equal(first.reading.prompt, frame().reflection);
  assert.equal(first.reading.headline, frame().headline);
  assert.ok(first.reading.body.startsWith(frame().fallbackParagraphs.join("\n\n")));
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  const saved = rowFor(first.reading.id);
  const meta = JSON.parse(saved.language_meta);
  assert.equal(meta.diagnostics.promptVersion, "daily-editorial-body-2");
  assert.equal(meta.diagnostics.code, "authored_editorial");
  assert.equal(meta.diagnostics.outcome, "skipped");
  assert.equal(meta.diagnostics.attempted, false);
  assert.equal(meta.diagnostics.durationMs, null);
  assert.equal(first.language.dailyWriting.evidence.candidateQuality.outcome, "not_evaluated");
  assert.equal(first.language.dailyWriting.evidence.finalQuality.outcome, "pass");
  assert.deepEqual(
    first.reading.paragraphs.slice(0, meta.astroParagraphCount),
    frame().fallbackParagraphs,
  );
  const dek = await h.app.getDek(h.records(), h.userA);
  assert.equal(saved.prompt, null);
  assert.equal(await h.cryptoModule.decryptField(dek, saved.body_ct), first.reading.body);
  assert.deepEqual(
    await h.cryptoModule.decryptJson(dek, meta.daily_writing_ct),
    first.language.dailyWriting.evidence,
  );
  assert.ok(!saved.language_meta.includes(frame().reflection));
  assert.ok(!saved.language_meta.includes(frame().fallbackParagraphs[0]));
  assert.match(meta.dailyEditorialDigest, /^[a-f0-9]{64}$/);
  assert.ok(first.provenance.some((source) => source.detail.factId === "I1"));

  h.reopen();
  const cached = await today();
  assert.deepEqual(cached.reading, first.reading);
  assert.deepEqual(cached.language, first.language);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  const archived = exported.readings.find((reading) => reading.id === first.reading.id);
  assert.equal(archived.body, first.reading.body);
  assert.deepEqual(archived.language.dailyWriting, first.language.dailyWriting);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings").get().n, 1);
});

test("quiet editorial readings retain encrypted reflection and reload without requesting a model", async () => {
  await activate(candidate);
  await preferences();
  await h.seedChart(h.records(), h.userA, { accuracy: "unknown", positions: {} });
  h.setGateway(() => {
    throw Error("A quiet reading must never request a model");
  });
  const first = await today();
  assert.equal(first.reading.primary_cycle_key, null);
  assert.equal(first.language.mode, "template");
  const selected = first.language.dailyWriting.evidence.plan.editorial;
  assert.equal(selected.mode, "quiet");
  assert.equal(first.reading.prompt, selected.entry.reflection);
  assert.ok(first.reading.body.startsWith(selected.entry.fallbackParagraphs.join("\n\n")));
  const saved = rowFor(first.reading.id);
  assert.equal(saved.prompt, null);
  assert.equal(typeof JSON.parse(saved.language_meta).daily_writing_ct, "string");
  assert.equal(JSON.parse(saved.language_meta).diagnostics.code, "authored_editorial");
  h.reopen();
  assert.deepEqual((await today()).reading, first.reading);
  assert.equal(h.gatewayRequests.length, 0);
});

for (const [tone, depth] of [
  ["plain", "standard"],
  ["warm", "technical"],
]) {
  test(`${tone}/${depth} member settings retain the existing writer and survive reload`, async () => {
    await activate(candidate);
    await preferences(tone, depth);
    await birth();
    h.setGateway(() => new Response(null, { status: 503 }));
    const first = await today();
    assert.equal(first.reading.primary_cycle_key, "jupiter_trine_sun");
    assert.equal(first.language.mode, "template");
    assert.equal(
      JSON.parse(rowFor(first.reading.id).language_meta).diagnostics.promptVersion,
      language.DAILY_PROMPT_VERSION,
    );
    assert.equal(first.language.dailyWriting, undefined);
    assert.equal(
      JSON.parse(rowFor(first.reading.id).language_meta).dailyEditorialDigest,
      undefined,
    );
    h.reopen();
    assert.deepEqual((await today()).reading, first.reading);
    assert.equal(h.gatewayRequests.length, 1);
  });
}

test("warm member readings with selected natal and transit context save and reopen using the existing writer", async () => {
  await seedTransitReading(h, { natal: true });
  await activate(candidate);
  await preferences();
  h.setGateway(() => new Response(null, { status: 503 }));
  const first = await today();
  assert.equal(first.language.mode, "template");
  assert.equal(first.language.dailyWriting, undefined);
  assert.ok(first.language.natalLens);
  assert.equal(first.language.transitStory.plan.status, "selected");
  assert.ok(first.language.facts.some((fact) => fact.id === "N1"));
  assert.ok(first.language.facts.some((fact) => fact.id === "A1"));
  assert.ok(first.language.facts.some((fact) => fact.id === "P2"));
  const meta = JSON.parse(rowFor(first.reading.id).language_meta);
  assert.equal(typeof meta.natal_lens_ct, "string");
  assert.equal(typeof meta.transit_story_ct, "string");
  assert.equal(meta.dailyEditorialDigest, undefined);
  h.reopen();
  const cached = await today();
  assert.deepEqual(cached.reading, first.reading);
  assert.deepEqual(cached.language, first.language);
  assert.equal(h.episodeRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 1);
});

test("activating the numeric release creates a new same-day cache entry while preserving the old reading", async () => {
  await activate(baseline);
  await preferences();
  await birth();
  const old = await today();
  assert.equal(old.reading.release_version, "0.7.1");
  const preserved = rowFor(old.reading.id);
  await activate(candidate);
  forbidEditorialProviderCalls();
  const current = await today();
  assert.notEqual(current.reading.id, old.reading.id);
  assert.equal(current.reading.release_version, "0.9.0");
  assert.equal(current.language.mode, "template");
  assert.equal(
    JSON.parse(rowFor(current.reading.id).language_meta).diagnostics.code,
    "authored_editorial",
  );
  assert.equal((await today()).reading.id, current.reading.id);
  assert.deepEqual(rowFor(old.reading.id), preserved);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings").get().n, 2);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});
