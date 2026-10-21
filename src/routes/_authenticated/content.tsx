import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  LanguageProviderChoice,
  type LanguageProviderStatus,
} from "@/components/pattern/LanguageProviderChoice";
import { ContentDraftReview } from "@/components/pattern/ContentDraftReview";
import {
  ContentDraftEvaluation,
  InactiveReleaseEvaluation,
} from "@/components/pattern/ContentDraftEvaluation";
import { isEarlierRelease } from "@/lib/content/release-version";
import { ReadingEvaluation } from "@/components/pattern/ReadingEvaluation";
import { EditorialPilotEvaluation } from "@/components/pattern/EditorialPilotEvaluation";
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
  reconcileContentPublication,
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
  checksumAlgorithm?: string;
  publication?: { status: string; artifactKey: string | null; error: string | null } | null;
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

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString.slice(0, 10) : d.toISOString().slice(0, 10);
  } catch {
    return isoString.slice(0, 10);
  }
}

function ContentPage() {
  const { session, isAdmin: authIsAdmin, loading: authLoading } = useAuth();
  const releasesFn = useServerFn(fetchReleases);
  const activateFn = useServerFn(activateContentRelease);
  const reconcileFn = useServerFn(reconcileContentPublication);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["releases", session?.userId],
    queryFn: () => releasesFn({}),
    enabled: Boolean(session) && authIsAdmin,
  });

  const [pendingRelease, setPendingRelease] = useState<{
    release: Release;
    isRollback: boolean;
    expectedPreviousVersion: string | null;
  } | null>(null);

  const [result, setResult] = useState<{
    kind: "success" | "error" | "partial" | "superseded";
    version: string;
    message: string;
    action: "rollback" | "activate" | "reconcile";
  } | null>(null);

  const releases: Release[] = query.data?.releases ?? [];
  const isAdmin = authIsAdmin;
  const providerStatus = useLanguageProviderStatus(isAdmin);
  const memberProvidersFn = useServerFn(fetchLanguageProviders);
  const memberProviders = useQuery({
    queryKey: ["language-providers", session?.userId],
    queryFn: () => memberProvidersFn({}),
    enabled: Boolean(isAdmin && session),
  });
  const activeRelease = releases.find((r) => r.is_active);

  const rollback = useMutation({
    mutationFn: (item: {
      release: Release;
      isRollback: boolean;
      expectedPreviousVersion: string | null;
    }) =>
      activateFn({
        data: { releaseId: item.release.id, expectedPreviousVersion: item.expectedPreviousVersion },
      }),
    onSuccess: (data, item) => {
      setPendingRelease(null);
      const isRollback = data.isRollback;
      setResult({
        kind:
          data.publication.status === "complete"
            ? "success"
            : data.publication.status === "superseded"
              ? "superseded"
              : "partial",
        version: item.release.version,
        action: isRollback ? "rollback" : "activate",
        message:
          data.publication.status === "complete"
            ? `Active release is now ${data.version} · checksum ${data.checksum.slice(0, 16)}…. Readings already published keep the version they were assembled from.`
            : data.publication.status === "superseded"
              ? `Another activation advanced the pointer. Active release is ${data.activeVersion ?? "built-in"}. Reload the inventory before making another decision.`
              : `Active pointer is ${data.activeVersion ?? "built-in"}; edge artifact or pointer delivery is incomplete. Reconcile publication before sign-off.`,
      });
      if (data.publication.status === "complete")
        toast.success(
          isRollback ? `Rolled back to ${data.version}` : `Activated ${data.version} — now live`,
        );
      else if (data.publication.status === "superseded")
        toast.warning(`Active release advanced to ${data.activeVersion ?? "built-in"}.`);
      else toast.warning(`Pointer saved for ${data.version}; publication is incomplete.`);
      void queryClient.invalidateQueries({ queryKey: ["releases"] });
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      void queryClient.invalidateQueries({ queryKey: ["cycles"] });
      void queryClient.invalidateQueries({ queryKey: ["edge-plane"] });
    },
    onError: (error: Error, item) => {
      setPendingRelease(null);
      setResult({
        kind: "error",
        version: item.release.version,
        action: item.isRollback ? "rollback" : "activate",
        message: error.message || "The release pointer could not be moved.",
      });
      toast.error(item.isRollback ? "Rollback failed" : "Activation failed");
    },
  });

  const reconcile = useMutation({
    mutationFn: (version: string) => reconcileFn({ data: { version } }),
    onSuccess: (data) => {
      setResult({
        kind:
          data.publication.status === "complete"
            ? "success"
            : data.publication.status === "superseded"
              ? "superseded"
              : "partial",
        version: data.version,
        action: "reconcile",
        message:
          data.publication.status === "complete"
            ? `Artifact delivery for ${data.version} is confirmed. Active release: ${data.activeVersion ?? "built-in"}.`
            : data.publication.status === "superseded"
              ? `Publication was superseded. Active release: ${data.activeVersion ?? "built-in"}. Activate this version explicitly to move the pointer again.`
              : `Release ${data.version} is saved; delivery remains incomplete. Retry reconciliation.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["releases"] });
      void queryClient.invalidateQueries({ queryKey: ["edge-plane"] });
    },
    onError: (error: Error, version) =>
      setResult({ kind: "error", version, action: "reconcile", message: error.message }),
  });

  if (authLoading) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl py-16 animate-pulse" aria-busy="true">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="mt-4 h-4 w-full max-w-96 bg-muted rounded" />
        </div>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-16">
          <h1 className="text-2xl font-serif">Administrator access required</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Content releases, draft reviews, and evaluation pipelines are reserved for
            administrators. Your personal reading provenance and content checksums remain accessible
            directly on each reading.
          </p>
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link to="/">Return to Today</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 space-y-12">
          <div>
            <h1 className="text-3xl font-serif leading-snug">Content releases</h1>
            <p className="prose-reading mt-4 max-w-prose text-foreground">
              Draft, review and publish interpretation copy. Activating a release changes new
              readings; saved readings keep their original version and evidence.
            </p>
          </div>

          {result ? (
            <div
              role="status"
              className={`border p-4 ${
                result.kind === "error"
                  ? "border-destructive/40 bg-evidence"
                  : "border-rule bg-evidence"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wider ${
                  result.kind === "error" ? "text-destructive" : "text-primary"
                }`}
              >
                {result.kind === "superseded"
                  ? `Active release advanced · ${result.version}`
                  : result.kind === "partial"
                    ? `Publication incomplete · ${result.version}`
                    : result.kind === "success"
                      ? result.action === "rollback"
                        ? `Rollback applied · ${result.version}`
                        : result.action === "reconcile"
                          ? `Publication reconciled · ${result.version}`
                          : `Release activated · ${result.version}`
                      : result.action === "rollback"
                        ? `Rollback failed · ${result.version}`
                        : result.action === "reconcile"
                          ? `Publication reconciliation failed · ${result.version}`
                          : `Activation failed · ${result.version}`}
              </p>
              <p className="prose-reading mt-2 max-w-prose text-foreground">{result.message}</p>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setResult(null)}
                className="mt-3"
              >
                Dismiss
              </Button>
            </div>
          ) : null}

          {/* Section 1: Candidate drafts */}
          <DraftPlane isAdmin={isAdmin} />

          {/* Section 2: Published releases inventory */}
          <section aria-labelledby="releases-heading" className="border-t border-rule pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="releases-heading" className="text-2xl font-serif leading-snug">
                Published releases
              </h2>
              <span className="text-xs text-muted-foreground">
                {releases.length} total {releases.length === 1 ? "release" : "releases"}
              </span>
            </div>

            {query.isPending ? (
              <div className="mt-6 space-y-4" aria-busy="true" aria-live="polite">
                <p className="text-xs text-muted-foreground">Loading releases…</p>
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
              <div role="alert" className="mt-6 border border-destructive/40 bg-evidence p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Release inventory unreachable
                </p>
                <p className="prose-reading mt-2 max-w-prose text-foreground">
                  The release list could not load. Published readings keep their recorded release.
                </p>
                <p className="mt-3 font-mono text-xs break-words text-muted-foreground">
                  {query.error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => void query.refetch()}
                  disabled={query.isFetching}
                  className="mt-4"
                >
                  {query.isFetching ? "Retrying…" : "Retry"}
                </Button>
              </div>
            ) : releases.length === 0 ? (
              <div className="mt-6 border border-rule bg-evidence p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-evidence-foreground">
                  No published release
                </p>
                <p className="prose-reading mt-2 max-w-prose text-foreground">
                  Readings use built-in copy until a release is published. Publish a reviewed draft
                  above or use the signed publishing endpoint.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => void query.refetch()}
                  disabled={query.isFetching}
                  className="mt-4"
                >
                  {query.isFetching ? "Checking…" : "Check again"}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {releases.map((r) => {
                  const isLive = r.is_active;
                  const isRollback = Boolean(activeRelease && isEarlierRelease(r, activeRelease));
                  return (
                    <article
                      key={r.id}
                      className={`border p-4 transition-colors ${
                        isLive ? "border-primary/50 bg-card shadow-xs" : "border-rule bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h3 className="font-mono text-sm font-semibold text-foreground">
                          {r.version}
                        </h3>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                            {r.publication && r.publication.status !== "complete"
                              ? "Active · delivery incomplete"
                              : "Live release"}
                          </span>
                        ) : (
                          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {isRollback ? "Prior version" : "Inactive release"}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>

                      <details className="mt-3 border-t border-rule pt-3 text-xs text-muted-foreground">
                        <summary className="cursor-pointer text-sm text-primary">
                          Release details
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                          <span>
                            Cycles ·{" "}
                            <span className="font-mono text-foreground">{r.cycles ?? 0}</span>
                          </span>
                          <span>
                            Rules ·{" "}
                            <span className="font-mono text-foreground">
                              {r.synthesisRules ?? 0}
                            </span>
                          </span>
                          <span>
                            Schema ·{" "}
                            <span className="font-mono text-foreground">
                              {r.schemaVersion ?? 1}
                            </span>
                          </span>
                          <span>
                            Transit chapters ·{" "}
                            <span className="font-mono text-foreground">
                              {r.transitChapters ?? 0}/5
                            </span>
                          </span>
                          <span>
                            Natal lenses ·{" "}
                            <span className="font-mono text-foreground">
                              {r.natalLensCoverage?.base ?? 0} base,{" "}
                              {r.natalLensCoverage?.compound ?? 0} compound ·{" "}
                              {r.natalLensCoverage?.bodySigns ?? 0}/60 pairs
                            </span>
                          </span>
                          <span>
                            Checksum ·{" "}
                            <span className="font-mono text-foreground" title={r.checksum}>
                              {r.checksum.slice(0, 16)}…
                            </span>
                          </span>
                          <span>Algorithm · {r.checksumAlgorithm ?? "legacy-unlabelled"}</span>
                        </div>
                      </details>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
                        {isLive ? (
                          <span className="text-xs text-muted-foreground">
                            Used for new readings
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setResult(null);
                              setPendingRelease({
                                release: r,
                                isRollback,
                                expectedPreviousVersion: activeRelease?.version ?? null,
                              });
                            }}
                            disabled={rollback.isPending || reconcile.isPending}
                          >
                            {rollback.isPending && rollback.variables?.release.id === r.id
                              ? isRollback
                                ? "Rolling back…"
                                : "Activating…"
                              : isRollback
                                ? "Roll back to this release"
                                : "Make live"}
                          </Button>
                        )}
                        {r.publication && ["pending", "failed"].includes(r.publication.status) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={rollback.isPending || reconcile.isPending}
                            onClick={() => reconcile.mutate(r.version)}
                          >
                            {reconcile.isPending && reconcile.variables === r.version
                              ? "Reconciling…"
                              : "Reconcile publication"}
                          </Button>
                        ) : null}
                      </div>
                      {!isLive && session ? (
                        <InactiveReleaseEvaluation
                          release={r}
                          releases={releases}
                          userId={session.userId}
                          memberProvider={memberProviders.data?.memberProvider}
                          disabled={rollback.isPending || reconcile.isPending}
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: Durable run ledger */}
          <EdgePlane isAdmin={isAdmin} />

          {/* Section 4: Reading quality telemetry */}
          <QualityPlane isAdmin={isAdmin} />

          {/* Section 5: Synthetic evaluation */}
          <section className="border-t border-rule pt-8" aria-labelledby="eval-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="eval-heading" className="text-2xl font-serif leading-snug">
                  Synthetic evaluation
                </h2>
                <p className="prose-reading mt-2 max-w-prose text-sm text-muted-foreground">
                  Run live language-provider requests against fixed synthetic facts to check reading
                  assembly and validation. Runs continue on the server when you leave this page;
                  selecting evaluation copy does not publish or activate it.
                </p>
              </div>
            </div>
            <div className="mt-6">
              {session?.userId ? (
                <EditorialPilotEvaluation
                  key={`editorial-${session.userId}`}
                  userId={session.userId}
                />
              ) : null}
              <ReadingEvaluation
                key={session?.userId ?? "anonymous"}
                providerStatus={providerStatus}
              />
            </div>
          </section>
        </div>

        <Rail title="Current release">
          <Field
            label="Active release"
            value={
              query.isPending
                ? "—"
                : query.error
                  ? "unknown"
                  : (releases.find((r) => r.is_active)?.version ?? "built-in")
            }
          />
          <nav className="flex flex-col text-sm" aria-label="Content tools">
            <a className="inline-flex min-h-11 items-center text-primary" href="#drafts-heading">
              Candidate drafts
            </a>
            <a className="inline-flex min-h-11 items-center text-primary" href="#releases-heading">
              Published releases
            </a>
            <a
              className="inline-flex min-h-11 items-center text-primary"
              href="#edge-plane-heading"
            >
              Reading runs
            </a>
            <a
              className="inline-flex min-h-11 items-center text-primary"
              href="#reading-quality-heading"
            >
              Reading quality
            </a>
            <a className="inline-flex min-h-11 items-center text-primary" href="#eval-heading">
              Synthetic evaluation
            </a>
          </nav>
        </Rail>
      </div>

      {/* Confirmation modal for pointer activation/rollback */}
      <AlertDialog
        open={Boolean(pendingRelease)}
        onOpenChange={(open) => {
          if (!open) setPendingRelease(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRelease?.isRollback
                ? `Roll back to ${pendingRelease.release.version}?`
                : `Make ${pendingRelease?.release.version} live?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRelease?.isRollback
                ? "Today’s and future readings will be assembled from this earlier release. Existing readings will permanently retain the release version they were originally assembled from."
                : "Today’s and future readings will be assembled from this release. Existing readings will permanently retain the release version they were originally assembled from."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingRelease ? (
            <dl className="my-2 space-y-2 border-y border-rule py-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Target release</dt>
                <dd className="font-mono text-xs font-semibold text-foreground">
                  {pendingRelease.release.version}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Action</dt>
                <dd className="text-xs font-medium text-foreground">
                  {pendingRelease.isRollback ? "Rollback" : "Pointer activation"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Checksum</dt>
                <dd className="font-mono text-xs break-all text-foreground">
                  {pendingRelease.release.checksum.slice(0, 24)}…
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cycles & rules</dt>
                <dd className="font-mono text-xs text-foreground">
                  {pendingRelease.release.cycles ?? 0} cycles ·{" "}
                  {pendingRelease.release.synthesisRules ?? 0} rules
                </dd>
              </div>
            </dl>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollback.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRelease) {
                  rollback.mutate(pendingRelease);
                }
              }}
              disabled={rollback.isPending}
            >
              {rollback.isPending
                ? "Applying…"
                : pendingRelease?.isRollback
                  ? "Confirm rollback"
                  : "Confirm activation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
 * Release delivery writes immutable editorial artifacts; this ledger records
 * separate nightly and manually started reading Workflows.
 */
function EdgePlane({ isAdmin }: { isAdmin: boolean }) {
  const planeFn = useServerFn(fetchEdgePlane);
  const triggerFn = useServerFn(triggerEdgeRun);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["edge-plane"], queryFn: () => planeFn({}) });

  const runs: Run[] = query.data?.runs ?? [];
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
    <section className="border-t border-rule pt-8" aria-labelledby="edge-plane-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="edge-plane-heading" className="text-2xl font-serif leading-snug">
          Reading runs
        </h2>
        <span className="text-xs text-muted-foreground">{runs.length} recorded runs</span>
      </div>
      <p className="prose-reading mt-3 max-w-prose text-foreground">
        Nightly and manually started reading workflows. Release delivery is tracked separately in
        Published releases.
      </p>

      {query.isPending ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
          <p className="text-xs text-muted-foreground">Loading runs…</p>
          {[0, 1].map((i) => (
            <div key={i} className="border border-rule bg-card p-4">
              <div className="h-3 w-48 animate-pulse bg-muted" />
              <div className="mt-3 h-3 w-64 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <div role="alert" className="mt-6 border border-destructive/40 bg-evidence p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Run ledger unreachable
          </p>
          <p className="prose-reading mt-2 max-w-prose text-foreground">
            The durable plane could not be read. Readings are unaffected — they are assembled from
            the release recorded on each one.
          </p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="mt-4"
          >
            {query.isFetching ? "Retrying…" : "Retry"}
          </Button>
        </div>
      ) : unavailable ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-evidence-foreground">
            Edge plane not configured
          </p>
          <p className="prose-reading mt-2 max-w-prose text-foreground">
            No durable workflow endpoint is wired to this environment, so releases stay app-local
            and no artifacts are written.
          </p>
        </div>
      ) : runs.length === 0 ? (
        <div className="mt-6 border border-rule bg-evidence p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-evidence-foreground">
            No runs yet
          </p>
          <p className="prose-reading mt-2 max-w-prose text-foreground">
            Runs appear after a nightly workflow or a manual start.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-rule">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">Edge plane workflow runs and artifact ledger</caption>
            <thead className="bg-muted/40">
              <tr className="border-b border-rule text-xs text-muted-foreground">
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Instance
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Kind
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Release
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Artifact
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/60">
              {runs.map((r) => (
                <tr key={r.instance_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                    {r.instance_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{r.kind}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.release_version ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs break-all text-muted-foreground">
                    {r.artifact_key ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && !unavailable ? (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => start.mutate()}
            disabled={start.isPending}
          >
            {start.isPending ? "Starting…" : "Start a reading run for today"}
          </Button>
        </div>
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
      className="border-t border-rule pt-8 min-w-0"
      aria-labelledby="reading-quality-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="reading-quality-heading" className="text-2xl font-serif leading-snug">
            Reading quality
          </h2>
          {data ? (
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              Window: {data.total} persisted generations ·{" "}
              {data.measurement.attempts
                ? percent((data.measurement.accepted / data.measurement.attempts) * 100, "—") +
                  " acceptance rate"
                : "No measured attempts"}
            </p>
          ) : null}
        </div>
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

      <details className="mt-4 rounded-sm border border-rule bg-card/50 p-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-foreground hover:underline">
          Measurement methodology and validation caveats
        </summary>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground max-w-prose">
          <p>
            This report covers up to 300 recent persisted reading generations, ordered by creation
            time. It counts generations, not page views or all gateway traffic. Opening a cached
            reading adds no observation. Only instrumented generations have measured outcomes;
            missing, invalid or incompatible diagnostics remain separate as legacy. This is a recent
            retained sample, not a lifetime total or a random sample of readers.
          </p>
          {data?.window ? (
            <p>
              {data.window.truncated
                ? `The most recent ${data.window.limit} generations are included; older retained generations are excluded.`
                : `All retained generations within the cap of ${data.window.limit} are included.`}
              {data.window.oldest && data.window.newest ? (
                <span className="mt-1 block font-mono [overflow-wrap:anywhere]">
                  Created from <time dateTime={data.window.oldest}>{data.window.oldest}</time> to{" "}
                  <time dateTime={data.window.newest}>{data.window.newest}</time>.
                </span>
              ) : null}
            </p>
          ) : null}
          <p>
            When a daily draft fails validation, the whole draft falls back to template wording.
            Citation checks verify supplied IDs and coverage with bounded wording checks; they do
            not establish that every claim is supported by a cited fact or assess writing quality.
            This report contains counts, codes and versions, never reading text or private user
            context.
          </p>
          <p>
            Attempted fallbacks are validation rejections plus attempted gateway failures, divided
            by measured model attempts. Quiet days, missing configuration and legacy generations are
            excluded from that denominator. Configuration counts do not establish which model or
            prompt writes better readings. Opt-in feedback is self-selected and does not establish
            that model wording caused a better reading.
          </p>
        </div>
      </details>

      {query.isPending ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
          <p className="text-xs text-muted-foreground">Loading generation measurements…</p>
          {[0, 1].map((i) => (
            <div key={i} className="border border-rule bg-card p-4">
              <div className="h-3 w-48 animate-pulse bg-muted" />
              <div className="mt-3 h-3 w-64 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <div role="alert" className="mt-6 border border-destructive/40 bg-evidence p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Generation measurements unreachable
          </p>
          <p className="prose-reading mt-2 max-w-prose text-foreground">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-evidence-foreground">
            No persisted generations recorded yet
          </p>
          <p className="prose-reading mt-2 max-w-prose text-foreground">
            There are no measured attempts or feedback rates to report. The first newly generated
            reading starts this record; reopening cached readings does not.
          </p>
        </div>
      ) : (
        <>
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
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-mono text-sm [overflow-wrap:anywhere] text-foreground font-semibold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

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
                <dd className="font-mono text-sm font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-8 text-xl font-serif">Recorded outcome causes</h3>
          {data.writing.instrumented ? (
            <div className="mt-4 rounded-sm border border-rule p-4">
              <p className="text-sm text-foreground">
                Daily editorial checks · {data.writing.instrumented} readings ·{" "}
                {data.writing.minimal} minimal templates
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Warnings are editorial observations. They do not mark a reading unsafe. This summary
                contains counts and closed codes only.
              </p>
              <ul className="mt-3 flex flex-wrap gap-3 text-xs font-mono">
                {data.writing.issues.map(({ code, count }) => (
                  <li key={code}>
                    {code}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-2 text-sm max-w-prose text-muted-foreground">
            Closed codes from instrumented generations. A rejected draft records its first failing
            check, rather than every possible failure.
          </p>
          {data.outcomes.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto rounded-sm border border-rule"
              tabIndex={0}
              role="region"
              aria-label="Recorded outcome causes table"
            >
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Recorded generation outcomes and bounded cause codes
                </caption>
                <thead className="bg-muted/40">
                  <tr className="border-b border-rule text-muted-foreground">
                    <th scope="col" className="px-3 py-2 pr-4 font-medium">
                      Outcome
                    </th>
                    <th scope="col" className="px-3 py-2 pr-4 font-medium">
                      Cause code
                    </th>
                    <th scope="col" className="px-3 py-2 pr-4 font-medium">
                      Meaning
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Generations
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/60">
                  {data.outcomes.map((row) => (
                    <tr key={row.outcome + "/" + row.code}>
                      <td className="px-3 py-2.5 pr-4 text-foreground">
                        {outcomeLabel(row.outcome, row.code)}
                      </td>
                      <td className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                        {row.code}
                      </td>
                      <td className="px-3 py-2.5 pr-4 text-muted-foreground">{row.label}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-foreground">
                        {row.count}
                      </td>
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

          <h3 className="mt-8 text-xl font-serif">Recorded configurations</h3>
          <p className="mt-2 text-sm max-w-prose text-muted-foreground">
            Prompt, validator, model, release and gateway timeout budget group instrumented
            generations.
          </p>
          {data.configurations.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto rounded-sm border border-rule"
              tabIndex={0}
              role="region"
              aria-label="Recorded configurations table"
            >
              <table className="w-full min-w-[66rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Generation measurements grouped by recorded versions and gateway timeout budget
                </caption>
                <thead className="bg-muted/40">
                  <tr className="border-b border-rule text-muted-foreground">
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
                      <th key={label} scope="col" className="px-3 py-2 pr-4 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/60">
                  {data.configurations.map((row) => (
                    <tr
                      key={JSON.stringify([
                        row.promptVersion,
                        row.validatorVersion,
                        row.model,
                        row.releaseVersion,
                        row.gatewayTimeoutMs,
                      ])}
                    >
                      <td className="max-w-[12rem] px-3 py-2.5 pr-4 font-mono text-foreground [overflow-wrap:anywhere]">
                        {row.promptVersion}
                        <span className="mt-0.5 block text-muted-foreground">
                          {row.validatorVersion}
                        </span>
                      </td>
                      <td className="max-w-[13rem] px-3 py-2.5 pr-4 font-mono text-foreground [overflow-wrap:anywhere]">
                        {row.model}
                        <span className="mt-0.5 block text-muted-foreground">
                          {row.releaseVersion}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 pr-4 font-mono text-foreground">
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
                        <td key={i} className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                          {value}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 pr-4 font-mono font-semibold text-foreground">
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

          <h3 className="mt-8 text-xl font-serif">Selected resonance feedback</h3>
          <p className="mt-2 text-sm leading-relaxed max-w-prose text-muted-foreground">
            Only accounts currently opted into quality feedback contribute valid saved scores.
            Coverage is rated readings divided by eligible readings. Unrated readings are missing
            data; they do not count as an Unsure (0) response.
          </p>
          <div
            className="mt-3 max-w-full overflow-x-auto rounded-sm border border-rule"
            tabIndex={0}
            role="region"
            aria-label="Selected resonance feedback table"
          >
            <table className="w-full min-w-[52rem] border-collapse text-left text-xs">
              <caption className="sr-only">
                Opt-in resonance feedback by model, template and legacy cohorts
              </caption>
              <thead className="bg-muted/40">
                <tr className="border-b border-rule text-muted-foreground">
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
                    <th key={label} scope="col" className="px-3 py-2 pr-4 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {data.feedback.map((row) => (
                  <tr key={row.cohort}>
                    <th scope="row" className="px-3 py-2.5 pr-4 font-normal text-foreground">
                      {row.cohort === "model"
                        ? "Model wording"
                        : row.cohort === "template"
                          ? "Template wording"
                          : "Legacy metadata"}
                    </th>
                    {[row.readings, row.eligibleReadings, row.ratedReadings].map((value, i) => (
                      <td key={i} className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                        {value}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 pr-4 font-mono text-foreground font-semibold">
                      {percent(row.coverage, "No eligible readings")}
                    </td>
                    {[row.positive, row.neutral, row.negative].map((value, i) => (
                      <td key={i} className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                        {value}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 pr-4 font-mono font-semibold text-foreground">
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

          <h3 className="mt-8 text-xl font-serif">Citation ID usage</h3>
          <p className="mt-2 text-sm max-w-prose text-muted-foreground">
            {data.model} model-mode generations and {data.template} template-mode generations appear
            in this window. Citation shares below use the model-mode generations as their
            denominator.
          </p>
          {data.facts.length ? (
            <div
              className="mt-3 max-w-full overflow-x-auto rounded-sm border border-rule"
              tabIndex={0}
              role="region"
              aria-label="Citation ID usage table"
            >
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Supplied fact IDs referenced in stored model-mode citation metadata
                </caption>
                <thead className="bg-muted/40">
                  <tr className="border-b border-rule text-muted-foreground">
                    {["ID", "Kind", "Generations", "Paragraphs", "Share of model mode"].map(
                      (label) => (
                        <th key={label} scope="col" className="px-3 py-2 pr-4 font-medium">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/60">
                  {data.facts.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2.5 pr-4 font-mono text-foreground">{row.id}</td>
                      <td className="px-3 py-2.5 pr-4 text-muted-foreground">{row.kind}</td>
                      <td className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                        {row.readings}
                      </td>
                      <td className="px-3 py-2.5 pr-4 font-mono text-muted-foreground">
                        {row.paragraphs}
                      </td>
                      <td className="px-3 py-2.5 pr-4 font-mono font-semibold text-foreground">
                        {row.share}%
                      </td>
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
              <h3 className="mt-8 text-xl font-serif">Your recent generation metadata</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Up to 12 of your persisted generations within this window. Dates are reading days.
              </p>
              <div className="mt-3 space-y-3">
                {data.samples.map((row) => (
                  <article key={row.id} className="min-w-0 border border-rule bg-card p-3">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {row.reading_date}
                      </span>
                      <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        {row.mode === "model" ? (row.model ?? "model") : "template"}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
    </section>
  );
}

/**
 * Language-layer drafting: the model writes candidate interpretation copy for
 * every slot the engine looks up. A draft is inert until an admin publishes it
 * as a release and activates it.
 */
function DraftPlane({ isAdmin }: { isAdmin: boolean }) {
  const { session } = useAuth();
  const listFn = useServerFn(fetchContentDrafts);
  const draftFn = useServerFn(draftContentRelease);
  const discardFn = useServerFn(discardContentDraft);
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<LanguageProvider>("lovable");
  const providerStatus = useLanguageProviderStatus(isAdmin);
  const providersFn = useServerFn(fetchLanguageProviders);
  const providerQuery = useQuery({
    queryKey: ["language-providers", session?.userId],
    queryFn: () => providersFn({}),
    enabled: Boolean(isAdmin && session),
  });
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [reviewBusy, setReviewBusy] = useState<Record<string, boolean>>({});

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
    <section aria-labelledby="drafts-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="drafts-heading" className="text-2xl font-serif leading-snug">
            Candidate drafts
          </h2>
          <p className="prose-reading mt-2 max-w-prose text-foreground text-sm">
            Generate and review candidate interpretation copy before publication. The model drafts
            mechanism and reflection question copy for each cycle slot. Candidates that fail safety,
            phrase or schema checks are filtered before storage. A draft is inert until published as
            an inactive release and activated in Published releases.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <LanguageProviderChoice
            value={provider}
            onChange={setProvider}
            disabled={draft.isPending}
            configured={providerStatus}
          />
          <Button
            type="button"
            onClick={() => draft.mutate()}
            disabled={draft.isPending}
            className="min-h-11"
          >
            {draft.isPending ? "Drafting…" : "Draft a release"}
          </Button>
        </div>
      </div>

      {query.isPending ? (
        <p className="mt-4 text-xs text-muted-foreground" aria-busy="true">
          Loading drafts…
        </p>
      ) : query.error ? (
        <p role="alert" className="mt-4 text-xs text-destructive">
          Drafts unavailable: {query.error.message}
        </p>
      ) : drafts.length === 0 ? (
        <div className="mt-6 border border-rule bg-card p-4">
          <p className="text-xs text-muted-foreground">
            No open drafts. Choose a language provider above and select "Draft a release" to
            generate a candidate release for editorial review.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {drafts.map((d) => {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            const droppedCount = typeof notes["dropped"] === "number" ? notes["dropped"] : 0;
            const isRulesExpanded = expandedRules[d.id] ?? false;
            const isEntriesExpanded = expandedEntries[d.id] ?? false;

            const relevantEntries =
              d.affectedKeys && d.affectedKeys.length > 0
                ? [
                    ...d.entries.filter((e) => d.affectedKeys.includes(e.key)),
                    ...d.entries.filter((e) => !d.affectedKeys.includes(e.key)),
                  ]
                : d.entries;

            const displayedEntries = isEntriesExpanded
              ? relevantEntries
              : relevantEntries.slice(0, 4);

            return (
              <article key={d.id} className="border border-rule bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-foreground">
                      Draft candidate · from {d.base_version ?? "built-in"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">
                      {d.entries.length} entries ({d.themeCount ?? 0} themes, {d.ruleCount ?? 0}{" "}
                      pair rules) · Schema {d.schemaVersion} · {d.transitChapters}/5 transit
                      chapters · {d.natalLensCoverage.base} base natal lenses,{" "}
                      {d.natalLensCoverage.compound} compound · {d.natalLensCoverage.bodySigns}/60
                      body/sign pairs
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs rounded bg-muted px-2 py-0.5 text-muted-foreground">
                      {d.model ?? "—"}
                    </span>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {formatDate(d.created_at)}
                    </p>
                  </div>
                </div>

                {droppedCount > 0 ? (
                  <div className="border border-primary/20 bg-evidence p-2.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {droppedCount} candidate entries filtered
                    </span>{" "}
                    by safety, phrase validation, and schema bounds before reaching this review.
                  </div>
                ) : null}

                {d.affectedKeys && d.affectedKeys.length > 0 ? (
                  <div className="border border-rule bg-card/60 p-3 text-xs">
                    <span className="font-medium text-foreground">
                      Drafted / affected interpretation keys ({d.affectedKeys.length}):
                    </span>{" "}
                    <span className="font-mono text-muted-foreground">
                      {d.affectedKeys.join(", ")}
                    </span>
                  </div>
                ) : null}

                {d.removedRules && d.removedRules.length > 0 ? (
                  <div className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <span className="font-medium">Synthesis rules flagged for review:</span>{" "}
                    <span className="font-mono">{d.removedRules.join(", ")}</span>
                  </div>
                ) : null}

                {/* Synthesis rules inspection */}
                {d.synthesisRules && d.synthesisRules.length > 0 ? (
                  <div className="border-t border-rule/60 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        Pair rules ({d.synthesisRules.length}):
                      </span>
                      {d.synthesisRules.length > 4 ? (
                        <Button
                          variant="link"
                          size="sm"
                          type="button"
                          onClick={() =>
                            setExpandedRules((prev) => ({ ...prev, [d.id]: !isRulesExpanded }))
                          }
                          className="h-auto whitespace-normal px-0 text-xs"
                        >
                          {isRulesExpanded
                            ? "Show fewer rules"
                            : `View all ${d.synthesisRules.length} rules`}
                        </Button>
                      ) : null}
                    </div>
                    <ul className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
                      {(isRulesExpanded ? d.synthesisRules : d.synthesisRules.slice(0, 4)).map(
                        (r) => (
                          <li key={r.key} className="break-words">
                            <span className="text-foreground font-semibold capitalize">
                              {r.relationship}
                            </span>
                            {": "}
                            <span>
                              {r.primary.interpretationKey} ({r.primary.theme})
                            </span>
                            {" → "}
                            <span>
                              {r.supporting.interpretationKey} ({r.supporting.theme})
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}

                {/* Full interpretation entries review */}
                <div className="border-t border-rule/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Interpretation entries ({d.entries.length}):
                    </span>
                    {relevantEntries.length > 4 ? (
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        onClick={() =>
                          setExpandedEntries((prev) => ({
                            ...prev,
                            [d.id]: !isEntriesExpanded,
                          }))
                        }
                        className="h-auto whitespace-normal px-0 text-xs"
                      >
                        {isEntriesExpanded
                          ? "Show summary (4 entries)"
                          : `View all ${relevantEntries.length} entries with questions`}
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-3">
                    {displayedEntries.map((e) => (
                      <div
                        key={e.key}
                        className="rounded-sm border border-rule/80 bg-background/50 p-3"
                      >
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {e.key}
                          </span>
                          {e.themes && e.themes.length > 0 ? (
                            <span className="text-xs font-mono text-primary">
                              [{e.themes.join(", ")}]
                            </span>
                          ) : null}
                        </div>
                        <p className="prose-reading font-serif text-sm leading-relaxed text-foreground mt-2">
                          {e.mechanism}
                        </p>
                        {e.question ? (
                          <p className="mt-1.5 text-xs text-muted-foreground italic leading-relaxed">
                            Reflection question: {e.question}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Draft action controls */}
                <div className="flex flex-wrap gap-3 border-t border-rule pt-4">
                  <ContentDraftReview
                    draftId={d.id}
                    disabled={discard.isPending}
                    onBusyChange={(busy) =>
                      setReviewBusy((previous) =>
                        previous[d.id] === busy ? previous : { ...previous, [d.id]: busy },
                      )
                    }
                    onPublished={(version, complete) => {
                      if (complete)
                        toast.success(
                          `Staged ${version}. Activate it separately after qualification.`,
                        );
                      else
                        toast.warning(
                          `Staged ${version}; artifact delivery is incomplete. Reconcile publication before sign-off.`,
                        );
                      refresh();
                    }}
                  />
                  {session ? (
                    <ContentDraftEvaluation
                      key={`${session.userId}:${d.id}`}
                      draftId={d.id}
                      userId={session.userId}
                      baseVersion={d.base_version}
                      authoringModel={d.model}
                      memberProvider={providerQuery.data?.memberProvider}
                      disabled={Boolean(discard.isPending || reviewBusy[d.id])}
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscardTarget(d.id)}
                    disabled={discard.isPending || reviewBusy[d.id]}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Discard draft
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation dialog for draft discard */}
      <AlertDialog
        open={Boolean(discardTarget)}
        onOpenChange={(open) => {
          if (!open) setDiscardTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This draft will be marked as discarded and removed from the open drafts list. It can
              no longer be published, and this page has no restore action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={discard.isPending}>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (discardTarget) {
                  discard.mutate(discardTarget);
                  setDiscardTarget(null);
                }
              }}
              disabled={discard.isPending || Boolean(discardTarget && reviewBusy[discardTarget])}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {discard.isPending ? "Discarding…" : "Discard draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
