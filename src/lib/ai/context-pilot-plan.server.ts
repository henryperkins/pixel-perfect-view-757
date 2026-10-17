/** Immutable production-path synthetic plan; no provider calls, member reads or release pointer access. */
import { createHash } from "node:crypto";
import bundleData from "../content/context-pilot-bundle.json";
import benchmarkBytes from "./context-writing-benchmarks.json?raw";
import materialBytes from "./context-writing-material.json?raw";
import memberAdapterBytes from "./member-context-reading.ts?raw";
import runtimeFallbackBytes from "./member-context-readings.json?raw";
import {
  MEMBER_CONTEXT_READING_VERSION,
  MEMBER_CONTEXT_FALLBACK_VERSION,
} from "./member-context-reading";
import type { ContentBundle } from "../content/default-bundle";
import { canonicalContentJson } from "../content/draft-comparison";
import { validateContentGraph } from "../content/schema";
import { languageModel, type LanguageProvider } from "./diagnostics";
import { getEvaluationCaseSet } from "./evaluation-case-sets";
import {
  CONTEXT_SOURCE_FIXTURES,
  CONTEXT_WRITING_BENCHMARKS,
} from "./reading-evaluation.context.fixtures";
import { createEvaluationPlan, type EvaluationPlan } from "./qualification-plan.server";
import { CONTEXT_DAILY_MATERIAL_VERSION } from "./daily-context-writing";
import {
  CONTEXT_PILOT_VERSION,
  CONTEXT_PILOT_CASE_SET_ID,
  CONTEXT_PILOT_CASE_IDS,
  CONTEXT_PILOT_PROVIDER,
  CONTEXT_PILOT_ATTEMPT_LIMIT,
  CONTEXT_PILOT_DOLLAR_CEILING_MICROS,
  CONTEXT_PILOT_REVIEW_RUBRIC,
} from "./context-pilot";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const canonicalHash = (value: unknown) =>
  createHash("sha256").update(canonicalContentJson(value)).digest("hex");
const sourceGraph = (facts: { id: string }[]) =>
  canonicalContentJson([...facts].sort((a, b) => a.id.localeCompare(b.id)));
const EXPECTED_BENCHMARK_HASH = "825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024";
const EXPECTED_BUNDLE_HASH = "d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f";
const EXPECTED_RUNTIME_FALLBACK_HASH =
  "de37f4d42308bec8acbc7fff346a4bd8a446698eae1041b0ac1d3539e9bd2703";
const EXPECTED_MATERIAL_HASH = "40a86ccab103f37f6b28db1e1aef8313f142d2cb7af6c0f8806f483eabf665b8";

