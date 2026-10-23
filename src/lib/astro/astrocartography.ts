/**
 * Astro-cartography lines (Jim Lewis A*C*G model) from natal ecliptic
 * longitudes and the birth instant. Bodies are treated as lying on the
 * ecliptic (latitude 0), which is exact for the Sun and within a few degrees
 * of longitude for the Moon and Pluto; the page discloses this.
 * Pure and browser-safe: no I/O, no chart storage.
 */
import { computeAngles, gmst, norm360, obliquity, signOf, toJulianDay } from "./ephemeris";

const DEG = Math.PI / 180;
const EARTH_KM = 6371;
const MAX_LAT = 80;

export type AngleKind = "MC" | "IC" | "AC" | "DC";
export const ANGLE_KINDS: readonly AngleKind[] = ["MC", "IC", "AC", "DC"];

export const ANGLE_THEME: Record<AngleKind, { name: string; theme: string }> = {
  MC: { name: "Midheaven", theme: "work, reputation and being seen" },
  IC: { name: "Imum Coeli", theme: "home, roots and private life" },
  AC: { name: "Rising", theme: "how you come across and start things" },
  DC: { name: "Setting", theme: "partnerships and close one-to-one ties" },
};

export interface LineBody {
  key: string;
  label: string;
  lon: number;
}

export interface CartoLine {
  id: string;
  body: string;
  label: string;
  angle: AngleKind;
  /** Segments of [longitude, latitude] pairs, split at the antimeridian. */
  segments: [number, number][][];
}

/** Wrap a longitude into [-180, 180). */
export function wrapLon(x: number): number {
  return ((((x + 180) % 360) + 360) % 360) - 180;
}

export function equatorial(lon: number, jd: number) {
  const eps = obliquity(jd) * DEG;
  const l = lon * DEG;
  const ra = norm360(Math.atan2(Math.sin(l) * Math.cos(eps), Math.cos(l)) / DEG);
  const dec = Math.asin(Math.sin(eps) * Math.sin(l)) / DEG;
  return { ra, dec };
}

function splitSegments(points: [number, number][]): [number, number][][] {
  const out: [number, number][][] = [];
  let current: [number, number][] = [];
  for (const p of points) {
    const prev = current[current.length - 1];
    if (prev && Math.abs(p[0] - prev[0]) > 180) {
      if (current.length > 1) out.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length > 1) out.push(current);
  return out;
}

export function linesFor(bodies: LineBody[], utcISO: string, step = 1): CartoLine[] {
  const jd = toJulianDay(new Date(utcISO));
  const theta0 = gmst(jd);
  const lines: CartoLine[] = [];
  for (const b of bodies) {
    const { ra, dec } = equatorial(b.lon, jd);
    const mc = wrapLon(ra - theta0);
    const ic = wrapLon(mc + 180);
    const meridian = (lon: number): [number, number][][] => [
      [
        [lon, -MAX_LAT],
        [lon, MAX_LAT],
      ],
    ];
    lines.push({ id: `${b.key}-MC`, body: b.key, label: b.label, angle: "MC", segments: meridian(mc) });
    lines.push({ id: `${b.key}-IC`, body: b.key, label: b.label, angle: "IC", segments: meridian(ic) });
    const rise: [number, number][] = [];
    const set: [number, number][] = [];
    const tanDec = Math.tan(dec * DEG);
    for (let lat = -MAX_LAT; lat <= MAX_LAT + 1e-9; lat += step) {
      const c = -Math.tan(lat * DEG) * tanDec;
      if (c < -1 || c > 1) continue;
      const h = Math.acos(c) / DEG;
      rise.push([wrapLon(ra - h - theta0), lat]);
      set.push([wrapLon(ra + h - theta0), lat]);
    }
    lines.push({ id: `${b.key}-AC`, body: b.key, label: b.label, angle: "AC", segments: splitSegments(rise) });
    lines.push({ id: `${b.key}-DC`, body: b.key, label: b.label, angle: "DC", segments: splitSegments(set) });
  }
  return lines;
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance from a point to a line; meridians are exact, curves use densified samples. */
export function distanceToLineKm(line: CartoLine, point: [number, number]): number {
  if (line.angle === "MC" || line.angle === "IC") {
    const lon = line.segments[0]![0]![0];
    const dLon = Math.abs(wrapLon(point[0] - lon)) * DEG;
    const lat = point[1] * DEG;
    // Great-circle distance from a point to a meridian.
    return EARTH_KM * Math.asin(Math.min(1, Math.abs(Math.sin(dLon) * Math.cos(lat)))) *
      (Math.abs(dLon) > Math.PI / 2 ? Infinity : 1);
  }
  let best = Infinity;
  for (const seg of line.segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = seg[i]!;
      const b = seg[i + 1]!;
      for (let t = 0; t <= 1; t += 0.1) {
        const p: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        best = Math.min(best, haversineKm(p, point));
      }
    }
  }
  return best;
}

export interface NearbyLine {
  line: CartoLine;
  km: number;
}

export function nearbyLines(lines: CartoLine[], point: [number, number], withinKm = 800) {
  return lines
    .map((line) => ({ line, km: distanceToLineKm(line, point) }))
    .filter((n) => n.km <= withinKm)
    .sort((a, b) => a.km - b.km);
}

/** Relocated angles: same birth instant, new place. In-app approximation. */
export function relocatedAngles(utcISO: string, latitude: number, longitude: number) {
  const a = computeAngles(toJulianDay(new Date(utcISO)), latitude, longitude);
  return {
    ascendant: a.ascendant,
    midheaven: a.midheaven,
    risingSign: signOf(a.ascendant),
    midheavenSign: signOf(a.midheaven),
  };
}
