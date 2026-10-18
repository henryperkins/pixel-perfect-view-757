import type { LanguageProvider } from "./diagnostics";

/** Bounded member diagnostics only: never retain requests, prose, errors, IDs or headers. */
export const MEMBER_DAILY_TRANSPORT_VERSION = "member-daily-transport-1";
const MAX_DURATION_MS = 120_000;
export const MEMBER_ENTERPRISE_THINKING_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

/** Shared request/recorder boundary. Lovable never receives Enterprise thinking controls. */
export function assertProviderThinkingLevel(
  provider: LanguageProvider,
  level: MemberDailyTransport["thinkingLevel"],
): void {
  if (provider !== "lovable" && provider !== "gemini-enterprise")
    throw Error("Unsupported language provider.");
  if (provider === "lovable" && level !== null)
    throw Error("Thinking controls require Gemini Enterprise.");
  if (level !== null && !(MEMBER_ENTERPRISE_THINKING_LEVELS as readonly unknown[]).includes(level))
    throw Error("Unsupported member thinking control.");
}
const FINISH_REASONS = new Set([
  "STOP",
  "MAX_TOKENS",
  "SAFETY",
  "RECITATION",
  "OTHER",
  "BLOCKLIST",
  "PROHIBITED_CONTENT",
  "SPII",
  "MALFORMED_FUNCTION_CALL",
  "MODEL_ARMOR",
  "FINISH_REASON_UNSPECIFIED",
  "stop",
  "length",
  "content_filter",
  "tool_calls",
  "function_call",
]);

