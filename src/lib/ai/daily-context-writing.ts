/** Inactive daily-writer candidate. Projection changes neither source facts nor member routing. */
import { assertDailyFactGraph, InvalidDailyFactGraph, type FactAtom } from "./facts";
import reviewedMaterial from "./context-writing-material.json";

export const CONTEXT_DAILY_PROMPT_VERSION = "daily-context-body-5" as const;
export const CONTEXT_DAILY_VALIDATOR_VERSION = "daily-context-reference-5" as const;
export const CONTEXT_DAILY_VOICE_VERSION = "daily-context-voice-5" as const;
export const CONTEXT_DAILY_BRIEF_VERSION = "daily-context-brief-5" as const;
export const CONTEXT_DAILY_MATERIAL_VERSION = "daily-context-material-5" as const;

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

/**
 * One drafted claim exactly as the provider receives it. Its source proof and
 * the claims it carries stay in the reviewed material file.
 */
export interface DailyContextClaim {
  id: string;
  move: "observe" | "explain" | "distinguish" | "choose" | "chronology";
  write?: string;
  copy?: "A1.chronologySentence";
  cite: string[];
  keep?: string[];
  continues?: string;
  byParagraph?: 2;
}
interface ReviewedEntry extends DailyContextClaim {
  carries: string[];
}
interface ReviewedSource {
  factId: string;
  sourceFact: FactAtom;
  claims: { id: string; necessity: "required" | "application" }[];
}
const MATERIAL_SOURCE = /^(?:I[12]|S1|N1|P2)$/;
const packet = reviewedMaterial as unknown as {
  version: string;
  sources: ReviewedSource[];
  compositions: { graph: string; entries: ReviewedEntry[] }[];
};

/** A familiar key never authorizes changed meaning: each selected source must match exactly. */
function reviewedSourceClaims(selected: FactAtom[]) {
  if (packet.version !== CONTEXT_DAILY_MATERIAL_VERSION)
    throw Error("The reviewed context material version changed.");
  const owed = new Map<string, "required" | "application">(
    selected.some((fact) => fact.id === "A1") ? [["A1.chronology", "required"]] : [],
  );
  for (const fact of selected.filter((item) => MATERIAL_SOURCE.test(item.id))) {
    const matches = packet.sources.filter((item) => item.factId === fact.id);
    if (
      matches.length !== 1 ||
      JSON.stringify(cloneFact(matches[0]!.sourceFact)) !== JSON.stringify(cloneFact(fact))
    )
      throw Error(`The reviewed context material does not match source ${fact.id}.`);
    for (const claim of matches[0]!.claims) owed.set(claim.id, claim.necessity);
  }
  return owed;
}

/**
 * Source identity only. The Today preview runs before transit context exists,
 * so its graph can lack the chapter that later completes a reviewed composition.
 */
export function assertReviewedContextSources(facts: FactAtom[]): void {
  reviewedSourceClaims(selectDailyContextFacts(facts));
}

/**
 * The single composition reviewed for this exact graph. Every required source
 * claim is carried exactly once, so no field can supply a second wording of it.
 */
