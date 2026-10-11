import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchFeatureNarrative } from "@/lib/pattern.functions";
import type { PatternFeature } from "./pattern-view";

/** Keep the verified essay verbatim and its calculated support independently accessible. */
export function PatternChapter({ feature }: { feature: PatternFeature }) {
  const load = useServerFn(fetchFeatureNarrative);
  const query = useQuery({
    queryKey: ["feature-narrative", feature.feature_key],
    queryFn: () => load({ data: { featureKey: feature.feature_key } }),
    staleTime: Infinity,
  });
  const narrative = query.data?.available ? query.data : null;

  return (
    <div>
      {query.isPending ? (
        <div className="pattern-narrative-loading" aria-busy="true" aria-label="Preparing chapter">
          <p role="status">
            Your chapter is taking shape. The first reading can take up to half a minute; it stays
            ready after that.
          </p>
          <div aria-hidden="true" className="pattern-reading-skeleton">
            {[100, 95, 88, 70].map((width) => (
              <span key={width} style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
      ) : query.error ? (
        <div className="pattern-narrative-fallback">
          <p role="status">This chapter couldn’t load. Its calculated values are still below.</p>
          <p className="mt-2 text-sm text-muted-foreground">{query.error.message}</p>
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
        <div className="pattern-narrative prose-reading">
          {narrative.narrative.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <div className="pattern-narrative-fallback">
          <p>No verified reading is available for this chapter.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.data?.reason ?? "Nothing supportable to say."} The calculated values below are
            still available to explore.
          </p>
        </div>
      )}

      <details className="pattern-chapter-evidence">
        <summary>Behind this chapter</summary>
        <div>
          <h4 className="technical text-muted-foreground">Calculated values</h4>
          <pre>{JSON.stringify(feature.payload, null, 2)}</pre>
          {narrative ? (
            <>
              <h4 className="technical mt-5 text-muted-foreground">About the wording</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {narrative.mode === "model"
                  ? `Wording by ${narrative.model} · cites ${narrative.citations
                      .map((citation) => citation.facts.join("+"))
                      .join(" / ")}`
                  : "Template wording"}
              </p>
            </>
          ) : null}
        </div>
      </details>
    </div>
  );
}
