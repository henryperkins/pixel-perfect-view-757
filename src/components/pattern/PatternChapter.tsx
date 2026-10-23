import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { useMembership } from "@/hooks/useMembership";
import { chapterPreview } from "@/lib/billing-policy";
import { membershipAccessSignature, resolveChapterAccess } from "@/lib/chapter-access";
import { fetchFeatureNarrative } from "@/lib/pattern.functions";

import { ChapterNarrativeState } from "./ChapterNarrativeState";
import { resolveChapterView, type ChapterNarrative } from "./chapter-view";
import { PatternChapterEvidence } from "./PatternChapterEvidence";
import type { PatternFeature } from "./pattern-view";
import { AttachedJournalContext } from "./TodayJournal";
import { useReadingArrival } from "./useBrowsingMotion";

const narrativeKey = (cacheKey: string, featureKey: string) =>
  ["feature-narrative", cacheKey, featureKey] as const;

/** Cached writing results are never automatically retried by a remount. */
function hasAvailableNarrative(data: unknown): boolean {
  return Boolean(
    data && typeof data === "object" && "available" in data && data.available === true,
  );
}

/** Keep the verified essay verbatim and its calculated support independently accessible. */
export function PatternChapter({
  feature,
  cacheKey,
}: {
  feature: PatternFeature;
  cacheKey: string;
}) {
  const client = useQueryClient();
  const membership = useMembership();
  const [clock, setClock] = useState(() => Date.now());
  const load = useServerFn(fetchFeatureNarrative);
  const query = useQuery({
    // Access is decided by the server response, so the membership state is not
    // part of the cache identity.
    queryKey: narrativeKey(cacheKey, feature.feature_key),
    queryFn: () => load({ data: { featureKey: feature.feature_key } }),
    staleTime: Infinity,
    retry: false,
    // A readable cached chapter is revalidated on route return. An unavailable
    // writing result is not retried automatically.
    refetchOnMount: (query) => (hasAvailableNarrative(query.state.data) ? "always" : false),
  });

  const access = resolveChapterAccess({
    server: query.data ?? null,
    membership: membership.data ?? null,
    now: clock,
  });

  const serverNarrative =
    query.data?.available === true && query.data.cacheKey === cacheKey ? query.data : null;
  const display: ChapterNarrative | null =
    serverNarrative && access.localPreview ? chapterPreview(serverNarrative) : serverNarrative;
  const state = resolveChapterView({
    data: query.data,
    display,
    error: Boolean(query.error),
    isPending: query.isPending,
    isFetching: query.isFetching,
    locked: access.locked,
  });
  const narrativeRef = useReadingArrival(Boolean(display));

  const queryScope = JSON.stringify([cacheKey, feature.feature_key]);
  const revalidateAt = access.revalidateAt;
  const refetchMembership = membership.refetch;
  const deadline = useRef<{ scope: string; consumed: string | null }>({
    scope: queryScope,
    consumed: null,
  });

  useEffect(() => {
    if (deadline.current.scope !== queryScope)
      deadline.current = { scope: queryScope, consumed: null };
    if (!revalidateAt || deadline.current.consumed === revalidateAt) return;
    const parsed = Date.parse(revalidateAt);
    const remaining = Number.isFinite(parsed) ? parsed - Date.now() : 0;
    const delay = Math.min(Math.max(remaining + 25, 50), 2_147_000_000);
    const timer = window.setTimeout(() => {
      deadline.current.consumed = revalidateAt;
      setClock(Date.now());
      void refetchMembership();
      if (query.data?.available)
        void client.invalidateQueries({ queryKey: narrativeKey(cacheKey, feature.feature_key) });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    revalidateAt,
    refetchMembership,
    queryScope,
    client,
    cacheKey,
    feature.feature_key,
    query.data?.available,
  ]);

  const signature = membershipAccessSignature(membership.data);
  const accessRefresh = useRef({
    queryScope,
    observedSignature: null as string | null,
    pendingChange: false,
    reconciledSignature: null as string | null,
  });

  useEffect(() => {
    if (accessRefresh.current.queryScope !== queryScope) {
      accessRefresh.current = {
        queryScope,
        observedSignature: null,
        pendingChange: false,
        reconciledSignature: null,
      };
    }
    if (!signature) return;
    const refresh = accessRefresh.current;
    if (refresh.observedSignature !== signature) {
      refresh.pendingChange ||= refresh.observedSignature !== null;
      refresh.observedSignature = signature;
      refresh.reconciledSignature = null;
    }

    // Wait for the current request; never cancel and restart it for an access change.
    if (query.isFetching) return;
    // Consume changes against failed/unavailable writing without retrying it or
    // carrying an old change into a later explicit retry with the same signature.
    if (query.data?.available === false || (query.isError && !query.data)) {
      refresh.pendingChange = false;
      refresh.reconciledSignature = signature;
      return;
    }
    if (!query.data?.available) return;
    const mismatch =
      membership.data?.fullAccess === true &&
      query.data.locked === true &&
      refresh.reconciledSignature !== signature;
    if (!refresh.pendingChange && !mismatch) return;

    // Consume before invalidating. A subsequent locked answer remains authoritative
    // and cannot trigger a loop for this unchanged signature.
    refresh.pendingChange = false;
    refresh.reconciledSignature = signature;
    void client.invalidateQueries({ queryKey: narrativeKey(cacheKey, feature.feature_key) });
  }, [
    signature,
    membership.data?.fullAccess,
    query.data,
    query.isFetching,
    query.isError,
    queryScope,
    cacheKey,
    feature.feature_key,
    client,
  ]);

  return (
    <div>
      <ChapterNarrativeState
        state={state}
        feature={feature}
        narrativeRef={narrativeRef}
        isFetching={query.isFetching}
        onRetry={() => void query.refetch()}
        onRefreshChapters={() => void client.invalidateQueries({ queryKey: ["pattern"] })}
      />
      {membership.error && display ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Your membership could not be checked just now. This chapter is still available from the
          server.
        </p>
      ) : null}

      <PatternChapterEvidence
        feature={feature}
        facts={display?.facts ?? []}
        citations={display?.citations ?? []}
        evidenceAvailable={display?.evidenceAvailable ?? false}
        model={display?.model ?? null}
        paragraphCount={display?.paragraphs.length ?? 0}
      />
      <AttachedJournalContext featureKey={feature.feature_key} />
    </div>
  );
}
