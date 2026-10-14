/**
 * Frozen plan for the closed content latency probe. The plan stores the exact
 * draft-baseline snapshot and per-position thinking controls; signed steps
 * re-derive it from that snapshot and refuse drift before provider traffic.
 */
import { createHash } from "node:crypto";
import type { DBClient } from "../d1.server";
import type { ContentBundle } from "../content/default-bundle";
import { canonicalContentJson, contentChecksum } from "../content/draft-comparison";
import { CONTENT_CHECKSUM_ALGORITHM } from "../content/release-lifecycle.server";
import {
  checkedBundle,
  type ContentComparisonGuard,
  type ContentComparisonIdentity,
} from "../content/evaluation-source.server";
import {
  draftAdminGuard,
  draftUnchangedGuard,
  loadReviewedDraft,
} from "../content/content-drafts.server";
import { getEvaluationCaseSet } from "./evaluation-case-sets";
import { createEvaluationPlan, type EvaluationPlan } from "./qualification-plan.server";
import {
  LATENCY_PROBE_ATTEMPT_LIMIT,
  LATENCY_PROBE_BASELINE_CANONICAL_HASH,
  LATENCY_PROBE_CASE_SET_ID,
  LATENCY_PROBE_DEADLINE_MS,
  LATENCY_PROBE_MAX_INPUT_BYTES,
  LATENCY_PROBE_MAX_OUTPUT_TOKENS,
  LATENCY_PROBE_MODEL,
  LATENCY_PROBE_POSITIONS,
  LATENCY_PROBE_PROVIDER,
  LATENCY_PROBE_REVIEW_RUBRIC,
  LATENCY_PROBE_VERSION,
  type LatencyProbeSource,
} from "./latency-probe";
import type { EnterpriseThinkingLevel } from "./admin-transport";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const MAX_PLAN_BYTES = 1_900_000;

export type LatencyProbeCase = EvaluationPlan["cases"][number] & {
  position: number;
  thinking: EnterpriseThinkingLevel;
};

export interface LatencyProbeDetails {
  version: typeof LATENCY_PROBE_VERSION;
  provider: typeof LATENCY_PROBE_PROVIDER;
  model: typeof LATENCY_PROBE_MODEL;
  caseSetId: typeof LATENCY_PROBE_CASE_SET_ID;
  deadlineMs: typeof LATENCY_PROBE_DEADLINE_MS;
  maxInputBytes: typeof LATENCY_PROBE_MAX_INPUT_BYTES;
  maxOutputTokens: typeof LATENCY_PROBE_MAX_OUTPUT_TOKENS;
  baseline: ContentBundle;
  baselineIdentity: ContentComparisonIdentity;
  positions: readonly { caseId: string; thinking: EnterpriseThinkingLevel }[];
  reviewRubric: typeof LATENCY_PROBE_REVIEW_RUBRIC;
}

export type LatencyProbePlan = Omit<EvaluationPlan, "cases" | "attemptLimit"> & {
  cases: LatencyProbeCase[];
  attemptLimit: typeof LATENCY_PROBE_ATTEMPT_LIMIT;
  latencyProbe: LatencyProbeDetails;
};

function assertBaselineIdentity(bundle: ContentBundle, identity: ContentComparisonIdentity): void {
  if (
    identity.version !== bundle.version ||
    identity.checksumAlgorithm !== CONTENT_CHECKSUM_ALGORITHM ||
    identity.canonicalHash !==
      createHash("sha256").update(canonicalContentJson(bundle)).digest("hex") ||
    identity.bundleHashAlgorithm !== "sha256-json-stringify-v1" ||
    identity.bundleHash !== hash(bundle) ||
    identity.storedChecksumAlgorithm !== CONTENT_CHECKSUM_ALGORITHM ||
    identity.storedChecksum !== identity.canonicalHash
  )
    throw Error("The latency probe baseline identity failed its integrity check.");
}

