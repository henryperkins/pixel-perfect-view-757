/** Frozen Flash synthetic-admin observations only. Current member captures use member-transport. */
import type { LanguageProvider } from "./diagnostics";
export const ADMIN_TRANSPORT_VERSION = "admin-model-transport-1";
/** These controls and the reservation below belong to existing Flash-priced campaigns. */
export const ENTERPRISE_THINKING_LEVELS = ["LOW", "MEDIUM"] as const;
export type EnterpriseThinkingLevel = (typeof ENTERPRISE_THINKING_LEVELS)[number];
export interface SyntheticTransportControl {
  enterpriseThinking?: EnterpriseThinkingLevel;
  boundedQualification?: boolean;
}
export interface AdminTransportTrace {
  version: typeof ADMIN_TRANSPORT_VERSION;
  provider: LanguageProvider;
  requestedModel: string;
  actualModel: string | null;
  thinkingLevel: EnterpriseThinkingLevel | null;
  maxOutputTokens: number | null;
  deadlineMs: number;
  startedAt: string;
  headersAt: string | null;
  bodyAt: string | null;
  abortAt: string | null;
  finishedAt: string | null;
  httpStatus: number | null;
  requestId: string | null;
  responseId: string | null;
  finishReason: string | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    thinkingTokens: number | null;
    totalTokens: number | null;
    outputIncludesThinking: boolean | null;
  };
}
const number = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x <= 2_000_000 ? x : null;
const identifier = (x: unknown) =>
  typeof x === "string" && /^[A-Za-z0-9._:/+-]{1,128}$/.test(x) ? x : null;
const model = (x: unknown) =>
  typeof x === "string" && /^(?:google\/)?gemini-[0-9][A-Za-z0-9._-]{1,100}$/.test(x) ? x : null;
const object = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
export function assertSyntheticTransportControl(
  provider: LanguageProvider,
  control: SyntheticTransportControl,
) {
  if (Object.keys(control).some((k) => !["enterpriseThinking", "boundedQualification"].includes(k)))
    throw Error("Unknown synthetic transport control.");
  if (control.enterpriseThinking !== undefined) {
    if (provider !== "gemini-enterprise")
      throw Error("Thinking controls are Enterprise evaluation only.");
    if (!(ENTERPRISE_THINKING_LEVELS as readonly unknown[]).includes(control.enterpriseThinking))
      throw Error("Unsupported Gemini 3.8 thinking control.");
  }
  if (
    control.boundedQualification !== undefined &&
    typeof control.boundedQualification !== "boolean"
  )
    throw Error("Invalid qualification transport control.");
}
export function createAdminTransportTrace(
  provider: LanguageProvider,
  requestedModel: string,
  deadlineMs: number,
  control: SyntheticTransportControl,
  signal: AbortSignal,
) {
  const trace: AdminTransportTrace = {
    version: ADMIN_TRANSPORT_VERSION,
    provider,
    requestedModel,
    actualModel: null,
    thinkingLevel: control.enterpriseThinking ?? null,
    maxOutputTokens: control.boundedQualification ? 65536 : null,
    deadlineMs,
    startedAt: new Date().toISOString(),
    headersAt: null,
    bodyAt: null,
    abortAt: null,
    finishedAt: null,
    httpStatus: null,
    requestId: null,
    responseId: null,
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
    trace.abortAt = new Date().toISOString();
  };
  signal.addEventListener("abort", aborted, { once: true });
  return {
    headers(res: Response) {
      trace.headersAt = new Date().toISOString();
      trace.httpStatus = res.status;
      trace.requestId = identifier(
        res.headers.get(provider === "gemini-enterprise" ? "x-goog-request-id" : "x-request-id"),
      );
    },
    payload(raw: unknown) {
      trace.bodyAt ??= new Date().toISOString();
      const p = object(raw);
      trace.actualModel = model(p[provider === "gemini-enterprise" ? "modelVersion" : "model"]);
      trace.responseId = identifier(p[provider === "gemini-enterprise" ? "responseId" : "id"]);
      const entries = p[provider === "gemini-enterprise" ? "candidates" : "choices"];
      const first = Array.isArray(entries) ? object(entries[0]) : {};
      const reason = first[provider === "gemini-enterprise" ? "finishReason" : "finish_reason"];
      if (
        typeof reason === "string" &&
        [
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
        ].includes(reason)
      )
        trace.finishReason = reason;
      const u = object(p[provider === "gemini-enterprise" ? "usageMetadata" : "usage"]);
      trace.usage =
        provider === "gemini-enterprise"
          ? {
              inputTokens: number(u["promptTokenCount"]),
              outputTokens: number(u["candidatesTokenCount"]),
              thinkingTokens: number(u["thoughtsTokenCount"]),
              totalTokens: number(u["totalTokenCount"]),
              outputIncludesThinking: false,
            }
          : {
              inputTokens: number(u["prompt_tokens"]),
              outputTokens: number(u["completion_tokens"]),
              thinkingTokens: number(object(u["completion_tokens_details"])["reasoning_tokens"]),
              totalTokens: number(u["total_tokens"]),
              outputIncludesThinking: true,
            };
    },
    body() {
      trace.bodyAt = new Date().toISOString();
    },
    finish() {
      signal.removeEventListener("abort", aborted);
      trace.finishedAt = new Date().toISOString();
      return structuredClone(trace);
    },
  };
}
export type AdminTransportRecorder = ReturnType<typeof createAdminTransportTrace>;
export function qualificationTransportIssue(trace: AdminTransportTrace | undefined): string | null {
  if (!trace?.actualModel) return "The provider did not report its actual model identity.";
  if (!/^(?:google\/)?gemini-3\.8-flash(?:-\d{3,8})?$/.test(trace.actualModel))
    return "The provider reported a model outside the frozen Gemini 3.8 Flash configuration.";
  const u = trace.usage;
  if (!u || Object.values(u).some((v) => v === null))
    return "Provider usage is incomplete; billing remains unknown.";
  const {
    inputTokens: input,
    outputTokens: output,
    thinkingTokens: thinking,
    totalTokens: total,
  } = u;
  if (
    [input, output, thinking, total].some((v) => !Number.isSafeInteger(v) || v! < 0) ||
    trace.maxOutputTokens !== 65536 ||
    input! > 65536 ||
    output! > 65536 ||
    thinking! > 65536 ||
    (u.outputIncludesThinking
      ? thinking! > output! || total !== input! + output!
      : total !== input! + output! + thinking!)
  )
    return "Provider usage is inconsistent or exceeds the frozen reservation bounds.";
  return null;
}
/** Budget accounting is a conservative reservation estimate, never a billed-cost claim. */
export function qualificationReservationMicros(
  trace: AdminTransportTrace | undefined,
  attempted: boolean,
) {
  if (!attempted) return 0;
  if (qualificationTransportIssue(trace)) return 2_800_000;
  const u = trace!.usage;
  const output = u.totalTokens! - u.inputTokens!;
  const upper = u.inputTokens! * 2 + output * 20;
  return upper <= 2_800_000 ? upper : 2_800_000;
}
