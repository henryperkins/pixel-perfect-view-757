import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
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
import {
  approveContentDraftReview,
  editContentDraft,
  fetchDraftComparison,
  publishContentDraft,
  rebaseContentDraft,
} from "@/lib/pattern.functions";
import type { ContentValue } from "@/lib/content/draft-comparison";

function ContentValueBlock({
  value,
  changedFields,
  path = "",
}: {
  value: ContentValue | null;
  changedFields: string[];
  path?: string;
}) {
  if (value === null) return <p className="text-xs text-muted-foreground">No entry.</p>;
  if (Array.isArray(value))
    return (
      <div className="space-y-2">
        {value.length ? (
          value.map((item, index) => (
            <ContentValueBlock key={index} value={item} changedFields={changedFields} path={path} />
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Empty list.</p>
        )}
      </div>
    );
  if (typeof value === "object")
    return (
      <dl className="space-y-3">
        {Object.entries(value).map(([key, item]) => {
          const field = path ? path + "." + key : key;
          const changed = changedFields.some(
            (change) => change === field || change.startsWith(field + "."),
          );
          return (
            <div key={key} className={changed ? "border-l-2 border-primary pl-3" : ""}>
              <dt className="text-xs font-medium text-muted-foreground">
                {key.replace(/([a-z])([A-Z])/g, "$1 $2")}
              </dt>
              <dd className="mt-1">
                <ContentValueBlock value={item} changedFields={changedFields} path={field} />
              </dd>
            </div>
          );
        })}
      </dl>
    );
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
      {String(value)}
    </p>
  );
}

export function ContentDraftReview({
  draftId,
  onPublished,
  disabled = false,
  onBusyChange,
}: {
  draftId: string;
  onPublished: (version: string, complete: boolean) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const load = useServerFn(fetchDraftComparison),
    approveFn = useServerFn(approveContentDraftReview),
    editFn = useServerFn(editContentDraft),
    rebaseFn = useServerFn(rebaseContentDraft),
    publishFn = useServerFn(publishContentDraft);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false),
    [visited, setVisited] = useState(false);
  const [editing, setEditing] = useState<{ text: string; candidateHash: string } | null>(null),
    [version, setVersion] = useState(""),
    [rebaseHash, setRebaseHash] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["draft-comparison", draftId],
    queryFn: () => load({ data: { draftId } }),
    enabled: visited,
  });
  const data = query.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["draft-comparison", draftId] });
  const approve = useMutation({
    mutationFn: async () => {
      if (!data?.baseHash) throw Error("Load a complete baseline first.");
      return approveFn({
        data: { draftId, candidateHash: data.candidateHash, baseHash: data.baseHash },
      });
    },
    onSuccess: () => void refresh(),
  });
  const edit = useMutation({
    mutationFn: async () => {
      if (!editing) throw Error("Open the candidate editor first.");
      let bundle: Record<string, unknown>;
      try {
        bundle = JSON.parse(editing.text);
      } catch {
        throw Error("The candidate must be valid JSON. Your edits are kept.");
      }
      return editFn({ data: { draftId, expectedCandidateHash: editing.candidateHash, bundle } });
    },
    onSuccess: () => {
      setEditing(null);
      void refresh();
    },
  });
  const rebase = useMutation({
    mutationFn: async () => {
      if (!rebaseHash) throw Error("Load the current candidate first.");
      return rebaseFn({ data: { draftId, expectedCandidateHash: rebaseHash } });
    },
    onSuccess: () => {
      setRebaseHash(null);
      void refresh();
    },
  });
  const publish = useMutation({
    mutationFn: async () => {
      if (!data?.baseHash || !data.reviewed)
        throw Error("Review and approve this candidate first.");
      return publishFn({
        data: { draftId, version, candidateHash: data.candidateHash, baseHash: data.baseHash },
      });
    },
    onSuccess: (receipt) => onPublished(receipt.version, receipt.publication.status === "complete"),
  });
  const busy =
    disabled ||
    approve.isPending ||
    edit.isPending ||
    rebase.isPending ||
    publish.isPending ||
    query.isFetching;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const errors = [approve.error, edit.error, rebase.error, publish.error].filter(Boolean);
  return (
    <div className="w-full min-w-0 border-t border-rule pt-4">
      <Button
        variant="outline"
        size="sm"
        type="button"
        aria-expanded={open}
        aria-controls={"comparison-" + draftId}
        onClick={() => {
          setVisited(true);
          setOpen(!open);
        }}
      >
        {open ? "Close comparison" : "Review baseline and candidate"}
      </Button>
      {visited ? (
        <div id={"comparison-" + draftId} hidden={!open} className="mt-5 min-w-0 space-y-5">
          {query.isPending ? (
            <p aria-busy="true">Loading the frozen comparison…</p>
          ) : query.error ? (
            <div role="alert">
              <p>{query.error.message}</p>
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                Retry comparison
              </Button>
            </div>
          ) : data ? (
            <>
              <div className="space-y-2 text-sm">
                <h4 className="font-serif text-lg">
                  Baseline {data.baseVersion ?? "unrecorded"} and candidate
                </h4>
                {data.baseAvailable ? (
                  <>
                    <p>
                      {data.counts.added} added · {data.counts.changed} changed ·{" "}
                      {data.counts.removed} removed · {data.counts.unchanged} unchanged
                    </p>
                    <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      Frozen baseline: {data.baseHash}
                      <br />
                      Candidate: {data.candidateHash}
                    </p>
                  </>
                ) : (
                  <p role="status">{data.reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Changed fields are marked. Expand unchanged entries to read their full context.
                </p>
              </div>
              {errors.map((error, index) => (
                <p key={index} role="alert" className="text-sm text-destructive">
                  {error!.message}
                </p>
              ))}
              <div className="space-y-3">
                {data.entries.map((entry) => (
                  <details
                    key={JSON.stringify([entry.kind, entry.section, entry.key])}
                    open={entry.change !== "unchanged"}
                    className="min-w-0 border border-rule p-3"
                  >
                    <summary className="cursor-pointer text-xs font-medium [overflow-wrap:anywhere]">
                      {entry.section} / {entry.key} ·{" "}
                      {data.baseAvailable ? entry.change : "candidate"}
                    </summary>
                    <div className="mt-4 grid min-w-0 gap-5 md:grid-cols-2">
                      <section
                        aria-label={entry.section + " / " + entry.key + ": baseline"}
                        className="min-w-0"
                      >
                        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide">
                          Baseline
                        </h5>
                        {data.baseAvailable ? (
                          <ContentValueBlock
                            value={entry.base}
                            changedFields={entry.changedFields}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Original comparison unavailable.
                          </p>
                        )}
                      </section>
                      <section
                        aria-label={entry.section + " / " + entry.key + ": candidate"}
                        className="min-w-0"
                      >
                        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide">
                          Candidate
                        </h5>
                        <ContentValueBlock
                          value={entry.candidate}
                          changedFields={entry.changedFields}
                        />
                      </section>
                    </div>
                  </details>
                ))}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <label htmlFor={"candidate-json-" + draftId} className="text-sm font-medium">
                    Candidate JSON
                  </label>
                  <textarea
                    id={"candidate-json-" + draftId}
                    className="min-h-64 w-full min-w-0 rounded-sm border border-input bg-background p-3 font-mono text-xs"
                    maxLength={1000000}
                    value={editing.text}
                    onChange={(event) => setEditing({ ...editing, text: event.target.value })}
                    disabled={edit.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Saving clears approval. All content fields remain in the candidate.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" type="button" disabled={busy} onClick={() => edit.mutate()}>
                      {edit.isPending ? "Saving…" : "Save candidate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(null);
                        edit.reset();
                      }}
                    >
                      Cancel edit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      approve.reset();
                      publish.reset();
                      edit.reset();
                      setEditing({
                        text: JSON.stringify(data.candidate, null, 2),
                        candidateHash: data.candidateHash,
                      });
                    }}
                  >
                    Edit candidate JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      rebase.reset();
                      setRebaseHash(data.candidateHash);
                    }}
                  >
                    Rebase against active release
                  </Button>
                </div>
              )}
              <div className="space-y-3 border-t border-rule pt-4">
                <p role="status" className="text-sm">
                  {data.reviewed
                    ? "This exact candidate and baseline are approved."
                    : "Approval is required for this exact candidate and baseline."}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || Boolean(editing) || !data.baseAvailable || data.reviewed}
                    onClick={() => approve.mutate()}
                  >
                    {approve.isPending ? "Approving…" : "Approve reviewed candidate"}
                  </Button>
                  <label className="min-w-0 text-xs">
                    Release version
                    <input
                      aria-label="Release version"
                      className="mt-1 block w-40 max-w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                      placeholder="0.8.0"
                      maxLength={64}
                      value={version}
                      onChange={(event) => setVersion(event.target.value)}
                      disabled={publish.isPending}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      busy ||
                      Boolean(editing) ||
                      !data.reviewed ||
                      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
                    }
                    onClick={() => publish.mutate()}
                  >
                    {publish.isPending ? "Staging…" : "Stage reviewed release"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Staging keeps the release inactive. Activate it separately after qualification.
                </p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      <AlertDialog
        open={Boolean(rebaseHash)}
        onOpenChange={(value) => {
          if (!value && !rebase.isPending) setRebaseHash(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace this draft’s comparison baseline?</AlertDialogTitle>
            <AlertDialogDescription>
              The current active release becomes the frozen baseline. Candidate text is kept and
              approval is cleared. Review the new comparison before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rebase.error ? (
            <p role="alert" className="text-sm text-destructive">
              {rebase.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rebase.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rebase.isPending}
              onClick={(event) => {
                event.preventDefault();
                rebase.mutate();
              }}
            >
              {rebase.isPending ? "Rebasing…" : "Confirm rebase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