/** Offline preparation: copies from the already resolved draft baseline; no transport. */
export function createLatencyProbePlan(
  baseline: ContentBundle,
  baselineIdentity: ContentComparisonIdentity,
  sourceSha: string | null,
): LatencyProbePlan {
  if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
    throw Error("The latency probe requires the exact built source SHA.");
  assertBaselineIdentity(baseline, baselineIdentity);
  if (baselineIdentity.canonicalHash !== LATENCY_PROBE_BASELINE_CANONICAL_HASH)
    throw Error("The latency probe baseline differs from the frozen reviewed draft baseline.");
  const manifest = getEvaluationCaseSet(LATENCY_PROBE_CASE_SET_ID);
  const base = createEvaluationPlan(
    baseline,
    undefined,
    sourceSha,
    LATENCY_PROBE_PROVIDER,
    manifest.id,
  );
  if (base.attemptLimit !== 4 || base.cases.length !== 4)
    throw Error("The latency probe fixture scope changed.");
  const cases = LATENCY_PROBE_POSITIONS.map((position, index) => {
    const planned = base.cases.find((item) => item.id === position.caseId);
    if (!planned?.expectsModel)
      throw Error("The latency probe case is missing from its fixed manifest.");
    return { ...planned, position: index, thinking: position.thinking };
  });
  const latencyProbe: LatencyProbeDetails = {
    version: LATENCY_PROBE_VERSION,
    provider: LATENCY_PROBE_PROVIDER,
    model: LATENCY_PROBE_MODEL,
    caseSetId: LATENCY_PROBE_CASE_SET_ID,
    deadlineMs: LATENCY_PROBE_DEADLINE_MS,
    maxInputBytes: LATENCY_PROBE_MAX_INPUT_BYTES,
    maxOutputTokens: LATENCY_PROBE_MAX_OUTPUT_TOKENS,
    baseline,
    baselineIdentity,
    positions: LATENCY_PROBE_POSITIONS,
    reviewRubric: LATENCY_PROBE_REVIEW_RUBRIC,
  };
  const { hash: _dryHash, ...dry } = base;
  const frozen: Omit<LatencyProbePlan, "hash"> = structuredClone({
    ...dry,
    cases,
    attemptLimit: LATENCY_PROBE_ATTEMPT_LIMIT,
    latencyProbe,
  });
  const plan = { ...frozen, hash: hash(frozen) };
  if (Buffer.byteLength(JSON.stringify(plan), "utf8") > MAX_PLAN_BYTES)
    throw Error("The frozen latency probe plan exceeds the persisted plan limit.");
  return plan;
}

/** Rebuild with current code from the stored snapshot only; drift stops the run. */
export function revalidateLatencyProbePlan(
  stored: LatencyProbePlan,
  sourceSha: string | null,
): LatencyProbePlan {
  const details = stored?.latencyProbe;
  if (
    !details ||
    details.version !== LATENCY_PROBE_VERSION ||
    details.provider !== LATENCY_PROBE_PROVIDER ||
    details.caseSetId !== LATENCY_PROBE_CASE_SET_ID ||
    stored.attemptLimit !== LATENCY_PROBE_ATTEMPT_LIMIT ||
    stored.cases.length !== LATENCY_PROBE_ATTEMPT_LIMIT ||
    details.positions.length !== LATENCY_PROBE_POSITIONS.length ||
    details.positions.some(
      (position, index) =>
        position.caseId !== LATENCY_PROBE_POSITIONS[index]!.caseId ||
        position.thinking !== LATENCY_PROBE_POSITIONS[index]!.thinking,
    ) ||
    stored.cases.some(
      (planned, index) =>
        planned.position !== index ||
        planned.id !== LATENCY_PROBE_POSITIONS[index]!.caseId ||
        planned.thinking !== LATENCY_PROBE_POSITIONS[index]!.thinking,
    )
  )
    throw Error("The frozen latency probe scope failed its integrity check.");
  if (stored.sourceSha !== sourceSha)
    throw Error("The latency probe source identity changed. The frozen run cannot continue.");
  const { hash: expected, ...frozen } = stored;
  if (expected !== hash(frozen)) throw Error("The latency probe plan hash failed its check.");
  const rebuilt = createLatencyProbePlan(details.baseline, details.baselineIdentity, sourceSha);
  if (rebuilt.hash !== expected)
    throw Error("The latency probe runtime, fixture or policy identity drifted.");
  return rebuilt;
}

/** Resolve the pinned reviewed draft baseline without approval, publication or transport. */
export async function resolveLatencyProbeSource(
  db: DBClient,
  userId: string,
  source: LatencyProbeSource,
): Promise<{
  baseline: ContentBundle;
  baselineIdentity: ContentComparisonIdentity;
  guards: ContentComparisonGuard[];
}> {
  const draft = await loadReviewedDraft(db, userId, source.draftId);
  if (!draft.base_bundle || !draft.base_hash)
    throw Error("The reviewed draft baseline is unavailable; the probe cannot invent one.");
  const baseline = checkedBundle(draft.base_bundle);
  const canonicalHash = await contentChecksum(baseline);
  if (canonicalHash !== draft.base_hash || canonicalHash !== LATENCY_PROBE_BASELINE_CANONICAL_HASH)
    throw Error("The draft baseline differs from the frozen latency probe baseline.");
  const baselineIdentity: ContentComparisonIdentity = {
    version: baseline.version,
    canonicalHash,
    checksumAlgorithm: CONTENT_CHECKSUM_ALGORITHM,
    bundleHash: hash(baseline),
    bundleHashAlgorithm: "sha256-json-stringify-v1",
    storedChecksum: draft.base_hash,
    storedChecksumAlgorithm: CONTENT_CHECKSUM_ALGORITHM,
  };
  return {
    baseline,
    baselineIdentity,
    guards: [draftAdminGuard(userId), draftUnchangedGuard(draft)],
  };
}
