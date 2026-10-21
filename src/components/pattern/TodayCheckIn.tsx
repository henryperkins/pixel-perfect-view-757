import { useMemberDraft, useMemberDraftLifecycle } from "./MemberDraftProvider";
import { DraftRecoveryNotice } from "./DraftRecoveryNotice";
import { sameDraftValues } from "@/lib/member-drafts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useScrollableField } from "@/hooks/useScrollableField";
import { fetchToday, saveDailyCheckIn } from "@/lib/pattern.functions";

function BandPicker({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly [string, string, string, string, string];
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="today-check-in-band min-w-0" disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground" aria-hidden="true">
            {label}
          </span>
          {value ? (
            <span className="ml-2 text-xs text-muted-foreground" aria-hidden="true">
              {options[value - 1]}
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          type="button"
          disabled={disabled}
          aria-disabled={disabled || value === null}
          onClick={() => {
            if (value !== null) onChange(null);
          }}
          aria-label={`Clear ${label.toLowerCase()} selection`}
          className="h-11 min-w-11 shrink-0 px-1 text-xs text-muted-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Clear
        </Button>
      </div>
      <div className="today-check-in-options grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((band) => (
          <label key={band} className="relative min-w-0 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={id}
              value={band}
              checked={value === band}
              onChange={() => onChange(band)}
              aria-label={`${label}: ${band} of 5, ${options[band - 1]}`}
            />
            <span
              aria-hidden="true"
              className="flex h-12 min-w-0 items-center justify-center rounded-md border border-input bg-card font-mono text-sm text-foreground transition-colors hover:bg-secondary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:hover:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {band}
            </span>
          </label>
        ))}
      </div>
      <p
        className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground"
        aria-hidden="true"
      >
        <span>1 · {options[0]}</span>
        <span>5 · {options[4]}</span>
      </p>
    </fieldset>
  );
}

type CheckInValues = {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  stress: number | null;
  note: string | null;
};
type CheckInDraft = Omit<CheckInValues, "note"> & { note: string };
export type TodayWellness = CheckInValues & {
  savedAt: string | null;
  sleepEnabled: boolean;
  stressEnabled: boolean;
  retentionDays: number;
};

function checkInDraft(values: CheckInValues): CheckInDraft {
  return {
    mood: values.mood,
    energy: values.energy,
    sleep: values.sleep,
    stress: values.stress,
    note: values.note ?? "",
  };
}

function sameCheckIn(a: CheckInDraft, b: CheckInDraft) {
  return (
    a.mood === b.mood &&
    a.energy === b.energy &&
    a.sleep === b.sleep &&
    a.stress === b.stress &&
    a.note === b.note
  );
}

/** Update unchanged fields from storage, preserving every field edited since submission. */
function reconcileCheckIn(draft: CheckInDraft, previous: CheckInDraft, saved: CheckInDraft) {
  return {
    mood: draft.mood === previous.mood ? saved.mood : draft.mood,
    energy: draft.energy === previous.energy ? saved.energy : draft.energy,
    sleep: draft.sleep === previous.sleep ? saved.sleep : draft.sleep,
    stress: draft.stress === previous.stress ? saved.stress : draft.stress,
    note: draft.note === previous.note ? saved.note : draft.note,
  };
}

function permittedCheckIn(values: CheckInDraft, wellness: TodayWellness): CheckInDraft {
  return {
    ...values,
    sleep: wellness.sleepEnabled ? values.sleep : null,
    stress: wellness.stressEnabled ? values.stress : null,
  };
}

