import { z } from "zod";
import { createHash } from "node:crypto";
import { swissCalculation, verifySwissSource } from "./swiss-calculations.server";
import { transitEpisodePolicy } from "./transit-episodes.server";
import { STORY_TARGETS, type TransitAnchorManifest } from "./transit-anchors";
import { DOMAIN_BY_TARGET } from "./cycles";
export const UPCOMING_BODIES = [
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
] as const;
export const UPCOMING_ASPECTS = [
  "conjunction",
  "sextile",
  "square",
  "trine",
  "quincunx",
  "opposition",
] as const;
export const DURATION_FILTERS = ["all", "short", "medium", "long", "unknown"] as const;
export const UPCOMING_SOLVER_VERSION = "upcoming-cycles-2";
export type DurationFilter = (typeof DURATION_FILTERS)[number];
const at = z.string().datetime({ precision: 3 }),
  range = z.tuple([at, at]);
const windowSchema = z
  .object({
    id: z.string().regex(/^cycle:[a-f0-9]{32}$/),
    transitBody: z.enum(UPCOMING_BODIES),
    natalPoint: z.enum(STORY_TARGETS),
    aspect: z.enum(UPCOMING_ASPECTS),
    branch: z.enum(["plus", "minus"]),
    start: at.nullable(),
    end: at.nullable(),
    startRange: range.nullable(),
    endRange: range.nullable(),
    exactAt: z.array(at).min(1).max(100),
    exactRanges: z.array(range).min(1).max(100),
    phase: z.enum(["active", "upcoming", "uncertain"]),
    durationDays: z.number().finite().min(0).nullable(),
    duration: z.enum(["short", "medium", "long", "unknown"]),
    confidence: z.enum(["exact", "range", "incomplete"]),
    complete: z.boolean(),
    sourceId: z.string().min(1).max(160),
  })
  .strict();
