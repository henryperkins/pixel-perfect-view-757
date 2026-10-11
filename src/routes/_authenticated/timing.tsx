import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, CircleDot, RotateCcw, Sunrise, Sunset, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchCycles } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";
import { TimingWindow } from "@/components/pattern/TimingWindow";
import {
  PHASE_LABEL,
  timingDate,
  windowPhase,
  type PhaseFilter,
} from "@/components/pattern/timing";

export const Route = createFileRoute("/_authenticated/timing")({
  head: () => ({
    meta: [
      { title: "Timing — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Explore calculated timing windows by area and phase, with dates, strength, and supporting values.",
      },
      { property: "og:title", content: "Timing — Pattern" },
      {
        property: "og:description",
        content:
          "Browse what's building, exact, or easing off in your chart, with the calculations always available.",
      },
    ],
  }),
  component: TimingPage,
});

const DOMAINS = [
  { key: "all", label: "Every area" },
  { key: "identity", label: "Identity" },
  { key: "relationships", label: "Relationships" },
  { key: "work", label: "Work" },
  { key: "inner-life", label: "Inner life" },
  { key: "structure", label: "Structure" },
] as const;
type Domain = (typeof DOMAINS)[number]["key"];
const PHASES = [
  { key: "all", label: "All phases", icon: Waves },
  { key: "building", label: "Building", icon: Sunrise },
  { key: "exact", label: "Exact", icon: CircleDot },
  { key: "fading", label: "Fading", icon: Sunset },
] as const;

