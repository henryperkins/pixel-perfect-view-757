/**
 * Language layer.
 *
 * The calculation is deterministic and stays that way. This module only
 * rewrites wording, and it works under three hard rules:
 *
 *   1. The model sees a fact block and nothing else — no birth details, no
 *      notes, no free text the reader wrote.
 *   2. Every paragraph must cite supplied fact ids. A daily draft fails as a
 *      whole when it breaks the daily guards; natal essays retain their own
 *      paragraph verification path. ID membership does not prove support.
 *   3. Wording passes DER-22 checks. Rejected daily drafts and gateway failures
 *      use labelled deterministic copy; their diagnostics retain only bounded
 *      codes and timings, never raw errors or generated text.
 */
import { safetyPass } from "../content/default-bundle";
import { normalizeDepth, normalizeTone } from "../reading.server";
import { assertDailyFactGraph, dailyFactBlock, factBlock, factIds, type FactAtom } from "./facts";
import { dailySystemVoice, dailyVoice } from "./daily-voice";
import { natalLensWordingProblem } from "../content/natal-lens-policy";
import type {
  EvaluationJsonValue,
  SyntheticReadingCandidate,
  SyntheticReadingRequest,
} from "./reading-evaluation.shared";
import {
  DAILY_DIAGNOSTICS_VERSION,
  DAILY_PROMPT_VERSION,
  DAILY_VALIDATOR_VERSION,
  DAILY_GATEWAY_TIMEOUT_MS,
  MAX_DAILY_DURATION_MS,
  LANGUAGE_MODEL,
  diagnosticLabel,
  type DailyDiagnostics,
  type DailyGatewayCode,
  type DailyRejectionCode,
} from "./diagnostics";
export { LANGUAGE_MODEL, DAILY_PROMPT_VERSION, DAILY_VALIDATOR_VERSION } from "./diagnostics";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
  diagnostics?: DailyDiagnostics;
}

export interface ReadingProse {
  headline: string;
  body: string;
  /** Exact validated boundaries; model text may contain internal blank lines. */
  paragraphs: string[];
  prompt: string;
  meta: LanguageMeta;
}

function templateMeta(reason: string): LanguageMeta {
  return { mode: "template", model: null, citations: [], dropped: 0, flagged: [], reason };
}

interface JsonSchemaObject extends Record<string, EvaluationJsonValue> {
  type: "object";
  properties: Record<string, EvaluationJsonValue>;
  required: string[];
  additionalProperties: false;
}

interface SyntheticObservation {
  request(value: SyntheticReadingRequest): void;
  candidate(value: unknown): void;
}

/** Fixed boundary failures never retain response bodies or exception messages. */
class GatewayUnavailable extends Error {
  constructor(readonly code: DailyGatewayCode) {
    super(diagnosticLabel(code));
  }
}
function gatewayFailure(error: unknown, signal?: AbortSignal): GatewayUnavailable {
  if (error instanceof GatewayUnavailable) return error;
  const name = error && typeof error === "object" && "name" in error ? error.name : null;
  if (signal?.aborted || name === "TimeoutError" || name === "AbortError")
    return new GatewayUnavailable("timeout");
  return new GatewayUnavailable(error instanceof SyntaxError ? "bad_json" : "network");
}

