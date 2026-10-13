import type { CycleInstance } from "../astro/cycles";
import { dailyQuestionProblem } from "./daily-reflection";

/** Schema-4 serving changes are independent of the schema-5 writing candidate. */
export const PRIMARY_COMPOSITION_VERSION = "primary-composition-1";
export const PRIMARY_REFLECTION_VERSION = "primary-reflection-1";

const DOMAIN_QUESTIONS: Readonly<Record<string, string>> = {
  work: "What part of your work, if any, has your attention today?",
  relationships: "What connection, if any, would you like to give attention to today?",
  "inner-life": "What kind of private time, if any, would you welcome today?",
  identity: "What, if anything, would you like to notice about how you describe yourself?",
  structure: "What part of your routine, if any, would you like to consider today?",
};

/** A usable primary question wins; inherited domain or wellness prompts never append to it. */
export function primaryReflection(question: string | null, domain: string) {
  if (question && !dailyQuestionProblem(question))
    return { question, source: "interpretation" as const };
  return {
    question: DOMAIN_QUESTIONS[domain] ?? "What, if anything, has your attention today?",
    source: "domain-fallback" as const,
  };
}

// These exact inherited sentences add no contact-specific distinction. An edited
// or unfamiliar phase source remains available in the template and fact block.
const SHARED_PHASE_COPY = new Set([
  "If a demand catches your attention, you can notice your response before deciding how to act.",
  "If a demand feels immediate, one clearly described choice can offer a place to begin.",
  "If any felt pressure has eased, a response may still be useful.",
]);
export function includePrimaryPhase(text: string): boolean {
  return Boolean(text) && !SHARED_PHASE_COPY.has(text);
}

export function primaryTechnicalGeometry(cycle: CycleInstance): string {
  const name = (value: string) =>
    value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const phase =
    cycle.phase === "approaching"
      ? "is approaching exactness"
      : cycle.phase === "separating"
        ? "is separating from exactness"
        : "is in its calculated exact phase";
  return `${name(cycle.transit_body)}'s ${cycle.aspect} to natal ${name(cycle.natal_point)} ${phase}; its current aspect orb is ${cycle.orb} degrees.`;
}
