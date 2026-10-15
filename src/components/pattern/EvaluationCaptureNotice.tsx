import {
  readingEvaluationRunActive,
  type ReadingEvaluationLedger,
  type ReadingEvaluationRun,
} from "@/lib/ai/reading-evaluation.shared";

/** A terminal Workflow does not establish the outcome of its outstanding request. */
export function EvaluationCaptureNotice({
  run,
  ledger,
}: {
  run: ReadingEvaluationRun | null | undefined;
  ledger: ReadingEvaluationLedger | null | undefined;
}) {
  if (
    !run ||
    readingEvaluationRunActive(run.status) ||
    !ledger?.entries.some((entry) => entry.capture === "uncertain")
  )
    return null;
  return (
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      This run ended with an unresolved request. A response may still be saved. Refresh the saved
      status to check for it; refreshing and downloading evidence never request another reading.
    </p>
  );
}
