/**
 * Closed four-observation latency probe (`content-latency-probe-1`).
 *
 * Implements the offline proposal in
 * `docs/reviews/content-draft-effectiveness/2026-10-13-timeout-diagnosis/next-experiment.json`:
 * the same frozen draft baseline and two `draft-pilot-2` cases, observed once each
 * at explicit LOW and MEDIUM Gemini Enterprise thinking, inside one guarded
 * campaign. At most four attempts and a $5 total generation cap; the cap can
 * stop the campaign before complete pairs exist. No retries, replacements or
 * candidate arm. This module carries no provider, account or content access.
 */
import { z } from "zod";
import type { EnterpriseThinkingLevel } from "./admin-transport";

export const LATENCY_PROBE_VERSION = "content-latency-probe-1" as const;
export const LATENCY_PROBE_PROVIDER = "gemini-enterprise" as const;
export const LATENCY_PROBE_MODEL = "gemini-enterprise/gemini-3.8-flash" as const;
export const LATENCY_PROBE_NATIVE_MODEL = "gemini-3.8-flash" as const;
export const LATENCY_PROBE_CASE_SET_ID = "draft-pilot-2" as const;
export const LATENCY_PROBE_BASELINE_CANONICAL_HASH =
  "44c05c8b0336dc778c2efdcbf0c28dc2091d33a96b91c352a2481123b7f7ccae" as const;
export const LATENCY_PROBE_DEADLINE_MS = 60_000;
export const LATENCY_PROBE_MAX_INPUT_BYTES = 65_536;
export const LATENCY_PROBE_MAX_OUTPUT_TOKENS = 65_536;
export const LATENCY_PROBE_ATTEMPT_LIMIT = 4;
export const LATENCY_PROBE_DOLLAR_CEILING_MICROS = 5_000_000;
export const LATENCY_PROBE_RESERVATION_MICROS = 2_800_000;

/** Fixed order from the proposal; each position is one planned observation, never a retry. */
export const LATENCY_PROBE_POSITIONS = [
  { caseId: "fallback-soft-neptune-mercury", thinking: "LOW" },
  { caseId: "fallback-soft-saturn-mercury", thinking: "MEDIUM" },
  { caseId: "fallback-soft-saturn-mercury", thinking: "LOW" },
  { caseId: "fallback-soft-neptune-mercury", thinking: "MEDIUM" },
] as const satisfies readonly { caseId: string; thinking: EnterpriseThinkingLevel }[];

/** Frozen before generation; its identity rides inside the plan hash. */
export const LATENCY_PROBE_REVIEW_RUBRIC = {
  version: "latency-probe-review-1",
  body: "Existing specificity, grounding and coherence scores of at least 4/5 with the existing repetition thresholds; zero substantive unsupported claims.",
  reflection:
    "The primary source question must permit an answer of nothing/not a fit; the assembled prompt contains exactly one safe question.",
  reviewers: 2,
  humanApproval: false,
  pairing: "Neutral paired review only for a case with both complete LOW and MEDIUM captures.",
} as const;

export const latencyProbeSourceSchema = z
  .object({ kind: z.literal("draft"), draftId: z.string().min(1).max(80) })
  .strict();
export type LatencyProbeSource = z.infer<typeof latencyProbeSourceSchema>;

export const latencyProbePreviewSchema = z
  .object({
    mode: z.literal("latency-probe"),
    source: latencyProbeSourceSchema,
  })
  .strict();
export const latencyProbeRunSchema = latencyProbePreviewSchema
  .extend({ expectedPlanHash: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict();
export type LatencyProbeSettings = z.infer<typeof latencyProbeRunSchema>;
