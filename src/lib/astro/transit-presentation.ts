import type { DailyTransitCalculation, StoryTimingOverlay } from "./transit-episodes";
export function primaryStoryOverlay(
  calculation: DailyTransitCalculation | null | undefined,
  key: string,
): StoryTimingOverlay | null {
  return calculation?.status === "qualified" && calculation.timingOverlay.cycleKey === key
    ? calculation.timingOverlay
    : null;
}
export function storyTimingLine(o: StoryTimingOverlay): string {
  if (o.phase === "between")
    return "Timing: between calculated contacts in the connected current window.";
  if (!o.qualifiedExactDay)
    return "Timing: the sampled birth times do not support a single exact calendar day.";
  return `Timing: the calculated exact contact falls on ${o.qualifiedExactDay}. This describes the current connected window.`;
}
