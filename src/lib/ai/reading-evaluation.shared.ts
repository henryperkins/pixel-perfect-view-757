/** Browser-safe synthetic evaluation catalog and report helpers. No account or gateway access. */
import { z } from "zod";
import { getEvaluationCaseSet } from "./evaluation-case-sets";
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "./reading-evaluation.fixtures.mjs";
import type { DailyTransitStoryPlan } from "../content/transit-story";
import type { FactAtom } from "./facts";
import { LANGUAGE_PROVIDERS, type DailyDiagnostics, type LanguageProvider } from "./diagnostics";
import type { DailyPlanIdentity } from "../content/synthesis";
import type { DailyNatalLensPlan } from "../content/natal-lens";
import type { NatalReliabilityManifest } from "../astro/natal-reliability";
import type { DailyWritingPlan } from "../content/daily-writing";
import type { DailyReflectionPlan } from "../content/daily-reflection";
import type { DailyWritingQualityReport, DailyWritingRenderMode } from "./daily-writing-quality";
import { QUALIFICATION_PROFILES, type QualificationProfile } from "./qualification-profiles";
import type { AdminTransportTrace } from "./admin-transport";
import { latencyProbePreviewSchema, latencyProbeRunSchema } from "./latency-probe";
import { editorialPilotPreviewSchema, editorialPilotRunSchema } from "./editorial-pilot";
import { contextPilotPreviewSchema, contextPilotRunSchema } from "./context-pilot";

export { READING_EVAL_FIXTURE_VERSION };
export const READING_EVALUATION_CATALOG = READING_EVAL_CASES.map((fixed) => ({
  id: fixed.id,
  label: fixed.id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
  description: fixed.description,
  expectsModel: fixed.id !== "quiet-threshold",
}));
export const LIVE_EVALUATION_CASES = READING_EVALUATION_CATALOG;

/**
 * Evaluation-only copy choice. `active` is the effective production copy; the others
 * are the shipped natal-free baseline and inactive natal and transit candidates. Choosing one never
 * publishes, activates or caches content.
 */
export const READING_EVALUATION_BUNDLE_SOURCES = [
  "active",
  "builtin",
  "natal-candidate",
  "transit-candidate",
  "writing-candidate",
] as const;
export type ReadingEvaluationBundleSource =
  | (typeof READING_EVALUATION_BUNDLE_SOURCES)[number]
  | "content-comparison"
  | "latency-probe"
  | "editorial-pilot"
  | "context-pilot";

export const contentComparisonSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("draft"), draftId: z.string().min(1).max(80) }).strict(),
  z
    .object({
      kind: z.literal("release"),
      releaseId: z.string().min(1).max(80),
      baselineReleaseId: z.string().min(1).max(80),
    })
    .strict(),
]);
export const contentComparisonPreviewSchema = z
  .object({
    mode: z.literal("content-comparison"),
    source: contentComparisonSourceSchema,
    arm: z.enum(["baseline", "candidate"]),
    caseSetId: z.enum(["draft-pilot-1", "draft-pilot-2"]),
    provider: z.enum(LANGUAGE_PROVIDERS),
    campaignId: z.string().uuid().optional(),
  })
  .strict();
