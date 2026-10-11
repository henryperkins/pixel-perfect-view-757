import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchCycles } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/_authenticated/timing")({
  head: () => ({
    meta: [
      { title: "Timing — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Active and upcoming cycles with ingress, exact passes, egress and phase, filterable by domain.",
      },
      { property: "og:title", content: "Timing — Pattern" },
      {
        property: "og:description",
        content: "Every window shows calculation status and last refresh.",
      },
    ],
  }),
  component: TimingPage,
});

const DOMAINS = ["all", "identity", "relationships", "work", "inner-life", "structure"] as const;

const DOMAIN_LABEL: Record<string, string> = {
  all: "every area",
  work: "work and output",
  relationships: "relationships and affection",
  "inner-life": "inner life and rest",
  identity: "identity and direction",
  structure: "structure and commitments",
};

/** Whole days from `day` to the exact pass, preferring the calculated value. */
function daysToExact(
  cycle: { exact_at: string | null; days_to_exact?: number | null },
  day: string,
): number | null {
  if (cycle.days_to_exact !== null && cycle.days_to_exact !== undefined) {
    return cycle.days_to_exact;
  }
  if (!cycle.exact_at) return null;
  const ms = new Date(cycle.exact_at).getTime() - new Date(`${day}T12:00:00Z`).getTime();
  return Number.isFinite(ms) ? Math.round(ms / 86400000) : null;
}

/** Plain-language days-to-exact, e.g. "exact in 4 days". */
function exactPhrase(days: number | null): string {
  if (days === null) return "no exact pass in range";
  if (days === 0) return "exact today";
  if (days === 1) return "exact tomorrow";
  if (days === -1) return "exact yesterday";
  return days > 0 ? `exact in ${days} days` : `exact ${Math.abs(days)} days ago`;
}

/** How far through the ingress -> egress window today sits, as a sentence. */
function arcSentence(cycle: {
  arc_position?: number | null;
  ingress_at: string | null;
  egress_at: string | null;
}): string | null {
  const p = cycle.arc_position;
  if (p === null || p === undefined) return null;
  // Windows shorter than two days (mostly the Moon) have no meaningful middle.
  if (cycle.ingress_at && cycle.egress_at) {
    const span = Date.parse(cycle.egress_at) - Date.parse(cycle.ingress_at);
    if (span < 2 * 86400000) return "A brief window — it passes within a day or so.";
  }
  const pct = Math.round(p * 100);
  if (pct <= 25) return `${pct}% through the window — near the start, still mostly potential.`;
  if (pct <= 60) return `${pct}% through the window — the middle, where it reads most clearly.`;
  return `${pct}% through the window — the back half, winding down.`;
}

const PHASE_LABEL: Record<string, { label: string; help: string }> = {
  approaching: { label: "Building", help: "The aspect is tightening toward its exact pass." },
  applying: { label: "Building", help: "The aspect is tightening toward its exact pass." },
  exact: { label: "Exact", help: "The aspect is at its closest point today." },
  separating: {
    label: "Fading",
    help: "The exact pass has happened; the influence is easing off.",
  },
};

const ASPECT_MEANING: Record<string, string> = {
  conjunction: "merging with",
  opposition: "pulling against",
  square: "pressing on",
  trine: "supporting",
  sextile: "opening",
};

function weightLabel(w: number): string {
  if (w >= 0.7) return "Major";
  if (w >= 0.4) return "Prominent";
  return "Background";
}

const POINT_NAME: Record<string, string> = {
  node: "North Node",
  ascendant: "Ascendant",
  midheaven: "Midheaven",
};
function pointName(k: string): string {
  return POINT_NAME[k] ?? k.charAt(0).toUpperCase() + k.slice(1);
}

