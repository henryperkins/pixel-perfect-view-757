/** Browser-safe synthetic evaluation catalog and report helpers. No account or gateway access. */
import { z } from "zod";
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "./reading-evaluation.fixtures.mjs";
import type { FactAtom } from "./facts";
import type { DailyDiagnostics } from "./diagnostics";
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
 * Evaluation-only copy choice. `active` is the effective production copy; the other two
 * are the shipped natal-free baseline and the inactive natal candidate. Choosing one never
 * publishes, activates or caches content.
 */
export const READING_EVALUATION_BUNDLE_SOURCES = ["active", "builtin", "natal-candidate"] as const;
export type ReadingEvaluationBundleSource = (typeof READING_EVALUATION_BUNDLE_SOURCES)[number];

/** The only accepted request: a fixed case ID and an optional closed copy selector. */
export const readingEvaluationInputSchema = z
  .object({
    caseId: z.string().min(1).max(80),
    bundleSource: z.enum(READING_EVALUATION_BUNDLE_SOURCES).optional(),
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
  /** Normalized transit copy without release identity or natal catalogue (version 5+). */
  transitCopyHash?: string;
  /** Absent in historical reports; never infer their plan policy. */
  planVersion?: string;
  natalPlanVersion?: string;
  reliabilityVersion?: string;
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
    "promptVersion",
    "validatorVersion",
    "model",
    "gatewayTimeoutMs",
    "bundleSource",
    "source",
    "network",
  ] as const;
  const expected = new Set(READING_EVAL_CASES.map((fixed) => fixed.id));
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
  const cases = READING_EVAL_CASES.flatMap((fixed) =>
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
