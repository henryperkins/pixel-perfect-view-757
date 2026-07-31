/**
 * Low-precision analytical ephemeris.
 *
 * Planets: Standish (JPL) Keplerian elements valid 1800-2050, heliocentric
 * ecliptic of date, differenced against the Earth-Moon barycentre to give
 * geocentric apparent longitude. Typical error < 0.1 deg for the inner
 * planets and a few arcminutes for the outer ones.
 * Moon: truncated ELP/Meeus series, error ~ 0.1 deg.
 *
 * This is deliberately an approximation engine: every reading it feeds
 * declares its engine + contract version so a higher-precision backend can
 * replace it without changing the interpretation contract.
 */

export const ENGINE_ID = "kepler-approx";
export const ENGINE_VERSION = "1.0.0";
export const CONTRACT_VERSION = "chart-contract/1";

export const BODIES = [
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
  "node",
] as const;

export type Body = (typeof BODIES)[number];

export const BODY_LABEL: Record<Body, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  node: "North Node",
};

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type Sign = (typeof SIGNS)[number];

const DEG = Math.PI / 180;

export function norm360(x: number): number {
  const v = x % 360;
  return v < 0 ? v + 360 : v;
}

export function signedDelta(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

export function signOf(lon: number): Sign {
  return SIGNS[Math.floor(norm360(lon) / 30)]!;
}

export function degreeInSign(lon: number): number {
  return norm360(lon) % 30;
}

export function formatPosition(lon: number): string {
  const d = degreeInSign(lon);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}\u00b0${String(min).padStart(2, "0")}' ${signOf(lon)}`;
}

/** Julian day from a UTC instant. */
export function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function fromJulianDay(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

interface Elements {
  a: number;
  e: number;
  i: number;
  L: number;
  wbar: number;
  omega: number;
}

type ElementRow = [number, number, number, number, number, number];

const ELEMENTS: Record<string, { base: ElementRow; rate: ElementRow }> = {
  mercury: {
    base: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  },
  venus: {
    base: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    rate: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  },
  earth: {
    base: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
    rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
  },
  mars: {
    base: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  },
  jupiter: {
    base: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  },
  saturn: {
    base: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    rate: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  },
  uranus: {
    base: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
    rate: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  },
  neptune: {
    base: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
    rate: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  },
  pluto: {
    base: [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
    rate: [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482],
  },
};

function elementsAt(name: string, T: number): Elements {
  const row = ELEMENTS[name]!;
  const [a, e, i, L, wbar, omega] = row.base;
  const [da, de, di, dL, dwbar, domega] = row.rate;
  return {
    a: a + da * T,
    e: e + de * T,
    i: i + di * T,
    L: L + dL * T,
    wbar: wbar + dwbar * T,
    omega: omega + domega * T,
  };
}

function solveKepler(M: number, e: number): number {
  // M in radians
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 12; k++) {
    const dM = M - (E - e * Math.sin(E));
    const dE = dM / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-11) break;
  }
  return E;
}

