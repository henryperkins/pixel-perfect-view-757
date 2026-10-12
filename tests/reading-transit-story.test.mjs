import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { analyticEpisode } from "./fixtures/transit-episodes/analytic.mjs";
let h, b, m, s, plan;
before(async () => {
  h = await createRecordsHarness();
  b = (await h.vite.ssrLoadModule("/src/lib/content/transit-candidate-bundle.ts"))
    .TRANSIT_CANDIDATE_BUNDLE;
  m = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
  s = await h.vite.ssrLoadModule("/src/lib/content/transit-story.ts");
  plan = await h.vite.ssrLoadModule("/src/lib/content/synthesis.ts");
});
after(async () => h?.close());
function run(f, bundle = b) {
  return s.resolveDailyTransitStory(
    bundle,
    f.primary,
    plan.resolveInterpretationPlan(bundle, [f.primary]).interpretations[0],
    m.resolveDailyTransitCalculation(f.scan, f.anchor, f.primary, f.day, f.timezone),
  );
}
test("chapter_selection_uses_complete_count_and_reviewed_copy", () => {
  for (const [count, index, chapter] of [
    [1, 1, "single"],
    [3, 1, "opening"],
    [3, 2, "return"],
    [3, 3, "closing"],
    [5, 3, "return"],
  ]) {
    const r = run(analyticEpisode({ count, index }));
    assert.equal(r.status, "selected");
    assert.equal(r.chapter, chapter);
    assert.equal(r.passTotal, count);
    assert.ok(r.chronologySentence.length <= 180);
    assert.equal(r.copy.mechanism, b.transitChapters.find((c) => c.chapter === chapter).mechanism);
  }
});
test("active_miss_never_falls_back_to_builtin_story", () => {
  assert.equal(run(analyticEpisode(), { ...b, transitChapters: [] }).reason, "no_catalogue");
});
