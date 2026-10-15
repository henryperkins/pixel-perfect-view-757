/** Fixed editorial scenarios. The consecutive lane is quiet voice variation, never astronomy proof. */
import { READING_EVAL_CASES } from "./reading-evaluation.fixtures.mjs";
import { DRAFT_FALLBACK_CASES } from "./reading-evaluation.draft.fixtures.mjs";
import type { SyntheticFixture } from "./reading-evaluation.fixtures.mjs";

export const EDITORIAL_SOURCE_CASE_IDS = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
  "quiet-threshold",
] as const;
export const EDITORIAL_SOURCE_FIXTURES: SyntheticFixture[] = EDITORIAL_SOURCE_CASE_IDS.map((id) => {
  const fixed = [...READING_EVAL_CASES, ...DRAFT_FALLBACK_CASES].find((item) => item.id === id);
  if (!fixed) throw Error("The reviewed editorial source fixture is unavailable.");
  return structuredClone(fixed);
});
const reviewed: SyntheticFixture[] = EDITORIAL_SOURCE_FIXTURES.map((fixed) => ({
  ...structuredClone(fixed),
  config: { ...fixed.config, tone: "warm", depth: "standard" },
}));
const quiet = reviewed[5]!;
export const EDITORIAL_EVAL_CASES: SyntheticFixture[] = [
  ...reviewed,
  ...["2026-10-12", "2026-10-13", "2026-10-14"].map((day) => ({
    ...structuredClone(quiet),
    id: `editorial-quiet-${day}`,
    description:
      "Consecutive quiet-day editorial variation; no selected contacts or model request.",
    cycles: [],
    config: { ...quiet.config, day },
  })),
];
