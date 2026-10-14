import {
  sameDraftValues,
  withDraftSubmission,
  type DraftSubmission,
  type DraftValuesMap,
  type MemberDraft,
} from "./member-drafts.ts";
export function journalPayload(values: DraftValuesMap["journal-new"]) {
  return {
    occurredOn: values.occurredOn,
    domain: values.domain,
    label: values.label.trim(),
    body: values.body.trim() || null,
    cycleKey: values.cycleKey || null,
    featureKey: values.featureKey || null,
  };
}
export type CanonicalJournalEntry = {
  id: string;
  occurred_on: string;
  domain: string;
  label: string;
  body: string | null;
  cycle_key: string | null;
  feature_key: string | null;
  revision: number;
};
export function canonicalJournalValues(
  entry: CanonicalJournalEntry,
): DraftValuesMap["journal-new"] {
  return {
    occurredOn: entry.occurred_on,
    domain: entry.domain,
    label: entry.label,
    body: entry.body ?? "",
    cycleKey: entry.cycle_key ?? "",
    featureKey: entry.feature_key ?? "",
  };
}
export function createJournalSubmission(draft: MemberDraft<"journal-new">, operationId: string) {
  return withDraftSubmission(draft, operationId).submission!;
}
export function reconcileJournalSubmission(
  current: MemberDraft<"journal-new">,
  submission: DraftSubmission<"journal-new">,
  canonical: CanonicalJournalEntry,
) {
  const saved = canonicalJournalValues(canonical);
  if (!sameDraftValues(journalPayload(submission.values), journalPayload(saved)))
    return { kind: "different-server-value" as const, draft: current };
  if (!sameDraftValues(journalPayload(current.values), journalPayload(submission.values)))
    return { kind: "newer-local-edits" as const, draft: current };
  return { kind: "acknowledged" as const, draft: null };
}