export function createContextPilotPlan(sourceSha: string | null, provider: LanguageProvider) {
  if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
    throw Error("The context pilot requires the exact built source SHA.");
  if (provider !== CONTEXT_PILOT_PROVIDER)
    throw Error("The context pilot requires the member Gemini Enterprise provider.");
  const candidate = structuredClone(bundleData) as unknown as ContentBundle;
  validateContentGraph(candidate);
  const benchmarkHash = createHash("sha256").update(benchmarkBytes).digest("hex");
  const materialHash = createHash("sha256").update(materialBytes).digest("hex");
  const materials = JSON.parse(materialBytes) as {
    version: string;
    sources: Record<string, unknown>[];
    compositions: { mode: string }[];
  };
  if (
    benchmarkHash !== EXPECTED_BENCHMARK_HASH ||
    canonicalHash(candidate) !== EXPECTED_BUNDLE_HASH ||
    materialHash !== EXPECTED_MATERIAL_HASH ||
    materials.version !== CONTEXT_DAILY_MATERIAL_VERSION ||
    !Array.isArray(materials.sources) ||
    !materials.sources.length ||
    !Array.isArray(materials.compositions) ||
    JSON.stringify(materials.compositions.map((item) => item.mode)) !==
      JSON.stringify(CONTEXT_PILOT_CASE_IDS)
  )
    throw Error("The frozen reviewed context benchmarks, source bundle or material changed.");
  const runtimeFallbacks = JSON.parse(
    runtimeFallbackBytes,
  ) as typeof import("./member-context-readings.json");
  if (
    createHash("sha256").update(runtimeFallbackBytes).digest("hex") !==
      EXPECTED_RUNTIME_FALLBACK_HASH ||
    runtimeFallbacks.version !== MEMBER_CONTEXT_FALLBACK_VERSION ||
    runtimeFallbacks.materialVersion !== materials.version ||
    JSON.stringify(runtimeFallbacks.cases.map((item) => item.id)) !==
      JSON.stringify(CONTEXT_PILOT_CASE_IDS)
  )
    throw Error("The reviewed member runtime fallback identity or scope changed.");
  const benchmarks = structuredClone(CONTEXT_WRITING_BENCHMARKS);
  const originalFixtures = CONTEXT_SOURCE_FIXTURES.map((fixture, index) => {
    if (hash(fixture) !== benchmarks.cases[index]?.fixture.baseSha256)
      throw Error("The reviewed context source fixture changed.");
    return { fixture: structuredClone(fixture), configHash: hash(fixture) };
  });
  const caseManifest = getEvaluationCaseSet(CONTEXT_PILOT_CASE_SET_ID);
  const base = createEvaluationPlan(candidate, undefined, sourceSha, provider, caseManifest.id);
  if (
    base.attemptLimit !== CONTEXT_PILOT_ATTEMPT_LIMIT ||
    JSON.stringify(base.cases.map((item) => item.id)) !== JSON.stringify(CONTEXT_PILOT_CASE_IDS) ||
    base.cases.some(
      (item, index) =>
        !item.expectsModel ||
        sourceGraph(item.facts) !== sourceGraph(benchmarks.cases[index]!.selectedSources),
    )
  )
    throw Error("The closed context pilot scope or selected source identity changed.");
  const contextPilot = {
    version: CONTEXT_PILOT_VERSION,
    runtimePath: "member-production-context" as const,
    allowedModes: [...CONTEXT_PILOT_CASE_IDS],
    rolloutScope: "admin-workflow-only" as const,
    memberAdapterVersion: MEMBER_CONTEXT_READING_VERSION,
    memberAdapterHash: createHash("sha256").update(memberAdapterBytes).digest("hex"),
    runtimeFallbackVersion: runtimeFallbacks.version,
    runtimeFallbackHash: createHash("sha256").update(runtimeFallbackBytes).digest("hex"),
    runtimeFallbacks,
    provider,
    model: languageModel(provider),
    caseSetId: CONTEXT_PILOT_CASE_SET_ID,
    caseManifest,
    candidate,
    candidateHash: hash(candidate),
    candidateCanonicalHash: canonicalHash(candidate),
    benchmarks,
    benchmarkHash,
    materialHash,
    materialVersion: materials.version,
    materials,
    originalFixtures,
    dollarCeilingMicros: CONTEXT_PILOT_DOLLAR_CEILING_MICROS,
    reviewReserveMicros: 0,
    reviewRubric: CONTEXT_PILOT_REVIEW_RUBRIC,
  };
  const { hash: _previous, ...dry } = base;
  const frozen = structuredClone({
    ...dry,
    metadata: { ...dry.metadata, experimentVersion: CONTEXT_PILOT_VERSION },
    contextPilot,
  });
  const plan = { ...frozen, hash: hash(frozen) };
  if (Buffer.byteLength(JSON.stringify(plan)) > 1_900_000)
    throw Error("The frozen context pilot exceeds the database row size.");
  return plan;
}
export type ContextPilotPlan = ReturnType<typeof createContextPilotPlan>;
export type ContextPilotDetails = ContextPilotPlan["contextPilot"];

export function revalidateContextPilotPlan(
  stored: EvaluationPlan,
  sourceSha: string | null,
  provider: LanguageProvider,
): ContextPilotPlan {
  if (
    !stored.contextPilot ||
    stored.contextPilot.version !== CONTEXT_PILOT_VERSION ||
    stored.sourceSha !== sourceSha ||
    stored.contextPilot.provider !== provider
  )
    throw Error("The frozen context pilot source or provider changed.");
  const { hash: expected, ...frozen } = stored;
  if (hash(frozen) !== expected)
    throw Error("The frozen context pilot hash failed its integrity check.");
  const rebuilt = createContextPilotPlan(sourceSha, provider);
  if (rebuilt.hash !== expected)
    throw Error("The context pilot runtime, candidate, fixture or policy changed.");
  return rebuilt;
}
