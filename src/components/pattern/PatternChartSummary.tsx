import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PatternData } from "./pattern-view";

const TIME_ACCURACY: Record<PatternData["uncertainty"]["accuracy"], string> = {
  exact: "Recorded to the minute",
  near: "Within about 15 minutes",
  hour: "Within about an hour",
  unknown: "Unknown · noon assumed",
};

/** Always describe the snapshot behind the chapters, rather than a newer birth record. */
export function PatternChartSummary({ data }: { data: PatternData }) {
  const highPrecision = data.ephemeris.precision === "high" && !data.ephemeris.degraded;
  const fields = [
    { label: "Engine", value: data.engine },
    {
      label: "Position precision",
      value: highPrecision
        ? "High precision"
        : data.ephemeris.degraded
          ? "Approximate · fallback"
          : "Approximate",
    },
    { label: "House system", value: data.houseSystem },
    { label: "Birth-time accuracy", value: TIME_ACCURACY[data.uncertainty.accuracy] },
  ];
  const limits =
    !data.uncertainty.housesReliable && data.uncertainty.angleClaimsSuppressed
      ? "House and angle claims are suppressed for this birth-time estimate."
      : !data.uncertainty.housesReliable
        ? "House claims and the rising lens are suppressed for this birth-time estimate."
        : data.uncertainty.angleClaimsSuppressed
          ? "Angle claims are suppressed for this birth-time estimate."
          : !data.rising
            ? "Rising details are unavailable for this chart snapshot."
            : null;

  return (
    <section
      className="pattern-chart-summary mt-6 border-y border-rule py-5"
      aria-labelledby="pattern-chart-summary-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
        <h2 id="pattern-chart-summary-heading" className="text-lg text-primary sm:text-xl">
          Chart summary
        </h2>
        <Button asChild variant="link" className="min-h-11 px-0">
          <Link to="/birth">
            Edit birth details <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="technical text-muted-foreground">{label}</dt>
            <dd className="mt-2 font-mono text-xs leading-relaxed text-foreground [overflow-wrap:anywhere]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {limits ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{limits}</p>
      ) : null}
      {!data.snapshot.birth ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Birth record unavailable. This summary describes the stored chart snapshot.
        </p>
      ) : null}
    </section>
  );
}
