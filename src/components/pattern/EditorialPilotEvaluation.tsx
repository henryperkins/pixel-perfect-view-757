import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { EvaluationCase } from "./ReadingEvaluation";
import { LANGUAGE_PROVIDER_LABELS } from "@/lib/ai/diagnostics";
import { EDITORIAL_PILOT_VERSION } from "@/lib/ai/editorial-pilot";
import type { EditorialPilotPlan } from "@/lib/ai/editorial-pilot-plan.server";
import {
  readingEvaluationCurrentCaseLabel,
  readingEvaluationRunActive,
} from "@/lib/ai/reading-evaluation.shared";
import {
  fetchReadingEvaluationRun,
  previewReadingEvaluationPlan,
  startReadingEvaluationRun,
  stopReadingEvaluationRun,
} from "@/lib/pattern.functions";

type Capture = Awaited<ReturnType<typeof fetchReadingEvaluationRun>>;
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Explicit starts only; every recovery and poll is a read of the retained server run. */
export function EditorialPilotEvaluation({ userId }: { userId: string }) {
  const preview = useServerFn(previewReadingEvaluationPlan);
  const start = useServerFn(startReadingEvaluationRun);
  const fetchRun = useServerFn(fetchReadingEvaluationRun);
  const stop = useServerFn(stopReadingEvaluationRun);
  const fetchRef = useRef(fetchRun);
  fetchRef.current = fetchRun;
  const generation = useRef({ value: 0 });
  const actionPending = useRef(false);
  const storageKey = `pattern-editorial-pilot:${userId}:${EDITORIAL_PILOT_VERSION}`;
  const [capture, setCapture] = useState<Capture | null>(null);
  const [prepared, setPrepared] = useState<EditorialPilotPlan | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [recoveryId, setRecoveryId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const run = capture?.run;
  const runId = run?.id;
  const active = Boolean(run && readingEvaluationRunActive(run.status));
  const plan = (capture?.ledger?.sourcePlan as EditorialPilotPlan | null) ?? prepared;
  const details = plan?.editorialPilot;

  const remember = useCallback(
    (value: string) => {
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        /* Server recovery remains available. */
      }
    },
    [storageKey],
  );
  const refresh = useCallback(
    async (runId?: string) => {
      const read = ++generation.current.value;
      const next = await fetchRef.current({ data: runId ? { runId } : {} });
      if (read !== generation.current.value) return;
      if (next.run?.editorialPilot?.version === EDITORIAL_PILOT_VERSION) {
        setCapture(next);
        setUncertain(false);
        setRecoveryId(next.run.id);
        remember(next.run.id);
      } else if (runId) throw Error("That saved run does not belong to this editorial pilot.");
      setLoaded(true);
      return next;
    },
    [remember],
  );

  useEffect(() => {
    const reads = generation.current;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      /* Check the latest server run. */
    }
    setUncertain(saved === "pending");
    refresh(saved && saved !== "pending" ? saved : undefined).catch(() =>
      setMessage("Pilot recovery is unavailable. Refresh the saved status before starting."),
    );
    return () => {
      reads.value++;
    };
  }, [refresh, storageKey]);
  useEffect(() => {
    if (!active || !runId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        await refresh(runId);
      } catch {
        if (!cancelled)
          setMessage("Status could not be refreshed; the server may still be running.");
      } finally {
        if (!cancelled) timer = setTimeout(() => void poll(), 4000);
      }
    }
    timer = setTimeout(() => void poll(), 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, runId, refresh]);

  async function perform(action: () => Promise<void>) {
    if (actionPending.current) return;
    actionPending.current = true;
    setPending(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
    } finally {
      actionPending.current = false;
      setPending(false);
    }
  }
  async function begin() {
    if (!prepared || run || uncertain) return;
    const reviewed = prepared;
    await perform(async () => {
      setUncertain(true);
      remember("pending");
      setPrepared(null);
      try {
        const started = await start({
          data: { mode: "editorial-pilot", expectedPlanHash: reviewed.hash },
        });
        remember(started.id);
        setRecoveryId(started.id);
        setUncertain(false);
        setCapture({ run: started, results: [], ledger: null });
        await refresh(started.id);
      } catch (error) {
        // A lost acknowledgement may have created a run. Recover once; never repeat start.
        await refresh().catch(() => undefined);
        throw Error(
          `${error instanceof Error ? error.message : "Start could not be confirmed."} No start retry was made. Recover the saved status before proceeding.`,
        );
      }
    });
  }

  return (
    <section
      className="mt-8 min-w-0 border-t border-rule pt-6"
      aria-labelledby="editorial-pilot-heading"
    >
      <h3 id="editorial-pilot-heading" className="text-xl">
        Inactive daily editorial pilot
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Six warm/standard scenarios, nine outputs: five possible model outputs and four authored
        quiet outputs across October 11–14. At most five attempts and $5 in reserved generation
        cost. Quiet variation uses no model requests. This pilot does not publish, activate, or
        establish writing qualification.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Previewing is model-free. Start uses the exact reviewed plan and the configured member
        provider. The server continues after this page closes; failed requests are never retried.
      </p>
      {details && plan ? (
        <dl className="mt-4 space-y-2 text-xs [overflow-wrap:anywhere]">
          <div>
            <dt className="text-muted-foreground">Provider and model</dt>
            <dd>
              {LANGUAGE_PROVIDER_LABELS[details.provider]} · {details.model}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Candidate</dt>
            <dd>
              {details.candidate.version} · ${details.dollarCeilingMicros / 1_000_000} ceiling ·{" "}
              {plan.attemptLimit} attempts
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Frozen plan hash</dt>
            <dd className="font-mono">{plan.hash}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Built source</dt>
            <dd className="font-mono">{plan.sourceSha}</dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!loaded || pending || !!run || uncertain}
          onClick={() =>
            void perform(async () => {
              setPrepared(null);
              const next = await preview({ data: { mode: "editorial-pilot" } });
              setPrepared(next.plans as unknown as EditorialPilotPlan);
            })
          }
        >
          Preview exact pilot
        </Button>
        <Button
          type="button"
          disabled={!prepared || pending || !!run || uncertain}
          onClick={() => void begin()}
        >
          Start five-attempt pilot
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            void perform(async () => {
              await refresh(run?.id || recoveryId.trim() || undefined);
            })
          }
        >
          Recover saved status
        </Button>
        {active && run ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending || run.status === "stopping"}
            onClick={() =>
              void perform(async () => {
                await stop({ data: { runId: run.id } });
                await refresh(run.id);
              })
            }
          >
            Stop after current case
          </Button>
        ) : null}
        {plan ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => download(plan, "daily-editorial-pilot-plan.json")}
          >
            Download plan
          </Button>
        ) : null}
        {run ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              void perform(async () => {
                const latest = await refresh(run.id);
                if (latest?.run?.editorialPilot)
                  download(
                    { version: "daily-editorial-pilot-evidence-1", ...latest },
                    `daily-editorial-pilot-${run.id}.json`,
                  );
              })
            }
          >
            Download captured evidence
          </Button>
        ) : null}
      </div>
      <p role="status" className="mt-4 text-sm">
        {!loaded
          ? "Checking for a saved pilot…"
          : run
            ? `${run.status} · ${run.completed}/${run.total} outputs captured${active ? ` · ${readingEvaluationCurrentCaseLabel(run) ?? "awaiting server progress"}` : ""}`
            : uncertain
              ? "A start was attempted; recover its status before any further action."
              : "No saved pilot is loaded. Preview its frozen plan before starting."}
      </p>
      {run ? (
        <p className="mt-2 font-mono text-xs [overflow-wrap:anywhere]">Run ID: {run.id}</p>
      ) : (
        <label className="mt-3 block text-xs text-muted-foreground">
          Saved run ID, if available
          <input
            value={recoveryId}
            onChange={(event) => setRecoveryId(event.target.value)}
            maxLength={80}
            className="mt-2 min-h-11 w-full rounded-md border border-rule bg-card px-3 font-mono text-foreground"
          />
        </label>
      )}
      {capture?.ledger ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {capture.ledger.campaignAttempts}/5 attempts used · $
          {(capture.ledger.campaignReservedMicros / 1_000_000).toFixed(4)} reserved estimate, not an
          invoice.
        </p>
      ) : null}
      {message || run?.message ? (
        <p role="alert" className="mt-3 text-sm text-destructive [overflow-wrap:anywhere]">
          {message ?? run?.message}
        </p>
      ) : null}
      {capture?.results.length ? (
        <div className="mt-5 space-y-3">
          {capture.results.map((result, position) => (
            <EvaluationCase
              key={`${run?.id}-${position}`}
              result={result}
              position={position}
              idPrefix="editorial-pilot-case"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
