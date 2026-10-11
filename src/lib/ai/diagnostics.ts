/** Measurement identifiers describe the current brief and guards, not a cache key. */
export const DAILY_DIAGNOSTICS_VERSION = 1;
export const DAILY_READING_PLAN_VERSION = "daily-synthesis-1";
export const DAILY_PROMPT_VERSION = "daily-astro-body-8";
export const DAILY_VALIDATOR_VERSION = "daily-reference-5";
export const MAX_DAILY_DURATION_MS = 120_000;
export const DAILY_GATEWAY_TIMEOUT_MS = 20_000;
export const LANGUAGE_MODEL = "google/gemini-3.7-flash";

export const DAILY_DIAGNOSTIC_CODES = [
  "accepted",
  "no_cycle",
  "no_interpretation",
  "not_configured",
  "timeout",
  "http",
  "rate_limit",
  "credit",
  "auth",
  "network",
  "bad_json",
  "empty_response",
  "shape",
  "count",
  "sentence",
  "length",
  "id",
  "coverage",
  "dependencies",
  "synthesis_coverage",
  "natal_coverage",
  "natal_claim",
  "safety",
  "suppression",
  "placement",
  "body",
  "relation",
  "worded_degree",
  "orb",
  "date",
  "timing",
] as const;
export type DailyDiagnosticCode = (typeof DAILY_DIAGNOSTIC_CODES)[number];
export type DailyGatewayCode =
  | "not_configured"
  | "timeout"
  | "http"
  | "rate_limit"
  | "credit"
  | "auth"
  | "network"
  | "bad_json"
  | "empty_response";
export type DailyRejectionCode = Exclude<
  DailyDiagnosticCode,
  DailyGatewayCode | "accepted" | "no_cycle" | "no_interpretation"
>;

/** Contains bounded measurement fields only. Never put prose, facts or errors here. */
export interface DailyDiagnostics {
  version: typeof DAILY_DIAGNOSTICS_VERSION;
  promptVersion: string;
  validatorVersion: string;
  model: string;
  outcome: "accepted" | "rejected" | "unavailable" | "skipped";
  attempted: boolean;
  code: DailyDiagnosticCode;
  durationMs: number | null;
  /** Recorded gateway deadline, not observed duration. Null means the budget was unrecorded. */
  gatewayTimeoutMs: number | null;
  /** One-based rejected paragraph; null when no particular paragraph is implicated. */
  paragraph: number | null;
}

const LABELS: Record<DailyDiagnosticCode, string> = {
  accepted: "Accepted model wording",
  no_cycle: "No eligible cycle",
  no_interpretation: "No published primary interpretation",
  not_configured: "language layer is not configured",
  timeout: "language gateway timed out",
  http: "language gateway is unavailable",
  rate_limit: "language gateway is rate limited",
  credit: "language gateway requires available credit",
  auth: "language gateway authentication is unavailable",
  network: "language gateway could not be reached",
  bad_json: "language gateway returned invalid JSON",
  empty_response: "gateway returned no content",
  shape: "Malformed draft structure",
  count: "Paragraph count outside bounds",
  sentence: "Sentence structure outside bounds",
  length: "Daily length limit exceeded",
  id: "Invalid supplied fact reference",
  coverage: "Required reference coverage missing",
  dependencies: "Published parent references missing",
  synthesis_coverage: "Published synthesis coverage missing",
  natal_coverage: "Published natal lens coverage missing",
  natal_claim: "Unsupported natal certainty or clinical claim",
  safety: "Language safety check rejected draft",
  suppression: "Suppressed chart wording",
  placement: "Placement absent from daily facts",
  body: "Body absent from cited cycles",
  relation: "Body and aspect relation mismatch",
  worded_degree: "Uncheckable worded degree value",
  orb: "Orb absent from cited cycles",
  date: "Date absent from cited cycles",
  timing: "Current orb and exact timing combined in one sentence",
};
export function diagnosticLabel(code: DailyDiagnosticCode): string {
  return LABELS[code];
}
export const dailyDiagnosticLabel = diagnosticLabel;

const GATEWAY_CODES = new Set<DailyDiagnosticCode>([
  "not_configured",
  "timeout",
  "http",
  "rate_limit",
  "credit",
  "auth",
  "network",
  "bad_json",
  "empty_response",
]);
const CODES = new Set<string>(DAILY_DIAGNOSTIC_CODES);
const SAFE_VERSION = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;
const SAFE_MODEL = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,119}$/;

/** Revive structured measurements without inferring a policy for previously recorded rows. */
export function readDailyDiagnostics(value: unknown): DailyDiagnostics | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const d = value as Record<string, unknown>;
  if (
    d["version"] !== DAILY_DIAGNOSTICS_VERSION ||
    typeof d["promptVersion"] !== "string" ||
    !SAFE_VERSION.test(d["promptVersion"]) ||
    typeof d["validatorVersion"] !== "string" ||
    !SAFE_VERSION.test(d["validatorVersion"]) ||
    typeof d["model"] !== "string" ||
    !SAFE_MODEL.test(d["model"]) ||
    typeof d["code"] !== "string" ||
    !CODES.has(d["code"]) ||
    typeof d["attempted"] !== "boolean"
  )
    return null;
  const code = d["code"] as DailyDiagnosticCode;
  const attempted = d["attempted"];
  const durationMs = d["durationMs"];
  const gatewayTimeoutMs = Object.hasOwn(d, "gatewayTimeoutMs") ? d["gatewayTimeoutMs"] : null;
  const paragraph = d["paragraph"];
  if (
    attempted
      ? typeof durationMs !== "number" ||
        !Number.isInteger(durationMs) ||
        durationMs < 0 ||
        durationMs > MAX_DAILY_DURATION_MS
      : durationMs !== null
  )
    return null;
  if (
    gatewayTimeoutMs !== null &&
    (typeof gatewayTimeoutMs !== "number" ||
      !Number.isInteger(gatewayTimeoutMs) ||
      gatewayTimeoutMs < 1 ||
      gatewayTimeoutMs > MAX_DAILY_DURATION_MS)
  )
    return null;
  if (
    paragraph !== null &&
    (typeof paragraph !== "number" ||
      !Number.isInteger(paragraph) ||
      paragraph < 1 ||
      paragraph > 100)
  )
    return null;
  const outcome = d["outcome"];
  if (outcome === "accepted") {
    if (code !== "accepted" || !attempted || paragraph !== null) return null;
  } else if (outcome === "skipped") {
    if (
      !(["no_cycle", "no_interpretation"] as string[]).includes(code) ||
      attempted ||
      paragraph !== null
    )
      return null;
  } else if (outcome === "unavailable") {
    if (!GATEWAY_CODES.has(code) || attempted !== (code !== "not_configured") || paragraph !== null)
      return null;
  } else if (outcome === "rejected") {
    if (
      code === "accepted" ||
      code === "no_cycle" ||
      code === "no_interpretation" ||
      GATEWAY_CODES.has(code) ||
      !attempted
    )
      return null;
  } else return null;
  return {
    version: DAILY_DIAGNOSTICS_VERSION,
    promptVersion: d["promptVersion"] as string,
    validatorVersion: d["validatorVersion"] as string,
    model: d["model"] as string,
    outcome,
    attempted,
    code,
    durationMs: durationMs as number | null,
    gatewayTimeoutMs: gatewayTimeoutMs as number | null,
    paragraph: paragraph as number | null,
  };
}
