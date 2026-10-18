import type { CycleInstance } from "./astro/cycles";
import { contextUseAllowed, isLifeDomain, type LifeDomain } from "./context-policy";
import type { ThemeTag } from "./content/schema";
import { localDayString } from "./local-day";

/** Local reflection suggestions, never calculation rules or language-provider input. */
export const DAILY_GUIDANCE_VERSION = "daily-guidance-1" as const;
const ACTIONS: Record<ThemeTag, { standard: string; small: string }> = {
  structure: {
    standard: "Break one task you choose into three clear steps.",
    small: "Write down just the first step of one task.",
  },
  expansion: {
    standard: "Sketch a bigger version of one idea in three bullet points.",
    small: "Add one possibility to an idea you choose.",
  },
  initiative: {
    standard: "Make a rough first version of something you want to begin.",
    small: "Do one small part of something you want to begin.",
  },
  expression: {
    standard: "Draft a short message around the point you most want to communicate.",
    small: "Put your main point into one sentence.",
  },
  connection: {
    standard: "Ask someone you choose about something that matters to them.",
    small: "Send a brief hello to someone you’d like to hear from.",
  },
  autonomy: {
    standard: "Define the scope or stopping point of one commitment you choose.",
    small: "Name one part of a decision you want to make for yourself.",
  },
  rest: {
    standard: "Set aside a short stretch of time with nothing planned.",
    small: "Leave one small gap in your day unfilled.",
  },
  uncertainty: {
    standard: "Try a small, reversible version of one option.",
    small: "Write down one question that would help clarify a choice.",
  },
};

// This immutable source predates theme tags. Its reviewed photo-essay / larger
// ambition meaning supports expansion; new releases must be reviewed separately.
function reviewedTheme(source: GuidanceSource | null): ThemeTag | null {
  const tagged = source?.themes.find((value) => Object.hasOwn(ACTIONS, value));
  if (tagged) return tagged as ThemeTag;
  return source?.releaseVersion === "0.9.2" && source.key === "soft:jupiter:sun"
    ? "expansion"
    : null;
}

export interface GuidanceSource {
  key: string;
  releaseVersion: string;
  themes: readonly string[];
  question?: string;
}

export interface DailyGuidance {
  version: typeof DAILY_GUIDANCE_VERSION;
  action: string;
  framing: string | null;
  reflection: string | null;
  focus: LifeDomain | null;
  basis: {
    calculation: {
      cycleKey: string;
      label: string;
      phase: string;
      orb: number;
      exactAt: string | null;
    } | null;
    interpretation: { key: string; releaseVersion: string; theme: ThemeTag | null } | null;
    context: {
      sourceId: string;
      label: string;
      use: "framing" | "personalisation" | "reflection_prompt";
      value: number | string;
    }[];
  };
}

export interface DailyGuidanceInput {
  day: string;
  now: Date;
  timezone: string;
  granted: Set<string>;
  primary: CycleInstance | null;
  /** Already matched to this reading's C1/I1 and immutable content bundle. */
  source: GuidanceSource | null;
  checkIn: {
    day: string;
    observedAt: string | null;
    mood: number | null;
    energy: number | null;
    sleep: number | null;
    stress: number | null;
  } | null;
  preferredDomain: LifeDomain | null;
}

const band = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

/** Rebuilt for the current response; never persisted, exported or shared with a model. */
export function composeDailyGuidance(input: DailyGuidanceInput): DailyGuidance {
  const { primary, source, granted, now, checkIn } = input;
  const theme = primary ? reviewedTheme(source) : null;
  const selected = theme ? ACTIONS[theme as ThemeTag] : null;
  const question = primary && source?.question?.trim() ? source.question : null;
  const context: DailyGuidance["basis"]["context"] = [];
  const currentCheckIn =
    Number.isFinite(+now) &&
    input.day === localDayString(now, input.timezone) &&
    checkIn?.day === input.day &&
    checkIn.observedAt !== null;
  const allowed = (sourceId: string, use: "framing" | "personalisation" | "reflection_prompt") =>
    Boolean(currentCheckIn && contextUseAllowed(sourceId, use, granted, checkIn!.observedAt, now));
  const energy =
    allowed("USR-04", "personalisation") && band(checkIn?.energy) ? checkIn.energy : null;
  const mood = allowed("USR-04", "framing") && band(checkIn?.mood) ? checkIn.mood : null;
  const framing: string[] = [];
  if (!selected && question)
    framing.push(
      energy !== null && energy <= 2
        ? "If this question fits your day, one sentence is enough to begin."
        : "If this question fits your day, use it to choose one small next step.",
    );
  if (energy !== null && (selected || question)) {
    context.push({ sourceId: "USR-04", label: "Energy", use: "personalisation", value: energy });
    framing.push(
      energy <= 2
        ? `You logged energy ${energy}/5, so this version keeps the step small.`
        : `You logged energy ${energy}/5. Choose how much of this step you want to take on.`,
    );
  }
  if (mood !== null && mood <= 2) {
    context.push({ sourceId: "USR-04", label: "Mood", use: "framing", value: mood });
    framing.push(
      `With mood ${mood}/5 in your check-in, keep this optional and leave it aside if it doesn’t fit.`,
    );
  }
  let reflection: string | null = null;
  if (allowed("WEL-03", "reflection_prompt") && band(checkIn?.stress) && checkIn.stress >= 4) {
    context.push({
      sourceId: "WEL-03",
      label: "Stress",
      use: "reflection_prompt",
      value: checkIn.stress,
    });
    reflection = "Given the stress level you recorded, how would you like to approach this step?";
  } else if (allowed("WEL-01", "reflection_prompt") && band(checkIn?.sleep) && checkIn.sleep <= 2) {
    context.push({
      sourceId: "WEL-01",
      label: "Sleep quality",
      use: "reflection_prompt",
      value: checkIn.sleep,
    });
    reflection = "With the sleep quality you recorded, what pace would you prefer for this step?";
  }
  const focus =
    contextUseAllowed("USR-14", "framing", granted, null, now) &&
    isLifeDomain(input.preferredDomain)
      ? input.preferredDomain
      : null;
  if (focus)
    context.push({ sourceId: "USR-14", label: "Chosen focus", use: "framing", value: focus });
  return {
    version: DAILY_GUIDANCE_VERSION,
    action: selected
      ? selected[energy !== null && energy <= 2 ? "small" : "standard"]
      : (question ??
        "Choose one thing that has your attention and write down a small step you could take."),
    framing: framing.length ? framing.join(" ") : null,
    reflection,
    focus,
    basis: {
      calculation: primary
        ? {
            cycleKey: primary.cycle_key,
            label: primary.label,
            phase: primary.phase,
            orb: primary.orb,
            exactAt: primary.exact_at,
          }
        : null,
      interpretation:
        (theme || question) && source
          ? { key: source.key, releaseVersion: source.releaseVersion, theme }
          : null,
      context,
    },
  };
}
