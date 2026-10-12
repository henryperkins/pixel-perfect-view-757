import { z } from "zod";
import type { FactAtom } from "./facts";
import {
  renderStoryChronology,
  type DailyTransitStoryPlan,
  STORY_MONTHS,
} from "../content/transit-story";
import { validateTransitCatalogue } from "../content/schema";
import type { DailyRejectionCode } from "./diagnostics";
const civilDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00Z");
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === s;
  });
export const storyFactSchema = z
  .object({
    cycleKey: z.string().min(1).max(160),
    chapter: z.enum(["single", "opening", "return", "closing", "between"]),
    passIndex: z.number().int().min(1).max(16).nullable(),
    passTotal: z.number().int().min(1).max(16),
    chronologySentence: z.string().min(1).max(180),
    dates: z
      .array(
        z
          .object({
            eventId: z.string().regex(/^pass-(?:[1-9]|1[0-6])$/),
            kind: z.literal("exact-contact"),
            civilDay: civilDay.nullable(),
            monthYear: z
              .string()
              .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/)
              .nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(16),
  })
  .strict();
export type StoryFact = z.infer<typeof storyFactSchema>;
export function transitStoryFacts(plan: DailyTransitStoryPlan): FactAtom[] {
  if (plan.status !== "selected") return [];
  const arc: StoryFact = {
    cycleKey: plan.cycleKey,
    chapter: plan.chapter,
    passIndex: plan.passIndex,
    passTotal: plan.passTotal,
    chronologySentence: plan.chronologySentence,
    dates: plan.approvedDates.map((d, i) => ({ ...d, eventId: `pass-${i + 1}` })),
  };
  return [
    { id: "A1", kind: "calculation", dependsOn: ["C1"], statement: plan.chronologySentence, arc },
    {
      id: "P2",
      kind: "interpretation",
      dependsOn: ["C1", "I1", "A1"],
      sourceKey: plan.copy.key,
      releaseVersion: plan.releaseVersion,
      statement: `Published transit chapter: ${plan.copy.mechanism}`,
      storyChapter: plan.chapter,
    },
  ];
}
export function assertTransitStoryFacts(facts: FactAtom[]): void {
  const a = facts.find((f) => f.id === "A1"),
    p = facts.find((f) => f.id === "P2"),
    c = facts.find((f) => f.id === "C1")?.cycle,
    i = facts.find((f) => f.id === "I1");
  if (!a && !p && !facts.some((f) => f.arc || f.storyChapter)) return;
  const bad = (): never => {
    throw new Error("Invalid transit story facts");
  };
  if (!a || !p || !c || !i || facts.some((f) => (f.arc && f !== a) || (f.storyChapter && f !== p)))
    bad();
  const arc = storyFactSchema.parse(a!.arc);
  if (
    a!.kind !== "calculation" ||
    a!.dependsOn?.join(",") !== "C1" ||
    a!.cycle ||
    a!.sourceKey ||
    a!.releaseVersion ||
    arc.cycleKey !== `${c!.transitBody}_${c!.aspect}_${c!.natalPoint}` ||
    arc.dates.length !== arc.passTotal ||
    arc.dates.some(
      (d, n) =>
        d.eventId !== `pass-${n + 1}` || (d.civilDay && d.monthYear !== d.civilDay.slice(0, 7)),
    ) ||
    arc.chronologySentence !==
      renderStoryChronology(arc.chapter, arc.passIndex, arc.passTotal, arc.dates) ||
    a!.statement !== arc.chronologySentence
  )
    bad();
  if (
    p!.kind !== "interpretation" ||
    p!.dependsOn?.join(",") !== "C1,I1,A1" ||
    p!.cycle ||
    p!.storyChapter !== arc.chapter ||
    p!.releaseVersion !== i!.releaseVersion ||
    !p!.statement.startsWith("Published transit chapter: ")
  )
    bad();
  validateTransitCatalogue(
    [
      {
        key: p!.sourceKey,
        chapter: p!.storyChapter,
        mechanism: p!.statement.slice("Published transit chapter: ".length),
      },
    ],
    4,
  );
}
const historyClaim =
  /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|last|final|opening|closing|\d+(?:st|nd|rd|th)?)\s+(?:of\s+(?:\w+|\d+)\s+)?(?:calculated\s+|exact\s+|retrograde\s+)?(?:contacts?|passes?|pass|returns?|passages?)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|\d+)\s+(?:calculated\s+|exact\s+)?(?:contacts|passes|returns|passages)\b|\b(?:multi[- ]pass|repeated contacts?|retrograde return|previous (?:pass|return|passage)|next (?:pass|return|passage))\b/i;
export function storyParagraphProblem(
  text: string,
  ids: string[],
  facts: FactAtom[],
): DailyRejectionCode | null {
  const arc = facts.find((f) => f.id === "A1")?.arc;
  if (
    (ids.includes("A1") && !ids.includes("C1")) ||
    (ids.includes("P2") && !["C1", "I1", "A1"].every((id) => ids.includes(id)))
  )
    return "arc_dependencies";
  const contains = arc && text.includes(arc.chronologySentence);
  if (contains && !["C1", "A1"].every((id) => ids.includes(id))) return "arc_dependencies";
  const rest = contains ? text.replaceAll(arc!.chronologySentence, "") : text;
  if (historyClaim.test(rest)) return "arc_claim";
  if (
    /\b(?:guarantees?|ensures?|promises?|will bring|will finally|ends? your)\b[^.!?]{0,70}\b(?:resolution|closure|healing|resolved|over|end)\b|\b(?:you (?:experienced|suffered|went through)|your (?:relationship|marriage|job) (?:ended|collapsed)|the rupture (?:you|that))\b/i.test(
      rest,
    )
  )
    return "arc_claim";
  // A1 dates authorize only the unchanged, server-rendered exact-contact sentence.
  // All other dates retain the existing paragraph-local C-fact requirement.
  if (
    new RegExp(
      `\\b(?:${STORY_MONTHS.join("|")})\\s+(?:\\d{1,2}(?:st|nd|rd|th)?(?:,)?\\s+)?\\d{4}\\b|\\b(?:last|next|previous) (?:month|year)\\b|\\b(?:station|ingress|egress)\\b[^.!?]{0,60}\\d{4}-\\d{2}-\\d{2}`,
      "i",
    ).test(rest)
  )
    return "arc_date";
  return null;
}
export function storyCoverageProblem(
  paragraphs: string[],
  citations: { facts: string[] }[],
  facts: FactAtom[],
): DailyRejectionCode | null {
  const arc = facts.find((f) => f.id === "A1")?.arc;
  if (!arc) return null;
  const occurrences = paragraphs.reduce(
    (sum, p) => sum + p.split(arc.chronologySentence).length - 1,
    0,
  );
  if (occurrences !== 1 || !paragraphs.slice(0, 2).some((p) => p.includes(arc.chronologySentence)))
    return "arc_chronology";
  if (!citations.slice(0, 2).some((c) => c.facts.includes("P2"))) return "arc_coverage";
  return null;
}
