import type { fetchCycles } from "@/lib/pattern.functions";

export type TimingData = Extract<
  Awaited<ReturnType<typeof fetchCycles>>,
  { needsOnboarding: false }
>;
export type TimingCycle = TimingData["cycles"][number];
export type TimingPhase = "building" | "exact" | "fading";
export type PhaseFilter = "all" | TimingPhase;

export const PHASE_LABEL = {
  building: { label: "Building", help: "The aspect is tightening toward its closest pass." },
  exact: { label: "Exact", help: "The aspect is at its closest point today." },
  fading: { label: "Fading", help: "The closest pass has happened; the window is easing off." },
} as const;

export const DOMAIN_LABEL: Record<string, string> = {
  all: "Every area",
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

export function windowTitle(cycle: TimingCycle) {
  return (
    pointName(cycle.transit_body) +
    " " +
    (ASPECT_MEANING[cycle.aspect] ?? cycle.aspect) +
    " your " +
    pointName(cycle.natal_point)
  );
}

export function weightLabel(weight: number) {
  return weight >= 0.7 ? "Major" : weight >= 0.4 ? "Prominent" : "Background";
}

export function daysToExact(cycle: TimingCycle, day: string): number | null {
  if (
    cycle.days_to_exact !== null &&
    cycle.days_to_exact !== undefined &&
    Number.isFinite(cycle.days_to_exact)
  )
    return cycle.days_to_exact;
  if (!cycle.exact_at) return null;
  const days = (Date.parse(cycle.exact_at) - Date.parse(day + "T12:00:00Z")) / 86400000;
  return Number.isFinite(days) ? Math.round(days) : null;
}

export function windowPhase(cycle: TimingCycle, day: string): TimingPhase {
  const days = daysToExact(cycle, day);
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

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function timingDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not in range";
  return DATE_FORMAT.format(new Date(value));
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

/** Use the same UTC-noon reference as the calculation engine. Never invent a missing endpoint. */
export function timelinePositions(cycle: TimingCycle, day: string) {
  const start = cycle.ingress_at ? Date.parse(cycle.ingress_at) : NaN;
  const end = cycle.egress_at ? Date.parse(cycle.egress_at) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const position = (value: string | null) => {
    if (!value) return null;
    const pct = ((Date.parse(value) - start) / (end - start)) * 100;
    return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null;
  };
  return { today: position(day + "T12:00:00Z"), exact: position(cycle.exact_at) };
}
