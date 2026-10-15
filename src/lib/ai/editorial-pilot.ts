/** Closed candidate-only editorial pilot. These are new limits, not a reopened prior campaign. */
import { z } from "zod";

export const EDITORIAL_PILOT_VERSION = "daily-editorial-pilot-1" as const;
export const EDITORIAL_PILOT_CASE_SET_ID = "daily-editorial-1" as const;
export const EDITORIAL_PILOT_ATTEMPT_LIMIT = 5;
export const EDITORIAL_PILOT_DOLLAR_CEILING_MICROS = 5_000_000;
export const EDITORIAL_PILOT_RESERVATION_MICROS = 2_800_000;
export const EDITORIAL_PILOT_REVIEW_RUBRIC = {
  version: "daily-editorial-reader-review-1",
  dimensions: ["recognition", "meaning", "direction", "distinctness", "voice"],
  grounding:
    "Zero unsupported personal, causal, outcome or astrology claims; interpretation imagery is compared with its selected source.",
  reflection:
    "One safe source-supported question that deepens the reading without presuming its example occurred.",
  sequence:
    "Four consecutive quiet dates test deterministic voice variation only; they are not a successive-day model/contact test.",
  humanApproval: false,
} as const;
export const editorialPilotPreviewSchema = z
  .object({ mode: z.literal("editorial-pilot") })
  .strict();
export const editorialPilotRunSchema = editorialPilotPreviewSchema
  .extend({
    expectedPlanHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type EditorialPilotSettings = z.infer<typeof editorialPilotRunSchema>;