export interface MemberDailyTransport {
  version: typeof MEMBER_DAILY_TRANSPORT_VERSION;
  provider: LanguageProvider;
  requestedModel: string;
  actualModel: string | null;
  /** Explicit request control; null means the provider default was used. */
  thinkingLevel: (typeof MEMBER_ENTERPRISE_THINKING_LEVELS)[number] | null;
  deadlineMs: number;
  durationMs: number;
  /** Last completed transport boundary; body completion does not imply valid content. */
  phase: "request" | "headers" | "body";
  headersMs: number | null;
  bodyMs: number | null;
  /** The application's deadline signal fired; HTTP 408/504 alone never sets this. */
  deadlineAbortMs: number | null;
  httpStatus: number | null;
  finishReason: string | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    thinkingTokens: number | null;
    totalTokens: number | null;
    outputIncludesThinking: boolean | null;
  };
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const integer = (value: unknown, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
const tokens = (value: unknown) => integer(value, 2_000_000);
const finishReason = (value: unknown) =>
  typeof value === "string" && FINISH_REASONS.has(value) ? value : null;
const modelName = (value: unknown) =>
  typeof value === "string" &&
  value.length <= 120 &&
  /^(?:(?:google|gemini-enterprise)\/)?gemini-\d+(?:\.\d+)?-(?:flash|pro|argon)(?:-\d{3,8})?$/.test(
    value,
  )
    ? value
    : null;

/** Retain bounded reported IDs even when the provider unexpectedly routes to another Gemini model. */
const reportedModelName = (value: unknown) =>
  typeof value === "string" && /^(?:google\/)?gemini-[0-9][A-Za-z0-9._-]{1,100}$/.test(value)
    ? value
    : null;

/** Whitelist persisted fields as well as live metadata; historical diagnostics omit this entirely. */
export function readMemberDailyTransport(
  value: unknown,
  requestedModel: string,
): MemberDailyTransport | null {
  const t = object(value);
  const provider = t["provider"];
  const requested = modelName(t["requestedModel"]);
  const thinkingLevel = t["thinkingLevel"] ?? null;
  const deadlineMs = integer(t["deadlineMs"], MAX_DURATION_MS);
  const durationMs = integer(t["durationMs"], MAX_DURATION_MS);
  const headersMs = integer(t["headersMs"], MAX_DURATION_MS);
  const bodyMs = integer(t["bodyMs"], MAX_DURATION_MS);
  const deadlineAbortMs = integer(t["deadlineAbortMs"], MAX_DURATION_MS);
  const httpStatus = integer(t["httpStatus"], 599);
  const phase = t["phase"];
  if (
    t["version"] !== MEMBER_DAILY_TRANSPORT_VERSION ||
    (provider !== "lovable" && provider !== "gemini-enterprise") ||
    (thinkingLevel !== null &&
      !(MEMBER_ENTERPRISE_THINKING_LEVELS as readonly unknown[]).includes(thinkingLevel)) ||
    (provider === "lovable" && thinkingLevel !== null) ||
    !requested ||
    requested !== requestedModel ||
    !requested.startsWith(provider === "lovable" ? "google/" : "gemini-enterprise/") ||
    deadlineMs === null ||
    deadlineMs < 1 ||
    durationMs === null ||
    (phase !== "request" && phase !== "headers" && phase !== "body") ||
    ["headersMs", "bodyMs", "deadlineAbortMs"].some(
      (key) => t[key] !== null && integer(t[key], MAX_DURATION_MS) === null,
    ) ||
    (t["httpStatus"] !== null && (httpStatus === null || httpStatus < 100)) ||
    (phase === "request"
      ? headersMs !== null || bodyMs !== null || httpStatus !== null
      : headersMs === null ||
        httpStatus === null ||
        (phase === "body" ? bodyMs === null : bodyMs !== null)) ||
    (bodyMs !== null && bodyMs < headersMs!) ||
    [headersMs, bodyMs, deadlineAbortMs].some((ms) => ms !== null && ms > durationMs)
  )
    return null;
  const u = object(t["usage"]);
  return {
    version: MEMBER_DAILY_TRANSPORT_VERSION,
    provider,
    requestedModel: requested,
    actualModel: reportedModelName(t["actualModel"]),
    thinkingLevel: thinkingLevel as MemberDailyTransport["thinkingLevel"],
    deadlineMs,
    durationMs,
    phase: phase as MemberDailyTransport["phase"],
    headersMs,
    bodyMs,
    deadlineAbortMs,
    httpStatus,
    finishReason: finishReason(t["finishReason"]),
    usage: {
      inputTokens: tokens(u["inputTokens"]),
      outputTokens: tokens(u["outputTokens"]),
      thinkingTokens: tokens(u["thinkingTokens"]),
      totalTokens: tokens(u["totalTokens"]),
      outputIncludesThinking:
        typeof u["outputIncludesThinking"] === "boolean" ? u["outputIncludesThinking"] : null,
    },
  };
}

export function createMemberDailyTransport(
  provider: LanguageProvider,
  requestedModel: string,
  deadlineMs: number,
  signal: AbortSignal,
  thinkingLevel: MemberDailyTransport["thinkingLevel"] = null,
) {
  assertProviderThinkingLevel(provider, thinkingLevel);
  const started = performance.now();
  const elapsed = () =>
    Math.min(MAX_DURATION_MS, Math.max(0, Math.round(performance.now() - started)));
  const trace: MemberDailyTransport = {
    version: MEMBER_DAILY_TRANSPORT_VERSION,
    provider,
    requestedModel,
    actualModel: null,
    thinkingLevel,
    deadlineMs,
    durationMs: 0,
    phase: "request",
    headersMs: null,
    bodyMs: null,
    deadlineAbortMs: null,
    httpStatus: null,
    finishReason: null,
    usage: {
      inputTokens: null,
      outputTokens: null,
      thinkingTokens: null,
      totalTokens: null,
      outputIncludesThinking: null,
    },
  };
  const aborted = () => {
    trace.deadlineAbortMs = elapsed();
  };
  signal.addEventListener("abort", aborted, { once: true });
  if (signal.aborted) aborted();
  return {
    kind: "member" as const,
    headers(response: Response) {
      trace.phase = "headers";
      trace.headersMs = elapsed();
      trace.httpStatus = integer(response.status, 599);
    },
    body() {
      trace.phase = "body";
      trace.bodyMs = elapsed();
    },
    payload(value: unknown) {
      const p = object(value);
      const enterprise = provider === "gemini-enterprise";
      trace.actualModel = reportedModelName(p[enterprise ? "modelVersion" : "model"]);
      const candidates = p[enterprise ? "candidates" : "choices"];
      const first = Array.isArray(candidates) ? object(candidates[0]) : {};
      trace.finishReason = finishReason(first[enterprise ? "finishReason" : "finish_reason"]);
      const u = object(p[enterprise ? "usageMetadata" : "usage"]);
      trace.usage = enterprise
        ? {
            inputTokens: tokens(u["promptTokenCount"]),
            outputTokens: tokens(u["candidatesTokenCount"]),
            thinkingTokens: tokens(u["thoughtsTokenCount"]),
            totalTokens: tokens(u["totalTokenCount"]),
            outputIncludesThinking: false,
          }
        : {
            inputTokens: tokens(u["prompt_tokens"]),
            outputTokens: tokens(u["completion_tokens"]),
            thinkingTokens: tokens(object(u["completion_tokens_details"])["reasoning_tokens"]),
            totalTokens: tokens(u["total_tokens"]),
            outputIncludesThinking: true,
          };
    },
    finish(): MemberDailyTransport {
      signal.removeEventListener("abort", aborted);
      trace.durationMs = elapsed();
      return structuredClone(trace);
    },
  };
}
