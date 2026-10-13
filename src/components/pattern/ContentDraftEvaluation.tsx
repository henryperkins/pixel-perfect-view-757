import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { LANGUAGE_PROVIDER_LABELS, type LanguageProvider } from "@/lib/ai/diagnostics";
import { readingEvaluationRunActive } from "@/lib/ai/reading-evaluation.shared";
import type { FrozenContentComparisonPlan } from "@/lib/ai/content-comparison-plan.server";
import type { ContentComparisonSource } from "@/lib/content/evaluation-source.server";
import {
  fetchReadingEvaluationRun,
  previewReadingEvaluationPlan,
  startReadingEvaluationRun,
  stopReadingEvaluationRun,
} from "@/lib/pattern.functions";

type RunCapture = Awaited<ReturnType<typeof fetchReadingEvaluationRun>>;
type Prepared = {
  arm: "baseline" | "candidate";
  hash: string;
  pair: FrozenContentComparisonPlan;
};

function sourceIdentity(source: ContentComparisonSource): string {
  return source.kind === "draft"
    ? `draft:${source.draftId}`
    : `release:${source.releaseId}:baseline:${source.baselineReleaseId}`;
}

function frozenPair(capture: RunCapture | null): FrozenContentComparisonPlan | null {
  const source = capture?.ledger?.sourcePlan as {
    contentComparison?: { pair?: FrozenContentComparisonPlan };
  } | null;
  return source?.contentComparison?.pair ?? null;
}