/** Heliocentric ecliptic rectangular coordinates (AU). */
function heliocentric(name: string, T: number): [number, number, number] {
  const el = elementsAt(name, T);
  const w = el.wbar - el.omega;
  const M = norm360(el.L - el.wbar) * DEG;
  const E = solveKepler(M > Math.PI ? M - 2 * Math.PI : M, el.e);
  const xp = el.a * (Math.cos(E) - el.e);
  const yp = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);

  const cw = Math.cos(w * DEG);
  const sw = Math.sin(w * DEG);
  const co = Math.cos(el.omega * DEG);
  const so = Math.sin(el.omega * DEG);
  const ci = Math.cos(el.i * DEG);
  const si = Math.sin(el.i * DEG);

  const x = (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp;
  const y = (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp;
  const z = sw * si * xp + cw * si * yp;
  return [x, y, z];
}

function centuries(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

/** Geocentric ecliptic longitude/latitude of the Moon (Meeus, truncated). */
function moonLonLat(T: number): [number, number] {
  const Lp =
    218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + (T * T * T) / 538841;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;

  const d = D * DEG;
  const m = M * DEG;
  const mp = Mp * DEG;
  const f = F * DEG;

  const lon =
    Lp +
    6.288774 * Math.sin(mp) +
    1.274027 * Math.sin(2 * d - mp) +
    0.658314 * Math.sin(2 * d) +
    0.213618 * Math.sin(2 * mp) -
    0.185116 * Math.sin(m) -
    0.114332 * Math.sin(2 * f) +
    0.058793 * Math.sin(2 * d - 2 * mp) +
    0.057066 * Math.sin(2 * d - m - mp) +
    0.05332 * Math.sin(2 * d + mp) +
    0.045758 * Math.sin(2 * d - m) -
    0.040923 * Math.sin(m - mp) -
    0.034720 * Math.sin(d) -
    0.030383 * Math.sin(m + mp) +
    0.015327 * Math.sin(2 * d - 2 * f) -
    0.012528 * Math.sin(mp + 2 * f) +
    0.010980 * Math.sin(mp - 2 * f) +
    0.010675 * Math.sin(4 * d - mp) +
    0.010034 * Math.sin(3 * mp);

  const lat =
    5.128122 * Math.sin(f) +
    0.280602 * Math.sin(mp + f) +
    0.277693 * Math.sin(mp - f) +
    0.173237 * Math.sin(2 * d - f) +
    0.055413 * Math.sin(2 * d - mp + f) +
    0.046271 * Math.sin(2 * d - mp - f) +
    0.032573 * Math.sin(2 * d + f) +
    0.017198 * Math.sin(2 * mp + f);

  return [norm360(lon), lat];
}

function meanNode(T: number): number {
  return norm360(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441,
  );
}

export interface BodyPosition {
  body: Body;
  lon: number;
  lat: number;
  speed: number;
  retrograde: boolean;
  sign: Sign;
  degree: number;
}

function rawLonLat(body: Body, jd: number): [number, number] {
  const T = centuries(jd);
  if (body === "moon") return moonLonLat(T);
  if (body === "node") return [meanNode(T), 0];

  const earth = heliocentric("earth", T);
  if (body === "sun") {
    const x = -earth[0];
    const y = -earth[1];
    const z = -earth[2];
    return [norm360(Math.atan2(y, x) / DEG), Math.atan2(z, Math.hypot(x, y)) / DEG];
  }
  const p = heliocentric(body, T);
  const x = p[0] - earth[0];
  const y = p[1] - earth[1];
  const z = p[2] - earth[2];
  return [norm360(Math.atan2(y, x) / DEG), Math.atan2(z, Math.hypot(x, y)) / DEG];
}

export function positionOf(body: Body, jd: number): BodyPosition {
  const [lon, lat] = rawLonLat(body, jd);
  const step = body === "moon" ? 0.02 : 0.5;
  const [lonAhead] = rawLonLat(body, jd + step);
  const speed = signedDelta(lonAhead, lon) / step;
  return {
    body,
    lon,
    lat,
    speed,
    retrograde: speed < 0,
    sign: signOf(lon),
    degree: degreeInSign(lon),
  };
}

export function allPositions(jd: number): Record<Body, BodyPosition> {
  const out = {} as Record<Body, BodyPosition>;
  for (const b of BODIES) out[b] = positionOf(b, jd);
  return out;
}

export function obliquity(jd: number): number {
  const T = centuries(jd);
  return 23.439291 - 0.0130042 * T - 0.00000016 * T * T;
}

/** Greenwich mean sidereal time in degrees. */
export function gmst(jd: number): number {
  const T = centuries(jd);
  return norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  );
}

export interface Angles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
}

export function computeAngles(jd: number, latitude: number, longitude: number): Angles {
  const eps = obliquity(jd) * DEG;
  const theta = norm360(gmst(jd) + longitude) * DEG;
  const phi = latitude * DEG;

  let mc = Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) / DEG;
  mc = norm360(mc);

  let asc =
    Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
    ) / DEG;
  asc = norm360(asc);

  return {
    ascendant: asc,
    midheaven: mc,
    descendant: norm360(asc + 180),
    imumCoeli: norm360(mc + 180),
  };
}

/**
 * Whole-sign houses. Chosen deliberately: it degrades gracefully at high
 * latitudes and its single assumption (the rising sign is the 1st house) is
 * easy to disclose to the reader.
 */
export const HOUSE_SYSTEM = "whole-sign";

export function wholeSignHouses(ascendant: number): number[] {
  const start = Math.floor(norm360(ascendant) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30));
}

export function houseOf(lon: number, ascendant: number): number {
  const start = Math.floor(norm360(ascendant) / 30);
  const s = Math.floor(norm360(lon) / 30);
  return ((s - start + 12) % 12) + 1;
}
