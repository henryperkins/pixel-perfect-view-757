import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  LanguageProviderChoice,
  type LanguageProviderStatus,
} from "@/components/pattern/LanguageProviderChoice";
import { ReadingEvaluation } from "@/components/pattern/ReadingEvaluation";
import type { LanguageProvider } from "@/lib/ai/diagnostics";
import {
  activateContentRelease,
  discardContentDraft,
  draftContentRelease,
  fetchContentDrafts,
  fetchEdgePlane,
  fetchLanguageProviders,
  fetchReadingQuality,
  fetchReleases,
  publishContentDraft,
  triggerEdgeRun,
} from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({
    meta: [
      { title: "Content releases — Pattern" },
      {
        name: "description",
        content:
          "Every published interpretation release, its checksum, and which one today's reading was assembled from.",
      },
      { property: "og:title", content: "Content releases — Pattern" },
      {
        property: "og:description",
        content:
          "Every published interpretation release, its checksum, and which one today's reading was assembled from.",
      },
    ],
  }),
  component: ContentPage,
});

type Release = {
  id: string;
  version: string;
  checksum: string;
  created_at: string;
  is_active: boolean;
  families: number;
  entries: number;
  familyKeys: string[];
  cycles?: number;
  synthesisRules?: number;
  schemaVersion?: number;
  transitChapters?: number;
  natalLensCoverage?: { base: number; compound: number; bodySigns: number };
};