function reviewedComposition(selected: FactAtom[]): ReviewedEntry[] {
  const byId = new Map(selected.map((fact) => [fact.id, fact]));
  const owed = reviewedSourceClaims(selected);
  const graph = [...byId.keys()].sort().join(",");
  const matches = packet.compositions.filter((item) => item.graph === graph);
  if (matches.length !== 1) throw Error("No reviewed context composition matches these sources.");
  const entries = matches[0]!.entries;
  const carried = entries.flatMap((entry) => entry.carries);
  const text = (value: unknown): value is string => typeof value === "string" && !!value.trim();
  const malformed = (entry: ReviewedEntry, index: number) =>
    (entry.move === "chronology"
      ? entry.write !== undefined || entry.copy !== "A1.chronologySentence"
      : !text(entry.write) || entry.copy !== undefined) ||
    !entry.cite.length ||
    entry.cite.some((id) => !byId.has(id)) ||
    entry.carries.some((claim) => {
      const owner = byId.get(claim.split(".")[0]!);
      return !owner || requiredParents(owner, byId).some((id) => !entry.cite.includes(id));
    }) ||
    (entry.keep ?? []).some((word) => !new RegExp(`\\b${word}\\b`).test(entry.write ?? "")) ||
    (entry.continues !== undefined &&
      !entries.slice(0, index).some((item) => item.id === entry.continues));
  if (
    entries[0]?.move !== "observe" ||
    new Set(entries.map((entry) => entry.id)).size !== entries.length ||
    new Set(carried).size !== carried.length ||
    carried.some((claim) => !owed.has(claim)) ||
    [...owed].some(([claim, need]) => need === "required" && !carried.includes(claim)) ||
    entries.some(malformed)
  )
    throw Error("The reviewed context composition is incomplete or inconsistent.");
  return entries;
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

/** Each source claim has one drafting expression; references carry identity and geometry only. */
export function toDailyContextBrief(facts: FactAtom[], tone: string, depth: string) {
  const selected = selectDailyContextFacts(facts);
  const byId = new Map(selected.map((fact) => [fact.id, fact]));
  const normalizedTone = tonePreference(tone);
  const normalizedDepth = depthPreference(depth);
  const technical = normalizedDepth === "technical";
  const claims: DailyContextClaim[] = reviewedComposition(selected).map((entry) => ({
    id: entry.id,
    move: entry.move,
    ...(entry.write ? { write: entry.write } : {}),
    ...(entry.copy ? { copy: entry.copy } : {}),
    cite: [...entry.cite],
    ...(entry.keep ? { keep: [...entry.keep] } : {}),
    ...(entry.continues ? { continues: entry.continues } : {}),
    ...(entry.byParagraph ? { byParagraph: entry.byParagraph } : {}),
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
    claims,
    references,
    controls: {
      voiceVersion: CONTEXT_DAILY_VOICE_VERSION,
      tone: normalizedTone,
      depth: normalizedDepth,
      technicalDetails: technical,
      natalConditional: byId.has("N1"),
      chronologyFirstTwo: byId.has("A1"),
      chronologyOnce: byId.has("A1"),
    },
  };
}
export type DailyContextBrief = ReturnType<typeof toDailyContextBrief>;

// Instructions stay free of reading content: a second wording of a claim here
// would compete with the claim itself, as the fourth pilot's bodies showed.
export function dailyContextSystemVoice(hasNatal: boolean): string {
  return [
    "Write the body of a daily astrology reading for one reader: a precise observation, the distinction that makes it useful, and an optional, proportionate next step. Address the reader as you.",
    "The brief's claims are the whole reading. Each is worded once in write, or copied exactly where it names copy. Use every claim exactly once and add nothing else. You may reorder claims, join two in one sentence, change connecting words and pronouns, and choose where paragraphs break. Never restate a claim in other words, follow a claim with an explanation of it, or close with a summary or lesson.",
    "An if- or when-clause inside a claim is that claim's condition: keep it on that claim and state it once. A claim marked continues stays within the claim it names and does not repeat that claim's condition or setup. Keep each word in keep on its own claim. Claims describe possible situations, never known events in the reader's life. Add nothing a claim does not say: no history, motive, cause, effect, outcome, frequency, certainty, ease, speed or necessity.",
    ...(hasNatal
      ? [
          "The N1 claim is a conditional possibility, never a personality description, a diagnosis or an account of its chart origin.",
        ]
      : []),
  ].join(" ");
}

const TONE_DIRECTION: Record<ContextTone, string> = {
  plain: "Direct and observant: familiar words, active verbs, one distinction at a time.",
  warm: "Attentive and conversational: natural direct address and occasional contractions. Warmth comes from accurate observation, never praise, consolation or reassurance.",
  clinical:
    "Precise and reserved: address the reader as you in ordinary words and active verbs, with no jargon, diagnostic label or third-person case study.",
};

export function dailyContextVoice(tone: string, depth: string): string {
  const normalizedTone = tonePreference(tone);
  const normalizedDepth = depthPreference(depth);
  return [
    `Tone: ${normalizedTone}. ${TONE_DIRECTION[normalizedTone]}`,
    `Depth: ${normalizedDepth}. ${
      normalizedDepth === "technical"
        ? "Keep the claims' human meaning first. You may add the supplied orb and exact date, each in its own short sentence citing its C reference; they describe geometry, never personal timing or a deadline. Those are the only sentences allowed beyond the claims."
        : "Add no orb, degree, phase or date. The only dated sentence is a copied A1 chronology claim."
    }`,
    "Write two to four paragraphs of one to four complete sentences each, under 200 words per paragraph and 700 in all. Open with the observe claim. Paragraph 1 cites C1 and I1. A claim with byParagraph 2 belongs in paragraph 1 or 2. A claim with copy is reproduced word for word from the named reference field.",
    "Each paragraph's facts array lists every ID in the cite arrays of the claims it uses. Declare an empty scenes array.",
  ].join("\n");
}

/** The complete user message: voice, format and the brief, each stated once. */
export function dailyContextPrompt(
  brief: DailyContextBrief,
  suppression: { angles: boolean; houses: boolean },
): string {
  return [
    dailyContextVoice(brief.controls.tone, brief.controls.depth),
    "Name a planet or aspect only as a claim does, in a paragraph citing its C reference. Each contact is a transiting planet to a natal point, not two planets in the current sky. Add no sign, house, angle or other geometry.",
    suppression.angles ? "Angle claims are suppressed; mention no angles or rising sign." : "",
    suppression.houses ? "House claims are suppressed; mention no houses or cusps." : "",
    "Write only the body: no headline, reflection question, caveat, wellbeing framing, source note or explanation of these instructions.",
    "Brief:",
    JSON.stringify(brief),
  ]
    .filter(Boolean)
    .join("\n");
}
