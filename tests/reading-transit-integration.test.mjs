import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { analyticEpisode } from "./fixtures/transit-episodes/analytic.mjs";
import { syntheticNatalSamples, natalContext } from "./helpers/natal-fixtures.mjs";
let h, m, reading, facts, b, chart;
before(async () => {
  h = await createRecordsHarness();
  m = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
  reading = await h.vite.ssrLoadModule("/src/lib/reading.server.ts");
  facts = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts");
  b = (await h.vite.ssrLoadModule("/src/lib/content/transit-candidate-bundle.ts"))
    .TRANSIT_CANDIDATE_BUNDLE;
  chart = syntheticNatalSamples(
    await h.vite.ssrLoadModule("/src/lib/astro/chart.ts"),
    h.ephemerisModule,
  )[1].chart;
});
after(async () => h?.close());
test("story_does_not_rerank_primary_and_template_uses_selected_chapter", () => {
  const f = analyticEpisode(),
    cal = m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone),
    before = structuredClone(f.primary),
    a = reading.assembleReading(chart, [f.primary], natalContext, b, null, cal);
  assert.equal(a.transitStoryPlan.status, "selected");
  assert.deepEqual(
    a.eligibleCycles.map((cycle) => [cycle.cycle_key, cycle.importance]),
    [[before.cycle_key, before.importance]],
  );
  assert.deepEqual(f.primary, before);
  assert.equal(a.primary_cycle_key, before.cycle_key);
  assert.ok(
    a.astroBody.split("\n\n").slice(0, 2).join(" ").includes(a.transitStoryPlan.chronologySentence),
  );
  assert.ok(a.astroBody.includes(a.transitStoryPlan.copy.mechanism));
});
test("uncertain_root_has_no_exact_today_in_shared_primary_timing", () => {
  const f = analyticEpisode({ shifts: [-0.6, 0, 0.6] });
  f.scan.coverage.from = f.scan.samples[0].legs[0].start.at;
  f.scan.coverage.to = f.scan.samples[2].legs.at(-1).end.at;
  const cal = m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone),
    a = reading.assembleReading(chart, [f.primary], natalContext, b, null, cal);
  assert.equal(a.storyCalculation.timingOverlay.qualifiedExactDay, null);
  const c = facts.readingFacts(chart, a).find((f) => f.id === "C1");
  assert.equal(c.cycle.exactDate, null);
  assert.ok(!c.statement.includes("phase exact"));
  assert.ok(!a.editorial.timing.includes("exact today"));
});

test("qualified reference geometry replaces approximate primary orb and timing together", () => {
  const f = analyticEpisode({ index: 1 });
  const at = new Date(Date.parse(f.scan.reference.at) + 2 * 86400000).toISOString();
  // The fixture's direct cosine leg is two days past its central square.
  f.scan.reference = {
    at,
    unwrappedLongitude: 105 + 6 * Math.sin((Math.PI * 2) / 100),
    speed: ((6 * Math.PI) / 100) * Math.cos((Math.PI * 2) / 100),
  };
  f.scan.request.referenceAt = at;
  f.day = at.slice(0, 10);
  f.primary = { ...f.primary, orb: 0.02, exact_at: at };
  const original = structuredClone(f.primary);
  const cal = m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone);
  assert.equal(cal.status, "qualified");
  const a = reading.assembleReading(chart, [f.primary], natalContext, b, null, cal);
  const primary = a.eligibleCycles[0];
  assert.equal(primary.orb, 0.38);
  assert.equal(primary.phase, "separating");
  assert.equal(primary.exact_at, "2026-09-08T12:00:00.000Z");
  assert.equal(primary.days_to_exact, -2);
  assert.equal(primary.importance, original.importance);
  assert.deepEqual(f.primary, original, "selection input remains unchanged");
  const atoms = facts.readingFacts(chart, a);
  const c = atoms.find((fact) => fact.id === "C1");
  assert.equal(c.cycle.orb, 0.38);
  assert.equal(c.cycle.exactDate, "2026-09-08");
  assert.match(c.statement, /0\.38 degrees\. phase separating/);
  assert.match(
    atoms.find((fact) => fact.id === "E1").statement,
    /Primary.*geometry.*Swiss Ephemeris/,
  );
});
