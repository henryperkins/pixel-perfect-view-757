import { createHash } from "node:crypto";
import { TRANSIT_ANCHOR_VERSION, validateTransitAnchors } from "../astro/transit-anchors";
import {
  TRANSIT_EPISODE_CONTRACT,
  TRANSIT_EPISODE_SOLVER_VERSION,
  resolveDailyTransitCalculation,
} from "../astro/transit-episodes";
import { DAILY_TRANSIT_STORY_VERSION } from "../content/transit-story";
import type { CycleInstance } from "../astro/cycles";
import { READING_EVAL_CASES, type SyntheticFixture } from "./reading-evaluation.fixtures.mjs";

// An isolated evaluation baseline changes only this constant, never a production content pointer.
export const SYNTHETIC_STORY_ENABLED = true;
export const TRANSIT_EVALUATION_METADATA = {
  storyPlanVersion: DAILY_TRANSIT_STORY_VERSION,
  anchorVersion: TRANSIT_ANCHOR_VERSION,
  solverVersion: TRANSIT_EPISODE_SOLVER_VERSION,
  sourceContract: TRANSIT_EPISODE_CONTRACT,
  transitFixtureHash: createHash("sha256")
    .update(
      JSON.stringify(
        READING_EVAL_CASES.filter((f) => f.transitEpisodeScan).map((f) => ({
          scan: f.transitEpisodeScan,
          anchor: f.transitAnchor,
        })),
      ),
    )
    .digest("hex"),
  storyUse: SYNTHETIC_STORY_ENABLED,
};
/** Fixed raw synthetic evidence goes through the production proof and uncertainty checks. No HTTP or birth records. */
export function syntheticTransitCalculation(
  fixed: SyntheticFixture,
  primary: CycleInstance | null | undefined,
) {
  if (!SYNTHETIC_STORY_ENABLED || !fixed.transitEpisodeScan || !fixed.transitAnchor || !primary)
    return null;
  const anchor = validateTransitAnchors(
    fixed.transitAnchor,
    "analytic-private-fingerprint",
    "exact",
  );
  return resolveDailyTransitCalculation(
    fixed.transitEpisodeScan,
    anchor,
    primary,
    fixed.config.day,
    fixed.config.timeZone,
  );
}