function ContentPage() {
  const { session } = useAuth();
  const releasesFn = useServerFn(fetchReleases);
  const activateFn = useServerFn(activateContentRelease);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["releases", session?.userId],
    queryFn: () => releasesFn({}),
    enabled: Boolean(session),
  });
  const [pending, setPending] = useState<Release | null>(null);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    version: string;
    message: string;
  } | null>(null);

  const releases: Release[] = query.data?.releases ?? [];
  const isAdmin = query.data?.isAdmin ?? false;

  const rollback = useMutation({
    mutationFn: (release: Release) => activateFn({ data: { releaseId: release.id } }),
    onSuccess: (data, release) => {
      setPending(null);
      setResult({
        kind: "success",
        version: release.version,
        message: `Active release is now ${data.version} · checksum ${data.checksum.slice(0, 16)}…. Readings already published keep the version they were assembled from.`,
      });
      toast.success(`Rolled back to ${data.version}`);
      void queryClient.invalidateQueries({ queryKey: ["releases"] });
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      void queryClient.invalidateQueries({ queryKey: ["cycles"] });
      void queryClient.invalidateQueries({ queryKey: ["edge-plane"] });
    },
    onError: (error: Error, release) => {
      setPending(null);
      setResult({
        kind: "error",
        version: release.version,
        message: error.message || "The release pointer could not be moved.",
      });
      toast.error("Rollback failed");
    },
  });

  return (
    <Shell>
      <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">
          <h1 className="text-3xl leading-snug">Content releases</h1>
          <p className="prose-reading mt-4 text-foreground">
            Interpretation copy is published as immutable, checksummed releases through the signed
            editorial endpoint. Readings record the release they were assembled from, so any
            paragraph can be traced back to the exact text version that produced it.
          </p>

          {result ? (
            <div
              role="status"
              className={`mt-6 border p-4 ${
                result.kind === "success"
                  ? "border-rule bg-evidence"
                  : "border-destructive/40 bg-evidence"
              }`}
            >
              <p
                className={`technical ${
                  result.kind === "success" ? "text-primary" : "text-destructive"
                }`}
              >
                {result.kind === "success"
                  ? `Rollback applied · ${result.version}`
                  : `Rollback failed · ${result.version}`}
              </p>
              <p className="prose-reading mt-2 text-foreground">{result.message}</p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="technical mt-3 border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-card"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {query.isPending ? (
            <div className="mt-8 space-y-4" aria-busy="true" aria-live="polite">
              <p className="technical text-muted-foreground">Loading releases…</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="border border-rule bg-card p-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <div className="h-4 w-40 animate-pulse bg-muted" />
                    <div className="h-3 w-20 animate-pulse bg-muted" />
                    <div className="ml-auto h-3 w-16 animate-pulse bg-muted" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-3">
                    <div className="h-3 w-24 animate-pulse bg-muted" />
                    <div className="h-3 w-20 animate-pulse bg-muted" />
                    <div className="h-3 w-36 animate-pulse bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.error ? (
            <div role="alert" className="mt-8 border border-destructive/40 bg-evidence p-4">
              <p className="technical text-destructive">Release inventory unreachable</p>
              <p className="prose-reading mt-2 text-foreground">
                The editorial plane could not be read, so this list is unknown rather than empty.
                Published readings are unaffected — they record the release they were assembled
                from.
              </p>
              <p className="mt-3 font-mono text-xs break-words text-muted-foreground">
                {query.error.message}
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                className="technical mt-4 border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
              >
                {query.isFetching ? "Retrying…" : "Retry"}
              </button>
            </div>
          ) : releases.length === 0 ? (
            <div className="mt-8 border border-rule bg-evidence p-4">
              <p className="technical text-evidence-foreground">No published release</p>
              <p className="prose-reading mt-2 text-foreground">
                Nothing has been ingested through the signed editorial endpoint yet, so readings are
                assembled from built-in fallback copy. This is a real result, not a loading state —
                the list stays empty until a release is published.
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                className="technical mt-4 border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-card disabled:opacity-50"
              >
                {query.isFetching ? "Checking…" : "Check again"}
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {releases.map((r) => (
                <article key={r.id} className="border border-rule bg-card p-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="font-mono text-sm text-foreground">{r.version}</h2>
                    <span className="technical text-muted-foreground">
                      {r.is_active ? <span className="text-primary">active</span> : "superseded"}
                    </span>
                    <span className="technical ml-auto text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-3">
                    <span className="technical text-muted-foreground">
                      Cycles · <span className="text-foreground">{r.cycles ?? 0}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Rules · <span className="text-foreground">{r.synthesisRules ?? 0}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Schema · <span className="text-foreground">{r.schemaVersion ?? 1}</span> ·{" "}
                      {r.transitChapters ?? 0}/5 transit chapters
                    </span>
                    <span className="technical text-muted-foreground">
                      Natal lenses ·{" "}
                      <span className="text-foreground">
                        {r.natalLensCoverage?.base ?? 0} base, {r.natalLensCoverage?.compound ?? 0}{" "}
                        compound · {r.natalLensCoverage?.bodySigns ?? 0}/60 body/sign pairs
                      </span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Checksum · <span className="text-foreground">{r.checksum.slice(0, 16)}…</span>
                    </span>
                  </div>

                  {r.familyKeys.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                      {r.familyKeys.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  ) : null}

                  {isAdmin ? (
                    <div className="mt-4 border-t border-rule pt-3">
                      {r.is_active ? (
                        <span className="technical text-muted-foreground">
                          Current pointer — nothing to roll back
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setResult(null);
                            setPending(r);
                          }}
                          disabled={rollback.isPending}
                          className="technical border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
                        >
                          {rollback.isPending && rollback.variables?.id === r.id
                            ? "Rolling back…"
                            : "Roll back to this release"}
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <EdgePlane />
          <QualityPlane isAdmin={isAdmin} />
          <DraftPlane isAdmin={isAdmin} />
        </div>

        <Rail title="Editorial plane">
          <Field
            label="Releases"
            value={query.isPending ? "—" : query.error ? "unknown" : releases.length}
          />
          <Field
            label="Active"
            value={
              query.isPending
                ? "—"
                : query.error
                  ? "unknown"
                  : (releases.find((r) => r.is_active)?.version ?? "built-in")
            }
          />

          <Field label="Publishing" value="signed endpoint only" />
          <Field
            label="Rollback"
            value={query.isPending ? "—" : isAdmin ? "pointer flip · admin" : "admin only"}
          />
          <p className="prose-reading pt-2 text-xs text-muted-foreground">
            {isAdmin
              ? "Publishing new copy stays signed-endpoint-only. Admins may move the active pointer to an already-published release; existing readings keep the version they were assembled from."
              : "Releases are read-only here. Publishing and rollback happen over HMAC-signed requests from the editorial plane; nothing on this screen can change copy."}
          </p>
        </Rail>
      </div>

      {pending ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rollback-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
        >
          <div className="w-full max-w-md border border-rule bg-card p-5">
            <h2 id="rollback-title" className="text-xl leading-snug">
              Roll back the active release?
            </h2>
            <p className="prose-reading mt-3 text-foreground">
              Today’s and future readings will be assembled from{" "}
              <span className="font-mono text-sm">{pending.version}</span> instead of the current
              release. Already-published readings are not rewritten — each one records the version
              it came from.
            </p>
            <dl className="mt-4 space-y-1 border-t border-rule pt-3">
              <div className="flex justify-between gap-4">
                <dt className="technical text-muted-foreground">Target</dt>
                <dd className="font-mono text-xs text-foreground">{pending.version}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="technical text-muted-foreground">Checksum</dt>
                <dd className="font-mono text-xs break-all text-foreground">
                  {pending.checksum.slice(0, 24)}…
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="technical text-muted-foreground">Entries</dt>
                <dd className="font-mono text-xs text-foreground">{pending.entries}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => rollback.mutate(pending)}
                disabled={rollback.isPending}
                className="technical border border-primary bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {rollback.isPending ? "Rolling back…" : "Confirm rollback"}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={rollback.isPending}
                className="technical border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

type Run = {
  instance_id: string;
  kind: string;
  release_version: string | null;
  artifact_key: string | null;
  created_at: string;
};

/**
 * The durable edge plane: each release publish or rollback mirrors the pointer
 * into D1 and starts a Workflow instance that writes an immutable R2 artifact.
 */
function EdgePlane() {
  const planeFn = useServerFn(fetchEdgePlane);
  const triggerFn = useServerFn(triggerEdgeRun);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["edge-plane"], queryFn: () => planeFn({}) });

  const runs: Run[] = query.data?.runs ?? [];
  const isAdmin = query.data?.isAdmin ?? false;
  const unavailable = Boolean((query.data as { unavailable?: boolean } | undefined)?.unavailable);

  const start = useMutation({
    mutationFn: () => triggerFn({ data: { day: new Date().toISOString().slice(0, 10) } }),
    onSuccess: (data) => {
      toast.success(`Durable run started · ${data.instanceId.slice(0, 8)}…`);
      void queryClient.invalidateQueries({ queryKey: ["edge-plane"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not start the run"),
  });

  return (
    <section className="mt-12 border-t border-rule pt-8">
      <h2 className="text-2xl leading-snug">Durable run ledger</h2>
      <p className="prose-reading mt-3 text-foreground">
        Publishing or rolling back a release mirrors the active pointer into the edge records store
        and starts a durable workflow that writes an immutable reading artifact. Each row below is
        one completed instance, with the artifact it produced.
      </p>

      {query.isPending ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
          <p className="technical text-muted-foreground">Loading runs…</p>
          {[0, 1].map((i) => (
            <div key={i} className="border border-rule bg-card p-4">
              <div className="h-3 w-48 animate-pulse bg-muted" />
              <div className="mt-3 h-3 w-64 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <div role="alert" className="mt-6 border border-destructive/40 bg-evidence p-4">
          <p className="technical text-destructive">Run ledger unreachable</p>
          <p className="prose-reading mt-2 text-foreground">
            The durable plane could not be read. Readings are unaffected — they are assembled from
            the release recorded on each one.
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="technical mt-4 border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
          >
            {query.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : unavailable ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="technical text-evidence-foreground">Edge plane not configured</p>
          <p className="prose-reading mt-2 text-foreground">
            No durable workflow endpoint is wired to this environment, so releases stay app-local
            and no artifacts are written.
          </p>
        </div>
      ) : runs.length === 0 ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="technical text-evidence-foreground">No runs yet</p>
          <p className="prose-reading mt-2 text-foreground">
            The ledger fills the first time a release is published, rolled back, or a run is started
            by hand.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                <th className="technical pb-2 text-muted-foreground">Instance</th>
                <th className="technical pb-2 text-muted-foreground">Kind</th>
                <th className="technical pb-2 text-muted-foreground">Release</th>
                <th className="technical pb-2 text-muted-foreground">Artifact</th>
                <th className="technical pb-2 text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.instance_id} className="border-b border-rule/60">
                  <td className="py-2 font-mono text-xs text-foreground">
                    {r.instance_id.slice(0, 8)}…
                  </td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{r.kind}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">
                    {r.release_version ?? "—"}
                  </td>
                  <td className="py-2 font-mono text-xs break-all text-muted-foreground">
                    {r.artifact_key ?? "—"}
                  </td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">
                    {r.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && !unavailable ? (
        <button
          type="button"
          onClick={() => start.mutate()}
          disabled={start.isPending}
          className="technical mt-5 border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
        >
          {start.isPending ? "Starting…" : "Start a durable run for today"}
        </button>
      ) : null}
    </section>
  );
}

/** Admin-only key presence for the provider choices; never key material. */
function useLanguageProviderStatus(isAdmin: boolean): LanguageProviderStatus | undefined {
  const { session } = useAuth();
  const providersFn = useServerFn(fetchLanguageProviders);
  const query = useQuery({
    queryKey: ["language-providers", session?.userId],
    queryFn: () => providersFn({}),
    enabled: Boolean(isAdmin && session),
  });
  return query.data
    ? Object.fromEntries(query.data.providers.map((p) => [p.id, p.configured]))
    : undefined;
}

/** Bounded metadata describes persisted generations, never reading text or private context. */
function QualityPlane({ isAdmin }: { isAdmin: boolean }) {
  const { session } = useAuth();
  const qualityFn = useServerFn(fetchReadingQuality);
  const query = useQuery({
    queryKey: ["reading-quality", session?.userId],
    queryFn: () => qualityFn({}),
    enabled: Boolean(isAdmin && session),
  });
  const providerStatus = useLanguageProviderStatus(isAdmin);

  if (!isAdmin || (query.data && !query.data.isAdmin)) return null;
  const data = query.data && query.data.isAdmin ? query.data : null;
  const percent = (value: number | null, missing: string) =>
    value === null
      ? missing
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value) + "%";
  const outcomeLabel = (outcome: string, code: string) =>
    code === "not_configured"
      ? "Not configured"
      : outcome === "accepted"
        ? "Accepted"
        : outcome === "rejected"
          ? "Validation rejected"
          : outcome === "unavailable"
            ? "Gateway unavailable"
            : "Skipped before a model call";

  return (
    <section
      className="mt-12 min-w-0 border-t border-rule pt-8"
      aria-labelledby="reading-quality-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reading-quality-heading" className="text-2xl leading-snug">
          Reading quality
        </h2>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Refreshing…" : "Refresh measurements"}
        </Button>
      </div>
      <p className="prose-reading mt-3 text-foreground">
        This report covers up to 300 recent persisted reading generations, ordered by creation time.
        It counts generations, not page views or all gateway traffic. Opening a cached reading adds
        no observation. Only instrumented generations have measured outcomes; missing, invalid or
        incompatible structured diagnostics remain separate as legacy.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        When a daily draft fails validation, the whole draft falls back to template wording.
        Citation checks verify supplied IDs and coverage, with bounded wording checks. They do not
        establish that every claim is semantically supported by a cited fact. This report contains
        counts, codes and versions, never reading text or private context.
      </p>

      {query.isPending ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
          <p className="technical text-muted-foreground">Loading generation measurements…</p>
          {[0, 1].map((i) => (
            <div key={i} className="border border-rule bg-card p-4">
              <div className="h-3 w-48 animate-pulse bg-muted" />
              <div className="mt-3 h-3 w-64 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <div role="alert" className="mt-6 border border-destructive/40 bg-evidence p-4">
          <p className="technical text-destructive">Generation measurements unreachable</p>
          <p className="prose-reading mt-2 text-foreground">
            Stored metadata could not be read. These measurements are unavailable; readings
            themselves are unaffected.
          </p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="mt-4"
          >
            {query.isFetching ? "Retrying…" : "Retry measurements"}
          </Button>
        </div>
      ) : !data || data.total === 0 ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="technical text-evidence-foreground">
            No persisted generations recorded yet
          </p>
          <p className="prose-reading mt-2 text-foreground">
            There are no measured attempts or feedback rates to report. The first newly generated
            reading starts this record; reopening cached readings does not.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 border-y border-rule py-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Window: {data.total} persisted generations
              </span>
              {data.window.truncated
                ? " · most recent " + data.window.limit + "; older retained generations excluded"
                : " · all retained generations within the cap of " + data.window.limit}
              .
            </p>
            {data.window.oldest && data.window.newest ? (
              <p className="mt-1 font-mono text-xs [overflow-wrap:anywhere]">
                Created from <time dateTime={data.window.oldest}>{data.window.oldest}</time> to{" "}
                <time dateTime={data.window.newest}>{data.window.newest}</time>.
              </p>
            ) : null}
            <p className="mt-2">
              This is a recent retained sample, not a lifetime total or a random sample of readers.
            </p>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Instrumented generations", value: String(data.measurement.instrumented) },
              { label: "Measured model attempts", value: String(data.measurement.attempts) },
              { label: "Accepted model drafts", value: String(data.measurement.accepted) },
              { label: "Attempted fallbacks", value: String(data.measurement.fallbackCount) },
              {
                label: "Fallbacks / attempts",
                value: data.measurement.attempts
                  ? percent(data.measurement.fallbackRate, "No measured attempts") +
                    " · " +
                    data.measurement.fallbackCount +
                    "/" +
                    data.measurement.attempts
                  : "No measured attempts",
              },
              { label: "Legacy generations", value: String(data.measurement.legacy) },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0 border border-rule bg-card p-3">
                <dt className="technical text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-mono text-sm [overflow-wrap:anywhere] text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Attempted fallbacks are validation rejections plus attempted gateway failures, divided
            by measured model attempts. Quiet days, missing configuration and legacy generations are
            excluded from that denominator.
          </p>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { label: "Validation rejected", value: data.measurement.rejected },
              {
                label: "Gateway unavailable after an attempt",
                value: data.measurement.unavailable,
              },
              { label: "Quiet days · no model call", value: data.measurement.quietSkips },
              {
                label: "Missing primary interpretation · no model call",
                value: data.measurement.noInterpretationSkips,
              },
              { label: "Not configured", value: data.measurement.unconfigured },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-rule pb-2"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-mono text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-8 text-xl">Recorded outcome causes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Closed codes from instrumented generations. A rejected draft records its first failing
            check, rather than every possible failure. Legacy free-text reasons are not displayed.
          </p>
          {data.outcomes.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Recorded outcome causes table"
            >
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Recorded generation outcomes and bounded cause codes
                </caption>
                <thead>
                  <tr className="border-b border-rule">
                    <th scope="col" className="technical py-2 pr-4 text-muted-foreground">
                      Outcome
                    </th>
                    <th scope="col" className="technical py-2 pr-4 text-muted-foreground">
                      Cause code
                    </th>
                    <th scope="col" className="technical py-2 pr-4 text-muted-foreground">
                      Meaning
                    </th>
                    <th scope="col" className="technical py-2 text-muted-foreground">
                      Generations
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.outcomes.map((row) => (
                    <tr key={row.outcome + "/" + row.code} className="border-b border-rule/60">
                      <td className="py-3 pr-4 text-foreground">
                        {outcomeLabel(row.outcome, row.code)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-muted-foreground">{row.code}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                      <td className="py-3 font-mono text-foreground">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 border border-rule bg-evidence p-4 text-sm text-muted-foreground">
              No structured outcomes in this window. Legacy generations have no measured attempt or
              fallback rate.
            </p>
          )}

          <h3 className="mt-8 text-xl">Recorded configurations</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Prompt, validator, model, release and gateway timeout budget group instrumented
            generations. Earlier measurements with no recorded timeout budget show Unrecorded.
            Counts describe the retained window; they do not establish which configuration writes
            better readings.
          </p>
          {data.configurations.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Recorded configurations table"
            >
              <table className="w-full min-w-[66rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Generation measurements grouped by recorded versions and gateway timeout budget
                </caption>
                <thead>
                  <tr className="border-b border-rule">
                    {[
                      "Prompt / validator",
                      "Model / release",
                      "Gateway timeout",
                      "Generations",
                      "Attempts",
                      "Accepted",
                      "Validation rejected",
                      "Gateway unavailable",
                      "Attempt fallback rate",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="technical py-2 pr-4 text-muted-foreground"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.configurations.map((row) => (
                    <tr
                      key={JSON.stringify([
                        row.promptVersion,
                        row.validatorVersion,
                        row.model,
                        row.releaseVersion,
                        row.gatewayTimeoutMs,
                      ])}
                      className="border-b border-rule/60"
                    >
                      <td className="max-w-[12rem] py-3 pr-4 font-mono text-foreground [overflow-wrap:anywhere]">
                        {row.promptVersion}
                        <span className="mt-1 block text-muted-foreground">
                          {row.validatorVersion}
                        </span>
                      </td>
                      <td className="max-w-[13rem] py-3 pr-4 font-mono text-foreground [overflow-wrap:anywhere]">
                        {row.model}
                        <span className="mt-1 block text-muted-foreground">
                          {row.releaseVersion}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {row.gatewayTimeoutMs === null
                          ? "Unrecorded"
                          : `${new Intl.NumberFormat("en-US").format(row.gatewayTimeoutMs)} ms`}
                      </td>
                      {[
                        row.readings,
                        row.attempts,
                        row.accepted,
                        row.rejected,
                        row.unavailable,
                      ].map((value, i) => (
                        <td key={i} className="py-3 pr-4 font-mono text-muted-foreground">
                          {value}
                        </td>
                      ))}
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {percent(row.fallbackRate, "No attempts")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No instrumented configuration metadata recorded.
            </p>
          )}

          <h3 className="mt-8 text-xl">Selected resonance feedback</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Only accounts currently opted into Reading quality feedback (USR-15) contribute valid
            saved scores. Coverage is rated readings divided by eligible readings. Unrated readings
            are missing data; they do not count as an Unsure (0) response. These are small,
            self-selected samples; differences do not show that model wording caused better
            readings.
          </p>
          <div
            className="mt-3 max-w-full overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Selected resonance feedback table"
          >
            <table className="w-full min-w-[52rem] border-collapse text-left text-xs">
              <caption className="sr-only">
                Opt-in resonance feedback by model, template and legacy cohorts
              </caption>
              <thead>
                <tr className="border-b border-rule">
                  {[
                    "Cohort",
                    "Generations",
                    "Eligible",
                    "Rated",
                    "Coverage",
                    "Yes (+1)",
                    "Unsure (0)",
                    "No (−1)",
                    "Mean (−1 to +1)",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="technical py-2 pr-4 text-muted-foreground"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.feedback.map((row) => (
                  <tr key={row.cohort} className="border-b border-rule/60">
                    <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                      {row.cohort === "model"
                        ? "Model wording"
                        : row.cohort === "template"
                          ? "Template wording"
                          : "Legacy metadata"}
                    </th>
                    {[row.readings, row.eligibleReadings, row.ratedReadings].map((value, i) => (
                      <td key={i} className="py-3 pr-4 font-mono text-muted-foreground">
                        {value}
                      </td>
                    ))}
                    <td className="py-3 pr-4 font-mono text-foreground">
                      {percent(row.coverage, "No eligible readings")}
                    </td>
                    {[row.positive, row.neutral, row.negative].map((value, i) => (
                      <td key={i} className="py-3 pr-4 font-mono text-muted-foreground">
                        {value}
                      </td>
                    ))}
                    <td className="py-3 pr-4 font-mono text-foreground">
                      {row.average === null
                        ? "No ratings"
                        : new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            signDisplay: "exceptZero",
                          }).format(row.average)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-xl">Citation ID usage</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.model} model-mode generations and {data.template} template-mode generations appear
            in this window, including legacy. Citation shares below use the {data.model} model-mode
            generations as their denominator. Counts show reported references, not semantic support
            or reading quality.
          </p>
          {data.facts.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Citation ID usage table"
            >
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Supplied fact IDs referenced in stored model-mode citation metadata
                </caption>
                <thead>
                  <tr className="border-b border-rule">
                    {["ID", "Kind", "Generations", "Paragraphs", "Share of model mode"].map(
                      (label) => (
                        <th
                          key={label}
                          scope="col"
                          className="technical py-2 pr-4 text-muted-foreground"
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.facts.map((row) => (
                    <tr key={row.id} className="border-b border-rule/60">
                      <td className="py-3 pr-4 font-mono text-foreground">{row.id}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.kind}</td>
                      <td className="py-3 pr-4 font-mono text-muted-foreground">{row.readings}</td>
                      <td className="py-3 pr-4 font-mono text-muted-foreground">
                        {row.paragraphs}
                      </td>
                      <td className="py-3 pr-4 font-mono text-foreground">{row.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No citation IDs recorded in this window.
            </p>
          )}

          {data.samples.length ? (
            <>
              <h3 className="mt-8 text-xl">Your recent generation metadata</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Up to 12 of your persisted generations within this window. Dates are reading days;
                repeated days can have separate generation records.
              </p>
              <div className="mt-3 space-y-3">
                {data.samples.map((row) => (
                  <article key={row.id} className="min-w-0 border border-rule bg-card p-3">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-mono text-xs text-foreground">{row.reading_date}</span>
                      <span className="technical text-muted-foreground [overflow-wrap:anywhere]">
                        {row.mode === "model" ? (row.model ?? "model") : "template"}
                      </span>
                      <span className="technical text-muted-foreground">
                        {row.paragraphs} reported citation paragraphs
                      </span>
                    </div>
                    {row.reason ? (
                      <p className="mt-2 text-xs text-muted-foreground">{row.reason}</p>
                    ) : null}
                    {row.facts.length ? (
                      <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-t border-rule pt-2 font-mono text-xs text-muted-foreground">
                        {row.facts.map((id) => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 border-t border-rule pt-2 text-xs text-muted-foreground">
                        No citation IDs recorded.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
      <ReadingEvaluation key={session?.userId ?? "anonymous"} providerStatus={providerStatus} />
    </section>
  );
}

/**
 * Language-layer drafting: the model writes candidate interpretation copy for
 * every slot the engine looks up, but nothing it writes becomes live copy
 * until an admin publishes it as a release and flips the pointer above.
 */
function DraftPlane({ isAdmin }: { isAdmin: boolean }) {
  const listFn = useServerFn(fetchContentDrafts);
  const draftFn = useServerFn(draftContentRelease);
  const publishFn = useServerFn(publishContentDraft);
  const discardFn = useServerFn(discardContentDraft);
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<LanguageProvider>("lovable");
  const providerStatus = useLanguageProviderStatus(isAdmin);

  const query = useQuery({ queryKey: ["content-drafts"], queryFn: () => listFn({}) });
  const drafts = query.data?.drafts ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["content-drafts"] });
    void queryClient.invalidateQueries({ queryKey: ["releases"] });
  };

  const draft = useMutation({
    mutationFn: () => draftFn({ data: { provider } }),
    onSuccess: (d) => {
      toast.success(`Drafted ${d.entries} entries with ${d.model}`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: (draftId: string) => publishFn({ data: { draftId } }),
    onSuccess: (d) => {
      toast.success(`Published ${d.version}. Roll the pointer to it when ready.`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const discard = useMutation({
    mutationFn: (draftId: string) => discardFn({ data: { draftId } }),
    onSuccess: () => {
      toast.success("Draft discarded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  return (
    <section className="mt-12 border-t border-rule pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="technical text-muted-foreground">Drafted copy · language layer</h2>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <LanguageProviderChoice
            value={provider}
            onChange={setProvider}
            disabled={draft.isPending}
            configured={providerStatus}
          />
          <button
            type="button"
            onClick={() => draft.mutate()}
            disabled={draft.isPending}
            className="technical border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
          >
            {draft.isPending ? "Drafting…" : "Draft a release"}
          </button>
        </div>
      </div>
      <p className="prose-reading mt-3 text-xs text-muted-foreground">
        The model writes mechanism and question copy for each cycle slot; anything that predicts,
        diagnoses or asserts an outcome is dropped before storage. A draft is inert until published
        as a release and pointed to.
      </p>

      {query.isPending ? (
        <p className="mt-4 technical text-muted-foreground" aria-busy="true">
          Loading drafts…
        </p>
      ) : query.error ? (
        <p role="alert" className="mt-4 technical text-destructive">
          Drafts unavailable: {query.error.message}
        </p>
      ) : drafts.length === 0 ? (
        <p className="mt-4 technical text-muted-foreground">
          No open drafts. Live copy is whichever release the pointer names.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {drafts.map((d) => (
            <article key={d.id} className="border border-rule bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-foreground">
                  {d.entries.length} entries ({d.themeCount ?? 0} themes, {d.ruleCount ?? 0} rules)
                  {" · "}Schema {d.schemaVersion} · {d.transitChapters}/5 transit chapters ·{" "}
                  {d.natalLensCoverage.base} base natal lenses, {d.natalLensCoverage.compound}{" "}
                  compound · {d.natalLensCoverage.bodySigns}/60 body/sign pairs · from{" "}
                  {d.base_version ?? "built-in"}
                </span>
                <span className="technical text-muted-foreground">{d.model ?? "—"}</span>
              </div>
              {d.affectedKeys && d.affectedKeys.length > 0 ? (
                <div className="mt-2 text-xs border border-primary/30 bg-evidence p-2 text-muted-foreground">
                  <span className="technical text-primary font-medium">
                    Drafted / affected interpretation keys ({d.affectedKeys.length}):
                  </span>{" "}
                  <span className="font-mono">{d.affectedKeys.join(", ")}</span>
                </div>
              ) : null}
              {d.removedRules && d.removedRules.length > 0 ? (
                <div className="mt-2 text-xs border border-destructive/30 bg-evidence p-2 text-muted-foreground">
                  <span className="technical text-destructive">
                    Synthesis rules removed for review:
                  </span>{" "}
                  <span className="font-mono">{d.removedRules.join(", ")}</span>
                </div>
              ) : null}
              {d.synthesisRules && d.synthesisRules.length > 0 ? (
                <div className="mt-3 border-t border-rule/50 pt-2">
                  <span className="technical text-xs text-muted-foreground">
                    Pair rules ({d.synthesisRules.length}):
                  </span>
                  <ul className="mt-1.5 space-y-1 font-mono text-xs text-muted-foreground">
                    {d.synthesisRules.slice(0, 4).map((r) => (
                      <li key={r.key} className="break-words">
                        <span className="text-foreground capitalize">{r.relationship}</span>:{" "}
                        <span>
                          {r.primary.interpretationKey} ({r.primary.theme})
                        </span>
                        {" → "}
                        <span>
                          {r.supporting.interpretationKey} ({r.supporting.theme})
                        </span>
                      </li>
                    ))}
                    {d.synthesisRules.length > 4 ? (
                      <li className="text-xs text-muted-foreground italic">
                        + {d.synthesisRules.length - 4} more rules
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 border-t border-rule/50 pt-2">
                <span className="technical text-xs text-muted-foreground">Sample entries:</span>
                <ul className="mt-1.5 space-y-2 font-mono text-xs text-muted-foreground">
                  {(d.affectedKeys && d.affectedKeys.length > 0
                    ? [
                        ...d.entries.filter((e) => d.affectedKeys.includes(e.key)),
                        ...d.entries.filter((e) => !d.affectedKeys.includes(e.key)),
                      ]
                    : d.entries
                  )
                    .slice(0, 4)
                    .map((e) => (
                      <li key={e.key}>
                        <span className="text-foreground">{e.key}</span>
                        {e.themes && e.themes.length > 0 ? (
                          <span className="ml-1 text-xs text-primary font-mono">
                            [{e.themes.join(", ")}]
                          </span>
                        ) : null}
                        {" · "}
                        {e.mechanism}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => publish.mutate(d.id)}
                  disabled={publish.isPending || discard.isPending}
                  className="technical border border-primary bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {publish.isPending ? "Publishing…" : "Publish as release"}
                </button>
                <button
                  type="button"
                  onClick={() => discard.mutate(d.id)}
                  disabled={publish.isPending || discard.isPending}
                  className="technical border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
