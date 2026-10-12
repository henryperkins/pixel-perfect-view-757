/**
 * Swiss Ephemeris service client.
 *
 * The high-precision engine lives outside this app (it needs a native
 * ephemeris binary, which this runtime cannot host). We call it over HTTP for
 * chart positions and fall back to the in-app analytical engine whenever the
 * service is unconfigured, slow, unreachable, or returns an unusable payload.
 * The fallback is never silent: the resulting chart carries
 * `degraded: true` plus a reason, which the reading layer surfaces.
 */

import {
  BODIES,
  type Body,
  type BodyPosition,
  allPositions,
  degreeInSign,
  norm360,
  signOf,
  ENGINE_ID,
  ENGINE_VERSION,
} from "./ephemeris";
import { positionSourceSchema } from "./transit-anchors";
import type { AspectKey, EphemerisResult } from "./chart";

const TIMEOUT_MS = 6000;

const HOUSE_SYSTEM_NAME: Record<string, string> = {
  P: "placidus",
  K: "koch",
  W: "whole-sign",
  E: "equal",
  R: "regiomontanus",
  C: "campanus",
  O: "porphyry",
};

const NAME_TO_KEY: Record<string, string> = {
  Sun: "sun",
  Moon: "moon",
  Mercury: "mercury",
  Venus: "venus",
  Mars: "mars",
  Jupiter: "jupiter",
  Saturn: "saturn",
  Uranus: "uranus",
  Neptune: "neptune",
  Pluto: "pluto",
  "true Node": "node",
  TrueNode: "node",
  Ascendant: "ascendant",
  ASC: "ascendant",
  MC: "midheaven",
  Midheaven: "midheaven",
};

const ASPECT_KINDS = new Set([
  "conjunction",
  "sextile",
  "square",
  "trine",
  "quincunx",
  "opposition",
]);

/** Body id aliases a Swiss Ephemeris service is likely to use. */
const ALIASES: Record<Body, string[]> = {
  sun: ["sun", "Sun", "SE_SUN", "0"],
  moon: ["moon", "Moon", "SE_MOON", "1"],
  mercury: ["mercury", "Mercury", "2"],
  venus: ["venus", "Venus", "3"],
  mars: ["mars", "Mars", "4"],
  jupiter: ["jupiter", "Jupiter", "5"],
  saturn: ["saturn", "Saturn", "6"],
  uranus: ["uranus", "Uranus", "7"],
  neptune: ["neptune", "Neptune", "8"],
  pluto: ["pluto", "Pluto", "9"],
  node: [
    "node",
    "north_node",
    "true_node",
    "true Node",
    "TrueNode",
    "mean_node",
    "mean Node",
    "11",
  ],
};

type Raw = Record<string, unknown>;

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function pickBucket(payload: Raw): Raw | null {
  // AstroWay and similar services nest the chart under `data`.
  const root =
    payload["data"] && typeof payload["data"] === "object" && !Array.isArray(payload["data"])
      ? (payload["data"] as Raw)
      : payload;

  for (const key of ["positions", "bodies", "planets", "result"]) {
    const v = root[key];
    if (Array.isArray(v)) {
      const byId: Raw = {};
      for (const entry of v) {
        if (entry && typeof entry === "object") {
          const e = entry as Raw;
          const id = e["body"] ?? e["name"] ?? e["id"] ?? e["key"];
          if (typeof id === "string" || typeof id === "number") byId[String(id)] = e;
        }
      }
      return byId;
    }
    if (v && typeof v === "object") return v as Raw;
  }
  return root;
}

function readBody(bucket: Raw, body: Body): BodyPosition | null {
  let entry: unknown;
  for (const alias of ALIASES[body]) {
    if (bucket[alias] !== undefined) {
      entry = bucket[alias];
      break;
    }
  }
  if (entry === undefined) return null;

  let lon: number | null = null;
  let lat = 0;
  let speed: number | null = null;
  let retroFlag: boolean | null = null;

  if (typeof entry === "number" || typeof entry === "string") {
    lon = num(entry);
  } else if (entry && typeof entry === "object") {
    const e = entry as Raw;
    lon = num(e["lon"] ?? e["longitude"] ?? e["lambda"] ?? e["ecliptic_longitude"]);
    lat = num(e["lat"] ?? e["latitude"] ?? e["beta"]) ?? 0;
    speed = num(
      e["speed"] ?? e["speedLong"] ?? e["lon_speed"] ?? e["longitude_speed"] ?? e["daily_motion"],
    );
    if (typeof e["isRetrograde"] === "boolean") retroFlag = e["isRetrograde"];
    else if (typeof e["retrograde"] === "boolean") retroFlag = e["retrograde"];
  }
  if (lon === null) return null;

  const l = norm360(lon);
  const s = speed ?? 0;
  return {
    body,
    lon: l,
    lat,
    speed: s,
    retrograde: retroFlag ?? (typeof speed === "number" ? s < 0 : false),
    sign: signOf(l),
    degree: degreeInSign(l),
  };
}

function fallback(jd: number, reason: string): EphemerisResult {
  return {
    positions: allPositions(jd),
    engine: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    precision: "approximate",
    degraded: true,
    degradedReason: reason,
  };
}

export interface SwissRequest {
  jd: number;
  utcISO: string;
  latitude: number;
  longitude: number;
}

