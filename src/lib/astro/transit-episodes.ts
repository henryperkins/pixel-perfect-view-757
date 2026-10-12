import { z } from "zod";
import { positionSourceSchema, STORY_BODIES, type PositionSource } from "./transit-anchors";
export const TRANSIT_EPISODE_CONTRACT = "swiss-transit-episode/1";
export const TRANSIT_EPISODE_SOLVER_VERSION = "transit-episode-1";
const id = z.string().min(1).max(160);
const instant = z
  .string()
  .datetime()
  .max(24)
  .refine((s) => Number.isFinite(Date.parse(s)));
const finite = z.number().finite();
const motion = z.enum(["direct", "retrograde"]);
const triple = <T extends z.ZodTypeAny>(s: T) => z.tuple([s, s, s]);
export const transitEpisodeRequestSchema = z
  .object({
    contract: z.literal(TRANSIT_EPISODE_CONTRACT),
    solverVersion: z.literal(TRANSIT_EPISODE_SOLVER_VERSION),
    sourceId: id,
    transitBody: z.enum(STORY_BODIES),
    aspect: z.enum(["conjunction", "sextile", "square", "trine", "quincunx", "opposition"]),
    targets: triple(
      z
        .object({
          offsetMinutes: z.number().int().min(-60).max(60),
          longitude: finite.min(0).lt(360),
        })
        .strict(),
    ),
    referenceAt: instant,
    maxOrbDegrees: finite.positive().max(3),
  })
  .strict()
  .refine((v) =>
    [2, 15, 60].some((b) => v.targets.every((t, i) => t.offsetMinutes === [-b, 0, b][i])),
  );
export type TransitEpisodeRequest = z.infer<typeof transitEpisodeRequestSchema>;
const point = z
  .object({
    at: instant,
    unwrappedLongitude: finite.min(-100000).max(100000),
    speed: finite.min(-10).max(10),
  })
  .strict();
const refined = point.extend({ bracket: z.tuple([point, point]) }).strict();
const contact = refined
  .extend({
    id,
    residualDeg: finite.min(0).max(0.000001),
    direction: motion,
    branch: z.enum(["plus", "minus"]),
    targetTurn: z.number().int().min(-280).max(280),
    legId: id,
    windowId: id,
  })
  .strict();
const station = refined.extend({ id, directionBefore: motion, directionAfter: motion }).strict();
const leg = z
  .object({
    id,
    start: point,
    end: point,
    direction: motion,
    startStationId: id.nullable(),
    endStationId: id.nullable(),
  })
  .strict();
const window = z
  .object({
    id,
    ingress: refined.nullable(),
    egress: refined.nullable(),
    contactIds: z.array(id).min(1).max(16),
  })
  .strict();
const limit = z.enum([
  "scan_limit",
  "evaluation_limit",
  "time_limit",
  "output_limit",
  "source_range",
]);
const reason = z.enum([
  "scan_limit",
  "evaluation_limit",
  "time_limit",
  "output_limit",
  "source_range",
  "window_unclosed",
  "ambiguous_station_contact",
]);
const component = z
  .object({
    id,
    contactIds: z.array(id).min(1).max(16),
    leftClosureLegId: id.nullable(),
    rightClosureLegId: id.nullable(),
    complete: z.boolean(),
    reason: reason.nullable(),
  })
  .strict();
const sample = z
  .object({
    offsetMinutes: z.number().int(),
    natalLongitude: finite.min(0).lt(360),
    limit: limit.nullable(),
    contacts: z.array(contact).max(16),
    stations: z.array(station).max(40),
    legs: z.array(leg).min(1).max(41),
    windows: z.array(window).max(32),
    components: z.array(component).max(16),
  })
  .strict();
export const transitEpisodeScanSchema = z
  .object({
    contract: z.literal(TRANSIT_EPISODE_CONTRACT),
    solverVersion: z.literal(TRANSIT_EPISODE_SOLVER_VERSION),
    sourceId: id,
    source: positionSourceSchema,
    request: transitEpisodeRequestSchema,
    coverage: z.object({ from: instant, to: instant }).strict(),
    tolerance: z
      .object({
        bracketSeconds: finite.positive().max(60),
        rootResidualDeg: finite.positive().max(0.000001),
      })
      .strict(),
    reference: point,
    samples: triple(sample),
  })
  .strict();
