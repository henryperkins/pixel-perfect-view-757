import { computeChart, type TimeAccuracy } from "../astro/chart";
import { assessNatalReliability } from "../astro/natal-reliability";
import type { SyntheticFixture } from "./reading-evaluation.fixtures.mjs";

/** Offline and intercepted/live synthetic evaluation share the production chart and reliability screen. */
export function syntheticNatalReliability(fixed: SyntheticFixture) {
  if (!fixed.natalWindowSamples) return null;
  const accuracy = fixed.chart.uncertainty.accuracy as TimeAccuracy;
  const samples = fixed.natalWindowSamples.map((sample) => ({
    ...sample,
    chart: computeChart(
      {
        // Explicit synthetic calculation coordinates, never somebody's birth record.
        utcISO: new Date(
          Date.parse("1990-01-01T12:00:00Z") + sample.offsetMinutes * 60_000,
        ).toISOString(),
        latitude: 30,
        longitude: 0,
        timezone: "UTC",
        accuracy,
      },
      sample.ephemeris,
    ),
  }));
  return assessNatalReliability(samples, `synthetic:${fixed.id}`, accuracy);
}
