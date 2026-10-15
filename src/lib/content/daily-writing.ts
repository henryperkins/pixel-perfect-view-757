import type { ContentBundle } from "./default-bundle";
import type { DailyInterpretationPlan } from "./synthesis";
import type { FactAtom } from "../ai/facts";
import {
  resolveDailyEditorial,
  toDailyEditorialBrief,
  type DailyEditorialSelection,
} from "./daily-editorial";

export const DAILY_WRITING_PLAN_VERSION = "daily-concrete-writing-1" as const;
export interface DailyScene {
  key: string;
  situation: string;
  focus: string;
  cues: { objects: string[]; actions: string[] };
}
export interface DailyWritingFrame {
  key: string;
  source: { kind: "interpretation" | "synthesis"; key: string };
  templateSentenceIndex: number;
  scenes: DailyScene[];
  reflection: { standard: string; highStress?: string; lowSleep?: string };
}
export interface DailyWritingPlan {
  version: typeof DAILY_WRITING_PLAN_VERSION;
  releaseVersion: string;
  theme: {
    factId: "I1" | "S1";
    sourceKey: string;
    relationship: "tension" | "reinforcement" | null;
    requiredFacts: string[];
  } | null;
  status: "ready" | "no_frame" | "no_primary";
  frame: DailyWritingFrame | null;
  scenes: (DailyScene & { id: "SC1" | "SC2" })[];
  templateSources: { factId: "I1" | "S1"; sourceKey: string; sentences: string[] }[];
  /** Present only for a matching, explicitly opted-in editorial candidate. */
  editorial?: DailyEditorialSelection;
}
export interface DailyWritingBrief {
  themeFactId: "I1" | "S1" | null;
  requiredFacts: string[];
  scenes: { id: "SC1" | "SC2"; situation: string; focus: string; cues: DailyScene["cues"] }[];
  editorial?: ReturnType<typeof toDailyEditorialBrief>;
}

export function completeDailySentences(text: string): string[] {
  return [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)]
    .map(({ segment }) => segment.trim())
    .filter(Boolean);
}

/** Exact, release-owned bindings only. An absent frame never inherits fallback copy. */
export function resolveDailyWritingPlan(
  bundle: ContentBundle & { dailyWritingFrames?: DailyWritingFrame[] },
  interpretation: DailyInterpretationPlan,
  context?: { day?: string; tone: string; depth: string },
): DailyWritingPlan {
  if (interpretation.releaseVersion !== bundle.version)
    throw Error("Writing source release does not match the interpretation plan.");
  const primary = interpretation.interpretations.find((item) => item.index === 1);
  const synthesis = interpretation.synthesis;
  const editorial = context ? resolveDailyEditorial(bundle, interpretation, context) : null;
  // Editorial scenes have their own source contract; they are not schema-5 SC examples.
  const frames = editorial ? [] : (bundle.dailyWritingFrames ?? []);
  const compact = (kind: "interpretation" | "synthesis", key: string, mechanism: string) => {
    const ownFrame = frames.find((item) => item.source.kind === kind && item.source.key === key);
    const sentences = completeDailySentences(mechanism);
    return ownFrame ? [sentences[ownFrame.templateSentenceIndex]!].filter(Boolean) : sentences;
  };
  if (!primary)
    return {
      version: DAILY_WRITING_PLAN_VERSION,
      releaseVersion: bundle.version,
      theme: null,
      status: "no_primary",
      frame: null,
      scenes: [],
      templateSources: [],
      ...(editorial ? { editorial } : {}),
    };
  const factId = synthesis ? "S1" : "I1";
  const sourceKey = synthesis?.ruleKey ?? primary.interpretationKey;
  const frame = frames.find(
    (item) =>
      item.source.kind === (synthesis ? "synthesis" : "interpretation") &&
      item.source.key === sourceKey,
  );
  return {
    version: DAILY_WRITING_PLAN_VERSION,
    releaseVersion: bundle.version,
    theme: {
      factId,
      sourceKey,
      relationship: synthesis?.relationship ?? null,
      requiredFacts: synthesis ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"],
    },
    status: frame ? "ready" : "no_frame",
    frame: frame ? structuredClone(frame) : null,
    scenes: frame
      ? frame.scenes.map((scene, index) => ({
          ...structuredClone(scene),
          id: index === 0 ? "SC1" : "SC2",
        }))
      : [],
    templateSources: [
      {
        factId: "I1",
        sourceKey: primary.interpretationKey,
        sentences: compact("interpretation", primary.interpretationKey, primary.mechanism),
      },
      ...(synthesis
        ? [
            {
              factId: "S1" as const,
              sourceKey: synthesis.ruleKey,
              sentences: compact("synthesis", synthesis.ruleKey, synthesis.mechanism),
            },
          ]
        : []),
    ],
    ...(editorial ? { editorial } : {}),
  };
}

