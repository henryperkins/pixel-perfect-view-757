/** Closed synthetic evaluation runner: no accounts, database calls, reading cache or persistence. */
import { createHash } from "node:crypto";
import type { Chart } from "../astro/chart";
import type { CycleInstance } from "../astro/cycles";
import type { ContentBundle } from "../content/default-bundle";
import { transitCopyIdentity } from "../content/natal-candidate-bundle";
import { daysToLocalDate, localNoon } from "../local-day";
import { assembleReading } from "../reading.server";
import { readingFacts } from "./facts";
import { dailyPlanIdentity } from "../content/synthesis";
import { NATAL_LENS_PLAN_VERSION } from "../content/natal-lens";
import { NATAL_RELIABILITY_VERSION } from "../astro/natal-reliability";
import {
  syntheticTransitCalculation,
  TRANSIT_EVALUATION_METADATA,
} from "./reading-evaluation.transit";
import { syntheticNatalReliability } from "./reading-evaluation.natal";
import {
  DAILY_PROMPT_VERSION,
  DAILY_READING_PLAN_VERSION,
  DAILY_VALIDATOR_VERSION,
  DAILY_GATEWAY_TIMEOUT_MS,
  languageModel,
  type LanguageProvider,
} from "./diagnostics";
import { generateSyntheticReadingProse } from "./language.server";
import { composeDailyWritingTemplate } from "../content/daily-writing-template";
import { DAILY_WRITING_PLAN_VERSION } from "../content/daily-writing";
import { DAILY_REFLECTION_VERSION } from "../content/daily-reflection";
import { DAILY_WRITING_QUALITY_VERSION } from "./daily-writing-quality";
import { DAILY_VOICE_EXAMPLES_VERSION } from "./daily-voice";
import { getEvaluationCaseSet, type EvaluationCaseSetId } from "./evaluation-case-sets";
import {
  qualificationBundle,
  qualificationPolicy,
  type QualificationProfile,
} from "./qualification-profiles";
import type { ReadingEvaluationCaseResult } from "./reading-evaluation.shared";
import type { SyntheticTransportControl } from "./admin-transport";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function prepareSyntheticEvaluationCase(
  caseId: string,
  bundle: ContentBundle,
  qualificationProfile?: QualificationProfile,
  caseSetId?: EvaluationCaseSetId,
) {
  const manifest = getEvaluationCaseSet(caseSetId);
  const fixed = manifest.cases.find((item) => item.id === caseId);
  if (!fixed) throw new Error("Unknown fixed synthetic evaluation case");
  const policy = qualificationProfile ? qualificationPolicy(qualificationProfile) : null;
  const selectedBundle = qualificationProfile
    ? qualificationBundle(bundle, qualificationProfile)
    : bundle;
  const effectiveBundle =
    fixed.writingFrameMode === "none"
      ? { ...selectedBundle, dailyWritingFrames: [] }
      : selectedBundle;
  const reference = localNoon(fixed.config.day, fixed.config.timeZone);
  const cycles = fixed.cycles.map((cycle) => ({
    ...cycle,
    days_to_exact: daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone),
  })) as CycleInstance[];
  // These minimal chart plans deliberately contain no birth coordinates, timestamp or identity.
  const chart = fixed.chart as unknown as Chart;
  const natalReliability = !policy || policy.natal ? syntheticNatalReliability(fixed) : null;
  let assembled = assembleReading(
    chart,
    cycles,
    {
      granted: new Set(fixed.config.granted),
      tone: fixed.config.tone,
      depth: fixed.config.depth,
      localBucket: null,
      checkIn: null,
      wellness: null,
    },
    effectiveBundle,
    natalReliability,
  );
  const calculation =
    !policy || policy.transit
      ? syntheticTransitCalculation(fixed, assembled.eligibleCycles[0])
      : null;
  if (calculation)
    assembled = assembleReading(
      chart,
      cycles,
      {
        granted: new Set(fixed.config.granted),
        tone: fixed.config.tone,
        depth: fixed.config.depth,
        localBucket: null,
        checkIn: null,
        wellness: null,
      },
      effectiveBundle,
      natalReliability,
      calculation,
    );
  const facts = readingFacts(chart, assembled, fixed.config.timeZone);
  const input = {
    facts,
    hasEligibleCycles: assembled.eligibleCycles.length > 0,
    tone: fixed.config.tone,
    depth: fixed.config.depth,
    suppression: {
      angles: chart.uncertainty.angleClaimsSuppressed,
      houses: !chart.uncertainty.housesReliable,
    },
    fallback: {
      headline: assembled.headline,
      body: assembled.astroBody,
      prompt: assembled.prompt,
    },
    ...(assembled.writingTemplate
      ? {
          writing: {
            plan: assembled.writingPlan,
            template: assembled.writingTemplate,
            minimalTemplate: composeDailyWritingTemplate(
              assembled.writingPlan,
              assembled.natalLensPlan,
              assembled.transitStoryPlan,
              true,
            ),
            recent: fixed.recentWritingBodies ?? [],
          },
        }
      : {}),
  };
  return {
    fixed,
    reference,
    cycles,
    chart,
    natalReliability,
    assembled,
    facts,
    input,
    policy,
    manifest,
  };
}

