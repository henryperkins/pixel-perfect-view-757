// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sweph from "sweph";

const manifest = JSON.parse(readFileSync(new URL("../ephemeris.lock.json", import.meta.url)));
const FLAGS = 258;
const BODIES = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  node: 11,
};
const NAMES = {
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
  node: "TrueNode",
};
const ASPECTS = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  quincunx: 150,
  opposition: 180,
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const norm = (angle) => ((angle % 360) + 360) % 360;
const angleDelta = (angle) => norm(angle + 180) - 180;

/** Conservative order-independent interior of the pinned 1800/2399 files. */
const coverage = Object.freeze({
  from: Date.parse("1800-01-02T00:00:00Z"),
  to: Date.parse("2399-12-30T00:00:00Z"),
});

function utcToUt(ms) {
  if (!Number.isFinite(ms) || ms < coverage.from || ms > coverage.to)
    throw new Error("source_range");
  const d = new Date(ms);
  const converted = sweph.utc_to_jd(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    sweph.constants.SE_GREG_CAL,
  );
  if (converted.flag !== 0 || !Number.isFinite(converted.data?.[1]))
    throw new Error("time_conversion");
  return converted.data[1];
}
function utToUtc(jd) {
  if (!Number.isFinite(jd)) throw Error("time_conversion");
  const d = sweph.jdut1_to_utc(jd, sweph.constants.SE_GREG_CAL);
  if (!Object.values(d).every(Number.isFinite)) throw Error("time_conversion");
  return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, 0) + Math.round(d.second * 1000);
}

