/** Five immutable synthetic context combinations reconstructed from the reviewed benchmark packet. */
import data from "./context-writing-benchmarks.json";
import { READING_EVAL_CASES, type SyntheticFixture } from "./reading-evaluation.fixtures.mjs";
import type { DailyContextBenchmark } from "./daily-context-candidate.server";

export interface ContextWritingBenchmark extends DailyContextBenchmark {
  contextMode: string;
  fixture: {
    baseId: string;
    baseSha256: string;
    cycleSelection: "primary-only" | "all";
    natalContext: boolean;
    transitContext: boolean;
  };
  config: SyntheticFixture["config"];
}
export const CONTEXT_WRITING_BENCHMARKS = data as unknown as Omit<typeof data, "cases"> & {
  cases: ContextWritingBenchmark[];
};
export const CONTEXT_SOURCE_FIXTURES = CONTEXT_WRITING_BENCHMARKS.cases.map((benchmark) => {
  const base = READING_EVAL_CASES.find((item) => item.id === benchmark.fixture.baseId);
  if (!base) throw Error("The reviewed context source fixture is unavailable.");
  return structuredClone(base);
});
export const CONTEXT_EVAL_CASES: SyntheticFixture[] = CONTEXT_WRITING_BENCHMARKS.cases.map(
  (benchmark, index) => {
    const fixed = structuredClone(CONTEXT_SOURCE_FIXTURES[index]!);
    fixed.id = benchmark.id;
    fixed.description = `Context writer benchmark: ${benchmark.contextMode}; fixed synthetic source facts only.`;
    fixed.config = structuredClone(benchmark.config);
    if (benchmark.fixture.cycleSelection === "primary-only")
      fixed.cycles = fixed.cycles.slice(0, 1);
    else if (benchmark.fixture.cycleSelection !== "all")
      throw Error("Unknown context cycle selection.");
    if (!benchmark.fixture.natalContext) delete fixed.natalWindowSamples;
    if (!benchmark.fixture.transitContext) {
      delete fixed.transitEpisodeScan;
      delete fixed.transitAnchor;
    }
    return fixed;
  },
);
