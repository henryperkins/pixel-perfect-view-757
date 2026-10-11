import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples } from "./helpers/natal-fixtures.mjs";
let h, chart, eph, reliability;
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  eph = h.ephemerisModule;
});
after(async () => h?.close());
async function assess(options = {}) {
  reliability ??= await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.ts");
  const samples = syntheticNatalSamples(chart, eph, options);
  return {
    samples,
    manifest: reliability.assessNatalReliability(
      samples,
      "synthetic-fingerprint",
      options.accuracy ?? "exact",
    ),
  };
}
test("sign_screen_uses_all_three_samples", async () => {
  for (const [lon, eligible] of [
    [0.999, false],
    [1, true],
    [29.001, false],
    [29, true],
  ]) {
    const { manifest } = await assess({ moon: [lon, 15, 15] });
    assert.equal(
      manifest.evidence.some((e) => e.kind === "sign" && e.body === "moon"),
      eligible,
    );
  }
  const { manifest } = await assess({ moon: [29, 31, 31] });
  assert.ok(!manifest.evidence.some((e) => e.kind === "sign" && e.body === "moon"));
});
test("house_requires_exact_service_placidus", async () => {
  for (const accuracy of ["exact", "near", "hour"]) {
    const { manifest } = await assess({ accuracy });
    assert.equal(
      manifest.evidence.some((e) => e.kind === "house"),
      accuracy === "exact",
    );
  }
  const { samples } = await assess();
  for (const s of samples) s.chart.sources.houses = "in-app";
  const mixed = reliability.assessNatalReliability(samples, "synthetic-fingerprint", "exact");
  assert.ok(mixed.evidence.some((e) => e.kind === "sign"));
  assert.ok(!mixed.evidence.some((e) => e.kind === "house"));
  for (const [margin, eligible] of [
    [0.499, false],
    [0.5, true],
  ]) {
    const { manifest } = await assess({ moon: [270 + margin, 270 + margin, 270 + margin] });
    assert.equal(
      manifest.evidence.some((e) => e.kind === "house" && e.body === "moon"),
      eligible,
    );
  }
});
test("raw_aspect_orb_not_display_rounding", async () => {
  const { manifest, samples } = await assess({ saturn: [168.004, 168.004, 168.004] });
  assert.equal(samples[1].chart.aspects.find((a) => a.a === "moon").orb, 3);
  assert.ok(manifest.evidence.find((e) => e.kind === "aspect").orbs.every((o) => o > 3));
  samples[1].ephemeris.aspects[0].orb = 1;
  assert.ok(
    !reliability
      .assessNatalReliability(samples, "synthetic-fingerprint", "exact")
      .evidence.some((e) => e.kind === "aspect"),
  );
});
test("mixed_source_preserves_only_qualified_items", async () => {
  const { samples } = await assess();
  samples[0].chart.sources.angles = "in-app";
  samples[1].ephemeris.aspects.push({ ...samples[1].ephemeris.aspects[0] });
  const manifest = reliability.assessNatalReliability(samples, "synthetic-fingerprint", "exact");
  assert.ok(manifest.evidence.some((e) => e.kind === "sign"));
  assert.ok(!manifest.evidence.some((e) => e.kind === "house" || e.kind === "aspect"));
  samples[2].ephemeris.degraded = true;
  assert.equal(
    reliability.assessNatalReliability(samples, "synthetic-fingerprint", "exact").status,
    "unavailable",
  );
});
test("manifest_readback_validates_geometry_identity_and_closed_shape", async () => {
  const { manifest } = await assess();
  reliability.validateNatalReliability(manifest, "synthetic-fingerprint", "exact");
  const tampered = structuredClone(manifest);
  tampered.evidence.find((e) => e.kind === "sign").marginsDeg[0] += 1;
  assert.throws(() =>
    reliability.validateNatalReliability(tampered, "synthetic-fingerprint", "exact"),
  );
  assert.throws(() => reliability.validateNatalReliability(manifest, "wrong-fingerprint", "exact"));
  assert.throws(() =>
    reliability.validateNatalReliability(manifest, "synthetic-fingerprint", "hour"),
  );
  assert.throws(() =>
    reliability.validateNatalReliability(
      { ...manifest, evidence: [...manifest.evidence, manifest.evidence[0]] },
      "synthetic-fingerprint",
      "exact",
    ),
  );
});
test("stored_offsets_engines_nonfinite_values_cusps_and_sources_fail_closed", async () => {
  const { manifest } = await assess();
  for (const mutate of [
    (m) => (m.sampleOffsetsMinutes[0] = -15),
    (m) => (m.sampleEngines[2] = "swiss-ephemeris@other"),
    (m) => (m.version = "unsupported"),
    (m) => (m.evidence.find((e) => e.kind === "sign").longitudes[0] = NaN),
    (m) =>
      (m.evidence.find((e) => e.kind === "house").cusps[0][1] = m.evidence.find(
        (e) => e.kind === "house",
      ).cusps[0][0]),
    (m) => (m.evidence.find((e) => e.kind === "house").angles[1].ascendant += 1),
    (m) => (m.evidence.find((e) => e.kind === "aspect").source = "in-app"),
    (m) => (m.evidence.find((e) => e.kind === "aspect").a = "node"),
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    assert.throws(() =>
      reliability.validateNatalReliability(changed, "synthetic-fingerprint", "exact"),
    );
  }
});
test("reversed_service_pairs_match_but_missing_lists_and_fill_ins_do_not", async () => {
  const { samples } = await assess();
  for (const sample of samples)
    [sample.ephemeris.aspects[0].a, sample.ephemeris.aspects[0].b] = [
      sample.ephemeris.aspects[0].b,
      sample.ephemeris.aspects[0].a,
    ];
  assert.ok(
    reliability
      .assessNatalReliability(samples, "synthetic-fingerprint", "exact")
      .evidence.some((e) => e.kind === "aspect"),
  );
  samples[0].chart.aspects.forEach((a) => (a.source = "in-app"));
  assert.ok(
    !reliability
      .assessNatalReliability(samples, "synthetic-fingerprint", "exact")
      .evidence.some((e) => e.kind === "aspect"),
  );
  delete samples[0].ephemeris.aspects;
  assert.ok(
    reliability
      .assessNatalReliability(samples, "synthetic-fingerprint", "exact")
      .evidence.some((e) => e.kind === "sign"),
  );
});
test("proofs_for_one_body_must_retain_the_same_sample_positions", async () => {
  const { manifest } = await assess();
  const sign = manifest.evidence.find((e) => e.kind === "sign" && e.body === "moon");
  sign.longitudes[0] = 284;
  sign.marginsDeg[0] = 14;
  assert.throws(
    () => reliability.validateNatalReliability(manifest, "synthetic-fingerprint", "exact"),
    /Inconsistent/,
  );
});
test("boundary_requests_are_bounded_and_concurrent_and_dst_offsets_are_elapsed_utc", async () => {
  const resolver = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.server.ts");
  const { samples } = await assess({ accuracy: "hour" });
  const pending = [];
  h.setSwiss((body, init) => new Promise((resolve) => pending.push({ body, init, resolve })));
  const promise = resolver.resolveNatalReliability(
    {
      utcISO: "2026-11-01T06:30:00Z",
      accuracy: "hour",
      latitude: 0,
      longitude: 0,
      timezone: "America/New_York",
    },
    "synthetic-fingerprint",
    samples[1].ephemeris,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pending.length, 2);
  assert.deepEqual(pending.map((p) => p.body.time).sort(), ["05:30:00", "07:30:00"]);
  assert.ok(pending.every((p) => p.body.timezoneOffset === 0 && p.init.signal));
  for (const p of pending)
    p.resolve(Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" }));
  assert.equal((await promise).status, "screened");
  h.setSwiss(null);
});
test("unknown_time_requests_no_boundaries", async () => {
  const resolver = await h.vite.ssrLoadModule("/src/lib/astro/natal-reliability.server.ts");
  const { samples } = await assess();
  const result = await resolver.resolveNatalReliability(
    {
      utcISO: "1990-01-01T12:00:00Z",
      accuracy: "unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
    },
    "synthetic-fingerprint",
    samples[1].ephemeris,
  );
  assert.equal(result.reason, "unknown_time");
});
