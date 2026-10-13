import { createHash } from "node:crypto";
import type { ContentBundle } from "../content/default-bundle";
import {
  canonicalContentJson,
  compareContentBundles,
  type ContentComparisonEntry,
} from "../content/draft-comparison";
import type {
  ContentComparisonSource,
  ContentComparisonIdentity,
  ResolvedContentComparisonSource,
} from "../content/evaluation-source.server";
import { validateContentGraph } from "../content/schema";
import { getEvaluationCaseSet, type EvaluationCaseSet } from "./evaluation-case-sets";
import { languageModel, type LanguageProvider } from "./diagnostics";
import { createEvaluationPlan, type EvaluationPlan } from "./qualification-plan.server";

export type ContentComparisonArm = "baseline" | "candidate";
type DryPlan = ReturnType<typeof createEvaluationPlan>;

export interface FrozenContentComparisonPlan {
  version: "content-comparison-1";
  sourceSha: string;
  provider: LanguageProvider;
  model: string;
  caseSetId: "draft-pilot-1";
  caseManifest: EvaluationCaseSet;
  source: ContentComparisonSource;
  bundles: { baseline: ContentBundle; candidate: ContentBundle };
  identities: { baseline: ContentComparisonIdentity; candidate: ContentComparisonIdentity };
  changedKeys: string[];
  changes: ContentComparisonEntry[];
  arms: { baseline: DryPlan; candidate: DryPlan };
  attemptLimit: 8;
  hash: string;
}

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const canonicalHash = (value: unknown) =>
  createHash("sha256").update(canonicalContentJson(value)).digest("hex");
const MAX_PLAN_BYTES = 1_900_000;

function assertSourceIdentity(bundle: ContentBundle, identity: ContentComparisonIdentity): void {
  validateContentGraph(bundle);
  if (
    !identity ||
    identity.version !== bundle.version ||
    identity.checksumAlgorithm !== "sha256-canonical-json-v1" ||
    identity.canonicalHash !== canonicalHash(bundle) ||
    identity.bundleHashAlgorithm !== "sha256-json-stringify-v1" ||
    identity.bundleHash !== hash(bundle) ||
    (identity.storedChecksumAlgorithm === "sha256-canonical-json-v1" &&
      identity.storedChecksum !== identity.canonicalHash) ||
    (identity.storedChecksumAlgorithm === null && identity.storedChecksum !== null) ||
    ![null, "legacy-unlabelled", "sha256-canonical-json-v1"].includes(
      identity.storedChecksumAlgorithm,
    )
  )
    throw Error("The frozen comparison source identity failed its integrity check.");
}

