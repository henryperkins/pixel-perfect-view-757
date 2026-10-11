import { z } from "zod";
import {
  ASPECTS,
  TIME_ACCURACY_MINUTES,
  houseFromCusps,
  type Chart,
  type EphemerisResult,
  type TimeAccuracy,
} from "./chart";
import { BODIES, SIGNS, norm360, signOf, signedDelta, type Body } from "./ephemeris";
import { NATAL_PERSONAL_BODIES, type NatalHouseSelector } from "../content/natal-lens-types";

export const NATAL_RELIABILITY_VERSION = "natal-reliability-1";
export interface NatalWindowSample {
  offsetMinutes: number;
  chart: Chart;
  ephemeris: EphemerisResult;
}
export type SampleTriple<T> = [T, T, T];
export type NatalHouseNumber = NatalHouseSelector["house"];
const longitude = z.number().finite().min(0).lt(360);
const triple = <T extends z.ZodTypeAny>(item: T) => z.tuple([item, item, item]);
const body = z.enum(NATAL_PERSONAL_BODIES);
const nonNode = z.enum([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);
const angles = z.object({ ascendant: longitude, midheaven: longitude }).strict();
const evidenceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("sign"),
      body,
      sign: z.enum(SIGNS),
      source: z.literal("service"),
      longitudes: triple(longitude),
      marginsDeg: triple(z.number().finite().min(1).max(15)),
    })
    .strict(),
  z
    .object({
      kind: z.literal("aspect"),
      a: nonNode,
      b: nonNode,
      aspect: z.enum(["conjunction", "sextile", "square", "trine", "quincunx", "opposition"]),
      source: z.literal("service"),
      orbs: triple(z.number().finite().min(0).max(180)),
      longitudes: triple(z.object({ a: longitude, b: longitude }).strict()),
    })
    .strict(),
  z
    .object({
      kind: z.literal("house"),
      body,
      house: z
        .number()
        .int()
        .min(1)
        .max(12)
        .transform((value) => value as NatalHouseNumber),
      source: z.literal("service"),
      anglesSource: z.literal("service"),
      system: z.literal("placidus"),
      longitudes: triple(longitude),
      cusps: triple(z.array(longitude).length(12)),
      angles: triple(angles),
      marginsDeg: triple(z.number().finite().min(0.5).max(180)),
    })
    .strict(),
]);
export type NatalLensEvidence = z.infer<typeof evidenceSchema>;
const header = {
  version: z.literal(NATAL_RELIABILITY_VERSION),
  chartFingerprint: z.string().min(1).max(256),
  accuracy: z.enum(["exact", "near", "hour", "unknown"]),
};
const manifestSchema = z.discriminatedUnion("status", [
  z
    .object({
      ...header,
      status: z.literal("screened"),
      reason: z.null(),
      sampleOffsetsMinutes: triple(z.number().finite()),
      sampleEngines: triple(z.string().min(1).max(160)),
      evidence: z.array(evidenceSchema).max(55),
    })
    .strict(),
  z
    .object({
      ...header,
      status: z.literal("unavailable"),
      reason: z.enum(["unknown_time", "service_unavailable", "invalid_sample"]),
      sampleOffsetsMinutes: z.tuple([]),
      sampleEngines: z.tuple([]),
      evidence: z.tuple([]),
    })
    .strict(),
]);
export type NatalReliabilityManifest = z.infer<typeof manifestSchema>;

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-7;
const signMargin = (lon: number) => Math.min(norm360(lon) % 30, 30 - (norm360(lon) % 30));
const cuspMargin = (lon: number, cusps: number[]) =>
  Math.min(...cusps.map((c) => Math.abs(signedDelta(lon, c))));
export const natalEvidenceKey = (e: NatalLensEvidence) =>
  e.kind === "aspect" ? `aspect:${[e.a, e.b].sort().join(":")}` : `${e.kind}:${e.body}`;
export function validNatalCusps(cusps: unknown): cusps is number[] {
  if (
    !Array.isArray(cusps) ||
    cusps.length !== 12 ||
    cusps.some((n) => typeof n !== "number" || !Number.isFinite(n) || n < 0 || n >= 360)
  )
    return false;
  const spans = cusps.map((c, i) => norm360(cusps[(i + 1) % 12]! - c));
  return (
    spans.every((span) => span > 0 && span < 180) &&
    close(
      spans.reduce((a, b) => a + b, 0),
      360,
    )
  );
}