function TimingPage() {
  const load = useServerFn(fetchCycles);
  const [domain, setDomain] = useState<Domain>("all");
  const [slowOnly, setSlowOnly] = useState(false);
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [expanded, setExpanded] = useState<{ key: string | null; scope: string } | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [revealTarget, setRevealTarget] = useState<{ key: string; scope: string } | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const day = new Date().toISOString().slice(0, 10);
  const query = useQuery({ queryKey: ["cycles", day], queryFn: () => load({ data: { day } }) });
  const data = query.data && !query.data.needsOnboarding ? query.data : null;
  const referenceDay = data?.day ?? day;
  // computeCycles already returns only windows within their active orb.
  // A past closest pass means "fading", not that the window has ended.
  const areaRows = (data?.cycles ?? []).filter(
    (cycle) =>
      (domain === "all" || cycle.domain === domain) &&
      (!slowOnly || !["moon", "sun", "mercury", "venus"].includes(cycle.transit_body)),
  );
  const rows = areaRows.filter(
    (cycle) => phase === "all" || windowPhase(cycle, referenceDay) === phase,
  );
  const scope = domain + "-" + phase + "-" + slowOnly;
  const openKey = expanded?.scope === scope ? expanded.key : (rows[0]?.cycle_key ?? null);
  const filtered = domain !== "all" || slowOnly || phase !== "all";

  const remember = (key: string) => setVisited((previous) => new Set([...previous, key]));
  const browse = (key: string) => {
    if (openKey) remember(openKey);
    remember(key);
    setExpanded({ key, scope });
    setRevealTarget({ key, scope });
  };
  const toggle = (key: string) => {
    if (openKey) remember(openKey);
    remember(key);
    setExpanded({ key: openKey === key ? null : key, scope });
    setRevealTarget(null);
  };
  const clearFilters = () => {
    setDomain("all");
    setPhase("all");
    setSlowOnly(false);
    setRevealTarget(null);
  };

  useEffect(() => {
    if (!revealTarget || revealTarget.scope !== scope) return;
    let active = true;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById("timing-toggle-" + revealTarget.key);
      if (!target) return;
      target.focus({ preventScroll: true });
      const panels = target.closest(".timing-results")?.querySelectorAll(".timing-window-panel");
      const transitions = Array.from(panels ?? []).flatMap((panel) =>
        panel.getAnimations().map((animation) => animation.finished),
      );
      void Promise.allSettled(transitions).then(() => {
        if (!active || !target.isConnected) return;
        const headerHeight =
          document.querySelector(".pattern-shell > header")?.getBoundingClientRect().height ?? 83;
        const filtersHeight = filtersRef.current?.getBoundingClientRect().height ?? 0;
        window.scrollTo({
          top: Math.max(
            0,
            window.scrollY + target.getBoundingClientRect().top - headerHeight - filtersHeight - 20,
          ),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [revealTarget, scope]);

  return (
    <Shell>
      {query.isPending ? (
        <div className="timing-loading" aria-busy="true" aria-label="Loading timing windows">
          <h1>Timing</h1>
          <p>Finding the windows active in your chart…</p>
          <div className="mt-8 h-48 animate-pulse rounded-md bg-secondary/50" />
        </div>
      ) : query.error ? (
        <div role="alert" className="max-w-xl rounded-md border border-destructive/40 bg-card p-5">
          <h1 className="text-3xl">Timing</h1>
          <p className="mt-3 text-sm text-destructive">{query.error.message}</p>
          <Button variant="outline" type="button" onClick={() => query.refetch()} className="mt-4">
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : !data ? (
        <div className="max-w-xl">
          <h1 className="text-3xl">No chart yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Timing is calculated from your birth chart. Enter your birth details first.
          </p>
          <Button asChild className="mt-6">
            <Link to="/onboarding">Enter birth details</Link>
          </Button>
        </div>
      ) : (
        <div className="timing-page">
          <div className="timing-intro">
            <h1>Timing</h1>
            <p>
              Your chart stays still. The sky keeps moving. Explore the windows active around you.
            </p>
            <EphemerisNotice state={data.ephemeris} className="mt-4" />
          </div>
          <div ref={filtersRef} className="timing-filters timing-explorer-filters">
            <div className="timing-area-options" role="group" aria-label="Area of life">
              {DOMAINS.map(({ key, label }) => (
                <Button
                  key={key}
                  variant="ghost"
                  type="button"
                  aria-pressed={domain === key}
                  onClick={(event) => {
                    setDomain(key);
                    setRevealTarget(null);
                    // Scroll the chip rail only, without jumping the page.
                    const button = event.currentTarget;
                    button.parentElement?.scrollTo({
                      left: button.offsetLeft - 12,
                      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                        ? "instant"
                        : "smooth",
                    });
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="timing-filter-toolbar">
              <div className="timing-phase-options" role="group" aria-label="Window phase">
                {PHASES.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    type="button"
                    aria-pressed={phase === key}
                    onClick={() => {
                      setPhase(key);
                      setRevealTarget(null);
                    }}
                  >
                    <span className="timing-phase-glyph">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
              <div className="timing-filter-actions">
                <Button
                  variant="ghost"
                  type="button"
                  aria-pressed={slowOnly}
                  aria-label="Slow movers only"
                  className="timing-slow-toggle"
                  onClick={() => {
                    setSlowOnly((previous) => !previous);
                    setRevealTarget(null);
                  }}
                >
                  <span className="timing-check" aria-hidden="true">
                    {slowOnly ? <Check /> : null}
                  </span>
                  Slow movers only
                </Button>
                <span className="timing-reset-slot">
                  {filtered ? (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={clearFilters}
                      className="timing-reset"
                    >
                      <RotateCcw aria-hidden="true" />
                      Reset
                    </Button>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
          <section className="timing-window-section" aria-labelledby="timing-windows-title">
            <div className="timing-section-heading">
              <h2 id="timing-windows-title">
                {phase === "all" ? "Your active windows" : PHASE_LABEL[phase].label + " windows"}
              </h2>
              <p role="status" aria-live="polite" aria-atomic="true">
                {rows.length} {rows.length === 1 ? "window" : "windows"} · strongest first
              </p>
            </div>
            {rows.length === 0 ? (
              <div className="timing-empty">
                <Waves aria-hidden="true" />
                <h3>{filtered ? "A little quiet in this view" : "A quieter sky today"}</h3>
                <p>
                  {filtered
                    ? "No active windows match these filters. Explore another area or phase."
                    : "No measurable window against your chart today. An empty result is a valid one."}
                </p>
                {filtered ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <RotateCcw aria-hidden="true" />
                    Show all windows
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul key={scope} className="timing-results timing-window-list">
                {rows.map((cycle, index) => (
                  <li key={cycle.cycle_key}>
                    <TimingWindow
                      cycle={cycle}
                      day={referenceDay}
                      open={openKey === cycle.cycle_key}
                      visited={visited.has(cycle.cycle_key) || openKey === cycle.cycle_key}
                      previous={rows[index - 1]}
                      next={rows[index + 1]}
                      onToggle={() => toggle(cycle.cycle_key)}
                      onBrowse={browse}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="timing-context">
            <details className="timing-guide">
              <summary>How to read these windows</summary>
              <div>
                <p>
                  Your natal chart is fixed; the planets keep moving. These windows show where
                  today's sky forms measurable angles to your birth positions — each one opens,
                  peaks, and closes. Think of them as weather windows: they describe the terrain,
                  never what will happen.
                </p>
                <p>
                  Windows are ordered by calculated strength. Major windows involve slow-moving
                  bodies and can last months; background windows are briefer and subtler. “Slow
                  movers” hides Sun, Moon, Mercury, and Venus.
                </p>
              </div>
            </details>
            <details className="timing-record">
              <summary>
                Calculation record <span>{timingDate(data.day)}</span>
              </summary>
              <div>
                <Rail title="Calculation status">
                  <Field label="Reference day" value={data.day} />
                  <Field label="Engine" value={data.engine} />
                  <Field label="Precision" value={data.ephemeris.precision} />
                  <Field label="Contract" value={data.contractVersion} />
                  <Field label="Refreshed" value={data.computedAt.slice(11, 19) + "Z"} />
                  <Field
                    label="Windows shown"
                    value={String(rows.length) + "/" + data.cycles.length}
                  />
                  <Field label="Time accuracy" value={data.uncertainty.accuracy} />
                  <Link to="/sources" className="inline-flex min-h-11 items-center text-primary">
                    Explore chart sources
                  </Link>
                </Rail>
              </div>
            </details>
          </div>
        </div>
      )}
    </Shell>
  );
}
