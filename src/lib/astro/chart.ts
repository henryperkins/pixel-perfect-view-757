import {
  BODIES,
  BODY_LABEL,
  type Body,
  type BodyPosition,
  allPositions,
  computeAngles,
  degreeInSign,
  formatPosition,
  houseOf,
  norm360,
  signOf,
  signedDelta,
  toJulianDay,
  wholeSignHouses,
  HOUSE_SYSTEM,
  ENGINE_ID,
  ENGINE_VERSION,
  CONTRACT_VERSION,
} from "./ephemeris";

export type TimeAccuracy = "exact" | "near" | "hour" | "unknown";

export const TIME_ACCURACY_MINUTES: Record<TimeAccuracy, number> = {
  exact: 2,
  near: 15,
  hour: 60,
  unknown: 720,
};

export const TIME_ACCURACY_LABEL: Record<TimeAccuracy, string> = {
  exact: "Recorded to the minute",
  near: "Within about 15 minutes",
  hour: "Within about an hour",
  unknown: "Unknown — noon assumed",
};

export interface BirthInput {
  /** ISO instant of birth in UTC */
  utcISO: string;
  latitude: number;
  longitude: number;
  timezone: string;
  accuracy: TimeAccuracy;
}

export const ASPECTS = [
  { key: "conjunction", angle: 0, glyph: "\u260c", hard: true },
  { key: "sextile", angle: 60, glyph: "\u26b9", hard: false },
  { key: "square", angle: 90, glyph: "\u25a1", hard: true },
  { key: "trine", angle: 120, glyph: "\u25b3", hard: false },
  { key: "quincunx", angle: 150, glyph: "\u26bb", hard: true },
  { key: "opposition", angle: 180, glyph: "\u260d", hard: true },
] as const;

export type AspectKey = (typeof ASPECTS)[number]["key"];

const LUMINARIES: Body[] = ["sun", "moon"];

function natalOrb(a: string, b: string, aspect: AspectKey): number {
  const lum = LUMINARIES.includes(a as Body) || LUMINARIES.includes(b as Body);
  const base = aspect === "conjunction" || aspect === "opposition" ? 8 : 6;
  const minor = aspect === "quincunx" ? 3 : base;
  return lum ? minor + 2 : minor;
}

export interface AspectHit {
  a: string;
  b: string;
  aspect: AspectKey;
  orb: number;
  applying: boolean;
  hard: boolean;
  /** Who reported this connection: the Swiss service or in-app math. */
  source?: "service" | "in-app";
}

export interface ChartSources {
  positions: "service" | "in-app";
  houses: "service" | "in-app";
  angles: "service" | "in-app";
  /** Coordinates the chart was calculated for. */
  latitude: number;
  longitude: number;
  utcISO: string;
}

export interface ChartPoint {
  key: string;
  label: string;
  lon: number;
  sign: string;
  degree: number;
  house: number;
  speed: number;
  retrograde: boolean;
  angleDependent: boolean;
}

/** Positions plus the provenance of whatever engine produced them. */
export interface EphemerisResult {
  positions: Record<Body, BodyPosition>;
  engine: string;
  engineVersion: string;
  precision: "high" | "approximate";
  degraded: boolean;
  degradedReason: string | null;
  /** Service-computed house cusps (1..12) and system name. */
  houses?: { system: string; cusps: number[] } | undefined;
  /** Service-computed angles. */
  angles?: { ascendant: number; midheaven: number } | undefined;
  /** Service-computed aspects between tracked points. */
  aspects?: { a: string; b: string; aspect: AspectKey; orb: number; applying: boolean }[] | undefined;
}

/** House number for a longitude given 12 cusps (any system). */
function houseFromCusps(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 1;
}

export interface Chart {
  engine: string;
  engineVersion: string;
  contractVersion: string;
  houseSystem: string;
  precision: "high" | "approximate";
  degraded: boolean;
  degradedReason: string | null;
  jd: number;
  points: Record<string, ChartPoint>;
  angles: { ascendant: number; midheaven: number };
  houses: number[];
  aspects: AspectHit[];
  sources?: ChartSources | undefined;
  uncertainty: {
    accuracy: TimeAccuracy;
    minutes: number;
    ascendantSpreadDeg: number;
    moonSpreadDeg: number;
    housesReliable: boolean;
    angleClaimsSuppressed: boolean;
  };
}

