/** Inactive daily-writer candidate. Projection changes neither source facts nor member routing. */
import { assertDailyFactGraph, InvalidDailyFactGraph, type FactAtom } from "./facts";

export const CONTEXT_DAILY_PROMPT_VERSION = "daily-context-body-1" as const;
export const CONTEXT_DAILY_VALIDATOR_VERSION = "daily-context-reference-1" as const;
export const CONTEXT_DAILY_VOICE_VERSION = "daily-context-voice-1" as const;
export const CONTEXT_DAILY_BRIEF_VERSION = "daily-context-brief-1" as const;

type ContextTone = "plain" | "warm" | "clinical";
type ContextDepth = "standard" | "technical";
const tonePreference = (tone: string): ContextTone =>
  tone === "warm" || tone === "clinical" ? tone : "plain";
const depthPreference = (depth: string): ContextDepth =>
  depth === "technical" ? depth : "standard";

/** Explicit projection prevents future/local-only fields from entering a provider request. */
function cloneFact(fact: FactAtom): FactAtom {
  return {
    id: fact.id,
    statement: fact.statement,
    ...(fact.kind ? { kind: fact.kind } : {}),
    ...(fact.sourceKey ? { sourceKey: fact.sourceKey } : {}),
    ...(fact.releaseVersion ? { releaseVersion: fact.releaseVersion } : {}),
    ...(fact.dependsOn ? { dependsOn: [...fact.dependsOn] } : {}),
    ...(fact.natalEvidenceId ? { natalEvidenceId: fact.natalEvidenceId } : {}),
    ...(fact.storyChapter ? { storyChapter: fact.storyChapter } : {}),
    ...(fact.cycle
      ? {
          cycle: {
            transitBody: fact.cycle.transitBody,
            natalPoint: fact.cycle.natalPoint,
            aspect: fact.cycle.aspect,
            orb: fact.cycle.orb,
            exactDate: fact.cycle.exactDate,
          },
        }
      : {}),
    ...(fact.arc ? { arc: structuredClone(fact.arc) } : {}),
  };
}

/** Validate the complete input before discarding optional or unjoined framing. */
export function selectDailyContextFacts(facts: FactAtom[]): FactAtom[] {
  assertDailyFactGraph(facts);
  const byId = new Map(facts.map((fact) => [fact.id, fact]));
  const primary = byId.get("I1");
  if (
    !byId.get("C1")?.cycle ||
    primary?.kind !== "interpretation" ||
    !primary.sourceKey ||
    !primary.releaseVersion ||
    primary.dependsOn?.join(",") !== "C1"
  )
    throw new InvalidDailyFactGraph();
  const selected = [
    "C1",
    "I1",
    ...(byId.has("S1") ? ["C2", "I2", "S1"] : []),
    ...(byId.has("N1") ? ["N1"] : []),
    ...(byId.has("A1") ? ["A1", "P2"] : []),
  ].map((id) => cloneFact(byId.get(id)!));
  assertDailyFactGraph(selected);
  return selected;
}

function curatedMeaning(fact: FactAtom): string {
  const prefixes =
    fact.id === "S1"
      ? ["tension", "reinforcement"].map(
          (relationship) =>
            `Published ${relationship} synthesis ${fact.sourceKey} (parents: ${fact.dependsOn!.join(", ")}): `,
        )
      : fact.id === "N1"
        ? ["Published natal lens, an interpretive possibility: "]
        : fact.id === "P2"
          ? ["Published transit chapter: "]
          : [`Published interpretation ${fact.sourceKey}: `];
  const prefix = prefixes.find((item) => fact.statement.startsWith(item));
  if (!prefix || !fact.statement.slice(prefix.length).trim()) throw new InvalidDailyFactGraph();
  return fact.statement.slice(prefix.length);
}

function requiredParents(fact: FactAtom, byId: Map<string, FactAtom>): string[] {
  const required = new Set<string>();
  const visit = (id: string): void => {
    if (required.has(id)) return;
    required.add(id);
    for (const parent of byId.get(id)!.dependsOn ?? []) visit(parent);
  };
  visit(fact.id);
  return [...required];
}

export interface DailyContextMaterial {
  factId: string;
  sourceKey: string;
  releaseVersion: string;
  meaning: string;
  requiredFacts: string[];
}
export interface DailyContextReference {
  id: string;
  kind?: FactAtom["kind"];
  sourceKey?: string;
  releaseVersion?: string;
  dependsOn: string[];
  natalEvidenceId?: FactAtom["natalEvidenceId"];
  storyChapter?: FactAtom["storyChapter"];
  cycle?: Pick<NonNullable<FactAtom["cycle"]>, "transitBody" | "natalPoint" | "aspect"> &
    Partial<Pick<NonNullable<FactAtom["cycle"]>, "orb" | "exactDate">>;
  chronologySentence?: string;
}

