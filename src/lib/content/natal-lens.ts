import type { CycleInstance } from "../astro/cycles";
import type { TimeAccuracy } from "../astro/chart";
import {
  validateNatalReliability,
  type NatalReliabilityManifest,
  type NatalLensEvidence,
  type SampleTriple,
} from "../astro/natal-reliability";
import type { ContentBundle } from "./default-bundle";
import type { ResolvedCycleInterpretation } from "./synthesis";
import {
  NATAL_PERSONAL_BODIES,
  type NatalLensRole,
  type NatalLensRule,
  type NatalPersonalBody,
} from "./natal-lens-types";

/** Version 2: the transited body's own sign leads; Moon rules are the fallback lens. */
export const NATAL_LENS_PLAN_VERSION = "daily-natal-lens-2";
export interface SelectedNatalLens {
  ruleKey: string;
  role: NatalLensRole;
  mechanism: string;
  anchorCycleKey: string;
  dependsOn: ["C1", "I1"];
  evidenceId: "NL1";
  evidence: NatalLensEvidence[];
  /** Private archived sampling labels, never provider or clear metadata. */
  screen: {
    accuracy: TimeAccuracy;
    sampleOffsetsMinutes: SampleTriple<number>;
    sampleEngines: SampleTriple<string>;
  };
}
export interface DailyNatalLensPlan {
  version: typeof NATAL_LENS_PLAN_VERSION;
  reliabilityVersion: string | null;
  releaseVersion: string;
  status:
    | "selected"
    | "no_cycle"
    | "no_interpretation"
    | "unreliable"
    | "unsupported_anchor"
    | "unmatched";
  lens: SelectedNatalLens | null;
}

function matchRule(rule: NatalLensRule, evidence: NatalLensEvidence[]): NatalLensEvidence[] | null {
  const found = rule.selectors.map((selector) =>
    evidence.find((e) => {
      if (selector.kind === "sign")
        return e.kind === "sign" && e.body === selector.body && e.sign === selector.sign;
      if (selector.kind === "house")
        return e.kind === "house" && e.body === selector.body && e.house === selector.house;
      return (
        e.kind === "aspect" &&
        [e.a, e.b].sort().join(":") === [selector.a, selector.b].sort().join(":") &&
        e.aspect === selector.aspect &&
        Math.max(...e.orbs) <= selector.maxOrb
      );
    }),
  );
  return found.every((e) => e !== undefined) ? (found as NatalLensEvidence[]) : null;
}

export function resolveDailyNatalLens(
  bundle: ContentBundle,
  primary: CycleInstance | null,
  interpretation: ResolvedCycleInterpretation | null,
  reliability: NatalReliabilityManifest | null,
): DailyNatalLensPlan {
  const plan: DailyNatalLensPlan = {
    version: NATAL_LENS_PLAN_VERSION,
    reliabilityVersion: reliability?.version ?? null,
    releaseVersion: bundle.version,
    status: "unreliable",
    lens: null,
  };
  const absent = (status: DailyNatalLensPlan["status"]) => ({ ...plan, status });
  if (!primary) return absent("no_cycle");
  if (
    !interpretation ||
    interpretation.index !== 1 ||
    interpretation.cycleKey !== primary.cycle_key
  )
    return absent("no_interpretation");
  if (!NATAL_PERSONAL_BODIES.includes(primary.natal_point as NatalPersonalBody))
    return absent("unsupported_anchor");
  if (!reliability) return plan;
  const manifest = validateNatalReliability(
    reliability,
    reliability.chartFingerprint,
    reliability.accuracy,
  );
  if (
    manifest.status !== "screened" ||
    !manifest.evidence.some(
      (e) => e.kind === "sign" && (e.body === "moon" || e.body === primary.natal_point),
    )
  )
    return plan;
  // The transited body's own rules lead, so the lens follows the day's contact; within
  // one body the most specific qualified selector wins. Moon rules anchor every
  // personal target, but for other targets they are only the fallback when that
  // target has no screened, published match.
  const specificity = (extra: NatalLensRule["selectors"][1]) =>
    extra?.kind === "aspect" ? 0 : extra?.kind === "house" ? 1 : 2;
  const candidates = (bundle.natalLenses ?? [])
    .flatMap((rule) => {
      if (!rule.anchorNatalPoints.includes(primary.natal_point as NatalPersonalBody)) return [];
      const body = rule.selectors[0].body;
      const extra = rule.selectors[1];
      const tier =
        body === primary.natal_point
          ? specificity(extra)
          : body === "moon"
            ? 3 + specificity(extra)
            : null;
      if (tier === null) return [];
      const evidence = matchRule(rule, manifest.evidence);
      return evidence ? [{ tier, rule, evidence }] : [];
    })
    .sort(
      (a, b) => a.tier - b.tier || (a.rule.key < b.rule.key ? -1 : a.rule.key > b.rule.key ? 1 : 0),
    );
  const selected = candidates[0];
  if (!selected) return absent("unmatched");
  return {
    ...plan,
    status: "selected",
    lens: {
      ruleKey: selected.rule.key,
      role: selected.rule.role,
      mechanism: selected.rule.mechanism,
      anchorCycleKey: primary.cycle_key,
      dependsOn: ["C1", "I1"],
      evidenceId: "NL1",
      evidence: structuredClone(selected.evidence),
      screen: {
        accuracy: manifest.accuracy,
        sampleOffsetsMinutes: [...manifest.sampleOffsetsMinutes],
        sampleEngines: [...manifest.sampleEngines],
      },
    },
  };
}
