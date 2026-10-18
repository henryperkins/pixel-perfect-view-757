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
import {
  assertDailyFactGraph,
  dailyFactBlock,
  dailyEditorialReferences,
  factBlock,
  factIds,
  type FactAtom,
} from "./facts";
import { storyParagraphProblem, storyCoverageProblem } from "./transit-story-facts";
import {
  CONTEXT_DAILY_PROMPT_VERSION,
  CONTEXT_DAILY_VALIDATOR_VERSION,
  dailyContextPrompt,
  dailyContextSystemVoice,
  toDailyContextBrief,
} from "./daily-context-writing";
import {
  prepareDailyContextCandidate,
  type DailyContextBenchmark,
} from "./daily-context-candidate.server";
import { memberContextMode, prepareMemberContextReading } from "./member-context-reading";
import {
  dailySystemVoice,
  dailyVoice,
  DAILY_VOICE_EXAMPLES,
  dailyEditorialSystemVoice,
  dailyEditorialVoice,
  EDITORIAL_DAILY_VOICE_EXAMPLE,
  EDITORIAL_DAILY_PROMPT_VERSION,
  EDITORIAL_DAILY_VALIDATOR_VERSION,
} from "./daily-voice";
import {
  assertDailyWritingBrief,
  toDailyWritingBrief,
  type DailyWritingPlan,
} from "../content/daily-writing";
import type { DailyWritingTemplate } from "../content/daily-writing-template";
import {
  checkDailyWritingQuality,
  writingNotEvaluated,
  type DailyWritingParagraph,
  type DailyWritingQualityReport,
  type DailyWritingRenderMode,
  type RecentDailyBody,
} from "./daily-writing-quality";
import {
  createAdminTransportTrace,
  assertSyntheticTransportControl,
  type AdminTransportRecorder,
  type AdminTransportTrace,
  type SyntheticTransportControl,
} from "./admin-transport";
import { dropsSourceModality } from "./daily-modality";
import { createMemberDailyTransport, type MemberDailyTransport } from "./member-transport";
import { dailyContextClaimProblem, dailyContextRepeatProblem } from "./daily-context-claims";
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
  CONCRETE_DAILY_PROMPT_VERSION,
  CONCRETE_DAILY_VALIDATOR_VERSION,
  DAILY_GATEWAY_TIMEOUT_MS,
  MAX_DAILY_DURATION_MS,
  GEMINI_ENTERPRISE_MODEL,
  LANGUAGE_PROVIDERS,
  LANGUAGE_PROVIDER_LABELS,
  diagnosticLabel,
  languageModel,
  type DailyDiagnostics,
  type DailyGatewayCode,
  type DailyRejectionCode,
  type LanguageProvider,
} from "./diagnostics";
export { LANGUAGE_MODEL, DAILY_PROMPT_VERSION, DAILY_VALIDATOR_VERSION } from "./diagnostics";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
/** Agent Platform (formerly Vertex AI) global endpoint; the key's bound service account selects the project. */
const GEMINI_ENTERPRISE = `https://aiplatform.googleapis.com/v1/publishers/google/models/${GEMINI_ENTERPRISE_MODEL}:generateContent`;

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
  writing?: {
    renderMode: DailyWritingRenderMode;
    reason: "template_editorial_failure" | null;
    sceneUse: { id: "SC1" | "SC2"; paragraph: number }[];
    candidateQuality: DailyWritingQualityReport;
    finalQuality: DailyWritingQualityReport;
  };
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
  transport?(value: AdminTransportTrace): void;
  request(value: SyntheticReadingRequest): void;
  candidate(value: unknown): void;
}

type GatewayTransportRecorder = Pick<AdminTransportRecorder, "headers" | "body" | "payload"> & {
  kind?: "member";
};

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

function statusFailure(status: number): DailyGatewayCode {
  return status === 429
    ? "rate_limit"
    : status === 402
      ? "credit"
      : status === 401 || status === 403
        ? "auth"
        : status === 408 || status === 504
          ? "timeout"
          : "http";
}

function providerKey(provider: LanguageProvider): string | undefined {
  return provider === "gemini-enterprise"
    ? process.env["GEMINI_ENTERPRISE_API_KEY"]
    : process.env["LOVABLE_API_KEY"];
}

/** Choose once before a member request. A failed request never retries another provider. */
export function memberLanguageProvider(): LanguageProvider {
  const selected = process.env["PATTERN_MEMBER_LANGUAGE_PROVIDER"];
  if (selected === "lovable" || selected === "gemini-enterprise") return selected;
  if (selected) throw new Error("The member language provider is not configured correctly.");
  return providerKey("gemini-enterprise") ? "gemini-enterprise" : "lovable";
}

/** Configuration presence only; key values never leave the server. */
export function languageProviderStatus() {
  return LANGUAGE_PROVIDERS.map((id) => ({
    id,
    label: LANGUAGE_PROVIDER_LABELS[id],
    model: languageModel(id),
    configured: Boolean(providerKey(id)),
  }));
}

