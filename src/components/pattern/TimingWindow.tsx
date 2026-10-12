import { TransitSequence } from "./TransitSequence";
import { AttachedJournalContext } from "./TodayJournal";
import { primaryStoryOverlay } from "@/lib/astro/transit-presentation";
import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleDot,
  Sunrise,
  Sunset,
  Waves,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  arcSentence,
  cycleTimingPhrase,
  DOMAIN_LABEL,
  PHASE_LABEL,
  timelinePositions,
  timingDate,
  weightLabel,
  windowPhase,
  windowTitle,
  type TimingCycle,
} from "./timing";

const PHASE_ICONS = {
  building: Sunrise,
  exact: CircleDot,
  fading: Sunset,
  between: Waves,
  uncertain: Waves,
};

function WindowTimeline({
  cycle,
  day,
  timezone,
  referenceAt,
  referenceLabel,
}: {
  cycle: TimingCycle;
  day: string;
  timezone: string;
  referenceAt?: string | undefined;
  referenceLabel: string;
}) {
  const positions = timelinePositions(cycle, day, timezone, referenceAt);
  const dates = [
    { label: "Opens", value: cycle.ingress_at },
    { label: "Closest pass", value: cycle.exact_at },
    { label: "Closes", value: cycle.egress_at },
  ];

  return (
    <div className="timing-timeline">
      {positions ? (
        <>
          <div className="timing-timeline-legend" aria-hidden="true">
            {positions.today !== null ? (
              <span>
                <span className="timing-legend-dot" />
                {referenceLabel}
              </span>
            ) : null}
            {positions.exact !== null ? (
              <span>
                <span className="timing-legend-tick" />
                Closest pass
              </span>
            ) : null}
          </div>
          <div
            className="timing-arc"
            role="img"
            aria-label={
              "Calculated window from " +
              timingDate(cycle.ingress_at, timezone) +
              " to " +
              timingDate(cycle.egress_at, timezone) +
              ". " +
              (positions.today !== null
                ? referenceLabel + " is " + Math.round(positions.today) + "% through this window."
                : referenceLabel + " is outside this date range.")
            }
          >
            {positions.today !== null ? (
              <>
                <span className="timing-arc-fill" style={{ width: positions.today + "%" }} />
                <span className="timing-today-marker" style={{ left: positions.today + "%" }} />
              </>
            ) : null}
            {positions.exact !== null ? (
              <span className="timing-exact-marker" style={{ left: positions.exact + "%" }} />
            ) : null}
          </div>
        </>
      ) : (
        <p className="timing-open-range">
          <Waves aria-hidden="true" />A full timeline is not available within the calculated range.
        </p>
      )}
      <dl className="timing-milestones">
        {dates.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value && Number.isFinite(Date.parse(value)) ? (
                <time dateTime={value} title={value}>
                  {timingDate(value, timezone)}
                </time>
              ) : (
                "Not in range"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TimingWindow({
  cycle,
  day,
  timezone = "UTC",
  referenceAt,
  open,
  visited,
  previous,
  next,
  onToggle,
  onBrowse,
  referenceLabel = "Today",
  comparisonLabel,
  calculation,
}: {
  cycle: TimingCycle;
  day: string;
  timezone?: string;
  referenceAt?: string | undefined;
  open: boolean;
  visited: boolean;
  previous: TimingCycle | undefined;
  next: TimingCycle | undefined;
  onToggle: () => void;
  onBrowse: (key: string) => void;
  referenceLabel?: "Today" | "Selected day";
  comparisonLabel?: string | undefined;
  calculation?: DailyTransitCalculation | null;
}) {
  const phase = windowPhase(cycle, day, timezone, calculation);
  const copy = PHASE_LABEL[phase];
  const Icon = PHASE_ICONS[phase];
  const timing = cycleTimingPhrase(
    cycle,
    day,
    timezone,
    calculation,
    referenceLabel === "Selected day",
  );
  const overlay = primaryStoryOverlay(calculation, cycle.cycle_key);
  const arc = overlay ? null : arcSentence(cycle);
  const toggleId = "timing-toggle-" + cycle.cycle_key;
  const panelId = "timing-panel-" + cycle.cycle_key;

  return (
    <article className={"timing-window " + (open ? "is-open" : "")} data-phase={phase}>
      <Button
        type="button"
        variant="ghost"
        id={toggleId}
        className="timing-window-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="timing-phase-mark">
          <Icon aria-hidden="true" />
        </span>
        <span className="timing-window-heading">
          <span className="timing-window-title">{windowTitle(cycle)}</span>
          <span className="timing-window-context">
            {DOMAIN_LABEL[cycle.domain] ?? cycle.domain} · {weightLabel(cycle.importance)} window
          </span>
        </span>
        <span className="timing-window-when">
          <span className="timing-phase-label">
            <span aria-hidden="true" />
            {copy.label}
          </span>
          <span>{timing}</span>
        </span>
        <ChevronDown aria-hidden="true" className="timing-window-chevron" />
      </Button>
      <div
        id={panelId}
        className={"timing-window-panel " + (open ? "is-open" : "")}
        inert={!open}
        aria-hidden={!open}
        role="region"
        aria-labelledby={toggleId}
      >
        <div>
          {visited ? (
            <div className="timing-window-content">
              <p className="timing-phase-help">
                {phase === "exact" && referenceLabel === "Selected day"
                  ? "The aspect is at its closest point on this day."
                  : copy.help}
              </p>
              {comparisonLabel ? (
                <p className="timing-comparison-label">{comparisonLabel}</p>
              ) : null}
              {overlay ? (
                <TransitSequence calculation={calculation} />
              ) : (
                <WindowTimeline
                  cycle={cycle}
                  day={day}
                  timezone={timezone}
                  referenceAt={referenceAt}
                  referenceLabel={referenceLabel}
                />
              )}
              {arc ? <p className="timing-arc-copy">{arc}</p> : null}
              <details className="timing-calculated-values">
                <summary>Calculated values</summary>
                <dl>
                  <div>
                    <dt>Cycle key</dt>
                    <dd className="break-all">{cycle.cycle_key}</dd>
                  </div>
                  <div>
                    <dt>Aspect</dt>
                    <dd>{cycle.aspect}</dd>
                  </div>
                  <div>
                    <dt>Orb</dt>
                    <dd>{cycle.orb.toFixed(2)}° from exact</dd>
                  </div>
                  <div>
                    <dt>Calculated phase</dt>
                    <dd>{overlay?.phase ?? cycle.phase}</dd>
                  </div>
                  <div>
                    <dt>Strength</dt>
                    <dd>{cycle.importance.toFixed(4)}</dd>
                  </div>
                  {(overlay ? overlay.centralExactAt : cycle.exact_at) ? (
                    <div>
                      <dt>Closest pass (UTC)</dt>
                      <dd className="break-all">
                        {overlay ? overlay.centralExactAt : cycle.exact_at}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </details>
              <AttachedJournalContext cycleKey={cycle.cycle_key} />
              <div className="timing-window-footer">
                {previous || next ? (
                  <nav aria-label="Nearby timing windows">
                    <Button
                      variant="ghost"
                      disabled={!previous}
                      title={previous ? windowTitle(previous) : undefined}
                      onClick={() => previous && onBrowse(previous.cycle_key)}
                    >
                      <ArrowLeft aria-hidden="true" />
                      <span>Previous window</span>
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!next}
                      title={next ? windowTitle(next) : undefined}
                      onClick={() => next && onBrowse(next.cycle_key)}
                    >
                      <span>Next window</span>
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </nav>
                ) : null}
                <Link to="/journal">
                  Open journal <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