export const contentComparisonRunSchema = contentComparisonPreviewSchema
  .extend({
    expectedPlanHash: z.string().regex(/^[a-f0-9]{64}$/),
    budget: z
      .object({
        dollarCeilingCents: z.number().int().min(100).max(500),
        reviewReserveCents: z.number().int().min(0).max(500),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ContentComparisonSettings = z.infer<typeof contentComparisonRunSchema>;

/** A server-side run fixes its copy and provider when it starts. */
const legacyReadingEvaluationRunInputSchema = z
  .object({
    bundleSource: z.enum(READING_EVALUATION_BUNDLE_SOURCES),
    provider: z.enum(LANGUAGE_PROVIDERS),
    qualificationProfile: z.enum(QUALIFICATION_PROFILES).optional(),
    enterpriseThinking: z.enum(["LOW", "MEDIUM"]).optional(),
    expectedPlanHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    campaignId: z.string().uuid().optional(),
    budget: z
      .object({
        dollarCeilingCents: z.number().int().min(100).max(100_000),
        reviewReserveCents: z.number().int().min(0).max(100_000),
      })
      .strict()
      .optional(),
  })
  .strict();

export const readingEvaluationRunInputSchema = z.union([
  contextPilotRunSchema,
  editorialPilotRunSchema,
  legacyReadingEvaluationRunInputSchema,
  contentComparisonRunSchema,
  latencyProbeRunSchema,
]);
export const readingEvaluationPreviewInputSchema = z.union([
  contextPilotPreviewSchema,
  editorialPilotPreviewSchema,
  legacyReadingEvaluationRunInputSchema,
  contentComparisonPreviewSchema,
  latencyProbePreviewSchema,
]);

export const READING_EVALUATION_RUN_STATUSES = [
  "queued",
  "running",
  "stopping",
  "complete",
  "stopped",
  "halted",
  "error",
] as const;
export type ReadingEvaluationRunStatus = (typeof READING_EVALUATION_RUN_STATUSES)[number];
/** An active run with no stored progress for this long is shown as stalled and can be replaced. */
export const READING_EVALUATION_STALL_MS = 5 * 60_000;
export function readingEvaluationRunActive(status: ReadingEvaluationRunStatus): boolean {
  return status === "queued" || status === "running" || status === "stopping";
}
export interface ReadingEvaluationRun {
  id: string;
  status: ReadingEvaluationRunStatus;
  provider: LanguageProvider;
  bundleSource: ReadingEvaluationBundleSource;
  total: number;
  /** Persisted execution order, including repeated cases. Older responses may omit it. */
  caseIds?: string[];
  completed: number;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  qualificationProfile?: QualificationProfile;
  campaignId?: string;
  attemptLimit?: number;
  editorialPilot?: { version: "daily-editorial-pilot-1"; quietDates: string[] };
  contextPilot?: {
    version:
      | "daily-context-pilot-1"
      | "daily-context-pilot-2"
      | "daily-context-pilot-3"
      | "daily-context-pilot-4";
    benchmarkHash: string;
  };
  enterpriseThinking?: "LOW" | "MEDIUM";
  contentComparison?: {
    arm: "baseline" | "candidate";
    pairHash: string;
    caseSetId: "draft-pilot-1" | "draft-pilot-2";
  };
  latencyProbe?: {
    version: "content-latency-probe-1";
    positions: readonly { caseId: string; thinking: "LOW" | "MEDIUM" }[];
  };
}

/** The next scheduled case comes from the persisted run, never an unrelated catalogue index. */
export function readingEvaluationCurrentCaseLabel(run: ReadingEvaluationRun | null): string | null {
  if (!run || !readingEvaluationRunActive(run.status)) return null;
  const caseId = run.caseIds?.[run.completed];
  if (!caseId) return null;
  return READING_EVALUATION_CATALOG.find((fixed) => fixed.id === caseId)?.label ?? caseId;
}

export function readingEvaluationReportScope(run: ReadingEvaluationRun | null): string {
  if (
    run?.contextPilot?.version === "daily-context-pilot-3" ||
    run?.contextPilot?.version === "daily-context-pilot-4"
  )
    return "Context-aware writer pilot: at most five generated bodies against the frozen benchmarks. Headline and reflection remain authored. Runtime fallback bodies and original review benchmarks are recorded separately. A rejected body and its fallback are separate outcomes; partial captures cannot qualify the complete set.";
  if (run?.contextPilot)
    return "Context-aware writer pilot: at most five generated bodies against the frozen benchmarks. Headline and reflection remain authored. A rejected body and its fallback are separate outcomes; partial captures cannot qualify the complete set.";
  if (run?.editorialPilot)
    return "Candidate-only editorial pilot: six scenarios and a four-date quiet sequence, at most five model attempts. Quiet outputs are deterministic; this is not a consecutive-day model test.";
  if (run?.latencyProbe)
    return "Latency probe captures are four planned observations by position and thinking level; only a case with both complete levels supports paired review.";
  if (run?.enterpriseThinking)
    return "Pilot captures retain every repetition by position; download stored attempts for this experiment.";
  if (run?.status !== "complete")
    return "This run is partial; downloaded reports include completed cases only and cannot be used as a complete comparison.";
  if (run.contentComparison)
    return `This ${run.contentComparison.arm} arm contains all ${run.total} pilot cases. Download paired pilot evidence from the saved-content evaluation panel to compare both arms.`;
  return `This run contains all ${run.total} scheduled cases. Compare exports only when their source plans and case sets match.`;
}

/** The only accepted request: a fixed case ID plus optional closed copy and provider selectors. */
export const readingEvaluationInputSchema = z
  .object({
    caseId: z.string().min(1).max(80),
    bundleSource: z.enum(READING_EVALUATION_BUNDLE_SOURCES).optional(),
    provider: z.enum(LANGUAGE_PROVIDERS).optional(),
  })
  .strict();

export type EvaluationJsonValue =
  null | boolean | number | string | EvaluationJsonValue[] | { [key: string]: EvaluationJsonValue };

export interface SyntheticReadingRequest {
  model: string;
  max_tokens?: number;
  messages: { role: "system" | "user"; content: string }[];
  response_format: {
    type: "json_schema";
    json_schema: { name: string; strict: true; schema: EvaluationJsonValue };
  };
}
export interface SyntheticReadingCandidate {
  paragraphs: { text: string | null; facts: string[]; scenes?: string[] | null }[];
  paragraphCount: number | null;
  truncated: boolean;
  /**
   * True only when every raw paragraph's text and fact IDs survived capture unchanged,
   * decided before bounding or filtering. Absent in historical reports.
   */
  captureLossless?: boolean;
}
export interface ReadingEvaluationMetadata {
  reportVersion: 1;
  qualificationProfile?: QualificationProfile;
  qualificationPolicyVersion?: string;
  sourceSha?: string | null;
  runPlanHash?: string;
  requestPolicyVersion?: string;
  enterpriseThinking?: "LOW" | "MEDIUM";
  experimentVersion?:
    | "enterprise-thinking-pilot-1"
    | "content-latency-probe-1"
    | "daily-editorial-pilot-1"
    | "daily-context-pilot-1"
    | "daily-context-pilot-2"
    | "daily-context-pilot-3"
    | "daily-context-pilot-4";
  fixtureVersion: string;
  caseSetHash: string;
  caseSetId?: import("./evaluation-case-sets").EvaluationCaseSetId;
  contentComparison?: {
    version: "content-comparison-1" | "content-comparison-2";
    arm: "baseline" | "candidate";
    pairHash: string;
    baselineCanonicalHash: string;
    candidateCanonicalHash: string;
    caseSetId: "draft-pilot-1" | "draft-pilot-2";
  };
  bundleVersion: string;
  bundleHash: string;
  /** Normalized transit copy without release identity or candidate catalogues. */
  transitCopyHash?: string;
  /** Absent in historical reports; never infer their plan policy. */
  planVersion?: string;
  natalPlanVersion?: string;
  reliabilityVersion?: string;
  storyPlanVersion?: string;
  anchorVersion?: string;
  solverVersion?: string;
  sourceContract?: string;
  transitFixtureHash?: string;
  storyUse?: boolean;
  writingPlanVersion?: string;
  writingQualityVersion?: string;
  reflectionVersion?: string;
  voiceExamplesVersion?: string;
  promptVersion: string;
  validatorVersion: string;
  model: string;
  gatewayTimeoutMs: number;
  /** Absent in historical reports; never inferred. */
  bundleSource?: ReadingEvaluationBundleSource;
  /** Current production-path context pilot only; absent in historical captures. */
  contextRuntime?: {
    path: "member-production-context";
    memberAdapterVersion: string;
  };
  source: "live-synthetic";
  network: string;
  warning: string;
}
export interface ReadingEvaluationCaseRow {
  /** Per-case production context identity; never promoted to combined report metadata. */
  contextRuntime?: {
    mode: string;
    benchmarkSourceHash: string;
    fallbackBodyHash: string;
    benchmarkBodyHash: string;
  };
  transport?: AdminTransportTrace | null;
  id: string;
  description: string;
  config: { day: string; timeZone: string; tone: string; depth: string; granted: string[] };
  configHash: string;
  localNoon: string;
  eligibleCycleKeys: string[];
  facts: FactAtom[];
  interpretationPlan?: DailyPlanIdentity;
  natalLensPlan?: DailyNatalLensPlan;
  transitStoryPlan?: DailyTransitStoryPlan;
  natalReliability?: NatalReliabilityManifest | null;
  writingPlan?: DailyWritingPlan;
  reflectionPlan?: DailyReflectionPlan;
  writingFrameMode?: "none";
  writing?: {
    renderMode: DailyWritingRenderMode;
    sceneUse: { id: "SC1" | "SC2"; paragraph: number }[];
    candidateQuality: DailyWritingQualityReport;
    finalQuality: DailyWritingQualityReport;
  };
  request: SyntheticReadingRequest | null;
  candidate: SyntheticReadingCandidate | null;
  diagnostics: DailyDiagnostics;
  output: {
    mode: "model" | "template";
    headline: string;
    body: string;
    prompt: string;
    citations: { paragraph: number; facts: string[] }[];
  };
  template: { body: string };
  manualReview: {
    specificity: null;
    voice: null;
    repetition: null;
    grounding: null;
    lensIntegration?: null;
    unsupportedPersonalClaim?: null;
    temporalCoherence?: null;
    chapterIntegration?: null;
    unsupportedHistory?: null;
    promisedResolution?: null;
    notes: null;
  };
}
export interface ReadingEvaluationCaseResult {
  metadata: ReadingEvaluationMetadata;
  case: ReadingEvaluationCaseRow;
  controller?: {
    version: "evaluation-disposition-1";
    status: "running" | "complete" | "halted" | "error";
    message: string | null;
  };
}
/** Includes uncertain attempts even when no complete case can be combined. Admin-only. */
export interface ReadingEvaluationLedger {
  version: "evaluation-ledger-1";
  costStatus: "reservation-estimates-not-invoices" | "legacy-accounting-unknown";
  sourcePlan: EvaluationJsonValue;
  dollarCeilingMicros: number | null;
  reviewReserveMicros: number | null;
  campaignAttempts: number;
  campaignReservedMicros: number;
  entries: {
    position: number;
    caseId: string;
    attempted: boolean;
    reservedMicros: number;
    capture: "uncertain" | "stored";
    raw: EvaluationJsonValue;
  }[];
}
export interface ReadingEvaluationSummary {
  cases: number;
  gatewayReplays: 0;
  modelAttempts: number;
  outcomes: { accepted: number; rejected: number; unavailable: number; skipped: number };
  reasons: Record<string, number>;
  replayAcceptanceRate: null;
  syntheticModelAcceptanceRate: number | null;
  /** Synthetic samples cannot establish a production-user acceptance rate. */
  liveAcceptanceRate: null;
}
export interface ReadingEvaluationReport extends ReadingEvaluationMetadata {
  partial: boolean;
  expectedCases: number;
  summary: ReadingEvaluationSummary;
  cases: ReadingEvaluationCaseRow[];
}

export function summarizeReadingEvaluation(
  cases: ReadingEvaluationCaseRow[],
): ReadingEvaluationSummary {
  const outcomes = { accepted: 0, rejected: 0, unavailable: 0, skipped: 0 };
  const reasons: Record<string, number> = {};
  let attempted = 0;
  for (const row of cases) {
    outcomes[row.diagnostics.outcome] += 1;
    reasons[row.diagnostics.code] = (reasons[row.diagnostics.code] ?? 0) + 1;
    if (row.diagnostics.attempted) attempted += 1;
  }
  return {
    cases: cases.length,
    gatewayReplays: 0,
    modelAttempts: attempted,
    outcomes,
    reasons,
    replayAcceptanceRate: null,
    syntheticModelAcceptanceRate: attempted ? outcomes.accepted / attempted : null,
    liveAcceptanceRate: null,
  };
}

/** Refuse a mixed run; content/model/brief can change between sequential requests. */
export function combineReadingEvaluationResults(
  results: ReadingEvaluationCaseResult[],
  { partial = false }: { partial?: boolean } = {},
): ReadingEvaluationReport {
  const first = results[0];
  if (!first) throw new Error("No synthetic evaluation results to combine");
  const editorialPilot = first.metadata.caseSetId === "daily-editorial-1";
  const metadataFields = [
    "reportVersion",
    "qualificationProfile",
    "qualificationPolicyVersion",
    "sourceSha",
    "runPlanHash",
    "requestPolicyVersion",
    "enterpriseThinking",
    "experimentVersion",
    "fixtureVersion",
    "caseSetHash",
    "caseSetId",
    "bundleVersion",
    "bundleHash",
    "transitCopyHash",
    "planVersion",
    "natalPlanVersion",
    "reliabilityVersion",
    "storyPlanVersion",
    "anchorVersion",
    "solverVersion",
    "sourceContract",
    "transitFixtureHash",
    "storyUse",
    "writingPlanVersion",
    "writingQualityVersion",
    "reflectionVersion",
    "voiceExamplesVersion",
    "promptVersion",
    "validatorVersion",
    "model",
    "gatewayTimeoutMs",
    "bundleSource",
    "source",
    "network",
  ] as const;
  if (
    (["synthetic-daily-6", "synthetic-daily-7"].includes(first.metadata.fixtureVersion) &&
      (
        [
          "storyPlanVersion",
          "anchorVersion",
          "solverVersion",
          "sourceContract",
          "transitFixtureHash",
        ] as const
      ).some((key) => !first.metadata[key])) ||
    (["synthetic-daily-6", "synthetic-daily-7"].includes(first.metadata.fixtureVersion) &&
      typeof first.metadata.storyUse !== "boolean")
  )
    throw new Error("Synthetic evaluation configuration requires transit policy identities");
  // Persisted completed runs retain the fixture inventory that generated them.
  // Adding current cases must not turn an old complete download into a partial run.
  let catalog = READING_EVAL_CASES;
  if (first.metadata.fixtureVersion !== "synthetic-daily-7")
    catalog = catalog.filter((fixed) => !fixed.id.startsWith("writing-"));
  if (first.metadata.fixtureVersion === "synthetic-daily-5") {
    const historicalTransit = Boolean(first.metadata.storyPlanVersion);
    catalog = catalog.filter((fixed) => historicalTransit || !fixed.id.startsWith("arc-"));
    if (historicalTransit || first.metadata.natalPlanVersion === "daily-natal-lens-1")
      catalog = catalog.filter(
        (fixed) => !["natal-own-target", "natal-moon-fallback"].includes(fixed.id),
      );
  } else if (first.metadata.fixtureVersion === "synthetic-daily-4") {
    catalog = catalog.filter(
      (fixed) => !fixed.id.startsWith("natal-") && !fixed.id.startsWith("arc-"),
    );
  }
  if (first.metadata.caseSetId) {
    const manifest = getEvaluationCaseSet(first.metadata.caseSetId);
    if (
      manifest.fixtureVersion !== first.metadata.fixtureVersion ||
      manifest.caseSetHash !== first.metadata.caseSetHash
    )
      throw new Error("Synthetic evaluation case set identity changed.");
    catalog = manifest.cases;
  }
  const expected = new Set(catalog.map((fixed) => fixed.id));
  const seen = new Set<string>();
  for (const result of results) {
    if (
      metadataFields.some(
        (field) =>
          !(editorialPilot && field === "network") &&
          first.metadata[field] !== result.metadata[field],
      ) ||
      JSON.stringify(first.metadata.contentComparison) !==
        JSON.stringify(result.metadata.contentComparison) ||
      JSON.stringify(first.metadata.contextRuntime) !==
        JSON.stringify(result.metadata.contextRuntime)
    )
      throw new Error(
        "Synthetic evaluation configuration changed during the run. Start a new run.",
      );
    if (!expected.has(result.case.id) || seen.has(result.case.id))
      throw new Error("Synthetic evaluation results contain an unknown or duplicate case");
    seen.add(result.case.id);
  }
  if (!partial && seen.size !== expected.size)
    throw new Error("A complete synthetic evaluation requires all fixed cases");
  const actualModels = new Set(
    results.map((r) => r.case.transport?.actualModel).filter((m): m is string => !!m),
  );
  if (actualModels.size > 1)
    throw Error("Synthetic evaluation actual provider model changed during the run.");
  const cases = catalog.flatMap((fixed) =>
    results.filter((result) => result.case.id === fixed.id).map((result) => result.case),
  );
  const summary = summarizeReadingEvaluation(cases);
  return {
    ...first.metadata,
    ...(editorialPilot
      ? {
          network: `${summary.modelAttempts} provider requests attempted; ${cases.filter((item) => item.writingPlan?.editorial?.mode === "quiet").length} authored quiet outputs; fixed synthetic facts only.`,
          warning:
            "Candidate-only synthetic outputs. Inspect each case's diagnostics and output mode: quiet outputs are authored copy, and fallback templates are not model writing. These captures do not establish member acceptance or editorial quality.",
        }
      : {}),
    partial: partial || seen.size !== expected.size,
    expectedCases: expected.size,
    summary,
    cases,
  };
}

export function serializeReadingEvaluationReport(report: ReadingEvaluationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
