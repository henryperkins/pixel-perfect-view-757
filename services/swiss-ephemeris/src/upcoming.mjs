// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { ASPECTS, DAY, utcInstant, time } from "./contract.mjs";
import { makeTrack } from "./track.mjs";
import { sampleScan } from "./episodes.mjs";
export const UPCOMING_SOLVER_VERSION = "upcoming-cycles-1";
const BODIES = [
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
];
const TARGETS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "ascendant",
  "midheaven",
];
const orb = (body, aspect) =>
  (aspect === "quincunx" ? 1.2 : 2.5) *
  (body === "moon" ? 0.6 : ["sun", "mercury", "venus"].includes(body) ? 1 : 1.2);
const canonical = (at) =>
  at ? new Date(Math.round(Date.parse(at) / 1000) * 1000).toISOString() : null;
const bucket = (days) =>
  days === null ? "unknown" : days < 7 ? "short" : days <= 30 ? "medium" : "long";
const meanRange = (values) => [
  new Date(Math.floor(Math.min(...values) / 1000) * 1000).toISOString(),
  new Date(Math.ceil(Math.max(...values) / 1000) * 1000).toISOString(),
];
const windowSignature = (scan, w) => {
  const cs = w.contactIds.map((id) => scan.contacts.find((c) => c.id === id));
  return JSON.stringify([cs[0].branch, cs[0].targetTurn, cs.map((c) => c.direction)]);
};
/** Stateless bounded future geometry; saved natal anchors are supplied by the app. */
export function calculateUpcoming(
  input,
  engine,
  { maxDurationMs = 4000, now = () => performance.now() } = {},
) {
  const keys = [
    "contract",
    "solverVersion",
    "sourceId",
    "from",
    "to",
    "bodies",
    "aspects",
    "targets",
    "duration",
  ];
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== keys.length ||
    Object.keys(input).some((k) => !keys.includes(k)) ||
    input.contract !== "swiss-upcoming-cycles/1" ||
    input.solverVersion !== UPCOMING_SOLVER_VERSION ||
    !["all", "short", "medium", "long", "unknown"].includes(input.duration)
  )
    throw Error("invalid_request");
  if (input.sourceId !== engine.sourceId) throw Error("unqualified_source");
  const validList = (list, allowed) =>
    Array.isArray(list) &&
    list.length > 0 &&
    list.length <= allowed.length &&
    new Set(list).size === list.length &&
    list.every((x) => allowed.includes(x));
  if (
    !validList(input.bodies, BODIES) ||
    !validList(input.aspects, Object.keys(ASPECTS)) ||
    !Array.isArray(input.targets) ||
    input.targets.length < 1 ||
    input.targets.length > 3 ||
    new Set(input.targets.map((t) => t?.name)).size !== input.targets.length
  )
    throw Error("invalid_request");
  for (const t of input.targets) {
    if (
      !t ||
      typeof t !== "object" ||
      Object.keys(t).length !== 3 ||
      !TARGETS.includes(t.name) ||
      !Array.isArray(t.offsets) ||
      !Array.isArray(t.longitudes) ||
      t.offsets.length !== 3 ||
      t.longitudes.length !== 3 ||
      !t.longitudes.every((n) => Number.isFinite(n) && n >= 0 && n < 360) ||
      ![2, 15, 60].some((n) => t.offsets.every((x, i) => x === [-n, 0, n][i]))
    )
      throw Error("invalid_request");
  }
  const from = utcInstant(input.from),
    to = utcInstant(input.to);
  if (from >= to || to - from > 365 * DAY) throw Error("invalid_request");
  if (from < engine.coverage.from || to > engine.coverage.to) throw Error("source_range");
  const started = now(),
    check = () => {
      if (now() - started >= Math.min(4000, maxDurationMs)) throw Error("time_limit");
    };
  let evaluationCount = 0,
    incomplete = 0;
  const windows = [];
  for (const body of input.bodies) {
    check();
    const padding =
      (body === "moon" ? 3 : ["sun", "mercury", "venus", "mars"].includes(body) ? 60 : 180) * DAY;
    const left = Math.max(engine.coverage.from, from - padding),
      right = Math.min(engine.coverage.to, to + padding);
    const track = makeTrack(engine, body, {
      now,
      maxDurationMs: Math.max(1, Math.min(4000, maxDurationMs) - (now() - started)),
      maxEvaluations: 120000 - evaluationCount,
      evaluationCeiling: 120000,
      speedCeiling: 40,
      fastRefine: true,
      rootTolerance: 1e-6,
    });
    const geometry = track.scan(left, right);
    for (const target of input.targets)
      for (const aspect of input.aspects) {
        check();
        const request = { aspect, maxOrbDegrees: orb(body, aspect) };
        const scans = target.longitudes.map(
          (longitude, i) =>
            sampleScan(
              request,
              {
                longitude: longitude + 360 * Math.round((target.longitudes[1] - longitude) / 360),
                offsetMinutes: target.offsets[i],
              },
              track,
              geometry,
              { maxContacts: 100, maxWindows: 100 },
            ).sample,
        );
        const nominal = scans[1];
        for (const w of nominal.windows) {
          const contacts = w.contactIds.map((id) => nominal.contacts.find((c) => c.id === id)),
            first = contacts[0];
          const signature = windowSignature(nominal, w),
            group = nominal.windows.filter(
              (other) => windowSignature(nominal, other) === signature,
            ),
            ordinal = group.indexOf(w);
          const matches = scans.map((scan) => {
            const candidates = scan.windows.filter(
              (other) => windowSignature(scan, other) === signature,
            );
            return candidates.length === group.length ? candidates[ordinal] : undefined;
          });
          if (matches.some((m) => !m)) {
            incomplete++;
            continue;
          }
          const start = canonical(w.ingress?.at),
            end = canonical(w.egress?.at),
            exactAt = contacts.map((c) => canonical(c.at));
          const startRange = matches.every((m) => m.ingress)
              ? meanRange(matches.map((m) => time(m.ingress)))
              : null,
            endRange = matches.every((m) => m.egress)
              ? meanRange(matches.map((m) => time(m.egress)))
              : null;
          const exactRanges = contacts.map((_, i) =>
            meanRange(
              matches.map((m, s) => time(scans[s].contacts.find((c) => c.id === m.contactIds[i]))),
            ),
          );
          if (
            (startRange && Date.parse(startRange[0]) >= to) ||
            (endRange && Date.parse(endRange[1]) <= from)
          )
            continue;
          const durationDays = start && end ? (Date.parse(end) - Date.parse(start)) / DAY : null,
            duration = bucket(durationDays);
          if (input.duration !== "all" && input.duration !== duration) continue;
          const complete = !!start && !!end && !!startRange && !!endRange;
          if (!complete) incomplete++;
          const id =
            "cycle:" +
            createHash("sha256")
              .update(
                JSON.stringify([
                  UPCOMING_SOLVER_VERSION,
                  engine.sourceId,
                  body,
                  target.name,
                  aspect,
                  first.branch,
                  target.longitudes,
                  start?.slice(0, 10) ?? exactAt[0].slice(0, 10),
                ]),
              )
              .digest("hex")
              .slice(0, 32);
          const confidence = complete
            ? [...exactRanges, startRange, endRange].every(
                ([a, b]) => Date.parse(b) - Date.parse(a) <= 60000,
              )
              ? "exact"
              : "range"
            : "incomplete";
          const phase =
            startRange && Date.parse(startRange[0]) > from
              ? "upcoming"
              : startRange &&
                  endRange &&
                  Date.parse(startRange[1]) <= from &&
                  Date.parse(endRange[0]) > from
                ? "active"
                : "uncertain";
          windows.push({
            id,
            transitBody: body,
            natalPoint: target.name,
            aspect,
            branch: first.branch,
            start,
            end,
            startRange,
            endRange,
            exactAt,
            exactRanges,
            phase,
            durationDays,
            duration,
            confidence,
            complete,
            sourceId: engine.sourceId,
          });
        }
      }
    track.check();
    evaluationCount += track.evaluations();
    if (evaluationCount > 120000) throw Error("evaluation_limit");
  }
  const dedup = [...new Map(windows.map((w) => [w.id, w])).values()].sort(
    (a, b) =>
      Date.parse(a.start ?? a.exactAt[0]) - Date.parse(b.start ?? b.exactAt[0]) ||
      a.id.localeCompare(b.id),
  );
  const active = dedup.filter((w) => w.phase === "active"),
    upcoming = dedup.filter((w) => w.phase === "upcoming"),
    uncertain = dedup.filter((w) => w.phase === "uncertain");
  const totalMatched = dedup.length,
    truncated = active.length > 40 || upcoming.length > 40 || uncertain.length > 20;
  check();
  return {
    contract: "swiss-upcoming-cycles/1",
    solverVersion: UPCOMING_SOLVER_VERSION,
    status: incomplete || truncated ? "partial" : "complete",
    sourceId: engine.sourceId,
    source: engine.source,
    range: { from: input.from, to: input.to, boundary: "half-open" },
    scope: {
      bodies: input.bodies,
      aspects: input.aspects,
      targets: input.targets.map((t) => t.name),
      duration: input.duration,
    },
    windows: [...active.slice(0, 40), ...upcoming.slice(0, 40), ...uncertain.slice(0, 20)],
    activeMatched: active.length,
    upcomingMatched: upcoming.length,
    uncertainMatched: uncertain.length,
    totalMatched,
    truncated,
    incompleteWindows: incomplete,
    evaluations: evaluationCount,
  };
}
