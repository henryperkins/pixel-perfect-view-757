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
  assert.deepEqual(a.eligibleCycles, [before]);
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
