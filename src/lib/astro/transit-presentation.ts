import type { DailyTransitCalculation, StoryTimingOverlay } from "./transit-episodes";
import type { CycleInstance } from "./cycles";
export const TRANSIT_PRESENTATION_VERSION = "transit-presentation-2";
export function primaryStoryOverlay(
  calculation: DailyTransitCalculation | null | undefined,
  key: string,
): StoryTimingOverlay | null {
  return calculation?.status === "qualified" && calculation.timingOverlay.cycleKey === key
    ? calculation.timingOverlay
    : null;
}
/** Preserve ranking and untouched fallback cycles; qualify the selected primary as one unit. */
export function applyPrimaryStoryCalculation(
  cycles: CycleInstance[],
  calculation: DailyTransitCalculation | null | undefined,
): CycleInstance[] {
  return cycles.map((cycle) => {
    const overlay = primaryStoryOverlay(calculation, cycle.cycle_key);
    if (!overlay || overlay.referenceOrb === undefined) return cycle;
    return {
      ...cycle,
      orb: overlay.referenceOrb,
      phase: overlay.phase,
      ingress_at: overlay.centralIngressAt,
      exact_at: overlay.qualifiedExactDay ? overlay.centralExactAt : null,
      egress_at: overlay.centralEgressAt,
      days_to_exact: overlay.daysToExact,
      arc_position: overlay.windowPosition,
    };
  });
}
export function storyTimingLine(o: StoryTimingOverlay): string {
  if (o.phase === "between")
    return "Timing: between calculated contacts in the connected current window.";
  if (!o.qualifiedExactDay)
    return "Timing: the sampled birth times do not support a single exact calendar day.";
  return `Timing: the calculated exact contact falls on ${o.qualifiedExactDay}. This describes the current connected window.`;
}
