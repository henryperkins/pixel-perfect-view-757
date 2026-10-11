import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import {
  LanguageProviderChoice,
  type LanguageProviderStatus,
} from "@/components/pattern/LanguageProviderChoice";
import { Button } from "@/components/ui/button";
import {
  diagnosticLabel,
  languageModel,
  readDailyDiagnostics,
  type LanguageProvider,
} from "@/lib/ai/diagnostics";
import {
  combineReadingEvaluationResults,
  READING_EVALUATION_CATALOG,
  serializeReadingEvaluationReport,
  summarizeReadingEvaluation,
  type ReadingEvaluationBundleSource,
  type ReadingEvaluationCaseResult,
  type ReadingEvaluationCaseRow,
} from "@/lib/ai/reading-evaluation.shared";
import { runReadingEvaluationCase } from "@/lib/pattern.functions";

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
];

type RunStatus = "idle" | "running" | "stopping" | "complete" | "stopped" | "halted" | "error";
type RunState = {
  status: RunStatus;
  results: ReadingEvaluationCaseResult[];
  currentId: string | null;
  message: string | null;
};
const INITIAL_STATE: RunState = { status: "idle", results: [], currentId: null, message: null };
const HALT_CODES = new Set(["not_configured", "auth", "credit", "rate_limit"]);

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

/** A manual, page-memory run: one case request at a time, with no retries. */
export function ReadingEvaluation({
  providerStatus,
}: {
  providerStatus?: LanguageProviderStatus | undefined;
}) {
  const runCase = useServerFn(runReadingEvaluationCase);
  const [provider, setProvider] = useState<LanguageProvider>("lovable");
  const [state, setState] = useState<RunState>(INITIAL_STATE);
  const [bundleSource, setBundleSource] = useState<ReadingEvaluationBundleSource>("active");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const mounted = useRef(true);
  const activeRun = useRef<{ stop: boolean } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (activeRun.current) activeRun.current.stop = true;
      activeRun.current = null;
    };
  }, []);

  const busy = state.status === "running" || state.status === "stopping";
  const rows = state.results.map((result) => result.case);
  const summary = summarizeReadingEvaluation(rows);
  const current = READING_EVALUATION_CATALOG.find((fixed) => fixed.id === state.currentId);
  const complete = state.status === "complete";

  async function start() {
    if (activeRun.current) return;
    const control = { stop: false };
    activeRun.current = control;
    setDownloadError(null);
    // Freeze the case sequence, copy choice and provider before the first request.
    const cases = READING_EVALUATION_CATALOG.map((fixed) => ({ ...fixed }));
    const frozenSource = bundleSource;
    const runProvider = provider;
    let results: ReadingEvaluationCaseResult[] = [];
    const publish = (
      status: RunStatus,
      currentId: string | null,
      message: string | null = null,
    ) => {
      if (mounted.current && activeRun.current === control)
        setState({ status, results, currentId, message });
    };
    publish("running", cases[0]?.id ?? null);
    try {
      for (const fixed of cases) {
        if (control.stop) break;
        publish("running", fixed.id);
        let result: ReadingEvaluationCaseResult;
        try {
          result = await runCase({
            data: { caseId: fixed.id, bundleSource: frozenSource, provider: runProvider },
          });
        } catch {
          publish(
            "error",
            null,
            "This case could not be completed. Completed results are still available; no automatic retry was made.",
          );
          return;
        }
        if (!mounted.current || activeRun.current !== control) return;
        const diagnostics = readDailyDiagnostics(result?.case?.diagnostics);
        if (
          result?.case?.id !== fixed.id ||
          result.metadata?.bundleSource !== frozenSource ||
          result.metadata?.model !== languageModel(runProvider) ||
          !diagnostics ||
          (diagnostics.outcome === "accepted") !== (result.case.output?.mode === "model")
        ) {
          publish(
            "error",
            null,
            "This case returned an incomplete result. Completed results are still available.",
          );
          return;
        }
        const next = [...results, result];
        try {
          combineReadingEvaluationResults(next, { partial: true });
        } catch {
          publish(
            "error",
            null,
            "Evaluation settings changed during this run. Completed results are still available; start a new run to compare one configuration.",
          );
          return;
        }
        results = next;
        if (HALT_CODES.has(diagnostics.code)) {
          publish(
            "halted",
            null,
            `Run stopped: ${diagnosticLabel(diagnostics.code)}. Remaining cases were not requested.`,
          );
          return;
        }
        if (control.stop) break;
      }
      publish(results.length === cases.length ? "complete" : "stopped", null);
    } catch {
      publish(
        "error",
        null,
        "This run could not be completed. Completed results are still available; no automatic retry was made.",
      );
    } finally {
      if (activeRun.current === control) activeRun.current = null;
    }
  }

  function stop() {
    if (!activeRun.current) return;
    activeRun.current.stop = true;
    setState((previous) => ({ ...previous, status: "stopping" }));
  }

  function download() {
    setDownloadError(null);
    try {
      const report = combineReadingEvaluationResults(state.results, { partial: !complete });
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

  const progress = busy
    ? `${state.results.length}/${READING_EVALUATION_CATALOG.length} cases complete · ${state.status === "stopping" ? "stopping after" : "running"} ${current?.label ?? "the current case"}`
    : complete
      ? `${state.results.length}/${READING_EVALUATION_CATALOG.length} cases complete`
      : state.status === "stopped"
        ? `Stopped · ${state.results.length}/${READING_EVALUATION_CATALOG.length} cases complete. This report is partial.`
        : state.status === "idle"
          ? "No synthetic evaluation has run on this page."
          : `Partial run · ${state.results.length}/${READING_EVALUATION_CATALOG.length} cases complete`;

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
        synthetic chart inputs and no account readings or notes. Results stay in this page until you
        leave or start again.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Acceptance measures the current validator on this case set. Review specificity, voice,
        repetition, grounding and natal lens integration yourself, including unsupported personal
        claims; these results do not assign writing-quality scores or establish a production
        acceptance rate.
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
          disabled={busy}
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
          disabled={busy}
          configured={providerStatus}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={() => void start()} disabled={busy} className="min-h-11">
          Run synthetic evaluation
        </Button>
        {busy ? (
          <Button
            type="button"
            variant="outline"
            onClick={stop}
            disabled={state.status === "stopping"}
            className="min-h-11 whitespace-normal"
          >
            {state.status === "stopping"
              ? "Stopping after current case…"
              : "Stop after current case"}
          </Button>
        ) : null}
        {state.results.length ? (
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
      {busy ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Stopping lets the current request finish and keeps its result. It prevents the next case
          from starting.
        </p>
      ) : null}
      {state.message ? (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-destructive">
          {state.message}
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
            {state.results[0]?.metadata.model} · {state.results[0]?.metadata.promptVersion} ·{" "}
            {state.results[0]?.metadata.validatorVersion} ·{" "}
            {COPY_CHOICES.find((choice) => choice.value === state.results[0]?.metadata.bundleSource)
              ?.label ?? "Unrecorded copy choice"}{" "}
            · {state.results[0]?.metadata.bundleVersion} · bundle{" "}
            {state.results[0]?.metadata.bundleHash.slice(0, 12)} ·{" "}
            {state.results[0]?.metadata.gatewayTimeoutMs == null
              ? "Unrecorded gateway budget"
              : `${state.results[0].metadata.gatewayTimeoutMs / 1000}s gateway budget`}
          </p>
          <div className="mt-5 space-y-3">
            {state.results.map((result) => (
              <EvaluationCase key={result.case.id} result={result} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
