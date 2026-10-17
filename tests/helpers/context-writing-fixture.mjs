import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { READING_EVAL_CASES } from "../../src/lib/ai/reading-evaluation.fixtures.mjs";

export const contextBenchmarkPath = new URL(
  "../../docs/reviews/daily-reading-context-writer/2026-10-17/benchmark-drafts.json",
  import.meta.url,
);
export const readContextBenchmarks = async () =>
  JSON.parse(await readFile(contextBenchmarkPath, "utf8"));

/** Rebuild the recorded synthetic selection through real app resolvers, never the saved source list. */
export async function contextWritingFixture(harness, benchmark, overrides = {}) {
  const { assembleReading } = await harness.vite.ssrLoadModule("/src/lib/reading.server.ts");
  const { readingFacts } = await harness.vite.ssrLoadModule("/src/lib/ai/facts.ts");
  const { syntheticNatalReliability } = await harness.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.natal.ts",
  );
  const { syntheticTransitCalculation } = await harness.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.transit.ts",
  );
  const base = READING_EVAL_CASES.find((item) => item.id === benchmark.fixture.baseId);
  assert.ok(base, "benchmark requires its checked-in synthetic fixture");
  assert.equal(
    createHash("sha256").update(JSON.stringify(base)).digest("hex"),
    benchmark.fixture.baseSha256,
  );
  const bundle = JSON.parse(
    await readFile(
      new URL("../../docs/reviews/daily-reading-release/2026-10-17/bundle.json", import.meta.url),
      "utf8",
    ),
  );
  const fixed = structuredClone(base);
  if (benchmark.fixture.cycleSelection === "primary-only") fixed.cycles = fixed.cycles.slice(0, 1);
  else assert.equal(benchmark.fixture.cycleSelection, "all");
  const config = { ...benchmark.config, ...overrides };
  const ctx = {
    ...config,
    granted: new Set(config.granted),
    localBucket: null,
    checkIn: null,
    wellness: null,
  };
  const reliability = benchmark.fixture.natalContext ? syntheticNatalReliability(fixed) : null;
  const first = assembleReading(fixed.chart, fixed.cycles, ctx, bundle, reliability);
  const calculation = benchmark.fixture.transitContext
    ? syntheticTransitCalculation(fixed, first.eligibleCycles[0])
    : null;
  const assembled = assembleReading(
    fixed.chart,
    fixed.cycles,
    ctx,
    bundle,
    reliability,
    calculation,
  );
  const facts = readingFacts(fixed.chart, assembled, config.timeZone);
  return {
    assembled,
    facts,
    bundle,
    fixed,
    config,
    input: {
      facts,
      hasEligibleCycles: assembled.eligibleCycles.length > 0,
      tone: config.tone,
      depth: config.depth,
      suppression: {
        angles: fixed.chart.uncertainty.angleClaimsSuppressed,
        houses: !fixed.chart.uncertainty.housesReliable,
      },
      fallback: {
        headline: assembled.headline,
        body: assembled.astroBody,
        prompt: assembled.astroPrompt,
      },
    },
  };
}
