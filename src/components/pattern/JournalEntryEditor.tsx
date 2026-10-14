import { toast } from "sonner";
import { useMemberDraft } from "./MemberDraftProvider";
import { DraftRecoveryNotice } from "./DraftRecoveryNotice";
import type { DraftValuesMap } from "@/lib/member-drafts";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface EditableJournalEntry {
  id: string;
  label: string;
  body: string | null;
  revision: number;
}
export interface JournalEditInput {
  id: string;
  label: string;
  body: string | null;
  expectedRevision: number;
}

/** Draft state is independent of refreshed query data, including a deleted entry. */
export function JournalEntryEditor({
  initialEntry,
  latestEntry,
  pending,
  onSave,
  onCancel,
  onRefresh,
}: {
  initialEntry: EditableJournalEntry;
  latestEntry: EditableJournalEntry | undefined;
  pending: boolean;
  onSave: (input: JournalEditInput) => Promise<unknown>;
  onCancel: () => void;
  onRefresh: () => Promise<EditableJournalEntry | undefined>;
}) {
  const initial = {
    entryId: initialEntry.id,
    label: initialEntry.label,
    body: initialEntry.body ?? "",
    expectedRevision: initialEntry.revision,
  };
  const [acknowledged, setAcknowledged] = useState<DraftValuesMap["journal-edit"] | null>(null);
  const fallback = acknowledged ?? initial;
  const recovery = useMemberDraft({
    kind: "journal-edit",
    entityKey: initialEntry.id,
    values: fallback,
    baseline: { values: fallback, version: String(fallback.expectedRevision) },
  });
  const values = recovery.draft?.values ?? fallback;
  const { label, body, expectedRevision: revision } = values;
  const recoveryRef = useRef(recovery);
  recoveryRef.current = recovery;
  const setLabel = (value: string) => recovery.update({ ...values, label: value });
  const setBody = (value: string) => recovery.update({ ...values, body: value });
  const setRevision = (value: number) => {
    const current = recovery.current();
    const next = { ...values, expectedRevision: value };
    if (current?.submission)
      recovery.reconcileAcknowledgement(
        current.submission,
        { ...next, label: latestEntry!.label, body: latestEntry!.body ?? "" },
        String(value),
      );
    recovery.update(next);
  };
  const [error, setError] = useState<string | null>(null);
  const [retryVerified, setRetryVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const changed = latestEntry && latestEntry.revision !== revision;
  useEffect(() => {
    const current = recoveryRef.current.current();
    const attempt = current?.submission;
    if (!attempt || !latestEntry || latestEntry.revision <= attempt.values.expectedRevision) return;
    if (
      latestEntry.label !== attempt.values.label.trim() ||
      (latestEntry.body ?? "") !== attempt.values.body.trim()
    )
      return;
    const canonical = { ...attempt.values, label: latestEntry.label, body: latestEntry.body ?? "" };
    recoveryRef.current.reconcileAcknowledgement(attempt, canonical, String(latestEntry.revision));
    setAcknowledged({ ...canonical, expectedRevision: latestEntry.revision });
    setError(null);
  }, [latestEntry]);
  return (
    <form
      className="journal-entry-editor mt-4 space-y-4 rounded-sm border border-rule bg-evidence p-4"
      aria-label="Edit journal entry"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || checking || (recovery.draft?.submission && !retryVerified)) return;
        setError(null);
        try {
          const attempt = await recovery.checkpointSubmission(values);
          await onSave({
            id: initialEntry.id,
            label: attempt.values.label.trim(),
            body: attempt.values.body.trim() || null,
            expectedRevision: attempt.values.expectedRevision,
          });
          const current = recovery.current();
          if (
            current &&
            (current.values.label !== attempt.values.label ||
              current.values.body !== attempt.values.body)
          )
            toast.info("Earlier changes saved. Your newer draft is kept for the next edit.");
          recovery.reconcileAcknowledgement(
            attempt,
            {
              ...attempt.values,
              label: attempt.values.label.trim(),
              body: attempt.values.body.trim(),
            },
            String(attempt.values.expectedRevision + 1),
          );
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Your entry could not be saved. Your draft is kept.",
          );
        }
      }}
    >
      <h3 className="text-sm font-medium">Edit entry</h3>
      {recovery.draft?.submission && !pending && (
        <div role="status" className="space-y-2 border border-rule p-3 text-sm">
          <p>
            Check the earlier save before retrying. Any text you added since then remains a separate
            draft.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              setRetryVerified(false);
              try {
                const saved = await onRefresh();
                const attempt = recovery.current()?.submission;
                if (!saved)
                  setError("This entry is unavailable. Your draft is kept so you can copy it.");
                else if (attempt && saved.revision === attempt.values.expectedRevision)
                  setRetryVerified(true);
              } catch {
                setError("The saved entry could not be checked. Your draft is kept.");
              } finally {
                setChecking(false);
              }
            }}
          >
            {checking ? "Checking…" : "Check save"}
          </Button>
        </div>
      )}
      {changed ? (
        <div role="status" className="space-y-2 border border-rule p-3 text-sm">
          <p>
            This entry changed while you were editing. Compare the latest saved text with your
            draft.
          </p>
          <p className="font-medium">{latestEntry.label}</p>
          {latestEntry.body ? <p className="whitespace-pre-line">{latestEntry.body}</p> : null}
          <Button
            type="button"
            variant="outline"
            className="h-auto max-w-full whitespace-normal text-left leading-relaxed"
            disabled={pending}
            onClick={() => {
              setRevision(latestEntry.revision);
              setError(null);
            }}
          >
            Keep my draft against this saved entry
          </Button>
        </div>
      ) : null}
      {!latestEntry ? (
        <p role="status" className="text-sm">
          This entry is no longer available. Your draft is kept here so you can copy it.
        </p>
      ) : null}
      <label className="block">
        <span className="technical text-muted-foreground">Title</span>
        <input
          autoFocus
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={400}
          readOnly={pending}
          className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="technical text-muted-foreground">Entry</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={4000}
          rows={6}
          readOnly={pending}
          className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm leading-relaxed"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        The original date and cycle/chapter attachments stay with this entry.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DraftRecoveryNotice
        draft={recovery.draft}
        candidates={recovery.recoveryCandidates.filter((d) => d.entityKey === initialEntry.id)}
        durability={recovery.durability}
        error={recovery.error}
        onResume={recovery.resume}
        onDiscard={recovery.discard}
        entityKey={initialEntry.id}
      />
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={
            pending ||
            checking ||
            Boolean(recovery.draft?.submission && !retryVerified) ||
            !label.trim() ||
            Boolean(changed) ||
            !latestEntry
          }
        >
          {pending
            ? "Saving…"
            : recovery.draft?.submission
              ? "Retry earlier change"
              : "Save changes"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
