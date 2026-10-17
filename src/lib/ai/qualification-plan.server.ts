import { createHash } from "node:crypto";
import type { ContentBundle } from "../content/default-bundle";
import { transitCopyIdentity } from "../content/natal-candidate-bundle";
import { prepareSyntheticEvaluationCase } from "./reading-evaluation.server";
import { getEvaluationCaseSet, type EvaluationCaseSetId } from "./evaluation-case-sets";
import type { FrozenContentComparisonPlan } from "./content-comparison-plan.server";
import { qualificationPolicy, type QualificationProfile } from "./qualification-profiles";
import {
  DAILY_PROMPT_VERSION,
  DAILY_READING_PLAN_VERSION,
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
import { transitEvaluationMetadata } from "./reading-evaluation.transit";
import { DAILY_WRITING_PLAN_VERSION } from "../content/daily-writing";
import { DAILY_REFLECTION_VERSION } from "../content/daily-reflection";
import { PRIMARY_REFLECTION_VERSION } from "../content/primary-composition";
import { DAILY_WRITING_QUALITY_VERSION } from "./daily-writing-quality";
import {
  DAILY_VOICE_EXAMPLES_VERSION,
  EDITORIAL_DAILY_PROMPT_VERSION,
  EDITORIAL_DAILY_VALIDATOR_VERSION,
  EDITORIAL_DAILY_VOICE_VERSION,
} from "./daily-voice";
import { assertSyntheticTransportControl, type EnterpriseThinkingLevel } from "./admin-transport";
import {
  CONTEXT_DAILY_PROMPT_VERSION,
  CONTEXT_DAILY_VALIDATOR_VERSION,
  CONTEXT_DAILY_VOICE_VERSION,
  toDailyContextBrief,
} from "./daily-context-writing";
import { CONTEXT_PILOT_CASE_SET_ID } from "./context-pilot";

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
  caseSetId: EvaluationCaseSetId = "synthetic-daily-7",
) {
  const bounded =
    Boolean(profile) ||
    caseSetId === "draft-pilot-1" ||
    caseSetId === "draft-pilot-2" ||
    caseSetId === "daily-editorial-1" ||
    caseSetId === CONTEXT_PILOT_CASE_SET_ID;
  if (bounded && (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha)))
    throw Error("Qualification requires the exact built source SHA.");
  if (profile && caseSetId !== "synthetic-daily-7")
    throw Error("Writing qualification profiles require their original case set.");
  const manifest = getEvaluationCaseSet(caseSetId);
  if (hash(manifest.cases) !== manifest.caseSetHash)
    throw Error("The fixed evaluation case set failed its integrity check.");
  const policy = profile ? qualificationPolicy(profile) : null;
  const cases = manifest.cases.map((fixed) => {
    const prepared = prepareSyntheticEvaluationCase(fixed.id, bundle, profile, caseSetId);
    const dry = {
      id: fixed.id,
      ...(prepared.contextBenchmark
        ? { contextSourceHash: prepared.contextBenchmark.sourceHash }
        : {}),
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
      writingBrief:
        caseSetId === CONTEXT_PILOT_CASE_SET_ID
          ? toDailyContextBrief(prepared.facts, fixed.config.tone, fixed.config.depth)
          : prepared.input.writing
            ? toDailyWritingBrief(prepared.input.writing.plan)
            : null,
      expectsModel: prepared.input.hasEligibleCycles && prepared.facts.some((f) => f.id === "I1"),
    };
    return { ...dry, planHash: hash(dry) };
  });
  const editorial = cases.length > 0 && cases.every((item) => !!item.writingPlan.editorial);
  const contextCandidate = caseSetId === CONTEXT_PILOT_CASE_SET_ID;
  const concrete =
    contextCandidate || (policy ? policy.writing : bundle.schemaVersion === 5 || editorial);
  const transitMetadata = transitEvaluationMetadata(caseSetId);
  const metadata = {
    sourceSha,
    fixtureVersion: manifest.fixtureVersion,
    caseSetHash: manifest.caseSetHash,
    ...(caseSetId !== "synthetic-daily-7"
      ? {
          caseSetId,
          transitCopyHash: hash(transitCopyIdentity(bundle)),
          planVersion: DAILY_READING_PLAN_VERSION,
        }
      : {}),
    bundleVersion: bundle.version,
    bundleHash: hash(bundle),
    qualificationProfile: profile ?? null,
    qualificationPolicyVersion: policy?.version ?? null,
    promptVersion: contextCandidate
      ? CONTEXT_DAILY_PROMPT_VERSION
      : editorial
        ? EDITORIAL_DAILY_PROMPT_VERSION
        : concrete
          ? CONCRETE_DAILY_PROMPT_VERSION
          : DAILY_PROMPT_VERSION,
    validatorVersion: contextCandidate
      ? CONTEXT_DAILY_VALIDATOR_VERSION
      : editorial
        ? EDITORIAL_DAILY_VALIDATOR_VERSION
        : concrete
          ? CONCRETE_DAILY_VALIDATOR_VERSION
          : DAILY_VALIDATOR_VERSION,
    model: languageModel(provider),
    gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
    requestPolicyVersion: EVALUATION_REQUEST_POLICY_VERSION,
    ...transitMetadata,
    storyUse: policy?.transit ?? transitMetadata.storyUse,
    natalPlanVersion: NATAL_LENS_PLAN_VERSION,
    reliabilityVersion: NATAL_RELIABILITY_VERSION,
    writingPlanVersion: concrete ? DAILY_WRITING_PLAN_VERSION : null,
    writingQualityVersion: concrete ? DAILY_WRITING_QUALITY_VERSION : null,
    reflectionVersion: concrete
      ? DAILY_REFLECTION_VERSION
      : bundle.schemaVersion === 4
        ? PRIMARY_REFLECTION_VERSION
        : null,
    voiceExamplesVersion: contextCandidate
      ? CONTEXT_DAILY_VOICE_VERSION
      : editorial
        ? EDITORIAL_DAILY_VOICE_VERSION
        : concrete
          ? DAILY_VOICE_EXAMPLES_VERSION
          : null,
    maxOutputTokens: bounded ? 65536 : null,
    maxInputBytes: bounded ? 65536 : null,
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
  contentComparison?: {
    arm: "baseline" | "candidate";
    pair: FrozenContentComparisonPlan;
  };
  campaignPlans?: Record<QualificationProfile, ReturnType<typeof createEvaluationPlan>>;
  pilotPlans?: Record<EnterpriseThinkingLevel, ReturnType<typeof createEnterprisePilotPlan>>;
  latencyProbe?: import("./latency-probe-plan.server").LatencyProbeDetails;
  editorialPilot?: import("./editorial-pilot-plan.server").EditorialPilotDetails;
  contextPilot?: import("./context-pilot-plan.server").ContextPilotDetails;
  metadata: ReturnType<typeof createEvaluationPlan>["metadata"] & {
    enterpriseThinking?: EnterpriseThinkingLevel;
    experimentVersion?:
      | "enterprise-thinking-pilot-1"
      | "daily-context-pilot-1"
      | "daily-context-pilot-2"
      | "daily-context-pilot-3"
      | "daily-context-pilot-4"
      | "daily-context-pilot-5";
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