export function computeChart(input: BirthInput, ephem?: EphemerisResult): Chart {
  const date = new Date(input.utcISO);
  const jd = toJulianDay(date);
  const source: EphemerisResult = ephem ?? {
    positions: allPositions(jd),
    engine: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    precision: "approximate",
    degraded: true,
    degradedReason: "Swiss Ephemeris service was not consulted.",
  };
  const positions = source.positions;
  const angles = source.angles ?? computeAngles(jd, input.latitude, input.longitude);

  const serviceHouses = source.houses && source.houses.cusps.length === 12 ? source.houses : null;
  const houses = serviceHouses ? serviceHouses.cusps : wholeSignHouses(angles.ascendant);
  const houseSystem = serviceHouses ? serviceHouses.system : HOUSE_SYSTEM;
  const houseFor = (lon: number) =>
    serviceHouses ? houseFromCusps(lon, serviceHouses.cusps) : houseOf(lon, angles.ascendant);

  const points: Record<string, ChartPoint> = {};
  for (const b of BODIES) {
    const p: BodyPosition = positions[b];
    points[b] = {
      key: b,
      label: BODY_LABEL[b],
      lon: p.lon,
      sign: p.sign,
      degree: p.degree,
      house: houseFor(p.lon),
      speed: p.speed,
      retrograde: p.retrograde,
      angleDependent: false,
    };
  }
  points["ascendant"] = {
    key: "ascendant",
    label: "Ascendant",
    lon: angles.ascendant,
    sign: signOf(angles.ascendant),
    degree: degreeInSign(angles.ascendant),
    house: 1,
    speed: 361,
    retrograde: false,
    angleDependent: true,
  };
  points["midheaven"] = {
    key: "midheaven",
    label: "Midheaven",
    lon: angles.midheaven,
    sign: signOf(angles.midheaven),
    degree: degreeInSign(angles.midheaven),
    house: serviceHouses ? 10 : houseOf(angles.midheaven, angles.ascendant),
    speed: 361,
    retrograde: false,
    angleDependent: true,
  };

  const keys = Object.keys(points);
  const aspects: AspectHit[] = [];
  const hardOf = (k: AspectKey) => ASPECTS.find((x) => x.key === k)!.hard;
  const seen = new Set<string>();
  if (source.aspects) {
    // Use the service's aspect list verbatim; our orb policy only decides
    // which of its connections are tight enough to show.
    for (const s of source.aspects) {
      if (!points[s.a] || !points[s.b]) continue;
      if (s.orb > natalOrb(s.a, s.b, s.aspect)) continue;
      const id = [s.a, s.b].sort().join("|");
      if (seen.has(id)) continue;
      seen.add(id);
      aspects.push({
        a: s.a,
        b: s.b,
        aspect: s.aspect,
        orb: Number(s.orb.toFixed(2)),
        applying: s.applying,
        hard: hardOf(s.aspect),
        source: "service",
      });
    }
  }
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const A = points[keys[i]!]!;
      const B = points[keys[j]!]!;
      if (A.angleDependent && B.angleDependent) continue;
      // With service aspects, only fill in angle contacts the service omits.
      if (source.aspects && !A.angleDependent && !B.angleDependent) continue;
      if (seen.has([A.key, B.key].sort().join("|"))) continue;
      const sep = Math.abs(signedDelta(A.lon, B.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= natalOrb(A.key, B.key, asp.key)) {
          const rel = signedDelta(A.lon, B.lon);
          const relSpeed = A.speed - B.speed;
          aspects.push({
            a: A.key,
            b: B.key,
            aspect: asp.key,
            orb: Number(orb.toFixed(2)),
            applying: rel * relSpeed < 0,
            hard: asp.hard,
            source: "in-app",
          });
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  const minutes = TIME_ACCURACY_MINUTES[input.accuracy];
  const ascSpread = (minutes / 60) * 15; // ~15 deg of RA per hour
  const moonSpread = (minutes / 1440) * 13.2;

  return {
    engine: source.engine,
    engineVersion: source.engineVersion,
    contractVersion: CONTRACT_VERSION,
    houseSystem,
    precision: source.precision,
    degraded: source.degraded,
    degradedReason: source.degradedReason,

    jd,
    points,
    angles: { ascendant: angles.ascendant, midheaven: angles.midheaven },
    houses,
    aspects,
    sources: {
      positions: source.degraded ? "in-app" : "service",
      houses: serviceHouses ? "service" : "in-app",
      angles: source.angles ? "service" : "in-app",
      latitude: input.latitude,
      longitude: input.longitude,
      utcISO: input.utcISO,
    },
    uncertainty: {
      accuracy: input.accuracy,
      minutes,
      ascendantSpreadDeg: Number(ascSpread.toFixed(2)),
      moonSpreadDeg: Number(moonSpread.toFixed(2)),
      housesReliable: minutes <= 15,
      angleClaimsSuppressed: minutes > 60,
    },
  };
}

// ---------------------------------------------------------------------------
// Natal feature extraction
// ---------------------------------------------------------------------------

export interface NatalFeature {
  feature_key: string;
  family: "luminary" | "angle" | "configuration" | "aspect" | "distribution";
  title: string;
  strength: number;
  payload: Record<string, unknown>;
  angleDependent: boolean;
}

const MODALITY: Record<string, "cardinal" | "fixed" | "mutable"> = {
  Aries: "cardinal",
  Cancer: "cardinal",
  Libra: "cardinal",
  Capricorn: "cardinal",
  Taurus: "fixed",
  Leo: "fixed",
  Scorpio: "fixed",
  Aquarius: "fixed",
  Gemini: "mutable",
  Virgo: "mutable",
  Sagittarius: "mutable",
  Pisces: "mutable",
};

const ELEMENT: Record<string, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire",
  Leo: "fire",
  Sagittarius: "fire",
  Taurus: "earth",
  Virgo: "earth",
  Capricorn: "earth",
  Gemini: "air",
  Libra: "air",
  Aquarius: "air",
  Cancer: "water",
  Scorpio: "water",
  Pisces: "water",
};

export function extractFeatures(chart: Chart): NatalFeature[] {
  const out: NatalFeature[] = [];
  const p = chart.points;

  for (const key of ["sun", "moon"] as const) {
    const pt = p[key]!;
    out.push({
      feature_key: `${key}_placement`,
      family: "luminary",
      title: `${pt.label} in ${pt.sign}`,
      strength: 1,
      payload: { sign: pt.sign, house: pt.house, degree: pt.degree },
      angleDependent: false,
    });
  }

  if (!chart.uncertainty.angleClaimsSuppressed) {
    const asc = p["ascendant"]!;
    out.push({
      feature_key: "ascendant_placement",
      family: "angle",
      title: `${asc.sign} rising`,
      strength: chart.uncertainty.housesReliable ? 0.9 : 0.5,
      payload: { sign: asc.sign, degree: asc.degree },
      angleDependent: true,
    });
  }

  // element / modality distribution
  const counts: Record<string, number> = {};
  const modes: Record<string, number> = {};
  for (const b of BODIES) {
    const pt = p[b]!;
    counts[ELEMENT[pt.sign]!] = (counts[ELEMENT[pt.sign]!] ?? 0) + 1;
    modes[MODALITY[pt.sign]!] = (modes[MODALITY[pt.sign]!] ?? 0) + 1;
  }
  const topElement = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]!;
  const topMode = Object.entries(modes).sort((a, b) => b[1] - a[1])[0]!;
  out.push({
    feature_key: `distribution_${topElement[0]}`,
    family: "distribution",
    title: `${topElement[0][0]!.toUpperCase()}${topElement[0].slice(1)}-weighted chart`,
    strength: topElement[1] / BODIES.length,
    payload: { elements: counts, modalities: modes, topMode: topMode[0] },
    angleDependent: false,
  });

  // tightest structural aspects
  for (const a of chart.aspects.slice(0, 6)) {
    if (a.orb > 4) continue;
    const A = p[a.a]!;
    const B = p[a.b]!;
    out.push({
      feature_key: `aspect_${a.a}_${a.aspect}_${a.b}`,
      family: "aspect",
      title: `${A.label} ${a.aspect} ${B.label}`,
      strength: Number((1 - a.orb / 8).toFixed(2)),
      payload: { orb: a.orb, hard: a.hard, applying: a.applying },
      angleDependent: A.angleDependent || B.angleDependent,
    });
  }

  // stellium detection
  const bySign: Record<string, string[]> = {};
  for (const b of BODIES) {
    (bySign[p[b]!.sign] ??= []).push(p[b]!.label);
  }
  for (const [sign, members] of Object.entries(bySign)) {
    if (members.length >= 3) {
      out.push({
        feature_key: `stellium_${sign.toLowerCase()}`,
        family: "configuration",
        title: `Stellium in ${sign}`,
        strength: Math.min(1, members.length / 4),
        payload: { members },
        angleDependent: false,
      });
    }
  }

  return out.sort((a, b) => b.strength - a.strength);
}

export { formatPosition, norm360, signedDelta, BODY_LABEL };