/**
 * Resolve chart positions, preferring the external Swiss Ephemeris service.
 * Always resolves — never throws — so a chart is always computable.
 */
export async function resolvePositions(req: SwissRequest): Promise<EphemerisResult> {
  const url = process.env["SWISS_EPHEMERIS_URL"];
  const key = process.env["SWISS_EPHEMERIS_KEY"];

  if (!url) {
    return fallback(req.jd, "Swiss Ephemeris service is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // AstroWay /v1/chart contract: UTC calendar date + HH:mm:ss, numeric
    // timezone offset, x-api-key header.
    const d = new Date(req.utcISO);
    const iso = d.toISOString();
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(key ? { "x-api-key": key, authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        date: iso.slice(0, 10),
        time: iso.slice(11, 19),
        timezoneOffset: 0,
        latitude: req.latitude,
        longitude: req.longitude,
      }),
    });

    if (!res.ok) {
      return fallback(req.jd, `Swiss Ephemeris service returned HTTP ${res.status}.`);
    }

    const payload = (await res.json()) as Raw;
    const bucket = pickBucket(payload);
    if (!bucket) {
      return fallback(req.jd, "Swiss Ephemeris response had no recognisable positions.");
    }

    const positions = {} as Record<Body, BodyPosition>;
    const missing: Body[] = [];
    for (const b of BODIES) {
      const p = readBody(bucket, b);
      if (!p) missing.push(b);
      else positions[b] = p;
    }
    if (missing.length) {
      return fallback(req.jd, `Swiss Ephemeris response omitted ${missing.join(", ")}.`);
    }

    const meta =
      payload["data"] && typeof payload["data"] === "object"
        ? ((payload["data"] as Raw)["meta"] as Raw | undefined)
        : undefined;
    const version =
      (meta && typeof meta["engineVersion"] === "string" && meta["engineVersion"]) ||
      (typeof payload["ephemeris_version"] === "string" && payload["ephemeris_version"]) ||
      (typeof payload["version"] === "string" && payload["version"]) ||
      "unknown";

    const data =
      payload["data"] && typeof payload["data"] === "object" ? (payload["data"] as Raw) : payload;

    // Houses and angles straight from the service (Placidus by default).
    let houses: EphemerisResult["houses"];
    let angles: EphemerisResult["angles"];
    const h = data["houses"] as Raw | undefined;
    if (h && typeof h === "object") {
      const cusps = Array.isArray(h["cusps"])
        ? (h["cusps"] as unknown[]).map(num).filter((n): n is number => n !== null)
        : [];
      const asc = num(h["ascendant"]);
      const mc = num(h["mc"] ?? h["midheaven"]);
      if (cusps.length === 12) {
        houses = {
          system: HOUSE_SYSTEM_NAME[String(h["system"] ?? "P")] ?? String(h["system"]),
          cusps: cusps.map(norm360),
        };
      }
      if (asc !== null && mc !== null) angles = { ascendant: norm360(asc), midheaven: norm360(mc) };
    }

    // Some responses list the angles as points rather than inside houses.
    if (!angles) {
      const pick = (...names: string[]) => {
        for (const n of names) {
          const e = bucket[n] ?? (data["angles"] as Raw | undefined)?.[n];
          const v = num(
            e && typeof e === "object" ? ((e as Raw)["longitude"] ?? (e as Raw)["lon"]) : e,
          );
          if (v !== null) return v;
        }
        return null;
      };
      const asc = pick("Ascendant", "ASC", "ascendant", "asc");
      const mc = pick("MC", "Midheaven", "midheaven", "mc");
      if (asc !== null && mc !== null) angles = { ascendant: norm360(asc), midheaven: norm360(mc) };
    }

    // Aspects exactly as the service reported them, limited to tracked bodies.
    let aspects: EphemerisResult["aspects"];
    if (Array.isArray(data["aspects"])) {
      aspects = [];
      for (const raw of data["aspects"] as Raw[]) {
        const a = NAME_TO_KEY[String(raw["planet1"] ?? "")];
        const b = NAME_TO_KEY[String(raw["planet2"] ?? "")];
        const t = raw["type"] as Raw | undefined;
        const kind = String(t?.["name"] ?? "").toLowerCase();
        const orb = num(raw["orb"]);
        if (!a || !b || orb === null || !ASPECT_KINDS.has(kind)) continue;
        aspects.push({
          a,
          b,
          aspect: kind as AspectKey,
          orb: Math.abs(orb),
          applying: raw["isApplying"] === true,
        });
      }
    }

    return {
      positions,
      ...(positionSourceSchema.safeParse(data["positionSource"]).success
        ? { positionSource: positionSourceSchema.parse(data["positionSource"]) }
        : {}),
      engine: "swiss-ephemeris",
      engineVersion: version,
      precision: "high",
      degraded: false,
      degradedReason: null,
      houses,
      houseSystemExplicit: typeof h?.["system"] === "string",
      angles,
      aspects,
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? `Swiss Ephemeris service did not respond within ${TIMEOUT_MS / 1000}s.`
        : `Swiss Ephemeris service unreachable: ${
            err instanceof Error ? err.message : "unknown error"
          }`;
    return fallback(req.jd, reason);
  } finally {
    clearTimeout(timer);
  }
}