/** The provider receives only this allowlist, never the full plan/reflection/private history. */
export function toDailyWritingBrief(plan: DailyWritingPlan): DailyWritingBrief {
  return {
    themeFactId: plan.theme?.factId ?? null,
    requiredFacts: [...(plan.theme?.requiredFacts ?? [])],
    scenes: plan.scenes.map(({ id, situation, focus, cues }) => ({
      id,
      situation,
      focus,
      cues: structuredClone(cues),
    })),
    ...(plan.editorial ? { editorial: toDailyEditorialBrief(plan.editorial) } : {}),
  };
}

export function assertDailyWritingBrief(
  brief: DailyWritingBrief,
  plan: DailyWritingPlan,
  facts: FactAtom[],
) {
  if (JSON.stringify(brief) !== JSON.stringify(toDailyWritingBrief(plan)))
    throw Error("Writing brief differs from its exact selected scene plan.");
  if (plan.editorial) {
    const editorial = plan.editorial;
    if (
      editorial.releaseVersion !== plan.releaseVersion ||
      editorial.mode !== (plan.theme ? "contact" : "quiet") ||
      editorial.requiredFacts.join("|") !== (plan.theme?.requiredFacts ?? []).join("|") ||
      plan.frame ||
      plan.scenes.length
    )
      throw Error("Editorial writing selection differs from its exact selected source plan.");
    if (editorial.mode === "contact") {
      const entry = editorial.entry;
      if (
        !("source" in entry) ||
        entry.source.key !== plan.theme?.sourceKey ||
        entry.source.kind !== (plan.theme?.factId === "S1" ? "synthesis" : "interpretation") ||
        entry.cycleKeys.length !== (plan.theme?.factId === "S1" ? 2 : 1) ||
        entry.cycleKeys.some((key, index) => {
          const cycle = facts.find((fact) => fact.id === `C${index + 1}`)?.cycle;
          return !cycle || key !== `${cycle.transitBody}_${cycle.aspect}_${cycle.natalPoint}`;
        })
      )
        throw Error("Editorial writing source or calculated contact differs from saved facts.");
    } else if ("source" in editorial.entry || "cycleKeys" in editorial.entry)
      throw Error("Quiet editorial writing contains an interpretation source.");
  }
  if (!plan.theme) {
    if (plan.scenes.length || facts.some((fact) => fact.id === "I1" || fact.id === "S1"))
      throw Error("Quiet writing plan contains a source or scene.");
    return;
  }
  for (const id of plan.theme.requiredFacts)
    if (!facts.some((fact) => fact.id === id))
      throw Error("Writing plan is missing a required parent fact.");
  const theme = facts.find((fact) => fact.id === plan.theme!.factId)!;
  if (theme.sourceKey !== plan.theme.sourceKey || theme.releaseVersion !== plan.releaseVersion)
    throw Error("Writing theme source/release differs from the saved fact graph.");
  const required = plan.theme.factId === "S1" ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"];
  if (
    plan.theme.requiredFacts.join("|") !== required.join("|") ||
    theme.kind !== (plan.theme.factId === "S1" ? "synthesis" : "interpretation") ||
    (plan.theme.factId === "I1"
      ? plan.theme.relationship !== null
      : !["tension", "reinforcement"].includes(plan.theme.relationship ?? "") ||
        !theme.statement.startsWith(
          `Published ${plan.theme.relationship} synthesis ${plan.theme.sourceKey} `,
        ))
  )
    throw Error("Writing theme or required parent graph is invalid.");
  const parents = plan.theme.factId === "S1" ? ["C1", "I1", "C2", "I2"] : ["C1"];
  if (theme.dependsOn?.join("|") !== parents.join("|"))
    throw Error("Writing theme parent facts differ from the saved fact graph.");
  if (
    plan.frame &&
    (plan.frame.source.key !== plan.theme.sourceKey ||
      plan.frame.source.kind !== (plan.theme.factId === "S1" ? "synthesis" : "interpretation"))
  )
    throw Error("Writing frame source differs from its selected theme.");
}
