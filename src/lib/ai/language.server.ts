/**
 * Language layer.
 *
 * The calculation is deterministic and stays that way. This module only
 * rewrites wording, and it works under three hard rules:
 *
 *   1. The model sees a fact block and nothing else — no birth details, no
 *      notes, no free text the reader wrote.
 *   2. Every paragraph must cite the fact ids it used. A paragraph citing an
 *      id that was not injected is dropped before anyone sees it.
 *   3. Whatever survives still passes the DER-22 safety pass, and if nothing
 *      survives — or the gateway fails, is rate limited, or is out of credit —
 *      the deterministic template copy is used instead and labelled as such.
 */
import { safetyPass } from "../content/default-bundle";
import { normalizeDepth, normalizeTone } from "../reading.server";
import { factBlock, factIds, type FactAtom } from "./facts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const LANGUAGE_MODEL = "google/gemini-3.7-flash";

const VOICE = [
  "You write for an astrology app that shows its work.",
  "You are given a numbered block of already-calculated facts. You may not add astronomical or biographical facts of your own.",
  "Every paragraph you write must cite the ids of the facts it rests on.",
  "Never predict, never instruct, never promise an outcome, never mention health, medication, diagnosis, money, investing, pregnancy, divorce or death.",
  "Describe mechanism and what a person might notice, in calm, plain, specific prose. No zodiac cliches, no mysticism, no exclamation marks, no second-hand claims about other people.",
  "If a fact says a claim is suppressed or weighted down, respect that: say nothing that depends on it.",
].join(" ");

export type LanguageMode = "model" | "template";

export interface Citation {
  paragraph: number;
  facts: string[];
}

export interface LanguageMeta {
  mode: LanguageMode;
  model: string | null;
  citations: Citation[];
  dropped: number;
  flagged: string[];
  reason: string | null;
}

export interface ReadingProse {
  headline: string;
  body: string;
  prompt: string;
  meta: LanguageMeta;
}

function templateMeta(reason: string): LanguageMeta {
  return { mode: "template", model: null, citations: [], dropped: 0, flagged: [], reason };
}

interface JsonSchemaObject {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}

