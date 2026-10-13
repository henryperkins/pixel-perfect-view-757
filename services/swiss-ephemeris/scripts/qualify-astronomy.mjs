// SPDX-License-Identifier: AGPL-3.0-or-later
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { createEngine } from "../src/engine.mjs";
import { calculateLunations } from "../src/lunations.mjs";
import { calculateSolarContext } from "../src/solar.mjs";
import { calculateUpcoming } from "../src/upcoming.mjs";
import { referenceLunations, referenceSolar } from "./astronomy-reference.mjs";
import { enumerateReference, referencePosition } from "./reference.mjs";
const out = resolve(process.argv[2] || "dist/astronomy-qualification");
mkdirSync(out, { recursive: true });
const engine = createEngine(),
  DAY = 86400000,
  results = [],
  norm = (n) => ((n % 360) + 360) % 360;
function capture(id, input, actual, reference, issues, durationMs) {
  const record = { id, input, actual, reference, issues, durationMs };
  writeFileSync(join(out, id + ".json"), JSON.stringify(record, null, 2) + "\n");
  const result = { id, pass: issues.length === 0, durationMs, issues };
  results.push(result);
  console.log(JSON.stringify(result));
}
function compare(a, b, label, issues) {
  if (a === null || b === null) {
    if (a !== b) issues.push(label + ": null differs");
    return;
  }
  const seconds = Math.abs(Date.parse(a) - Date.parse(b)) / 1000;
  if (seconds > 60) issues.push(label + ": " + seconds + " seconds");
}
for (const [id, from, to] of [
  ["lunar-year", "2026-01-01T00:00:00.000Z", "2027-01-01T00:00:00.000Z"],
  ["lunar-multiple", "2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z"],
  ["lunar-empty", "2026-01-10T00:00:00.000Z", "2026-01-10T01:00:00.000Z"],
  ["lunar-source-start", "1800-01-02T00:00:00.000Z", "1800-01-10T00:00:00.000Z"],
  ["lunar-source-end", "2398-12-20T00:00:00.000Z", "2399-01-01T00:00:00.000Z"],
]) {
  const input = { contract: "swiss-astronomy-events/1", sourceId: engine.sourceId, from, to },
    start = performance.now(),
    actual = calculateLunations(input, engine),
    durationMs = performance.now() - start,
    reference = referenceLunations(from, to),
    issues = [];
  if (actual.events.length !== reference.length) issues.push("event count");
  actual.events.forEach((e, i) => {
    const r = reference[i];
    if (!r) return;
    if (e.kind !== r.kind) issues.push("kind " + i);
    compare(e.at, r.at, "event " + i, issues);
    for (const key of ["sunLongitude", "moonLongitude"])
      if (Math.abs(norm(e[key] - r[key] + 180) - 180) > 0.001)
        issues.push("longitude " + i + "/" + key);
  });
  capture(id, input, actual, reference, issues, durationMs);
}
const zones = [
  [
    "solar-north",
    52,
    0,
    "2026-10-13",
    "UTC",
    "2026-10-13T00:00:00.000Z",
    "2026-10-14T00:00:00.000Z",
  ],
  [
    "solar-south",
    -34,
    151,
    "2026-10-13",
    "Australia/Sydney",
    "2026-10-12T13:00:00.000Z",
    "2026-10-13T13:00:00.000Z",
  ],
  [
    "solar-equator",
    0,
    175,
    "2026-10-13",
    "UTC",
    "2026-10-13T00:00:00.000Z",
    "2026-10-14T00:00:00.000Z",
  ],
  [
    "solar-dst-short",
    41,
    -74,
    "2026-03-08",
    "America/New_York",
    "2026-03-08T05:00:00.000Z",
    "2026-03-09T04:00:00.000Z",
  ],
  [
    "solar-dst-long",
    41,
    -74,
    "2026-11-01",
    "America/New_York",
    "2026-11-01T04:00:00.000Z",
    "2026-11-02T05:00:00.000Z",
  ],
];
for (const latitude of [89, -89])
  for (const day of ["2026-06-21", "2026-12-21"])
    zones.push([
      "solar-polar-" + latitude + "-" + day,
      latitude,
      0,
      day,
      "UTC",
      day + "T00:00:00.000Z",
      new Date(Date.parse(day) + DAY).toISOString(),
    ]);
