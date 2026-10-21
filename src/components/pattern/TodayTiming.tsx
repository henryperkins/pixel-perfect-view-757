import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import { primaryStoryOverlay } from "@/lib/astro/transit-presentation";
import { TransitSequence } from "./TransitSequence";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleDot, Sunrise, Sunset } from "lucide-react";

import type { fetchToday } from "@/lib/pattern.functions";
import {
  cycleTimingPhrase,
  DOMAIN_LABEL,
  PHASE_LABEL,
  timingDate,
  weightLabel,
  windowPhase,
  windowTitle,
} from "./timing";

type TodayData = Extract<Awaited<ReturnType<typeof fetchToday>>, { needsOnboarding: false }>;
type Cycle = TodayData["cycles"][number];
const PHASE_ICONS = {
  building: Sunrise,
  exact: CircleDot,
  fading: Sunset,
  between: CircleDot,
  uncertain: CircleDot,
};

function WindowRow({
  cycle,
  day,
  timezone,
  calculation,
}: {
  cycle: Cycle;
  day: string;
  timezone: string;
  calculation?: DailyTransitCalculation | null | undefined;
}) {
  const overlay = primaryStoryOverlay(calculation, cycle.cycle_key);
  const phase = windowPhase(cycle, day, timezone, calculation);
  const Icon = PHASE_ICONS[phase];

  return (
    <li>
      <details className="today-window" data-phase={phase}>
        <summary>
          <Icon aria-hidden="true" className="today-window-mark" />
          <span className="today-window-heading">
            <span className="today-window-title">{windowTitle(cycle)}</span>
            <span className="today-window-context">
              {PHASE_LABEL[phase].label} · {cycleTimingPhrase(cycle, day, timezone, calculation)}
            </span>
          </span>
        </summary>
        <div className="today-window-values">
          <dl>
            <div>
              <dt>Area</dt>
              <dd>{DOMAIN_LABEL[cycle.domain] ?? cycle.domain}</dd>
            </div>
            <div>
              <dt>Strength</dt>
              <dd>{weightLabel(cycle.importance)}</dd>
            </div>
            <div>
              <dt>Current orb</dt>
              <dd>{cycle.orb.toFixed(2)}° from exact</dd>
            </div>
            <div>
              <dt>Closest pass</dt>
              <dd>
                {overlay
                  ? overlay.qualifiedExactDay
                    ? timingDate(overlay.qualifiedExactDay, timezone)
                    : "See sampled dates below"
                  : timingDate(cycle.exact_at, timezone)}
              </dd>
            </div>
          </dl>
          {overlay ? <TransitSequence calculation={calculation} /> : null}
        </div>
      </details>
    </li>
  );
}

export function TodayTiming({
  cycles,
  day,
  timezone,
  calculation,
}: {
  cycles: Cycle[];
  day: string;
  timezone: string;
  calculation?: DailyTransitCalculation | null | undefined;
}) {
  const visible = cycles.slice(0, 2);
  const remaining = cycles.slice(2);

  return (
    <section id="today-timing" className="today-section">
      <div className="today-section-heading">
        <h2 className="flow-section-title">Timing today</h2>
        <Link to="/timing" className="today-text-link">
          All windows <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {cycles.length ? null : (
        <p className="mt-2 text-sm text-muted-foreground">
          No measurable window against your chart today. A quiet result is a valid one.
        </p>
      )}
      {visible.length ? (
        <ul className="today-window-list mt-4">
          {visible.map((cycle) => (
            <WindowRow
              key={cycle.cycle_key}
              cycle={cycle}
              day={day}
              timezone={timezone}
              calculation={calculation}
            />
          ))}
        </ul>
      ) : null}
      {remaining.length ? (
        <details className="today-more-windows mt-3">
          <summary>
            More windows <span className="text-muted-foreground">({remaining.length})</span>
          </summary>
          <ul className="today-window-list mt-3">
            {remaining.map((cycle) => (
              <WindowRow
                key={cycle.cycle_key}
                cycle={cycle}
                day={day}
                timezone={timezone}
                calculation={calculation}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
