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
 * Keeps only paragraphs whose citations are all real, then runs the safety
 * pass. Returns the surviving paragraphs plus what was thrown away.
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
  tone: string;
  depth: string;
  fallback: { headline: string; body: string; prompt: string };
}

const READING_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    headline: { type: "string" },
    prompt: { type: "string" },
    paragraphs: {
      type: "array",
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
  required: ["headline", "prompt", "paragraphs"],
  additionalProperties: false,
};

export async function generateReadingProse(
  input: ReadingProseInput,
): Promise<ReadingProse> {
  const { fallback } = input;
  if (input.facts.length === 0) {
    return { ...fallback, meta: templateMeta("no facts to write from") };
  }

  const prompt = [
    `Tone preference: ${input.tone}. Depth preference: ${input.depth}.`,
    "Facts:",
    factBlock(input.facts),
    "",
    "Write today's reading: a short headline (no more than nine words, no punctuation at the end),",
    "three to five paragraphs of two to four sentences each, and one reflection question.",
    "The first paragraph must be about the strongest cycle fact. Cite fact ids per paragraph.",
    "The reflection question must be answerable by the reader about their own day.",
  ].join("\n");

  let raw: { headline: string; prompt: string; paragraphs: Written[] };
  try {
    // Today must not hang: past 12s the template reading is served instead.
    raw = await callGateway(prompt, "daily_reading", READING_SCHEMA, 12000);
  } catch (e) {
    return { ...fallback, meta: templateMeta((e as Error).message) };
  }

  const allowed = factIds(input.facts);
  const { kept, citations, dropped, flagged } = verify(raw.paragraphs ?? [], allowed);
  if (kept.length < 2) {
    return {
      ...fallback,
      meta: templateMeta(
        `generated prose failed fact verification (${dropped} paragraph(s) unsupported)`,
      ),
    };
  }

  const headline = safetyPass((raw.headline ?? "").trim() || fallback.headline);
  const question = safetyPass((raw.prompt ?? "").trim() || fallback.prompt);

  return {
    headline: headline.text,
    body: kept.join("\n\n"),
    prompt: question.text,
    meta: {
      mode: "model",
      model: LANGUAGE_MODEL,
      citations,
      dropped,
      flagged: [...new Set([...flagged, ...headline.flagged, ...question.flagged])],
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
export const FEATURE_ESSAY_VERSION = "essay-5";

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
    "Finish with one reflection question the reader could actually answer about their own life.",
  ].join("\n");

  let raw: { headline: string; prompt: string; paragraphs: Written[] };
  try {
    raw = await callGateway(prompt, "natal_chapter", READING_SCHEMA);
  } catch (e) {
    return { narrative: "", meta: templateMeta((e as Error).message) };
  }

  const { kept, citations, dropped, flagged } = verify(
    raw.paragraphs ?? [],
    factIds(input.facts),
  );
  if (kept.length === 0) {
    return {
      narrative: "",
      meta: templateMeta("generated narrative failed fact verification"),
    };
  }

  const question = safetyPass((raw.prompt ?? "").trim());
  const body = question.text
    ? [...kept, `Something to sit with: ${question.text}`]
    : kept;

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
