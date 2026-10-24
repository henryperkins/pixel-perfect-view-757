/**
 * Astro-cartography lines (Jim Lewis A*C*G model) from natal ecliptic
 * longitudes and the birth instant. Each body's ecliptic latitude (the Moon
 * up to ~5°, Pluto up to ~17°) uses Astronomy Engine when not supplied.
 * Apparent sidereal time and true obliquity keep the coordinate frames aligned.
 * Pure and browser-safe: no I/O, no chart storage.
 */
import { Body as AstronomyBody, Ecliptic, GeoVector, MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import { norm360, signOf, toJulianDay } from "./ephemeris.ts";

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
  /** Ecliptic latitude; when omitted it is taken from the body's orbit. */
  lat?: number;
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

export function equatorial(lon: number, jd: number, lat = 0) {
  const eps = trueObliquity(jd) * DEG;
  const l = lon * DEG;
  const b = lat * DEG;
  const ra = norm360(
    Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l)) / DEG,
  );
  const dec =
    Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l)) / DEG;
  return { ra, dec };
}

export function trueObliquity(jd: number): number {
  return e_tilt(MakeTime(jd - 2451545)).tobl;
}

export function apparentSiderealDegrees(jd: number): number {
  return SiderealTime(jd - 2451545) * 15;
}

const ORBIT_BODY: Record<string, AstronomyBody> = {
  sun: AstronomyBody.Sun, moon: AstronomyBody.Moon, mercury: AstronomyBody.Mercury,
  venus: AstronomyBody.Venus, mars: AstronomyBody.Mars, jupiter: AstronomyBody.Jupiter,
  saturn: AstronomyBody.Saturn, uranus: AstronomyBody.Uranus,
  neptune: AstronomyBody.Neptune, pluto: AstronomyBody.Pluto,
};

/** Geocentric apparent latitude; independent analytical engine, not Swiss-grade data. */
export function orbitalLatitude(key: string, jd: number): number {
  if (key === "sun" || key === "node") return 0;
  const body = ORBIT_BODY[key];
  return body ? Ecliptic(GeoVector(body, jd - 2451545, true)).elat : 0;
}

/** Exact spherical horizon at a latitude; null means the body never crosses it. */
export function lineLongitudeAt(ra: number, dec: number, theta: number, angle: AngleKind, latitude: number): number | null {
  if (angle === "MC") return wrapLon(ra - theta);
  if (angle === "IC") return wrapLon(ra - theta + 180);
  const c = -Math.tan(latitude * DEG) * Math.tan(dec * DEG);
  if (Math.abs(c) > 1) return null;
  const h = Math.acos(c) / DEG;
  return wrapLon(ra + (angle === "AC" ? -h : h) - theta);
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

export function linesFor(bodies: LineBody[], utcISO: string, step = 0.25): CartoLine[] {
  if (!Number.isFinite(step) || step <= 0 || step > 5) throw new RangeError("Line step must be greater than zero and at most five degrees.");
  const jd = toJulianDay(new Date(utcISO));
  const theta0 = apparentSiderealDegrees(jd);
  const lines: CartoLine[] = [];
  for (const b of bodies) {
    const { ra, dec } = equatorial(b.lon, jd, b.lat ?? orbitalLatitude(b.key, jd));
    const mc = wrapLon(ra - theta0);
    const ic = wrapLon(mc + 180);
    const meridian = (lon: number): [number, number][][] => [
      [
        [lon, -MAX_LAT],
        [lon, MAX_LAT],
      ],
    ];
    lines.push({
      id: `${b.key}-MC`,
      body: b.key,
      label: b.label,
      angle: "MC",
      segments: meridian(mc),
    });
    lines.push({
      id: `${b.key}-IC`,
      body: b.key,
      label: b.label,
      angle: "IC",
      segments: meridian(ic),
    });
    const rise: [number, number][] = [];
    const set: [number, number][] = [];
    for (let lat = -MAX_LAT; lat <= MAX_LAT + 1e-9; lat += step) {
      const ac = lineLongitudeAt(ra, dec, theta0, "AC", lat);
      const dc = lineLongitudeAt(ra, dec, theta0, "DC", lat);
      if (ac === null || dc === null) continue;
      rise.push([ac, lat]);
      set.push([dc, lat]);
    }
    lines.push({
      id: `${b.key}-AC`,
      body: b.key,
      label: b.label,
      angle: "AC",
      segments: splitSegments(rise),
    });
    lines.push({
      id: `${b.key}-DC`,
      body: b.key,
      label: b.label,
      angle: "DC",
      segments: splitSegments(set),
    });
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
    const lon = line.segments[0]?.[0]?.[0];
    if (lon === undefined) return Infinity;
    const dLon = Math.abs(wrapLon(point[0] - lon)) * DEG;
    const lat = point[1] * DEG;
    // Great-circle distance from a point to a meridian (nearer than a quarter turn).
    if (dLon > Math.PI / 2) return Infinity;
    return EARTH_KM * Math.asin(Math.min(1, Math.abs(Math.sin(dLon) * Math.cos(lat))));
  }
  let best = Infinity;
  for (const seg of line.segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = seg[i];
      const b = seg[i + 1];
      if (!a || !b) continue;
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

/** Relocated ecliptic angles using the same true-of-date frame as the lines. */
export function relocatedAngles(utcISO: string, latitude: number, longitude: number) {
  const jd = toJulianDay(new Date(utcISO));
  const theta = norm360(apparentSiderealDegrees(jd) + longitude) * DEG;
  const eps = trueObliquity(jd) * DEG;
  const a = {
    midheaven: norm360(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) / DEG),
    ascendant: norm360(Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(latitude * DEG) * Math.sin(eps))) / DEG),
  };
  return {
    ascendant: a.ascendant,
    midheaven: a.midheaven,
    risingSign: signOf(a.ascendant),
    midheavenSign: signOf(a.midheaven),
  };
}

export interface LineCrossing {
  id: string;
  a: CartoLine;
  b: CartoLine;
  lon: number;
  lat: number;
}

/** Where a rising/setting curve crosses another body's MC/IC meridian. */
export function lineCrossings(lines: CartoLine[]): LineCrossing[] {
  const meridians = lines.filter((l) => l.angle === "MC" || l.angle === "IC");
  const curves = lines.filter((l) => l.angle === "AC" || l.angle === "DC");
  const out: LineCrossing[] = [];
  for (const m of meridians) {
    const mLon = m.segments[0]?.[0]?.[0];
    if (mLon === undefined) continue;
    for (const c of curves) {
      if (c.body === m.body) continue;
      for (const seg of c.segments) {
        for (let i = 0; i < seg.length - 1; i++) {
          const p = seg[i];
          const q = seg[i + 1];
          if (!p || !q) continue;
          const dp = wrapLon(p[0] - mLon);
          const dq = wrapLon(q[0] - mLon);
          if (Math.abs(dp - dq) > 180 || dp > 0 === dq > 0) continue;
          const t = dp / (dp - dq);
          out.push({
            id: `${c.id}x${m.id}`,
            a: c,
            b: m,
            lon: mLon,
            lat: p[1] + (q[1] - p[1]) * t,
          });
        }
      }
    }
  }
  return out;
}

/** Crossings whose latitude band runs near a place (parans act along a latitude). */
export function crossingsNear(crossings: LineCrossing[], latitude: number, withinDeg = 1.5) {
  return crossings
    .filter((c) => Math.abs(c.lat - latitude) <= withinDeg)
    .sort((x, y) => Math.abs(x.lat - latitude) - Math.abs(y.lat - latitude));
}
