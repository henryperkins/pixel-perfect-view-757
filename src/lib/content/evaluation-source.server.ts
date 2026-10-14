import { createHash } from "node:crypto";
import type { DBClient } from "../d1.server";
import type { ContentBundle } from "./default-bundle";
import {
  draftAdminGuard,
  draftUnchangedGuard,
  loadReviewedDraft,
  requireDraftAdmin,
} from "./content-drafts.server";
import {
  compareContentBundles,
  contentChecksum,
  type ContentComparisonEntry,
} from "./draft-comparison";
import { CONTENT_CHECKSUM_ALGORITHM } from "./release-lifecycle.server";
import { validateContentGraph } from "./schema";

export type ContentComparisonSource =
  | { kind: "draft"; draftId: string }
  | { kind: "release"; releaseId: string; baselineReleaseId: string };

export type ContentComparisonGuard = {
  sql: string;
  params: (string | number | null)[];
};

export interface ContentComparisonIdentity {
  version: string;
  canonicalHash: string;
  checksumAlgorithm: typeof CONTENT_CHECKSUM_ALGORITHM;
  /** Existing evaluation hash: object key order is intentionally significant. */
  bundleHash: string;
  bundleHashAlgorithm: "sha256-json-stringify-v1";
  /** The persisted checksum is evidence, not an alias for a recalculated hash. */
  storedChecksum: string | null;
  storedChecksumAlgorithm: typeof CONTENT_CHECKSUM_ALGORITHM | "legacy-unlabelled" | null;
}

export interface ResolvedContentComparisonSource {
  source: ContentComparisonSource;
  baseline: ContentBundle;
  candidate: ContentBundle;
  identities: {
    baseline: ContentComparisonIdentity;
    candidate: ContentComparisonIdentity;
  };
  /** Interpretation keys; changes below retain all other source differences. */
  changedKeys: string[];
  changes: ContentComparisonEntry[];
  /** Execute atomically with the initial run insert; never persist these as a run snapshot. */
  guards: ContentComparisonGuard[];
}

interface SourceRelease {
  id: string;
  version: string;
  checksum: string;
  checksum_algorithm: string | null;
  bundle: Record<string, unknown>;
  bundle_identity: string;
  is_active: boolean;
}

function checkedSource(input: ContentComparisonSource): ContentComparisonSource {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid content comparison source selector.");
  const keys =
    input.kind === "draft"
      ? ["kind", "draftId"]
      : input.kind === "release"
        ? ["kind", "releaseId", "baselineReleaseId"]
        : [];
  if (
    !keys.length ||
    Object.keys(input).length !== keys.length ||
    Object.keys(input).some((key) => !keys.includes(key)) ||
    keys.some((key) => {
      const value = (input as unknown as Record<string, unknown>)[key];
      return typeof value !== "string" || !value.trim() || value.length > 200;
    })
  )
    throw new Error("Invalid content comparison source selector or source ID.");
  if (input.kind === "release" && input.releaseId === input.baselineReleaseId)
    throw new Error("The baseline and candidate must be different releases.");
  return { ...input };
}

export function checkedBundle(raw: Record<string, unknown>): ContentBundle {
  validateContentGraph(raw);
  if (typeof raw["version"] !== "string" || !raw["version"].trim())
    throw new Error("The content comparison source is missing its original bundle version.");
  // A comparison must not silently fill missing source sections from today's built-in copy.
  if (
    !Array.isArray(raw["cycles"]) ||
    ["natal", "phases", "domains"].some((key) => {
      const value = raw[key];
      return !value || typeof value !== "object" || Array.isArray(value);
    })
  )
    throw new Error("The content comparison source requires a complete frozen bundle.");
  if (
    Object.values(raw["natal"] as Record<string, unknown>).some(
      (value) => typeof value !== "string",
    )
  )
    throw new Error("The content comparison source contains invalid natal copy.");
  for (const domain of Object.values(raw["domains"] as Record<string, unknown>)) {
    if (
      !domain ||
      typeof domain !== "object" ||
      Array.isArray(domain) ||
      ["label", "hard", "soft", "prompt"].some(
        (key) => typeof (domain as Record<string, unknown>)[key] !== "string",
      )
    )
      throw new Error("The content comparison source contains incomplete domain copy.");
  }
  if (JSON.stringify(raw).length > 1_000_000)
    throw new Error("The content comparison source exceeds the content limit.");
  return raw as unknown as ContentBundle;
}

async function identity(
  bundle: ContentBundle,
  storedChecksum: string | null,
  storedChecksumAlgorithm: ContentComparisonIdentity["storedChecksumAlgorithm"],
): Promise<ContentComparisonIdentity> {
  return {
    version: bundle.version,
    canonicalHash: await contentChecksum(bundle),
    checksumAlgorithm: CONTENT_CHECKSUM_ALGORITHM,
    bundleHash: createHash("sha256").update(JSON.stringify(bundle)).digest("hex"),
    bundleHashAlgorithm: "sha256-json-stringify-v1",
    storedChecksum,
    storedChecksumAlgorithm,
  };
}

