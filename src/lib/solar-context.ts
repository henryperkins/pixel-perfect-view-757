import type { SolarContext } from "./astro/solar-context.server";
/** Locally authored framing, separate from every model request and saved reading. */
export function solarContextLine(solar: SolarContext): string {
  if (solar.daylight === "unavailable")
    return "Daylight timing is unavailable for your selected current location.";
  const when = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(solar.day + "T12:00:00.000Z"));
  const season = solar.seasonalBand ? " The season is " + solar.seasonalBand + "." : "";
  if (solar.daylight === "polar_day")
    return "Continuous daylight on " + when + " at your approximate current location." + season;
  if (solar.daylight === "polar_night")
    return (
      "The Sun stays below the horizon on " +
      when +
      " at your approximate current location." +
      season
    );
  const clock = (at: string) =>
    new Intl.DateTimeFormat("en", {
      timeZone: solar.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(at));
  const minutes = solar.daylightMinutes!,
    length = Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
  const times = [
    solar.sunriseUtc ? "sunrise around " + clock(solar.sunriseUtc) : null,
    solar.sunsetUtc ? "sunset around " + clock(solar.sunsetUtc) : null,
  ]
    .filter(Boolean)
    .join("; ");
  return (
    "About " +
    length +
    " of daylight on " +
    when +
    " at your approximate current location" +
    (times ? " (" + times + ")" : "") +
    "." +
    season
  );
}
