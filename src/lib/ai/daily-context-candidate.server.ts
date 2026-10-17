/** Explicit synthetic-only benchmark preparation. Never called by the member reading route. */
import { createHash } from "node:crypto";
import { canonicalContentJson } from "../content/draft-comparison";
import { safetyPass } from "../content/default-bundle";
import { dailyQuestionProblem } from "../content/daily-reflection";
import { DAILY_WRITING_PLAN_VERSION, type DailyWritingPlan } from "../content/daily-writing";
import { selectDailyContextFacts } from "./daily-context-writing";
import type { FactAtom } from "./facts";
import type { DailyWritingParagraph } from "./daily-writing-quality";
import type { ReadingProseInput } from "./language.server";

export interface DailyContextBenchmark {
  id: string;
  sourceHash: string;
  selectedSources: FactAtom[];
  headline: string;
  reflection: string;
  paragraphs: DailyWritingParagraph[];
}

/** Source identity is exact; semantic support of authored wording still requires editorial review. */
export function prepareDailyContextCandidate(
  input: ReadingProseInput,
  benchmark: DailyContextBenchmark,
): ReadingProseInput {
  const facts = selectDailyContextFacts(input.facts);
  const ordered = (items: FactAtom[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));
  if (
    !benchmark ||
    typeof benchmark.id !== "string" ||
    !/^[a-z0-9][a-z0-9-]{0,99}$/.test(benchmark.id) ||
    !Array.isArray(benchmark.selectedSources) ||
    benchmark.sourceHash !==
      createHash("sha256").update(JSON.stringify(benchmark.selectedSources)).digest("hex") ||
    canonicalContentJson(ordered(facts)) !==
      canonicalContentJson(ordered(benchmark.selectedSources))
  )
    throw Error("Candidate benchmark source graph differs from the selected facts.");
  if (
    typeof benchmark.headline !== "string" ||
    benchmark.headline !== benchmark.headline.trim() ||
    benchmark.headline.length > 140 ||
    benchmark.headline.split(/\s+/).length < 3 ||
    benchmark.headline.split(/\s+/).length > 9 ||
    /[\r\n?]/.test(benchmark.headline) ||
    safetyPass(benchmark.headline).flagged.length ||
    dailyQuestionProblem(benchmark.reflection) ||
    !Array.isArray(benchmark.paragraphs) ||
    benchmark.paragraphs.length < 2 ||
    benchmark.paragraphs.length > 4 ||
    benchmark.paragraphs.some((p) => !p || !Array.isArray(p.scenes) || p.scenes.length !== 0)
  )
    throw Error("Candidate benchmark headline, reflection or authored paragraph shape is invalid.");
  const primary = facts.find((fact) => fact.id === "I1")!;
  const synthesis = facts.find((fact) => fact.id === "S1");
  const plan: DailyWritingPlan = {
    version: DAILY_WRITING_PLAN_VERSION,
    releaseVersion: primary.releaseVersion!,
    theme: {
      factId: synthesis ? "S1" : "I1",
      sourceKey: (synthesis ?? primary).sourceKey!,
      relationship: synthesis
        ? synthesis.statement.startsWith("Published tension synthesis ")
          ? "tension"
          : "reinforcement"
        : null,
      requiredFacts: synthesis ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"],
    },
    status: "no_frame",
    frame: null,
    scenes: [],
    templateSources: [],
  };
  const template = {
    paragraphs: structuredClone(benchmark.paragraphs),
    renderMode: "unframed" as const,
    reason: null,
  };
  return {
    facts,
    hasEligibleCycles: input.hasEligibleCycles,
    tone: input.tone,
    depth: input.depth,
    suppression: { angles: input.suppression.angles, houses: input.suppression.houses },
    fallback: {
      headline: benchmark.headline,
      body: template.paragraphs.map((p) => p.text).join("\n\n"),
      prompt: benchmark.reflection,
    },
    writing: {
      plan,
      template,
      minimalTemplate: structuredClone(template),
      recent: input.writing?.recent ?? [],
    },
  };
}
