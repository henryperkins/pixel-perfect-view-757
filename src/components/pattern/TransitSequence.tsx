import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import { timingDate } from "./timing";
import { plainEngineLabel } from "@/lib/plain-engine";
/** All data belongs to the saved calculation. Opening this panel makes no request. */
export function TransitSequence({
  calculation,
}: {
  calculation: DailyTransitCalculation | null | undefined;
}) {
  if (calculation?.status !== "qualified") return null;
  const e = calculation.evidence;
  const sample = e.scan.samples[1];
  const componentId = e.componentIds[1];
  const component = sample?.components.find((item) => item.id === componentId);
  const contactIds = component?.contactIds ?? [];
  const windows =
    sample?.windows.filter((window) => window.contactIds.some((id) => contactIds.includes(id))) ??
    [];
  // Every rendered window must have two valid, ordered boundaries.
  const sequenceWindows = windows.flatMap((window) => {
    if (!window.ingress || !window.egress) return [];
    const start = Date.parse(window.ingress.at);
    const end = Date.parse(window.egress.at);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    return [
      {
        id: window.id,
        ingressAt: window.ingress.at,
        egressAt: window.egress.at,
        start,
        end,
      },
    ];
  });
  const firstWindow = sequenceWindows[0];
  const lastWindow = sequenceWindows.at(-1);
  const invalidContact = e.contactRanges.some(
    (contact) =>
      !Number.isFinite(Date.parse(contact.centralAt)) ||
      !contact.civilDays[0] ||
      contact.civilDays.some((day) => !Number.isFinite(Date.parse(day))),
  );

  if (
    !sample ||
    !component ||
    !firstWindow ||
    !lastWindow ||
    // A damaged middle window must not become a shortened but complete-looking timeline.
    sequenceWindows.length !== windows.length ||
    lastWindow.end <= firstWindow.start ||
    invalidContact
  ) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        The saved contact sequence is incomplete.
      </p>
    );
  }
  const start = firstWindow.start;
  const end = lastWindow.end;
  const percent = (at: string) => ((Date.parse(at) - start) / (end - start)) * 100;
  const firstContact = e.contactRanges[0];
  return (
    <section className="transit-sequence mt-4 space-y-3" aria-label="Calculated contact sequence">
      <h4 className="text-base text-foreground">
        {e.passIndex === null
          ? "Between calculated contacts"
          : `Contact ${e.passIndex} of ${e.passTotal}`}
      </h4>
      <div
        className="relative h-5"
        role="img"
        aria-label={`${sequenceWindows.length} connected windows. Gaps are outside the calculated orb; contact dates are listed below.`}
      >
        {sequenceWindows.map((w) => (
          <span
            key={w.id}
            data-contact-window={w.id}
            className="absolute top-2 h-1 bg-primary/40"
            style={{
              left: `${percent(w.ingressAt)}%`,
              width: `${percent(w.egressAt) - percent(w.ingressAt)}%`,
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
      {e.contactRanges.length ? (
        <ol className="space-y-2 text-sm" aria-label="Exact contacts in chronological order">
          {e.contactRanges.map((c, i) => {
            const days = [...c.civilDays].sort();
            const firstDay = days[0];
            const lastDay = days.at(-1);
            if (!firstDay || !lastDay) return null;
            const uncertain = firstDay !== lastDay;
            return (
              <li key={c.eventId}>
                <span className="font-medium">Contact {i + 1}: </span>
                {uncertain ? (
                  <>
                    Sampled range {timingDate(firstDay, e.timezone)} –{" "}
                    {timingDate(lastDay, e.timezone)}
                  </>
                ) : (
                  timingDate(firstDay, e.timezone)
                )}
                {e.passIndex === i + 1 ? " · current passage" : ""}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No exact contact was recorded.</p>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Window opens</dt>
          <dd>{timingDate(firstWindow.ingressAt, e.timezone)} · recorded-time sample</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">First exact contact</dt>
          <dd>
            {firstContact
              ? new Set(firstContact.civilDays).size === 1
                ? timingDate(firstContact.civilDays[0], e.timezone)
                : "See sampled range above"
              : "No exact contact recorded"}
          </dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        Checked at the recorded birth time and both uncertainty boundaries. Those three samples do
        not confirm the birth time or every moment between them. These are calculated contacts, not
        a record of events in your life.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-primary">Timing calculation source</summary>
        <p className="mt-2 text-muted-foreground">
          {plainEngineLabel(e.scan.source.engine)} · {e.scan.source.engineVersion}. Numerical
          brackets are at most {e.scan.tolerance.bracketSeconds} seconds; this is calculation
          tolerance, not personal timing accuracy. The current angle used for ranking is separate
          from these contact dates.
        </p>
      </details>
    </section>
  );
}
