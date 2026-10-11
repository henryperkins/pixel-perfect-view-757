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
import { syntheticNatalReliability } from "./reading-evaluation.natal";
import {
  DAILY_PROMPT_VERSION,
  DAILY_READING_PLAN_VERSION,
  DAILY_VALIDATOR_VERSION,
  DAILY_GATEWAY_TIMEOUT_MS,
  LANGUAGE_MODEL,
} from "./diagnostics";
import { generateSyntheticReadingProse } from "./language.server";
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "./reading-evaluation.fixtures.mjs";
import type { ReadingEvaluationCaseResult } from "./reading-evaluation.shared";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export async function runSyntheticEvaluationCase(
  caseId: string,
  bundle: ContentBundle,
): Promise<ReadingEvaluationCaseResult> {
  const fixed = READING_EVAL_CASES.find((item) => item.id === caseId);
  if (!fixed) throw new Error("Unknown fixed synthetic evaluation case");
  const reference = localNoon(fixed.config.day, fixed.config.timeZone);
  const cycles = fixed.cycles.map((cycle) => ({
    ...cycle,
    days_to_exact: daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone),
  })) as CycleInstance[];
  // These minimal chart plans deliberately contain no birth coordinates, timestamp or identity.
  const chart = fixed.chart as unknown as Chart;
  const natalReliability = syntheticNatalReliability(fixed);
  const assembled = assembleReading(
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
    bundle,
    natalReliability,
  );
  const facts = readingFacts(chart, assembled, fixed.config.timeZone);
  const observed = await generateSyntheticReadingProse({
    facts,
    hasEligibleCycles: assembled.eligibleCycles.length > 0,
    tone: fixed.config.tone,
    depth: fixed.config.depth,
    suppression: {
      angles: chart.uncertainty.angleClaimsSuppressed,
      houses: !chart.uncertainty.housesReliable,
    },
    fallback: { headline: assembled.headline, body: assembled.astroBody, prompt: assembled.prompt },
  });
  const { prose } = observed;
  if (!prose.meta.diagnostics) throw new Error("Synthetic evaluation requires daily diagnostics");
  return {
    metadata: {
      reportVersion: 1,
      fixtureVersion: READING_EVAL_FIXTURE_VERSION,
      caseSetHash: hash(READING_EVAL_CASES),
      bundleVersion: bundle.version,
      bundleHash: hash(bundle),
      transitCopyHash: hash(transitCopyIdentity(bundle)),
      planVersion: DAILY_READING_PLAN_VERSION,
      natalPlanVersion: NATAL_LENS_PLAN_VERSION,
      reliabilityVersion: NATAL_RELIABILITY_VERSION,
      promptVersion: DAILY_PROMPT_VERSION,
      validatorVersion: DAILY_VALIDATOR_VERSION,
      model: LANGUAGE_MODEL,
      gatewayTimeoutMs: DAILY_GATEWAY_TIMEOUT_MS,
      source: "live-synthetic",
      network: "Live language gateway; fixed synthetic facts only",
      warning:
        "Actual model outputs for synthetic plans. This run does not establish production-user acceptance, semantic grounding, or writing quality. Manual scores remain blank.",
    },
    case: {
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
        notes: null,
      },
    },
  };
}
