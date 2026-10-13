import { createHash } from "node:crypto";
import type { ContentBundle } from "../content/default-bundle";
import { prepareSyntheticEvaluationCase } from "./reading-evaluation.server";
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "./reading-evaluation.fixtures.mjs";
import { qualificationPolicy, type QualificationProfile } from "./qualification-profiles";
import {
  DAILY_PROMPT_VERSION,
  DAILY_VALIDATOR_VERSION,
  CONCRETE_DAILY_PROMPT_VERSION,
  CONCRETE_DAILY_VALIDATOR_VERSION,
  DAILY_GATEWAY_TIMEOUT_MS,
  languageModel,
  type LanguageProvider,
} from "./diagnostics";
import { toDailyWritingBrief } from "../content/daily-writing";
import { dailyPlanIdentity } from "../content/synthesis";
import { NATAL_LENS_PLAN_VERSION } from "../content/natal-lens";
import { NATAL_RELIABILITY_VERSION } from "../astro/natal-reliability";
import { TRANSIT_EVALUATION_METADATA } from "./reading-evaluation.transit";
import { DAILY_WRITING_PLAN_VERSION } from "../content/daily-writing";
import { DAILY_REFLECTION_VERSION } from "../content/daily-reflection";
import { DAILY_WRITING_QUALITY_VERSION } from "./daily-writing-quality";
import { DAILY_VOICE_EXAMPLES_VERSION } from "./daily-voice";
import { assertSyntheticTransportControl, type EnterpriseThinkingLevel } from "./admin-transport";

declare const __PATTERN_SOURCE_SHA__: string | null;
export function evaluationSourceSha(): string | null {
  return typeof __PATTERN_SOURCE_SHA__ === "undefined" ? null : __PATTERN_SOURCE_SHA__;
}
export const EVALUATION_REQUEST_POLICY_VERSION = "synthetic-facts-local-context-1";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** Pure fixed-case freeze: no provider configuration, account reads or transport. */
export function createEvaluationPlan(
  bundle: ContentBundle,
  profile: QualificationProfile | undefined,
  sourceSha: string | null,
  provider: LanguageProvider = "lovable",
) {
  if (profile && (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha)))
    throw Error("Qualification requires the exact built source SHA.");
  const policy = profile ? qualificationPolicy(profile) : null;
  const concrete = policy ? policy.writing : bundle.schemaVersion === 5;
  const cases = READING_EVAL_CASES.map((fixed) => {
    const prepared = prepareSyntheticEvaluationCase(fixed.id, bundle, profile);
    const dry = {
      id: fixed.id,
      configHash: hash(fixed),
      facts: prepared.facts,
      interpretationPlan: dailyPlanIdentity(prepared.assembled.interpretationPlan),
      natalLensPlan: prepared.assembled.natalLensPlan,
      natalReliability: prepared.natalReliability,
      transitStoryPlan: prepared.assembled.transitStoryPlan,
      writingPlan: prepared.assembled.writingPlan,
      reflectionPlan: prepared.assembled.reflectionPlan,
      template: {
        headline: prepared.assembled.headline,
        body: prepared.assembled.astroBody,
        prompt: prepared.assembled.prompt,
      },
      writingBrief: prepared.input.writing
        ? toDailyWritingBrief(prepared.input.writing.plan)
        : null,
      expectsModel: prepared.input.hasEligibleCycles && prepared.facts.some((f) => f.id === "I1"),
    };
    return { ...dry, planHash: hash(dry) };
  });
  const metadata = {
    sourceSha,
    fixtureVersion: READING_EVAL_FIXTURE_VERSION,
    caseSetHash: hash(READING_EVAL_CASES),
    bundleVersion: bundle.version,
    bundleHash: hash(bundle),
    qualificationProfile: profile ?? null,
    qualificationPolicyVersion: policy?.version ?? null,
    promptVersion: concrete ? CONCRETE_DAILY_PROMPT_VERSION : DAILY_PROMPT_VERSION,
    validatorVersion: concrete ? CONCRETE_DAILY_VALIDATOR_VERSION : DAILY_VALIDATOR_VERSION,
    model: languageModel(provider),
    gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
    requestPolicyVersion: EVALUATION_REQUEST_POLICY_VERSION,
    ...TRANSIT_EVALUATION_METADATA,
    storyUse: policy?.transit ?? TRANSIT_EVALUATION_METADATA.storyUse,
    natalPlanVersion: NATAL_LENS_PLAN_VERSION,
    reliabilityVersion: NATAL_RELIABILITY_VERSION,
    writingPlanVersion: concrete ? DAILY_WRITING_PLAN_VERSION : null,
    writingQualityVersion: concrete ? DAILY_WRITING_QUALITY_VERSION : null,
    reflectionVersion: concrete ? DAILY_REFLECTION_VERSION : null,
    voiceExamplesVersion: concrete ? DAILY_VOICE_EXAMPLES_VERSION : null,
    maxOutputTokens: profile ? 65536 : null,
    maxInputBytes: profile ? 65536 : null,
  };
  const plan = {
    version: "synthetic-evaluation-plan-1",
    sourceSha,
    metadata,
    attemptLimit: cases.filter((c) => c.expectsModel).length,
    cases,
  };
  return { ...plan, hash: hash(plan) };
}
export function createQualificationPlan(
  bundle: ContentBundle,
  profile: QualificationProfile,
  sourceSha: string | null,
) {
  return createEvaluationPlan(bundle, profile, sourceSha, "lovable");
}
export type EvaluationPlan = ReturnType<typeof createEvaluationPlan> & {
  campaignPlans?: Record<QualificationProfile, ReturnType<typeof createEvaluationPlan>>;
  pilotPlans?: Record<EnterpriseThinkingLevel, ReturnType<typeof createEnterprisePilotPlan>>;
  metadata: ReturnType<typeof createEvaluationPlan>["metadata"] & {
    enterpriseThinking?: EnterpriseThinkingLevel;
    experimentVersion?: "enterprise-thinking-pilot-1";
  };
};
export const ENTERPRISE_PILOT_CASES = [
  "saturn-square-sun",
  "arc-opening-three",
  "arc-return-three",
  "arc-closing-three",
  "arc-return-five",
  "arc-between-passes",
] as const;
/** Two repetitions are independent planned observations, never retries of failed calls. */
export function createEnterprisePilotPlan(
  bundle: ContentBundle,
  thinking: EnterpriseThinkingLevel,
  sourceSha: string | null,
) {
  assertSyntheticTransportControl("gemini-enterprise", {
    enterpriseThinking: thinking,
    boundedQualification: true,
  });
  if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
    throw Error("The Enterprise pilot requires the exact built source SHA.");
  const base = createEvaluationPlan(bundle, undefined, sourceSha, "gemini-enterprise");
  const selected = ENTERPRISE_PILOT_CASES.map((id) => base.cases.find((c) => c.id === id)!);
  if (selected.some((c) => !c || !c.expectsModel))
    throw Error("The fixed Enterprise pilot scope changed.");
  const plan = {
    ...base,
    metadata: {
      ...base.metadata,
      maxOutputTokens: 65536,
      maxInputBytes: 65536,
      enterpriseThinking: thinking,
      experimentVersion: "enterprise-thinking-pilot-1" as const,
    },
    cases: [...selected, ...selected],
    attemptLimit: 12,
  };
  const { hash: _previous, ...frozen } = plan;
  return { ...frozen, hash: hash(frozen) };
}
