import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import { timingDate } from "./timing";
/** All data belongs to the saved calculation. Opening this panel makes no request. */
export function TransitSequence({
  calculation,
}: {
  calculation: DailyTransitCalculation | null | undefined;
}) {
  if (calculation?.status !== "qualified") return null;
  const e = calculation.evidence,
    s = e.scan.samples[1],
    component = s.components.find((c) => c.id === e.componentIds[1])!;
  const windows = s.windows.filter((w) =>
    w.contactIds.some((id) => component.contactIds.includes(id)),
  );
  const start = Date.parse(windows[0]!.ingress!.at),
    end = Date.parse(windows.at(-1)!.egress!.at);
  const percent = (at: string) => ((Date.parse(at) - start) / (end - start)) * 100;
  return (
    <section className="mt-4 space-y-3" aria-label="Calculated contact sequence">
      <h4 className="text-base text-foreground">
        {e.passIndex === null
          ? "Between calculated contacts"
          : `Contact ${e.passIndex} of ${e.passTotal}`}
      </h4>
      <p className="text-sm text-muted-foreground">
        Calculated contacts, not a record of events in your life.
      </p>
      <div
        className="relative h-5"
        role="img"
        aria-label={`${windows.length} connected windows. Gaps are outside the calculated orb; contact dates are listed below.`}
      >
        {windows.map((w) => (
          <span
            key={w.id}
            data-contact-window={w.id}
            className="absolute top-2 h-1 bg-primary/40"
            style={{
              left: `${percent(w.ingress!.at)}%`,
              width: `${percent(w.egress!.at) - percent(w.ingress!.at)}%`,
            }}
          />
        ))}
        {e.contactRanges.map((c) => (
          <span
            key={c.eventId}
            className="absolute top-0 h-5 w-px bg-primary"
            style={{ left: `${percent(c.centralAt)}%` }}
          />
        ))}
      </div>
      <ol className="space-y-2 text-sm" aria-label="Exact contacts in chronological order">
        {e.contactRanges.map((c, i) => {
          const days = [...c.civilDays].sort();
          const uncertain = days[0] !== days.at(-1);
          return (
            <li key={c.eventId}>
              <span className="font-medium">Contact {i + 1}: </span>
              {uncertain ? (
                <>
                  Sampled range {timingDate(days[0]!, e.timezone)} –{" "}
                  {timingDate(days.at(-1)!, e.timezone)}
                </>
              ) : (
                timingDate(days[0]!, e.timezone)
              )}
              {e.passIndex === i + 1 ? " · current passage" : ""}
            </li>
          );
        })}
      </ol>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">First ingress</dt>
          <dd>{timingDate(windows[0]!.ingress!.at, e.timezone)} · central calculation</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">First exact contact</dt>
          <dd>
            {new Set(e.contactRanges[0]!.civilDays).size === 1
              ? timingDate(e.contactRanges[0]!.civilDays[0], e.timezone)
              : "See sampled range above"}
          </dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        Checked at the recorded birth time and both uncertainty boundaries. This three-sample screen
        does not confirm the birth time or every instant between the samples.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-primary">Event timing source details</summary>
        <dl className="mt-2 space-y-2 break-words">
          <div>
            <dt>Event timing engine</dt>
            <dd>
              {e.scan.source.engine} {e.scan.source.engineVersion}
            </dd>
          </div>
          <div>
            <dt>Source identity</dt>
            <dd>
              {e.scan.sourceId} · {e.scan.source.dataId}
            </dd>
          </div>
          <div>
            <dt>Numerical brackets</dt>
            <dd>
              At most {e.scan.tolerance.bracketSeconds} seconds; numerical tolerance is not personal
              timing accuracy.
            </dd>
          </div>
          <div>
            <dt>Current orb and ranking</dt>
            <dd>Approximate in-app geometry. It is separate from the exact-contact calculation.</dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
