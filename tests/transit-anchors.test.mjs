import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples } from "./helpers/natal-fixtures.mjs";
let h, mod, chart;
const source = {
  engine: "swiss-ephemeris",
  engineVersion: "synthetic-1",
  dataId: "synthetic-no-real-swiss",
  frame: "tropical-apparent-geocentric-true-equinox-of-date",
  timeScale: "UT",
  returnedFlags: 258,
};
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  mod = await h.vite.ssrLoadModule("/src/lib/astro/transit-anchors.ts");
});
after(async () => h?.close());
const samples = (options = {}) =>
  syntheticNatalSamples(chart, h.ephemerisModule, options).map((s) => ({
    ...s,
    ephemeris: { ...s.ephemeris, positionSource: { ...source } },
  }));
test("anchors_require_explicit_service_frame", () => {
  const s = samples();
  assert.equal(mod.assessTransitAnchors(s, "fp", "exact").status, "screened");
  for (const change of [
    undefined,
    { ...source, frame: "J2000" },
    { ...source, returnedFlags: 260 },
    { ...source, returnedFlags: 2 },
  ]) {
    const bad = structuredClone(s);
    bad[0].ephemeris.positionSource = change;
    assert.equal(mod.assessTransitAnchors(bad, "fp", "exact").reason, "unqualified_source");
  }
});
test("birth_bands_and_cusp_crossing_are_independent_of_sign_lenses", () => {
  for (const [accuracy, offsets, count] of [
    ["exact", [-2, 0, 2], 9],
    ["near", [-15, 0, 15], 7],
    ["hour", [-60, 0, 60], 7],
  ]) {
    const result = mod.assessTransitAnchors(
      samples({ accuracy, sun: [29.99, 30, 30.01] }),
      "fp",
      accuracy,
    );
    assert.equal(result.status, "screened");
    assert.deepEqual(result.sampleOffsetsMinutes, offsets);
    assert.equal(result.anchors.length, count);
    assert.deepEqual(result.anchors.find((a) => a.target === "sun").longitudes, [29.99, 30, 30.01]);
    assert.deepEqual(mod.validateTransitAnchors(result, "fp", accuracy), result);
  }
});
test("unknown_or_legacy_birth_omits_story", () => {
  assert.equal(mod.assessTransitAnchors([], "fp", "unknown").reason, "unknown_time");
  assert.equal(
    mod.assessTransitAnchors(syntheticNatalSamples(chart, h.ephemerisModule), "fp", "exact").reason,
    "unqualified_source",
  );
});
test("invalid_and_mixed_origin_points_do_not_qualify", () => {
  const s = samples();
  s[0].chart.sources.angles = "in-app";
  s[0].ephemeris.positions.sun.lon = NaN;
  const r = mod.assessTransitAnchors(s, "fp", "exact");
  assert.equal(r.status, "screened");
  assert.ok(!r.anchors.some((a) => ["sun", "ascendant", "midheaven"].includes(a.target)));
  assert.throws(() => mod.validateTransitAnchors(r, "other", "exact"));
  for (const mutate of [
    (r) => r.anchors.push(r.anchors[0]),
    (r) => (r.sampleOffsetsMinutes[0] = -3),
    (r) => (r.anchors[0].longitudes[0] = 360),
    (r) => (r.sources[0].dataId = "other"),
  ]) {
    const bad = structuredClone(r);
    mutate(bad);
    assert.throws(() => mod.validateTransitAnchors(bad, "fp", "exact"));
  }
});
