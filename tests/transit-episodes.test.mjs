import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { analyticEpisode } from "./fixtures/transit-episodes/analytic.mjs";
let h, m;
before(async () => {
  h = await createRecordsHarness();
  m = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
});
after(async () => h?.close());
const resolve = (f) =>
  m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone);
test("all_roots_and_gaps_are_preserved_and_five_passes_are_not_forced_to_three", () => {
  for (const [count, index, chapter] of [
    [1, 1, "single"],
    [3, 1, "opening"],
    [3, 2, "return"],
    [3, 3, "closing"],
    [5, 3, "return"],
  ]) {
    const f = analyticEpisode({ count, index }),
      r = resolve(f);
    assert.equal(r.status, "qualified");
    assert.equal(r.evidence.passTotal, count);
    assert.equal(r.evidence.passIndex, index);
    assert.equal(r.evidence.chapter, chapter);
    assert.equal(r.evidence.scan.samples[1].windows.length, count);
    assert.equal(r.timingOverlay.phase, "exact");
  }
});
test("scan_edges_do_not_prove_total_and_missing_crossings_are_invalid", () => {
  for (const mutate of [
    (s) => (s.samples[1].components[0].leftClosureLegId = null),
    (s) => s.samples[1].contacts.splice(1, 1),
    (s) => (s.samples[1].contacts[0].targetTurn = 1),
    (s) => delete s.reference.speed,
    (s) => (s.source.returnedFlags = 260),
    (s) => (s.reference.at = "2026-12-18T12:00:00.000Z"),
    (s) => (s.request.targets[1].longitude += 0.01),
  ]) {
    const f = analyticEpisode();
    mutate(f.scan);
    assert.equal(resolve(f).status, "omitted");
  }
});
test("incomplete_tangent_and_source_disagreement_have_no_counts", () => {
  for (const [mutate, reason] of [
    [(s) => (s.samples[0].limit = "time_limit"), "incomplete_scan"],
    [
      (s) => {
        s.samples[0].components[0].complete = false;
        s.samples[0].components[0].reason = "ambiguous_station_contact";
      },
      "ambiguous_station_contact",
    ],
    [(s) => (s.reference.unwrappedLongitude += 5), "source_disagreement"],
  ]) {
    const f = analyticEpisode();
    mutate(f.scan);
    assert.deepEqual(resolve(f), { status: "omitted", reason });
  }
});
test("same_window_and_between_have_no_fake_nearest_ordinal", () => {
  const f = analyticEpisode({ amplitude: 2, station: true }),
    r = resolve(f);
  assert.equal(r.status, "qualified");
  assert.equal(r.evidence.chapter, "between");
  assert.equal(r.evidence.passIndex, null);
  assert.equal(r.timingOverlay.centralExactAt, null);
  assert.equal(r.evidence.scan.samples[1].windows.length, 1);
});
test("cycle_key_is_not_episode_identity_and_reversed_motion_works", () => {
  const a = resolve(analyticEpisode()),
    b = resolve(analyticEpisode({ longitude: 16 }));
  assert.notEqual(a.evidence.episodeIdentity, b.evidence.episodeIdentity);
  assert.equal(resolve(analyticEpisode({ firstRetrograde: true })).status, "qualified");
  assert.equal(
    resolve(analyticEpisode({ longitude: 359, aspect: "conjunction" })).status,
    "qualified",
  );
});
test("sampled_date_disagreement_retains_count_but_no_exact_today", () => {
  const f = analyticEpisode({ shifts: [-0.6, 0, 0.6] });
  f.scan.coverage.from = f.scan.samples[0].legs[0].start.at;
  f.scan.coverage.to = f.scan.samples[2].legs.at(-1).end.at;
  const r = resolve(f);
  assert.equal(r.status, "qualified");
  assert.equal(r.timingOverlay.qualifiedExactDay, null);
  assert.equal(r.timingOverlay.daysToExact, null);
  assert.equal(r.timingOverlay.phase, "uncertain");
});
test("sampled_ordinal_disagreement_omits_story", () => {
  const f = analyticEpisode({ birthDisagreement: true });
  f.scan.coverage.from = f.scan.samples[0].legs[0].start.at;
  f.scan.coverage.to = f.scan.samples[2].legs.at(-1).end.at;
  assert.deepEqual(resolve(f), { status: "omitted", reason: "birth_window_disagreement" });
});
test("birth_samples_share_the_same_planet_track_and_reference_speed", () => {
  for (const mutate of [
    (s) => (s.samples[0].legs[0].start.unwrappedLongitude += 0.01),
    (s) => (s.reference.speed = 0),
  ]) {
    const f = analyticEpisode();
    mutate(f.scan);
    assert.deepEqual(resolve(f), { status: "omitted", reason: "invalid_scan" });
  }
});
test("contradictory_root_reference_and_window_points_cannot_share_a_monotonic_leg", () => {
  for (const mutate of [
    (scan) => {
      for (const sample of scan.samples) {
        const c = sample.contacts[1];
        for (const p of [c, ...c.bracket])
          p.at = new Date(Date.parse(p.at) + 5 * 86400000).toISOString();
      }
    },
    (scan) => {
      scan.reference.unwrappedLongitude += 0.01;
    },
    (scan) => {
      for (const sample of scan.samples) {
        const e = sample.windows[1].ingress;
        for (const p of [e, ...e.bracket])
          p.at = new Date(Date.parse(p.at) + 20 * 86400000).toISOString();
      }
    },
  ]) {
    const fixture = analyticEpisode();
    mutate(fixture.scan);
    assert.equal(resolve(fixture).status, "omitted");
  }
});
