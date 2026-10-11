import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  activateNatalCandidate,
  natalReadingResponse,
  syntheticNatalSamples,
} from "./helpers/natal-fixtures.mjs";
let h, chart, reliability;
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  reliability = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
});
beforeEach(async () => h.reset());
after(async () => h?.close());
const details = {
  birthDate: "1990-01-01",
  birthTime: "12:00",
  placeLabel: "Private origin",
  latitude: 30,
  longitude: 0,
};
test("birth_save_encrypts_reliability_manifest_and_today_never_resamples_birth", async () => {
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  h.setSwiss(() =>
    Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" }),
  );
  await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  assert.equal(h.swissRequests.length, 3);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(typeof snapshot.houses.natalReliability_ct, "string");
  assert.ok(!JSON.stringify(snapshot.houses).includes('"evidence"'));
  const dek = await h.app.getDek(h.records(), h.userA);
  assert.equal((await h.app.loadNatalReliability(snapshot, dek)).status, "screened");
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 3);
});
test("legacy_snapshot_has_no_lens_manifest", async () => {
  const { dek } = await h.seedChart(h.records());
  assert.equal(
    await h.app.loadNatalReliability(await h.app.loadSnapshot(h.records(), h.userA), dek),
    null,
  );
});
test("manifest_mismatch_or_corruption_fails_read", async () => {
  const { dek } = await h.seedChart(h.records());
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  for (const value of [
    "broken",
    await h.cryptoModule.encryptJson(
      dek,
      reliability.assessNatalReliability(
        syntheticNatalSamples(chart, h.ephemerisModule),
        "wrong-fingerprint",
        "exact",
      ),
    ),
  ]) {
    const tampered = { ...snapshot, houses: { ...snapshot.houses, natalReliability_ct: value } };
    await assert.rejects(h.app.loadNatalReliability(tampered, dek), /could not be loaded/);
  }
  await h
    .records()
    .from("chart_snapshots")
    .update({ houses: { ...snapshot.houses, natalReliability_ct: "broken" } })
    .eq("id", snapshot.id);
  await assert.rejects(
    h.app.getToday(h.records(), h.userA, "UTC"),
    /assessment could not be loaded/,
  );
  assert.equal(h.gatewayRequests.length, 0);
});
test("service_failure_preserves_central_chart_and_repeated_save_upgrades_same_snapshot", async () => {
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  let calls = 0;
  h.setSwiss(() =>
    ++calls === 1
      ? Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" })
      : new Response(null, { status: 503 }),
  );
  const saved = await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  const dek = await h.app.getDek(h.records(), h.userA);
  let snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(snapshot.houses.ephemeris.degraded, false);
  assert.equal((await h.app.loadNatalReliability(snapshot, dek)).reason, "service_unavailable");
  h.setSwiss(() =>
    Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" }),
  );
  const upgraded = await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  assert.equal(upgraded.snapshotId, saved.snapshotId);
  snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal((await h.app.loadNatalReliability(snapshot, dek)).status, "screened");
});

async function savedLegacyBirth(accuracy = "exact") {
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  h.setSwiss(() =>
    Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" }),
  );
  await h.app.saveBirth(h.records(), h.userA, details, accuracy, "UTC");
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  const houses = { ...snapshot.houses };
  delete houses.natalReliability_ct;
  delete houses.natalReliabilityCheckedAt;
  await h.records().from("chart_snapshots").update({ houses }).eq("id", snapshot.id);
  h.setGateway(natalReadingResponse);
  return samples;
}
const savedMeta = (id) =>
  JSON.parse(
    h.sqlite.prepare("SELECT language_meta FROM daily_readings WHERE id=?").get(id).language_meta,
  );
const audits = (kind) =>
  h.sqlite.prepare("SELECT count(*) AS n FROM audit_events WHERE kind=?").get(kind).n;

test("today_rescreens_a_legacy_snapshot_once_when_a_catalogue_is_active", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  await savedLegacyBirth();
  await activateNatalCandidate(h);
  assert.equal(h.swissRequests.length, 3);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 6);
  assert.equal(audits("chart.rescreened"), 1);
  const dek = await h.app.getDek(h.records(), h.userA);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal((await h.app.loadNatalReliability(snapshot, dek)).status, "screened");
  // The day's reading was assembled after the upgrade, not before it.
  assert.equal(savedMeta(first.reading.id).natalLensPlan.reliabilityVersion, "natal-reliability-1");
  const again = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(again.reading.id, first.reading.id);
  assert.equal(h.swissRequests.length, 6);
});

test("inactive_catalogue_keeps_today_free_of_swiss_traffic", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  await savedLegacyBirth();
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 3);
  const dek = await h.app.getDek(h.records(), h.userA);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(await h.app.loadNatalReliability(snapshot, dek), null);
  assert.equal(audits("chart.rescreened"), 0);
});

test("retryable_screen_failure_waits_for_backoff_then_upgrades", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T08:00:00Z") });
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  let calls = 0;
  h.setSwiss(() =>
    ++calls === 1
      ? Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" })
      : new Response(null, { status: 503 }),
  );
  await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  await activateNatalCandidate(h);
  h.setGateway(natalReadingResponse);
  h.setSwiss(() =>
    Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" }),
  );
  const dek = await h.app.getDek(h.records(), h.userA);
  const before = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 3);
  assert.equal(
    (await h.app.loadNatalReliability(await h.app.loadSnapshot(h.records(), h.userA), dek)).reason,
    "service_unavailable",
  );
  context.mock.timers.setTime(Date.parse("2026-10-11T14:01:00Z"));
  const after = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 6);
  assert.notEqual(after.reading.id, before.reading.id);
  assert.equal(
    (await h.app.loadNatalReliability(await h.app.loadSnapshot(h.records(), h.userA), dek)).status,
    "screened",
  );
});

test("unknown_time_is_never_rescreened", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  await savedLegacyBirth("unknown");
  await activateNatalCandidate(h);
  assert.equal(h.swissRequests.length, 1);
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 1);
});

test("stale_reliability_version_supplies_no_lens_and_is_rescreened", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const samples = await savedLegacyBirth();
  const dek = await h.app.getDek(h.records(), h.userA);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  const stale = {
    ...reliability.assessNatalReliability(samples, snapshot.fingerprint, "exact"),
    version: "natal-reliability-0",
  };
  const houses = {
    ...snapshot.houses,
    natalReliability_ct: await h.cryptoModule.encryptJson(dek, stale),
    natalReliabilityCheckedAt: "2026-01-01T00:00:00.000Z",
  };
  await h.records().from("chart_snapshots").update({ houses }).eq("id", snapshot.id);
  const tampered = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(await h.app.loadNatalReliability(tampered, dek), null);
  await activateNatalCandidate(h);
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 6);
  assert.equal(
    (await h.app.loadNatalReliability(await h.app.loadSnapshot(h.records(), h.userA), dek)).version,
    "natal-reliability-1",
  );
});

test("failed_rescreen_records_the_attempt_without_changing_reading_identity", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  await savedLegacyBirth();
  await activateNatalCandidate(h);
  h.setSwiss(() => new Response(null, { status: 503 }));
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  // Only the central request is made when the service is down.
  assert.equal(h.swissRequests.length, 4);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(snapshot.houses.natalReliabilityCheckedAt, "2026-10-11T12:00:00.000Z");
  assert.equal(snapshot.houses.natalReliability_ct, undefined);
  assert.equal(snapshot.houses.ephemeris.degraded, false);
  const again = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(again.reading.id, first.reading.id);
  assert.equal(h.swissRequests.length, 4);
  assert.equal(audits("chart.rescreened"), 0);
});