/** Offline preparation only: all content is copied from the already resolved source pair. */
export function createContentComparisonPlan(
  resolved: ResolvedContentComparisonSource,
  sourceSha: string | null,
  provider: LanguageProvider,
): FrozenContentComparisonPlan {
  if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
    throw Error("A content comparison requires the exact built source SHA.");
  if (provider !== "lovable" && provider !== "gemini-enterprise")
    throw Error("A content comparison requires an explicit supported provider.");
  for (const arm of ["baseline", "candidate"] as const)
    assertSourceIdentity(resolved[arm], resolved.identities[arm]);
  const comparison = compareContentBundles(
    resolved.baseline as unknown as Record<string, unknown>,
    resolved.candidate as unknown as Record<string, unknown>,
  );
  const changes = comparison.entries.filter((entry) => entry.change !== "unchanged");
  const changedKeys = changes
    .filter((entry) => entry.kind === "entry" && entry.section === "cycles")
    .map((entry) => entry.key);
  if (
    !changes.length ||
    hash(changes) !== hash(resolved.changes) ||
    hash(changedKeys) !== hash(resolved.changedKeys)
  )
    throw Error("The frozen comparison changes failed their integrity check.");
  const caseManifest = getEvaluationCaseSet("draft-pilot-1");
  const arms = {
    baseline: createEvaluationPlan(
      resolved.baseline,
      undefined,
      sourceSha,
      provider,
      caseManifest.id,
    ),
    candidate: createEvaluationPlan(
      resolved.candidate,
      undefined,
      sourceSha,
      provider,
      caseManifest.id,
    ),
  };
  if (
    caseManifest.cases.length !== 4 ||
    arms.baseline.attemptLimit !== 4 ||
    arms.candidate.attemptLimit !== 4 ||
    arms.baseline.cases.length !== 4 ||
    arms.candidate.cases.length !== 4
  )
    throw Error("The approved content comparison scope must remain four cases and eight attempts.");
  const requiredKeys = ["hard:mars:*", "hard:uranus:*", "soft:saturn:*", "soft:neptune:*"];
  if (
    arms.candidate.cases.some(
      (item, index) =>
        item.interpretationPlan.interpretations[0]?.interpretationKey !== requiredKeys[index] ||
        !changedKeys.includes(requiredKeys[index]!),
    )
  )
    throw Error("The fixed content pilot coverage no longer selects its declared changed entries.");
  const frozen = structuredClone({
    version: "content-comparison-1" as const,
    sourceSha,
    provider,
    model: languageModel(provider),
    caseSetId: "draft-pilot-1" as const,
    caseManifest,
    source: resolved.source,
    bundles: { baseline: resolved.baseline, candidate: resolved.candidate },
    identities: resolved.identities,
    changedKeys,
    changes,
    arms,
    attemptLimit: 8 as const,
  });
  const pair = { ...frozen, hash: hash(frozen) };
  if (Buffer.byteLength(JSON.stringify(pair), "utf8") > MAX_PLAN_BYTES)
    throw Error("The frozen comparison plan exceeds the persisted plan limit.");
  return pair;
}

export function contentComparisonArmPlan(
  pair: FrozenContentComparisonPlan,
  arm: ContentComparisonArm,
): EvaluationPlan {
  if (arm !== "baseline" && arm !== "candidate") throw Error("Unknown content comparison arm.");
  const { hash: _previousHash, ...dry } = pair.arms[arm];
  const frozen = structuredClone({ ...dry, contentComparison: { arm, pair } });
  const plan: EvaluationPlan = { ...frozen, hash: hash(frozen) };
  if (Buffer.byteLength(JSON.stringify(plan), "utf8") > MAX_PLAN_BYTES)
    throw Error("The frozen comparison arm exceeds the persisted plan limit.");
  return plan;
}

/** Rebuild with current code using only the stored snapshots, never current editorial rows. */
export function revalidateContentComparisonPlan(
  pair: FrozenContentComparisonPlan,
  sourceSha: string | null,
  provider: LanguageProvider,
): FrozenContentComparisonPlan {
  if (
    !pair ||
    pair.version !== "content-comparison-1" ||
    pair.caseSetId !== "draft-pilot-1" ||
    pair.attemptLimit !== 8
  )
    throw Error("The frozen content comparison scope failed its integrity check.");
  if (pair.sourceSha !== sourceSha)
    throw Error("The content comparison source identity changed. The frozen run cannot continue.");
  if (pair.provider !== provider)
    throw Error("The content comparison provider changed. The frozen run cannot continue.");
  const { hash: expected, ...frozen } = pair;
  if (expected !== hash(frozen))
    throw Error("The content comparison pair hash failed its integrity check.");
  const rebuilt = createContentComparisonPlan(
    {
      source: pair.source,
      baseline: pair.bundles.baseline,
      candidate: pair.bundles.candidate,
      identities: pair.identities,
      changedKeys: pair.changedKeys,
      changes: pair.changes,
      guards: [],
    },
    sourceSha,
    provider,
  );
  if (rebuilt.hash !== expected)
    throw Error("The content comparison runtime, fixture, or policy identity drifted.");
  return rebuilt;
}