export async function runSyntheticEvaluationCase(
  caseId: string,
  bundle: ContentBundle,
  provider: LanguageProvider = "lovable",
  qualificationProfile?: QualificationProfile,
  control: SyntheticTransportControl = {},
  caseSetId?: EvaluationCaseSetId,
): Promise<ReadingEvaluationCaseResult> {
  const { fixed, reference, natalReliability, assembled, facts, input, policy, manifest } =
    prepareSyntheticEvaluationCase(caseId, bundle, qualificationProfile, caseSetId);
  const observed = await generateSyntheticReadingProse(input, provider, {
    ...control,
    ...(qualificationProfile ? { boundedQualification: true } : {}),
  });
  const { prose } = observed;
  if (!prose.meta.diagnostics) throw new Error("Synthetic evaluation requires daily diagnostics");
  return {
    metadata: {
      reportVersion: 1,
      ...(control.enterpriseThinking
        ? {
            enterpriseThinking: control.enterpriseThinking,
            experimentVersion: "enterprise-thinking-pilot-1" as const,
          }
        : {}),
      ...(policy
        ? { qualificationProfile: policy.profile, qualificationPolicyVersion: policy.version }
        : {}),
      ...TRANSIT_EVALUATION_METADATA,
      ...(policy ? { storyUse: policy.transit } : {}),
      ...(manifest.id !== "synthetic-daily-7" ? { caseSetId: manifest.id } : {}),
      fixtureVersion: manifest.fixtureVersion,
      caseSetHash: manifest.caseSetHash,
      bundleVersion: bundle.version,
      bundleHash: hash(bundle),
      transitCopyHash: hash(transitCopyIdentity(bundle)),
      planVersion: DAILY_READING_PLAN_VERSION,
      natalPlanVersion: NATAL_LENS_PLAN_VERSION,
      reliabilityVersion: NATAL_RELIABILITY_VERSION,
      promptVersion: prose.meta.diagnostics.promptVersion,
      validatorVersion: prose.meta.diagnostics.validatorVersion,
      ...(assembled.writingTemplate
        ? {
            writingPlanVersion: DAILY_WRITING_PLAN_VERSION,
            writingQualityVersion: DAILY_WRITING_QUALITY_VERSION,
            reflectionVersion: DAILY_REFLECTION_VERSION,
            voiceExamplesVersion: DAILY_VOICE_EXAMPLES_VERSION,
          }
        : {}),
      model: languageModel(provider),
      gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
      source: "live-synthetic",
      network:
        provider === "gemini-enterprise"
          ? "Live Gemini Enterprise Agent Platform; fixed synthetic facts only"
          : "Live language gateway; fixed synthetic facts only",
      warning:
        "Actual model outputs for synthetic plans. This run does not establish production-user acceptance, semantic grounding, or writing quality. Manual scores remain blank.",
    },
    case: {
      transport: observed.transport,
      id: fixed.id,
      description: fixed.description,
      config: structuredClone(fixed.config),
      configHash: hash(fixed),
      localNoon: reference.toISOString(),
      eligibleCycleKeys: assembled.eligibleCycles.map((cycle) => cycle.cycle_key),
      facts,
      interpretationPlan: dailyPlanIdentity(assembled.interpretationPlan),
      natalLensPlan: assembled.natalLensPlan,
      natalReliability,
      transitStoryPlan: assembled.transitStoryPlan,
      ...(assembled.writingTemplate
        ? {
            writingPlan: assembled.writingPlan,
            reflectionPlan: assembled.reflectionPlan!,
            writing: prose.meta.writing!,
          }
        : {}),
      ...(fixed.writingFrameMode ? { writingFrameMode: fixed.writingFrameMode } : {}),
      request: observed.request,
      candidate: observed.candidate,
      diagnostics: prose.meta.diagnostics,
      output: {
        mode: prose.meta.mode,
        headline: prose.headline,
        body: prose.body,
        prompt: prose.prompt,
        citations: prose.meta.citations,
      },
      template: { body: assembled.astroBody },
      manualReview: {
        specificity: null,
        voice: null,
        repetition: null,
        grounding: null,
        lensIntegration: null,
        unsupportedPersonalClaim: null,
        temporalCoherence: null,
        chapterIntegration: null,
        unsupportedHistory: null,
        promisedResolution: null,
        notes: null,
      },
    },
  };
}
