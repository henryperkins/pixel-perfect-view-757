import { Suspense, lazy, useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { DraftRecoveryNotice } from "./DraftRecoveryNotice";
import { useMemberDraft } from "./MemberDraftProvider";
import { usePlaceLookup } from "@/hooks/usePlaceLookup";
import { fetchBirthRecord, saveBirthProfile } from "@/lib/pattern.functions";
import type { BirthChangeSummary } from "@/lib/pattern.server";
import type { DraftSubmission } from "@/lib/member-drafts";
import {
  BIRTH_ACCURACY,
  birthFormIssues,
  birthFormValues,
  birthSaveData,
  changeBirthAccuracy,
  sameBirthDetails,
  type BirthFormRecord,
  type BirthFormValues,
} from "@/lib/birth-form";
import { userFacingError } from "@/lib/user-facing-error";

const BirthPlaceMap = lazy(() => import("./BirthPlaceMap"));

const inputClass =
  "pattern-mobile-field mt-1.5 w-full min-w-0 rounded-sm border border-muted-foreground bg-card px-3 py-2 text-sm focus:border-ring";
const baselineFor = (record: BirthFormRecord | null) => ({
  values: birthFormValues(record),
  version: record?.revision ?? null,
});

export function BirthDetailsForm({
  record,
  correction = false,
  onSaved,
  onConfirmed,
}: {
  record: BirthFormRecord | null;
  correction?: boolean;
  onSaved: (summary: BirthChangeSummary, hasDraft: boolean) => void;
  onConfirmed: (hasDraft: boolean) => void;
}) {
  const id = useId();
  const save = useServerFn(saveBirthProfile);
  const load = useServerFn(fetchBirthRecord);
  const [baseline, setBaseline] = useState(() => baselineFor(record));
  const recovery = useMemberDraft({
    kind: "birth-details",
    entityKey: "birth",
    values: baseline.values,
    baseline,
  });
  const recoveryRef = useRef(recovery);
  recoveryRef.current = recovery;
  const values = recovery.draft?.values ?? baseline.values;
  const [manualOpen, setManualOpen] = useState(values.placeResolution === "manual");
  const [review, setReview] = useState<{ record: BirthFormRecord | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkpointing, setCheckpointing] = useState(false);
  const [notice, setNotice] = useState("");
  const [checkError, setCheckError] = useState("");
  const mounted = useRef(true);
  const sending = useRef(false);
  const placeInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setBaseline(baselineFor(record));
  }, [record]);

  function update(next: BirthFormValues) {
    recovery.update(next);
    setNotice("");
  }
  const place = usePlaceLookup({
    fields: values,
    initialResolution: record ? "saved" : "unresolved",
    onResolve: (fields) => update({ ...values, ...fields, placeResolution: "lookup" }),
  });
  const issues = birthFormIssues(values);
  const pendingAttempt = recovery.draft?.submission;
  const revisionChanged = Boolean(
    recovery.draft && recovery.draft.baseline.version !== baseline.version,
  );
  const mutation = useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async (submitted: DraftSubmission<"birth-details">) => {
      if (recoveryRef.current.current()?.submission?.operationId !== submitted.operationId)
        throw new Error("This draft changed before its save could start. Review it and try again.");
      const result = await save({
        data: birthSaveData(submitted.values, submitted.baseline.version),
      });
      return { result, submitted };
    },
    onSuccess: ({ result, submitted }) => {
      const current = recoveryRef.current.current();
      // A discarded or replaced draft must not be cleared by an older response.
      if (current?.submission?.operationId !== submitted.operationId) return;
      recoveryRef.current.reconcileAcknowledgement(submitted, submitted.values, result.revision);
      if (!mounted.current) return;
      setBaseline({ values: submitted.values, version: result.revision });
      setReview(null);
      const hasDraft = Boolean(recoveryRef.current.current());
      setNotice(
        hasDraft
          ? "Save confirmed. Your newer edits are still a draft."
          : "Your birth details are saved.",
      );
      onSaved(result.changeSummary, hasDraft);
    },
  });
  const busy = mutation.isPending || checking || checkpointing;
  const hint = checkpointing
    ? "Preparing your save…"
    : pendingAttempt && !mutation.isPending
      ? "A previous save is not confirmed. Retry that save or check the saved details before submitting newer edits."
      : revisionChanged
        ? "The saved birth details changed since this draft. Check the saved details before saving."
        : place.pending
          ? "Finding birth places…"
          : (Object.values(issues)[0] ?? "Your birth details are ready to save.");
  const ready =
    !busy &&
    !place.pending &&
    (Boolean(pendingAttempt) || (!revisionChanged && Object.keys(issues).length === 0));

  async function submit() {
    if (!ready || sending.current) return;
    sending.current = true;
    setCheckpointing(true);
    setCheckError("");
    setNotice("");
    try {
      const submitted = await recovery.checkpointSubmission(values);
      if (recoveryRef.current.current()?.submission?.operationId !== submitted.operationId)
        throw new Error("This draft changed before its save could start. Review it and try again.");
      await mutation.mutateAsync(submitted);
    } catch (error) {
      // Mutation errors remain beside the form; checkpoint errors need the same persistence.
      if (mounted.current)
        setCheckError(
          userFacingError(error, "Your birth details could not be saved. Please try again."),
        );
    } finally {
      sending.current = false;
      if (mounted.current) setCheckpointing(false);
    }
  }

  async function checkSaved() {
    if (busy || sending.current) return;
    setChecking(true);
    setCheckError("");
    try {
      const currentRecord = await load({});
      if (!mounted.current) return;
      const canonical = baselineFor(currentRecord);
      const draft = recoveryRef.current.current();
      if (
        draft?.submission &&
        currentRecord &&
        sameBirthDetails(draft.submission.values, canonical.values)
      ) {
        recoveryRef.current.reconcileAcknowledgement(
          draft.submission,
          draft.submission.values,
          canonical.version,
        );
        setBaseline(canonical);
        setNotice(
          recoveryRef.current.current()
            ? "The previous save is confirmed. Your newer edits are still a draft."
            : "The previous save is confirmed. Your birth details are saved.",
        );
        setReview(null);
        mutation.reset();
        onConfirmed(Boolean(recoveryRef.current.current()));
      } else {
        setReview({ record: currentRecord });
      }
    } catch (error) {
      setCheckError(
        userFacingError(error, "Saved details could not be checked. Your draft is kept."),
      );
    } finally {
      if (mounted.current) setChecking(false);
    }
  }

  function keepEdits() {
    if (!review) return;
    const canonical = baselineFor(review.record);
    const draft = recovery.current();
    if (draft?.submission)
      recovery.reconcileAcknowledgement(draft.submission, canonical.values, canonical.version);
    else if (draft) recovery.rebase(draft.values, canonical);
    setBaseline(canonical);
    setReview(null);
    mutation.reset();
    setCheckError("");
    setNotice(
      "Your draft is kept. Review it, then save to replace the account details you just checked.",
    );
    onConfirmed(Boolean(recovery.current()));
  }

  async function restoreSaved() {
    if (!review || busy || sending.current) return;
    sending.current = true;
    setChecking(true);
    place.invalidate("saved");
    try {
      const draft = recovery.current();
      if (draft) await recovery.discard(draft.draftId);
      if (!mounted.current) return;
      setBaseline(baselineFor(review.record));
      setReview(null);
      mutation.reset();
      setCheckError("");
      setNotice("Saved details loaded.");
      onConfirmed(Boolean(recoveryRef.current.current()));
    } finally {
      sending.current = false;
      if (mounted.current) setChecking(false);
    }
  }

  function errorFor(field: keyof BirthFormValues) {
    return values[field] !== "" ? issues[field] : undefined;
  }
  function errorText(field: keyof BirthFormValues) {
    return errorFor(field) ? (
      <p id={`${id}-${field}-error`} className="mt-1 text-sm text-destructive">
        {issues[field]}
      </p>
    ) : null;
  }

  return (
    <form
      noValidate
      className="mt-8 min-w-0 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className="sr-only">Birth details</legend>
        <DraftRecoveryNotice
          draft={recovery.draft}
          candidates={recovery.recoveryCandidates}
          durability={recovery.durability}
          error={recovery.error}
          entityKey="birth"
          onResume={(draftId) => {
            recovery.resume(draftId);
            place.invalidate();
            setManualOpen(recovery.current()?.values.placeResolution === "manual");
            mutation.reset();
            setCheckError("");
          }}
          onDiscard={async (draftId) => {
            place.invalidate();
            mutation.reset();
            setCheckError("");
            await recovery.discard(draftId);
          }}
        />
        {revisionChanged && (
          <p role="alert" className="border-l-2 border-primary bg-evidence p-3 text-sm">
            This draft was started before the saved birth details changed. Your edits are kept.
            Check the saved details to compare them.
          </p>
        )}
        <label className="block min-w-0">
          <span className="technical text-muted-foreground">Birth date</span>
          <input
            type="date"
            required
            autoComplete="bday"
            enterKeyHint="next"
            value={values.birthDate}
            aria-invalid={Boolean(errorFor("birthDate"))}
            aria-describedby={errorFor("birthDate") ? `${id}-birthDate-error` : undefined}
            onChange={(e) => update({ ...values, birthDate: e.target.value })}
            className={`${inputClass} font-mono`}
          />
          {errorText("birthDate")}
        </label>
        <fieldset className="min-w-0">
          <legend className="technical text-muted-foreground">Time accuracy</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {BIRTH_ACCURACY.map((option) => (
              <label
                key={option.value}
                className={`relative block min-w-0 cursor-pointer rounded-sm border px-3 py-2 text-sm focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ring ${values.accuracy === option.value ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card hover:bg-secondary"}`}
              >
                <input
                  type="radio"
                  name={`${id}-accuracy`}
                  value={option.value}
                  checked={values.accuracy === option.value}
                  onChange={() => update(changeBirthAccuracy(values, option.value))}
                  className="sr-only"
                />
                <span className="block font-medium">{option.label}</span>
                <span
                  className={`block text-xs ${values.accuracy === option.value ? "text-accent-foreground" : "text-muted-foreground"}`}
                >
                  {option.note}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {values.accuracy === "unknown" ? (
          <p className="border-l-2 border-primary bg-evidence px-3 py-2 text-xs text-evidence-foreground">
            With an unknown time, houses, ascendant, midheaven and fast Moon claims are suppressed
            rather than guessed. Everything else still calculates.
          </p>
        ) : (
          <label className="block min-w-0">
            <span className="technical text-muted-foreground">Birth time (local)</span>
            <input
              type="time"
              required
              enterKeyHint="next"
              value={values.birthTime}
              aria-invalid={Boolean(errorFor("birthTime"))}
              aria-describedby={`${id}-time-help`}
              onChange={(e) => update({ ...values, birthTime: e.target.value })}
              className={`${inputClass} font-mono`}
            />
            <p id={`${id}-time-help`} className="mt-1 text-sm text-muted-foreground">
              {issues.birthTime ?? "Use the local time at your birth place."}
            </p>
          </label>
        )}
        <div className="min-w-0">
          <label htmlFor={`${id}-place`} className="technical text-muted-foreground">
            Birth place
          </label>
          <div className="mt-1.5 flex flex-wrap items-start gap-2">
            <input
              id={`${id}-place`}
              ref={placeInput}
              required
              maxLength={160}
              value={values.placeLabel}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="City, country"
              aria-invalid={Boolean(errorFor("placeLabel"))}
              aria-describedby={`${id}-place-help${errorFor("placeLabel") ? ` ${id}-placeLabel-error` : ""}`}
              onChange={(e) => {
                place.invalidate();
                update({
                  ...values,
                  placeLabel: e.target.value,
                  latitude: "",
                  longitude: "",
                  timezone: "",
                  placeResolution: "unresolved",
                });
                place.scheduleLookup(e.target.value);
              }}
              className={`${inputClass} mt-0 flex-1 basis-40`}
            />
            <Button
              type="button"
              variant="outline"
              disabled={place.pending || !values.placeLabel.trim()}
              onClick={() => {
                update({ ...values, placeResolution: "unresolved" });
                void place.lookup();
              }}
              className="h-auto min-h-11 whitespace-normal"
            >
              {place.pending ? "Finding…" : "Find place"}
            </Button>
          </div>
          <p id={`${id}-place-help`} className="mt-2 text-xs text-muted-foreground">
            Search for your town, then choose the matching region and country.
          </p>
          {errorText("placeLabel")}
          {place.error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {place.error}
            </p>
          )}
          <p role="status" aria-live="polite" className="mt-2 text-sm">
            {place.pending
              ? "Finding matching places…"
              : place.candidates.length
                ? `${place.candidates.length} matching ${place.candidates.length === 1 ? "place" : "places"}. Choose your birth place below.`
                : values.placeResolution !== "unresolved" &&
                    !issues.latitude &&
                    !issues.longitude &&
                    !issues.timezone
                  ? `Birth place: ${values.placeLabel} · ${values.latitude}, ${values.longitude} · ${values.timezone}`
                  : ""}
          </p>
          {values.placeResolution !== "unresolved" &&
            !issues.latitude &&
            !issues.longitude &&
            values.placeLabel.trim() && (
              <Suspense fallback={null}>
                <BirthPlaceMap
                  latitude={Number(values.latitude)}
                  longitude={Number(values.longitude)}
                  label={values.placeLabel}
                />
              </Suspense>
            )}
          {place.candidates.length > 0 && (
            <ul aria-label="Matching birth places" className="mt-2 space-y-2">
              {place.candidates.map((candidate) => (
                <li key={candidate.id}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (place.select(candidate)) {
                        setManualOpen(false);
                        placeInput.current?.focus({ preventScroll: true });
                      }
                    }}
                    className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left"
                  >
                    {candidate.label}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <details
            className="mt-3 rounded-sm border border-rule px-3"
            open={manualOpen}
            onToggle={(event) => setManualOpen(event.currentTarget.open)}
          >
            <summary className="min-h-11 py-2 text-sm">Enter coordinates manually</summary>
            <p className="mb-3 text-xs text-muted-foreground">
              Use signed decimal coordinates and the timezone at your birth place. You can refine
              your search above instead.
            </p>
            <div className="mb-3 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
              {(["latitude", "longitude", "timezone"] as const).map((field) => (
                <label
                  key={field}
                  className={`block min-w-0 ${field === "timezone" ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <span className="technical text-muted-foreground">
                    {field === "latitude"
                      ? "Latitude"
                      : field === "longitude"
                        ? "Longitude"
                        : "Timezone"}
                  </span>
                  {/* Decimal keypads can omit the minus key required by signed coordinates. */}
                  <input
                    value={values[field]}
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint={field === "timezone" ? "done" : "next"}
                    aria-invalid={Boolean(errorFor(field))}
                    aria-describedby={errorFor(field) ? `${id}-${field}-error` : undefined}
                    onChange={(e) => {
                      place.invalidate("manual");
                      update({ ...values, [field]: e.target.value, placeResolution: "manual" });
                    }}
                    className={`${inputClass} font-mono`}
                  />
                  {errorText(field)}
                </label>
              ))}
            </div>
          </details>
        </div>
      </fieldset>
      {(mutation.error || checkError) && (
        <div role="alert" className="border-l-2 border-destructive bg-card p-4 text-sm">
          <p>
            {checkError ||
              userFacingError(mutation.error, "Your birth details could not be saved.")}
          </p>
          <p className="mt-2">
            Your draft is kept. You can check whether the save reached your account.
          </p>
        </div>
      )}
      {(pendingAttempt || revisionChanged || mutation.error || checkError) && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void checkSaved()}
          className="h-auto min-h-11 whitespace-normal"
        >
          {checking ? "Checking…" : "Check saved details"}
        </Button>
      )}
      {review && (
        <section
          aria-label="Compare saved birth details"
          className="space-y-3 border border-rule bg-card p-4 text-sm"
        >
          <h2 className="font-medium">Currently saved in your account</h2>
          {review.record ? (
            <p>
              {review.record.birthDate} ·{" "}
              {review.record.accuracy === "unknown"
                ? "Unknown time"
                : `${review.record.birthTime} (${review.record.accuracy})`}
              <br />
              {review.record.placeLabel}
              <br />
              {review.record.latitude}, {review.record.longitude} · {review.record.timezone}
            </p>
          ) : (
            <p>No birth details are saved yet.</p>
          )}
          <p>
            Your draft remains in the form above. Keeping your edits lets the next save replace
            these account details.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={keepEdits}
              className="h-auto min-h-11 whitespace-normal"
            >
              Keep my edits
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void restoreSaved()}
              className="h-auto min-h-11 whitespace-normal"
            >
              Discard edits and use saved details
            </Button>
          </div>
        </section>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <div className="border-t border-rule pt-5">
        <p id={`${id}-readiness`} role="status" className="mb-3 text-sm text-muted-foreground">
          {hint}
        </p>
        <Button
          type="submit"
          disabled={!ready}
          aria-describedby={`${id}-readiness`}
          className="h-auto min-h-11 max-w-full whitespace-normal px-5 py-3"
        >
          {mutation.isPending
            ? "Saving and calculating…"
            : pendingAttempt
              ? "Retry previous save"
              : correction && baseline.version
                ? "Save and recalculate"
                : "Calculate my chart"}
        </Button>
      </div>
      {correction && (
        <details className="border-t border-rule pt-3 text-sm">
          <summary className="min-h-11 py-2">How time accuracy affects your chart</summary>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            This is the accuracy you record, not a verified birth time. Pattern checks eligible
            chart interpretations and contact dates at the recorded time and both uncertainty
            boundaries, not every moment between them. Saving recalculates your chart; existing
            readings keep their original evidence. Unknown time leaves those interpretations and
            contact sequences out of daily readings. If the calculation service or a sample is
            unavailable, the ordinary reading remains available.
          </p>
        </details>
      )}
    </form>
  );
}