/** Recheck saved proofs without calculating a new chart. */
export function validateNatalEvidence(value: unknown, accuracy: TimeAccuracy): NatalLensEvidence[] {
  const evidence = z.array(evidenceSchema).max(55).parse(value);
  const keys = new Set<string>();
  const positions = new Map<string, number[]>();
  const consistent = (body: string, longitudes: number[]) => {
    const previous = positions.get(body);
    if (previous && longitudes.some((lon, i) => !close(lon, previous[i]!)))
      throw new Error("Inconsistent natal sample positions");
    positions.set(body, longitudes);
  };
  for (const e of evidence) {
    const key = natalEvidenceKey(e);
    if (keys.has(key)) throw new Error("Duplicate natal evidence");
    keys.add(key);
    if (e.kind === "aspect") {
      consistent(
        e.a,
        e.longitudes.map((l) => l.a),
      );
      consistent(
        e.b,
        e.longitudes.map((l) => l.b),
      );
    } else consistent(e.body, e.longitudes);
    if (e.kind === "sign") {
      if (
        !e.longitudes.every(
          (lon, i) => signOf(lon) === e.sign && close(e.marginsDeg[i]!, signMargin(lon)),
        )
      )
        throw new Error("Invalid natal sign proof");
    } else if (e.kind === "aspect") {
      const angle = ASPECTS.find((a) => a.key === e.aspect)!.angle;
      if (
        e.a === e.b ||
        !NATAL_PERSONAL_BODIES.some((b) => b === e.a || b === e.b) ||
        !e.longitudes.every(
          (l, i) =>
            Math.abs(e.orbs[i]! - Math.abs(Math.abs(signedDelta(l.a, l.b)) - angle)) <= 0.05,
        )
      )
        throw new Error("Invalid natal aspect proof");
      // Canonical body order makes equivalent reversed service pairs identical.
      if (e.a > e.b) {
        [e.a, e.b] = [e.b, e.a];
        e.longitudes = e.longitudes.map((l) => ({ a: l.b, b: l.a })) as SampleTriple<{
          a: number;
          b: number;
        }>;
      }
    } else {
      if (
        accuracy !== "exact" ||
        !e.cusps.every(
          (cusps, i) =>
            validNatalCusps(cusps) &&
            houseFromCusps(e.longitudes[i]!, cusps) === e.house &&
            close(cuspMargin(e.longitudes[i]!, cusps), e.marginsDeg[i]!) &&
            Math.abs(signedDelta(cusps[0]!, e.angles[i]!.ascendant)) <= 0.05 &&
            Math.abs(signedDelta(cusps[9]!, e.angles[i]!.midheaven)) <= 0.05,
        )
      )
        throw new Error("Invalid natal house proof");
    }
  }
  if (accuracy === "unknown" && evidence.length)
    throw new Error("Unknown time cannot have natal evidence");
  return evidence.sort((a, b) =>
    natalEvidenceKey(a) < natalEvidenceKey(b)
      ? -1
      : natalEvidenceKey(a) > natalEvidenceKey(b)
        ? 1
        : 0,
  );
}

export function validateNatalReliability(
  value: unknown,
  fingerprint: string,
  accuracy: TimeAccuracy,
): NatalReliabilityManifest {
  const m = manifestSchema.parse(value);
  if (m.chartFingerprint !== fingerprint || m.accuracy !== accuracy)
    throw new Error("Natal assessment identity mismatch");
  if (m.status === "screened") {
    const band = TIME_ACCURACY_MINUTES[accuracy];
    if (
      accuracy === "unknown" ||
      !m.sampleOffsetsMinutes.every((v, i) => v === [-band, 0, band][i]) ||
      new Set(m.sampleEngines).size !== 1 ||
      !m.sampleEngines.every((e) => /^swiss-ephemeris@.{1,144}$/.test(e))
    )
      throw new Error("Invalid natal sampling window");
    m.evidence = validateNatalEvidence(m.evidence, accuracy);
  } else if ((m.reason === "unknown_time") !== (accuracy === "unknown"))
    throw new Error("Invalid natal unavailable reason");
  return m;
}

