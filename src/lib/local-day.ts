const DAY_MS = 86400000;

/** Browser signals may be missing or invalid; birth civil time stays strict. */
export function validTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function browserTimeZone(): string {
  try {
    return validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "UTC";
  }
}

/** A civil calendar key, independent of locale-specific punctuation. */
export function localDayString(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}

function calendarNoon(day: string): Date {
  const date = new Date(`${day}T12:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    day.startsWith("0000") ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  )
    throw new RangeError("Use a valid calendar date.");
  return date;
}

function offsetMilliseconds(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value);
  // setUTCFullYear avoids Date.UTC's special handling of years below 100.
  const localAsUtc = new Date(0);
  localAsUtc.setUTCFullYear(part("year"), part("month") - 1, part("day"));
  localAsUtc.setUTCHours(part("hour"), part("minute"), part("second"), 0);
  return localAsUtc.getTime() - instant.getTime();
}

/** Civil local time -> UTC instant. Invalid birth zones throw rather than drift. */
export function zonedToUtc(day: string, time: string, timeZone: string): Date {
  const naive = calendarNoon(day);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError("Use a valid civil time.");
  const [hour, minute] = time.split(":").map(Number);
  naive.setUTCHours(hour!, minute!, 0, 0);
  let guess = new Date(naive.getTime());
  for (let i = 0; i < 3; i++)
    guess = new Date(naive.getTime() - offsetMilliseconds(guess, timeZone));
  return guess;
}

/** Date computations use noon in the effective consented calendar zone. */
export function localNoon(day: string, timeZone: string): Date {
  return zonedToUtc(day, "12:00", timeZone);
}

/** Date-only arithmetic uses calendar days, even across 23/25-hour DST days. */
export function calendarDaysBetween(day: string, referenceDay: string): number {
  return (calendarNoon(day).getTime() - calendarNoon(referenceDay).getTime()) / DAY_MS;
}

/** Classify a real timestamp using its local civil day rather than its UTC date. */
export function daysToLocalDate(
  instantISO: string | null,
  day: string,
  timeZone: string,
): number | null {
  if (!instantISO) return null;
  const instant = new Date(instantISO);
  if (!Number.isFinite(instant.getTime())) return null;
  return calendarDaysBetween(localDayString(instant, timeZone), day);
}