/** Lovable AI gateway: OpenAI-compatible chat completions. */
async function lovableContent(
  request: SyntheticReadingRequest,
  key: string,
  signal: AbortSignal,
  recorder?: GatewayTransportRecorder,
): Promise<string> {
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
  recorder?.headers(res);
  if (!res.ok) throw new GatewayUnavailable(statusFailure(res.status));
  let payload: { choices?: { message?: { content?: string } }[] } | null;
  try {
    payload = await transportJson(res, recorder);
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
  recorder?.payload(payload);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new GatewayUnavailable("empty_response");
  return content;
}

/** Reads only Google's bounded error status and reasons, so a bad key or billing stops admin runs. */
async function transportJson(res: Response, recorder?: GatewayTransportRecorder) {
  if (!recorder || recorder.kind === "member") {
    try {
      const payload = await res.json();
      recorder?.body();
      return payload;
    } catch (error) {
      // A parse error means the response body arrived, even though it was not valid JSON.
      if (error instanceof SyntaxError) recorder?.body();
      throw error;
    }
  }
  const raw = await res.text();
  recorder.body();
  return JSON.parse(raw);
}

async function geminiEnterpriseFailure(
  res: Response,
  recorder?: GatewayTransportRecorder,
): Promise<DailyGatewayCode> {
  let reasons: unknown[] = [];
  try {
    const error = (
      (await transportJson(res, recorder)) as {
        error?: { status?: unknown; details?: unknown };
      } | null
    )?.error;
    const details: unknown[] = Array.isArray(error?.details) ? error.details : [];
    reasons = [
      error?.status,
      ...details.map((detail) =>
        detail && typeof detail === "object" ? (detail as { reason?: unknown }).reason : null,
      ),
    ];
  } catch {
    // The HTTP status alone classifies an unreadable error body.
  }
  if (reasons.includes("BILLING_DISABLED")) return "credit";
  if (
    ["API_KEY_INVALID", "UNAUTHENTICATED", "PERMISSION_DENIED", "SERVICE_DISABLED"].some((reason) =>
      reasons.includes(reason),
    )
  )
    return "auth";
  return statusFailure(res.status);
}

/** Gemini Enterprise generateContent with the same system text, user text and JSON schema. */
async function geminiEnterpriseContent(
  system: string,
  user: string,
  schema: JsonSchemaObject,
  key: string,
  signal: AbortSignal,
  recorder?: GatewayTransportRecorder,
  control: SyntheticTransportControl = {},
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(GEMINI_ENTERPRISE, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          ...(control.enterpriseThinking
            ? { thinkingConfig: { thinkingLevel: control.enterpriseThinking } }
            : {}),
          ...(control.boundedQualification ? { maxOutputTokens: 65536 } : {}),
        },
      }),
    });
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
  recorder?.headers(res);
  if (!res.ok) throw new GatewayUnavailable(await geminiEnterpriseFailure(res, recorder));
  let payload: { candidates?: { content?: { parts?: unknown } }[] } | null;
  try {
    payload = await transportJson(res, recorder);
  } catch (error) {
    throw gatewayFailure(error, signal);
  }
  recorder?.payload(payload);
  const parts = payload?.candidates?.[0]?.content?.parts;
  // Thought summaries are not draft text.
  const content = (Array.isArray(parts) ? parts : [])
    .flatMap((part: { text?: unknown; thought?: unknown } | null) =>
      part?.thought !== true && typeof part?.text === "string" ? [part.text] : [],
    )
    .join("");
  if (!content) throw new GatewayUnavailable("empty_response");
  return content;
}

interface GatewayOptions {
  timeoutMs?: number;
  observation?: SyntheticObservation | undefined;
  system?: string;
  provider?: LanguageProvider;
  control?: SyntheticTransportControl;
  memberTransport?: ((trace: MemberDailyTransport) => void) | undefined;
}

/** One provider call returning a strict-schema JSON object, or a safe closed failure. */
async function callGateway<T>(
  user: string,
  schemaName: string,
  schema: JsonSchemaObject,
  {
    timeoutMs = 90000,
    observation,
    system = VOICE,
    provider = "lovable",
    control = {},
    memberTransport,
  }: GatewayOptions = {},
): Promise<T> {
  assertSyntheticTransportControl(provider, control);
  const key = providerKey(provider);
  if (!key) throw new GatewayUnavailable("not_configured");
  const signal = AbortSignal.timeout(timeoutMs);
  // Gemini Enterprise receives these same messages and schema in its native shape.
  const request: SyntheticReadingRequest = {
    model: languageModel(provider),
    ...(control.boundedQualification ? { max_tokens: 65536 } : {}),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema },
    },
  };
  if (control.boundedQualification && Buffer.byteLength(JSON.stringify(request), "utf8") > 65536)
    throw new GatewayUnavailable("request_limit");
  observation?.request(structuredClone(request));
  const adminRecorder = observation?.transport
    ? createAdminTransportTrace(provider, request.model, timeoutMs, control, signal)
    : undefined;
  const memberRecorder = memberTransport
    ? createMemberDailyTransport(
        provider,
        request.model,
        timeoutMs,
        signal,
        control.enterpriseThinking ?? null,
      )
    : undefined;
  const recorder = adminRecorder ?? memberRecorder;
  try {
    const content =
      provider === "gemini-enterprise"
        ? await geminiEnterpriseContent(system, user, schema, key, signal, recorder, control)
        : await lovableContent(request, key, signal, recorder);
    try {
      const parsed = JSON.parse(content) as T;
      observation?.candidate(parsed);
      return parsed;
    } catch (error) {
      throw gatewayFailure(error, signal);
    }
  } finally {
    if (adminRecorder) observation?.transport?.(adminRecorder.finish());
    if (memberRecorder) memberTransport?.(memberRecorder.finish());
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
  /** Presence opts into a versioned writing plan; recent text is consumed locally only. */
  writing?: {
    plan: DailyWritingPlan;
    template: DailyWritingTemplate;
    minimalTemplate: DailyWritingTemplate;
    recent: RecentDailyBody[];
  };
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
const CONCRETE_READING_SCHEMA: JsonSchemaObject = {
  ...READING_SCHEMA,
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
          scenes: { type: "array", maxItems: 2, uniqueItems: true, items: { type: "string" } },
        },
        required: ["text", "facts", "scenes"],
        additionalProperties: false,
      },
    },
  },
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
  const windowPosition =
    /\b(?:start|middle|later|early|late|opening|closing)(?:\s+(?:part|portion|section))?\s+of\s+(?:the\s+)?(?:calculated\s+)?window\b/i;
  if (
    sentences.some(
      (sentence) =>
        (orbReference.test(sentence) || windowPosition.test(sentence)) &&
        (exactTiming.test(sentence) || exactAspect.test(sentence)),
    )
  )
    return rejection(
      "timing",
      "draft must separate current orb/window position and exact timing into different sentences",
    );
  return null;
}

/** A bounded style guard, not a claim that supplied technical details are false. */
function editorialDetailProblem(sentences: string[]): boolean {
  const contact = `(?:${BODY_NAMES}|${ASPECT_NAMES}|contact|aspect)`;
  // Phase words must describe a contact directly. A sentence can name Neptune
  // while separating an impression from a story without reporting a phase.
  const contactPhase = new RegExp(
    `\\b${contact}\\s+(?:is|was|remains?|becomes?|became)\\s+(?:currently\\s+)?(?:applying|separating|exact|approaching\\s+exactness)\\b|\\b${contact}\\s+(?:separates|applies)\\s+(?:from|to)\\b|\\b(?:applying|separating|exact)\\s+(?:${ASPECT_NAMES}|contact|aspect)\\b|\\b(?:applying|separating)\\s+phase\\b|\\bphase\\s*[:=]?\\s*(?:applying|separating)\\b`,
    "i",
  );
  return sentences.some(
    (sentence) =>
      /\borbs?\b|\b\d+(?:\.\d+)?\s*-?\s*(?:°|degrees?\b)|\b\d{4}-\d{2}-\d{2}\b|\bcalculated\s+window\b|\bexact\s+(?:date|pass|timing)\b/i.test(
        sentence,
      ) || contactPhase.test(sentence),
  );
}

