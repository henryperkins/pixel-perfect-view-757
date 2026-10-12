import { z } from "zod";
import { TIME_ACCURACY_MINUTES, type TimeAccuracy } from "./chart";
import { validNatalCusps, usableNatalService, type NatalWindowSample } from "./natal-reliability";

export const TRANSIT_ANCHOR_VERSION = "transit-anchor-1";
export const STORY_BODIES = ["jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
export const STORY_TARGETS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "ascendant",
  "midheaven",
] as const;
export type StoryBody = (typeof STORY_BODIES)[number];
export type StoryTarget = (typeof STORY_TARGETS)[number];
export type Triple<T> = [T, T, T];
const identifier = z.string().trim().min(1).max(160);
// SWIEPH | SPEED only. Alternate ephemerides, coordinate frames, true positions,
// finite-difference speed and unknown flags require a new reviewed contract.
export const positionSourceSchema = z
  .object({
    engine: z.literal("swiss-ephemeris"),
    engineVersion: identifier,
    dataId: identifier,
    frame: z.literal("tropical-apparent-geocentric-true-equinox-of-date"),
    timeScale: z.literal("UT"),
    returnedFlags: z.literal(258),
  })
  .strict();
export type PositionSource = z.infer<typeof positionSourceSchema>;
const longitude = z.number().finite().min(0).lt(360);
const triple = <T extends z.ZodTypeAny>(schema: T) => z.tuple([schema, schema, schema]);
const base = {
  version: z.literal(TRANSIT_ANCHOR_VERSION),
  chartFingerprint: z.string().min(1).max(256),
  accuracy: z.enum(["exact", "near", "hour", "unknown"]),
};
const manifestSchema = z.discriminatedUnion("status", [
  z
    .object({
      ...base,
      status: z.literal("screened"),
      sampleOffsetsMinutes: triple(z.number().int()),
      sources: triple(positionSourceSchema),
      anchors: z
        .array(z.object({ target: z.enum(STORY_TARGETS), longitudes: triple(longitude) }).strict())
        .max(9),
    })
    .strict(),
  z
    .object({
      ...base,
      status: z.literal("unavailable"),
      reason: z.enum(["unknown_time", "service_unavailable", "unqualified_source"]),
      sampleOffsetsMinutes: z.tuple([]),
      sources: z.tuple([]),
      anchors: z.tuple([]),
    })
    .strict(),
]);
export type TransitAnchorManifest = z.infer<typeof manifestSchema>;
export const samePositionSource = (a: PositionSource, b: PositionSource) =>
  Object.keys(positionSourceSchema.shape).every(
    (k) => a[k as keyof PositionSource] === b[k as keyof PositionSource],
  );
export function validateTransitAnchors(
  value: unknown,
  fingerprint: string,
  accuracy: TimeAccuracy,
): TransitAnchorManifest {
  const m = manifestSchema.parse(value);
  if (m.chartFingerprint !== fingerprint || m.accuracy !== accuracy)
    throw new Error("Anchor binding mismatch");
  if (m.status === "screened") {
    const band = TIME_ACCURACY_MINUTES[accuracy];
    if (
      accuracy === "unknown" ||
      !m.sampleOffsetsMinutes.every((v, i) => v === [-band, 0, band][i]) ||
      !m.sources.every((s) => samePositionSource(s, m.sources[1])) ||
      new Set(m.anchors.map((a) => a.target)).size !== m.anchors.length ||
      (accuracy !== "exact" &&
        m.anchors.some((a) => a.target === "ascendant" || a.target === "midheaven"))
    )
      throw new Error("Invalid anchor assessment");
  } else if ((accuracy === "unknown") !== (m.reason === "unknown_time"))
    throw new Error("Invalid anchor omission");
  return m;
}
export function assessTransitAnchors(
  samples: NatalWindowSample[],
  fingerprint: string,
  accuracy: TimeAccuracy,
): TransitAnchorManifest {
  const unavailable = (reason: "unknown_time" | "service_unavailable" | "unqualified_source") =>
    validateTransitAnchors(
      {
        version: TRANSIT_ANCHOR_VERSION,
        chartFingerprint: fingerprint,
        accuracy,
        status: "unavailable",
        reason,
        sampleOffsetsMinutes: [],
        sources: [],
        anchors: [],
      },
      fingerprint,
      accuracy,
    );
  if (accuracy === "unknown") return unavailable("unknown_time");
  const sorted = [...samples].sort((a, b) => a.offsetMinutes - b.offsetMinutes);
  if (
    sorted.length !== 3 ||
    sorted.some(
      (s) =>
        !usableNatalService(s.ephemeris) ||
        s.chart.degraded ||
        s.chart.sources?.positions !== "service",
    )
  )
    return unavailable("service_unavailable");
  const sources = sorted.map((s) => positionSourceSchema.safeParse(s.ephemeris.positionSource));
  if (sources.some((s) => !s.success)) return unavailable("unqualified_source");
  const parsed = sources.map((s) => s.data!) as Triple<PositionSource>;
  const band = TIME_ACCURACY_MINUTES[accuracy];
  if (
    !parsed.every(
      (s, i) =>
        samePositionSource(s, parsed[1]) &&
        s.engineVersion === sorted[i]!.ephemeris.engineVersion &&
        sorted[i]!.chart.engineVersion === s.engineVersion,
    ) ||
    !sorted.every(
      (s, i) =>
        s.offsetMinutes === [-band, 0, band][i] && s.chart.uncertainty.accuracy === accuracy,
    )
  )
    return unavailable("unqualified_source");
  const anchors: { target: StoryTarget; longitudes: Triple<number> }[] = [];
  for (const target of STORY_TARGETS) {
    const angle = target === "ascendant" || target === "midheaven";
    if (
      angle &&
      (accuracy !== "exact" ||
        sorted.some(
          (s) =>
            s.chart.uncertainty.angleClaimsSuppressed ||
            s.ephemeris.houseSystemExplicit === false ||
            s.chart.sources?.angles !== "service" ||
            s.chart.sources?.houses !== "service" ||
            s.ephemeris.houses?.system !== "placidus" ||
            !validNatalCusps(s.ephemeris.houses?.cusps),
        ))
    )
      continue;
    const values = sorted.map((s) =>
      angle
        ? s.ephemeris.angles?.[target as "ascendant" | "midheaven"]
        : s.ephemeris.positions[target as Exclude<StoryTarget, "ascendant" | "midheaven">]?.lon,
    );
    if (
      values.some(
        (v, i) => !longitude.safeParse(v).success || v !== sorted[i]!.chart.points[target]?.lon,
      )
    )
      continue;
    anchors.push({ target, longitudes: values as Triple<number> });
  }
  return validateTransitAnchors(
    {
      version: TRANSIT_ANCHOR_VERSION,
      chartFingerprint: fingerprint,
      accuracy,
      status: "screened",
      sampleOffsetsMinutes: sorted.map((s) => s.offsetMinutes),
      sources: parsed,
      anchors,
    },
    fingerprint,
    accuracy,
  );
}