export function unavailableNatalReliability(
  fingerprint: string,
  accuracy: TimeAccuracy,
  reason: "unknown_time" | "service_unavailable" | "invalid_sample",
): NatalReliabilityManifest {
  return validateNatalReliability(
    {
      version: NATAL_RELIABILITY_VERSION,
      chartFingerprint: fingerprint,
      accuracy,
      status: "unavailable",
      reason,
      sampleOffsetsMinutes: [],
      sampleEngines: [],
      evidence: [],
    },
    fingerprint,
    accuracy,
  );
}

export function usableNatalService(ephem: EphemerisResult): boolean {
  return (
    !!ephem &&
    ephem.engine === "swiss-ephemeris" &&
    typeof ephem.engineVersion === "string" &&
    ephem.engineVersion.length > 0 &&
    ephem.engineVersion.length <= 144 &&
    ephem.precision === "high" &&
    ephem.degraded === false &&
    !!ephem.positions &&
    NATAL_PERSONAL_BODIES.some((b) => coherentPosition(ephem, b) !== null)
  );
}
function coherentPosition(ephem: EphemerisResult, body: Body): number | null {
  const p = ephem.positions?.[body];
  return p &&
    Number.isFinite(p.lon) &&
    p.sign === signOf(p.lon) &&
    Number.isFinite(p.degree) &&
    close(p.degree, norm360(p.lon) % 30)
    ? norm360(p.lon)
    : null;
}
function sampleLongitude(s: NatalWindowSample, body: Body): number | null {
  const lon = coherentPosition(s.ephemeris, body),
    point = s.chart.points?.[body];
  return lon !== null &&
    point &&
    Number.isFinite(point.lon) &&
    close(norm360(point.lon), lon) &&
    point.sign === signOf(lon)
    ? lon
    : null;
}

