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
): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("language layer is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
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
    raw = await callGateway(prompt, "daily_reading", READING_SCHEMA);
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
    `Write two paragraphs about the natal structure "${input.title}".`,
    "Describe what the structure is, mechanically, and what it tends to look like in ordinary life.",
    "It is a lifelong structure, not an event: do not date it and do not predict from it.",
    "Cite fact ids per paragraph.",
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

  return {
    narrative: kept.join("\n\n"),
    meta: {
      mode: "model",
      model: LANGUAGE_MODEL,
      citations,
      dropped,
      flagged: [...new Set(flagged)],
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
