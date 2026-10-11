import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveDailyCheckIn } from "@/lib/pattern.functions";

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
          <span className="ml-2 text-xs text-muted-foreground" aria-hidden="true">
            1 {options[0].toLowerCase()} · 5 {options[4].toLowerCase()}
          </span>
        </div>
        <Button
          variant="ghost"
          type="button"
          disabled={disabled || value === null}
          onClick={() => onChange(null)}
          aria-label={`Clear ${label.toLowerCase()} selection`}
          className="h-11 min-w-11 shrink-0 px-1 text-xs text-muted-foreground"
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
              className="flex h-11 min-w-11 items-center justify-center rounded-md border border-input bg-card font-mono text-sm text-foreground transition-colors hover:bg-secondary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {band}
            </span>
          </label>
        ))}
      </div>
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
  accountId,
  wellness,
  disabled = false,
}: {
  day: string;
  accountId: string;
  wellness: TodayWellness;
  disabled?: boolean;
}) {
  const checkIn = useServerFn(saveDailyCheckIn);
  const qc = useQueryClient();
  const mounted = useRef(false);
  const pendingSave = useRef<CheckInDraft | null>(null);
  const [state, setState] = useState(() => {
    const values = permittedCheckIn(checkInDraft(wellness), wellness);
    return {
      draft: values,
      saved: values,
      savedAt: wellness.savedAt,
      error: null as string | null,
    };
  });

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

  const draft = permittedCheckIn(state.draft, wellness);
  const dirty = !sameCheckIn(draft, permittedCheckIn(state.saved, wellness));
  const edit = <K extends keyof CheckInDraft>(field: K, value: CheckInDraft[K]) => {
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));
  };

  const saveNote = useMutation({
    mutationFn: (submitted: CheckInDraft) =>
      checkIn({
        data: { day, ...submitted, note: submitted.note.trim() || null },
      }),
    onMutate: (submitted) => {
      pendingSave.current = submitted;
      setState((previous) => ({ ...previous, error: null }));
    },
    onSuccess: (res, submitted) => {
      void qc.invalidateQueries({ queryKey: ["today", accountId] });
      void qc.invalidateQueries({ queryKey: ["journal"] });
      if (!mounted.current) return;
      const saved = checkInDraft(res.checkIn);
      setState((previous) => {
        const next = reconcileCheckIn(previous.draft, submitted, saved);
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
    },
  });
  const editedWhileSaving =
    saveNote.isPending && saveNote.variables && !sameCheckIn(draft, saveNote.variables);
  const savedTime = state.savedAt
    ? new Date(state.savedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const status = saveNote.isPending
    ? editedWhileSaving
      ? "Saving earlier changes; newer edits are unsaved."
      : "Saving…"
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
  const canSave = !disabled && !saveNote.isPending && (dirty || Boolean(state.error));

  return (
    <form
      className="today-check-in mt-5 rounded-sm border border-rule bg-secondary/30 p-4"
      aria-labelledby={`${formId}-heading`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) saveNote.mutate({ ...draft });
      }}
    >
      <h3 id={`${formId}-heading`} className="font-serif text-xl text-foreground">
        Today’s check-in
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose what fits. Every field is optional.
      </p>
      <div className="mt-3 space-y-3">
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
          id={`${formId}-note`}
          disabled={disabled}
          aria-describedby={`${formId}-privacy ${formId}-status`}
          value={draft.note}
          onChange={(event) => edit("note", event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="A few words about today…"
          className="mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        />
      </div>
      <div className="today-check-in-save mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSave} className="h-11 min-w-36 rounded-sm px-4 text-sm">
          {saveNote.isPending ? "Saving…" : state.error ? "Try saving again" : "Save check-in"}
        </Button>
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
      <div className="today-check-in-privacy mt-4 text-xs text-muted-foreground">
        <p id={`${formId}-privacy`}>
          Private to your account. Notes are encrypted; check-in data is never sent to the language
          model.
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