/** One gateway call returning a strict-schema JSON object, or throwing. */
async function callGateway<T>(
  user: string,
  schemaName: string,
  schema: JsonSchemaObject,
  timeoutMs = 90000,
): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("language layer is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${key}`,
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: LANGUAGE_MODEL,
      messages: [
        { role: "system", content: VOICE },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`gateway ${res.status}: ${detail}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("gateway returned no content");
  return JSON.parse(content) as T;
}

interface Written {
  text: string;
  facts: string[];
}

/**
 * Keeps paragraphs referencing supplied IDs, then runs the safety
 * pass. This validates ID eligibility, not semantic support. Returns the surviving paragraphs plus what was thrown away.
 */
function verify(paragraphs: Written[], allowed: Set<string>) {
  const kept: string[] = [];
  const citations: Citation[] = [];
  const flagged: string[] = [];
  let dropped = 0;

  for (const p of paragraphs) {
    const text = (p.text ?? "").trim();
    const cited = (p.facts ?? []).filter((f) => allowed.has(f));
    if (!text || cited.length === 0 || cited.length !== (p.facts ?? []).length) {
      dropped += 1;
      continue;
    }
    const safe = safetyPass(text);
    flagged.push(...safe.flagged);
    kept.push(safe.text);
    citations.push({ paragraph: kept.length, facts: cited });
  }

  return { kept, citations, dropped, flagged };
}

export interface ReadingProseInput {
  facts: FactAtom[];
  hasEligibleCycles: boolean;
  tone: string;
  depth: string;
  suppression: { angles: boolean; houses: boolean };
  /** Only the astronomical body is rewritten. Headline and reflection stay deterministic. */
  fallback: { headline: string; body: string; prompt: string };
}

const READING_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    paragraphs: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          facts: { type: "array", items: { type: "string" } },
        },
        required: ["text", "facts"],
        additionalProperties: false,
      },
    },
  },
  required: ["paragraphs"],
  additionalProperties: false,
};

const BODY_NAMES =
  "sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|descendant|midheaven|imum coeli";
const ASPECT_NAMES =
  "conjunction|conjunct(?:s|ing)?|sextiles?|squar(?:e|es|ing)|trin(?:e|es|ing)|quincunx|opposition|oppos(?:ed|es|ing)";
const SIGNS =
  /\b(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i;
const HOUSE_PLACEMENT =
  /\b(?:\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\b|\bhouse[_ -]?(?:number\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;
function canonicalBody(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
function canonicalAspect(value: string): string {
  if (value.startsWith("conjunct")) return "conjunction";
  if (value.startsWith("oppos")) return "opposition";
  if (value.startsWith("squar")) return "square";
  if (value.startsWith("trin")) return "trine";
  return value === "sextiles" ? "sextile" : value;
}

/** Bounded contradiction checks: IDs and lexical references cannot prove arbitrary prose. */
function dailyReferenceProblem(
  text: string,
  cited: FactAtom[],
  suppression: ReadingProseInput["suppression"],
): string | null {
  if (
    suppression.angles &&
    /\b(ascendant|descendant|midheaven|imum coeli|rising sign|asc|mc|ic)\b/i.test(text)
  )
    return "draft contains suppressed angle wording";
  if (suppression.houses && /\b(houses?|cusps?)\b/i.test(text))
    return "draft contains suppressed house wording";
  if (SIGNS.test(text) || HOUSE_PLACEMENT.test(text))
    return "draft contains a placement absent from daily facts";
  const cycles = cited.flatMap((f) => (f.cycle ? [f.cycle] : []));
  const bodies = new Set(
    cycles.flatMap((c) => [canonicalBody(c.transitBody), canonicalBody(c.natalPoint)]),
  );
  for (const match of text.matchAll(new RegExp(`\\b(${BODY_NAMES})\\b`, "gi"))) {
    if (!bodies.has(canonicalBody(match[0])))
      return "draft names a body absent from its cited cycles";
  }
  const pairs = new RegExp(
    `\\b(${BODY_NAMES})\\s+(?:(?:is|was|forms?|makes?|forming|making|in|a|an)\\s+){0,3}(${ASPECT_NAMES})\\s+(?:(?:to|with|of|against|the|your|natal|birth)\\s+){0,4}(${BODY_NAMES})\\b`,
    "gi",
  );
  for (const match of text.matchAll(pairs)) {
    const first = canonicalBody(match[1]!),
      second = canonicalBody(match[3]!);
    const aspect = canonicalAspect(match[2]!.toLowerCase());
    const explicitRoles =
      /transiting\s*$/i.test(text.slice(Math.max(0, match.index! - 20), match.index)) ||
      /\bnatal\b/i.test(match[0]);
    if (
      !cycles.some(
        (c) =>
          c.aspect === aspect &&
          ((canonicalBody(c.transitBody) === first && canonicalBody(c.natalPoint) === second) ||
            (!explicitRoles &&
              canonicalBody(c.transitBody) === second &&
              canonicalBody(c.natalPoint) === first)),
      )
    )
      return "draft contradicts its cited body/aspect relation";
  }
  const joinedPairs = new RegExp(
    `\\b(${BODY_NAMES})\\s+(?:and|with)\\s+(?:your |natal )?(${BODY_NAMES})\\s+(?:(?:are|is|form|forms|make|makes|in|a|an)\\s+){0,4}(${ASPECT_NAMES})\\b`,
    "gi",
  );
  for (const match of text.matchAll(joinedPairs)) {
    const first = canonicalBody(match[1]!),
      second = canonicalBody(match[2]!);
    const aspect = canonicalAspect(match[3]!.toLowerCase());
    if (
      !cycles.some(
        (c) =>
          c.aspect === aspect &&
          ((canonicalBody(c.transitBody) === first && canonicalBody(c.natalPoint) === second) ||
            (canonicalBody(c.transitBody) === second && canonicalBody(c.natalPoint) === first)),
      )
    )
      return "draft contradicts its cited body/aspect relation";
  }
  // The brief requires digit literals for degree references; spelled numbers
  // cannot be compared reliably with the typed orb and therefore fail closed.
  for (const mention of text.matchAll(/\bdegrees?\b|°/gi)) {
    const before = text.slice(Math.max(0, mention.index! - 40), mention.index);
    if (
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|half|quarter)(?:\s+a)?\s*$/i.test(
        before,
      )
    )
      return "draft contains an uncheckable worded degree value";
  }
  for (const match of text.matchAll(/(-?\d+(?:\.\d+)?)\s*-?\s*(?:°|degrees?\b)/gi)) {
    const value = Number(match[1]);
    const before = text.slice(Math.max(0, match.index! - 30), match.index);
    const approximate = /\b(about|roughly|approximately)\s*$/i.test(before);
    const decimals = match[1]!.split(".")[1]?.length ?? 0;
    if (
      !cycles.some(
        (c) =>
          Math.abs(c.orb - value) < 1e-7 ||
          (approximate &&
            Math.abs(Math.round(c.orb * 10 ** decimals) / 10 ** decimals - value) < 1e-7),
      )
    )
      return "draft contains an orb absent from its cited cycles";
  }
  for (const match of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) {
    if (!cycles.some((c) => c.exactDate === match[0]))
      return "draft contains a date absent from its cited cycles";
  }
  return null;
}

function dailyDraft(
  raw: unknown,
  input: ReadingProseInput,
): { body: string; citations: Citation[] } | string {
  if (
    !raw ||
    typeof raw !== "object" ||
    !Array.isArray((raw as { paragraphs?: unknown }).paragraphs)
  )
    return "draft has malformed paragraph data";
  const paragraphs = (raw as { paragraphs: unknown[] }).paragraphs;
  if (paragraphs.length < 3 || paragraphs.length > 5)
    return "draft must contain three to five paragraphs";
  const byId = new Map(input.facts.map((f) => [f.id, f]));
  const kept: string[] = [],
    citations: Citation[] = [];
  const covered = new Set<string>();
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  let words = 0;
  for (const paragraph of paragraphs) {
    if (!paragraph || typeof paragraph !== "object") return "draft has malformed paragraph data";
    const p = paragraph as { text?: unknown; facts?: unknown };
    if (
      typeof p.text !== "string" ||
      !p.text.trim() ||
      !Array.isArray(p.facts) ||
      !p.facts.length ||
      p.facts.some((id) => typeof id !== "string" || !byId.has(id))
    )
      return "draft failed supplied-ID validation";
    const text = p.text.trim();
    const sentences = [...segmenter.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
    if (
      sentences.length < 2 ||
      sentences.length > 4 ||
      sentences.some((s) => !/[.!?]["')\]]*$/.test(s))
    )
      return "draft paragraphs must contain two to four complete sentences";
    const count = text.split(/\s+/).length;
    words += count;
    if (count > 200 || words > 700 || text.length > 1600)
      return "draft exceeds the daily length limit";
    if (safetyPass(text).flagged.length) return "draft failed the language safety check";
    const ids = [...new Set(p.facts as string[])];
    const problem = dailyReferenceProblem(
      text,
      ids.map((id) => byId.get(id)!),
      input.suppression,
    );
    if (problem) return problem;
    ids.forEach((id) => covered.add(id));
    kept.push(text);
    citations.push({ paragraph: kept.length, facts: ids });
  }
  const required = input.facts.filter((f) => /^(C1|I1|D1|P1|T1)$/.test(f.id)).map((f) => f.id);
  if (
    !citations[0]?.facts.includes("C1") ||
    !citations[0]?.facts.includes("I1") ||
    required.some((id) => !covered.has(id))
  )
    return "draft failed required cycle/editorial ID coverage";
  return { body: kept.join("\n\n"), citations };
}

export async function generateReadingProse(input: ReadingProseInput): Promise<ReadingProse> {
  const { fallback } = input;
  if (!input.hasEligibleCycles || !input.facts.some((f) => f.id === "C1" && f.cycle))
    return { ...fallback, meta: templateMeta("no eligible cycle to write from") };
  const prompt = [
    `Tone preference: ${normalizeTone(input.tone)}. Depth preference: ${normalizeDepth(input.depth)}.`,
    "Facts:",
    factBlock(input.facts),
    "",
    "Rewrite only the astronomical body of today's reading, using the supplied published interpretation, domain and phase wording.",
    "Write three to five paragraphs of two to four complete sentences each. Keep each paragraph under 200 words and the whole body under 700 words.",
    "The first paragraph must concern the strongest eligible cycle and cite C1 and I1. Across the body cite every supplied I1, D1, P1 and T1 atom.",
    "Cite the supplied IDs each paragraph rests on. This is reference coverage, not permission to invent astronomical facts.",
    "Do not write a headline, reflection question, local-time context or wellbeing framing; those are provided separately.",
    "Do not introduce sign or individual house placements. Quote orb degrees as digit literals and ISO dates only when present in a cycle cited by that paragraph.",
    input.suppression.angles
      ? "Angle claims are suppressed: do not mention Ascendant, rising sign, Midheaven or other angles."
      : "",
    input.suppression.houses ? "House claims are suppressed: do not mention houses or cusps." : "",
    "Do not repeat calculation caveats; the app appends them separately.",
  ]
    .filter(Boolean)
    .join("\n");
  let raw: unknown;
  try {
    raw = await callGateway(prompt, "daily_reading", READING_SCHEMA, 12000);
  } catch (e) {
    return { ...fallback, meta: templateMeta((e as Error).message) };
  }
  const result = dailyDraft(raw, input);
  if (typeof result === "string") return { ...fallback, meta: templateMeta(result) };
  return {
    headline: fallback.headline,
    body: result.body,
    prompt: fallback.prompt,
    meta: {
      mode: "model",
      model: LANGUAGE_MODEL,
      citations: result.citations,
      dropped: 0,
      flagged: [],
      reason: null,
    },
  };
}

// ---------------------------------------------------------------------------
// natal chapter narratives
// ---------------------------------------------------------------------------

export interface FeatureProse {
  narrative: string;
  meta: LanguageMeta;
}

/**
 * Bumped whenever the essay brief below changes shape. Cached chapters written
 * under an older version are rewritten on next read rather than served stale.
 */
export const FEATURE_ESSAY_VERSION = "essay-6";

const FEATURE_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    // Natal keeps its existing schema and behavior; daily bounds are separate.
    paragraphs: {
      type: "array",
      items: (READING_SCHEMA.properties["paragraphs"] as { items: unknown }).items,
    },
    reflection_question: {
      type: "string",
      description:
        "One question about the reader's own life, ending in a question mark. Not a chapter title or writing instruction.",
    },
  },
  required: ["paragraphs", "reflection_question"],
  additionalProperties: false,
};

/** Reject titles and instructions even when the model puts them in the question field. */
export function chapterReflection(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (
    text.length <= 400 &&
    /^(what|when|where|which|who|how|why|do|does|did|are|is|have|has|can|could|would)\b/i.test(
      text,
    ) &&
    text.endsWith("?") &&
    (text.match(/\?/g) ?? []).length === 1 &&
    /\b(you|your|yourself)\b/i.test(text)
  )
    return text;
  return "Where in your everyday life do you recognise this pattern, and when does your experience differ?";
}

export async function generateFeatureNarrative(input: {
  facts: FactAtom[];
  title: string;
  tone: string;
}): Promise<FeatureProse> {
  const prompt = [
    `Tone preference: ${input.tone}.`,
    "Facts:",
    factBlock(input.facts),
    "",
    `Write an essay about the natal structure "${input.title}".`,
    "Write it as a full centrepiece chapter, regardless of the structure's relative strength.",
    "Write six to eight paragraphs of three to five sentences each, in this arc:",
    "1. the inner experience, stated plainly — open with what it is like to be this person, with no degrees, orbs, strengths or chart terms in this paragraph.",
    "2. the mechanism — what this structure literally is in the chart, in plain words; degrees and technical detail belong here, not earlier.",
    "3. the inner detail — how a person with this structure tends to process things internally: what they reach for, what they avoid, what feels effortful versus automatic.",
    "4. how it shows up with other people, as a tendency in the reader themselves and never as a claim about anyone else.",
    "5. the cost of the same trait — where the strength overshoots, tips into a habit, or gets expensive.",
    "6. what it looks like when it is working well, and what usually has to be practised for that.",
    "7. how strongly the calculation defines this structure and what that does and does not entitle anyone to say.",
    "",
    "Write psychology, not fortune telling: describe patterns of attention, motivation and self-image.",
    "Speak to the reader as 'you'. Be specific and concrete — name ordinary situations rather than abstractions.",
    "Ground paragraphs 3 to 6 each in a different concrete everyday scene, choosing from: money and spending, conflict or disagreement, daily habits and routines, work and deadlines, rest and recovery, being cared for, making decisions. Never reuse a scene across paragraphs. Prefer scenes matching any house or domain the facts mention.",
    "A scene is one short, recognisable moment (e.g. 'when a bill arrives', 'the night before a deadline'), not a list of life areas.",
    "It is a lifelong structure, not an event: do not date it, do not predict from it, do not tell the reader what to do.",
    "Write with confidence: state the pattern directly ('you need', 'you tend to', 'you reach for'). Do not stack hedges such as may, might, could, perhaps, possibly.",
    "Reserve softer wording only for claims resting on a fact that says it is weighted down or suppressed, or on a structure ranked as a quieter structure. Never quote ranking scores, strength numbers or confidence weights as numbers.",
    "If related-structure facts (R ids) are given, weave at least one into the essay as a composite claim — how this structure and that one combine or pull against each other — citing both ids.",
    "Each paragraph must add new information; never restate an earlier paragraph's claim in different words.",
    "Keep one consistent voice across all paragraphs: same register, same warmth, same sentence rhythm from the first paragraph to the last. Do not open paragraphs with the same phrase, and do not summarise the essay at the end.",
    "No zodiac cliches, no mysticism, no flattery, no horoscope voice.",
    "Cite the fact ids each paragraph rests on. Every paragraph must cite at least one.",
    "Put one reflection question the reader could actually answer about their own life in reflection_question only. End it with a question mark. Do not put a title, label, or writing instruction in that field, and do not repeat the question in the essay paragraphs.",
  ].join("\n");

  let raw: { reflection_question: string; paragraphs: Written[] };
  try {
    raw = await callGateway(prompt, "natal_chapter", FEATURE_SCHEMA);
  } catch (e) {
    return { narrative: "", meta: templateMeta((e as Error).message) };
  }

  const { kept, citations, dropped, flagged } = verify(raw.paragraphs ?? [], factIds(input.facts));
  if (kept.length === 0) {
    return {
      narrative: "",
      meta: templateMeta("generated narrative failed fact verification"),
    };
  }

  const question = safetyPass(chapterReflection(raw.reflection_question));
  const body = [...kept, `Something to sit with: ${chapterReflection(question.text)}`];

  return {
    narrative: body.join("\n\n"),
    meta: {
      mode: "model",
      model: LANGUAGE_MODEL,
      citations,
      dropped,
      flagged: [...new Set([...flagged, ...question.flagged])],
      reason: null,
    },
  };
}

// ---------------------------------------------------------------------------
// interpretation bundle drafting
// ---------------------------------------------------------------------------

export interface BundleSpec {
  key: string;
  family: string;
  transitBody: string;
  natalPoint: string;
}

export interface DraftedEntry {
  key: string;
  mechanism: string;
  question: string;
}

const BUNDLE_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          mechanism: { type: "string" },
          question: { type: "string" },
        },
        required: ["key", "mechanism", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["entries"],
  additionalProperties: false,
};

export interface DraftResult {
  entries: DraftedEntry[];
  model: string;
  dropped: number;
  flagged: string[];
}

export async function generateBundleEntries(specs: BundleSpec[]): Promise<DraftResult> {
  const wanted = new Set(specs.map((s) => s.key));
  const prompt = [
    "Each line below is an interpretation slot that needs reusable copy.",
    "A `hard` family means conjunction, square or opposition; `soft` means trine or sextile.",
    "A `*` means the slot is a catch-all for that position.",
    "",
    ...specs.map(
      (s) =>
        `${s.key} — ${s.family} aspect from transiting ${s.transitBody} to natal ${s.natalPoint}`,
    ),
    "",
    "For each slot return the exact key, a two-to-three sentence mechanism (what the contact is and what it tends to coincide with),",
    "and one reflection question. Copy is reused for every reader, so it must not mention dates, orbs or personal circumstances.",
  ].join("\n");

  const raw = await callGateway<{ entries: DraftedEntry[] }>(
    prompt,
    "bundle_entries",
    BUNDLE_SCHEMA,
  );

  const entries: DraftedEntry[] = [];
  const flagged: string[] = [];
  let dropped = 0;

  for (const e of raw.entries ?? []) {
    if (!wanted.has(e.key) || !e.mechanism?.trim() || !e.question?.trim()) {
      dropped += 1;
      continue;
    }
    const mech = safetyPass(e.mechanism.trim());
    const q = safetyPass(e.question.trim());
    flagged.push(...mech.flagged, ...q.flagged);
    entries.push({ key: e.key, mechanism: mech.text, question: q.text });
  }

  return {
    entries,
    model: LANGUAGE_MODEL,
    dropped,
    flagged: [...new Set(flagged)],
  };
}