/** This form is scoped to an account and the server's current day. */
export function TodayCheckIn({
  day,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  accountId,
  wellness,
  disabled = false,
}: {
  day: string;
  timezone?: string;
  accountId: string;
  wellness: TodayWellness;
  disabled?: boolean;
}) {
  const checkIn = useServerFn(saveDailyCheckIn);
  const qc = useQueryClient();
  const mounted = useRef(false);
  const pendingSave = useRef<CheckInDraft | null>(null);
  const pendingOperation = useRef<string | null>(null);
  const saveActionRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState(() => {
    const values = permittedCheckIn(checkInDraft(wellness), wellness);
    return {
      draft: values,
      saved: values,
      savedAt: wellness.savedAt,
      error: null as string | null,
    };
  });

  const complete = useCallback(
    (value: CheckInDraft) => ({ ...value, day, timezone }),
    [day, timezone],
  );
  const recovery = useMemberDraft({
    kind: "check-in",
    entityKey: day,
    values: complete(state.draft),
    baseline: { values: complete(state.saved), version: state.savedAt },
  });
  const recoveryRef = useRef(recovery);
  recoveryRef.current = recovery;
  const { invalidateConsentFields } = useMemberDraftLifecycle();
  const [review, setReview] = useState<CheckInDraft | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    void invalidateConsentFields({ sleep: wellness.sleepEnabled, stress: wellness.stressEnabled });
  }, [wellness.sleepEnabled, wellness.stressEnabled, invalidateConsentFields]);
  useEffect(() => {
    const stored = recoveryRef.current.current();
    if (!stored) return;
    const canonical = permittedCheckIn(checkInDraft(wellness), wellness);
    const next = permittedCheckIn(
      stored.submission
        ? stored.values
        : reconcileCheckIn(stored.values, stored.baseline.values, canonical),
      wellness,
    );
    recoveryRef.current.rebase(complete(next), {
      values: complete(canonical),
      version: wellness.savedAt,
    });
  }, [wellness, complete]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const saving = pendingSave.current !== null;
    setState((previous) => {
      // An older background response cannot undo a confirmed save.
      const newer =
        !previous.savedAt ||
        Boolean(wellness.savedAt && Date.parse(wellness.savedAt) >= Date.parse(previous.savedAt));
      const saved = permittedCheckIn(newer ? checkInDraft(wellness) : previous.saved, wellness);
      const draft = permittedCheckIn(
        saving ? previous.draft : reconcileCheckIn(previous.draft, previous.saved, saved),
        wellness,
      );
      const savedAt = newer ? wellness.savedAt : previous.savedAt;
      const error =
        newer && wellness.savedAt && wellness.savedAt !== previous.savedAt ? null : previous.error;
      if (
        sameCheckIn(draft, previous.draft) &&
        sameCheckIn(saved, previous.saved) &&
        savedAt === previous.savedAt &&
        error === previous.error
      )
        return previous;
      return { ...previous, draft, saved, savedAt, error };
    });
  }, [wellness]);

  const draft = permittedCheckIn(recovery.draft?.values ?? state.draft, wellness);
  useScrollableField(noteRef, draft.note);
  const dirty = !sameCheckIn(draft, permittedCheckIn(state.saved, wellness));
  const edit = <K extends keyof CheckInDraft>(field: K, value: CheckInDraft[K]) => {
    recovery.update(complete({ ...draft, [field]: value }));
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));
  };

  const saveNote = useMutation({
    mutationFn: async (_submitted: CheckInDraft) => {
      // Use the retained attempt: consent may have scrubbed it while offline.
      // A discarded attempt must never be recreated from stale mutation variables.
      const checkpoint = recoveryRef.current.current()?.submission;
      if (!checkpoint || checkpoint.operationId !== pendingOperation.current)
        throw new Error("This draft changed before its queued save could start.");
      const values = permittedCheckIn(checkpoint.values, wellness);
      const res = await checkIn({ data: { day, ...values, note: values.note.trim() || null } });
      return { res, checkpoint };
    },
    onMutate: async (submitted) => {
      pendingSave.current = submitted;
      pendingOperation.current = null;
      setState((previous) => ({ ...previous, error: null }));
      // onMutate runs before Query pauses offline work. Capture the Save-tap
      // revision now so later typing stays outside the submitted checkpoint.
      const checkpoint = await recoveryRef.current.checkpointSubmission(complete(submitted));
      pendingOperation.current = checkpoint.operationId;
    },
    onSuccess: ({ res, checkpoint }, submitted) => {
      const liveDraft = recoveryRef.current.current()?.values ?? submitted;
      const savedValues = checkInDraft(res.checkIn);
      const acknowledged = {
        ...checkpoint,
        values: complete({
          ...checkpoint.values,
          note: checkpoint.values.note.trim(),
          sleep: savedValues.sleep === null ? null : checkpoint.values.sleep,
          stress: savedValues.stress === null ? null : checkpoint.values.stress,
        }),
      };
      recoveryRef.current.reconcileAcknowledgement(
        acknowledged,
        complete(savedValues),
        res.checkIn.savedAt,
      );
      setReview(null);
      void qc.invalidateQueries({ queryKey: ["today", accountId] });
      void qc.invalidateQueries({ queryKey: ["journal"] });
      if (!mounted.current) return;
      const saved = checkInDraft(res.checkIn);
      setState((previous) => {
        const next = reconcileCheckIn(liveDraft, submitted, saved);
        // Consent may have changed on the server while this request was in flight.
        if (submitted.sleep !== null && saved.sleep === null) next.sleep = null;
        if (submitted.stress !== null && saved.stress === null) next.stress = null;
        return {
          draft: permittedCheckIn(next, wellness),
          saved,
          savedAt: res.checkIn.savedAt,
          error: null,
        };
      });
      toast.success(
        saved.note ? "Check-in saved. Reflection note stored encrypted." : "Check-in saved.",
      );
    },
    onError: () => {
      if (!mounted.current) return;
      setState((previous) => ({ ...previous, error: "Save could not be confirmed." }));
    },
    onSettled: () => {
      pendingSave.current = null;
      pendingOperation.current = null;
    },
  });
  const editedWhileSaving =
    saveNote.isPending && saveNote.variables && !sameCheckIn(draft, saveNote.variables);
  const needsSaveCheck = Boolean(recovery.draft?.submission) && !saveNote.isPending;
  const checkSave = async () => {
    setChecking(true);
    try {
      const latest = await fetchToday({ data: { timezone } });
      if (latest.needsOnboarding || latest.day !== day)
        throw new Error("Return to this draft’s original day to review it.");
      const saved = permittedCheckIn(checkInDraft(latest.wellness), latest.wellness);
      const pending = recovery.current()?.submission;
      if (
        pending &&
        sameDraftValues({ ...pending.values, note: pending.values.note.trim() }, complete(saved))
      ) {
        recovery.reconcileAcknowledgement(
          { ...pending, values: { ...pending.values, note: pending.values.note.trim() } },
          complete(saved),
          latest.wellness.savedAt,
        );
        setState((previous) => ({
          ...previous,
          draft: saved,
          saved,
          savedAt: latest.wellness.savedAt,
          error: null,
        }));
      } else {
        setReview(saved);
      }
    } catch {
      setState((previous) => ({
        ...previous,
        error: "The saved check-in could not be checked. Your draft is kept.",
      }));
    } finally {
      setChecking(false);
    }
  };
  const savedTime = state.savedAt
    ? new Date(state.savedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const status = saveNote.isPending
    ? saveNote.isPaused
      ? editedWhileSaving
        ? "Waiting for a connection. Earlier changes will save when you’re back online; newer edits are unsaved."
        : "Waiting for a connection. Your check-in will save when you’re back online."
      : editedWhileSaving
        ? "Saving earlier changes; newer edits are unsaved."
        : "Saving…"
    : needsSaveCheck
      ? checking
        ? "Checking whether your check-in saved…"
        : review
          ? "The saved check-in differs from this draft. Review it below before saving."
          : "This save hasn’t been confirmed. Check whether it saved before retrying. Your edits are still here."
      : state.error
        ? "Couldn’t confirm this save. Your edits are still here. Try again."
        : dirty
          ? savedTime
            ? `Unsaved changes · last saved ${savedTime}`
            : "Unsaved changes"
          : savedTime
            ? `Saved ${savedTime}`
            : "Not saved yet today";

  const formId = useId();
  const canSave =
    !disabled &&
    !saveNote.isPending &&
    !recovery.draft?.submission &&
    (dirty || Boolean(state.error));

  return (
    <form
      className="today-check-in mt-5"
      aria-label="Daily check-in"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) saveNote.mutate({ ...draft });
      }}
    >
      <div className="space-y-3">
        <BandPicker
          label="Mood"
          disabled={disabled}
          options={["Low", "Muted", "Steady", "Good", "Bright"]}
          value={draft.mood}
          onChange={(value) => edit("mood", value)}
        />
        <BandPicker
          label="Energy"
          disabled={disabled}
          options={["Flat", "Low", "Steady", "Lively", "Charged"]}
          value={draft.energy}
          onChange={(value) => edit("energy", value)}
        />
        {wellness.sleepEnabled && (
          <BandPicker
            label="Sleep"
            disabled={disabled}
            options={["Poor", "Restless", "Okay", "Good", "Rested"]}
            value={draft.sleep}
            onChange={(value) => edit("sleep", value)}
          />
        )}
        {wellness.stressEnabled && (
          <BandPicker
            label="Stress"
            disabled={disabled}
            options={["Calm", "Light", "Moderate", "High", "Pressed"]}
            value={draft.stress}
            onChange={(value) => edit("stress", value)}
          />
        )}
      </div>
      {disabled && (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Refresh today’s reading to check in for the new day.
        </p>
      )}
      <div className="today-check-in-note mt-5">
        <label htmlFor={`${formId}-note`} className="block text-sm font-medium text-foreground">
          Reflection note <span className="font-normal text-muted-foreground">· optional</span>
        </label>
        <textarea
          ref={noteRef}
          id={`${formId}-note`}
          name="note"
          disabled={disabled}
          inputMode="text"
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="enter"
          aria-describedby={`${formId}-note-limit ${formId}-privacy ${formId}-status`}
          value={draft.note}
          onChange={(event) => edit("note", event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="A few words about today…"
          className="pattern-mobile-field mt-2 w-full rounded-sm border border-muted-foreground bg-card px-3 py-2 text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        />
        <p id={`${formId}-note-limit`} className="mt-2 text-xs text-muted-foreground">
          <span role="status" aria-atomic="true">
            {draft.note.length === 2000
              ? "Character limit reached. Edit the note to add more."
              : ""}
          </span>
        </p>
      </div>
      <div className="today-check-in-save mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {needsSaveCheck ? (
            <Button
              ref={saveActionRef}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-disabled={checking || disabled}
              onClick={(event) => {
                // Confirmation can replace this control with Submit during the same click.
                event.preventDefault();
                if (!checking && !disabled) void checkSave();
              }}
              className="h-auto min-h-12 min-w-0 max-w-full whitespace-normal rounded-sm px-4 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              {checking ? "Checking…" : "Check save"}
            </Button>
          ) : (
            <Button
              ref={saveActionRef}
              type="submit"
              disabled={disabled}
              aria-disabled={!canSave}
              className="h-auto min-h-12 min-w-0 max-w-full whitespace-normal rounded-sm px-4 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              {saveNote.isPending
                ? saveNote.isPaused
                  ? "Waiting for connection…"
                  : "Saving…"
                : state.error
                  ? "Try saving again"
                  : "Save check-in"}
            </Button>
          )}
          <span
            id={`${formId}-status`}
            className={`today-check-in-status text-sm ${state.error ? "text-destructive" : "text-muted-foreground"}`}
            role={state.error ? "alert" : "status"}
            aria-live={state.error ? "assertive" : "polite"}
            aria-atomic="true"
          >
            {status}
          </span>
        </div>
        {needsSaveCheck && review && (
          <div className="space-y-2 border border-rule p-3 text-sm">
            <p>
              Saved check-in: mood {review.mood ?? "—"}, energy {review.energy ?? "—"}.{" "}
              {review.note || "No reflection note saved."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 min-w-0 max-w-full whitespace-normal"
              onClick={() => {
                const pending = recovery.current()?.submission;
                if (pending)
                  recovery.reconcileAcknowledgement(pending, complete(review), state.savedAt);
                setState((previous) => ({ ...previous, saved: review, error: null }));
                setReview(null);
                requestAnimationFrame(() => {
                  if (document.activeElement !== document.body) return;
                  const action = saveActionRef.current;
                  if (action && !action.disabled) action.focus();
                  else noteRef.current?.focus();
                });
              }}
            >
              Keep my draft and review before saving
            </Button>
          </div>
        )}
      </div>
      {/* Below the Save row: the notice clears when a save is confirmed, and the button must not move. */}
      <DraftRecoveryNotice
        draft={recovery.draft}
        candidates={recovery.recoveryCandidates}
        durability={recovery.durability}
        error={recovery.error}
        onResume={recovery.resume}
        onDiscard={async (id) => {
          if (id === recovery.current()?.draftId) {
            setState((previous) => ({ ...previous, draft: previous.saved, error: null }));
            setReview(null);
          }
          await recovery.discard(id);
        }}
        entityKey={day}
      />
      <div className="today-check-in-privacy mt-4 text-xs text-muted-foreground">
        <p id={`${formId}-privacy`}>
          Private to your account. Notes are encrypted and are not sent out to write readings.
        </p>
        <details className="mt-1">
          <summary className="min-h-11 cursor-pointer py-3 text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            How your check-in is used
          </summary>
          <div className="space-y-2 pb-2 leading-relaxed">
            <p>
              Mood and energy can frame your reading only when the Daily check-in source is enabled
              in Privacy. Saving a check-in never enables that source.
            </p>
            {(wellness.sleepEnabled || wellness.stressEnabled) && (
              <p>
                Sleep and stress are self-reported and kept for {wellness.retentionDays} days. With
                your consent, they are used locally for framing and reflection prompts. They never
                change chart calculations or cycle ranking.
              </p>
            )}
          </div>
        </details>
      </div>
    </form>
  );
}
