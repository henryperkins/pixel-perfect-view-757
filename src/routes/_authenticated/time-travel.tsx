import { CYCLE_QUERY_RETENTION } from "@/components/pattern/timing";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, NotebookPen, RotateCcw, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchCycles, fetchJournal } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";
import { TimingWindow } from "@/components/pattern/TimingWindow";
import { DOMAIN_LABEL, pointName, timingDate } from "@/components/pattern/timing";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarQueryRefresh, useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { userFacingError } from "@/lib/user-facing-error";
import { plainEngineLabel, plainPrecision } from "@/lib/plain-engine";
import {
  dayRelation,
  isTravelDate,
  shiftTravelDate,
  travelDate,
  travelWeekday,
  type TravelStep,
} from "@/components/pattern/time-travel";

export const Route = createFileRoute("/_authenticated/time-travel")({
  head: () => ({
    meta: [
      { title: "Time travel — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Explore calculated timing windows on another day, compare the aspects with today, and revisit your saved journal context.",
      },
      { property: "og:title", content: "Time travel — Pattern" },
      {
        property: "og:description",
        content:
          "Move through days, weeks, months, and years. Reconstructed skies and your saved journal records stay clearly identified.",
      },
    ],
  }),
  component: TimeTravelPage,
});

const STEPS = ["day", "week", "month", "year"] as const;
const JUMPS = [
  { label: "A week ago", step: "week" },
  { label: "A month ago", step: "month" },
  { label: "A year ago", step: "year" },
] as const;
function TimeTravelPage() {
  const { session } = useAuth();
  const calendar = useCalendarRefresh();
  const timezone = calendar.timezone;
  const load = useServerFn(fetchCycles);
  const journalFn = useServerFn(fetchJournal);
  // Until the reader chooses a day, use the server's consented calendar.
  const [selectedDate, setDate] = useState<string | null>(null);
  const [selectedApplied, setApplied] = useState<string | null>(null);
  const [step, setStep] = useState<TravelStep>("day");
  const [expanded, setExpanded] = useState<{ day: string; key: string | null } | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [revealTarget, setRevealTarget] = useState<{ day: string; key: string } | null>(null);

  const now = useQuery({
    queryKey: ["cycles", session?.userId, "current"],
    queryFn: () => load({ data: { timezone } }),
    enabled: Boolean(session),
    ...CYCLE_QUERY_RETENTION,
  });
  useCalendarQueryRefresh(calendar, ["cycles", session?.userId, "current"]);
  const nowData = now.data && !now.data.needsOnboarding ? now.data : null;
  const today = nowData?.day ?? "";
  const date = selectedDate ?? today;
  const applied = selectedApplied ?? today;
  const selected = useQuery({
    queryKey: ["cycles", session?.userId, "selected", applied, timezone],
    queryFn: () => load({ data: { day: applied, timezone } }),
    enabled: Boolean(session && applied && applied !== today),
    ...CYCLE_QUERY_RETENTION,
  });
  const past = !applied || applied === today ? now : selected;
  const journal = useQuery({
    queryKey: ["journal", session?.userId],
    queryFn: () => journalFn({}),
    enabled: Boolean(session),
  });
  const pastData = past.data && !past.data.needsOnboarding ? past.data : null;
  const rows = pastData?.cycles ?? [];
  const nowKeys = new Set((nowData?.cycles ?? []).map((cycle) => cycle.cycle_key));
  const canCompare = nowData !== null && !now.isError;
  const shared = rows.filter((cycle) => nowKeys.has(cycle.cycle_key)).length;
  const openKey = expanded?.day === applied ? expanded.key : (rows[0]?.cycle_key ?? null);
  const savedCheckIn = journal.data?.checkIns.find((entry) => entry.day === applied) ?? null;
  const savedEvents = journal.data?.events.filter((entry) => entry.occurred_on === applied) ?? [];
  const recentJournalLimit =
    (journal.data?.checkIns.length ?? 0) >= 60 || (journal.data?.events.length ?? 0) >= 60;
  const previousDay = shiftTravelDate(applied, -1, step);
  const nextDay = shiftTravelDate(applied, 1, step);

  const visit = (day: string | null) => {
    if (!day || !isTravelDate(day)) return;
    setDate(day);
    setApplied(day);
    setRevealTarget(null);
  };
  const remember = (key: string) =>
    setVisited((previous) => new Set([...previous, applied + "/" + key]));
  const toggle = (key: string) => {
    if (openKey) remember(openKey);
    remember(key);
    setExpanded({ day: applied, key: openKey === key ? null : key });
    setRevealTarget(null);
  };
  const browse = (key: string) => {
    if (openKey) remember(openKey);
    remember(key);
    setExpanded({ day: applied, key });
    setRevealTarget({ day: applied, key });
  };

  useEffect(() => {
    if (!revealTarget || revealTarget.day !== applied) return;
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
        const header =
          document.querySelector(".pattern-shell > header")?.getBoundingClientRect().height ?? 83;
        window.scrollTo({
          top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - header - 20),
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
  }, [revealTarget, applied]);

  return (
    <Shell>
      <div className="travel-page">
        <div className="travel-intro">
          <h1>Time travel</h1>
          <p>Explore another day’s sky and revisit what you saved.</p>
        </div>

        {applied ? (
          <section className="travel-navigator" aria-labelledby="travel-date-title">
            <h2 id="travel-date-title" className="sr-only">
              Choose a day
            </h2>
            <div className="travel-date-heading">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="travel-direction"
                disabled={!previousDay}
                aria-label={"Previous " + step}
                onClick={() => visit(previousDay)}
              >
                <span className="travel-direction-icon">
                  <ArrowLeft aria-hidden="true" />
                </span>
              </Button>
              <div
                key={applied}
                className="travel-date-display travel-arrival"
                aria-live="polite"
                aria-atomic="true"
              >
                <time dateTime={applied}>{travelDate(applied)}</time>
                <p>
                  {travelWeekday(applied)} <span aria-hidden="true">·</span>{" "}
                  {today ? dayRelation(applied, today) : "Comparing with today…"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="travel-direction"
                disabled={!nextDay}
                aria-label={"Next " + step}
                onClick={() => visit(nextDay)}
              >
                <span className="travel-direction-icon">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Button>
            </div>
            <div className="travel-step-options" role="group" aria-label="Move through time by">
              {STEPS.map((unit) => (
                <Button
                  key={unit}
                  type="button"
                  variant="ghost"
                  aria-pressed={step === unit}
                  onClick={() => setStep(unit)}
                >
                  {pointName(unit)}
                </Button>
              ))}
            </div>
            <div className="travel-date-tools">
              <div className="travel-jumps" role="group" aria-label="Jump to a day">
                {JUMPS.map((jump) => {
                  const target = shiftTravelDate(today, -1, jump.step);
                  return (
                    <Button
                      key={jump.step}
                      type="button"
                      variant="ghost"
                      aria-pressed={applied === target}
                      disabled={!target}
                      onClick={() => visit(target)}
                    >
                      {jump.label}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={applied === today}
                  disabled={!today}
                  onClick={() => visit(today)}
                >
                  Today
                </Button>
              </div>
              <form
                className="travel-date-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  visit(date);
                }}
              >
                <label htmlFor="travel-date">
                  <CalendarDays aria-hidden="true" />
                  Choose a date
                </label>
                <div>
                  <input
                    id="travel-date"
                    type="date"
                    min="0001-01-01"
                    max="9999-12-31"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    aria-describedby={
                      date !== applied && !isTravelDate(date) ? "travel-date-error" : undefined
                    }
                    aria-invalid={date !== applied && !isTravelDate(date)}
                  />
                  <Button type="submit" disabled={!isTravelDate(date) || date === applied}>
                    Show day <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
                {date !== applied && !isTravelDate(date) ? (
                  <p id="travel-date-error">Choose a valid date between year 1 and 9999.</p>
                ) : null}
              </form>
            </div>
          </section>
        ) : null}

        {past.isPending ? (
          <div
            className="travel-loading"
            role="status"
            aria-busy="true"
            aria-label="Reconstructing the selected day"
          >
            <Waves aria-hidden="true" />
            <p>
              {applied
                ? "Reconstructing the sky for " + travelDate(applied) + "…"
                : "Finding today’s sky…"}
            </p>
          </div>
        ) : past.error ? (
          <div className="travel-error" role="alert">
            <h2>This day couldn’t be reconstructed</h2>
            <p>
              {userFacingError(past.error, "We couldn’t complete the request. You can try again.")}
            </p>
            <Button type="button" variant="outline" onClick={() => past.refetch()}>
              <RotateCcw aria-hidden="true" />
              Retry reconstruction
            </Button>
          </div>
        ) : !pastData ? (
          <div className="travel-empty">
            <h2>No chart yet</h2>
            <p>Enter your birth details to explore timing on another day.</p>
            <Button asChild>
              <Link to="/onboarding">Enter birth details</Link>
            </Button>
          </div>
        ) : (
          <div key={pastData.day} className="travel-arrival">
            {pastData.ephemeris.degraded ? (
              <EphemerisNotice state={pastData.ephemeris} className="travel-ephemeris" />
            ) : null}
            <p className="mb-4 text-sm text-muted-foreground">
              Calculated for this day, not a saved reading or a record of what happened.
            </p>
            <section className="travel-windows" aria-labelledby="travel-windows-title">
              <div className="timing-section-heading">
                <h2 id="travel-windows-title">Windows on this day</h2>
                <p role="status" aria-live="polite">
                  {rows.length} {rows.length === 1 ? "window" : "windows"} · strongest first
                </p>
              </div>
              <div className="travel-comparison">
                {applied === today ? (
                  <p>You’re exploring today’s calculated sky.</p>
                ) : now.isPending ? (
                  <p role="status">Comparing aspects with today…</p>
                ) : now.error ? (
                  <div role="status">
                    <p>Today’s comparison couldn’t load. The selected day is still available.</p>
                    <Button type="button" variant="ghost" onClick={() => now.refetch()}>
                      <RotateCcw aria-hidden="true" />
                      Retry comparison
                    </Button>
                  </div>
                ) : canCompare ? (
                  <p>
                    <strong>
                      {shared} of {rows.length}
                    </strong>{" "}
                    contacts also active today · {timingDate(today)}
                  </p>
                ) : (
                  <p>Today’s chart is unavailable for comparison.</p>
                )}
              </div>
              {rows.length ? (
                <ul className="timing-results timing-window-list">
                  {rows.map((cycle, index) => (
                    <li key={cycle.cycle_key}>
                      <TimingWindow
                        calculation={pastData.storyCalculation}
                        cycle={cycle}
                        day={pastData.day}
                        timezone={pastData.timezone}
                        referenceAt={pastData.referenceAt}
                        open={openKey === cycle.cycle_key}
                        visited={
                          visited.has(applied + "/" + cycle.cycle_key) ||
                          openKey === cycle.cycle_key
                        }
                        previous={rows[index - 1]}
                        next={rows[index + 1]}
                        onToggle={() => toggle(cycle.cycle_key)}
                        onBrowse={browse}
                        referenceLabel={applied === today ? "Today" : "Selected day"}
                        comparisonLabel={
                          applied !== today && canCompare
                            ? nowKeys.has(cycle.cycle_key)
                              ? "Same aspect active today"
                              : "Aspect not active today"
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="travel-empty">
                  <Waves aria-hidden="true" />
                  <h3>A quieter sky on this day</h3>
                  <p>
                    No measurable windows against your chart on {travelDate(applied)}. Try another
                    day.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        <section className="travel-saved" aria-labelledby="travel-saved-title">
          <div className="travel-saved-heading">
            <NotebookPen aria-hidden="true" />
            <h2 id="travel-saved-title">Saved context for this day</h2>
          </div>
          <p className="travel-saved-intro">
            Your own record, separate from the reconstructed sky.
          </p>
          {journal.isPending ? (
            <p role="status">Loading saved context…</p>
          ) : journal.error ? (
            <div role="alert">
              <p>Saved context couldn’t load. Your entries may still be available.</p>
              <Button type="button" variant="outline" onClick={() => journal.refetch()}>
                <RotateCcw aria-hidden="true" />
                Retry saved context
              </Button>
            </div>
          ) : savedCheckIn || savedEvents.length ? (
            <div className="travel-saved-records">
              {savedCheckIn ? (
                <div className="travel-check-in">
                  <h3>Check-in</h3>
                  <p className="travel-check-in-bands">
                    Mood {savedCheckIn.mood ?? "—"} <span aria-hidden="true">·</span> Energy{" "}
                    {savedCheckIn.energy ?? "—"}
                  </p>
                  {savedCheckIn.note ? (
                    <p className="travel-saved-note">{savedCheckIn.note}</p>
                  ) : null}
                </div>
              ) : null}
              {savedEvents.map((event) => (
                <article key={event.id} className="travel-saved-event">
                  <p className="travel-event-domain">
                    Marked moment · {DOMAIN_LABEL[event.domain] ?? pointName(event.domain)}
                  </p>
                  <h3>{event.label}</h3>
                  {event.body ? <p className="travel-saved-note">{event.body}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="travel-saved-empty">
              <p>
                {applied
                  ? "No saved context found for " + travelDate(applied) + "."
                  : "Choose a day after today’s sky loads."}
              </p>
              {recentJournalLimit ? (
                <p>
                  Recent journal entries are shown here. Older records may be outside this view.
                </p>
              ) : null}
            </div>
          )}
          <Link to="/journal" className="travel-journal-link">
            Open journal <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        {pastData ? (
          <details className="timing-record travel-record">
            <summary>
              Comparison & calculation record <span>{timingDate(pastData.day)}</span>
            </summary>
            <div>
              {!pastData.ephemeris.degraded ? <EphemerisNotice state={pastData.ephemeris} /> : null}
              <Rail title="Calculation status">
                <Field label="Selected day" value={pastData.day} />
                <Field label="Calendar zone" value={pastData.timezone} />
                <Field label="Today" value={nowData?.day ?? "—"} />
                <Field label="Windows on selected day" value={pastData.cycles.length} />
                <Field label="Windows today" value={canCompare ? nowData.cycles.length : "—"} />
                <Field label="Calculation source" value={plainEngineLabel(pastData.engine)} />
                <Field label="Precision" value={plainPrecision(pastData.ephemeris.precision)} />
                <p>
                  Each day is recalculated from your chart. Today’s comparison matches the same
                  planet-to-point aspect; it does not establish that a window has stayed open
                  between these dates.
                </p>
                <Link to="/sources" className="travel-journal-link">
                  Explore chart sources <ArrowRight aria-hidden="true" />
                </Link>
              </Rail>
            </div>
          </details>
        ) : null}
      </div>
    </Shell>
  );
}