export function createEngine({
  ephemerisPath = process.env.SE_EPHE_PATH ||
    fileURLToPath(new URL("../data/ephe/", import.meta.url)),
} = {}) {
  // Swiss can load auxiliary time-conversion files and override its path from
  // SE_EPHE_PATH. Only the two reviewed files may influence this source.
  try {
    ephemerisPath = realpathSync(ephemerisPath);
    if (process.env.SE_EPHE_PATH && realpathSync(process.env.SE_EPHE_PATH) !== ephemerisPath)
      throw new Error("path_override");
    const entries = readdirSync(ephemerisPath, { withFileTypes: true });
    if (
      entries.length !== manifest.files.length ||
      entries.some((entry) => !entry.isFile() || !manifest.files.some((f) => f.name === entry.name))
    )
      throw new Error("unpinned_input");
  } catch {
    throw new Error("ephemeris_integrity");
  }
  for (const file of manifest.files) {
    let bytes;
    try {
      bytes = readFileSync(join(ephemerisPath, file.name));
    } catch {
      throw new Error("ephemeris_integrity");
    }
    if (bytes.length !== file.bytes || sha(bytes) !== file.sha256)
      throw new Error("ephemeris_integrity");
  }
  if (sweph.version() !== "2.10.03") throw new Error("engine_version");
  sweph.set_ephe_path(ephemerisPath);
  const dataId = `sha256:${sha(JSON.stringify(manifest.files.map(({ name, sha256 }) => ({ name, sha256 }))))}`;
  const source = Object.freeze({
    engine: "swiss-ephemeris",
    engineVersion: sweph.version(),
    dataId,
    frame: "tropical-apparent-geocentric-true-equinox-of-date",
    timeScale: "UT",
    returnedFlags: FLAGS,
  });
  const sourceId = `pattern-swiss-1:${sha(JSON.stringify({ source, utc: "swe_utc_to_jd", wrapper: "sweph@2.10.3-7", solver: "transit-episode-1" })).slice(0, 32)}`;
  const position = (body, ms) => {
    if (!Object.hasOwn(BODIES, body)) throw new Error("unsupported_body");
    const result = sweph.calc_ut(utcToUt(ms), BODIES[body], FLAGS);
    if (result.flag !== FLAGS || !result.data?.every(Number.isFinite))
      throw new Error("unqualified_source");
    return { longitude: norm(result.data[0]), latitude: result.data[1], speed: result.data[3] };
  };
  const chart = (input) => {
    const keys = ["date", "time", "timezoneOffset", "latitude", "longitude"];
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).some((k) => !keys.includes(k)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
      !/^\d{2}:\d{2}:\d{2}$/.test(input.time) ||
      input.timezoneOffset !== 0 ||
      !Number.isFinite(input.latitude) ||
      Math.abs(input.latitude) > 90 ||
      !Number.isFinite(input.longitude) ||
      Math.abs(input.longitude) > 180
    )
      throw new Error("invalid_request");
    const iso = `${input.date}T${input.time}.000Z`,
      ms = Date.parse(iso);
    if (!Number.isFinite(ms) || new Date(ms).toISOString() !== iso)
      throw new Error("invalid_request");
    const jd = utcToUt(ms);
    const planets = Object.keys(BODIES).map((body) => ({
      name: NAMES[body],
      ...position(body, ms),
    }));
    let houseSystem = "P",
      houses = sweph.houses_ex2(jd, 0, input.latitude, input.longitude, "P");
    if (houses.flag !== 0) {
      houseSystem = "O";
      houses = sweph.houses_ex2(jd, 0, input.latitude, input.longitude, "O");
    }
    if (
      houses.flag !== 0 ||
      houses.data?.houses?.length !== 12 ||
      !houses.data.houses.every(Number.isFinite) ||
      !houses.data.points.every(Number.isFinite)
    )
      throw new Error("houses_unavailable");
    const aspects = [];
    for (let i = 0; i < planets.length; i++)
      for (let j = i + 1; j < planets.length; j++) {
        const a = planets[i],
          b = planets[j],
          delta = angleDelta(a.longitude - b.longitude);
        const separation = Math.abs(delta);
        for (const [name, angle] of Object.entries(ASPECTS)) {
          const orb = Math.abs(separation - angle);
          const luminary = [a.name, b.name].some((n) => n === "Sun" || n === "Moon");
          const limit = name === "quincunx" ? 3 : luminary ? 8 : 6;
          if (orb <= limit)
            aspects.push({
              planet1: a.name,
              planet2: b.name,
              type: { name },
              orb,
              isApplying: (separation - angle) * Math.sign(delta) * (a.speed - b.speed) < 0,
            });
        }
      }
    return {
      data: {
        planets,
        houses: {
          system: houseSystem,
          cusps: houses.data.houses.map(norm),
          ascendant: norm(houses.data.points[0]),
          mc: norm(houses.data.points[1]),
        },
        aspects,
        positionSource: source,
        meta: {
          engineVersion: source.engineVersion,
          sourceId,
          houseFallback: houseSystem === "P" ? null : "placidus_unavailable",
        },
      },
    };
  };
  const metadata = Object.freeze({
    source,
    sourceId,
    wrapper: "sweph@2.10.3-7",
    files: manifest.files,
    upstreamCommit: manifest.commit,
    utcConversion:
      "swe_utc_to_jd: UT1 result -> swe_calc_ut; pre-1972 input follows Swiss UT convention",
    coverage: {
      from: new Date(coverage.from).toISOString(),
      to: new Date(coverage.to).toISOString(),
    },
    houseSystem: "placidus",
    houseFallback: "porphyry-explicit",
    license: "AGPL-3.0-or-later",
    capabilities: {
      astronomyEvents: {
        contract: "swiss-astronomy-events/1",
        solverVersion: "lunations-eclipses-1",
        maximumRangeDays: 366,
        coverageEnd: "2399-01-01T00:00:00.000Z",
      },
      solarContext: {
        contract: "swiss-solar-context/1",
        solverVersion: "solar-civil-day-1",
        convention: "apparent-upper-limb; sea-level; 1013.25hPa; 15C",
      },
      upcomingCycles: {
        contract: "swiss-upcoming-cycles/1",
        solverVersion: "upcoming-cycles-2",
        maximumRangeDays: 365,
        maximumTargets: 3,
        maximumEvaluations: 120000,
      },
    },
  });
  const eclipseAfter = (kind, ms) => {
    const jd = utcToUt(ms);
    const result =
      kind === "solar"
        ? sweph.sol_eclipse_when_glob(jd, 2, 0, false)
        : kind === "lunar"
          ? sweph.lun_eclipse_when(jd, 2, 0, false)
          : null;
    // swe_lun_eclipse_when leaves this diagnostic in serr while sampling
    // outside the penumbra for contact times. A positive eclipse flag is
    // still successful; keep every other source/native error fatal.
    const lunarContactDiagnostic =
      kind === "lunar" &&
      [4, 16, 64].includes(result?.flag) &&
      /^no lunar eclipse at tjd = -?\d+\.\d+$/.test(result?.error || "");
    if (
      !result ||
      result.flag <= 0 ||
      (result.error && !lunarContactDiagnostic) ||
      !Number.isFinite(result.data?.[0])
    )
      throw Error("unqualified_source");
    return { at: utToUtc(result.data[0]), classification: result.flag };
  };
  const solarEvent = (ms, latitude, longitude, kind) => {
    const mode = { rise: 1, set: 2, upper: 4, lower: 8 }[kind];
    if (!mode) throw Error("invalid_request");
    const result = sweph.rise_trans(
      utcToUt(ms),
      0,
      null,
      2,
      mode,
      [longitude, latitude, 0],
      1013.25,
      15,
    );
    if (result.flag === -2) return null;
    if (result.flag !== 0 || result.error || !Number.isFinite(result.data))
      throw Error("unqualified_source");
    return utToUtc(result.data);
  };
  const sunAboveHorizon = (ms, latitude, longitude) => {
    sweph.set_topo(longitude, latitude, 0);
    const jd = utcToUt(ms),
      p = sweph.calc_ut(jd, 0, 35074);
    if (p.flag !== 35074 || p.error || !p.data.every(Number.isFinite))
      throw Error("unqualified_source");
    const horizontal = sweph.azalt(
      jd,
      1,
      [longitude, latitude, 0],
      1013.25,
      15,
      p.data.slice(0, 3),
    );
    if (!Array.isArray(horizontal) || !horizontal.every(Number.isFinite))
      throw Error("unqualified_source");
    // Same solar radius as the pinned native swecl.c upper-limb calculation.
    const radius = (Math.asin(1392000000 / 2 / 149597870700 / p.data[2]) * 180) / Math.PI;
    // rise_trans refracts the upper limb after adding the radius to the true
    // topocentric altitude. Refracting the center first misclassifies polar edges.
    const upper = sweph.azalt_rev(
      jd,
      1,
      [longitude, latitude, 0],
      [horizontal[0], horizontal[1] + radius],
    );
    const apparent = sweph.azalt(jd, 1, [longitude, latitude, 0], 1013.25, 15, [
      upper[0],
      upper[1],
      p.data[2],
    ]);
    if (!Array.isArray(apparent) || !apparent.every(Number.isFinite))
      throw Error("unqualified_source");
    return apparent[2] > 0;
  };
  return {
    source,
    sourceId,
    coverage,
    metadata,
    position,
    chart,
    eclipseAfter,
    solarEvent,
    sunAboveHorizon,
  };
}