for (const [id, latitude, longitude, day, timeZone, from, to] of zones) {
  const input = {
      contract: "swiss-solar-context/1",
      sourceId: engine.sourceId,
      latitude,
      longitude,
      day,
      timeZone,
      from,
      to,
    },
    start = performance.now(),
    actual = calculateSolarContext(input, engine),
    durationMs = performance.now() - start,
    reference = referenceSolar(input),
    issues = [];
  for (const key of ["sunriseUtc", "sunsetUtc"]) compare(actual[key], reference[key], key, issues);
  if (Math.abs(latitude) === 89) {
    const expected = latitude > 0 === (day === "2026-06-21") ? "polar_day" : "polar_night";
    if (actual.daylight !== expected) issues.push("polar classification");
  }
  capture(id, input, actual, reference, issues, durationMs);
}
for (const body of [
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]) {
  const from = "2026-01-01T12:00:00.000Z",
    to = "2026-04-01T12:00:00.000Z",
    longitude = referencePosition(body, Date.parse("2026-02-01T12:00:00.000Z")).longitude;
  const input = {
    contract: "swiss-upcoming-cycles/1",
    solverVersion: "upcoming-cycles-1",
    sourceId: engine.sourceId,
    from,
    to,
    bodies: [body],
    aspects: ["conjunction"],
    targets: [
      {
        name: "sun",
        offsets: [-2, 0, 2],
        longitudes: [norm(longitude - 0.00001), longitude, norm(longitude + 0.00001)],
      },
    ],
    duration: "all",
  };
  const start = performance.now(),
    actual = calculateUpcoming(input, engine),
    durationMs = performance.now() - start,
    reference = enumerateReference(
      {
        transitBody: body,
        aspect: "conjunction",
        targets: input.targets[0].longitudes.map((longitude) => ({ longitude })),
        maxOrbDegrees: body === "moon" ? 1.5 : ["sun", "mercury", "venus"].includes(body) ? 2.5 : 3,
      },
      referencePosition,
      {
        from:
          Date.parse(from) -
          (body === "moon" ? 3 : ["sun", "mercury", "venus", "mars"].includes(body) ? 60 : 180) *
            DAY,
        to:
          Date.parse(to) +
          (body === "moon" ? 3 : ["sun", "mercury", "venus", "mars"].includes(body) ? 60 : 180) *
            DAY,
      },
    );
  const expected = reference.samples[1].windows.filter(
      (w) =>
        (w.ingress === null || w.ingress < Date.parse(to)) &&
        (w.egress === null || w.egress > Date.parse(from)),
    ),
    issues = [];
  if (actual.windows.length !== expected.length) issues.push("window count");
  actual.windows.forEach((w, i) => {
    const r = expected[i];
    if (!r) return;
    compare(
      w.start,
      r.ingress === null ? null : new Date(r.ingress).toISOString(),
      "ingress " + i,
      issues,
    );
    compare(
      w.end,
      r.egress === null ? null : new Date(r.egress).toISOString(),
      "egress " + i,
      issues,
    );
    if (w.exactAt.length !== r.contacts.length) issues.push("contact count " + i);
    w.exactAt.forEach((at, n) => {
      if (r.contacts[n])
        compare(at, new Date(r.contacts[n]).toISOString(), "exact " + i + "/" + n, issues);
    });
  });
  delete reference.raw;
  capture("upcoming-" + body, input, actual, reference, issues, durationMs);
}
const paths = [
  "../src/engine.mjs",
  "../src/track.mjs",
  "../src/episodes.mjs",
  "../src/lunations.mjs",
  "../src/solar.mjs",
  "../src/upcoming.mjs",
  "./astronomy-reference.mjs",
  "./reference.mjs",
  "./qualify-astronomy.mjs",
];
// A real synthetic precise chart exercises fast bodies, angles and full-year budgets.
const samples = ["11:58:00", "12:00:00", "12:02:00"].map(
  (time) =>
    engine.chart({ date: "1990-01-01", time, timezoneOffset: 0, latitude: 41, longitude: -88 })
      .data,
);
const targets = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "ascendant",
  "midheaven",
].map((name) => ({
  name,
  offsets: [-2, 0, 2],
  longitudes: samples.map((s) =>
    name === "ascendant"
      ? s.houses.ascendant
      : name === "midheaven"
        ? s.houses.mc
        : s.planets.find((p) => p.name.toLowerCase() === name).longitude,
  ),
}));
for (let i = 0; i < targets.length; i += 3) {
  const input = {
    contract: "swiss-upcoming-cycles/1",
    solverVersion: "upcoming-cycles-1",
    sourceId: engine.sourceId,
    from: "2026-10-13T12:00:00.000Z",
    to: "2027-10-13T12:00:00.000Z",
    bodies: [
      "moon",
      "sun",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
    ],
    aspects: ["conjunction", "sextile", "square", "trine", "quincunx", "opposition"],
    targets: targets.slice(i, i + 3),
    duration: "all",
  };
  const start = performance.now(),
    actual = calculateUpcoming(input, engine),
    durationMs = performance.now() - start,
    issues = [],
    residuals = [];
  for (const w of actual.windows) {
    const target = input.targets.find((t) => t.name === w.natalPoint),
      angle = {
        conjunction: 0,
        sextile: 60,
        square: 90,
        trine: 120,
        quincunx: 150,
        opposition: 180,
      }[w.aspect],
      level = target.longitudes[1] + (w.branch === "plus" ? angle : -angle),
      orb =
        (w.aspect === "quincunx" ? 1.2 : 2.5) *
        (w.transitBody === "moon"
          ? 0.6
          : ["sun", "mercury", "venus"].includes(w.transitBody)
            ? 1
            : 1.2);
    for (const at of w.exactAt) {
      const error = Math.abs(
        norm(referencePosition(w.transitBody, Date.parse(at)).longitude - level + 180) - 180,
      );
      residuals.push(error);
      if (error > 0.001) issues.push("exact longitude " + w.id);
    }
    for (const at of [w.start, w.end].filter(Boolean)) {
      const error = Math.abs(
        Math.abs(
          norm(referencePosition(w.transitBody, Date.parse(at)).longitude - level + 180) - 180,
        ) - orb,
      );
      residuals.push(error);
      if (error > 0.001) issues.push("orb edge " + w.id);
    }
  }
  if (
    durationMs >= 4000 ||
    actual.evaluations > 120000 ||
    Buffer.byteLength(JSON.stringify(actual)) > 128 * 1024
  )
    issues.push("resource limits");
  capture(
    "upcoming-full-year-" + i / 3,
    input,
    actual,
    { independentNativeET: true, maximumResidualDegrees: Math.max(0, ...residuals) },
    issues,
    durationMs,
  );
}
const report = {
  version: 1,
  source: engine.metadata,
  reference: "independent-native-et-hourly-astronomy-1",
  allowedDeltaSeconds: 60,
  allowedLongitudeDeltaDegrees: 0.001,
  passed: results.length === 27 && results.every((r) => r.pass),
  results,
  sourceHashes: Object.fromEntries(
    paths.map((p) => [
      p,
      createHash("sha256")
        .update(readFileSync(new URL(p, import.meta.url)))
        .digest("hex"),
    ]),
  ),
};
writeFileSync(join(out, "qualification.json"), JSON.stringify(report, null, 2) + "\n");
if (!report.passed) process.exitCode = 1;
