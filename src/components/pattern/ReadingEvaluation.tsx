import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LanguageProviderChoice,
  type LanguageProviderStatus,
} from "@/components/pattern/LanguageProviderChoice";
import { Button } from "@/components/ui/button";
import { diagnosticLabel, type LanguageProvider } from "@/lib/ai/diagnostics";
import {
  combineReadingEvaluationResults,
  READING_EVALUATION_CATALOG,
  READING_EVALUATION_STALL_MS,
  readingEvaluationRunActive,
  serializeReadingEvaluationReport,
  summarizeReadingEvaluation,
  type ReadingEvaluationBundleSource,
  type ReadingEvaluationCaseResult,
  type ReadingEvaluationCaseRow,
  type ReadingEvaluationRun,
} from "@/lib/ai/reading-evaluation.shared";
import {
  fetchReadingEvaluationRun,
  startReadingEvaluationRun,
  stopReadingEvaluationRun,
} from "@/lib/pattern.functions";

/** Evaluation-only copy; choosing one never publishes or activates a release. */
const COPY_CHOICES: { value: ReadingEvaluationBundleSource; label: string; note: string }[] = [
  {
    value: "active",
    label: "Current active copy",
    note: "Uses the effective published release, or the built-in fallback when no release is active.",
  },
  {
    value: "builtin",
    label: "Natal-free built-in baseline",
    note: "Uses the shipped built-in copy without the natal catalogue.",
  },
  {
    value: "natal-candidate",
    label: "Inactive natal candidate",
    note: "Uses the unpublished natal candidate for this run only. Selecting it activates nothing.",
  },
  {
    value: "transit-candidate",
    label: "Inactive transit candidate",
    note: "Uses the unpublished transit chapters with synthetic tracks for this run only. Selecting it activates nothing.",
  },
];

const POLL_MS = 4_000;

function outcomeLabel(row: ReadingEvaluationCaseRow): string {
  const { outcome, code } = row.diagnostics;
  return code === "not_configured"
    ? "Not configured"
    : outcome === "accepted"
      ? "Accepted model draft"
      : outcome === "rejected"
        ? "Validation rejected"
        : outcome === "unavailable"
          ? "Gateway unavailable"
          : "Skipped before a model call";
}

