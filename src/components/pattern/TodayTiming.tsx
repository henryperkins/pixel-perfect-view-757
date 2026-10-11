import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleDot, Sunrise, Sunset } from "lucide-react";

import type { fetchToday } from "@/lib/pattern.functions";
import {
  daysToExact,
  DOMAIN_LABEL,
  exactPhrase,
  PHASE_LABEL,
  timingDate,
  weightLabel,
  windowPhase,
  windowTitle,
} from "./timing";

type TodayData = Extract<Awaited<ReturnType<typeof fetchToday>>, { needsOnboarding: false }>;
type Cycle = TodayData["cycles"][number];
const PHASE_ICONS = { building: Sunrise, exact: CircleDot, fading: Sunset };

function WindowRow({ cycle, day, timezone }: { cycle: Cycle; day: string; timezone: string }) {
  const phase = windowPhase(cycle, day, timezone);
  const Icon = PHASE_ICONS[phase];

  return (
    <li>
      <details className="today-window" data-phase={phase}>
        <summary>
          <Icon aria-hidden="true" className="today-window-mark" />
          <span className="today-window-heading">
            <span className="today-window-title">{windowTitle(cycle)}</span>
            <span className="today-window-context">
              {PHASE_LABEL[phase].label} · {exactPhrase(daysToExact(cycle, day, timezone))}
            </span>
          </span>
        </summary>
        <div className="today-window-values">
          <p className="text-sm text-muted-foreground">{PHASE_LABEL[phase].help}</p>
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
              <dd>{timingDate(cycle.exact_at, timezone)}</dd>
            </div>
          </dl>
        </div>
      </details>
    </li>
  );
}

export function TodayTiming({
  cycles,
  day,
  timezone,
}: {
  cycles: Cycle[];
  day: string;
  timezone: string;
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
      <p className="mt-2 text-sm text-muted-foreground">
        {cycles.length
          ? "Windows calculated from today’s sky and your birth chart. Open one to see its details."
          : "No measurable window against your chart today. A quiet result is a valid one."}
      </p>
      {visible.length ? (
        <ul className="today-window-list mt-4">
          {visible.map((cycle) => (
            <WindowRow key={cycle.cycle_key} cycle={cycle} day={day} timezone={timezone} />
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
              <WindowRow key={cycle.cycle_key} cycle={cycle} day={day} timezone={timezone} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
