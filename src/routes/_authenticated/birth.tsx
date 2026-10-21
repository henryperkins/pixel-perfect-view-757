import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { clearPatternQueries, clearReadingContextQueries } from "@/lib/pattern-query-cache";
import { Button } from "@/components/ui/button";
import type { BirthChangeSummary } from "@/lib/pattern.server";
import { Shell } from "@/components/pattern/Shell";
import { BirthDetailsForm } from "@/components/pattern/BirthDetailsForm";
import { fetchBirthRecord } from "@/lib/pattern.functions";
import { userFacingError } from "@/lib/user-facing-error";

export const Route = createFileRoute("/_authenticated/birth")({
  head: () => ({
    meta: [
      { title: "Birth record — Pattern" },
      {
        name: "description",
        content:
          "Review and correct the date, time and place your chart is calculated from. Stored encrypted.",
      },
      { property: "og:title", content: "Birth record — Pattern" },
      {
        property: "og:description",
        content:
          "Correcting a birth detail recalculates your chart. Existing readings keep their original evidence.",
      },
    ],
  }),
  component: BirthPage,
});

function BirthSaveFeedback({ summary }: { summary: BirthChangeSummary }) {
  const labels = {
    date: "date",
    time: "time",
    accuracy: "time accuracy",
    place: "place or timezone",
  };
  const changed = summary.changedFields.map((field) => labels[field]).join(", ");
  const source = summary.current.engine.startsWith("swiss-ephemeris")
    ? "Swiss Ephemeris"
    : "Approximate fallback";
  const support =
    summary.current.housesSupported && summary.current.anglesSupported
      ? "Your birth time supports house and angle descriptions."
      : !summary.current.housesSupported && !summary.current.anglesSupported
        ? "House and angle descriptions are suppressed for an unknown birth time."
        : "House descriptions are suppressed at this time accuracy; angle descriptions remain available.";
  return (
    <section
      role="status"
      aria-live="polite"
      className="mt-6 border-l-2 border-primary bg-evidence p-4 text-sm text-evidence-foreground"
    >
      <h2 className="font-medium">
        {summary.previous === null
          ? "Birth chart saved"
          : summary.unchanged
            ? "Birth details are unchanged"
            : "Birth details updated"}
      </h2>
      {!summary.unchanged ? (
        <p className="mt-2">
          {summary.previous === null ? "Recorded" : "Changed"}: {changed}.
        </p>
      ) : null}
      <p className="mt-2">
        {source} ·{" "}
        {summary.current.precision === "high"
          ? "high-precision positions"
          : "approximate positions"}{" "}
        ·{" "}
        {summary.current.houseSystem === "Placidus" ||
        summary.current.houseSystem.toLowerCase() === "placidus"
          ? "Placidus"
          : summary.current.houseSystem}{" "}
        houses.
      </p>
      <p className="mt-2">{support}</p>
      {summary.previous && summary.previous.precision !== summary.current.precision ? (
        <p className="mt-2">
          Position precision changed from{" "}
          {summary.previous.precision === "high" ? "high" : "approximate"} to{" "}
          {summary.current.precision === "high" ? "high" : "approximate"}.
        </p>
      ) : null}
    </section>
  );
}

function BirthPage() {
  const load = useServerFn(fetchBirthRecord);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["birth-record"], queryFn: () => load({}) });
  const record = query.data ?? null;
  const [changeSummary, setChangeSummary] = useState<BirthChangeSummary | null>(null);
  async function saved(summary: BirthChangeSummary) {
    setChangeSummary(summary);
    await clearPatternQueries(qc);
    await clearReadingContextQueries(qc);
    for (const key of ["birth-record", "today", "cycles", "bootstrap"])
      void qc.invalidateQueries({ queryKey: [key] });
  }
  return (
    <Shell>
      <div className="max-w-2xl animate-rise">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">Birth record</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review and correct the details your chart is calculated from. Saved details are
            encrypted in your account.
          </p>
          {record ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Last saved {new Date(record.updated_at).toLocaleString()}.
            </p>
          ) : null}
          {query.isPending ? (
            <p role="status" className="mt-8">
              Loading your saved birth details…
            </p>
          ) : query.error ? (
            <div className="mt-8 border-l-2 border-destructive bg-card p-4">
              <p role="alert" className="text-sm text-destructive">
                {userFacingError(
                  query.error,
                  "Your saved birth details couldn’t load. You can try again.",
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => void query.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              {changeSummary && <BirthSaveFeedback summary={changeSummary} />}
              {!record && (
                <p className="mt-6 border-l-2 border-primary bg-evidence px-3 py-2 text-sm text-evidence-foreground">
                  You have no birth record yet. Fill this in and your chart will be calculated for
                  the first time.
                </p>
              )}
              <BirthDetailsForm
                record={record}
                correction
                onSaved={(summary) => {
                  void saved(summary);
                }}
                onConfirmed={() => {
                  setChangeSummary(null);
                  void clearPatternQueries(qc);
                  void clearReadingContextQueries(qc);
                  for (const key of ["birth-record", "today", "cycles", "bootstrap"])
                    void qc.invalidateQueries({ queryKey: [key] });
                }}
              />
              <Link
                to="/pattern"
                className="technical mt-4 inline-flex min-h-11 items-center text-primary"
              >
                View your chart
              </Link>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