/** One gateway call returning a strict-schema JSON object, or a safe closed failure. */
async function callGateway<T>(
  user: string,
  schemaName: string,
  schema: JsonSchemaObject,
  timeoutMs = 90000,
  observation?: SyntheticObservation,
  system: string = VOICE,
): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayUnavailable("not_configured");
  const signal = AbortSignal.timeout(timeoutMs);
  const request: SyntheticReadingRequest = {
    model: LANGUAGE_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema },
    },
  };
  observation?.request(structuredClone(request));
  let res: Response;
  try {
    res = await fetch(GATEWAY, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
  if (!res.ok) {
    const code: DailyGatewayCode =
      res.status === 429
        ? "rate_limit"
        : res.status === 402
          ? "credit"
          : res.status === 401 || res.status === 403
            ? "auth"
            : res.status === 408 || res.status === 504
              ? "timeout"
              : "http";
    throw new GatewayUnavailable(code);
  }
  let payload: { choices?: { message?: { content?: string } }[] } | null;
  try {
    payload = await res.json();
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new GatewayUnavailable("empty_response");
  try {
    const parsed = JSON.parse(content) as T;
    observation?.candidate(parsed);
    return parsed;
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
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
      minItems: 2,
      maxItems: 4,
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

interface DailyProblem {
  code: DailyRejectionCode;
  reason: string;
  paragraph: number | null;
}
function rejection(code: DailyRejectionCode, reason: string): DailyProblem {
  return { code, reason, paragraph: null };
}

/** Noun-like chart shorthand, without rejecting adjectival 'your rising workload'. */
function mentionsRisingAngle(text: string): boolean {
  return (
    /\brising\s+(?:sign|placement|ruler|degree|cusp)\b|\b(?:natal|birth|chart)\s+rising\b|\b(?:your|the|my|our|their|its)\s+rising(?:['’]s\b|\s*(?:[.,;:!?—–]|$)|\s+(?:is|was|can|could|may|might|would|will|does|has|adds?|shapes?|describes?|defines?|sets?|reflects?|suggests?|indicates?|represents?|influences?|affects?|means?|speaks?)\b)/i.test(
      text,
    ) ||
    new RegExp(
      `\\brising\\s+(?:and|or)\\s+(?:(?:your|the|natal)\\s+)?(${BODY_NAMES})\\b`,
      "i",
    ).test(text)
  );
}

/** A structural clarity rule: a current measurement cannot share an exact-time sentence. */
function dailyTimingProblem(sentences: string[]): DailyProblem | null {
  const orbReference = /\borb\b|-?\d+(?:\.\d+)?\s*-?\s*(?:°|degrees?\b)/i;
  const exactTiming =
    /\b\d{4}-\d{2}-\d{2}\b|\bexact\s+(?:on|in|at|today|tomorrow|yesterday|date|pass|alignment|contact|timing|moment|point|instant)\b|\bexact\s+\d+\s+days?\s+ago\b|\b(?:is|was|becomes?|became|reaches?|reached|be|being)\s+exact\b/i;
  const exactAspect = new RegExp(`\\bexact\\s+(?:${ASPECT_NAMES})\\b`, "i");
  if (
    sentences.some(
      (sentence) =>
        orbReference.test(sentence) && (exactTiming.test(sentence) || exactAspect.test(sentence)),
    )
  )
    return rejection(
      "timing",
      "draft must separate current orb and exact timing into different sentences",
    );
  return null;
}

/** Bounded contradiction checks: IDs and lexical references cannot prove arbitrary prose. */
function dailyReferenceProblem(
  text: string,
  cited: FactAtom[],
  suppression: ReadingProseInput["suppression"],
): DailyProblem | null {
  if (
    suppression.angles &&
    (/\b(ascendant|descendant|midheaven|imum coeli|rising sign|asc|mc|ic)\b/i.test(text) ||
      mentionsRisingAngle(text))
  )
    return rejection("suppression", "draft contains suppressed angle wording");
  if (suppression.houses && /\b(houses?|cusps?)\b/i.test(text))
    return rejection("suppression", "draft contains suppressed house wording");
  if (SIGNS.test(text) || HOUSE_PLACEMENT.test(text))
    return rejection("placement", "draft contains a placement absent from daily facts");
  if (
    new RegExp(
      `\\b(?:natal|birth)\\s+(?:${BODY_NAMES})\\s+(?:(?:is|forms?|makes?|a|an)\\s+){0,3}(?:${ASPECT_NAMES})\\s+(?:(?:to|with|your|the)\\s+){0,3}(?:natal|birth)\\s+(?:${BODY_NAMES})\\b`,
      "i",
    ).test(text)
  )
    return rejection("placement", "draft contains an unsupported natal aspect");
  const cycles = cited.flatMap((f) => (f.cycle ? [f.cycle] : []));
  const bodies = new Set(
    cycles.flatMap((c) => [canonicalBody(c.transitBody), canonicalBody(c.natalPoint)]),
  );
  if (mentionsRisingAngle(text) && !bodies.has("ascendant"))
    return rejection("body", "draft names an angle absent from its cited cycles");
  for (const match of text.matchAll(new RegExp(`\\b(${BODY_NAMES})\\b`, "gi"))) {
    if (!bodies.has(canonicalBody(match[0])))
      return rejection("body", "draft names a body absent from its cited cycles");
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
      return rejection("relation", "draft contradicts its cited body/aspect relation");
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
      return rejection("relation", "draft contradicts its cited body/aspect relation");
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
      return rejection("worded_degree", "draft contains an uncheckable worded degree value");
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
      return rejection("orb", "draft contains an orb absent from its cited cycles");
  }
  for (const match of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)) {
    if (!cycles.some((c) => c.exactDate === match[0]))
      return rejection("date", "draft contains a date absent from its cited cycles");
  }
  return null;
}

function dailyDraft(
  raw: unknown,
  input: ReadingProseInput,
): { body: string; paragraphs: string[]; citations: Citation[] } | DailyProblem {
  if (
    !raw ||
    typeof raw !== "object" ||
    !Array.isArray((raw as { paragraphs?: unknown }).paragraphs)
  )
    return rejection("shape", "draft has malformed paragraph data");
  const paragraphs = (raw as { paragraphs: unknown[] }).paragraphs;
  if (paragraphs.length < 2 || paragraphs.length > 4)
    return rejection("count", "draft must contain two to four paragraphs");
  const byId = new Map(input.facts.map((f) => [f.id, f]));
  const kept: string[] = [],
    citations: Citation[] = [];
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  let words = 0;
  for (const [index, paragraph] of paragraphs.entries()) {
    const rejectParagraph = (code: DailyRejectionCode, reason: string): DailyProblem => ({
      code,
      reason,
      paragraph: index + 1,
    });
    if (!paragraph || typeof paragraph !== "object")
      return rejectParagraph("shape", "draft has malformed paragraph data");
    const p = paragraph as { text?: unknown; facts?: unknown };
    if (
      typeof p.text !== "string" ||
      !p.text.trim() ||
      !Array.isArray(p.facts) ||
      !p.facts.length ||
      p.facts.some((id) => typeof id !== "string" || !byId.has(id))
    )
      return rejectParagraph("id", "draft failed supplied-ID validation");
    const text = p.text.trim();
    const sentences = [...segmenter.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
    if (
      sentences.length < 1 ||
      sentences.length > 4 ||
      sentences.some((s) => !/[.!?]["')\]]*$/.test(s))
    )
      return rejectParagraph(
        "sentence",
        "draft paragraphs must contain one to four complete sentences",
      );
    const count = text.split(/\s+/).length;
    words += count;
    if (count > 200 || words > 700 || text.length > 1600)
      return rejectParagraph("length", "draft exceeds the daily length limit");
    if (safetyPass(text).flagged.length)
      return rejectParagraph("safety", "draft failed the language safety check");
    if (byId.has("N1") && natalLensWordingProblem(text))
      return rejectParagraph("natal_claim", "draft asserts natal certainty or a clinical claim");
    const ids = [...new Set(p.facts as string[])];
    if (ids.includes("S1") && !byId.get("S1")!.dependsOn!.every((id) => ids.includes(id)))
      return rejectParagraph("dependencies", "draft omitted published synthesis parent references");
    if (ids.includes("N1") && !["C1", "I1"].every((id) => ids.includes(id)))
      return rejectParagraph("dependencies", "draft omitted natal lens parent references");
    const problem =
      dailyReferenceProblem(
        text,
        ids.map((id) => byId.get(id)!),
        input.suppression,
      ) ?? dailyTimingProblem(sentences);
    if (problem) return { ...problem, paragraph: index + 1 };
    kept.push(text);
    citations.push({ paragraph: kept.length, facts: ids });
  }
  if (!citations[0]?.facts.includes("C1") || !citations[0]?.facts.includes("I1"))
    return rejection("coverage", "draft failed strongest-cycle and interpretation ID coverage");
  if (byId.has("S1") && !citations.slice(0, 2).some((citation) => citation.facts.includes("S1")))
    return rejection(
      "synthesis_coverage",
      "draft omitted published synthesis from its first two paragraphs",
    );
  if (byId.has("N1") && !citations.slice(0, 2).some((c) => c.facts.includes("N1")))
    return rejection("natal_coverage", "draft omitted natal lens from its first two paragraphs");
  return { body: kept.join("\n\n"), paragraphs: kept, citations };
}

function dailyDiagnostics(
  outcome: DailyDiagnostics["outcome"],
  code: DailyDiagnostics["code"],
  started: number | null,
  paragraph: number | null = null,
): DailyDiagnostics {
  return {
    version: DAILY_DIAGNOSTICS_VERSION,
    promptVersion: DAILY_PROMPT_VERSION,
    validatorVersion: DAILY_VALIDATOR_VERSION,
    model: LANGUAGE_MODEL,
    gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
    outcome,
    attempted: started !== null,
    code,
    durationMs:
      started === null
        ? null
        : Math.min(MAX_DAILY_DURATION_MS, Math.max(0, Math.round(performance.now() - started))),
    paragraph,
  };
}

async function generateDailyProse(
  input: ReadingProseInput,
  observation?: SyntheticObservation,
): Promise<ReadingProse> {
  const { fallback } = input;
  assertDailyFactGraph(input.facts);
  if (!input.hasEligibleCycles || !input.facts.some((f) => f.id === "C1" && f.cycle))
    return {
      ...fallback,
      paragraphs: fallback.body.split("\n\n"),
      meta: {
        ...templateMeta("no eligible cycle to write from"),
        diagnostics: dailyDiagnostics("skipped", "no_cycle", null),
      },
    };
  if (!input.facts.some((f) => f.id === "I1"))
    return {
      ...fallback,
      paragraphs: fallback.body.split("\n\n"),
      meta: {
        ...templateMeta(diagnosticLabel("no_interpretation")),
        diagnostics: dailyDiagnostics("skipped", "no_interpretation", null),
      },
    };
  const timingCitationIds = [
    "C1",
    ...["P1", "T1"].filter((id) => input.facts.some((fact) => fact.id === id)),
  ];
  // Natal instructions appear only with N1, so a reading without a lens sends the
  // same request as before natal lenses existed.
  const hasNatalLens = input.facts.some((f) => f.id === "N1");
  const prompt = [
    dailyVoice(normalizeTone(input.tone), normalizeDepth(input.depth)),
    "Facts:",
    dailyFactBlock(input.facts),
    "",
    "Rewrite only the astronomical body of today's reading, using the supplied published interpretation, domain and phase wording.",
    "Keep each paragraph under 200 words and the whole body under 700 words.",
    "The first paragraph must concern the strongest eligible cycle and cite C1 and I1. D1, P1 and T1 are optional: cite them in any paragraph that uses their domain, phase or timing claims, and leave them out when unused.",
    input.facts.some((f) => f.id === "S1")
      ? 'Develop the supplied published relationship in paragraph 1 or 2. Every paragraph using S1 must explicitly cite all five IDs: "facts": ["S1", "C1", "I1", "C2", "I2"]. The relationship is editorial interpretation, not an established personal state. Keep its qualifications: "can increase" stays "can increase", not "increases". For a reinforcement relationship, give the paragraphs distinct functions: one develops the sustained commitment and the other the targeted action that S1 joins to it; then add only supported useful detail and stop. Do not restate the same progress or persistence idea in two paragraphs. Clear published wording may be kept, and no new scene is needed for variety.'
      : "Keep C1 as the primary focus. No S1 is supplied: do not invent a joint relationship or premise. I2 and I3 may offer separately supported context without connecting the contacts into a new story.",
    hasNatalLens
      ? 'Apply the supplied N1 possibility to the primary meaning with one practical distinction in paragraph 1 or 2. Every paragraph using it must cite ["N1", "C1", "I1"]. Keep it conditional and recognizable or rejectable, never a confirmed identity, biological explanation or lived event. N1 and S1 may share a paragraph with all parents; do not add a personality section. N1 does not authorize a natal body, sign, house, aspect or other geometry.'
      : "",
    "Cite the supplied IDs each paragraph rests on. This is reference coverage, not permission to invent astronomical facts.",
    "Any paragraph naming a planet, aspect, orb or ISO exact date must cite the matching calculated cycle ID (C1, C2 or C3), even when it repeats a number from T1. Editorial IDs I1, I2, I3, S1, D1, P1 and T1 cannot replace that cycle citation.",
    `For a paragraph using the strongest cycle's supplied phase and timing wording, include its cycle alongside the relevant editorial references: "facts": [${timingCitationIds.map((id) => JSON.stringify(id)).join(", ")}]. Cite only IDs and values supplied above.`,
    "Do not write a headline, reflection question, local-time context or wellbeing framing; those are provided separately.",
    "Do not introduce sign or individual house placements. Quote orb degrees as digit literals and ISO dates only when present in a cycle cited by that paragraph.",
    "An orb is the angular deviation from the named aspect measured at this reading's calculation time; the calculated exact date is a separate calendar estimate. If using both, put the current orb and any exact date or relative exact timing in separate sentences. Never attach the current orb to the future or past exact pass. Do not infer an exact date from the phase label when the facts say no exact date was found.",
    input.suppression.angles
      ? "Angle claims are suppressed: do not mention Ascendant, rising sign (including shorthand such as 'your rising'), Midheaven or other angles."
      : "",
    input.suppression.houses ? "House claims are suppressed: do not mention houses or cusps." : "",
    "Do not repeat calculation caveats; the app appends them separately.",
  ]
    .filter(Boolean)
    .join("\n");
  let raw: unknown;
  const started = performance.now();
  try {
    raw = await callGateway(
      prompt,
      "daily_reading",
      READING_SCHEMA,
      DAILY_GATEWAY_TIMEOUT_MS,
      observation,
      dailySystemVoice(hasNatalLens),
    );
  } catch (error) {
    const failure = gatewayFailure(error);
    return {
      ...fallback,
      paragraphs: fallback.body.split("\n\n"),
      meta: {
        ...templateMeta(diagnosticLabel(failure.code)),
        diagnostics: dailyDiagnostics(
          "unavailable",
          failure.code,
          failure.code === "not_configured" ? null : started,
        ),
      },
    };
  }
  const result = dailyDraft(raw, input);
  if ("code" in result)
    return {
      ...fallback,
      paragraphs: fallback.body.split("\n\n"),
      meta: {
        ...templateMeta(result.reason),
        diagnostics: dailyDiagnostics("rejected", result.code, started, result.paragraph),
      },
    };
  return {
    headline: fallback.headline,
    body: result.body,
    paragraphs: result.paragraphs,
    prompt: fallback.prompt,
    meta: {
      mode: "model",
      model: LANGUAGE_MODEL,
      citations: result.citations,
      dropped: 0,
      flagged: [],
      reason: null,
      diagnostics: dailyDiagnostics("accepted", "accepted", started),
    },
  };
}

/** Production readings expose only the established prose/diagnostics contract. */
export async function generateReadingProse(input: ReadingProseInput): Promise<ReadingProse> {
  return generateDailyProse(input);
}

/** Only whitelisted, bounded paragraph fields are retained for fixed synthetic evaluations. */
function captureSyntheticCandidate(raw: unknown): SyntheticReadingCandidate | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const paragraphs = (raw as { paragraphs?: unknown }).paragraphs;
  if (!Array.isArray(paragraphs)) return null;
  let truncated = paragraphs.length > 10;
  const captured = paragraphs.slice(0, 10).map((paragraph) => {
    const value =
      paragraph && typeof paragraph === "object" && !Array.isArray(paragraph)
        ? (paragraph as { text?: unknown; facts?: unknown })
        : {};
    const text = typeof value.text === "string" ? value.text.slice(0, 4000) : null;
    if (typeof value.text === "string" && value.text.length > 4000) truncated = true;
    const rawFacts = Array.isArray(value.facts) ? value.facts : [];
    if (rawFacts.length > 20) truncated = true;
    const facts = rawFacts
      .slice(0, 20)
      .filter((fact): fact is string => typeof fact === "string")
      .map((fact) => {
        if (fact.length > 80) truncated = true;
        return fact.slice(0, 80);
      });
    return { text, facts };
  });
  return { paragraphs: captured, paragraphCount: paragraphs.length, truncated };
}

/** Server-only seam used by the closed, checked-in synthetic case runner. Never used by Today. */
export async function generateSyntheticReadingProse(input: ReadingProseInput): Promise<{
  prose: ReadingProse;
  request: SyntheticReadingRequest | null;
  candidate: SyntheticReadingCandidate | null;
}> {
  let request: SyntheticReadingRequest | null = null;
  let candidate: SyntheticReadingCandidate | null = null;
  const prose = await generateDailyProse(input, {
    request(value) {
      request = value;
    },
    candidate(value) {
      candidate = captureSyntheticCandidate(value);
    },
  });
  return { prose, request, candidate };
}

// ---------------------------------------------------------------------------
// natal chapter narratives
// ---------------------------------------------------------------------------

export interface FeatureProse {
  narrative: string;
  /** Verified JSON paragraph boundaries, including the separate reflection. */
  paragraphs: string[];
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
      items: (READING_SCHEMA.properties["paragraphs"] as { items: EvaluationJsonValue }).items,
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
    return { narrative: "", paragraphs: [], meta: templateMeta((e as Error).message) };
  }

  const { kept, citations, dropped, flagged } = verify(raw.paragraphs ?? [], factIds(input.facts));
  if (kept.length === 0) {
    return {
      narrative: "",
      paragraphs: [],
      meta: templateMeta("generated narrative failed fact verification"),
    };
  }

  const question = safetyPass(chapterReflection(raw.reflection_question));
  const body = [...kept, `Something to sit with: ${chapterReflection(question.text)}`];

  return {
    narrative: body.join("\n\n"),
    paragraphs: body,
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
