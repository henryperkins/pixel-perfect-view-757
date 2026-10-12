// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { createEngine } from "../src/engine.mjs";
import { solveEpisodes } from "../src/episodes.mjs";
import { enumerateReference, referencePosition } from "./reference.mjs";
const DAY = 86400000,
  norm = (x) => ((x % 360) + 360) % 360;
const out = resolve(process.argv[2] || "dist/qualification");
mkdirSync(out, { recursive: true });
const engine = createEngine(),
  casesFile = join(out, "cases.json");
let cases;
if (existsSync(casesFile)) cases = JSON.parse(readFileSync(casesFile));
else {
  cases = [];
  for (const body of ["jupiter", "saturn", "uranus", "neptune", "pluto"]) {
    const days = [];
    for (
      let at = Date.parse("2026-01-01T12:00:00Z");
      at < Date.parse("2027-01-01T12:00:00Z");
      at += DAY
    )
      days.push({ at, ...referencePosition(body, at) });
    const direct = days.reduce((a, b) => (a.speed > b.speed ? a : b)),
      retro = days.reduce((a, b) => (a.speed < b.speed ? a : b));
    let i = days.findIndex((p, i) => i && days[i - 1].speed > 0 && p.speed < 0),
      a = days[i - 1].at,
      b = days[i].at;
    while (b - a > 100) {
      const m = Math.floor((a + b) / 2);
      if (referencePosition(body, m).speed > 0) a = m;
      else b = m;
    }
    const station = Math.round((a + b) / 2),
      stationLongitude = referencePosition(body, station).longitude;
    for (const [kind, at, aspect, longitude] of [
      [
        body === "neptune" || body === "pluto" ? "direct-five" : "single-direct",
        direct.at,
        "conjunction",
        direct.longitude,
      ],
      ["repeat-minus-branch", retro.at, "quincunx", norm(retro.longitude + 150)],
      ["station-near", station, "conjunction", norm(stationLongitude - 0.002)],
    ])
      cases.push({
        id: `${body}-${kind}`,
        kind,
        request: {
          contract: "swiss-transit-episode/1",
          solverVersion: "transit-episode-1",
          sourceId: engine.sourceId,
          transitBody: body,
          aspect,
          targets: [-2, 0, 2].map((offsetMinutes, i) => ({
            offsetMinutes,
            longitude: norm(longitude + (i - 1) * 0.00001),
          })),
          referenceAt: new Date(at).toISOString(),
          maxOrbDegrees: body === "jupiter" || body === "saturn" ? 3 : 2,
        },
      });
  }
  writeFileSync(casesFile, JSON.stringify(cases, null, 2) + "\n");
}
const results = [];
for (const item of cases) {
  const issues = [],
    deltas = [];
  try {
    let evaluations = 0;
    const measured = {
      ...engine,
      position: (...args) => {
        evaluations++;
        return engine.position(...args);
      },
    };
    const start = performance.now(),
      scan = solveEpisodes(item.request, measured),
      durationMs = performance.now() - start;
    const reference = enumerateReference(item.request, referencePosition, {
      from: Date.parse(scan.coverage.from),
      to: Date.parse(scan.coverage.to),
    });
    const compareTime = (actual, expected, label) => {
      if (actual === null || expected === null) {
        if (actual !== expected) issues.push(`${label}: closure differs`);
        return;
      }
      const delta = Math.abs(Date.parse(actual) - expected) / 1000;
      deltas.push({ label, seconds: delta });
      if (delta > 300) issues.push(`${label}: ${delta}s`);
    };
    const compareCount = (actual, expected, label) => {
      if (actual.length !== expected.length)
        issues.push(`${label}: ${actual.length} != ${expected.length}`);
    };
    compareCount(scan.samples[1].stations, reference.stations, "stations");
    scan.samples[1].stations.forEach((s, i) => {
      const r = reference.stations[i];
      if (!r) return;
      compareTime(s.at, r.at, `station ${i}`);
      if (s.directionBefore !== r.directionBefore || s.directionAfter !== r.directionAfter)
        issues.push(`station ${i}: direction`);
    });
    scan.samples.forEach((s, si) => {
      const r = reference.samples[si];
      if (
        s.limit ||
        s.components.some((c) => !c.complete) ||
        r.components.some((c) => !c.complete) ||
        r.ambiguous
      )
        issues.push(`sample ${si}: incomplete or ambiguous`);
      for (const collection of ["contacts", "windows", "components"])
        compareCount(s[collection], r[collection], `${si}/${collection}`);
      s.contacts.forEach((c, i) => {
        const expected = r.contacts[i];
        if (!expected) return;
        compareTime(c.at, expected.at, `${si}/contact ${i}`);
        if (
          c.direction !== expected.direction ||
          c.branch !== expected.branch ||
          c.targetTurn !== expected.turn
        )
          issues.push(`${si}/contact ${i}: identity`);
      });
      s.windows.forEach((w, i) => {
        const expected = r.windows[i];
        if (!expected) return;
        compareTime(w.ingress?.at ?? null, expected.ingress, `${si}/ingress ${i}`);
        compareTime(w.egress?.at ?? null, expected.egress, `${si}/egress ${i}`);
        if (w.contactIds.length !== expected.contacts.length)
          issues.push(`${si}/window ${i}: membership`);
      });
      s.components.forEach((c, i) => {
        const expected = r.components[i];
        if (
          expected &&
          (c.complete !== expected.complete || c.contactIds.length !== expected.contacts.length)
        )
          issues.push(`${si}/component ${i}: closure or membership`);
      });
      if (item.kind === "single-direct" && s.contacts.length !== 1)
        issues.push(`${si}: single fixture was not single`);
      if (item.kind === "direct-five" && s.contacts.length !== 5)
        issues.push(`${si}: five-contact fixture was not five`);
      if (item.kind === "repeat-minus-branch" && s.contacts.length < 3)
        issues.push(`${si}: repeat fixture has fewer than 3 contacts`);
    });
    if (durationMs >= 4000 || evaluations > 20000) issues.push("calculation limits");
    const { raw, ...referenceEvents } = reference;
    writeFileSync(
      join(out, `${item.id}.track.json.gz`),
      gzipSync(JSON.stringify(raw), { level: 9 }),
    );
    writeFileSync(
      join(out, `${item.id}.json`),
      JSON.stringify(
        { request: item.request, scan, reference: referenceEvents, deltas, issues },
        null,
        2,
      ) + "\n",
    );
    const result = {
      id: item.id,
      pass: issues.length === 0,
      durationMs,
      evaluations,
      trackPoints: raw.length,
      contacts: scan.samples[1].contacts.length,
      stations: reference.stations.length,
      windows: scan.samples[1].windows.length,
      maxDeltaSeconds: Math.max(0, ...deltas.map((d) => d.seconds)),
      issues,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    const result = { id: item.id, pass: false, error: error.message };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}
const report = {
  version: 1,
  syntheticAnchors: true,
  source: engine.metadata,
  tool: "independent-dense-swiss-et-1",
  referenceStepSeconds: 3600,
  allowedDeltaSeconds: 300,
  passed: results.every((r) => r.pass) && results.length >= 15,
  results,
  sourceHashes: Object.fromEntries(
    [
      "../src/engine.mjs",
      "../src/track.mjs",
      "../src/episodes.mjs",
      "./reference.mjs",
      "./qualify.mjs",
    ].map((path) => [
      path,
      createHash("sha256")
        .update(readFileSync(new URL(path, import.meta.url)))
        .digest("hex"),
    ]),
  ),
};
writeFileSync(join(out, "qualification.json"), JSON.stringify(report, null, 2) + "\n");
if (!report.passed) process.exitCode = 1;