async function loadRelease(db: DBClient, releaseId: string): Promise<SourceRelease> {
  const { data, error } = await db
    .from<SourceRelease>("content_releases")
    .select("id,version,checksum,checksum_algorithm,bundle,bundle AS bundle_identity,is_active")
    .eq("id", releaseId)
    .maybeSingle();
  if (error) throw new Error("The comparison release could not be loaded. Please retry.");
  if (!data) throw new Error("The selected comparison release is missing.");
  checkedBundle(data.bundle);
  if (data.bundle["version"] !== data.version)
    throw new Error("The comparison release version failed its integrity check.");
  if (data.checksum_algorithm !== null) {
    if (data.checksum_algorithm !== CONTENT_CHECKSUM_ALGORITHM)
      throw new Error("The comparison release checksum algorithm is unsupported.");
    if ((await contentChecksum(data.bundle)) !== data.checksum)
      throw new Error("The comparison release checksum failed its integrity check.");
  }
  return data;
}

function releaseUnchangedGuard(release: SourceRelease, candidate: boolean): ContentComparisonGuard {
  return {
    sql: `SELECT CASE WHEN EXISTS(SELECT 1 FROM content_releases WHERE id=? AND version=? AND bundle=? AND checksum=? AND checksum_algorithm IS ?${candidate ? " AND is_active=0" : ""}) THEN 1 ELSE json('comparison-release-changed') END`,
    params: [
      release.id,
      release.version,
      release.bundle_identity,
      release.checksum,
      release.checksum_algorithm,
    ],
  };
}

/** Freeze exact source bytes without approval, publication, writes, or provider requests. */
export async function resolveContentComparisonSource(
  db: DBClient,
  userId: string,
  input: ContentComparisonSource,
): Promise<ResolvedContentComparisonSource> {
  const source = checkedSource(input);
  let baseline: ContentBundle;
  let candidate: ContentBundle;
  let identities: ResolvedContentComparisonSource["identities"];
  const guards: ContentComparisonGuard[] = [draftAdminGuard(userId)];
  if (source.kind === "draft") {
    const draft = await loadReviewedDraft(db, userId, source.draftId);
    if (!draft.base_bundle || !draft.base_hash)
      throw new Error(
        "The original frozen baseline is unavailable. Rebase explicitly before evaluation.",
      );
    baseline = checkedBundle(draft.base_bundle);
    candidate = checkedBundle(draft.bundle);
    identities = {
      baseline: await identity(baseline, draft.base_hash, CONTENT_CHECKSUM_ALGORITHM),
      candidate: await identity(candidate, null, null),
    };
    guards.push(draftUnchangedGuard(draft));
  } else {
    await requireDraftAdmin(db, userId);
    const baseRelease = await loadRelease(db, source.baselineReleaseId);
    const candidateRelease = await loadRelease(db, source.releaseId);
    if (candidateRelease.is_active)
      throw new Error("The comparison candidate release must be inactive.");
    baseline = checkedBundle(baseRelease.bundle);
    candidate = checkedBundle(candidateRelease.bundle);
    identities = {
      baseline: await identity(
        baseline,
        baseRelease.checksum,
        baseRelease.checksum_algorithm === CONTENT_CHECKSUM_ALGORITHM
          ? CONTENT_CHECKSUM_ALGORITHM
          : "legacy-unlabelled",
      ),
      candidate: await identity(
        candidate,
        candidateRelease.checksum,
        candidateRelease.checksum_algorithm === CONTENT_CHECKSUM_ALGORITHM
          ? CONTENT_CHECKSUM_ALGORITHM
          : "legacy-unlabelled",
      ),
    };
    guards.push(
      releaseUnchangedGuard(baseRelease, false),
      releaseUnchangedGuard(candidateRelease, true),
    );
  }
  const comparison = compareContentBundles(
    baseline as unknown as Record<string, unknown>,
    candidate as unknown as Record<string, unknown>,
  );
  const changes = comparison.entries.filter((entry) => entry.change !== "unchanged");
  if (!changes.length)
    throw new Error("The baseline and candidate content are identical apart from release version.");
  // Revoked authority cannot leak the prepared content; guards close the later insert race.
  await requireDraftAdmin(db, userId);
  return {
    source,
    baseline,
    candidate,
    identities,
    changedKeys: changes
      .filter((entry) => entry.kind === "entry" && entry.section === "cycles")
      .map((entry) => entry.key),
    changes,
    guards,
  };
}
