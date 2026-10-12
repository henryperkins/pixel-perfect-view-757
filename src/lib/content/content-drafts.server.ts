import type { DBClient } from "../d1.server";
import { compareContentBundles, contentChecksum, type ContentValue } from "./draft-comparison";
import { validateContentGraph } from "./schema";

export interface ReviewedDraft {
  id: string;
  user_id: string;
  status: string;
  base_version: string | null;
  base_bundle: Record<string, unknown> | null;
  base_hash: string | null;
  bundle: Record<string, unknown>;
  bundle_identity: string;
  base_bundle_identity: string | null;
  review_candidate_hash: string | null;
  review_base_hash: string | null;
  reviewed_at: string | null;
  published_version: string | null;
}

export async function requireDraftAdmin(db: DBClient, userId: string) {
  const { data, error } = await db
    .from<{ role: string }>("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Administrator authority could not be checked. Please retry.");
  if (!data) throw new Error("Only admins can review or publish content drafts.");
}

export const draftAdminGuard = (userId: string) => ({
  sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id=? AND role='admin') THEN 1 ELSE json('administrator-changed') END",
  params: [userId],
});

export async function loadReviewedDraft(db: DBClient, userId: string, draftId: string) {
  await requireDraftAdmin(db, userId);
  const { data, error } = await db
    .from<ReviewedDraft>("content_drafts")
    .select(
      "id,user_id,status,base_version,base_bundle,base_bundle AS base_bundle_identity,base_hash,bundle,bundle AS bundle_identity,review_candidate_hash,review_base_hash,reviewed_at,published_version",
    )
    .eq("id", draftId)
    .maybeSingle();
  if (error) throw new Error("The draft could not be loaded. Please retry.");
  if (!data || data.status !== "draft") throw new Error("That draft is no longer open.");
  validateContentGraph(data.bundle);
  if ((data.base_bundle === null) !== (data.base_hash === null))
    throw new Error("The frozen draft baseline is incomplete. Rebase explicitly before review.");
  if (data.base_bundle && (await contentChecksum(data.base_bundle)) !== data.base_hash)
    throw new Error("The frozen draft baseline failed its integrity check.");
  if (data.base_bundle && data.base_bundle["version"] !== data.base_version)
    throw new Error("The frozen draft baseline version failed its integrity check.");
  return data;
}

export function draftUnchangedGuard(draft: ReviewedDraft) {
  return {
    sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM content_drafts WHERE id=? AND status='draft' AND bundle=? AND base_hash IS ? AND base_bundle IS ? AND base_version IS ?) THEN 1 ELSE json('draft-changed') END",
    params: [
      draft.id,
      draft.bundle_identity,
      draft.base_hash,
      draft.base_bundle_identity,
      draft.base_version,
    ],
  };
}

export async function getDraftComparison(db: DBClient, userId: string, draftId: string) {
  const draft = await loadReviewedDraft(db, userId, draftId);
  const candidateHash = await contentChecksum(draft.bundle);
  const baseAvailable = Boolean(draft.base_bundle && draft.base_hash);
  const comparison = compareContentBundles(draft.base_bundle ?? {}, draft.bundle);
  // Authority can be revoked while the complete prose comparison is assembled.
  await requireDraftAdmin(db, userId);
  return {
    draftId: draft.id,
    baseVersion: draft.base_version,
    baseHash: draft.base_hash,
    candidateHash,
    baseAvailable,
    candidate: draft.bundle as Record<string, ContentValue>,
    reviewed:
      baseAvailable &&
      draft.review_candidate_hash === candidateHash &&
      draft.review_base_hash === draft.base_hash,
    reviewedAt: draft.reviewed_at,
    reason: baseAvailable
      ? null
      : "Original comparison unavailable. Explicitly rebase this draft before review.",
    ...comparison,
  };
}

export async function approveDraftReview(
  db: DBClient,
  userId: string,
  input: { draftId: string; candidateHash: string; baseHash: string },
) {
  const draft = await loadReviewedDraft(db, userId, input.draftId);
  if (!draft.base_hash || !draft.base_bundle)
    throw new Error("The original baseline is unavailable. Rebase explicitly before review.");
  const candidateHash = await contentChecksum(draft.bundle);
  if (input.candidateHash !== candidateHash || input.baseHash !== draft.base_hash)
    throw new Error("The draft changed. Load and review the current comparison.");
  try {
    await db.batch([
      draftAdminGuard(userId),
      draftUnchangedGuard(draft),
      {
        sql: "UPDATE content_drafts SET review_candidate_hash=?,review_base_hash=?,reviewed_at=? WHERE id=?",
        params: [candidateHash, draft.base_hash, new Date().toISOString(), draft.id],
      },
    ]);
  } catch {
    throw new Error("The draft or administrator authority changed. Reload before approving.");
  }
  return { approved: true, candidateHash, baseHash: draft.base_hash };
}

export async function editContentDraft(
  db: DBClient,
  userId: string,
  input: { draftId: string; bundle: Record<string, unknown>; expectedCandidateHash: string },
) {
  const draft = await loadReviewedDraft(db, userId, input.draftId);
  if ((await contentChecksum(draft.bundle)) !== input.expectedCandidateHash)
    throw new Error("The draft changed in another review. Reload before editing.");
  const bundle = { ...input.bundle, version: "pending" };
  validateContentGraph(bundle);
  if (JSON.stringify(bundle).length > 1000000)
    throw new Error("The candidate exceeds the content limit.");
  // Preserve every semantic array; changing the candidate always clears its approval.
  try {
    await db.batch([
      draftAdminGuard(userId),
      draftUnchangedGuard(draft),
      {
        sql: "UPDATE content_drafts SET bundle=?,review_candidate_hash=NULL,review_base_hash=NULL,reviewed_at=NULL WHERE id=?",
        params: [JSON.stringify(bundle), draft.id],
      },
    ]);
  } catch {
    throw new Error("The draft or administrator authority changed. Your edit was not saved.");
  }
  return { saved: true, candidateHash: await contentChecksum(bundle) };
}

export async function rebaseContentDraft(
  db: DBClient,
  userId: string,
  input: { draftId: string; expectedCandidateHash: string },
) {
  const draft = await loadReviewedDraft(db, userId, input.draftId);
  if ((await contentChecksum(draft.bundle)) !== input.expectedCandidateHash)
    throw new Error("The draft changed. Reload before rebasing.");
  const { activeBundle } = await import("../pattern.server");
  const base = JSON.parse(JSON.stringify(await activeBundle(db))) as Record<string, unknown> & {
    version: string;
  };
  const baseHash = await contentChecksum(base);
  try {
    await db.batch([
      draftAdminGuard(userId),
      draftUnchangedGuard(draft),
      {
        sql: "UPDATE content_drafts SET base_version=?,base_bundle=?,base_hash=?,review_candidate_hash=NULL,review_base_hash=NULL,reviewed_at=NULL WHERE id=?",
        params: [base.version, JSON.stringify(base), baseHash, draft.id],
      },
    ]);
  } catch {
    throw new Error("The draft or administrator authority changed. Reload before rebasing.");
  }
  return { rebased: true, baseVersion: base.version, baseHash };
}
