import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples } from "./helpers/natal-fixtures.mjs";
let h, chart;
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
});
beforeEach(() => h.reset());
after(async () => h?.close());
const details = {
  birthDate: "1990-01-01",
  birthTime: "12:00",
  placeLabel: "Private place",
  latitude: 30,
  longitude: 0,
};
test("birth_window_calls_are_shared_and_anchors_encrypted", async () => {
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  h.setSwiss(() =>
    Response.json({
      positions: samples[1].ephemeris.positions,
      version: "synthetic-1",
      positionSource: {
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-1",
        dataId: "synthetic",
        frame: "tropical-apparent-geocentric-true-equinox-of-date",
        timeScale: "UT",
        returnedFlags: 258,
      },
    }),
  );
  await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  assert.equal(h.swissRequests.length, 3);
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA),
    dek = await h.app.getDek(h.records(), h.userA);
  assert.equal(typeof snapshot.houses.transitAnchors_ct, "string");
  assert.equal((await h.app.loadTransitAnchors(snapshot, dek)).status, "screened");
  assert.ok(!JSON.stringify(snapshot.houses).includes("sampleOffsetsMinutes"));
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 3);
  await assert.rejects(
    h.app.loadTransitAnchors(snapshot, await h.app.getDek(h.records(), h.userB)),
    /could not be loaded/,
  );
  await assert.rejects(
    h.app.loadTransitAnchors(
      { ...snapshot, houses: { ...snapshot.houses, transitAnchors_ct: "broken" } },
      dek,
    ),
    /could not be loaded/,
  );
});
test("unknown_or_legacy_birth_has_no_qualified_anchors", async () => {
  const { dek } = await h.seedChart(h.records());
  assert.equal(
    await h.app.loadTransitAnchors(await h.app.loadSnapshot(h.records(), h.userA), dek),
    null,
  );
  await h.app.saveBirth(h.records(), h.userA, details, "unknown", "UTC");
  assert.equal(
    (await h.app.loadTransitAnchors(await h.app.loadSnapshot(h.records(), h.userA), dek)).reason,
    "unknown_time",
  );
  assert.equal(h.swissRequests.length, 0);
});
test("legacy_defaulted_house_system_does_not_qualify_angle_anchors", async () => {
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  const source = {
    engine: "swiss-ephemeris",
    engineVersion: "synthetic-1",
    dataId: "synthetic",
    frame: "tropical-apparent-geocentric-true-equinox-of-date",
    timeScale: "UT",
    returnedFlags: 258,
  };
  for (const explicit of [false, true]) {
    h.setSwiss(() =>
      Response.json({
        positions: samples[1].ephemeris.positions,
        version: "synthetic-1",
        positionSource: source,
        houses: {
          ...(explicit ? { system: "P" } : {}),
          cusps: samples[1].ephemeris.houses.cusps,
          ascendant: 120,
          mc: 30,
        },
      }),
    );
    await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
    const a = await h.app.loadTransitAnchors(
      await h.app.loadSnapshot(h.records(), h.userA),
      await h.app.getDek(h.records(), h.userA),
    );
    assert.equal(
      a.anchors.some((a) => a.target === "ascendant"),
      explicit,
    );
  }
});
