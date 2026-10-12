import { keyedFingerprint } from "../crypto.server";
import {
  resolveDailyTransitCalculation,
  type DailyTransitCalculation,
  type StoryTimingOverlay,
} from "../astro/transit-episodes";
import { DAILY_TRANSIT_STORY_VERSION, type DailyTransitStoryPlan } from "./transit-story";
import { assertDailyFactGraph, type FactAtom } from "../ai/facts";
import {
  transitStoryFacts,
  storyCoverageProblem,
  storyParagraphProblem,
} from "../ai/transit-story-facts";
import { validateTransitCatalogue } from "./schema";
export interface StoryPolicyBinding {
  enabled: boolean;
  sourceId: string;
  endpointIdentity: string;
  anchorIdentity: string;
}
export interface SavedTransitStory {
  version: 1;
  plan: DailyTransitStoryPlan;
  facts: FactAtom[];
  usedParagraphs: { A1: number[]; P2: number[] };
  timingOverlay: StoryTimingOverlay | null;
  resultDigest: string;
}
export const canonicalStoryValue = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonicalStoryValue)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, x]) => [k, canonicalStoryValue(x)]),
        )
      : v;
export const storyDigest = (plan: DailyTransitStoryPlan, binding: StoryPolicyBinding) =>
  keyedFingerprint("daily-transit-result-v1", canonicalStoryValue({ plan, binding }));
export const calculationFromStory = (saved: SavedTransitStory): DailyTransitCalculation =>
  saved.plan.status === "selected"
    ? {
        status: "qualified",
        evidence: saved.plan.evidence,
        timingOverlay: saved.plan.evidence.timingOverlay,
      }
    : { status: "omitted", reason: saved.plan.reason };
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(canonicalStoryValue(a)) === JSON.stringify(canonicalStoryValue(b));
export async function validateSavedTransitStory(
  value: unknown,
  publicFacts: FactAtom[],
  expected: {
    releaseVersion: string | null;
    primaryCycleKey: string | null;
    mode: string;
    paragraphs: string[];
    citations: { paragraph: number; facts: string[] }[];
    binding: StoryPolicyBinding;
  },
): Promise<SavedTransitStory> {
  const s = value as SavedTransitStory;
  if (
    !s ||
    s.version !== 1 ||
    !s.plan ||
    s.plan.version !== DAILY_TRANSIT_STORY_VERSION ||
    s.plan.solverVersion !== "transit-episode-1" ||
    s.plan.anchorVersion !== "transit-anchor-1" ||
    !s.usedParagraphs ||
    !Array.isArray(s.facts) ||
    Object.keys(s).sort().join(",") !==
      "facts,plan,resultDigest,timingOverlay,usedParagraphs,version" ||
    !expected.binding ||
    s.resultDigest !== (await storyDigest(s.plan, expected.binding))
  )
    throw new Error("Invalid saved story");
  if (s.plan.status === "omitted") {
    const reasons = [
      "unsupported_primary",
      "no_primary_copy",
      "no_catalogue",
      "no_anchor",
      "unqualified_source",
      "service_unavailable",
      "invalid_scan",
      "incomplete_scan",
      "ambiguous_station_contact",
      "no_current_pass",
      "source_disagreement",
      "birth_window_disagreement",
    ];
    if (
      !reasons.includes(s.plan.reason) ||
      Object.keys(s.plan).length !== 5 ||
      s.facts.length ||
      s.timingOverlay !== null ||
      s.usedParagraphs.A1.length ||
      s.usedParagraphs.P2.length ||
      expected.citations.some((c) => c.facts.includes("A1") || c.facts.includes("P2"))
    )
      throw new Error("Invalid omitted story");
    return s;
  }
  if (
    s.plan.status !== "selected" ||
    s.plan.cycleKey !== expected.primaryCycleKey ||
    s.plan.releaseVersion !== expected.releaseVersion ||
    s.plan.evidence.scan.sourceId !== expected.binding.sourceId ||
    !expected.binding.enabled
  )
    throw new Error("Story binding mismatch");
  const c = publicFacts.find((f) => f.id === "C1")?.cycle;
  if (!c) throw new Error("Missing primary");
  const e = s.plan.evidence;
  const result = resolveDailyTransitCalculation(
    e.scan,
    e.anchor,
    {
      cycle_key: s.plan.cycleKey,
      transit_body: c.transitBody,
      natal_point: c.natalPoint,
      aspect: c.aspect as "square",
      orb: c.orb,
      importance: 1,
      phase: "approaching",
      domain: "identity",
      label: "",
      ingress_at: null,
      exact_at: null,
      egress_at: null,
      days_to_exact: null,
      arc_position: null,
    },
    e.day,
    e.timezone,
  );
  if (
    result.status !== "qualified" ||
    !equal(result.evidence, e) ||
    !equal(result.timingOverlay, s.timingOverlay) ||
    s.plan.passTotal !== e.passTotal ||
    s.plan.passIndex !== e.passIndex ||
    s.plan.chapter !== e.chapter ||
    s.plan.copy.chapter !== e.chapter ||
    !equal(s.plan.approvedDates, e.approvedDates) ||
    expected.binding.anchorIdentity !==
      (await keyedFingerprint("transit-anchor-state", canonicalStoryValue(e.anchor))) ||
    c.exactDate !== result.timingOverlay.qualifiedExactDay
  )
    throw new Error("Invalid saved calculation");
  validateTransitCatalogue([s.plan.copy], 4);
  if (!equal(s.facts, transitStoryFacts(s.plan))) throw new Error("Invalid saved atoms");
  const all = [...publicFacts, ...s.facts];
  assertDailyFactGraph(all);
  for (const id of ["A1", "P2"] as const) {
    const used =
      expected.mode === "model"
        ? expected.citations.filter((c) => c.facts.includes(id)).map((c) => c.paragraph)
        : [1];
    if (
      !equal(s.usedParagraphs[id], used) ||
      !used.length ||
      used.some((n) => !Number.isInteger(n) || n < 1 || n > expected.paragraphs.length)
    )
      throw new Error("Invalid story paragraph linkage");
  }
  if (expected.mode === "model") {
    if (
      storyCoverageProblem(expected.paragraphs, expected.citations, all) ||
      expected.paragraphs.some((p, i) =>
        storyParagraphProblem(
          p,
          expected.citations.find((c) => c.paragraph === i + 1)?.facts ?? [],
          all,
        ),
      )
    )
      throw new Error("Invalid saved chronology");
  } else if (
    !expected.paragraphs[0]?.includes(s.plan.chronologySentence) ||
    !expected.paragraphs[0]?.includes(s.plan.copy.mechanism)
  )
    throw new Error("Missing template chapter");
  return s;
}
