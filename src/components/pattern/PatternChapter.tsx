import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchFeatureNarrative } from "@/lib/pattern.functions";
import { chapterParagraphId, type PatternFeature } from "./pattern-view";
import { useReadingArrival } from "./useBrowsingMotion";
import { PatternChapterEvidence } from "./PatternChapterEvidence";
import { AttachedJournalContext } from "./TodayJournal";

/** Keep the verified essay verbatim and its calculated support independently accessible. */
export function PatternChapter({
  feature,
  cacheKey,
}: {
  feature: PatternFeature;
  cacheKey: string;
}) {
  const client = useQueryClient();
  const load = useServerFn(fetchFeatureNarrative);
  const query = useQuery({
    queryKey: ["feature-narrative", cacheKey, feature.feature_key],
    queryFn: () => load({ data: { featureKey: feature.feature_key } }),
    staleTime: Infinity,
    retry: false,
  });
  const changedChart = query.data?.available && query.data.cacheKey !== cacheKey;
  const narrative = query.data?.available && !changedChart ? query.data : null;
  const paragraphs = narrative?.paragraphs ?? [];
  const narrativeRef = useReadingArrival(Boolean(narrative));
  const retryable = Boolean(
    query.error || (query.data && !query.data.available && query.data.retryable),
  );

  return (
    <div>
      {query.isPending || (query.isFetching && !narrative) ? (
        <div className="pattern-narrative-loading" aria-busy="true" aria-label="Preparing chapter">
          <p role="status">
            Your chapter is taking shape. The first reading can take up to 90 seconds; it stays
            ready for this chart after that.
          </p>
          <div aria-hidden="true" className="pattern-reading-skeleton">
            {[100, 95, 88, 70].map((width) => (
              <span key={width} style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
      ) : changedChart ? (
        <div className="pattern-narrative-fallback">
          <p role="status">
            Your chart or reading preferences changed. Refresh to see the current chapters.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void client.invalidateQueries({ queryKey: ["pattern"] })}
          >
            <RotateCcw aria-hidden="true" /> Refresh chapters
          </Button>
        </div>
      ) : query.error ? (
        <div className="pattern-narrative-fallback">
          <p role="status">This chapter couldn’t load. Its calculated values are still below.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The request did not complete. You can try again.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RotateCcw aria-hidden="true" />
            {query.isFetching ? "Trying again…" : "Try this chapter again"}
          </Button>
        </div>
      ) : narrative ? (
        <div ref={narrativeRef} className="pattern-narrative prose-reading">
          {paragraphs.map((paragraph, index) => (
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
      ) : (
        <div className="pattern-narrative-fallback">
          <p role="status">
            {retryable
              ? "This chapter couldn’t be prepared just now."
              : "No verified reading is available for this chapter."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.data?.reason ?? "Nothing supportable to say."} The calculated values below are
            still available to explore.
          </p>
          {retryable ? (
            <Button variant="outline" className="mt-4" onClick={() => void query.refetch()}>
              <RotateCcw aria-hidden="true" /> Try this chapter again
            </Button>
          ) : null}
        </div>
      )}

      <PatternChapterEvidence
        feature={feature}
        facts={narrative?.facts ?? []}
        citations={narrative?.citations ?? []}
        evidenceAvailable={narrative?.evidenceAvailable ?? false}
        model={narrative?.model ?? null}
        paragraphCount={paragraphs.length}
      />
      <AttachedJournalContext featureKey={feature.feature_key} />
    </div>
  );
}
