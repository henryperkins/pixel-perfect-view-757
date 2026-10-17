/** Inactive daily-writer candidate. Projection changes neither source facts nor member routing. */
import { assertDailyFactGraph, InvalidDailyFactGraph, type FactAtom } from "./facts";
import reviewedMaterial from "./context-writing-material.json";

export const CONTEXT_DAILY_PROMPT_VERSION = "daily-context-body-2" as const;
export const CONTEXT_DAILY_VALIDATOR_VERSION = "daily-context-reference-2" as const;
export const CONTEXT_DAILY_VOICE_VERSION = "daily-context-voice-2" as const;
export const CONTEXT_DAILY_BRIEF_VERSION = "daily-context-brief-2" as const;
export const CONTEXT_DAILY_MATERIAL_VERSION = "daily-context-material-2" as const;

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
  sceneDetails: string[];
  practicalDistinction: string;
  optionalDirections: string[];
  requiredFacts: string[];
}
interface ReviewedMaterialCard {
  factId: string;
  sourceFact: FactAtom;
  meaning: string;
  sceneDetails: string[];
  practicalDistinction: string;
  optionalDirections: string[];
  requiredConditions: string[];
}

/** Review/source proof stays local; a familiar key never authorizes changed source meaning. */
function reviewedCard(fact: FactAtom): ReviewedMaterialCard {
  const packet = reviewedMaterial as unknown as { version: string; cards: ReviewedMaterialCard[] };
  const matches = packet.cards.filter((card) => card.factId === fact.id);
  const card = matches[0];
  const text = (value: unknown): value is string => typeof value === "string" && !!value.trim();
  const list = (value: unknown): value is string[] =>
    Array.isArray(value) && value.length > 0 && value.every(text);
  if (
    packet.version !== CONTEXT_DAILY_MATERIAL_VERSION ||
    matches.length !== 1 ||
    !card?.sourceFact ||
    JSON.stringify(cloneFact(card.sourceFact)) !== JSON.stringify(cloneFact(fact)) ||
    !text(card.meaning) ||
    !text(card.practicalDistinction) ||
    !list(card.sceneDetails) ||
    !list(card.optionalDirections) ||
    !list(card.requiredConditions)
  )
    throw Error(`The reviewed context material does not match source ${fact.id}.`);
  return card;
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

/** Reviewed building blocks are writing material; source proof and control language stay separate. */
export function toDailyContextBrief(facts: FactAtom[], tone: string, depth: string) {
  const selected = selectDailyContextFacts(facts);
  const byId = new Map(selected.map((fact) => [fact.id, fact]));
  const normalizedTone = tonePreference(tone);
  const normalizedDepth = depthPreference(depth);
  const technical = normalizedDepth === "technical";
  const reviewed = selected
    .filter((fact) => /^(I[12]|S1|N1|P2)$/.test(fact.id))
    .map((fact) => ({ fact, card: reviewedCard(fact) }));
  const material: DailyContextMaterial[] = reviewed.map(({ fact, card }) => ({
    factId: fact.id,
    sourceKey: fact.sourceKey!,
    releaseVersion: fact.releaseVersion!,
    meaning: card.meaning,
    sceneDetails: [...card.sceneDetails],
    practicalDistinction: card.practicalDistinction,
    optionalDirections: [...card.optionalDirections],
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
    materialVersion: CONTEXT_DAILY_MATERIAL_VERSION,
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
      sourceConditions: reviewed.map(({ fact, card }) => ({
        factId: fact.id,
        conditions: [...card.requiredConditions],
      })),
    },
  };
}

export function dailyContextSystemVoice(hasNatal: boolean): string {
  return [
    "You write a daily astrology reading in an attentive, observational voice. Notice a recognizable detail, develop one useful distinction, and let that distinction give the reader proportionate direction.",
    "Supplied material meanings, scene details, practical distinctions and optional directions are the writing material. They authorize possible illustrations, never known events. Structural references identify sources and parents; calculated references establish geometry and exact supplied chronology. Neither establishes personal events, causes, temperament or another person's intentions.",
    "Keep every source condition in controls.sourceConditions attached to its own claim. Do not add frequency, necessity, certainty or a relationship beyond the supplied practical distinctions. A possibility in one sentence does not make a later personal assertion conditional. Each paragraph cites every source used and all its required parent facts. A synthesis keeps its distinct parent meanings, rather than reducing planets to a keyword list.",
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
    "Choose a few supplied scene details to develop one central situation through the primary practical distinction. These are building blocks, not paragraphs to concatenate. Let selected synthesis, natal and transit distinctions change what can be noticed or chosen within that same situation. Do not append separate mini-readings or invent a new setting for each source. A possible illustration must remain possible.",
    "Open on a supported recognizable gesture, general distinction or conditional possibility. An if opening is optional. Vary paragraph count, sentence rhythm and the position of astrology; no fixed three-paragraph formula, mandatory script or closing permission sentence. Aim for 90–190 words, or a little more when required chronology and technical detail need it; stop when the thought is complete.",
    "Integrate any selected N1 and P2 meaning within the first two paragraphs, each with its full source parents. Preserve natal conditionality. P2 contributes its supplied chapter distinction to the same scene; it authorizes no account of previous personal events, resolution or closure.",
    "If A1 is supplied, include its chronologySentence unchanged exactly once in paragraph 1 or 2, citing A1 and C1. Cite P2, C1, I1 and A1 together for chapter meaning. Do not paraphrase chronology, repeat it, add dates or reinterpret a calculated pass as an event in the reader's life.",
    "Planetary imagery can clarify a distinction only when supplied by material. Avoid a list of planet keywords. Do not explain that a contact offers a symbolic lens or gives this reading its theme; let supported meaning stand in ordinary language.",
    "A useful ending may be the distinction itself or supported optional direction. Do not force a sentence to say aloud, recap the reading, console the reader or add hollow reassurance. The headline and independently validated reflection are separate; write only the body.",
  ].join("\n");
}
