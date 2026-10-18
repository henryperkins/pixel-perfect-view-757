import { primaryStoryOverlay } from "@/lib/astro/transit-presentation";
import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import type { fetchCycles } from "@/lib/pattern.functions";
import { daysToLocalDate, localNoon, validTimeZone } from "@/lib/local-day";

export type TimingData = Extract<
  Awaited<ReturnType<typeof fetchCycles>>,
  { needsOnboarding: false }
>;
export type TimingCycle = TimingData["cycles"][number];
export type TimingPhase = "building" | "exact" | "fading" | "between" | "uncertain";
export type PhaseFilter = "all" | TimingPhase;

export const PHASE_LABEL = {
  between: {
    label: "Between contacts",
    help: "A calculated station connects these passes; no single contact is current.",
  },
  uncertain: {
    label: "Timing varies",
    help: "The sampled birth times do not support a single phase or exact day.",
  },
  building: { label: "Building", help: "The aspect is tightening toward its closest pass." },
  exact: { label: "Exact", help: "The aspect is at its closest point today." },
  fading: { label: "Fading", help: "The closest pass has happened; the window is easing off." },
} as const;

export const DOMAIN_LABEL: Record<string, string> = {
  all: "Every area",
  general: "General",
  identity: "Identity and direction",
  relationships: "Relationships and affection",
  work: "Work and output",
  "inner-life": "Inner life and rest",
  structure: "Structure and commitments",
};

const POINT_NAME: Record<string, string> = {
  node: "North Node",
  ascendant: "Ascendant",
  midheaven: "Midheaven",
};
const ASPECT_MEANING: Record<string, string> = {
  conjunction: "merging with",
  opposition: "pulling against",
  square: "pressing on",
  trine: "supporting",
  sextile: "opening",
};

export function pointName(key: string) {
  return POINT_NAME[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function contactTitle(transitBody: string, aspect: string, natalPoint: string) {
  return (
    pointName(transitBody) +
    " " +
    (ASPECT_MEANING[aspect] ?? aspect) +
    " your " +
    pointName(natalPoint)
  );
}

export function windowTitle(cycle: TimingCycle) {
  return contactTitle(cycle.transit_body, cycle.aspect, cycle.natal_point);
}

/** Strength labels by minimum weight, strongest first. */
export const STRENGTH_BANDS = [
  { label: "Major", min: 0.7 },
  { label: "Prominent", min: 0.4 },
  { label: "Background", min: 0 },
] as const;

export function weightLabel(weight: number) {
  return (STRENGTH_BANDS.find((band) => weight >= band.min) ?? STRENGTH_BANDS[2]).label;
}

export function daysToExact(
  cycle: TimingCycle,
  day: string,
  timezone = "UTC",
  calculation?: DailyTransitCalculation | null,
): number | null {
  const overlay = primaryStoryOverlay(calculation, cycle.cycle_key);
  if (overlay) return overlay.daysToExact;
  if (
    cycle.days_to_exact !== null &&
    cycle.days_to_exact !== undefined &&
    Number.isFinite(cycle.days_to_exact)
  )
    return cycle.days_to_exact;
  return daysToLocalDate(cycle.exact_at, day, validTimeZone(timezone));
}

export function windowPhase(
  cycle: TimingCycle,
  day: string,
  timezone = "UTC",
  calculation?: DailyTransitCalculation | null,
): TimingPhase {
  const overlay = primaryStoryOverlay(calculation, cycle.cycle_key);
  if (overlay)
    return overlay.phase === "approaching"
      ? "building"
      : overlay.phase === "separating"
        ? "fading"
        : overlay.phase;
  const days = daysToExact(cycle, day, timezone);
  if (days !== null) return days === 0 ? "exact" : days > 0 ? "building" : "fading";
  if (cycle.phase === "exact") return "exact";
  return cycle.phase === "separating" ? "fading" : "building";
}

export function exactPhrase(days: number | null, selectedDay = false) {
  if (days === null) return "No closest pass in range";
  if (days === 0) return selectedDay ? "Exact on this day" : "Exact today";
  if (days === 1) return selectedDay ? "Exact the next day" : "Exact tomorrow";
  if (days === -1) return selectedDay ? "Exact the day before" : "Exact yesterday";
  if (selectedDay)
    return days > 0 ? "Exact " + days + " days later" : "Exact " + Math.abs(days) + " days earlier";
  return days > 0 ? "Exact in " + days + " days" : "Exact " + Math.abs(days) + " days ago";
}

export function timingDate(value: string | null, timezone = "UTC") {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not in range";
  // A date-only key is a civil day, not an instant to shift into another zone.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const instant = new Date(dateOnly ? value + "T12:00:00Z" : value);
  if (dateOnly && instant.toISOString().slice(0, 10) !== value) return "Not in range";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : validTimeZone(timezone),
  }).format(instant);
}

export function arcSentence(cycle: TimingCycle): string | null {
  const p = cycle.arc_position;
  if (p === null || p === undefined || !Number.isFinite(p) || p < 0 || p > 1) return null;
  if (
    cycle.ingress_at &&
    cycle.egress_at &&
    Date.parse(cycle.egress_at) - Date.parse(cycle.ingress_at) < 2 * 86400000
  ) {
    return "A brief window — it passes within a day or so.";
  }
  const pct = Math.round(p * 100);
  if (pct <= 25) return pct + "% through the window — near the start.";
  if (pct <= 60) return pct + "% through the window — around the middle.";
  return pct + "% through the window — the back half, winding down.";
}

/** Use the calculation's effective local-noon instant. Never invent a missing endpoint. */
export function timelinePositions(
  cycle: TimingCycle,
  day: string,
  timezone = "UTC",
  referenceAt?: string,
) {
  const start = cycle.ingress_at ? Date.parse(cycle.ingress_at) : NaN;
  const end = cycle.egress_at ? Date.parse(cycle.egress_at) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const position = (value: string | null) => {
    if (!value) return null;
    const pct = ((Date.parse(value) - start) / (end - start)) * 100;
    return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null;
  };
  const reference = referenceAt ?? localNoon(day, validTimeZone(timezone)).toISOString();
  return { today: position(reference), exact: position(cycle.exact_at) };
}

export function cycleTimingPhrase(
  cycle: TimingCycle,
  day: string,
  timezone = "UTC",
  calculation?: DailyTransitCalculation | null,
  selectedDay = false,
) {
  const o = primaryStoryOverlay(calculation, cycle.cycle_key);
  if (o?.phase === "between") return "Between calculated contacts";
  if (o && !o.qualifiedExactDay) return "Exact day varies across samples";
  return exactPhrase(daysToExact(cycle, day, timezone, calculation), selectedDay);
}

// Calendar, birth-record and consent changes invalidate these queries explicitly.
// An incidental focus or revisiting the same selection keeps its qualified result.
export const CYCLE_QUERY_RETENTION = {
  staleTime: Infinity,
  gcTime: 24 * 60 * 60_000,
  refetchOnWindowFocus: false,
} as const;
