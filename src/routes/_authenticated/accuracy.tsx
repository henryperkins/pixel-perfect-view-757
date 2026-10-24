import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";

import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { fetchPattern } from "@/lib/pattern.functions";
import { userFacingError } from "@/lib/user-facing-error";

export const Route = createFileRoute("/_authenticated/accuracy")({
  head: () => ({
    meta: [
      { title: "Chart accuracy — Pattern" },
      {
        name: "description",
        content: "See the exact birth time, timezone and coordinates your chart is calculated from.",
      },
      { property: "og:title", content: "Chart accuracy — Pattern" },
      {
        property: "og:description",
        content: "See the exact birth time, timezone and coordinates your chart is calculated from.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccuracyPage,
});

function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(d)} (UTC)`;
}

const ACCURACY_LABEL: Record<string, string> = {
  exact: "recorded to the minute",
  minute: "recorded to the minute",
  hour: "known within about an hour",
  half_day: "known within half a day",
  unknown: "unknown",
};

function AccuracyPage() {
  const load = useServerFn(fetchPattern);
  const q = useQuery({ queryKey: ["pattern"], queryFn: () => load({}) });

  if (q.isPending) {
    return (
      <Shell>
        <div aria-busy="true" className="space-y-3">
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <div className="h-64 animate-pulse bg-muted" />
        </div>
      </Shell>
    );
  }
  if (q.error) {
    return (
      <Shell>
        <div role="alert" className="max-w-xl border border-destructive p-4">
          <h1 className="text-2xl sm:text-3xl">Chart accuracy</h1>
          <p className="mt-3 text-sm text-destructive">
            {userFacingError(q.error, "Your chart couldn’t load. You can try again.")}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
            className="mt-4"
          >
            <RotateCcw aria-hidden="true" />
            {q.isFetching ? "Trying again…" : "Try again"}
          </Button>
        </div>
      </Shell>
    );
  }
  if (!q.data || q.data.needsOnboarding) {
    return (
      <Shell>
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl">No chart yet</h1>
          <Link to="/onboarding" className="technical mt-6 inline-flex min-h-11 items-center text-primary">
            Enter birth details
          </Link>
        </div>
      </Shell>
    );
  }

  const data = q.data;
  const birth = data.snapshot.birth;
  const sources = data.sources;
  const uncertainty = data.uncertainty;
  const engineIsSwiss = data.engine.startsWith("swiss-ephemeris");

  return (
    <Shell>
      <div className="animate-rise max-w-2xl">
        <h1 className="text-2xl sm:text-3xl">Chart accuracy</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Everything Pattern calculates — placements, houses, timing windows and relocation
          lines — starts from these birth details. This is exactly what the chart uses.
        </p>

        <dl className="mt-8 divide-y divide-rule border border-rule">
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Birth date</dt>
            <dd>{birth?.birthDate ?? "—"}</dd>
          </div>
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Birth time</dt>
            <dd>
              {birth?.birthTime ?? "Not recorded"}{" "}
              <span className="text-muted-foreground">
                ({ACCURACY_LABEL[uncertainty.accuracy] ?? uncertainty.accuracy}
                {uncertainty.minutes > 0 ? `, ±${uncertainty.minutes} min` : ""})
              </span>
            </dd>
          </div>
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Timezone</dt>
            <dd>{birth?.timezone ?? "—"}</dd>
          </div>
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Place</dt>
            <dd>{birth?.placeLabel ?? "—"}</dd>
          </div>
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Coordinates</dt>
            <dd>
              {sources
                ? `${Math.abs(sources.latitude).toFixed(4)}°${sources.latitude >= 0 ? "N" : "S"}, ${Math.abs(sources.longitude).toFixed(4)}°${sources.longitude >= 0 ? "E" : "W"}`
                : "—"}
            </dd>
          </div>
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="technical text-muted-foreground">Birth moment (UTC)</dt>
            <dd>{sources ? formatUtc(sources.utcISO) : "—"}</dd>
          </div>
        </dl>

        <section aria-labelledby="accuracy-calc" className="mt-6 border border-rule p-4 sm:p-5">
          <h2 id="accuracy-calc" className="text-xl">How it’s calculated</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Positions:</span>{" "}
              {engineIsSwiss ? "Swiss Ephemeris service" : "in-app approximation"}
              {sources ? ` (${sources.positions === "service" ? "service" : "in-app"})` : ""} ·{" "}
              {data.houseSystem} houses · engine {data.engine}
            </li>
            <li>
              <span className="font-medium text-foreground">Angles and houses:</span>{" "}
              {uncertainty.angleClaimsSuppressed
                ? "suppressed — the saved birth time is too uncertain to place them honestly."
                : uncertainty.housesReliable
                  ? "supported at this time accuracy."
                  : "angles available; house placements are suppressed at this time accuracy."}
            </li>
            <li>
              <span className="font-medium text-foreground">Sensitivity:</span> four minutes of
              birth time moves the rising sign and relocation lines by about one degree of
              longitude.
            </li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/birth">Update birth details</Link>
          </Button>
          <Link to="/sources" className="technical inline-flex min-h-11 items-center text-primary">
            Where each value comes from
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Correcting a detail recalculates your chart; existing readings keep the evidence they
          were written from.
        </p>
      </div>
    </Shell>
  );
}
