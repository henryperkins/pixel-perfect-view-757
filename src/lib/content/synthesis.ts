import { findInterpretation, type ContentBundle } from "./default-bundle";
import type { ThemeTag } from "./schema";
import type { CycleInstance } from "../astro/cycles";
import type { FactAtom } from "../ai/facts";
import { DAILY_READING_PLAN_VERSION } from "../ai/diagnostics";

export interface ResolvedCycleInterpretation {
  index: 1 | 2 | 3;
  cycleKey: string;
  interpretationKey: string;
  mechanism: string;
  themes: ThemeTag[];
}

export interface ReadingSynthesis {
  ruleKey: string;
  relationship: "tension" | "reinforcement";
  mechanism: string;
  dependsOn: ["C1", "I1", "C2", "I2"];
  releaseVersion: string;
}

export interface DailyInterpretationPlan {
  interpretations: ResolvedCycleInterpretation[];
  synthesis: ReadingSynthesis | null;
  pairStatus: "selected" | "independent" | "unmatched" | "insufficient";
  pairRuleKey: string | null;
  releaseVersion: string;
}

export interface DailyPlanIdentity {
  version: string;
  interpretations: Pick<ResolvedCycleInterpretation, "index" | "cycleKey" | "interpretationKey">[];
  pairStatus: DailyInterpretationPlan["pairStatus"];
  pairRuleKey: string | null;
  releaseVersion: string;
  synthesis: Omit<ReadingSynthesis, "mechanism"> | null;
}

export function dailyPlanIdentity(plan: DailyInterpretationPlan): DailyPlanIdentity {
  return {
    version: DAILY_READING_PLAN_VERSION,
    interpretations: plan.interpretations.map(({ index, cycleKey, interpretationKey }) => ({
      index,
      cycleKey,
      interpretationKey,
    })),
    pairStatus: plan.pairStatus,
    pairRuleKey: plan.pairRuleKey,
    releaseVersion: plan.releaseVersion,
    synthesis: plan.synthesis
      ? {
          ruleKey: plan.synthesis.ruleKey,
          relationship: plan.synthesis.relationship,
          dependsOn: [...plan.synthesis.dependsOn],
          releaseVersion: plan.synthesis.releaseVersion,
        }
      : null,
  };
}

/** Restore only bounded saved identity, cross-checked against this reading's saved facts. */
export function readDailyPlanIdentity(value: unknown, facts: FactAtom[]): DailyPlanIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as DailyPlanIdentity;
  const key = (v: unknown): v is string =>
    typeof v === "string" && v.length >= 1 && v.length <= 100;
  const version = (v: unknown): v is string =>
    typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(v);
  if (
    !version(p.version) ||
    !version(p.releaseVersion) ||
    !["selected", "independent", "unmatched", "insufficient"].includes(p.pairStatus) ||
    !Array.isArray(p.interpretations) ||
    p.interpretations.length > 3 ||
    new Set(p.interpretations.map((i) => i?.index)).size !== p.interpretations.length ||
    p.interpretations.some(
      (i) =>
        !i ||
        ![1, 2, 3].includes(i.index) ||
        !key(i.cycleKey) ||
        !key(i.interpretationKey) ||
        !facts.some(
          (f) =>
            f.id === `I${i.index}` &&
            f.sourceKey === i.interpretationKey &&
            f.releaseVersion === p.releaseVersion,
        ),
    )
  )
    return null;
  const hasRule = p.pairStatus === "selected" || p.pairStatus === "independent";
  if (hasRule ? !key(p.pairRuleKey) : p.pairRuleKey !== null) return null;
  let synthesis: DailyPlanIdentity["synthesis"] = null;
  if (p.pairStatus === "selected") {
    const s = p.synthesis,
      fact = facts.find((f) => f.id === "S1");
    if (
      !s ||
      !["tension", "reinforcement"].includes(s.relationship) ||
      s.ruleKey !== p.pairRuleKey ||
      s.releaseVersion !== p.releaseVersion ||
      !Array.isArray(s.dependsOn) ||
      s.dependsOn.join("|") !== "C1|I1|C2|I2" ||
      fact?.kind !== "synthesis" ||
      fact.sourceKey !== s.ruleKey ||
      fact.releaseVersion !== s.releaseVersion ||
      fact.dependsOn?.join("|") !== s.dependsOn.join("|")
    )
      return null;
    synthesis = {
      ruleKey: s.ruleKey,
      relationship: s.relationship,
      releaseVersion: s.releaseVersion,
      dependsOn: ["C1", "I1", "C2", "I2"],
    };
  } else if (p.synthesis !== null || facts.some((f) => f.id === "S1")) return null;
  return {
    version: p.version,
    releaseVersion: p.releaseVersion,
    pairStatus: p.pairStatus,
    pairRuleKey: p.pairRuleKey,
    interpretations: p.interpretations.map(({ index, cycleKey, interpretationKey }) => ({
      index,
      cycleKey,
      interpretationKey,
    })),
    synthesis,
  };
}

export function resolveInterpretationPlan(
  bundle: ContentBundle,
  eligibleCycles: CycleInstance[],
): DailyInterpretationPlan {
  const topCycles = eligibleCycles.slice(0, 3);
  const interpretations: ResolvedCycleInterpretation[] = [];

  for (let i = 0; i < topCycles.length; i++) {
    const cycle = topCycles[i];
    if (!cycle) continue;
    const index = (i + 1) as 1 | 2 | 3;
    const interp = findInterpretation(bundle, cycle.aspect, cycle.transit_body, cycle.natal_point);
    if (interp.key !== "fallback") {
      interpretations.push({
        index,
        cycleKey: cycle.cycle_key,
        interpretationKey: interp.key,
        mechanism: interp.mechanism,
        themes: interp.themes ? [...interp.themes] : [],
      });
    }
  }

  const releaseVersion = bundle.version;

  if (topCycles.length < 2) {
    return {
      interpretations,
      synthesis: null,
      pairStatus: "insufficient",
      pairRuleKey: null,
      releaseVersion,
    };
  }

  const c1Interp = interpretations.find((item) => item.index === 1);
  const c2Interp = interpretations.find((item) => item.index === 2);

  if (!c1Interp || !c2Interp) {
    return {
      interpretations,
      synthesis: null,
      pairStatus: "unmatched",
      pairRuleKey: null,
      releaseVersion,
    };
  }

  const rules = bundle.synthesisRules ?? [];
  const matchingRule = rules.find((rule) => {
    if (
      rule.primary.interpretationKey !== c1Interp.interpretationKey ||
      rule.supporting.interpretationKey !== c2Interp.interpretationKey
    ) {
      return false;
    }
    return (
      c1Interp.themes.includes(rule.primary.theme) &&
      c2Interp.themes.includes(rule.supporting.theme)
    );
  });

  if (!matchingRule) {
    return {
      interpretations,
      synthesis: null,
      pairStatus: "unmatched",
      pairRuleKey: null,
      releaseVersion,
    };
  }

  if (matchingRule.relationship === "independent") {
    return {
      interpretations,
      synthesis: null,
      pairStatus: "independent",
      pairRuleKey: matchingRule.key,
      releaseVersion,
    };
  }

  return {
    interpretations,
    synthesis: {
      ruleKey: matchingRule.key,
      relationship: matchingRule.relationship,
      mechanism: matchingRule.mechanism,
      dependsOn: ["C1", "I1", "C2", "I2"],
      releaseVersion,
    },
    pairStatus: "selected",
    pairRuleKey: matchingRule.key,
    releaseVersion,
  };
}