/** Observed source-specific contradictions only; this is not a semantic verifier. */
function dailyEditorialProblem(sentences: string[], cited: FactAtom[]): DailyProblem | null {
  const text = sentences.join(" ");
  if (dropsSourceModality(sentences, cited))
    return rejection(
      "editorial_claim",
      "draft drops a possibility qualifier from a supplied claim",
    );
  if (
    cited.some((fact) => fact.cycle) &&
    sentences.some(
      (sentence) =>
        /\b(?:in|across)\s+the\s+(?:current\s+)?sky\b/i.test(sentence) &&
        new RegExp(`\\b(?:${ASPECT_NAMES})\\b`, "i").test(sentence) &&
        [...sentence.matchAll(new RegExp(`\\b(?:${BODY_NAMES})\\b`, "gi"))].length >= 2 &&
        !/\b(?:natal|birth)\b/i.test(sentence),
    )
  )
    return rejection(
      "relation",
      "draft replaces a transit-to-natal contact with current-sky geometry",
    );
  if (
    cited.some(
      (fact) => fact.id === "D1" && /the part of a task that feels like yours/.test(fact.statement),
    ) &&
    /\b(?:which|the)\s+part\s+of\s+(?:a|the|your)\s+task\s+(?:actually\s+)?is\s+yours\b/i.test(text)
  )
    return rejection(
      "editorial_claim",
      "draft turns subjective ownership into an objective allocation",
    );
  const freedom =
    "Published natal lens, an interpretive possibility: Wanting room to move can be part of a response to pressure. If an ordinary obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.";
  if (
    cited.some((fact) => fact.id === "N1" && fact.statement === freedom) &&
    /\b(?:mentally\s+)?(?:track(?:ing)?|keeping\s+track)[^.!?]{0,100}\b(?:makes?|causes?|renders?)[^.!?]{0,50}\bobligation[^.!?]{0,30}\b(?:narrow|confining|restrictive)\b/i.test(
      text,
    )
  )
    return rejection(
      "editorial_claim",
      "draft makes a supplied scene cause the natal lens condition",
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

/**
 * Known context-pilot regression only: the supplied role-pressure meaning does
 * not establish this recent change in a reader's life. A conditional must be
 * in the same clause; a modal in an earlier sentence cannot qualify it. This
 * lexical guard does not establish semantic support for other personal claims.
 */
function contextRecentOnsetClaim(sentences: string[]): boolean {
  return sentences.some((sentence) => {
    const claim = /\bexpectations have begun to outpace your available capacity\b/i.exec(sentence);
    if (!claim) return false;
    const prefix =
      sentence
        .slice(0, claim.index)
        .split(/[,;:]|\b(?:but|and then)\b/i)
        .at(-1) ?? "";
    return !/\b(?:if|when|unless|suppose|perhaps|maybe)\b/i.test(prefix);
  });
}

function dailyDraft(
  raw: unknown,
  input: ReadingProseInput,
  template = false,
  contextCandidate = false,
):
  | {
      body: string;
      paragraphs: string[];
      citations: Citation[];
      writingParagraphs: DailyWritingParagraph[];
    }
  | DailyProblem {
  if (
    !raw ||
    typeof raw !== "object" ||
    !Array.isArray((raw as { paragraphs?: unknown }).paragraphs)
  )
    return rejection("shape", "draft has malformed paragraph data");
  const paragraphs = (raw as { paragraphs: unknown[] }).paragraphs;
  if (paragraphs.length < (template ? 1 : 2) || paragraphs.length > 4)
    return rejection("count", "draft must contain two to four paragraphs");
  const editorial = input.writing?.plan.editorial;
  const validationFacts = editorial
    ? input.facts
        .filter((fact) => editorial.requiredFacts.includes(fact.id))
        .map((fact) => ({
          ...fact,
          statement: fact.cycle
            ? fact.statement
            : fact.id === input.writing!.plan.theme?.factId
              ? Object.values(editorial.entry.writingMaterial)
                  .filter((value): value is string => typeof value === "string")
                  .join(" ")
              : "",
        }))
    : input.facts;
  const byId = new Map(validationFacts.map((f) => [f.id, f]));
  const kept: string[] = [],
    citations: Citation[] = [];
  const writingParagraphs: DailyWritingParagraph[] = [];
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
    const p = paragraph as { text?: unknown; facts?: unknown; scenes?: unknown };
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
    const standardContextDetail = contextCandidate && normalizeDepth(input.depth) === "standard";
    const detailSentences = standardContextDetail
      ? sentences.map((sentence) =>
          sentence.replaceAll(
            input.facts.find((fact) => fact.id === "A1")?.arc?.chronologySentence ?? "\u0000",
            "",
          ),
        )
      : sentences;
    if ((editorial || standardContextDetail) && editorialDetailProblem(detailSentences))
      return rejectParagraph(
        "editorial_detail",
        "draft includes technical detail outside the warm/standard editorial body style",
      );
    if (
      (input.writing?.plan.editorial || contextCandidate) &&
      sentences.some((sentence) =>
        sentence.split(/[,;]|\b(?:but|and then)\b/i).some((clause) => {
          const event =
            /\byou\s+(?:ignored|accepted|missed|avoided|sent|wrote|cancelled|canceled|declined|agreed|finished|forgot|rejected|attended)\b/i.exec(
              clause,
            );
          return (
            !!event &&
            /\b(?:this morning|yesterday|earlier today)\b/i.test(clause) &&
            !/\b(?:if|when|unless|suppose|perhaps|maybe)\b/i.test(clause.slice(0, event.index))
          );
        }),
      )
    )
      return rejectParagraph("editorial_claim", "draft asserts an unsupplied personal event");
    if (contextCandidate && contextRecentOnsetClaim(sentences))
      return rejectParagraph(
        "editorial_claim",
        "draft asserts the context pilot's unsupported recent-onset claim",
      );
    if (byId.has("N1") && natalLensWordingProblem(text))
      return rejectParagraph("natal_claim", "draft asserts natal certainty or a clinical claim");
    const ids = [...new Set(p.facts as string[])];
    if (input.writing?.plan.editorial?.requiredFacts.some((id) => !ids.includes(id)))
      return rejectParagraph(
        "dependencies",
        "draft omitted the selected editorial source or its parent references",
      );
    if (
      input.writing?.plan.editorial &&
      dropsSourceModality(sentences, [
        {
          id: input.writing.plan.theme?.factId ?? "I1",
          statement: Object.values(input.writing.plan.editorial.entry.writingMaterial)
            .filter((value): value is string => typeof value === "string")
            .join(" "),
        },
      ])
    )
      return rejectParagraph(
        "editorial_claim",
        "draft drops a qualifier from selected editorial material",
      );
    if (ids.includes("S1") && !byId.get("S1")!.dependsOn!.every((id) => ids.includes(id)))
      return rejectParagraph("dependencies", "draft omitted published synthesis parent references");
    if (ids.includes("N1") && !["C1", "I1"].every((id) => ids.includes(id)))
      return rejectParagraph("dependencies", "draft omitted natal lens parent references");
    if (contextCandidate) {
      const claimProblem = dailyContextClaimProblem(
        sentences,
        ids.map((id) => byId.get(id)!),
      );
      if (claimProblem) return rejectParagraph("editorial_claim", claimProblem);
    }
    const storyProblem = storyParagraphProblem(text, ids, validationFacts);
    if (storyProblem) return rejectParagraph(storyProblem, "draft failed calculated story checks");
    const problem =
      dailyReferenceProblem(
        input.writing?.plan.editorial || contextCandidate
          ? text.replace(new RegExp(`\\b(${BODY_NAMES})['’]s\\b`, "gi"), "$1")
          : text,
        ids.map((id) => byId.get(id)!),
        input.suppression,
      ) ??
      dailyEditorialProblem(
        sentences,
        ids.map((id) => byId.get(id)!),
      ) ??
      dailyTimingProblem(sentences);
    if (problem) return { ...problem, paragraph: index + 1 };
    kept.push(text);
    citations.push({ paragraph: kept.length, facts: ids });
    writingParagraphs.push({ text, facts: ids, scenes: p.scenes as string[] });
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
  const storyCoverage = storyCoverageProblem(kept, citations, validationFacts);
  if (storyCoverage)
    return rejection(storyCoverage, "draft omitted the supplied chronology or chapter");
  const repeated = contextCandidate ? dailyContextRepeatProblem(kept, validationFacts) : null;
  if (repeated) return rejection("writing_quality", repeated);
  return { body: kept.join("\n\n"), paragraphs: kept, citations, writingParagraphs };
}

function dailyDiagnostics(
  model: string,
  outcome: DailyDiagnostics["outcome"],
  code: DailyDiagnostics["code"],
  started: number | null,
  paragraph: number | null = null,
  concrete = false,
  editorial = false,
  contextCandidate = false,
): DailyDiagnostics {
  return {
    version: DAILY_DIAGNOSTICS_VERSION,
    promptVersion: contextCandidate
      ? CONTEXT_DAILY_PROMPT_VERSION
      : editorial
        ? EDITORIAL_DAILY_PROMPT_VERSION
        : concrete
          ? CONCRETE_DAILY_PROMPT_VERSION
          : DAILY_PROMPT_VERSION,
    validatorVersion: contextCandidate
      ? CONTEXT_DAILY_VALIDATOR_VERSION
      : editorial
        ? EDITORIAL_DAILY_VALIDATOR_VERSION
        : concrete
          ? CONCRETE_DAILY_VALIDATOR_VERSION
          : DAILY_VALIDATOR_VERSION,
    model,
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
  provider: LanguageProvider = "lovable",
  control: SyntheticTransportControl = {},
  options: {
    authoredEditorial?: boolean;
    authoredContext?: boolean;
    contextCandidate?: boolean;
    recordMemberTransport?: boolean;
  } = {},
): Promise<ReadingProse> {
  const { fallback } = input;
  const model = languageModel(provider);
  assertDailyFactGraph(input.facts);
  const concrete = !!input.writing;
  const editorial = input.writing?.plan.editorial;
  const contextCandidate = options.contextCandidate === true;
  const contextBrief = contextCandidate
    ? toDailyContextBrief(input.facts, input.tone, input.depth)
    : null;
  if (editorial && (input.tone !== "warm" || input.depth !== "standard"))
    throw Error("Editorial writing policy is limited to its selected warm/standard scope.");
  if (input.writing)
    assertDailyWritingBrief(
      toDailyWritingBrief(input.writing.plan),
      input.writing.plan,
      input.facts,
    );
  let transport: MemberDailyTransport | undefined;
  const diagnose = (
    outcome: DailyDiagnostics["outcome"],
    code: DailyDiagnostics["code"],
    started: number | null,
    paragraph: number | null = null,
  ): DailyDiagnostics => ({
    ...dailyDiagnostics(
      model,
      outcome,
      code,
      started,
      paragraph,
      concrete,
      !!editorial,
      contextCandidate,
    ),
    ...(transport ? { transport } : {}),
  });
  const quality = (paragraphs: DailyWritingParagraph[], renderMode: DailyWritingRenderMode) => {
    const sources = (editorial ? [] : input.facts)
      .filter((fact) => /^(I[123]|S1|N1|P2)$/.test(fact.id))
      .map((fact) =>
        fact.statement
          .replace(/^Published (?:tension|reinforcement) synthesis [^\n]+ \(parents: [^)]+\): /, "")
          .replace(
            /^Published interpretation [^\n]+?: |^Published natal lens, an interpretive possibility: |^Published transit chapter: /,
            "",
          ),
      );
    return checkDailyWritingQuality({
      paragraphs,
      plan: input.writing!.plan,
      renderMode,
      recent: input.writing!.recent,
      requiredLiteralSentences: input.facts
        .filter((fact) => fact.arc)
        .map((fact) => fact.arc!.chronologySentence),
      sourceTexts: [
        ...sources,
        ...input.writing!.plan.scenes.flatMap((scene) => [scene.situation, scene.focus]),
        ...(editorial
          ? Object.values(editorial.entry.writingMaterial).filter(
              (text): text is string => typeof text === "string",
            )
          : []),
      ],
      example: contextCandidate
        ? null
        : editorial
          ? EDITORIAL_DAILY_VOICE_EXAMPLE
          : DAILY_VOICE_EXAMPLES[normalizeTone(input.tone)][normalizeDepth(input.depth)],
    });
  };
  const sceneUse = (paragraphs: DailyWritingParagraph[]) =>
    paragraphs.flatMap((p, index) =>
      (p.scenes ?? []).map((id) => ({ id: id as "SC1" | "SC2", paragraph: index + 1 })),
    );
  const fallbackResult = (
    reason: string,
    diagnostics: DailyDiagnostics,
    candidateQuality = writingNotEvaluated(),
  ): ReadingProse => {
    if (!input.writing)
      return {
        ...fallback,
        paragraphs: fallback.body.split("\n\n"),
        meta: { ...templateMeta(reason), diagnostics },
      };
    let template = input.writing.template;
    const validate = (candidate: DailyWritingTemplate) => {
      if (!input.writing!.plan.theme) return null;
      const result = dailyDraft(
        { paragraphs: candidate.paragraphs },
        input,
        true,
        contextCandidate,
      );
      if ("code" in result)
        throw Error(`Required template source failed ${result.code} validation.`);
      return result;
    };
    let validated = validate(template),
      finalQuality = quality(template.paragraphs, template.renderMode);
    if (finalQuality.outcome === "reject") {
      template = input.writing.minimalTemplate;
      validated = validate(template);
      finalQuality = quality(template.paragraphs, template.renderMode);
      if (finalQuality.outcome === "reject")
        throw Error("Required minimal template source failed editorial validation.");
    }
    return {
      ...fallback,
      body: template.paragraphs.map((p) => p.text).join("\n\n"),
      paragraphs: template.paragraphs.map((p) => p.text),
      meta: {
        ...templateMeta(template.reason ?? reason),
        citations: validated?.citations ?? [],
        diagnostics,
        writing: {
          renderMode: template.renderMode,
          reason: template.reason,
          sceneUse: sceneUse(template.paragraphs),
          candidateQuality,
          finalQuality,
        },
      },
    };
  };
  if (contextCandidate) {
    const template = input.writing!.template;
    const checked = dailyDraft({ paragraphs: template.paragraphs }, input, true, true);
    if ("code" in checked) throw Error(`Required template failed ${checked.code} validation.`);
    if (quality(template.paragraphs, template.renderMode).outcome === "reject")
      throw Error("Required template failed writing quality validation.");
  }
  if (options.authoredEditorial && editorial)
    return fallbackResult(
      diagnosticLabel("authored_editorial"),
      diagnose("skipped", "authored_editorial", null),
    );
  if (options.authoredContext && contextCandidate)
    return fallbackResult(
      diagnosticLabel("authored_context"),
      diagnose("skipped", "authored_context", null),
    );
  if (!input.hasEligibleCycles || !input.facts.some((f) => f.id === "C1" && f.cycle))
    return fallbackResult("no eligible cycle to write from", diagnose("skipped", "no_cycle", null));
  if (!input.facts.some((f) => f.id === "I1"))
    return fallbackResult(
      diagnosticLabel("no_interpretation"),
      diagnose("skipped", "no_interpretation", null),
    );
  const timingCitationIds = [
    "C1",
    ...["P1", "T1"].filter((id) => input.facts.some((fact) => fact.id === id)),
  ];
  const hasNatalLens = !editorial && input.facts.some((fact) => fact.id === "N1");
  const legacyPrompt = () =>
    [
      editorial
        ? dailyEditorialVoice()
        : dailyVoice(normalizeTone(input.tone), normalizeDepth(input.depth), concrete),
      editorial ? "Structural source references; no draftable prose:" : "Facts:",
      editorial
        ? JSON.stringify(dailyEditorialReferences(input.facts, editorial.requiredFacts))
        : dailyFactBlock(input.facts),
      ...(input.writing
        ? [
            "Source-bound writing brief:",
            JSON.stringify(toDailyWritingBrief(input.writing.plan)),
            editorial
              ? "The editorial writingMaterial contains this reading's permitted meaning, scene, imagery and optional direction. Its constraints are separate controls and must not appear as policy explanations in the prose. Develop one central thread using this selected material only. Declare empty scenes arrays: this editorial scene is not a schema-5 SC reference. Cite the central source and all required parents for its meaning, imagery and direction. Do not introduce another setting or borrow a demonstration's subject. Keep each condition attached to its own claim."
              : "Develop one central thread through one or two supplied possible illustrations only. Declare scenes separately from facts, once per scene across the body; every scene paragraph cites the central source and all required parents. Do not introduce a third setting for a supporting cycle, natal lens or transit chapter. An unfinished reply is a comparison, not the reply you avoided this morning. Never borrow a demonstration's subject or EX-* identifiers. No-frame cases declare empty scenes. Keep each condition attached to the claim it qualifies.",
          ]
        : []),
      "",
      editorial
        ? "Write only the body of today's reading. The selected writingMaterial is the sole source of draftable meaning; the structural references identify its source and contact geometry only."
        : "Rewrite only the astronomical body of today's reading, using the supplied published interpretation, domain and phase wording.",
      "Keep each paragraph under 200 words and the whole body under 700 words.",
      editorial
        ? "The first paragraph must concern the selected meaning and cite C1 and I1. Cite only the IDs in the structural source references; each paragraph includes every required source and parent ID."
        : "The first paragraph must concern the strongest eligible cycle and cite C1 and I1. D1, P1 and T1 are optional: cite them in any paragraph that uses their domain, phase or timing claims, and leave them out when unused.",
      ...(!concrete
        ? [
            "Citations belong in the facts arrays, not in explanatory prose. Let a supported everyday meaning stand without repeatedly explaining that it frames or offers a way to read the planet contact. Name the contact only when it adds useful context or identifies a technical measurement; avoid restating it in each paragraph. Omit optional shared phase prose when it adds no distinction specific to this reading.",
            "Keep every frequency or tendency claim attached to the subject named by its source. For example, a tendency about periods with lower-friction contacts cannot become a claim about all periods of lower friction. Preserve the source's conditions and qualifications when paraphrasing or changing sentence order.",
            "An approaching phase means approaching the exact aspect, not approaching the natal point. When explaining an orb or phase, name the aspect and natal target explicitly. For a supplied Saturn sextile natal Mercury with approaching phase and orb 0.42 degrees, a supported rendering is: Saturn's sextile to natal Mercury is approaching exactness; its current aspect orb is 0.42 degrees. This example supplies no facts or numbers for any other contact.",
          ]
        : []),
      input.facts.some((f) => f.id === "S1")
        ? editorial
          ? 'Develop the selected writingMaterial relationship within paragraph 1 or 2. Join its distinct roles through the selected imagery without a planet-keyword list or fixed order of contact names. Preserve its conditions. Every paragraph using the relationship, its imagery or direction must cite ["S1", "C1", "I1", "C2", "I2"]. A supported possibility stays a possibility; "can increase" cannot become "increases". The relationship is editorial meaning, not a measured personal state.'
          : 'Develop the supplied published relationship in paragraph 1 or 2. Present I1 and its contact first, then I2 and its contact, before stating the S1 relationship they support. These parent meanings may span the first two paragraphs; avoid repeating them merely to put them beside S1. Mark the move into the supplied relationship clearly, so a phrase such as "that tension" has a clear antecedent. Every paragraph using S1 must explicitly cite all five IDs: "facts": ["S1", "C1", "I1", "C2", "I2"]. The relationship is editorial interpretation, not an established personal state. Keep its qualifications: "can increase" stays "can increase", not "increases". For a reinforcement relationship, give the two joined meanings distinct paragraph functions, as S1 relates them, instead of restating one idea in both paragraphs; then add only supported useful detail and stop. Clear published wording may be kept, and no new scene is needed for variety.'
        : editorial
          ? "Keep the selected meaning and its C1 contact as the focus. No synthesis relationship is supplied; do not invent a joint relationship or premise."
          : "Keep C1 as the primary focus. No S1 is supplied: do not invent a joint relationship or premise. I2 and I3 may offer separately supported context without connecting the contacts into a new story.",
      ...(hasNatalLens
        ? [
            'Apply the supplied N1 possibility to a specific I1 scene with one practical distinction in paragraph 1 or 2. Choose one supported task, obligation or choice and keep it as the subject of both meanings. If N1 introduces a concrete example, explicitly place that same example inside I1\'s scene as a possibility; do not jump from a quiet moment or demanding role to an unrelated reply or project. Develop N1\'s distinction on that shared example, keeping its sentences in their published order where practical. Identify what changes in considering that same obligation, task or choice; do not simply append N1 verbatim or connect two summaries with a generic bridge. Keep every scene and source condition intact. Every paragraph using it must cite ["N1", "C1", "I1"]. Keep it conditional and recognizable or rejectable, never a confirmed identity, biological explanation or lived event. N1 and S1 may share a paragraph with all parents, but S1 supplies its own relationship: the N1 distinction must not be made to cause or establish it. Do not add a personality section. N1 does not authorize a natal body, sign, house, aspect or other geometry.',
          ]
        : []),
      ...(!editorial && input.facts.some((f) => f.id === "A1")
        ? [
            'Copy A1\'s chronology sentence unchanged exactly once in paragraph 1 or 2. The paragraph containing it must include "facts": ["C1", "A1"] along with any other source IDs it uses. Connect P2\'s conditional practical meaning to I1 in paragraph 1 or 2. Every paragraph using P2 must include all four IDs in that same paragraph\'s facts array: "facts": ["C1", "I1", "A1", "P2"]. Include A1 when citing P2 even if the chronology sentence appears in another paragraph; cite the dependency without repeating the chronology sentence. Keep this integration within the existing four-sentence paragraph limit; do not add a separate essay. Only the unchanged chronology sentence may use A1 dates. Do not add counts, pass ordinals, station dates, life history or promises of closure.',
          ]
        : []),
      "Cite the supplied IDs each paragraph rests on. This is reference coverage, not permission to invent astronomical facts.",
      editorial
        ? "Any paragraph naming a planet or aspect must cite its supplied calculated cycle ID. Source IDs cannot replace that cycle citation."
        : "Any paragraph naming a planet, aspect, orb or ISO exact date must cite the matching calculated cycle ID (C1, C2 or C3), even when it repeats a number from T1. Editorial IDs I1, I2, I3, S1, D1, P1 and T1 cannot replace that cycle citation.",
      ...(!editorial
        ? [
            `For a paragraph using the strongest cycle's supplied phase and timing wording, include its cycle alongside the relevant editorial references: "facts": [${timingCitationIds.map((id) => JSON.stringify(id)).join(", ")}]. Cite only IDs and values supplied above.`,
          ]
        : []),
      "Do not write a headline, reflection question, local-time context or wellbeing framing; those are provided separately.",
      editorial
        ? "Do not introduce sign or individual house placements. Do not write orb, degree, exact date, phase or calculated timing details in this warm/standard body."
        : "Do not introduce sign or individual house placements. Quote orb degrees as digit literals and ISO dates only when present in a cycle cited by that paragraph.",
      "C1-C3 describe a transiting body contacting a natal point, not two bodies in the current sky. Preserve those roles whenever naming the geometry: explicitly name the target as natal if describing the contact as occurring in the sky. A source's subjective 'feels like yours' stays subjective; do not turn it into an objective task allocation.",
      ...(!editorial
        ? [
            "An orb is the angular deviation from the named aspect measured at this reading's calculation time; the calculated exact date is a separate calendar estimate. Window position describes THIS READING, never the future or past exact date. Put the current orb, this reading's window position, and any exact date or relative exact timing in separate sentences. Never attach a current measurement or window position to the exact pass. Do not infer an exact date from the phase label when the facts say no exact date was found.",
          ]
        : []),
      input.suppression.angles
        ? "Angle claims are suppressed: do not mention Ascendant, rising sign (including shorthand such as 'your rising'), Midheaven or other angles."
        : "",
      input.suppression.houses
        ? "House claims are suppressed: do not mention houses or cusps."
        : "",
      "Do not repeat calculation caveats; the app appends them separately.",
    ]
      .filter(Boolean)
      .join("\n");
  const prompt = contextBrief
    ? dailyContextPrompt(contextBrief, input.suppression)
    : legacyPrompt();
  let raw: unknown;
  const started = performance.now();
  try {
    raw = await callGateway(
      prompt,
      "daily_reading",
      concrete ? CONCRETE_READING_SCHEMA : READING_SCHEMA,
      {
        timeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
        observation,
        system: contextCandidate
          ? dailyContextSystemVoice(input.facts.some((fact) => fact.id === "N1"))
          : editorial
            ? dailyEditorialSystemVoice(hasNatalLens)
            : dailySystemVoice(hasNatalLens),
        provider,
        control,
        memberTransport: options.recordMemberTransport
          ? (trace) => {
              transport = trace;
            }
          : undefined,
      },
    );
  } catch (error) {
    const failure = gatewayFailure(error);
    return fallbackResult(
      diagnosticLabel(failure.code),
      diagnose(
        "unavailable",
        failure.code,
        ["not_configured", "request_limit"].includes(failure.code) ? null : started,
      ),
    );
  }
  const result = dailyDraft(raw, input, false, contextCandidate);
  if ("code" in result)
    return fallbackResult(
      result.reason,
      diagnose("rejected", result.code, started, result.paragraph),
    );
  const candidateQuality = input.writing
    ? quality(
        result.writingParagraphs,
        input.writing.plan.status === "ready"
          ? "framed"
          : input.writing.plan.theme
            ? "unframed"
            : "quiet",
      )
    : null;
  if (candidateQuality?.outcome === "reject")
    return fallbackResult(
      diagnosticLabel("writing_quality"),
      diagnose(
        "rejected",
        "writing_quality",
        started,
        candidateQuality.issues.find((issue) => issue.severity === "reject")?.paragraph ?? null,
      ),
      candidateQuality,
    );
  return {
    headline: fallback.headline,
    body: result.body,
    paragraphs: result.paragraphs,
    prompt: fallback.prompt,
    meta: {
      mode: "model",
      model,
      citations: result.citations,
      dropped: 0,
      flagged: [],
      reason: null,
      diagnostics: diagnose("accepted", "accepted", started),
      ...(input.writing && candidateQuality
        ? {
            writing: {
              renderMode:
                input.writing.plan.status === "ready" ? ("framed" as const) : ("unframed" as const),
              reason: null,
              sceneUse: sceneUse(result.writingParagraphs),
              candidateQuality,
              finalQuality: candidateQuality,
            },
          }
        : {}),
    },
  };
}

/** Production readings expose only the established prose/diagnostics contract. */
export interface MemberReadingProseOptions {
  contextModes?: readonly string[];
  contextRenderMode?: "model" | "authored";
}

function memberReadingSelection(
  input: ReadingProseInput,
  allowedModes: readonly string[],
  renderMode: "model" | "authored" = "model",
) {
  const mode = memberContextMode(input);
  const context = mode && allowedModes.includes(mode) ? prepareMemberContextReading(input) : null;
  const selected = context ?? input;
  return {
    input: selected,
    options: {
      contextCandidate: !!context,
      authoredContext: !!context && renderMode === "authored",
      // 0.9.1 revises ordinary source copy; its reviewed editorial catalogue is unchanged.
      authoredEditorial: ["0.9.0", "0.9.1"].includes(
        selected.writing?.plan.editorial?.releaseVersion ?? "",
      ),
    },
  };
}

/** Daily prose is latency-sensitive; natal chapters and admin evaluations retain their policy. */
function memberDailyTransportControl(provider: LanguageProvider): SyntheticTransportControl {
  return provider === "gemini-enterprise" ? { enterpriseThinking: "LOW" } : {};
}

export async function generateReadingProse(
  input: ReadingProseInput,
  options: MemberReadingProseOptions = {},
): Promise<ReadingProse> {
  const selected = memberReadingSelection(
    input,
    options.contextModes ?? [],
    options.contextRenderMode,
  );
  const provider = memberLanguageProvider();
  return generateDailyProse(
    selected.input,
    undefined,
    provider,
    memberDailyTransportControl(provider),
    { ...selected.options, recordMemberTransport: true },
  );
}

/** Only whitelisted, bounded paragraph fields are retained for fixed synthetic evaluations. */
function captureSyntheticCandidate(
  raw: unknown,
  concrete = false,
): SyntheticReadingCandidate | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const paragraphs = (raw as { paragraphs?: unknown }).paragraphs;
  if (!Array.isArray(paragraphs)) return null;
  // Decided on the raw draft, before the bounds and filters below can hide a loss.
  const captureLossless =
    paragraphs.length <= 10 &&
    paragraphs.every((paragraph) => {
      if (!paragraph || typeof paragraph !== "object" || Array.isArray(paragraph)) return false;
      const { text, facts, scenes } = paragraph as {
        text?: unknown;
        facts?: unknown;
        scenes?: unknown;
      };
      return (
        typeof text === "string" &&
        text.length <= 4000 &&
        Array.isArray(facts) &&
        facts.length <= 20 &&
        facts.every((fact) => typeof fact === "string" && fact.length <= 80) &&
        (!concrete ||
          (Array.isArray(scenes) &&
            scenes.length <= 10 &&
            scenes.every((id) => typeof id === "string" && id.length <= 80)))
      );
    });
  let truncated = paragraphs.length > 10;
  const captured = paragraphs.slice(0, 10).map((paragraph) => {
    const value =
      paragraph && typeof paragraph === "object" && !Array.isArray(paragraph)
        ? (paragraph as { text?: unknown; facts?: unknown; scenes?: unknown })
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
    if (concrete) {
      const scenes = Array.isArray(value.scenes) ? value.scenes : null;
      if (
        scenes &&
        (scenes.length > 10 || scenes.some((id) => typeof id === "string" && id.length > 80))
      )
        truncated = true;
      return {
        text,
        facts,
        scenes: scenes
          ? scenes
              .slice(0, 10)
              .filter((id): id is string => typeof id === "string")
              .map((id) => id.slice(0, 80))
          : null,
      };
    }
    return { text, facts };
  });
  return { paragraphs: captured, paragraphCount: paragraphs.length, truncated, captureLossless };
}

/** Server-only seam used by the closed, checked-in synthetic case runner. Never used by Today. */
export async function generateSyntheticReadingProse(
  input: ReadingProseInput,
  provider: LanguageProvider = "lovable",
  control: SyntheticTransportControl = {},
  contextBenchmark?: DailyContextBenchmark,
): Promise<{
  prose: ReadingProse;
  request: SyntheticReadingRequest | null;
  candidate: SyntheticReadingCandidate | null;
  transport: AdminTransportTrace | null;
}> {
  let request: SyntheticReadingRequest | null = null;
  let candidate: SyntheticReadingCandidate | null = null;
  let transport: AdminTransportTrace | null = null;
  assertSyntheticTransportControl(provider, control);
  const selectedInput = contextBenchmark
    ? prepareDailyContextCandidate(input, contextBenchmark)
    : input;
  const prose = await generateDailyProse(
    selectedInput,
    {
      transport(value) {
        transport = value;
      },
      request(value) {
        request = value;
      },
      candidate(value) {
        candidate = captureSyntheticCandidate(value, !!selectedInput.writing);
      },
    },
    provider,
    control,
    { contextCandidate: !!contextBenchmark },
  );
  return { prose, request, candidate, transport };
}

/** Synthetic capture of the member selection and provider path, including its authored fallback. */
export async function generateSyntheticMemberReadingProse(
  input: ReadingProseInput,
  provider: LanguageProvider = "lovable",
  control: SyntheticTransportControl = {},
  allowedModes: readonly string[] = [],
): Promise<{
  prose: ReadingProse;
  request: SyntheticReadingRequest | null;
  candidate: SyntheticReadingCandidate | null;
  transport: AdminTransportTrace | null;
}> {
  let request: SyntheticReadingRequest | null = null;
  let candidate: SyntheticReadingCandidate | null = null;
  let transport: AdminTransportTrace | null = null;
  assertSyntheticTransportControl(provider, control);
  const selected = memberReadingSelection(input, allowedModes);
  const prose = await generateDailyProse(
    selected.input,
    {
      transport(value) {
        transport = value;
      },
      request(value) {
        request = value;
      },
      candidate(value) {
        candidate = captureSyntheticCandidate(value, !!selected.input.writing);
      },
    },
    provider,
    { ...memberDailyTransportControl(provider), ...control },
    selected.options,
  );
  return { prose, request, candidate, transport };
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
export { FEATURE_ESSAY_VERSION, chapterReflection } from "./chapter-policy";
import { chapterReflection } from "./chapter-policy";

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

export async function generateFeatureNarrative(input: {
  facts: FactAtom[];
  title: string;
  tone: string;
}): Promise<FeatureProse> {
  const provider = memberLanguageProvider();
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
    raw = await callGateway(prompt, "natal_chapter", FEATURE_SCHEMA, { provider });
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
      model: languageModel(provider),
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
  promptVersion: string;
  dropped: number;
  flagged: string[];
}

export const BUNDLE_DRAFT_PROMPT_VERSION = "bundle-draft-v2";

const BUNDLE_DRAFT_BRIEFS: Record<string, { hard: string; soft: string }> = {
  saturn: {
    hard: "Commitment versus available capacity",
    soft: "A routine sustainable at an ordinary pace",
  },
  jupiter: {
    hard: "Added scope versus room to carry it",
    soft: "One additional option within an existing plan",
  },
  mars: {
    hard: "Urgency versus task pace",
    soft: "Effort with a clear next action",
  },
  venus: {
    hard: "Habitual choice versus current preference",
    soft: "A small preference that is easy to name",
  },
  mercury: {
    hard: "Intended meaning versus wording",
    soft: "An idea becoming understandable",
  },
  sun: {
    hard: "A role versus what receives attention",
    soft: "A description fitting a chosen activity",
  },
  moon: {
    hard: "A moment versus a familiar rhythm",
    soft: "An ordinary arrangement that feels comfortable",
  },
  uranus: {
    hard: "A familiar arrangement versus room to vary it",
    soft: "A small alternative without forced disruption",
  },
  neptune: {
    hard: "Impression versus available detail",
    soft: "Imagination with uncertainty left explicit",
  },
  pluto: {
    hard: "An established arrangement versus what remains negotiable",
    soft: "Deliberate attention to a lasting priority",
  },
  "*": {
    hard: "Competing preferences without assuming a problem or a required resolution",
    soft: "An ordinary moment of ease without requiring a productive outcome",
  },
};

export async function generateBundleEntries(
  specs: BundleSpec[],
  provider: LanguageProvider = "lovable",
): Promise<DraftResult> {
  const wanted = new Set(specs.map((s) => s.key));
  const prompt = [
    `Bundle drafting prompt: ${BUNDLE_DRAFT_PROMPT_VERSION}.`,
    "Each line below is an interpretation slot that needs reusable copy.",
    "A `hard` family means conjunction, square or opposition; `soft` means trine or sextile.",
    "A `*` means the slot is a catch-all for that position.",
    "",
    ...specs.map((s) => {
      const brief = BUNDLE_DRAFT_BRIEFS[s.key.split(":")[1] ?? ""];
      const distinction = s.family === "hard" ? brief?.hard : brief?.soft;
      return `${s.key} — ${s.family} aspect from transiting ${s.transitBody} to natal ${s.natalPoint}${distinction ? `; reflective brief: ${distinction}` : ""}`;
    }),
    "",
    "For each slot return the exact key, a two-to-three sentence mechanism and one separate open reflection question in the question field.",
    "Use conditional framing for reflection: the contact offers a way to consider the supplied distinction, not evidence that it describes this reader. These briefs are proposed reflective contrasts, not new chart facts.",
    "Include exactly one concrete, conditional everyday comparison in each mechanism. A comparison is hypothetical; do not claim the scene occurred or invent a reader's history.",
    "Use familiar verbs and concise prose. Vary openings and sentence structure across the whole set; do not repeat the same three-sentence template or add decorative synonyms for variety.",
    "No planetary causation, mandatory outcomes, unsupported frequency, diagnoses or presumed biography. Do not claim a planet makes, forces, disrupts or requires anything; do not add tends to, often, usually or always.",
    "The question must allow answers such as 'nothing' or 'that does not fit' without assuming imbalance, a boundary problem, a changed preference or a productivity demand. Do not put another question in the mechanism.",
    "Copy is reused for every reader, so it must not mention dates, orbs or personal circumstances. Return only the supplied slots and fields; do not add themes or synthesis relationships.",
  ].join("\n");

  const raw = await callGateway<{ entries: DraftedEntry[] }>(
    prompt,
    "bundle_entries",
    BUNDLE_SCHEMA,
    { provider },
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
    model: languageModel(provider),
    promptVersion: BUNDLE_DRAFT_PROMPT_VERSION,
    dropped,
    flagged: [...new Set(flagged)],
  };
}
