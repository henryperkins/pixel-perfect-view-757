import {
  computeChart,
  TIME_ACCURACY_MINUTES,
  type BirthInput,
  type EphemerisResult,
} from "./chart";
import { toJulianDay } from "./ephemeris";
import { resolvePositions } from "./swiss.server";
import { assertUse } from "../registry";
import {
  assessNatalReliability,
  unavailableNatalReliability,
  usableNatalService,
  type NatalReliabilityManifest,
} from "./natal-reliability";

export async function resolveNatalReliability(
  input: BirthInput,
  fingerprint: string,
  center: EphemerisResult,
): Promise<NatalReliabilityManifest> {
  if (input.accuracy === "unknown")
    return unavailableNatalReliability(fingerprint, input.accuracy, "unknown_time");
  if (!usableNatalService(center))
    return unavailableNatalReliability(fingerprint, input.accuracy, "service_unavailable");
  for (const source of ["AST-01", "AST-02", "AST-03", "AST-04"]) assertUse(source, "calculation");
  try {
    const band = TIME_ACCURACY_MINUTES[input.accuracy];
    const boundaries = await Promise.all(
      [-band, band].map(async (offsetMinutes) => {
        // Elapsed UTC arithmetic is intentional, including across civil DST changes.
        const utcISO = new Date(Date.parse(input.utcISO) + offsetMinutes * 60_000).toISOString();
        const ephemeris = await resolvePositions({
          utcISO,
          jd: toJulianDay(new Date(utcISO)),
          latitude: input.latitude,
          longitude: input.longitude,
        });
        return { offsetMinutes, ephemeris, chart: computeChart({ ...input, utcISO }, ephemeris) };
      }),
    );
    return assessNatalReliability(
      [
        boundaries[0]!,
        { offsetMinutes: 0, ephemeris: center, chart: computeChart(input, center) },
        boundaries[1]!,
      ],
      fingerprint,
      input.accuracy,
    );
  } catch {
    return unavailableNatalReliability(fingerprint, input.accuracy, "invalid_sample");
  }
}
