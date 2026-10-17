import { useRef, useState } from "react";
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
    [copy, setCopy] = useState<{ draftId: string; text: string; copied: boolean } | null>(null);
  const copyAttempt = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const confirmationTrigger = useRef<HTMLButtonElement | null>(null);
  const askConfirmation = (action: string, trigger: HTMLButtonElement) => {
    confirmationTrigger.current = trigger;
    setConfirm(action);
  };
  const closeConfirmation = (returnToForm = false) => {
    const trigger = confirmationTrigger.current;
    const form = rootRef.current?.closest("form");
    setConfirm(null);
    requestAnimationFrame(() => {
      // An explicit new focus action takes precedence over returning focus.
      if (document.activeElement !== document.body) return;
      const field =
        form?.querySelector<HTMLElement>("textarea:not(:disabled)") ??
        form?.querySelector<HTMLElement>("input:not(:disabled):not([type=hidden])");
      if (!returnToForm && trigger?.isConnected) trigger.focus();
      else if (field?.isConnected) field.focus();
      else if (trigger?.isConnected) trigger.focus();
    });
  };
  const copySource =
    copy &&
    (draft?.draftId === copy.draftId
      ? draft
      : candidates.find((candidate) => candidate.draftId === copy.draftId));
  const visibleCopy = copySource && draftText(copySource) === copy?.text ? copy : null;
  const copyDraft = async (item: MemberDraft) => {
    const attempt = ++copyAttempt.current;
    const text = draftText(item);
    setCopy(null);
    try {
      await navigator.clipboard.writeText(text);
      if (attempt === copyAttempt.current) setCopy({ draftId: item.draftId, text, copied: true });
    } catch {
      if (attempt === copyAttempt.current) setCopy({ draftId: item.draftId, text, copied: false });
    }
  };
  if (!draft && !candidates.length && !error) return null;
  return (
    <div ref={rootRef} className="draft-recovery my-3 min-w-0 space-y-2 text-sm">
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
          <Button
            type="button"
            variant="ghost"
            onClick={(event) => askConfirmation(draft.draftId, event.currentTarget)}
          >
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
                  onClick={(event) => {
                    if (draft) askConfirmation(`replace:${candidate.draftId}`, event.currentTarget);
                    else {
                      onResume(candidate.draftId);
                      closeConfirmation(true);
                    }
                  }}
                >
                  {draft ? "Replace with this draft" : "Resume draft"}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => void copyDraft(candidate)}>
                Copy draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={(event) => askConfirmation(candidate.draftId, event.currentTarget)}
              >
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
            <Button type="button" variant="outline" onClick={() => closeConfirmation()}>
              Keep editing
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (confirm.startsWith("replace:")) onResume(confirm.slice(8));
                else void onDiscard(confirm);
                closeConfirmation(true);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
      {visibleCopy && (
        <p role="status">
          {visibleCopy.copied ? "Draft copied." : "Select and copy the draft below."}
        </p>
      )}
      {visibleCopy && !visibleCopy.copied && (
        <pre className="whitespace-pre-wrap font-sans [overflow-wrap:anywhere]">
          {visibleCopy.text}
        </pre>
      )}
      <p className="text-xs text-muted-foreground">
        Device drafts expire after seven days without edits and are cleared when you sign out. Save
        to keep this in your account.
      </p>
    </div>
  );
}
