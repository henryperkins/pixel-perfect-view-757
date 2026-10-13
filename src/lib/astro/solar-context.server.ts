import { z } from "zod";
import { zonedToUtc } from "../local-day";
import { swissCalculation, verifySwissSource } from "./swiss-calculations.server";
import { transitEpisodePolicy } from "./transit-episodes.server";
export type SeasonalBand = "spring" | "summer" | "autumn" | "winter";
export function seasonalBand(day: string, latitude: number): SeasonalBand | null {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || Math.abs(latitude) <= 23.44)
    return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(Date.parse(day + "T12:00:00.000Z")) ||
    new Date(day + "T12:00:00.000Z").toISOString().slice(0, 10) !== day
  )
    return null;
  const month = Number(day.slice(5, 7));
  if (month < 1 || month > 12) return null;
  const north: SeasonalBand =
    month >= 3 && month <= 5
      ? "spring"
      : month >= 6 && month <= 8
        ? "summer"
        : month >= 9 && month <= 11
          ? "autumn"
          : "winter";
  return latitude >= 0
    ? north
    : ({ spring: "autumn", summer: "winter", autumn: "spring", winter: "summer" } as const)[north];
}
export interface SolarContext {
  daylight: "ordinary" | "polar_day" | "polar_night" | "unavailable";
  sunriseUtc: string | null;
  sunsetUtc: string | null;
  daylightMinutes: number | null;
  seasonalBand: SeasonalBand | null;
  source: string;
  sourceId: string | null;
  precision: string;
  day: string;
  timeZone: string;
  reason: string | null;
}
export async function getSolarContext(input: {
  day: string;
  timeZone: string;
  latitude: number;
  longitude: number;
}): Promise<SolarContext> {
  const missing = (reason: string): SolarContext => ({
    daylight: "unavailable",
    sunriseUtc: null,
    sunsetUtc: null,
    daylightMinutes: null,
    seasonalBand: null,
    source: "Swiss Ephemeris",
    sourceId: null,
    precision: "unavailable",
    day: input.day,
    timeZone: input.timeZone,
    reason,
  });
  let from: string, to: string;
  try {
    if (
      !Number.isInteger(input.latitude) ||
      Math.abs(input.latitude) > 90 ||
      !Number.isInteger(input.longitude) ||
      Math.abs(input.longitude) > 180
    )
      throw Error("Invalid coarse location.");
    const start = zonedToUtc(input.day, "00:00", input.timeZone);
    from = start.toISOString();
    const next = new Date(input.day + "T12:00:00.000Z");
    next.setUTCDate(next.getUTCDate() + 1);
    to = zonedToUtc(next.toISOString().slice(0, 10), "00:00", input.timeZone).toISOString();
  } catch {
    return missing("invalid_location_or_day");
  }
  const policy = transitEpisodePolicy();
  const result = await swissCalculation(
    "/v1/solar-context",
    {
      contract: "swiss-solar-context/1",
      sourceId: policy.sourceId,
      day: input.day,
      timeZone: input.timeZone,
      from,
      to,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    (raw, sourceId) => {
      const time = z.string().datetime({ precision: 3 }).nullable();
      const r = z
        .object({
          contract: z.literal("swiss-solar-context/1"),
          solverVersion: z.literal("solar-civil-day-1"),
          sourceId: z.literal(sourceId),
          source: z.unknown(),
          day: z.literal(input.day),
          timeZone: z.literal(input.timeZone),
          range: z.object({ from: z.literal(from), to: z.literal(to) }).strict(),
          daylight: z.enum(["ordinary", "polar_day", "polar_night"]),
          sunriseUtc: time,
          sunsetUtc: time,
          daylightMinutes: z.number().int().min(0).max(1620),
          precision: z.literal("native-for-supplied-location"),
          convention: z.literal("apparent-upper-limb; sea-level; 1013.25hPa; 15C"),
          uncertaintySeconds: z.literal(60),
        })
        .strict()
        .parse(raw);
      verifySwissSource(r.source, sourceId);
      for (const at of [r.sunriseUtc, r.sunsetUtc])
        if (at !== null && (Date.parse(at) < Date.parse(from) || Date.parse(at) >= Date.parse(to)))
          throw Error("Solar event outside local day.");
      if (r.daylight !== "ordinary" && (r.sunriseUtc !== null || r.sunsetUtc !== null))
        throw Error("Invalid polar events.");
      if (
        (r.daylight === "polar_night" && r.daylightMinutes !== 0) ||
        (r.daylight === "polar_day" &&
          r.daylightMinutes !== Math.round((Date.parse(to) - Date.parse(from)) / 60000))
      )
        throw Error("Invalid polar duration.");
      return r;
    },
  );
  if (result.status === "unavailable") return missing(result.reason);
  const r = result.value;
  return {
    daylight: r.daylight,
    sunriseUtc: r.sunriseUtc,
    sunsetUtc: r.sunsetUtc,
    daylightMinutes: r.daylightMinutes,
    seasonalBand: seasonalBand(input.day, input.latitude),
    source: "Swiss Ephemeris",
    sourceId: r.sourceId,
    precision: "native-for-coarse-1-degree-location",
    day: r.day,
    timeZone: r.timeZone,
    reason: null,
  };
}
