import { safetyPass } from "./default-bundle";
import { completeDailySentences, type DailyWritingPlan } from "./daily-writing";
import type { ReadingContext } from "../reading.server";
import { isPermitted } from "../registry";
import { dailyWritingReferenceClaim } from "./daily-writing-policy";

export const DAILY_REFLECTION_VERSION = "daily-reflection-1" as const;
export interface DailyReflectionPlan {
  version: typeof DAILY_REFLECTION_VERSION;
  question: string;
  themeFactId: "I1" | "S1" | null;
  frameKey: string | null;
  variant:
    "standard" | "high_stress" | "low_sleep" | "legacy" | "fallback" | "editorial" | "context";
  localSource: "WEL-03" | "WEL-01" | null;
}

export function dailyQuestionProblem(text: string): "shape" | "compound" | "unsafe" | null {
  if (
    typeof text !== "string" ||
    !text ||
    text !== text.trim() ||
    text.length > 220 ||
    /[\r\n;:]/.test(text) ||
    !text.endsWith("?") ||
    (text.match(/\?/g) ?? []).length !== 1 ||
    /^(?:[-*•]|\d+[.)]|observation\b|reflection\b|question\b|consider\b|notice\b)/i.test(text) ||
    !/^(?:what|which|where|when|how|who|whose|could|would|does|do|is|are|can)\b/i.test(text) ||
    completeDailySentences(text).length !== 1
  )
    return "shape";
  if (
    /\b(?:and|or|but)\s+(?:what|which|where|when|how|who|whose|could you|would you|do you|can you)\b/i.test(
      text,
    )
  )
    return "compound";
  if (safetyPass(text).flagged.length || dailyWritingReferenceClaim(text)) return "unsafe";
  return null;
}

export function resolveDailyReflection(
  plan: DailyWritingPlan,
  legacyQuestion: string | null,
  ctx: ReadingContext,
): DailyReflectionPlan {
  const base = {
    version: DAILY_REFLECTION_VERSION,
    themeFactId: plan.theme?.factId ?? null,
    frameKey: plan.frame?.key ?? null,
  };
  if (plan.editorial) {
    if (dailyQuestionProblem(plan.editorial.entry.reflection))
      throw Error("Selected editorial reflection failed independent validation.");
    return {
      ...base,
      question: plan.editorial.entry.reflection,
      frameKey: plan.editorial.entry.key,
      variant: "editorial",
      localSource: null,
    };
  }
  const reflection = plan.frame?.reflection;
  if (reflection && !dailyQuestionProblem(reflection.standard)) {
    if (isPermitted("WEL-03", "reflection_prompt", ctx.granted) && (ctx.wellness?.stress ?? 0) >= 4)
      return reflection.highStress && !dailyQuestionProblem(reflection.highStress)
        ? {
            ...base,
            question: reflection.highStress,
            variant: "high_stress",
            localSource: "WEL-03",
          }
        : { ...base, question: reflection.standard, variant: "standard", localSource: null };
    if (
      isPermitted("WEL-01", "reflection_prompt", ctx.granted) &&
      ctx.wellness?.sleep !== null &&
      ctx.wellness?.sleep !== undefined &&
      ctx.wellness.sleep <= 2
    )
      return reflection.lowSleep && !dailyQuestionProblem(reflection.lowSleep)
        ? { ...base, question: reflection.lowSleep, variant: "low_sleep", localSource: "WEL-01" }
        : { ...base, question: reflection.standard, variant: "standard", localSource: null };
    return { ...base, question: reflection.standard, variant: "standard", localSource: null };
  }
  if (plan.theme?.factId === "I1" && legacyQuestion && !dailyQuestionProblem(legacyQuestion))
    return { ...base, question: legacyQuestion, variant: "legacy", localSource: null };
  const question = !plan.theme
    ? "What has your attention today?"
    : plan.theme.relationship === "tension"
      ? "Which ordinary choice brings these competing demands into focus?"
      : plan.theme.relationship === "reinforcement"
        ? "Which ordinary choice could give both priorities a place?"
        : "Where could this theme show up in one ordinary choice?";
  return { ...base, question, variant: "fallback", localSource: null };
}
