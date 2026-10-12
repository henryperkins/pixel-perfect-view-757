/** Browser-safe synthetic evaluation catalog and report helpers. No account or gateway access. */
import { z } from "zod";
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
] as const;
export type ReadingEvaluationBundleSource = (typeof READING_EVALUATION_BUNDLE_SOURCES)[number];

/** A server-side run fixes its copy and provider when it starts. */
export const readingEvaluationRunInputSchema = z
  .object({
    bundleSource: z.enum(READING_EVALUATION_BUNDLE_SOURCES),
    provider: z.enum(LANGUAGE_PROVIDERS),
  })
  .strict();

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
  completed: number;
  message: string | null;
  createdAt: string;
  updatedAt: string;
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
  messages: { role: "system" | "user"; content: string }[];
  response_format: {
    type: "json_schema";
    json_schema: { name: string; strict: true; schema: EvaluationJsonValue };
  };
}
export interface SyntheticReadingCandidate {
  paragraphs: { text: string | null; facts: string[] }[];
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
  fixtureVersion: string;
  caseSetHash: string;
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
  promptVersion: string;
  validatorVersion: string;
  model: string;
  gatewayTimeoutMs: number;
  /** Absent in historical reports; never inferred. */
  bundleSource?: ReadingEvaluationBundleSource;
  source: "live-synthetic";
  network: string;
  warning: string;
}
export interface ReadingEvaluationCaseRow {
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
  const metadataFields = [
    "reportVersion",
    "fixtureVersion",
    "caseSetHash",
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
    "promptVersion",
    "validatorVersion",
    "model",
    "gatewayTimeoutMs",
    "bundleSource",
    "source",
    "network",
  ] as const;
  if (
    (first.metadata.fixtureVersion === "synthetic-daily-6" &&
      (
        [
          "storyPlanVersion",
          "anchorVersion",
          "solverVersion",
          "sourceContract",
          "transitFixtureHash",
        ] as const
      ).some((key) => !first.metadata[key])) ||
    (first.metadata.fixtureVersion === "synthetic-daily-6" &&
      typeof first.metadata.storyUse !== "boolean")
  )
    throw new Error("Synthetic evaluation configuration requires transit policy identities");
  // Persisted completed runs retain the fixture inventory that generated them.
  // Adding current cases must not turn an old complete download into a partial run.
  let catalog = READING_EVAL_CASES;
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
  const expected = new Set(catalog.map((fixed) => fixed.id));
  const seen = new Set<string>();
  for (const result of results) {
    if (metadataFields.some((field) => first.metadata[field] !== result.metadata[field]))
      throw new Error(
        "Synthetic evaluation configuration changed during the run. Start a new run.",
      );
    if (!expected.has(result.case.id) || seen.has(result.case.id))
      throw new Error("Synthetic evaluation results contain an unknown or duplicate case");
    seen.add(result.case.id);
  }
  if (!partial && seen.size !== expected.size)
    throw new Error("A complete synthetic evaluation requires all fixed cases");
  const cases = catalog.flatMap((fixed) =>
    results.filter((result) => result.case.id === fixed.id).map((result) => result.case),
  );
  return {
    ...first.metadata,
    partial: partial || seen.size !== expected.size,
    expectedCases: expected.size,
    summary: summarizeReadingEvaluation(cases),
    cases,
  };
}

export function serializeReadingEvaluationReport(report: ReadingEvaluationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
