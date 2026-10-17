import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { fetchUpcomingCycles, fetchSkyEvents } from "@/lib/pattern.functions";
import { LIFE_DOMAINS, type LifeDomain } from "@/lib/context-policy";
import { useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { CYCLE_QUERY_RETENTION, DOMAIN_LABEL, pointName } from "./timing";
import type { UpcomingWindow, DurationFilter } from "@/lib/astro/upcoming.server";
const EVENT_LABEL: Record<string, string> = {
  "new-moon": "New Moon",
  "full-moon": "Full Moon",
  "solar-total": "Total solar eclipse",
  "solar-annular": "Annular solar eclipse",
  "solar-hybrid": "Hybrid solar eclipse",
  "solar-partial": "Partial solar eclipse",
  "lunar-total": "Total lunar eclipse",
  "lunar-partial": "Partial lunar eclipse",
  "lunar-penumbral": "Penumbral lunar eclipse",
};
export function TimingCalendar({
  children,
  ownerId,
  defaultDomain,
}: {
  children: ReactNode;
  ownerId: string;
  defaultDomain: LifeDomain | "all";
}) {
  const [view, setView] = useState<"active" | "upcoming" | "sky">("active"),
    [visited, setVisited] = useState<string[]>(["active"]);
  const [horizon, setHorizon] = useState<90 | 365>(90),
    [chosenDomain, setDomain] = useState<LifeDomain | "all" | null>(null),
    [duration, setDuration] = useState<DurationFilter>("all"),
    [eventKind, setEventKind] = useState("all");
  const domain = chosenDomain ?? defaultDomain,
    calendar = useCalendarRefresh(),
    futureFn = useServerFn(fetchUpcomingCycles),
    skyFn = useServerFn(fetchSkyEvents);
  const future = useQuery({
    queryKey: [
      "upcoming-cycles",
      ownerId,
      calendar.rolloverKey,
      calendar.timezone,
      horizon,
      domain,
      duration,
    ],
    queryFn: () =>
      futureFn({ data: { timezone: calendar.timezone, horizonDays: horizon, domain, duration } }),
    enabled: visited.includes("upcoming"),
    ...CYCLE_QUERY_RETENTION,
  });
  const sky = useQuery({
    queryKey: ["sky-events", ownerId, calendar.rolloverKey, calendar.timezone, horizon],
    queryFn: () => skyFn({ data: { timezone: calendar.timezone, horizonDays: horizon } }),
    enabled: visited.includes("sky"),
    ...CYCLE_QUERY_RETENTION,
  });
  const data = future.data && !future.data.needsOnboarding ? future.data : null;
  const calculation = data?.calculation,
    rows =
      calculation?.status === "available"
        ? calculation.windows.filter((w) => w.phase === "upcoming")
        : [],
    uncertain =
      calculation?.status === "available"
        ? calculation.windows.filter((w) => w.phase === "uncertain")
        : [];
  const stamp = (at: string, zone: string) =>
    new Intl.DateTimeFormat("en", {
      timeZone: zone,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(at));
  const controls = (
    <div className="my-5 flex flex-wrap gap-4">
      <label className="grid gap-1 text-sm">
        Future horizon
        <select
          className="pattern-mobile-field min-h-11 rounded border border-input bg-background px-3"
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value) as 90 | 365)}
        >
          <option value={90}>Next 90 days</option>
          <option value={365}>Next 365 days</option>
        </select>
      </label>
    </div>
  );
  const show = (next: typeof view) => {
    setView(next);
    setVisited((old) => (old.includes(next) ? old : [...old, next]));
  };
  const window = (w: UpcomingWindow) => (
    <li key={w.id} className="border-b border-rule py-4">
      <details>
        <summary className="cursor-pointer py-2 font-serif text-xl">
          {pointName(w.transitBody)} {w.aspect} natal {pointName(w.natalPoint)}
        </summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Starts</dt>
            <dd>{bound(w.start, w.startRange)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ends</dt>
            <dd>{bound(w.end, w.endRange)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Exact passes</dt>
            <dd>
              {w.exactAt.map((at, i) => (
                <p key={at}>{bound(at, w.exactRanges[i]!)}</p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duration</dt>
            <dd>
              {w.durationDays === null
                ? "Unknown"
                : w.durationDays.toFixed(1) + " days (" + w.duration + ")"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Calculation</dt>
            <dd>
              {w.complete ? "Bounds calculated" : "Incomplete bounds"} ·{" "}
              {w.confidence === "range"
                ? "birth-time range"
                : w.confidence === "exact"
                  ? "sampled times agree within one minute"
                  : "timing varies"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Swiss Ephemeris · native relative geometry · {data?.timezone}. These are calculated
          contacts; they do not predict events in your life.
        </p>
      </details>
    </li>
  );
  function bound(at: string | null, range: [string, string] | null) {
    if (!at) return "Outside the calculated scan";
    if (range && Date.parse(range[1]) - Date.parse(range[0]) > 60000)
      return (
        stamp(range[0], data?.timezone ?? "UTC") + " – " + stamp(range[1], data?.timezone ?? "UTC")
      );
    return stamp(at, data?.timezone ?? "UTC");
  }
  return (
    <>
      <nav className="my-6 flex flex-wrap gap-2" aria-label="Timing views">
        {(
          [
            ["active", "Active"],
            ["upcoming", "Upcoming"],
            ["sky", "Moon & eclipses"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            variant={view === key ? "default" : "outline"}
            aria-pressed={view === key}
            onClick={() => show(key)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div hidden={view !== "active"}>{children}</div>
      <section hidden={view !== "upcoming"} aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="font-serif text-2xl">
          Upcoming windows
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A native scan includes windows outside today’s orb. Starts and exact dates can vary with
          your birth-time range.
        </p>
        {controls}
        <div className="mb-5 flex flex-wrap gap-4">
          <label className="grid gap-1 text-sm">
            Upcoming area
            <select
              className="pattern-mobile-field min-h-11 rounded border border-input bg-background px-3"
              value={domain}
              onChange={(e) => setDomain(e.target.value as typeof domain)}
            >
              <option value="all">Every area</option>
              {LIFE_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Window duration
            <select
              className="pattern-mobile-field min-h-11 rounded border border-input bg-background px-3"
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationFilter)}
            >
              <option value="all">All durations</option>
              <option value="short">Short · under 7 days</option>
              <option value="medium">Medium · 7–30 days</option>
              <option value="long">Long · over 30 days</option>
              <option value="unknown">Unknown duration</option>
            </select>
          </label>
          <Button
            className="self-end"
            variant="outline"
            onClick={() => {
              setDomain("all");
              setDuration("all");
            }}
          >
            Clear future filters
          </Button>
        </div>
        {future.isPending ? (
          <p role="status">Calculating future windows…</p>
        ) : future.isError ? (
          <p role="alert">
            Future timing could not load.{" "}
            <Button variant="outline" onClick={() => future.refetch()}>
              Retry calculation
            </Button>
          </p>
        ) : calculation?.status === "unavailable" ? (
          <p role="status">
            Future timing is unavailable
            {calculation.reason === "unknown_time"
              ? " with an unknown birth time"
              : ". The qualified calculation service or natal anchors are unavailable"}
            . Your active view remains available.
          </p>
        ) : calculation?.status === "available" ? (
          <>
            {calculation.calculationStatus === "partial" ? (
              <p role="status" className="mb-4 text-sm">
                Coverage is partial.
                {calculation.truncated
                  ? " The list is capped; narrow the area or duration to see more matching windows."
                  : ""}
                {calculation.incompleteWindows
                  ? " Some window bounds or sample matches are incomplete."
                  : ""}
                {calculation.missingTargets.length
                  ? " Calculation is unavailable for " +
                    calculation.missingTargets.map(pointName).join(", ") +
                    "."
                  : ""}
              </p>
            ) : null}
            {rows.length ? (
              <ul aria-label="Upcoming calculated windows">{rows.map(window)}</ul>
            ) : (
              <p>No certain future starts match these filters in the calculated range.</p>
            )}
            {uncertain.length ? (
              <section className="mt-6">
                <h3 className="font-serif text-xl">Timing varies</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  These windows cannot be placed wholly in Active or Upcoming from the sampled birth
                  times and available bounds.
                </p>
                <ul>{uncertain.map(window)}</ul>
              </section>
            ) : null}
            <p className="mt-5 text-xs text-muted-foreground">
              Range: {stamp(calculation.from, data!.timezone)} –{" "}
              {stamp(calculation.to, data!.timezone)} · {data!.timezone}.{" "}
              {calculation.windows.length} retained of {calculation.totalMatched} matched windows,
              including active windows. Refreshed {stamp(data!.computedAt, data!.timezone)}.
            </p>
          </>
        ) : null}
      </section>
      <section hidden={view !== "sky"} aria-labelledby="sky-title">
        <h2 id="sky-title" className="font-serif text-2xl">
          Moon &amp; eclipses
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Global phase and eclipse timing from Swiss Ephemeris. Visibility at your location is not
          calculated.
        </p>
        {controls}
        <label className="mb-5 grid max-w-sm gap-1 text-sm">
          Sky event type
          <select
            className="pattern-mobile-field min-h-11 rounded border border-input bg-background px-3"
            value={eventKind}
            onChange={(e) => setEventKind(e.target.value)}
          >
            <option value="all">All sky events</option>
            <option value="moon">New &amp; full Moons</option>
            <option value="solar">Solar eclipses</option>
            <option value="lunar">Lunar eclipses</option>
          </select>
        </label>
        {sky.isPending ? (
          <p role="status">Calculating sky events…</p>
        ) : sky.isError ? (
          <p role="alert">
            Sky events could not load.{" "}
            <Button variant="outline" onClick={() => sky.refetch()}>
              Retry calculation
            </Button>
          </p>
        ) : sky.data?.calculation.status === "unavailable" ? (
          <p role="status">Sky event timing is unavailable from the qualified service.</p>
        ) : sky.data?.calculation.status === "available" ? (
          <>
            <ul>
              {sky.data.calculation.value
                .filter(
                  (e) =>
                    eventKind === "all" ||
                    (eventKind === "moon" && ["new-moon", "full-moon"].includes(e.kind)) ||
                    e.kind.startsWith(eventKind + "-"),
                )
                .map((e) => (
                  <li key={e.id} className="border-b border-rule py-4">
                    <details>
                      <summary className="cursor-pointer py-2">
                        <span className="font-serif text-xl">{EVENT_LABEL[e.kind]}</span>
                        <span className="ml-3 text-sm">{stamp(e.at, sky.data!.timezone)}</span>
                      </summary>
                      <p className="mt-3 text-sm">
                        Sun {e.sunLongitude.toFixed(3)}° · Moon {e.moonLongitude.toFixed(3)}°
                        tropical longitude.{" "}
                        {e.nativeClassification === null
                          ? "Native phase geometry."
                          : "Native eclipse classification."}{" "}
                        Timing rounded to the nearest second, with a 60-second comparison tolerance.
                      </p>
                    </details>
                  </li>
                ))}
            </ul>
            {!sky.data.calculation.value.some(
              (e) =>
                eventKind === "all" ||
                (eventKind === "moon" && ["new-moon", "full-moon"].includes(e.kind)) ||
                e.kind.startsWith(eventKind + "-"),
            ) ? (
              <p>No events of this type in the calculated range.</p>
            ) : null}
            <p className="mt-5 text-xs text-muted-foreground">
              Swiss Ephemeris · {sky.data.timezone} · refreshed{" "}
              {stamp(sky.data.computedAt, sky.data.timezone)}. Global events remain separate from
              personal transit windows.
            </p>
          </>
        ) : null}
      </section>
    </>
  );
}
