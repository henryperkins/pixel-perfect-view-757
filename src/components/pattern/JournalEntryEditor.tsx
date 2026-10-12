import { useState } from "react";
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
}: {
  initialEntry: EditableJournalEntry;
  latestEntry: EditableJournalEntry | undefined;
  pending: boolean;
  onSave: (input: JournalEditInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialEntry.label);
  const [body, setBody] = useState(initialEntry.body ?? "");
  const [revision, setRevision] = useState(initialEntry.revision);
  const [error, setError] = useState<string | null>(null);
  const changed = latestEntry && latestEntry.revision !== revision;
  return (
    <form
      className="mt-4 space-y-4 rounded-sm border border-rule bg-evidence p-4"
      aria-label="Edit journal entry"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        try {
          await onSave({
            id: initialEntry.id,
            label: label.trim(),
            body: body.trim() || null,
            expectedRevision: revision,
          });
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
          className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
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
          className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm leading-relaxed"
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
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending || !label.trim() || Boolean(changed) || !latestEntry}
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
