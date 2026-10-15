import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LanguageProviderChoice,
  type LanguageProviderStatus,
} from "@/components/pattern/LanguageProviderChoice";
import { Button } from "@/components/ui/button";
import { EvaluationCaptureNotice } from "./EvaluationCaptureNotice";
import { diagnosticLabel, type LanguageProvider } from "@/lib/ai/diagnostics";
import {
  combineReadingEvaluationResults,
  READING_EVALUATION_CATALOG,
  READING_EVALUATION_STALL_MS,
  readingEvaluationRunActive,
  readingEvaluationCurrentCaseLabel,
  readingEvaluationReportScope,
  serializeReadingEvaluationReport,
  summarizeReadingEvaluation,
  type ReadingEvaluationBundleSource,
  type ReadingEvaluationCaseResult,
  type ReadingEvaluationCaseRow,
  type ReadingEvaluationRun,
  type ReadingEvaluationLedger,
} from "@/lib/ai/reading-evaluation.shared";
import { QUALIFICATION_PROFILES, type QualificationProfile } from "@/lib/ai/qualification-profiles";
import {
  fetchReadingEvaluationRun,
  startReadingEvaluationRun,
  stopReadingEvaluationRun,
  previewReadingEvaluationPlan,
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
  {
    value: "writing-candidate",
    label: "Inactive concrete-writing candidate",
    note: "Uses the schema-5 scenes and focused reflections for this synthetic run. It does not activate member copy.",
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

export function EvaluationCase({
  result,
  position,
  idPrefix = "synthetic-evaluation",
}: {
  result: ReadingEvaluationCaseResult;
  position: number;
  idPrefix?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const row = result.case;
  const label = READING_EVALUATION_CATALOG.find((fixed) => fixed.id === row.id)?.label ?? row.id;
  const panelId = `${idPrefix}-${row.id}-${position}`;
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
                {row.candidate.captureLossless === false && !row.candidate.truncated ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Draft capture did not retain every required field. It is unavailable for a
                    lossless review of the raw output.
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
                      {paragraph.scenes ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Declared illustrations: {paragraph.scenes.join(", ") || "none"}
                        </p>
                      ) : null}
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
          {row.writing ? (
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>
                Editorial candidate: {row.writing.candidateQuality.outcome} · final wording:{" "}
                {row.writing.finalQuality.outcome} · {row.writing.renderMode}
              </p>
              <p className="break-words font-mono">
                {[
                  ...new Set(
                    [
                      ...row.writing.candidateQuality.issues,
                      ...row.writing.finalQuality.issues,
                    ].map((issue) => issue.code),
                  ),
                ].join(", ") || "No editorial issue codes recorded"}
              </p>
              {row.reflectionPlan ? (
                <p>
                  Reflection source: {row.reflectionPlan.themeFactId ?? "quiet"} ·{" "}
                  {row.reflectionPlan.frameKey ?? "source fallback"}
                </p>
              ) : null}
            </div>
          ) : null}
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
  const previewPlan = useServerFn(previewReadingEvaluationPlan);
  const fetchRef = useRef(fetchRun);
  fetchRef.current = fetchRun;
  const [provider, setProvider] = useState<LanguageProvider>("lovable");
  const [bundleSource, setBundleSource] = useState<ReadingEvaluationBundleSource>("active");
  const [run, setRun] = useState<ReadingEvaluationRun | null>(null);
  const [results, setResults] = useState<ReadingEvaluationCaseResult[]>([]);
  const [ledger, setLedger] = useState<ReadingEvaluationLedger | null>(null);
  const [mode, setMode] = useState<"standard" | "writing" | "enterprise">("standard");
  const [profile, setProfile] = useState<QualificationProfile>("writing-base");
  const [thinking, setThinking] = useState<"LOW" | "MEDIUM">("LOW");
  const [campaign, setCampaign] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [reserve, setReserve] = useState("");
  const [dry, setDry] = useState<Awaited<ReturnType<typeof previewPlan>> | null>(null);
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
      setLedger(data.ledger);
      setNow(Date.now());
      return { ...data, results: next };
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
  const currentLabel = readingEvaluationCurrentCaseLabel(run);
  const settings =
    mode === "writing"
      ? {
          bundleSource: "writing-candidate" as const,
          provider: "lovable" as const,
          qualificationProfile: profile,
        }
      : mode === "enterprise"
        ? {
            bundleSource: "transit-candidate" as const,
            provider: "gemini-enterprise" as const,
            enterpriseThinking: thinking,
          }
        : { bundleSource, provider };
  function saveJson(value: unknown, name: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function prepare() {
    setPending(true);
    setMessage(null);
    try {
      const plan = await previewPlan({ data: settings });
      setDry(plan);
      saveJson(plan, `evaluation-dry-plan-${mode}.json`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The source plans could not be prepared.",
      );
    } finally {
      setPending(false);
    }
  }
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
      const started = await startRun({
        data: {
          ...settings,
          ...(mode !== "standard"
            ? {
                expectedPlanHash: dry?.hash,
                ...(campaign.trim()
                  ? { campaignId: campaign.trim() }
                  : {
                      budget: {
                        dollarCeilingCents: Math.round(Number(ceiling) * 100),
                        reviewReserveCents: Math.round(Number(reserve) * 100),
                      },
                    }),
              }
            : {}),
        },
      });
      held.current = { runId: started.id, results: [] };
      setRun(started);
      setResults([]);
      setLedger(null);
      setNow(Date.now());
      await refresh(started.id);
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

  async function download(stored = false) {
    setDownloadError(null);
    setPending(true);
    try {
      const latest = await refresh(run?.id);
      if (!latest?.run) throw Error("Saved evaluation is unavailable.");
      if (stored) {
        saveJson(
          { run: latest.run, ledger: latest.ledger },
          `evaluation-stored-attempts-${latest.run.id}.json`,
        );
        return;
      }
      const report = combineReadingEvaluationResults(latest.results, {
        partial: latest.run.status !== "complete",
      });
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
        "The saved captures could not be refreshed or combined. Refresh saved status or download stored attempts to retain every outcome and source plan.",
      );
    } finally {
      setPending(false);
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
                : `${run.status === "stopping" ? "stopping after" : "running"} ${currentLabel ?? "the current case"}`
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
      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          Evaluation scope
          <select
            className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3"
            value={mode}
            disabled={busy && !stalled}
            onChange={(e) => {
              setMode(e.target.value as typeof mode);
              setDry(null);
            }}
          >
            <option value="standard">Fixed suite</option>
            <option value="writing">Matched writing qualification</option>
            <option value="enterprise">Enterprise LOW / MEDIUM pilot</option>
          </select>
        </label>
        {mode !== "standard" ? (
          <>
            {mode === "writing" ? (
              <label className="block text-sm">
                Qualification arm
                <select
                  className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3"
                  value={profile}
                  disabled={busy && !stalled}
                  onChange={(e) => {
                    setProfile(e.target.value as QualificationProfile);
                    setDry(null);
                  }}
                >
                  {QUALIFICATION_PROFILES.map((p, i) => (
                    <option key={p} value={p}>
                      {
                        [
                          "A · concrete writing",
                          "B · writing and natal lens",
                          "C · final writing, natal and story",
                          "D · previous writing, natal and story",
                        ][i]
                      }
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm">
                Pilot arm
                <select
                  className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3"
                  value={thinking}
                  disabled={busy && !stalled}
                  onChange={(e) => {
                    setThinking(e.target.value as typeof thinking);
                    setDry(null);
                  }}
                >
                  <option value="LOW">LOW · first arm</option>
                  <option value="MEDIUM">MEDIUM · matched arm</option>
                </select>
              </label>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {mode === "writing"
                ? "The four frozen arms share one campaign: 196 planned calls, with 28 further calls reserved for the seven-day review. Use the member Lovable provider at 60 seconds."
                : "Six fixed cases, two independent repetitions per setting: at most 24 native Enterprise calls at 60 seconds. These are separate observations; failed calls are never repeated."}
            </p>
            <label className="block text-sm">
              Existing campaign ID{" "}
              <span className="text-muted-foreground">(leave blank for A or LOW)</span>
              <input
                className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3 font-mono"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                disabled={busy && !stalled}
              />
            </label>
            {!campaign.trim() ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Campaign reservation ceiling (USD)
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3"
                    value={ceiling}
                    onChange={(e) => setCeiling(e.target.value)}
                    disabled={busy && !stalled}
                  />
                </label>
                <label className="block text-sm">
                  Separate paid-review reserve (USD)
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.01"
                    className="mt-2 block min-h-11 w-full rounded-md border border-rule bg-card px-3"
                    value={reserve}
                    onChange={(e) => setReserve(e.target.value)}
                    disabled={busy && !stalled}
                  />
                </label>
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Reservations use a conservative token estimate. They are not invoices or a verified
              Lovable billing limit. Verify your account rates and approved spend before starting.
              Missing model identity or usage stops qualification and retains the full reservation.
            </p>
            {dry ? (
              <p className="break-all text-xs text-muted-foreground">
                Prepared source: {dry.sourceSha ?? "unknown"} · {dry.attemptLimit} planned calls ·{" "}
                {dry.hash}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {mode === "enterprise"
          ? "Run 12 planned observations for the selected Enterprise arm, one at a time."
          : `Run the ${READING_EVALUATION_CATALOG.length} fixed synthetic cases against the selected provider and copy, one at a time: up to ${READING_EVALUATION_CATALOG.filter((row) => row.expectsModel).length} model calls.`}{" "}
        Quiet days and cases without a published primary interpretation skip the model. This uses
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
      <div className="mt-4 max-w-md min-w-0" hidden={mode !== "standard"}>
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
      <div className="mt-4" hidden={mode !== "standard"}>
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
          variant="outline"
          onClick={() => void prepare()}
          disabled={!loaded || pending || (busy && !stalled)}
          className="min-h-11 whitespace-normal"
        >
          Prepare and download source plans
        </Button>
        <Button
          type="button"
          onClick={() => void start()}
          disabled={
            !loaded ||
            pending ||
            (busy && !stalled) ||
            (mode !== "standard" &&
              (!dry ||
                (!campaign.trim() &&
                  (!ceiling || reserve === "" || Number(reserve) >= Number(ceiling)))))
          }
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
        {ledger?.entries.length ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 whitespace-normal"
            disabled={pending}
            onClick={() => void download(true)}
          >
            Download stored attempts
          </Button>
        ) : null}
        {results.length ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void download()}
            className="min-h-11 whitespace-normal"
          >
            {complete ? "Download report" : "Download partial report"}
          </Button>
        ) : null}
        {run ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setMessage(null);
              void refresh(run.id).catch(() =>
                setMessage("The saved status could not be refreshed. No new request was made."),
              );
            }}
          >
            Refresh saved status
          </Button>
        ) : null}
      </div>
      <EvaluationCaptureNotice run={run} ledger={ledger} />
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]"
      >
        {progress}
      </p>
      {ledger ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {ledger.campaignAttempts} attempts or reservations · $
          {(ledger.campaignReservedMicros / 1_000_000).toFixed(4)} reserved estimate ·{" "}
          {ledger.entries.filter((e) => e.capture === "uncertain").length} uncertain captures
          {run?.campaignId ? ` · campaign ${run.campaignId}` : ""}. Actual billed cost requires
          account reconciliation.
        </p>
      ) : null}
      {ledger?.costStatus === "legacy-accounting-unknown" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This historical run predates reservations. Observed attempts are retained; its billing and
          reservation totals are unknown.
        </p>
      ) : null}
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
                value: `${rows.length}/${total}`,
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
            excluded. {readingEvaluationReportScope(run)}
          </p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {results[0]?.metadata.model} · {results[0]?.metadata.promptVersion} ·{" "}
            {results[0]?.metadata.validatorVersion} ·{" "}
            {results[0]?.metadata.contentComparison
              ? `Saved-content comparison · ${results[0].metadata.contentComparison.arm} arm`
              : (COPY_CHOICES.find((choice) => choice.value === results[0]?.metadata.bundleSource)
                  ?.label ?? "Unrecorded copy choice")}{" "}
            · {results[0]?.metadata.bundleVersion} · bundle{" "}
            {results[0]?.metadata.bundleHash.slice(0, 12)} ·{" "}
            {results[0]?.metadata.gatewayTimeoutMs == null
              ? "Unrecorded gateway budget"
              : `${results[0].metadata.gatewayTimeoutMs / 1000}s gateway budget`}
          </p>
          <div className="mt-5 space-y-3">
            {results.map((result, index) => (
              <EvaluationCase key={`${result.case.id}-${index}`} result={result} position={index} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
