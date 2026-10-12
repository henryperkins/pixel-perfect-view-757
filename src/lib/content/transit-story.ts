import type { CycleInstance } from "../astro/cycles";
import { STORY_BODIES } from "../astro/transit-anchors";
import {
  resolveDailyTransitCalculation,
  TRANSIT_EPISODE_SOLVER_VERSION,
  type DailyTransitCalculation,
  type ValidatedTransitEpisode,
  type StoryDateReference,
  type TransitChapter,
  type StoryOmissionReason,
} from "../astro/transit-episodes";
import type { ContentBundle } from "./default-bundle";
import type { ResolvedCycleInterpretation } from "./synthesis";
import type { TransitChapterCopy } from "./transit-story-catalogue";
export type { TransitChapter, TransitChapterCopy };
export const DAILY_TRANSIT_STORY_VERSION = "daily-transit-story-1";
export const STORY_COUNTS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
];
export const STORY_ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "fifteenth",
  "sixteenth",
];
export const STORY_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export type DailyTransitStoryPlan = {
  version: typeof DAILY_TRANSIT_STORY_VERSION;
  solverVersion: typeof TRANSIT_EPISODE_SOLVER_VERSION;
  anchorVersion: "transit-anchor-1";
} & (
  | {
      status: "selected";
      cycleKey: string;
      releaseVersion: string;
      chapter: TransitChapter;
      passIndex: number | null;
      passTotal: number;
      chronologySentence: string;
      approvedDates: StoryDateReference[];
      copy: TransitChapterCopy;
      evidence: ValidatedTransitEpisode;
    }
  | { status: "omitted"; reason: StoryOmissionReason }
);
export function renderStoryChronology(
  chapter: TransitChapter,
  index: number | null,
  total: number,
  dates: StoryDateReference[],
): string {
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 16 ||
    (chapter === "between"
      ? index !== null
      : !Number.isInteger(index) || index! < 1 || index! > total)
  )
    throw new Error("Invalid chronology bounds");
  if (chapter === "single") {
    if (total !== 1 || index !== 1) throw new Error("Invalid single contact");
    return "This is one calculated contact in a complete passage.";
  }
  if (
    total < 2 ||
    (chapter === "opening" && index !== 1) ||
    (chapter === "closing" && index !== total) ||
    (chapter === "return" && (index === 1 || index === total))
  )
    throw new Error("Invalid chapter");
  if (chapter === "between")
    return `This calculated episode has ${STORY_COUNTS[total - 1]} contacts, with a pause between passes.`;
  const month = dates[0]?.monthYear;
  const date =
    month && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)
      ? `; the first exact contact falls in ${STORY_MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`
      : "";
  return `This is the ${STORY_ORDINALS[index! - 1]} of ${STORY_COUNTS[total - 1]} calculated contacts${date}.`;
}
export function resolveDailyTransitStory(
  bundle: ContentBundle,
  primary: CycleInstance | null,
  interpretation: ResolvedCycleInterpretation | null,
  calculation: DailyTransitCalculation | null,
): DailyTransitStoryPlan {
  const base = {
    version: DAILY_TRANSIT_STORY_VERSION,
    solverVersion: TRANSIT_EPISODE_SOLVER_VERSION,
    anchorVersion: "transit-anchor-1",
  } as const;
  const omitted = (reason: StoryOmissionReason): DailyTransitStoryPlan => ({
    ...base,
    status: "omitted",
    reason,
  });
  if (!primary || !STORY_BODIES.includes(primary.transit_body as (typeof STORY_BODIES)[number]))
    return omitted("unsupported_primary");
  if (
    !interpretation ||
    interpretation.index !== 1 ||
    interpretation.cycleKey !== primary.cycle_key
  )
    return omitted("no_primary_copy");
  if (!bundle.transitChapters?.length) return omitted("no_catalogue");
  if (!calculation) return omitted("no_anchor");
  if (calculation.status === "omitted") return omitted(calculation.reason);
  const e = calculation.evidence;
  // Recheck the bounded proof at the pure selection boundary, including cached callers.
  const checked = resolveDailyTransitCalculation(e.scan, e.anchor, primary, e.day, e.timezone);
  if (checked.status !== "qualified") return omitted(checked.reason);
  if (
    JSON.stringify(checked.evidence) !== JSON.stringify(e) ||
    JSON.stringify(checked.timingOverlay) !== JSON.stringify(calculation.timingOverlay)
  )
    return omitted("invalid_scan");
  const copy = bundle.transitChapters.find((c) => c.chapter === e.chapter);
  if (!copy) return omitted("no_catalogue");
  return {
    ...base,
    status: "selected",
    cycleKey: primary.cycle_key,
    releaseVersion: bundle.version,
    chapter: e.chapter,
    passIndex: e.passIndex,
    passTotal: e.passTotal,
    chronologySentence: renderStoryChronology(e.chapter, e.passIndex, e.passTotal, e.approvedDates),
    approvedDates: structuredClone(e.approvedDates),
    copy: structuredClone(copy),
    evidence: structuredClone(e),
  };
}
