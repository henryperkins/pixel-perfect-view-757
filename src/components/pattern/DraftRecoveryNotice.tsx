import { useState } from "react";
import { Button } from "@/components/ui/button";
import { draftText, type MemberDraft } from "@/lib/member-drafts";
import type { DraftDurability } from "@/lib/member-draft-controller";
export function DraftRecoveryNotice({
  draft,
  candidates,
  durability,
  error,
  onResume,
  onDiscard,
  entityKey,
}: {
  draft: MemberDraft | null;
  candidates: MemberDraft[];
  durability: DraftDurability | null;
  error: string | null;
  onResume: (id: string) => void;
  onDiscard: (id: string) => Promise<void>;
  entityKey: string;
}) {
  const [confirm, setConfirm] = useState<string | null>(null),
    [copy, setCopy] = useState<string | null>(null);
  const copyDraft = async (item: MemberDraft) => {
    try {
      await navigator.clipboard.writeText(draftText(item));
      setCopy("Draft copied.");
    } catch {
      setCopy("Select and copy the draft below.");
    }
  };
  if (!draft && !candidates.length && !error) return null;
  return (
    <div className="draft-recovery my-3 min-w-0 space-y-2 text-sm">
      {draft && (
        <p role="status">
          {durability === "stored"
            ? "Draft saved on this device"
            : durability === "error"
              ? "This draft is only kept while this page stays open. Save it to your account or copy it before leaving."
              : "Saving draft on this device…"}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {draft && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => void copyDraft(draft)}>
            Copy draft
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirm(draft.draftId)}>
            Discard draft
          </Button>
        </div>
      )}
      {candidates
        .filter((d) => d.draftId !== draft?.draftId)
        .map((candidate) => (
          <details key={candidate.draftId} className="min-w-0 rounded-sm border border-rule p-3">
            <summary className="min-h-11 cursor-pointer py-2">
              Resume draft ·{" "}
              {candidate.kind === "check-in"
                ? candidate.entityKey
                : new Date(candidate.updatedAt).toLocaleString()}
            </summary>
            <pre className="my-2 whitespace-pre-wrap font-sans text-sm [overflow-wrap:anywhere]">
              {draftText(candidate)}
            </pre>
            <div className="flex flex-wrap gap-2">
              {candidate.entityKey === entityKey && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (draft) setConfirm(`replace:${candidate.draftId}`);
                    else onResume(candidate.draftId);
                  }}
                >
                  {draft ? "Replace with this draft" : "Resume draft"}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => void copyDraft(candidate)}>
                Copy draft
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirm(candidate.draftId)}>
                Discard draft
              </Button>
            </div>
          </details>
        ))}
      {confirm && (
        <div role="group" aria-label="Confirm draft action" className="border border-rule p-3">
          <p>
            {confirm.startsWith("replace:")
              ? "Use this draft? Your current version will remain available to recover."
              : "Discard this unsaved draft from this device?"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Keep editing
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (confirm.startsWith("replace:")) onResume(confirm.slice(8));
                else void onDiscard(confirm);
                setConfirm(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
      {copy && <p role="status">{copy}</p>}
      {copy === "Select and copy the draft below." && draft && (
        <pre className="whitespace-pre-wrap font-sans [overflow-wrap:anywhere]">
          {draftText(draft)}
        </pre>
      )}
      <p className="text-xs text-muted-foreground">
        Device drafts expire after seven days without edits and are cleared when you sign out. Save
        to keep this in your account.
      </p>
    </div>
  );
}
