import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  activateContentRelease,
  discardContentDraft,
  draftContentRelease,
  fetchContentDrafts,
  fetchEdgePlane,
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
};

function ContentPage() {
  const releasesFn = useServerFn(fetchReleases);
  const activateFn = useServerFn(activateContentRelease);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["releases"], queryFn: () => releasesFn({}) });
  const [pending, setPending] = useState<Release | null>(null);
  const [result, setResult] = useState<
    { kind: "success" | "error"; version: string; message: string } | null
  >(null);

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
        <div>
          <h1 className="text-3xl leading-snug">Content releases</h1>
          <p className="prose-reading mt-4 text-foreground">
            Interpretation copy is published as immutable, checksummed releases through the
            signed editorial endpoint. Readings record the release they were assembled from,
            so any paragraph can be traced back to the exact text version that produced it.
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
            <div
              role="alert"
              className="mt-8 border border-destructive/40 bg-evidence p-4"
            >
              <p className="technical text-destructive">Release inventory unreachable</p>
              <p className="prose-reading mt-2 text-foreground">
                The editorial plane could not be read, so this list is unknown rather than
                empty. Published readings are unaffected — they record the release they were
                assembled from.
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
                Nothing has been ingested through the signed editorial endpoint yet, so
                readings are assembled from built-in fallback copy. This is a real result,
                not a loading state — the list stays empty until a release is published.
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
                      {r.is_active ? (
                        <span className="text-primary">active</span>
                      ) : (
                        "superseded"
                      )}
                    </span>
                    <span className="technical ml-auto text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-3">
                    <span className="technical text-muted-foreground">
                      Families · <span className="text-foreground">{r.families}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Entries · <span className="text-foreground">{r.entries}</span>
                    </span>
                    <span className="technical text-muted-foreground">
                      Checksum ·{" "}
                      <span className="text-foreground">{r.checksum.slice(0, 16)}…</span>
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
              <span className="font-mono text-sm">{pending.version}</span> instead of the
              current release. Already-published readings are not rewritten — each one
              records the version it came from.
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
    mutationFn: () =>
      triggerFn({ data: { day: new Date().toISOString().slice(0, 10) } }),
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
        Publishing or rolling back a release mirrors the active pointer into the edge
        records store and starts a durable workflow that writes an immutable reading
        artifact. Each row below is one completed instance, with the artifact it produced.
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
            The durable plane could not be read. Readings are unaffected — they are
            assembled from the release recorded on each one.
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
            No durable workflow endpoint is wired to this environment, so releases stay
            app-local and no artifacts are written.
          </p>
        </div>
      ) : runs.length === 0 ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="technical text-evidence-foreground">No runs yet</p>
          <p className="prose-reading mt-2 text-foreground">
            The ledger fills the first time a release is published, rolled back, or a run
            is started by hand.
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

  const query = useQuery({ queryKey: ["content-drafts"], queryFn: () => listFn({}) });
  const drafts = query.data?.drafts ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["content-drafts"] });
    void queryClient.invalidateQueries({ queryKey: ["releases"] });
  };

  const draft = useMutation({
    mutationFn: () => draftFn({}),
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
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="technical text-muted-foreground">Drafted copy · language layer</h2>
        <button
          type="button"
          onClick={() => draft.mutate()}
          disabled={draft.isPending}
          className="technical border border-rule px-3 py-1.5 text-foreground transition-colors hover:bg-evidence disabled:opacity-50"
        >
          {draft.isPending ? "Drafting…" : "Draft a release"}
        </button>
      </div>
      <p className="prose-reading mt-3 text-xs text-muted-foreground">
        The model writes mechanism and question copy for each cycle slot; anything that
        predicts, diagnoses or asserts an outcome is dropped before storage. A draft is
        inert until published as a release and pointed to.
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
                  {d.entries.length} entries · from {d.base_version ?? "built-in"}
                </span>
                <span className="technical text-muted-foreground">{d.model ?? "—"}</span>
              </div>
              <ul className="mt-3 space-y-2 font-mono text-xs text-muted-foreground">
                {d.entries.slice(0, 4).map((e) => (
                  <li key={e.key}>
                    <span className="text-foreground">{e.key}</span> · {e.mechanism}
                  </li>
                ))}
              </ul>
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
