/** A fresh closed candidate experiment; historical runs never reopen this allowance. */
import { z } from "zod";

export const CONTEXT_PILOT_VERSION = "daily-context-pilot-3" as const;
export const CONTEXT_PILOT_CASE_IDS = [
  "contact-only",
  "natal-only",
  "transit-only",
  "natal-and-transit",
  "synthesis-natal-and-transit",
] as const;
export const CONTEXT_PILOT_CASE_SET_ID = "daily-context-1" as const;
export const CONTEXT_PILOT_PROVIDER = "gemini-enterprise" as const;
export const CONTEXT_PILOT_ATTEMPT_LIMIT = 5;
export const CONTEXT_PILOT_DOLLAR_CEILING_MICROS = 5_000_000;
export const CONTEXT_PILOT_RESERVATION_MICROS = 2_800_000;
export const CONTEXT_PILOT_REVIEW_RUBRIC = {
  version: "daily-context-reader-review-1",
  dimensions: ["recognition", "meaning", "direction", "distinctness", "voice"],
  grounding:
    "Zero unsupported personal, causal, outcome or astrology claims; preserve each selected source's condition and distinction.",
  context:
    "Compare contact-only, natal-only, transit-only, both, and synthesis with both against the same reviewed benchmarks. Natal context remains conditional; chronology is exact and appears once.",
  independentFields:
    "Headlines and reflections are reviewed authored runtime fields, never generated output in this pilot. Runtime fallback bodies are frozen independently of the unchanged original review benchmarks.",
  humanApproval: false,
} as const;
export const contextPilotPreviewSchema = z.object({ mode: z.literal("context-pilot") }).strict();
export const contextPilotRunSchema = contextPilotPreviewSchema
  .extend({
    expectedPlanHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type ContextPilotSettings = z.infer<typeof contextPilotRunSchema>;