function EvaluationCase({ result }: { result: ReadingEvaluationCaseResult }) {
  const [expanded, setExpanded] = useState(false);
  const row = result.case;
  const label = READING_EVALUATION_CATALOG.find((fixed) => fixed.id === row.id)?.label ?? row.id;
  const panelId = `synthetic-evaluation-${row.id}`;
  return (
    <article className="min-w-0 rounded-md border border-rule bg-card">
      <Button
        variant="ghost"
        type="button"
        aria-label={`Review ${label}`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
        className="h-auto min-h-11 w-full justify-between gap-4 whitespace-normal px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm text-foreground [overflow-wrap:anywhere]">{label}</span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {outcomeLabel(row)}
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          {expanded ? "−" : "+"}
        </span>
      </Button>
      <div id={panelId} hidden={!expanded} className="min-w-0 border-t border-rule p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{row.description}</p>
        <p className="mt-3 text-sm text-foreground">
          {diagnosticLabel(row.diagnostics.code)}
          {row.diagnostics.paragraph !== null ? ` · paragraph ${row.diagnostics.paragraph}` : ""}
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            ({row.diagnostics.code})
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {row.config.tone} tone · {row.config.depth} depth · {row.config.timeZone} ·{" "}
          {row.config.day}
          {row.diagnostics.durationMs !== null ? ` · ${row.diagnostics.durationMs} ms` : ""}
        </p>
        <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-2">
          <section className="min-w-0" aria-label={`${label} actual model draft`}>
            <h4 className="technical text-muted-foreground">Actual model draft</h4>
            {row.candidate ? (
              <>
                {row.candidate.truncated ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Draft capture was truncated to the report limit. The displayed reading appears
                    alongside it.
                  </p>
                ) : null}
                <ol className="mt-3 space-y-4">
                  {row.candidate.paragraphs.map((paragraph, index) => (
                    <li key={index} className="min-w-0">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {paragraph.text ?? "Paragraph text was unavailable."}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        ¶{index + 1} · cites{" "}
                        {paragraph.facts.length ? paragraph.facts.join(", ") : "no IDs"}
                      </p>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {row.diagnostics.outcome === "skipped"
                  ? "No model draft was requested for this quiet case."
                  : "No model draft was returned for this case."}
              </p>
            )}
          </section>
          <section className="min-w-0" aria-label={`${label} displayed reading`}>
            <h4 className="technical text-muted-foreground">Displayed reading</h4>
            <p className="mt-3 text-base text-foreground [overflow-wrap:anywhere]">
              {row.output.headline}
            </p>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
              {row.output.body}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {row.output.prompt}
            </p>
          </section>
        </div>
        <section
          className="mt-6 min-w-0 border-t border-rule pt-4"
          aria-label={`${label} template reading`}
        >
          <h4 className="technical text-muted-foreground">Template reading</h4>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
            {row.template.body}
          </p>
        </section>
        {row.interpretationPlan ? (
          <section
            className="mt-6 min-w-0 border-t border-rule pt-4"
            aria-label={`${label} published relationship`}
          >
            <h4 className="technical text-muted-foreground">Published relationship</h4>
            <p className="mt-2 break-words text-sm">
              {row.interpretationPlan.synthesis?.relationship ?? row.interpretationPlan.pairStatus}
              {" · "}
              {row.interpretationPlan.releaseVersion}
            </p>
            {row.interpretationPlan.pairRuleKey ? (
              <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                {row.interpretationPlan.pairRuleKey}
              </p>
            ) : null}
          </section>
        ) : null}
        {row.natalLensPlan ? (
          <section
            className="mt-6 min-w-0 border-t border-rule pt-4"
            aria-label={`${label} synthetic natal lens`}
          >
            <h4 className="text-base">Synthetic natal selection</h4>
            <p className="mt-2 text-sm">
              {row.natalLensPlan.status} ·{" "}
              {row.natalReliability?.status ?? "legacy assessment absent"}
            </p>
            {row.natalLensPlan.lens ? (
              <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                {row.natalLensPlan.lens.ruleKey} ·{" "}
                {row.natalLensPlan.lens.evidence.map((e) => `${e.kind}: service`).join(" · ")}
              </p>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Synthetic source labels exercise screening and selection; they do not establish live
              Swiss accuracy.
            </p>
          </section>
        ) : null}
        {row.transitStoryPlan ? (
          <section
            className="mt-6 min-w-0 border-t border-rule pt-4"
            aria-label={`${label} synthetic transit story`}
          >
            <h4 className="text-base">Synthetic transit story</h4>
            <p className="mt-2 text-sm">
              {row.transitStoryPlan.status === "selected"
                ? `${row.transitStoryPlan.chapter} · ${row.transitStoryPlan.chronologySentence}`
                : `Omitted: ${row.transitStoryPlan.reason}`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Synthetic tracks test proof validation; they do not qualify native Swiss accuracy.
            </p>
          </section>
        ) : null}
        <section
          className="mt-6 min-w-0 border-t border-rule pt-4"
          aria-label={`${label} supplied facts`}
        >
          <h4 className="technical text-muted-foreground">Supplied facts</h4>
          <dl className="mt-3 space-y-3">
            {row.facts.map((fact) => (
              <div key={fact.id} className="min-w-0">
                <dt className="font-mono text-xs text-foreground">{fact.id}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {fact.statement}
                  {fact.sourceKey ? (
                    <span className="mt-1 block font-mono">
                      {fact.sourceKey} · {fact.releaseVersion}
                    </span>
                  ) : null}
                  {fact.dependsOn?.length ? (
                    <span className="mt-1 block">Parents: {fact.dependsOn.join(", ")}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </article>
  );
}

/**
 * A server-side run: the edge plane requests one case at a time with no retries and
 * keeps going after this page closes. The page starts, stops and watches the run.
 */
export function ReadingEvaluation({
  providerStatus,
}: {
  providerStatus?: LanguageProviderStatus | undefined;
}) {
  const startRun = useServerFn(startReadingEvaluationRun);
  const fetchRun = useServerFn(fetchReadingEvaluationRun);
  const stopRun = useServerFn(stopReadingEvaluationRun);
  const fetchRef = useRef(fetchRun);
  fetchRef.current = fetchRun;
  const [provider, setProvider] = useState<LanguageProvider>("lovable");
  const [bundleSource, setBundleSource] = useState<ReadingEvaluationBundleSource>("active");
  const [run, setRun] = useState<ReadingEvaluationRun | null>(null);
  const [results, setResults] = useState<ReadingEvaluationCaseResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // The stored results this page holds, so each poll asks only for newer cases.
  const held = useRef<{ runId: string | null; results: ReadingEvaluationCaseResult[] }>({
    runId: null,
    results: [],
  });
  const polling = useRef(false);

  const refresh = useCallback(async (runId?: string) => {
    if (polling.current) return;
    polling.current = true;
    try {
      const append = Boolean(runId && held.current.runId === runId);
      const data = await fetchRef.current({
        data: runId ? { runId, after: append ? held.current.results.length : 0 } : {},
      });
      const next = data.run
        ? append && data.run.id === held.current.runId
          ? [...held.current.results, ...data.results]
          : data.results
        : [];
      held.current = { runId: data.run?.id ?? null, results: next };
      setRun(data.run);
      setResults(next);
      setNow(Date.now());
    } finally {
      polling.current = false;
    }
  }, []);

  // Return to the latest run, whether it is still going or finished while away.
  useEffect(() => {
    refresh()
      .catch(() => setMessage("The latest evaluation run could not be loaded."))
      .finally(() => setLoaded(true));
  }, [refresh]);

  const busy = Boolean(run && readingEvaluationRunActive(run.status));
  const runId = run?.id;
  useEffect(() => {
    if (!busy || !runId) return;
    const timer = setInterval(() => {
      refresh(runId).catch(() => setNow(Date.now()));
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [busy, runId, refresh]);

  const rows = results.map((result) => result.case);
  const summary = summarizeReadingEvaluation(rows);
  const total = run?.total ?? READING_EVALUATION_CATALOG.length;
  const current = READING_EVALUATION_CATALOG[results.length];
  const complete = run?.status === "complete";
  const idleMinutes = run ? Math.max(1, Math.round((now - Date.parse(run.updatedAt)) / 60_000)) : 0;
  const stalled = Boolean(
    busy && run && now - Date.parse(run.updatedAt) > READING_EVALUATION_STALL_MS,
  );

  async function start() {
    setPending(true);
    setMessage(null);
    setDownloadError(null);
    try {
      const started = await startRun({ data: { bundleSource, provider } });
      held.current = { runId: started.id, results: [] };
      setRun(started);
      setResults([]);
      setNow(Date.now());
    } catch (error) {
      setMessage(
        error instanceof Error && error.message ? error.message : "The run could not be started.",
      );
    } finally {
      setPending(false);
    }
  }

  async function stop() {
    if (!run) return;
    setPending(true);
    try {
      setRun(await stopRun({ data: { runId: run.id } }));
    } catch {
      setMessage("The stop request was not received. The run continues; try again.");
    } finally {
      setPending(false);
    }
  }

  function download() {
    setDownloadError(null);
    try {
      const report = combineReadingEvaluationResults(results, { partial: !complete });
      const blob = new Blob([serializeReadingEvaluationReport(report)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `reading-evaluation-${report.partial ? "partial" : "complete"}-${report.bundleSource ?? "copy"}-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(
        "The report could not be downloaded. Completed results are still available.",
      );
    }
  }

  const progress = !loaded
    ? "Loading the latest evaluation run…"
    : !run
      ? "No synthetic evaluation has run yet."
      : stalled
        ? `${results.length}/${total} cases complete · no progress for ${idleMinutes} minutes. The edge workflow may have stopped; you can start a new run.`
        : busy
          ? `${results.length}/${total} cases complete · ${
              run.status === "queued"
                ? "starting the run"
                : `${run.status === "stopping" ? "stopping after" : "running"} ${current?.label ?? "the current case"}`
            }`
          : complete
            ? `${results.length}/${total} cases complete`
            : run.status === "stopped"
              ? `Stopped · ${results.length}/${total} cases complete. This report is partial.`
              : `Partial run · ${results.length}/${total} cases complete`;
  const alert = message ?? (run && !busy ? run.message : null);

  return (
    <section
      className="mt-8 min-w-0 border-t border-rule pt-6"
      aria-labelledby="synthetic-evaluation-heading"
    >
      <h3 id="synthetic-evaluation-heading" className="text-xl">
        Synthetic reading evaluation
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Run the {READING_EVALUATION_CATALOG.length} fixed synthetic cases against the selected
        provider's model and the evaluation copy chosen below, one at a time: up to{" "}
        {READING_EVALUATION_CATALOG.filter((row) => row.expectsModel).length} model calls. Quiet
        days and cases without a published primary interpretation skip the model. This uses
        synthetic chart inputs and no account readings or notes. The run continues on the server if
        you leave or close this page; your latest run and its results load when you return.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Acceptance measures the current validator on this case set. Review specificity, voice,
        repetition, grounding, natal lens integration, temporal coherence and chapter integration
        yourself, including invented history, promised resolution and unsupported personal claims;
        these results do not assign writing-quality scores or establish a production acceptance
        rate.
      </p>
      <div className="mt-4 max-w-md min-w-0">
        <label
          htmlFor="synthetic-evaluation-copy"
          className="technical block text-muted-foreground"
        >
          Evaluation copy
        </label>
        <select
          id="synthetic-evaluation-copy"
          value={bundleSource}
          disabled={busy && !stalled}
          aria-describedby="synthetic-evaluation-copy-note"
          onChange={(event) => setBundleSource(event.target.value as ReadingEvaluationBundleSource)}
          className="mt-1.5 min-h-11 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {COPY_CHOICES.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
        <p
          id="synthetic-evaluation-copy-note"
          className="mt-1.5 text-xs leading-relaxed text-muted-foreground"
        >
          {COPY_CHOICES.find((choice) => choice.value === bundleSource)?.note} The choice is fixed
          when a run starts.
        </p>
      </div>
      <div className="mt-4">
        <LanguageProviderChoice
          value={provider}
          onChange={setProvider}
          disabled={busy && !stalled}
          configured={providerStatus}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void start()}
          disabled={!loaded || pending || (busy && !stalled)}
          className="min-h-11"
        >
          Run synthetic evaluation
        </Button>
        {busy && !stalled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void stop()}
            disabled={pending || run?.status === "stopping"}
            className="min-h-11 whitespace-normal"
          >
            {run?.status === "stopping"
              ? "Stopping after current case…"
              : "Stop after current case"}
          </Button>
        ) : null}
        {results.length ? (
          <Button
            type="button"
            variant="outline"
            onClick={download}
            className="min-h-11 whitespace-normal"
          >
            {complete ? "Download report" : "Download partial report"}
          </Button>
        ) : null}
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]"
      >
        {progress}
      </p>
      {busy && !stalled ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You can leave this page while the run continues. Stopping lets the current request finish
          and keeps its result. It prevents the next case from starting.
        </p>
      ) : null}
      {alert ? (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-destructive">
          {alert}
        </p>
      ) : null}
      {downloadError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {downloadError}
        </p>
      ) : null}
      {rows.length ? (
        <>
          <dl className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Acceptance on this synthetic run",
                value: summary.modelAttempts
                  ? `${summary.outcomes.accepted}/${summary.modelAttempts} attempts · ${new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(summary.syntheticModelAcceptanceRate ?? 0)}`
                  : "No model attempts",
              },
              { label: "Accepted drafts", value: String(summary.outcomes.accepted) },
              { label: "Validation rejected", value: String(summary.outcomes.rejected) },
              { label: "Gateway unavailable", value: String(summary.outcomes.unavailable) },
              { label: "Skipped before a model call", value: String(summary.outcomes.skipped) },
              {
                label: "Completed cases",
                value: `${rows.length}/${READING_EVALUATION_CATALOG.length}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0 border border-rule bg-card p-3">
                <dt className="technical text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-mono text-sm text-foreground [overflow-wrap:anywhere]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            The denominator includes attempted cases only. Quiet skips and missing configuration are
            excluded.{" "}
            {complete
              ? "This run contains all fixed cases and can be compared with another complete export using the existing comparison CLI."
              : "This run is partial; downloaded reports include completed cases only and cannot be used as a complete comparison."}
          </p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {results[0]?.metadata.model} · {results[0]?.metadata.promptVersion} ·{" "}
            {results[0]?.metadata.validatorVersion} ·{" "}
            {COPY_CHOICES.find((choice) => choice.value === results[0]?.metadata.bundleSource)
              ?.label ?? "Unrecorded copy choice"}{" "}
            · {results[0]?.metadata.bundleVersion} · bundle{" "}
            {results[0]?.metadata.bundleHash.slice(0, 12)} ·{" "}
            {results[0]?.metadata.gatewayTimeoutMs == null
              ? "Unrecorded gateway budget"
              : `${results[0].metadata.gatewayTimeoutMs / 1000}s gateway budget`}
          </p>
          <div className="mt-5 space-y-3">
            {results.map((result) => (
              <EvaluationCase key={result.case.id} result={result} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