export type Motion = z.infer<typeof motion>;
export type TrackPoint = z.infer<typeof point>;
export type RefinedPoint = z.infer<typeof refined>;
export type TransitContact = z.infer<typeof contact>;
export type TransitStation = z.infer<typeof station>;
export type TransitLeg = z.infer<typeof leg>;
export type TransitWindow = z.infer<typeof window>;
export type TransitComponent = z.infer<typeof component>;
export type TransitSampleScan = z.infer<typeof sample>;
export type TransitEpisodeScan = z.infer<typeof transitEpisodeScanSchema>;
export type TransitEpisodeScanResult =
  | { status: "available"; scan: TransitEpisodeScan }
  | {
      status: "unavailable";
      reason:
        "not_configured" | "timeout" | "transport" | "unqualified_source" | "invalid_response";
    };
export type StoryOmissionReason =
  | "unsupported_primary"
  | "no_primary_copy"
  | "no_catalogue"
  | "no_anchor"
  | "unqualified_source"
  | "service_unavailable"
  | "invalid_scan"
  | "incomplete_scan"
  | "ambiguous_station_contact"
  | "no_current_pass"
  | "source_disagreement"
  | "birth_window_disagreement";
/** Strict wire boundary. Geometric proof is validated separately before selection. */
export function parseTransitEpisodeScan(
  value: unknown,
  expected: TransitEpisodeRequest,
): TransitEpisodeScan {
  const s = transitEpisodeScanSchema.parse(value),
    r = transitEpisodeRequestSchema.parse(expected);
  if (
    s.sourceId !== r.sourceId ||
    JSON.stringify(s.request) !== JSON.stringify(r) ||
    s.reference.at !== r.referenceAt ||
    !s.samples.every(
      (v, i) =>
        v.offsetMinutes === r.targets[i]!.offsetMinutes &&
        v.natalLongitude === r.targets[i]!.longitude,
    )
  )
    throw new Error("Mismatched episode response");
  return s;
}
export type EventTimingSource = {
  sourceId: string;
  solverVersion: typeof TRANSIT_EPISODE_SOLVER_VERSION;
  source: PositionSource;
};

import {
  validateEpisodeProof,
  EpisodeProofError,
  millis,
  targetLongitude,
} from "./transit-episode-proof";
import {
  validateTransitAnchors,
  samePositionSource,
  type TransitAnchorManifest,
  type Triple,
} from "./transit-anchors";
import { transitOrb, type CycleInstance } from "./cycles";
import { localDayString, localNoon, daysToLocalDate, validTimeZone } from "../local-day";
export type TransitChapter = "single" | "opening" | "return" | "closing" | "between";
export interface StoryDateReference {
  eventId: string;
  kind: "exact-contact";
  civilDay: string | null;
  monthYear: string | null;
}
export interface StoryTimingOverlay {
  cycleKey: string;
  phase: "approaching" | "exact" | "separating" | "between" | "uncertain";
  centralExactAt: string | null;
  qualifiedExactDay: string | null;
  daysToExact: number | null;
  centralIngressAt: string;
  centralEgressAt: string;
  windowPosition: number | null;
}
export interface ValidatedTransitEpisode {
  scan: TransitEpisodeScan;
  anchor: TransitAnchorManifest;
  anchorFingerprint: string;
  cycleKey: string;
  componentIds: Triple<string>;
  episodeIdentity: string;
  referenceAt: string;
  timezone: string;
  day: string;
  passTotal: number;
  passIndex: number | null;
  chapter: TransitChapter;
  approvedDates: StoryDateReference[];
  contactRanges: {
    eventId: string;
    centralAt: string;
    earliestAt: string;
    latestAt: string;
    civilDays: Triple<string>;
  }[];
  timingOverlay: StoryTimingOverlay;
}
export type DailyTransitCalculation =
  | { status: "qualified"; evidence: ValidatedTransitEpisode; timingOverlay: StoryTimingOverlay }
  | { status: "omitted"; reason: StoryOmissionReason };
