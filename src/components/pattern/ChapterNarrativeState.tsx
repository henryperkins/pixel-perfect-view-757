import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import type { Ref } from "react";

import { Button } from "@/components/ui/button";
import type { ChapterViewState } from "./chapter-view";
import { chapterParagraphId, type PatternFeature } from "./pattern-view";

export type ChapterNarrativeStateProps = {
  state: ChapterViewState;
  feature: PatternFeature;
  narrativeRef: Ref<HTMLDivElement>;
  isFetching: boolean;
  onRetry: () => void;
  onRefreshChapters: () => void;
};

/** Presentation only: the owning chapter keeps the queries, timers and evidence. */
export function ChapterNarrativeState({
  state,
  feature,
  narrativeRef,
  isFetching,
  onRetry,
  onRefreshChapters,
}: ChapterNarrativeStateProps) {
  if (state.kind === "ready") {
    return (
      <>
        {state.staleError ? (
          <div className="pattern-narrative-fallback">
            <p role="status">This chapter is the last version loaded. We couldn’t refresh it.</p>
            <Button variant="outline" className="mt-4" disabled={isFetching} onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              {isFetching ? "Trying again…" : "Try refreshing this chapter"}
            </Button>
          </div>
        ) : null}
        <div ref={narrativeRef} className="pattern-narrative prose-reading">
          {state.narrative.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              id={chapterParagraphId(feature.feature_key, index + 1)}
              tabIndex={-1}
              className="pattern-evidence-target whitespace-pre-line"
            >
              {paragraph}
            </p>
          ))}
        </div>
        {state.locked ? (
          <div className="mt-6 border-t border-rule pt-5">
            <h4 className="font-serif text-xl font-medium">
              Continue this chapter with Pattern Plus
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              You’re reading the opening. Plus includes the full essay and reflection question.
            </p>
            <Button asChild className="mt-4">
              <Link to="/plans">View plans</Link>
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="pattern-narrative-loading" aria-busy="true" aria-label="Preparing chapter">
        <p role="status">Preparing this chapter. The first reading can take a little longer.</p>
        <div aria-hidden="true" className="pattern-reading-skeleton">
          {[100, 95, 88, 70].map((width) => (
            <span key={width} style={{ width: `${width}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === "changed") {
    return (
      <div className="pattern-narrative-fallback">
        <p role="status">
          Your chart or reading preferences changed. Refresh to see the current chapters.
        </p>
        <Button variant="outline" className="mt-4" onClick={onRefreshChapters}>
          <RotateCcw aria-hidden="true" /> Refresh chapters
        </Button>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="pattern-narrative-fallback">
        <p role="status">This chapter couldn’t load. Its calculated values are still below.</p>
        <Button variant="outline" className="mt-4" disabled={isFetching} onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          {isFetching ? "Trying again…" : "Try this chapter again"}
        </Button>
      </div>
    );
  }

  return (
    <div className="pattern-narrative-fallback">
      <p role="status">
        {state.retryable
          ? "This chapter couldn’t be prepared just now."
          : "No verified reading is available for this chapter."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {state.reason ?? "The calculated values below are still available."}
      </p>
      {state.retryable ? (
        <Button variant="outline" className="mt-4" disabled={isFetching} onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          {isFetching ? "Trying again…" : "Try this chapter again"}
        </Button>
      ) : null}
    </div>
  );
}