/** Phase label derived from days-to-exact so it never contradicts the date line. */
function phaseKey(c: { phase: string }, days: number | null): string {
  if (days === null) return c.phase;
  if (days === 0) return "exact";
  return days > 0 ? "approaching" : "separating";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Proportional timeline bar: ingress → exact → egress, with a today marker. */
function Timeline({
  ingress,
  exact,
  egress,
  today,
}: {
  ingress: string | null;
  exact: string | null;
  egress: string | null;
  today: string;
}) {
  const start = ingress ? Date.parse(ingress) : null;
  const end = egress ? Date.parse(egress) : null;
  if (!ingress || !egress || start === null || end === null || end <= start) {
    return (
      <p className="technical text-xs text-muted-foreground">
        A long, slow window — it runs for months, beyond the dates calculated here.
      </p>
    );
  }
  const span = end - start;
  const pos = (d: string | null) =>
    d ? Math.min(100, Math.max(0, ((Date.parse(d) - start) / span) * 100)) : null;
  const todayPct = pos(today);
  const exactPct = pos(exact);

  return (
    <div className="window-timeline">
      <div className="window-track relative">
        {exactPct !== null ? (
          <div
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-primary"
            style={{ left: `${exactPct}%` }}
            aria-hidden
          />
        ) : null}
        {todayPct !== null ? (
          <div
            className="window-today absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground"
            style={{ left: `${todayPct}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="window-dates mt-2 font-mono text-[0.65rem] text-muted-foreground">
        <span>opens {ingress.slice(0, 10)}</span>
        {exact ? <span>peak {exact.slice(0, 10)}</span> : null}
        <span>closes {egress.slice(0, 10)}</span>
      </div>
    </div>
  );
}

function TimingPage() {
  const load = useServerFn(fetchCycles);
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("all");
  const [slowOnly, setSlowOnly] = useState(false);
  const day = todayISO();

  const query = useQuery({
    queryKey: ["cycles", day],
    queryFn: () => load({ data: { day } }),
  });

  const data = query.data && !query.data.needsOnboarding ? query.data : null;
  const rows = (data?.cycles ?? []).filter((c) => {
    if (domain !== "all" && c.domain !== domain) return false;
    if (slowOnly && ["moon", "sun", "mercury", "venus"].includes(c.transit_body)) return false;
    return true;
  });
  const active = rows.filter((c) => c.phase !== "separating" || (c.exact_at ?? "") >= day);

  return (
    <Shell>
      {query.isPending ? (
        <div className="max-w-xl space-y-4" aria-busy="true">
          <div className="h-9 w-48 animate-pulse rounded-sm bg-secondary" />
          <div className="h-24 animate-pulse rounded-sm border border-rule bg-card" />
          <div className="h-24 animate-pulse rounded-sm border border-rule bg-card" />
        </div>
      ) : query.error ? (
        <div role="alert" className="max-w-xl border border-destructive/40 bg-card p-5">
          <p className="text-sm text-destructive">{query.error.message}</p>
          <Button
            variant="outline"
            type="button"
            onClick={() => query.refetch()}
            className="mt-4 rounded-sm border border-input px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Retry
          </Button>
        </div>
      ) : !data ? (
        <div className="max-w-xl">
          <h1 className="text-3xl">No chart yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Timing is calculated from your birth chart. Enter your birth details first.
          </p>
          <Link to="/onboarding" className="mt-6 inline-flex technical text-primary">
            Enter birth details
          </Link>
        </div>
      ) : (
        <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <h1 className="text-3xl">Timing</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your natal chart is fixed; the planets keep moving. This page shows where today's sky
              forms measurable angles to your birth positions — each one opens on a date, peaks, and
              closes. Think of them as <em>weather windows</em>, not predictions: they describe the
              terrain, never what will happen.
            </p>

            <EphemerisNotice state={data.ephemeris} className="mt-6" />

            {/* ---------- Filters ---------- */}
            <div className="timing-filters mt-6" role="group" aria-label="Filter timing windows">
              <div className="domain-options mt-3">
                {DOMAINS.map((d) => (
                  <Button
                    variant="outline"
                    aria-pressed={domain === d}
                    key={d}
                    type="button"
                    onClick={() => setDomain(d)}
                    className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                      domain === d
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-input bg-card hover:bg-secondary"
                    }`}
                  >
                    {d === "all" ? "Every area" : d.replace("-", " ")}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  aria-pressed={slowOnly}
                  type="button"
                  onClick={() => setSlowOnly((v) => !v)}
                  className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                    slowOnly
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-input bg-card hover:bg-secondary"
                  }`}
                >
                  slow movers only
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                “Slow movers” hides Sun, Moon, Mercury and Venus — leaving only the long structural
                cycles.
              </p>
            </div>
            {/* ---------- Active now ---------- */}
            <section className="mt-10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="technical text-muted-foreground">1 · Active windows</h2>
                <span className="technical text-xs text-muted-foreground">
                  {active.length} of {rows.length} shown
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Sorted by weight. <strong className="font-medium text-foreground">Major</strong>{" "}
                windows involve slow-moving bodies and last months;{" "}
                <strong className="font-medium text-foreground">background</strong> windows are
                brief and subtle.
              </p>

              {active.length === 0 ? (
                <p className="mt-4 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                  Nothing active under the current filters. An empty window is a valid result — no
                  strong transits are being claimed for today.
                </p>
              ) : (
                <ul key={`${domain}-${slowOnly}`} className="timing-results mt-4 space-y-3">
                  {active.map((c) => {
                    const days = daysToExact(c, day);
                    const pk = phaseKey(c, days);
                    const phase = PHASE_LABEL[pk] ?? { label: pk, help: "" };
                    return (
                      <li key={c.cycle_key} className="window-card border border-rule bg-card p-5">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between">
                          <p className="min-w-0 text-base font-medium text-foreground">
                            {pointName(c.transit_body)}{" "}
                            <span className="text-muted-foreground">
                              {ASPECT_MEANING[c.aspect] ?? c.aspect}
                            </span>{" "}
                            your {pointName(c.natal_point)}
                          </p>
                          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row">
                            <span className="rounded-sm border border-input px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                              {c.domain}
                            </span>
                            <span className="rounded-sm bg-accent px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-accent-foreground">
                              {phase.label}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{phase.help}</p>
                        <p className="mt-2 text-xs text-foreground">
                          {exactPhrase(daysToExact(c, day))} · {DOMAIN_LABEL[c.domain] ?? c.domain}
                        </p>
                        {arcSentence(c) ? (
                          <p className="mt-1 text-xs text-muted-foreground">{arcSentence(c)}</p>
                        ) : null}
                        <Timeline
                          ingress={c.ingress_at}
                          exact={c.exact_at}
                          egress={c.egress_at}
                          today={day}
                        />
                        <details className="mt-3">
                          <summary className="cursor-pointer technical text-xs text-muted-foreground">
                            Technical values · {weightLabel(c.importance)} window
                          </summary>
                          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground sm:grid-cols-3">
                            <div>
                              <dt className="inline">cycle key </dt>
                              <dd className="inline">{c.cycle_key}</dd>
                            </div>
                            <div>
                              <dt className="inline">aspect </dt>
                              <dd className="inline">{c.aspect}</dd>
                            </div>
                            <div>
                              <dt className="inline">phase </dt>
                              <dd className="inline">{c.phase}</dd>
                            </div>
                          </dl>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <Rail title="Calculation status">
            <Field label="Reference day" value={data.day} />
            <Field label="Engine" value={data.engine} />
            <Field label="Precision" value={data.ephemeris.precision} />
            <Field label="Contract" value={data.contractVersion} />
            <Field label="Refreshed" value={data.computedAt.slice(11, 19) + "Z"} />
            <Field label="Rows" value={`${rows.length}/${data.cycles.length}`} />
            <Field label="Time accuracy" value={data.uncertainty.accuracy} />
          </Rail>
        </div>
      )}
    </Shell>
  );
}