export function validateTransitEpisodeScan(
  value: unknown,
  expected: TransitEpisodeRequest,
): TransitEpisodeScan {
  const scan = parseTransitEpisodeScan(value, expected);
  validateEpisodeProof(scan);
  return scan;
}
export function resolveDailyTransitCalculation(
  value: unknown,
  anchor: TransitAnchorManifest | null,
  primary: CycleInstance | null,
  day: string,
  timezone: string,
): DailyTransitCalculation {
  const omit = (reason: StoryOmissionReason): DailyTransitCalculation => ({
    status: "omitted",
    reason,
  });
  if (
    !primary ||
    !STORY_BODIES.includes(primary.transit_body as (typeof STORY_BODIES)[number]) ||
    primary.importance <= 0.02
  )
    return omit("unsupported_primary");
  if (!anchor || anchor.status !== "screened") return omit("no_anchor");
  try {
    validateTransitAnchors(anchor, anchor.chartFingerprint, anchor.accuracy);
  } catch {
    return omit("no_anchor");
  }
  const target = anchor.anchors.find((a) => a.target === primary.natal_point);
  if (!target) return omit("no_anchor");
  try {
    timezone = validTimeZone(timezone);
    const referenceAt = localNoon(day, timezone).toISOString();
    const raw = transitEpisodeScanSchema.parse(value);
    const request: TransitEpisodeRequest = {
      contract: TRANSIT_EPISODE_CONTRACT,
      solverVersion: TRANSIT_EPISODE_SOLVER_VERSION,
      sourceId: raw.sourceId,
      transitBody: primary.transit_body as (typeof STORY_BODIES)[number],
      aspect: primary.aspect,
      targets: anchor.sampleOffsetsMinutes.map((offsetMinutes, i) => ({
        offsetMinutes,
        longitude: target.longitudes[i]!,
      })) as Triple<{ offsetMinutes: number; longitude: number }>,
      referenceAt,
      maxOrbDegrees: transitOrb(primary.transit_body, primary.aspect),
    };
    if (!anchor.sources.every((s) => samePositionSource(s, raw.source)))
      return omit("unqualified_source");
    const scan = parseTransitEpisodeScan(value, request);
    const orb = request.maxOrbDegrees;
    const angle = {
      conjunction: 0,
      sextile: 60,
      square: 90,
      trine: 120,
      quincunx: 150,
      opposition: 180,
    }[primary.aspect];
    const currentOrb = (lon: number) =>
      Math.abs(
        Math.abs(((((scan.reference.unwrappedLongitude - lon + 540) % 360) + 360) % 360) - 180) -
          angle,
      );
    if (primary.orb > orb || target.longitudes.some((l) => currentOrb(l) > orb))
      return omit("source_disagreement");
    validateEpisodeProof(scan);
    const ref = millis(referenceAt);
    const selected = scan.samples.map((sample) => {
      const w = sample.windows.find(
        (w) => w.ingress && w.egress && millis(w.ingress.at) <= ref && ref <= millis(w.egress.at),
      );
      if (!w) return null;
      const c = sample.components.find((c) => c.contactIds.some((id) => w.contactIds.includes(id)));
      if (!c) return null;
      const contacts = c.contactIds.map((id) => sample.contacts.find((x) => x.id === id)!);
      const nearStation =
        contacts.length > 1 &&
        contacts.slice(1).some((contact) => {
          const leg = sample.legs.find((l) => l.id === contact.legId)!;
          const station = sample.stations.find((s) => s.id === leg.startStationId);
          return station && Math.abs(millis(station.at) - ref) <= 12 * 3600000;
        });
      const current = contacts.findIndex((c) => {
        const l = sample.legs.find((l) => l.id === c.legId)!;
        return millis(l.start.at) <= ref && ref <= millis(l.end.at);
      });
      if (!nearStation && current < 0) return null;
      const chapter: TransitChapter = nearStation
        ? "between"
        : contacts.length === 1
          ? "single"
          : current === 0
            ? "opening"
            : current === contacts.length - 1
              ? "closing"
              : "return";
      return {
        component: c,
        contacts,
        chapter,
        passIndex: nearStation ? null : current + 1,
        window: w,
      };
    });
    if (selected.some((s) => !s)) return omit("no_current_pass");
    const central = selected[1]!;
    const topology = (s: NonNullable<(typeof selected)[number]>) =>
      JSON.stringify([
        s.contacts.length,
        s.contacts.map((c) => [c.direction, c.branch, c.targetTurn]),
        s.chapter,
        s.passIndex,
        s.contacts.map((c) => s.contacts.filter((o) => o.windowId === c.windowId).length),
      ]);
    if (!selected.every((s) => topology(s!) === topology(central)))
      return omit("birth_window_disagreement");
    const contactRanges = central.contacts.map((c, i) => {
      const dates = selected.map((s) => s!.contacts[i]!.at) as Triple<string>;
      return {
        eventId: c.id,
        centralAt: c.at,
        earliestAt: [...dates].sort()[0]!,
        latestAt: [...dates].sort().at(-1)!,
        civilDays: dates.map((d) => localDayString(new Date(d), timezone)) as Triple<string>,
      };
    });
    const approvedDates: StoryDateReference[] = contactRanges.map((c) => ({
      eventId: c.eventId,
      kind: "exact-contact",
      civilDay: new Set(c.civilDays).size === 1 ? c.civilDays[0] : null,
      monthYear:
        new Set(c.civilDays.map((d) => d.slice(0, 7))).size === 1
          ? c.civilDays[0].slice(0, 7)
          : null,
    }));
    const i = central.passIndex === null ? null : central.passIndex - 1;
    const exactAt = i === null ? null : central.contacts[i]!.at,
      qualifiedDay = i === null ? null : approvedDates[i]!.civilDay;
    const relations =
      i === null ? [] : selected.map((s) => Math.sign(millis(s!.contacts[i]!.at) - ref));
    const phase: StoryTimingOverlay["phase"] =
      central.chapter === "between"
        ? "between"
        : qualifiedDay === day
          ? "exact"
          : new Set(relations).size !== 1
            ? "uncertain"
            : relations[0]! > 0
              ? "approaching"
              : relations[0]! < 0
                ? "separating"
                : "uncertain";
    const ingress = central.window.ingress!.at,
      egress = central.window.egress!.at;
    const timingOverlay: StoryTimingOverlay = {
      cycleKey: primary.cycle_key,
      phase,
      centralExactAt: exactAt,
      qualifiedExactDay: qualifiedDay,
      daysToExact: qualifiedDay && exactAt ? daysToLocalDate(exactAt, day, timezone) : null,
      centralIngressAt: ingress,
      centralEgressAt: egress,
      windowPosition: (ref - millis(ingress)) / (millis(egress) - millis(ingress)),
    };
    const first = central.contacts[0]!;
    const episodeIdentity = JSON.stringify([
      scan.sourceId,
      scan.solverVersion,
      anchor.chartFingerprint,
      target.target,
      target.longitudes,
      first.branch,
      first.targetTurn,
      central.component.id,
      first.at,
      central.contacts.at(-1)!.at,
    ]);
    return {
      status: "qualified",
      timingOverlay,
      evidence: {
        scan,
        anchor,
        anchorFingerprint: anchor.chartFingerprint,
        cycleKey: primary.cycle_key,
        componentIds: selected.map((s) => s!.component.id) as Triple<string>,
        episodeIdentity,
        referenceAt,
        timezone,
        day,
        passTotal: central.contacts.length,
        passIndex: central.passIndex,
        chapter: central.chapter,
        approvedDates,
        contactRanges,
        timingOverlay,
      },
    };
  } catch (e) {
    return omit(e instanceof EpisodeProofError ? e.reason : "invalid_scan");
  }
}