/** Curated meaning is writing material; reference identities and controls are never body prose. */
export function toDailyContextBrief(facts: FactAtom[], tone: string, depth: string) {
  const selected = selectDailyContextFacts(facts);
  const byId = new Map(selected.map((fact) => [fact.id, fact]));
  const normalizedTone = tonePreference(tone);
  const normalizedDepth = depthPreference(depth);
  const technical = normalizedDepth === "technical";
  const material: DailyContextMaterial[] = selected
    .filter((fact) => /^(I[12]|S1|N1|P2)$/.test(fact.id))
    .map((fact) => ({
      factId: fact.id,
      sourceKey: fact.sourceKey!,
      releaseVersion: fact.releaseVersion!,
      meaning: curatedMeaning(fact),
      requiredFacts: requiredParents(fact, byId),
    }));
  const references: DailyContextReference[] = selected.map((fact) => ({
    id: fact.id,
    ...(fact.kind ? { kind: fact.kind } : {}),
    dependsOn: [...(fact.dependsOn ?? [])],
    ...(fact.sourceKey ? { sourceKey: fact.sourceKey } : {}),
    ...(fact.releaseVersion ? { releaseVersion: fact.releaseVersion } : {}),
    ...(fact.natalEvidenceId ? { natalEvidenceId: fact.natalEvidenceId } : {}),
    ...(fact.storyChapter ? { storyChapter: fact.storyChapter } : {}),
    ...(fact.cycle
      ? {
          cycle: {
            transitBody: fact.cycle.transitBody,
            natalPoint: fact.cycle.natalPoint,
            aspect: fact.cycle.aspect,
            ...(technical ? { orb: fact.cycle.orb, exactDate: fact.cycle.exactDate } : {}),
          },
        }
      : {}),
    ...(fact.arc ? { chronologySentence: fact.arc.chronologySentence } : {}),
  }));
  return {
    version: CONTEXT_DAILY_BRIEF_VERSION,
    material,
    references,
    controls: {
      voiceVersion: CONTEXT_DAILY_VOICE_VERSION,
      tone: normalizedTone,
      depth: normalizedDepth,
      requiredMeaningFacts: material.map((entry) => entry.factId),
      natalConditional: byId.has("N1"),
      chronologyFirstTwo: byId.has("A1"),
      chronologyOnce: byId.has("A1"),
      technicalDetails: technical,
    },
  };
}

export function dailyContextSystemVoice(hasNatal: boolean): string {
  return [
    "You write a daily astrology reading in an attentive, observational voice. Notice a recognizable detail, develop one useful distinction, and let that distinction give the reader proportionate direction.",
    "Only supplied material meanings authorize interpretation, scenes, planetary imagery or optional direction. Structural references identify their sources and parents; calculated references establish contact geometry and the exact supplied chronology. Neither establishes personal events, causes, temperament or another person's intentions.",
    "Keep each source condition, possibility and causal direction attached to its own claim. Do not add frequency, necessity, certainty, a causal bridge or a joint meaning. Each paragraph cites every source used and all its required parent facts. A synthesis keeps its distinct parent meanings, rather than reducing planets to a keyword list.",
    "Direction may be noticing, waiting, asking, a small reversible choice, leaving something unresolved or enjoying a supported moment. It remains optional; never pressure, predict, promise a result or turn a possibility into a personal prescription.",
    "Controls and source labels are separate from writing material. Do not narrate the rules, source selection, model, calculation system or limits as body prose. Respect supplied suppression limits and never invent astronomical, biographical or health claims.",
    ...(hasNatal
      ? [
          "N1 is a conditional symbolic possibility. Preserve its own condition and practical distinction within the primary situation in paragraph 1 or 2, citing N1, C1 and I1 together. The natal distinction can deepen that situation without becoming a personality section, objective ownership, diagnosis or a cause of the reader's behavior. Do not recite raw natal origins.",
        ]
      : []),
  ].join(" ");
}

const TONE_DIRECTION: Record<ContextTone, string> = {
  plain:
    "Direct and observant. Use familiar words, active verbs and one clear distinction at a time. Let precision carry the voice.",
  warm: "Attentive and conversational. Use natural direct address and occasional contractions. Warmth comes from accurate observation; avoid praise, consolation and a counselor's reassurance.",
  clinical:
    "Precise and reserved. Address the reader as you, using ordinary words and active verbs. Preserve subjective source wording without jargon, diagnostic labels or a third-person case study.",
};

export function dailyContextVoice(tone: string, depth: string): string {
  const normalizedTone = tonePreference(tone);
  const normalizedDepth = depthPreference(depth);
  return [
    `Tone: ${normalizedTone}. ${TONE_DIRECTION[normalizedTone]}`,
    `Depth: ${normalizedDepth}. ${
      normalizedDepth === "technical"
        ? "Lead with the human meaning. Add relevant supplied orb or exact-date detail in a compact separate passage when it helps; cite its calculated contact directly. Measurements describe geometry, never personal timing or a deadline."
        : "Keep human meaning in the foreground. Omit optional orb values, degree measurements, phase and exact-date detail. When A1 is supplied, its immutable chronology sentence is required even at standard depth."
    }`,
    "Develop one central situation through the primary meaning. Let selected synthesis, natal and transit distinctions change how that same situation can be considered; do not append separate mini-readings or invent a new setting for each source. Draw concrete details only from the supplied meanings; a possible illustration must remain possible.",
    "Open on a supported recognizable gesture, general distinction or conditional possibility. An if opening is optional. Vary paragraph count, sentence rhythm and the position of astrology; no fixed three-paragraph formula, mandatory script or closing permission sentence. Aim for 90–190 words, or a little more when required chronology and technical detail need it; stop when the thought is complete.",
    "Integrate any selected N1 and P2 meaning within the first two paragraphs, each with its full source parents. Preserve natal conditionality. P2 contributes its supplied chapter distinction to the same scene; it authorizes no account of previous personal events, resolution or closure.",
    "If A1 is supplied, include its chronologySentence unchanged exactly once in paragraph 1 or 2, citing A1 and C1. Cite P2, C1, I1 and A1 together for chapter meaning. Do not paraphrase chronology, repeat it, add dates or reinterpret a calculated pass as an event in the reader's life.",
    "Planetary imagery can clarify a distinction only when supplied by material. Avoid a list of planet keywords. Do not explain that a contact offers a symbolic lens or gives this reading its theme; let supported meaning stand in ordinary language.",
    "A useful ending may be the distinction itself or supported optional direction. Do not force a sentence to say aloud, recap the reading, console the reader or add hollow reassurance. The headline and independently validated reflection are separate; write only the body.",
  ].join("\n");
}
