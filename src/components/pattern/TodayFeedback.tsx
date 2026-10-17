import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { sendFeedback, type fetchToday } from "@/lib/pattern.functions";

type TodayData = Extract<Awaited<ReturnType<typeof fetchToday>>, { needsOnboarding: false }>;

export function TodayFeedback({
  readingId,
  accountId,
  saved,
  readingRevision,
}: {
  readingId: string;
  accountId: string;
  saved: TodayData["feedback"];
  readingRevision: number;
}) {
  const client = useQueryClient();
  const send = useServerFn(sendFeedback);
  const responseButtons = useRef<Partial<Record<-1 | 0 | 1, HTMLButtonElement | null>>>({});
  const [receipt, setReceipt] = useState<{
    feedback: NonNullable<TodayData["feedback"]>;
    baseRevision: number;
  } | null>(null);
  // A later server read is authoritative, including structurally identical
  // responses. A rating write must not clear a
  // failed reading refresh by replacing the Today query's data.
  const confirmed = receipt && readingRevision === receipt.baseRevision ? receipt.feedback : saved;
  const mutation = useMutation({
    mutationFn: (resonance: -1 | 0 | 1) => send({ data: { readingId, resonance, labels: [] } }),
    onMutate: async () => {
      const state = client.getQueryState(["today", accountId]);
      const interrupted = {
        resumeReading: state?.fetchStatus === "fetching" || Boolean(state?.isInvalidated),
      };
      await client.cancelQueries({ queryKey: ["today", accountId], exact: true });
      return interrupted;
    },
    onSuccess: async (result, _resonance, interrupted) => {
      // Focus or a check-in can start another read while this write is pending.
      // Stop that older read before displaying the canonical saved response.
      if (interrupted && client.getQueryState(["today", accountId])?.fetchStatus === "fetching")
        interrupted.resumeReading = true;
      await client.cancelQueries({ queryKey: ["today", accountId], exact: true });
      setReceipt({
        feedback: result.feedback,
        baseRevision: client.getQueryState(["today", accountId])?.dataUpdatedAt ?? readingRevision,
      });
      void client.invalidateQueries({ queryKey: ["journal", accountId] });
    },
    onSettled: (_result, _error, _resonance, interrupted) => {
      // Resume a cancelled calendar/check-in refresh after either outcome. A
      // still-running newer request is reused rather than cancelled again.
      if (interrupted?.resumeReading)
        void client.invalidateQueries(
          { queryKey: ["today", accountId], exact: true },
          { cancelRefetch: false },
        );
    },
  });

  return (
    <section className="today-feedback" aria-labelledby="today-feedback-title">
      <h2 id="today-feedback-title" className="text-base font-serif text-primary">
        Does this reading land?
      </h2>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Your response to this reading"
      >
        {(
          [
            { value: 1, label: "Yes" },
            { value: 0, label: "Unsure" },
            { value: -1, label: "No" },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            ref={(button) => {
              responseButtons.current[option.value] = button;
            }}
            type="button"
            variant={confirmed?.resonance === option.value ? "default" : "outline"}
            aria-pressed={confirmed?.resonance === option.value}
            aria-disabled={mutation.isPending}
            className="px-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            onClick={() => {
              if (
                !mutation.isPending &&
                (confirmed?.resonance !== option.value || mutation.isError)
              )
                mutation.mutate(option.value);
            }}
          >
            {confirmed?.resonance === option.value ? <Check aria-hidden="true" /> : null}
            {option.label}
          </Button>
        ))}
      </div>
      <p
        className={`mt-3 flex items-center gap-1.5 text-sm ${mutation.isError ? "text-destructive" : "text-muted-foreground"}`}
        role={mutation.isError ? "alert" : "status"}
        aria-live={mutation.isError ? "assertive" : "polite"}
      >
        {mutation.isPending ? (
          mutation.isPaused ? (
            "Waiting for a connection. Your response will save when you’re back online."
          ) : (
            "Saving your response…"
          )
        ) : mutation.isError ? (
          "Your response couldn’t be saved. Please try again."
        ) : confirmed ? (
          <>
            <Check aria-hidden="true" className="h-4 w-4" />
            Response saved
          </>
        ) : (
          "Your response stays with this reading."
        )}
      </p>
      {mutation.isError ? (
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-auto min-h-11 min-w-0 max-w-full whitespace-normal"
          onClick={(event) => {
            if (!mutation.isPending && mutation.variables !== undefined) {
              // Retry disappears during the request; keep keyboard focus on
              // the corresponding choice without interrupting another field.
              if (document.activeElement === event.currentTarget)
                responseButtons.current[mutation.variables]?.focus();
              mutation.mutate(mutation.variables);
            }
          }}
        >
          <RotateCcw aria-hidden="true" /> Retry response
        </Button>
      ) : null}
      <details className="mt-4">
        <summary className="text-sm text-muted-foreground">How your response is used</summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Your rating is saved to your account. Aggregate quality reports require a separate{" "}
          <Link to="/privacy" className="underline underline-offset-4 text-primary">
            permission in Context &amp; privacy
          </Link>
          .
        </p>
      </details>
    </section>
  );
}