export type UpcomingWindow = z.infer<typeof windowSchema>;
interface Request {
  contract: "swiss-upcoming-cycles/1";
  solverVersion: typeof UPCOMING_SOLVER_VERSION;
  sourceId: string;
  from: string;
  to: string;
  bodies: typeof UPCOMING_BODIES;
  aspects: typeof UPCOMING_ASPECTS;
  targets: { name: (typeof STORY_TARGETS)[number]; offsets: number[]; longitudes: number[] }[];
  duration: DurationFilter;
}
export function parseUpcoming(raw: unknown, input: Request) {
  const r = z
    .object({
      contract: z.literal(input.contract),
      solverVersion: z.literal(input.solverVersion),
      status: z.enum(["partial", "complete"]),
      sourceId: z.literal(input.sourceId),
      source: z.unknown(),
      range: z
        .object({
          from: z.literal(input.from),
          to: z.literal(input.to),
          boundary: z.literal("half-open"),
        })
        .strict(),
      scope: z
        .object({
          bodies: z.array(z.enum(UPCOMING_BODIES)),
          aspects: z.array(z.enum(UPCOMING_ASPECTS)),
          targets: z.array(z.enum(STORY_TARGETS)),
          duration: z.literal(input.duration),
        })
        .strict(),
      windows: z.array(windowSchema).max(100),
      activeMatched: z.number().int().min(0),
      upcomingMatched: z.number().int().min(0),
      uncertainMatched: z.number().int().min(0),
      totalMatched: z.number().int().min(0),
      truncated: z.boolean(),
      incompleteWindows: z.number().int().min(0),
      evaluations: z.number().int().min(0).max(120000),
    })
    .strict()
    .parse(raw);
  verifySwissSource(r.source, input.sourceId);
  if (
    JSON.stringify(r.scope.bodies) !== JSON.stringify(input.bodies) ||
    JSON.stringify(r.scope.aspects) !== JSON.stringify(input.aspects) ||
    JSON.stringify(r.scope.targets) !== JSON.stringify(input.targets.map((t) => t.name)) ||
    r.totalMatched !== r.activeMatched + r.upcomingMatched + r.uncertainMatched ||
    r.status !== (r.truncated || r.incompleteWindows ? "partial" : "complete")
  )
    throw Error("Incomplete calculation scope.");
  const ids = new Set<string>(),
    counts = { active: 0, upcoming: 0, uncertain: 0 };
  for (const w of r.windows) {
    if (
      ids.has(w.id) ||
      w.sourceId !== input.sourceId ||
      !r.scope.targets.includes(w.natalPoint) ||
      !r.scope.bodies.includes(w.transitBody) ||
      !r.scope.aspects.includes(w.aspect)
    )
      throw Error("Invalid window identity.");
    ids.add(w.id);
    counts[w.phase]++;
    const anchor = input.targets.find((t) => t.name === w.natalPoint)!;
    const expected =
      "cycle:" +
      createHash("sha256")
        .update(
          JSON.stringify([
            input.solverVersion,
            input.sourceId,
            w.transitBody,
            w.natalPoint,
            w.aspect,
            w.branch,
            anchor.longitudes,
            w.start?.slice(0, 10) ?? w.exactAt[0]!.slice(0, 10),
          ]),
        )
        .digest("hex")
        .slice(0, 32);
    if (w.id !== expected) throw Error("Window anchor binding changed.");
    if (w.exactAt.length !== w.exactRanges.length) throw Error("Missing birth ranges.");
    const inside = (instant: string, span: [string, string]) =>
      Date.parse(span[0]) <= Date.parse(instant) && Date.parse(instant) <= Date.parse(span[1]);
    for (const [instant, span] of [
      [w.start, w.startRange],
      [w.end, w.endRange],
      ...w.exactAt.map((instant, i) => [instant, w.exactRanges[i]]),
    ] as [string | null, [string, string] | null][]) {
      if (
        span &&
        (Date.parse(span[0]) > Date.parse(span[1]) || instant === null || !inside(instant, span))
      )
        throw Error("Invalid birth range.");
    }
    if (
      (w.startRange && Date.parse(w.startRange[0]) >= Date.parse(input.to)) ||
      (w.endRange && Date.parse(w.endRange[1]) <= Date.parse(input.from))
    )
      throw Error("Window outside query.");
    if (
      (w.start && w.end && Date.parse(w.start) >= Date.parse(w.end)) ||
      w.exactAt.some(
        (v, i) =>
          (i > 0 && Date.parse(v) <= Date.parse(w.exactAt[i - 1]!)) ||
          (w.start !== null && Date.parse(v) < Date.parse(w.start)) ||
          (w.end !== null && Date.parse(v) > Date.parse(w.end)),
      )
    )
      throw Error("Invalid window chronology.");
    const days = w.start && w.end ? (Date.parse(w.end) - Date.parse(w.start)) / 86400000 : null,
      bucket = days === null ? "unknown" : days < 7 ? "short" : days <= 30 ? "medium" : "long";
    if (
      w.duration !== bucket ||
      (days === null) !== (w.durationDays === null) ||
      (days !== null && Math.abs(days - w.durationDays!) > 1 / 86400) ||
      (input.duration !== "all" && w.duration !== input.duration)
    )
      throw Error("Invalid duration.");
    const complete = !!w.start && !!w.end && !!w.startRange && !!w.endRange;
    const confidence = complete
      ? [...w.exactRanges, w.startRange!, w.endRange!].every(
          ([a, b]) => Date.parse(b) - Date.parse(a) <= 60000,
        )
        ? "exact"
        : "range"
      : "incomplete";
    const phase =
      w.startRange && Date.parse(w.startRange[0]) > Date.parse(input.from)
        ? "upcoming"
        : w.startRange &&
            w.endRange &&
            Date.parse(w.startRange[1]) <= Date.parse(input.from) &&
            Date.parse(w.endRange[0]) > Date.parse(input.from)
          ? "active"
          : "uncertain";
    if (
      w.complete !== complete ||
      w.confidence !== confidence ||
      w.phase !== phase ||
      (["conjunction", "opposition"].includes(w.aspect) && w.branch !== "plus")
    )
      throw Error("Unproven timing.");
  }
  if (
    counts.active > r.activeMatched ||
    counts.upcoming > r.upcomingMatched ||
    counts.uncertain > r.uncertainMatched ||
    (!r.truncated && r.windows.length !== r.totalMatched)
  )
    throw Error("Invalid window counts.");
  return r;
}
export type UpcomingResult =
  | { status: "unavailable"; reason: string }
  | {
      status: "available";
      windows: UpcomingWindow[];
      calculationStatus: "complete" | "partial";
      source: string;
      sourceId: string;
      from: string;
      to: string;
      totalMatched: number;
      truncated: boolean;
      incompleteWindows: number;
      missingTargets: string[];
    };