/** Conservative three-sample screening; no claim about every instant or personality. */
export function assessNatalReliability(
  samples: NatalWindowSample[],
  fingerprint: string,
  accuracy: TimeAccuracy,
): NatalReliabilityManifest {
  if (accuracy === "unknown")
    return unavailableNatalReliability(fingerprint, accuracy, "unknown_time");
  const band = TIME_ACCURACY_MINUTES[accuracy];
  const sorted = [...samples].sort((a, b) => a.offsetMinutes - b.offsetMinutes);
  if (
    sorted.length !== 3 ||
    !sorted.every(
      (s, i) =>
        s.offsetMinutes === [-band, 0, band][i] && s.chart?.uncertainty?.accuracy === accuracy,
    )
  )
    return unavailableNatalReliability(fingerprint, accuracy, "invalid_sample");
  if (
    !sorted.every(
      (s) =>
        usableNatalService(s.ephemeris) &&
        s.chart.sources?.positions === "service" &&
        s.chart.precision === "high" &&
        !s.chart.degraded,
    )
  )
    return unavailableNatalReliability(fingerprint, accuracy, "service_unavailable");
  const engines = sorted.map(
    (s) => `${s.ephemeris.engine}@${s.ephemeris.engineVersion}`,
  ) as SampleTriple<string>;
  if (
    new Set(engines).size !== 1 ||
    !sorted.every((s, i) => `${s.chart.engine}@${s.chart.engineVersion}` === engines[i])
  )
    return unavailableNatalReliability(fingerprint, accuracy, "invalid_sample");
  const evidence: NatalLensEvidence[] = [];
  for (const body of NATAL_PERSONAL_BODIES) {
    const values = sorted.map((s) => sampleLongitude(s, body));
    if (values.some((v) => v === null)) continue;
    const longitudes = values as SampleTriple<number>;
    if (longitudes.every((l) => signOf(l) === signOf(longitudes[1]) && signMargin(l) >= 1))
      evidence.push({
        kind: "sign",
        body,
        sign: signOf(longitudes[1]),
        source: "service",
        longitudes,
        marginsDeg: longitudes.map(signMargin) as SampleTriple<number>,
      });
    const serviceHouses = sorted.every(
      (s) =>
        s.chart.sources?.houses === "service" &&
        s.chart.sources?.angles === "service" &&
        s.chart.uncertainty.housesReliable &&
        !s.chart.uncertainty.angleClaimsSuppressed &&
        s.ephemeris.houses?.system === "placidus" &&
        validNatalCusps(s.ephemeris.houses.cusps) &&
        !!s.ephemeris.angles &&
        Number.isFinite(s.ephemeris.angles.ascendant) &&
        Number.isFinite(s.ephemeris.angles.midheaven) &&
        s.chart.houseSystem === "placidus" &&
        s.chart.houses.every((c, i) => close(c, s.ephemeris.houses!.cusps[i]!)) &&
        close(s.chart.angles.ascendant, s.ephemeris.angles.ascendant) &&
        close(s.chart.angles.midheaven, s.ephemeris.angles.midheaven),
    );
    if (accuracy === "exact" && serviceHouses) {
      const cusps = sorted.map((s) => [...s.ephemeris.houses!.cusps]) as SampleTriple<number[]>;
      const house = houseFromCusps(longitudes[1], cusps[1]);
      const margins = longitudes.map((l, i) => cuspMargin(l, cusps[i]!)) as SampleTriple<number>;
      if (
        longitudes.every(
          (l, i) =>
            houseFromCusps(l, cusps[i]!) === house &&
            sorted[i]!.chart.points[body]!.house === house &&
            margins[i]! >= 0.5,
        ) &&
        sorted.every(
          (s, i) =>
            Math.abs(signedDelta(cusps[i]![0]!, s.ephemeris.angles!.ascendant)) <= 0.05 &&
            Math.abs(signedDelta(cusps[i]![9]!, s.ephemeris.angles!.midheaven)) <= 0.05,
        )
      )
        evidence.push({
          kind: "house",
          body,
          house: house as NatalHouseNumber,
          source: "service",
          anglesSource: "service",
          system: "placidus",
          longitudes,
          cusps,
          angles: sorted.map((s) => ({ ...s.ephemeris.angles! })) as SampleTriple<{
            ascendant: number;
            midheaven: number;
          }>,
          marginsDeg: margins,
        });
    }
  }
  const pairs = new Set<string>();
  for (const item of sorted[1]!.ephemeris.aspects ?? []) {
    const [a, b] = [item.a, item.b].sort() as [Exclude<Body, "node">, Exclude<Body, "node">];
    const key = `${a}:${b}`;
    if (pairs.has(key)) continue;
    pairs.add(key);
    if (
      a === b ||
      !BODIES.includes(a) ||
      !BODIES.includes(b) ||
      a === ("node" as string) ||
      b === ("node" as string) ||
      !NATAL_PERSONAL_BODIES.some((p) => p === a || p === b)
    )
      continue;
    const matches = sorted.map((s) =>
      (s.ephemeris.aspects ?? []).filter((e) => [e.a, e.b].sort().join(":") === key),
    );
    if (
      !matches.every(
        (m) =>
          m.length === 1 &&
          m[0]!.aspect === item.aspect &&
          Number.isFinite(m[0]!.orb) &&
          m[0]!.orb >= 0 &&
          m[0]!.orb <= 180,
      )
    )
      continue;
    const longitudes = sorted.map((s) => ({ a: sampleLongitude(s, a), b: sampleLongitude(s, b) }));
    const angle = ASPECTS.find((asp) => asp.key === item.aspect)?.angle;
    if (
      angle === undefined ||
      !longitudes.every(
        (l, i) =>
          l.a !== null &&
          l.b !== null &&
          Math.abs(matches[i]![0]!.orb - Math.abs(Math.abs(signedDelta(l.a, l.b)) - angle)) <=
            0.05 &&
          sorted[i]!.chart.aspects.some(
            (asp) =>
              [asp.a, asp.b].sort().join(":") === key &&
              asp.aspect === item.aspect &&
              asp.source === "service",
          ),
      )
    )
      continue;
    evidence.push({
      kind: "aspect",
      a,
      b,
      aspect: item.aspect,
      source: "service",
      orbs: matches.map((m) => m[0]!.orb) as SampleTriple<number>,
      longitudes: longitudes as SampleTriple<{ a: number; b: number }>,
    });
  }
  return validateNatalReliability(
    {
      version: NATAL_RELIABILITY_VERSION,
      chartFingerprint: fingerprint,
      accuracy,
      status: "screened",
      reason: null,
      sampleOffsetsMinutes: [-band, 0, band],
      sampleEngines: engines,
      evidence,
    },
    fingerprint,
    accuracy,
  );
}