function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** An explicit pilot of frozen editorial copy; preparation and recovery are model-free. */
export function ContentComparisonEvaluation({
  source,
  userId,
  baseVersion,
  authoringModel,
  memberProvider,
  disabled = false,
}: {
  source: ContentComparisonSource;
  userId: string;
  baseVersion: string | null;
  authoringModel: string | null;
  memberProvider?: LanguageProvider | undefined;
  disabled?: boolean;
}) {
  const preview = useServerFn(previewReadingEvaluationPlan);
  const start = useServerFn(startReadingEvaluationRun);
  const fetchRun = useServerFn(fetchReadingEvaluationRun);
  const stopRun = useServerFn(stopReadingEvaluationRun);
  const fetchRef = useRef(fetchRun);
  fetchRef.current = fetchRun;
  const readGeneration = useRef(0);
  const sourceId = sourceIdentity(source);
  const isDraft = source.kind === "draft";
  const sourceName = isDraft ? "draft" : "release";
  const storageKey = `pattern-content-repair-pilot:${userId}:${sourceId}`;
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState<RunCapture | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const run = capture?.run;
  const pair = frozenPair(capture) ?? prepared?.pair;
  const active = Boolean(run && readingEvaluationRunActive(run.status));
  const busy = pending || disabled;

  const refresh = useCallback(
    async (runId?: string) => {
      const generation = ++readGeneration.current;
      const next = await fetchRef.current({ data: runId ? { runId } : {} });
      if (generation !== readGeneration.current) return;
      const recoveredSource = frozenPair(next)?.source;
      if (
        next.run &&
        recoveredSource &&
        sourceIdentity(recoveredSource) === sourceId &&
        frozenPair(next)?.caseSetId === "draft-pilot-2"
      ) {
        setCapture(next);
        try {
          localStorage.setItem(storageKey, next.run.id);
        } catch {
          // The server still holds the run when browser storage is unavailable.
        }
      } else if (runId) {
        throw Error("The saved pilot could not be recovered for this source pair.");
      }
    },
    [sourceId, storageKey],
  );

  useEffect(
    () => () => {
      readGeneration.current += 1;
    },
    [sourceId],
  );

  useEffect(() => {
    if (!visited) return;
    let stored: string | undefined;
    try {
      stored = localStorage.getItem(storageKey) ?? undefined;
    } catch {
      // Fall back to the server's latest run without starting another one.
    }
    refresh(stored)
      .then(() => setLoaded(true))
      .catch((failure: unknown) =>
        setError(failure instanceof Error ? failure.message : "Pilot recovery failed."),
      );
  }, [visited, storageKey, refresh]);

  useEffect(() => {
    if (!active || !run?.id) return;
    const runId = run.id;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        await refresh(runId);
      } catch {
        if (!cancelled)
          setError("The pilot continues on the server; status could not be refreshed.");
      } finally {
        if (!cancelled) timer = setTimeout(() => void poll(), 4000);
      }
    }
    timer = setTimeout(() => void poll(), 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, run?.id, refresh]);

  const nextArm =
    run?.contentComparison?.arm === "baseline" && run.status === "complete"
      ? "candidate"
      : !run
        ? "baseline"
        : null;
  const provider = frozenPair(capture)?.provider ?? memberProvider;
  const validPreparation =
    prepared && prepared.arm === nextArm && prepared.pair.provider === provider;

  async function prepare() {
    if (!nextArm || !provider) return;
    setPending(true);
    setPrepared(null);
    setError(null);
    try {
      const result = await preview({
        data: {
          mode: "content-comparison",
          source,
          arm: nextArm,
          caseSetId: "draft-pilot-2",
          provider,
          ...(run?.campaignId ? { campaignId: run.campaignId } : {}),
        },
      });
      setPrepared({
        arm: nextArm,
        hash: result.hash,
        pair: result.plans as unknown as FrozenContentComparisonPlan,
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The frozen pair could not be prepared.",
      );
    } finally {
      setPending(false);
    }
  }

  async function startArm() {
    if (!validPreparation || !prepared || !provider) return;
    readGeneration.current += 1;
    setPending(true);
    setError(null);
    try {
      const started = await start({
        data: {
          mode: "content-comparison",
          source,
          arm: prepared.arm,
          caseSetId: "draft-pilot-2",
          provider,
          expectedPlanHash: prepared.hash,
          ...(prepared.arm === "candidate" && run?.campaignId
            ? { campaignId: run.campaignId }
            : { budget: { dollarCeilingCents: 500, reviewReserveCents: 0 } }),
        },
      });
      try {
        localStorage.setItem(storageKey, started.id);
      } catch {
        // Read-only server recovery remains available.
      }
      setCapture({ run: started, results: [], ledger: null });
      setPrepared(null);
      await refresh(started.id);
    } catch (failure) {
      setPrepared(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "The pilot start could not be confirmed. Reload its status before proceeding.",
      );
      // A lost acknowledgement may still have created a run. Recover; never retry the start.
      try {
        await refresh();
      } catch {
        setLoaded(false);
      }
    } finally {
      setPending(false);
    }
  }

  async function reload() {
    setPending(true);
    setError(null);
    try {
      let stored: string | undefined;
      try {
        stored = localStorage.getItem(storageKey) ?? undefined;
      } catch {
        // Without browser storage, use the server's latest matching run.
      }
      await refresh(run?.id ?? stored);
      setLoaded(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Pilot status is unavailable.");
    } finally {
      setPending(false);
    }
  }

  async function stop() {
    if (!run) return;
    setPending(true);
    setError(null);
    try {
      await stopRun({ data: { runId: run.id } });
      await refresh(run.id);
    } catch {
      setError(
        "The stop could not be confirmed. Refresh the status; the server may still be running.",
      );
    } finally {
      setPending(false);
    }
  }

  async function downloadEvidence() {
    if (!capture?.run) return;
    setPending(true);
    setError(null);
    try {
      const latest = await fetchRun({ data: { runId: capture.run.id } });
      const baseline =
        capture.run.campaignId && capture.run.campaignId !== capture.run.id
          ? await fetchRun({ data: { runId: capture.run.campaignId } })
          : latest;
      downloadJson(
        {
          version: "content-pilot-evidence-1",
          baseline,
          ...(capture.run.contentComparison?.arm === "candidate" ? { candidate: latest } : {}),
        },
        `content-pilot-${capture.run.campaignId ?? capture.run.id}.json`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Pilot evidence could not be downloaded.",
      );
    } finally {
      setPending(false);
    }
  }

  const panelId = `content-pilot-${sourceId}`;
  return (
    <div className="w-full min-w-0 border-t border-rule pt-4">
      <Button
        className="min-h-11 h-auto whitespace-normal"
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setVisited(true);
          setOpen(!open);
        }}
      >
        {open ? `Close ${sourceName} evaluation` : `Evaluate this ${sourceName}`}
      </Button>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Pilot: 4 of 20 body-specific fallback slots, up to eight calls across both copies, $5 total
        generation cap. Evaluation does not approve or activate this {sourceName}.
      </p>
      {visited ? (
        <section
          id={panelId}
          hidden={!open}
          aria-label={`${isDraft ? "Draft" : "Release"} evaluation pilot`}
          className="mt-5 min-w-0 space-y-4"
        >
          <div className="space-y-1 text-sm [overflow-wrap:anywhere]">
            <h4 className="font-serif text-lg">Baseline and {sourceName} pilot</h4>
            <p>
              {isDraft ? `Draft ${source.draftId}` : `Inactive release ID ${source.releaseId}`} ·
              baseline {baseVersion ?? "unrecorded"}
            </p>
            <p className="text-xs text-muted-foreground">
              Authoring model: {authoringModel ?? "unrecorded"}. Evaluation provider:{" "}
              {provider ? LANGUAGE_PROVIDER_LABELS[provider] : "Loading member provider…"}.
            </p>
            <p className="text-xs text-muted-foreground">
              Hard Mars and Uranus; soft Saturn and Neptune. Use the offline suite to check the
              remaining slots. Failed calls are never retried. A completed pilot is not full release
              qualification.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">
              {error}
            </p>
          ) : null}
          {!loaded && !error ? (
            <p aria-busy="true" className="text-sm">
              Checking for a saved pilot…
            </p>
          ) : null}
          {pair ? (
            <div className="space-y-2 rounded border border-rule p-3 text-xs [overflow-wrap:anywhere]">
              <p>
                Frozen model: {pair.model} · {pair.caseSetId} · {pair.changedKeys.length} changed
                keys
              </p>
              <p>
                Baseline {pair.identities.baseline.version}:{" "}
                <code>{pair.identities.baseline.canonicalHash}</code>
              </p>
              <p>
                Candidate {pair.identities.candidate.version}:{" "}
                <code>{pair.identities.candidate.canonicalHash}</code>
              </p>
              <p>
                Application source: <code>{pair.sourceSha}</code>
              </p>
              <p>
                Pair: <code>{pair.hash}</code>
              </p>
              <Button
                className="min-h-11 h-auto whitespace-normal"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadJson(pair, `content-pilot-plan-${pair.hash}.json`)}
              >
                Download frozen pair
              </Button>
            </div>
          ) : null}
          {run ? (
            <div className="space-y-2 text-sm" role="status" aria-live="polite">
              <p>
                {run.contentComparison?.arm === "candidate" ? "Candidate" : "Baseline"}:{" "}
                {run.status} · {run.completed}/{run.total} cases captured.
              </p>
              <p className="text-xs [overflow-wrap:anywhere]">
                Campaign: {run.campaignId ?? run.id}
              </p>
              {run.message ? (
                <p className="text-xs [overflow-wrap:anywhere]">{run.message}</p>
              ) : null}
              {capture?.ledger ? (
                <p className="text-xs text-muted-foreground">
                  {capture.ledger.campaignAttempts}/8 attempts · $
                  {(capture.ledger.campaignReservedMicros / 1_000_000).toFixed(2)}{" "}
                  reserved/accounted against $5. Estimates are not invoices; uncertain captures
                  retain their reservation.
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                The Workflow continues if this page closes. Reopening restores its recorded status.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {nextArm ? (
              <Button
                className="min-h-11 h-auto whitespace-normal"
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !loaded || !provider}
                onClick={() => void prepare()}
              >
                {nextArm === "baseline"
                  ? "Prepare eight-call pilot"
                  : "Prepare candidate from frozen campaign"}
              </Button>
            ) : null}
            {validPreparation ? (
              <Button
                className="min-h-11 h-auto whitespace-normal"
                type="button"
                size="sm"
                disabled={busy || active}
                onClick={() => void startArm()}
              >
                {prepared?.arm === "baseline"
                  ? "Start baseline · $5 cap"
                  : "Start candidate · remaining campaign budget"}
              </Button>
            ) : null}
            <Button
              className="min-h-11 h-auto whitespace-normal"
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void reload()}
            >
              Refresh pilot status
            </Button>
            {run ? (
              <Button
                className="min-h-11 h-auto whitespace-normal"
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => void downloadEvidence()}
              >
                Download pilot evidence
              </Button>
            ) : null}
            {active ? (
              <Button
                className="min-h-11 h-auto whitespace-normal"
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => void stop()}
              >
                Stop after current case
              </Button>
            ) : null}
          </div>
          {capture?.results.length ? (
            <div className="space-y-3">
              {capture.results.map(({ case: row }) => (
                <details key={row.id} className="min-w-0 rounded border border-rule p-3">
                  <summary className="cursor-pointer text-sm [overflow-wrap:anywhere]">
                    {row.id} · {row.diagnostics.outcome}
                  </summary>
                  <p className="mt-3 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    Supplied interpretation keys:{" "}
                    {row.facts
                      .filter((fact) => /^I\d+$/.test(fact.id))
                      .map((fact) => fact.sourceKey)
                      .filter(Boolean)
                      .join(", ") || "none"}
                    . Citations alone do not establish meaning.
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
                    {row.output.body}
                  </p>
                  <p className="mt-3 text-sm [overflow-wrap:anywhere]">{row.output.prompt}</p>
                </details>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export function ContentDraftEvaluation({
  draftId,
  ...props
}: {
  draftId: string;
  userId: string;
  baseVersion: string | null;
  authoringModel: string | null;
  memberProvider?: LanguageProvider | undefined;
  disabled?: boolean;
}) {
  return (
    <ContentComparisonEvaluation key={draftId} source={{ kind: "draft", draftId }} {...props} />
  );
}

type ReleaseChoice = { id: string; version: string; is_active: boolean };

export function InactiveReleaseEvaluation({
  release,
  releases,
  userId,
  memberProvider,
  disabled,
}: {
  release: ReleaseChoice;
  releases: ReleaseChoice[];
  userId: string;
  memberProvider?: LanguageProvider | undefined;
  disabled?: boolean;
}) {
  const choices = releases.filter((item) => item.id !== release.id);
  const [selected, setSelected] = useState(
    () => choices.find((item) => item.is_active)?.id ?? choices[0]?.id ?? "",
  );
  const baseline = choices.find((item) => item.id === selected);
  if (release.is_active) return null;
  return (
    <div className="mt-4 min-w-0 space-y-3 border-t border-rule pt-4">
      <label className="block text-sm" htmlFor={`release-baseline-${release.id}`}>
        Evaluation baseline for {release.version}
      </label>
      <select
        id={`release-baseline-${release.id}`}
        className="min-h-11 w-full rounded border border-input bg-background px-3 py-2 text-sm"
        value={baseline?.id ?? ""}
        onChange={(event) => setSelected(event.target.value)}
        disabled={disabled || !choices.length}
      >
        <option value="" disabled>
          Choose a baseline release
        </option>
        {choices.map((item) => (
          <option key={item.id} value={item.id}>
            {item.version}
            {item.is_active ? " · currently live" : " · inactive"}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
        Candidate release ID: {release.id}. Baseline release ID: {baseline?.id ?? "not selected"}.
      </p>
      {baseline ? (
        <ContentComparisonEvaluation
          key={`${release.id}:${baseline.id}`}
          source={{ kind: "release", releaseId: release.id, baselineReleaseId: baseline.id }}
          userId={userId}
          baseVersion={baseline.version}
          authoringModel={null}
          memberProvider={memberProvider}
          disabled={Boolean(disabled)}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          A different recorded release is required for comparison.
        </p>
      )}
    </div>
  );
}
