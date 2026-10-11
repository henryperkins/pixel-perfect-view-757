export type TravelStep = "day" | "week" | "month" | "year";

const DAY_MS = 86400000;
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

/** Match the calculation engine's UTC-noon reference, without normalizing invalid dates. */
export function isTravelDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const parsed = new Date(value + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function shiftTravelDate(day: string, amount: number, step: TravelStep): string | null {
  if (!isTravelDate(day)) return null;
  const date = new Date(day + "T12:00:00Z");
  if (step === "day" || step === "week") {
    date.setUTCDate(date.getUTCDate() + amount * (step === "week" ? 7 : 1));
  } else {
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    if (step === "month") date.setUTCMonth(date.getUTCMonth() + amount);
    else date.setUTCFullYear(date.getUTCFullYear() + amount);
    const lastDay = new Date(date.getTime());
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(originalDay, lastDay.getUTCDate()));
  }
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999)
    return null;
  return date.toISOString().slice(0, 10);
}

export function travelDate(day: string) {
  return DATE_FORMAT.format(new Date(day + "T12:00:00Z"));
}

export function travelWeekday(day: string) {
  return WEEKDAY_FORMAT.format(new Date(day + "T12:00:00Z"));
}

export function dayRelation(day: string, today: string) {
  const days = Math.round(
    (Date.parse(day + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / DAY_MS,
  );
  if (days === 0) return "Today";
  return (
    NUMBER_FORMAT.format(Math.abs(days)) +
    " " +
    (Math.abs(days) === 1 ? "day" : "days") +
    (days < 0 ? " before today" : " after today")
  );
}