/** Up to three disjoint batches, each with three targets and one six-second request. */
export async function getUpcomingFromAnchors(
  anchors: TransitAnchorManifest | null,
  from: string,
  to: string,
  domain: string,
  duration: DurationFilter,
  assertCurrent: () => Promise<void> = async () => {},
): Promise<UpcomingResult> {
  if (!anchors) return { status: "unavailable", reason: "anchors_unavailable" };
  if (anchors.status !== "screened") return { status: "unavailable", reason: anchors.reason };
  const policy = transitEpisodePolicy();
  if (!policy.enabled) return { status: "unavailable", reason: "not_configured" };
  try {
    for (const source of anchors.sources) verifySwissSource(source, policy.sourceId);
  } catch {
    return { status: "unavailable", reason: "unqualified_anchors" };
  }
  const selected = anchors.anchors.filter(
    (a) => domain === "all" || DOMAIN_BY_TARGET[a.target] === domain,
  );
  if (selected.length === 0)
    return {
      status: "available",
      windows: [],
      calculationStatus: "complete",
      source: "Swiss Ephemeris",
      sourceId: policy.sourceId,
      from,
      to,
      totalMatched: 0,
      truncated: false,
      incompleteWindows: 0,
      missingTargets: [],
    };
  const rows: UpcomingWindow[] = [],
    missingTargets: string[] = [];
  let totalMatched = 0,
    truncated = false,
    incompleteWindows = 0,
    partial = false,
    available = 0,
    lastReason = "transport";
  const deadline = Date.now() + 18000;
  for (let i = 0; i < selected.length; i += 3) {
    await assertCurrent();
    const targets = selected.slice(i, i + 3).map((a) => ({
      name: a.target,
      offsets: anchors.sampleOffsetsMinutes,
      longitudes: a.longitudes,
    }));
    const input: Request = {
      contract: "swiss-upcoming-cycles/1",
      solverVersion: UPCOMING_SOLVER_VERSION,
      sourceId: policy.sourceId,
      from,
      to,
      bodies: UPCOMING_BODIES,
      aspects: UPCOMING_ASPECTS,
      targets,
      duration,
    };
    const result =
      Date.now() >= deadline
        ? { status: "unavailable" as const, reason: "timeout" }
        : await swissCalculation(
            "/v1/upcoming-cycles",
            input as unknown as Record<string, unknown>,
            (raw) => parseUpcoming(raw, input),
            { deadlineMs: deadline - Date.now() },
          );
    await assertCurrent();
    if (result.status === "unavailable") {
      lastReason = result.reason;
      missingTargets.push(...targets.map((t) => t.name));
      partial = true;
      continue;
    }
    available++;
    rows.push(...result.value.windows);
    totalMatched += result.value.totalMatched;
    truncated ||= result.value.truncated;
    incompleteWindows += result.value.incompleteWindows;
    partial ||= result.value.status === "partial";
  }
  if (available === 0) return { status: "unavailable", reason: lastReason };
  const windows = [...new Map(rows.map((w) => [w.id, w])).values()].sort(
    (a, b) =>
      Date.parse(a.start ?? a.exactAt[0]!) - Date.parse(b.start ?? b.exactAt[0]!) ||
      a.id.localeCompare(b.id),
  );
  return {
    status: "available",
    windows,
    calculationStatus: partial ? "partial" : "complete",
    source: "Swiss Ephemeris",
    sourceId: policy.sourceId,
    from,
    to,
    totalMatched,
    truncated,
    incompleteWindows,
    missingTargets,
  };
}
