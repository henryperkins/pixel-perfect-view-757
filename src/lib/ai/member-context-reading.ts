/** Bounded member projection. Source review authorizes meanings, never fixture measurements. */
import { safetyPass } from "../content/default-bundle";
import { dailyQuestionProblem } from "../content/daily-reflection";
import {
  completeDailySentences,
  DAILY_WRITING_PLAN_VERSION,
  type DailyWritingPlan,
} from "../content/daily-writing";
import {
  CONTEXT_DAILY_MATERIAL_VERSION,
  selectDailyContextFacts,
  toDailyContextBrief,
} from "./daily-context-writing";
import runtimeFallbacks from "./member-context-readings.json";
import type { FactAtom } from "./facts";
import type { ReadingProseInput } from "./language.server";

export const MEMBER_CONTEXT_READING_VERSION = "daily-member-context-1" as const;
export const MEMBER_CONTEXT_FALLBACK_VERSION = "daily-member-context-fallbacks-1" as const;
export type MemberContextMode =
  | "contact-only"
  | "natal-only"
  | "transit-only"
  | "natal-and-transit"
  | "synthesis-natal-and-transit";

const GRAPHS: Record<MemberContextMode, string> = {
  "contact-only": "C1,I1",
  "natal-only": "C1,I1,N1",
  "transit-only": "A1,C1,I1,P2",
  "natal-and-transit": "A1,C1,I1,N1,P2",
  "synthesis-natal-and-transit": "A1,C1,C2,I1,I2,N1,P2,S1",
};
const CHRONOLOGY = "{{A1_CHRONOLOGY}}";

function contact(fact: FactAtom | undefined, body: string, aspect: string, point: string) {
  return (
    fact?.kind === "calculation" &&
    fact.cycle?.transitBody === body &&
    fact.cycle.aspect === aspect &&
    fact.cycle.natalPoint === point &&
    Number.isFinite(fact.cycle.orb) &&
    fact.cycle.orb >= 0 &&
    (fact.cycle.exactDate === null || /^\d{4}-\d{2}-\d{2}$/.test(fact.cycle.exactDate))
  );
}

/** Unsupported or changed source graphs stay with the established writer. */
export function memberContextMode(input: ReadingProseInput): MemberContextMode | null {
  if (input.tone !== "warm" || input.depth !== "standard" || !input.hasEligibleCycles) return null;
  try {
    const facts = selectDailyContextFacts(input.facts);
    const byId = new Map(facts.map((fact) => [fact.id, fact]));
    if (
      !contact(byId.get("C1"), "saturn", "square", "sun") ||
      (byId.has("C2") && !contact(byId.get("C2"), "jupiter", "trine", "mars"))
    )
      return null;
    // Includes exact statements, release, natal evidence, chapter and full parents.
    // Calculation measurements and the server-rendered chronology remain live input.
    toDailyContextBrief(facts, input.tone, input.depth);
    const graph = facts
      .map((fact) => fact.id)
      .sort()
      .join(",");
    return (Object.entries(GRAPHS).find(([, ids]) => ids === graph)?.[0] ??
      null) as MemberContextMode | null;
  } catch {
    return null;
  }
}

/** Creates one complete runtime fallback without benchmark hashes or synthetic source geometry. */
export function prepareMemberContextReading(input: ReadingProseInput): ReadingProseInput | null {
  const mode = memberContextMode(input);
  if (!mode) return null;
  const matches = runtimeFallbacks.cases.filter((entry) => entry.id === mode);
  const entry = matches[0];
  if (
    runtimeFallbacks.version !== MEMBER_CONTEXT_FALLBACK_VERSION ||
    runtimeFallbacks.materialVersion !== CONTEXT_DAILY_MATERIAL_VERSION ||
    matches.length !== 1 ||
    !entry ||
    entry.headline !== entry.headline.trim() ||
    entry.headline.length > 140 ||
    entry.headline.split(/\s+/).length < 3 ||
    entry.headline.split(/\s+/).length > 9 ||
    /[\r\n?]/.test(entry.headline) ||
    safetyPass(entry.headline).flagged.length ||
    dailyQuestionProblem(entry.reflection) ||
    entry.paragraphs.length < 2 ||
    entry.paragraphs.length > 4 ||
    entry.paragraphs.some((paragraph) => paragraph.scenes.length !== 0)
  )
    return null;
  const facts = selectDailyContextFacts(input.facts);
  const chronology = facts.find((fact) => fact.id === "A1")?.arc?.chronologySentence;
  const occurrences = entry.paragraphs.reduce(
    (sum, paragraph) => sum + paragraph.text.split(CHRONOLOGY).length - 1,
    0,
  );
  if (occurrences !== (chronology ? 1 : 0)) return null;
  const paragraphs = entry.paragraphs.map((paragraph) => ({
    text: chronology ? paragraph.text.replace(CHRONOLOGY, chronology) : paragraph.text,
    facts: [...paragraph.facts],
    scenes: [],
  }));
  const primary = facts.find((fact) => fact.id === "I1")!;
  const synthesis = facts.find((fact) => fact.id === "S1");
  const plan: DailyWritingPlan = {
    version: DAILY_WRITING_PLAN_VERSION,
    releaseVersion: primary.releaseVersion!,
    theme: {
      factId: synthesis ? "S1" : "I1",
      sourceKey: (synthesis ?? primary).sourceKey!,
      relationship: synthesis ? "tension" : null,
      requiredFacts: synthesis ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"],
    },
    status: "no_frame",
    frame: null,
    scenes: [],
    templateSources: [primary, ...(synthesis ? [synthesis] : [])].map((fact) => ({
      factId: fact.id as "I1" | "S1",
      sourceKey: fact.sourceKey!,
      sentences: completeDailySentences(
        fact.statement
          .replace(/^Published (?:tension|reinforcement) synthesis [^\n]+ \(parents: [^)]+\): /, "")
          .replace(/^Published interpretation [^\n]+?: /, ""),
      ),
    })),
  };
  const template = { paragraphs, renderMode: "unframed" as const, reason: null };
  return {
    facts,
    hasEligibleCycles: input.hasEligibleCycles,
    tone: input.tone,
    depth: input.depth,
    suppression: { angles: input.suppression.angles, houses: input.suppression.houses },
    fallback: {
      headline: entry.headline,
      body: paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
      prompt: entry.reflection,
    },
    writing: {
      plan,
      template,
      minimalTemplate: structuredClone(template),
      recent: structuredClone(input.writing?.recent ?? []),
    },
  };
}
