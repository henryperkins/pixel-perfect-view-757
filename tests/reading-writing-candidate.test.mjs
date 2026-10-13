import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, candidate, base, schema, assemble, facts, generate, compose, fixtures, reliability, transit;
before(async () => {
  h = await createRecordsHarness();
  ({ WRITING_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/writing-candidate-bundle.ts",
  ));
  ({ TRANSIT_CANDIDATE_BUNDLE: base } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
  schema = await h.vite.ssrLoadModule("/src/lib/content/schema.ts");
  ({ assembleReading: assemble } = await h.vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts: facts } = await h.vite.ssrLoadModule("/src/lib/ai/facts.ts"));
  ({ generateReadingProse: generate } = await h.vite.ssrLoadModule(
    "/src/lib/ai/language.server.ts",
  ));
  ({ composeDailyWritingTemplate: compose } = await h.vite.ssrLoadModule(
    "/src/lib/content/daily-writing-template.ts",
  ));
  fixtures = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.fixtures.mjs");
  ({ syntheticNatalReliability: reliability } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  ));
  transit = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.transit.ts");
});
after(async () => h?.close());
test("inactive writing catalogue gives every interpretation and positive direction an explicit source frame, preserving natal and story data", () => {
  schema.validateContentGraph(candidate);
  assert.equal(candidate.schemaVersion, 5);
  assert.equal(
    candidate.dailyWritingFrames.length,
    candidate.cycles.length +
      candidate.synthesisRules.filter((r) => r.relationship !== "independent").length,
  );
  assert.deepEqual(candidate.natalLenses, base.natalLenses);
  assert.deepEqual(candidate.transitChapters, base.transitChapters);
  assert.equal(base.dailyWritingFrames, undefined);
  assert.ok(
    candidate.synthesisRules
      .filter((r) => r.relationship === "independent")
      .every(
        (r) =>
          !candidate.dailyWritingFrames.some(
            (f) => f.source.kind === "synthesis" && f.source.key === r.key,
          ),
      ),
  );
});
test("every current synthetic plan has a valid complete deterministic writing fallback without provider or ephemeris access", async () => {
  for (const fixed of fixtures.READING_EVAL_CASES) {
    const context = {
      ...fixed.config,
      granted: new Set(fixed.config.granted),
      localBucket: null,
      checkIn: null,
      wellness: null,
    };
    const effective =
      fixed.writingFrameMode === "none" ? { ...candidate, dailyWritingFrames: [] } : candidate;
    let assembled = assemble(fixed.chart, fixed.cycles, context, effective, reliability(fixed));
    const calculation = transit.syntheticTransitCalculation(fixed, assembled.eligibleCycles[0]);
    if (calculation)
      assembled = assemble(
        fixed.chart,
        fixed.cycles,
        context,
        effective,
        reliability(fixed),
        calculation,
      );
    const result = await generate({
      facts: facts(fixed.chart, assembled, fixed.config.timeZone),
      hasEligibleCycles: assembled.eligibleCycles.length > 0,
      tone: fixed.config.tone,
      depth: fixed.config.depth,
      suppression: {
        angles: fixed.chart.uncertainty.angleClaimsSuppressed,
        houses: !fixed.chart.uncertainty.housesReliable,
      },
      fallback: {
        headline: assembled.headline,
        body: assembled.astroBody,
        prompt: assembled.prompt,
      },
      writing: {
        plan: assembled.writingPlan,
        template: assembled.writingTemplate,
        minimalTemplate: compose(
          assembled.writingPlan,
          assembled.natalLensPlan,
          assembled.transitStoryPlan,
          true,
        ),
        recent: [],
      },
    });
    assert.equal(result.meta.mode, "template", fixed.id);
    assert.notEqual(result.meta.writing.finalQuality.outcome, "reject", fixed.id);
    assert.notEqual(result.meta.writing.renderMode, "minimal", fixed.id);
    assert.equal((result.prompt.match(/\?/g) ?? []).length, 1, fixed.id);
    assert.ok(!/Taking this gently:|Observation:|Also in range:/.test(result.body), fixed.id);
  }
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.swissRequests.length, 0);
});
