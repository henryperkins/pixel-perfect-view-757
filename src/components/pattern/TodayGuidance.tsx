import type { DailyGuidance } from "@/lib/daily-guidance";
import { DOMAIN_LABEL, timingDate } from "./timing";

export function TodayGuidance({
  guidance,
  timezone,
  updating = false,
}: {
  guidance: DailyGuidance;
  timezone: string;
  /** The current copy stays in place, quieted, until the refreshed suggestion arrives. */
  updating?: boolean;
}) {
  const { calculation, interpretation, context } = guidance.basis;
  return (
    <section
      aria-labelledby="today-guidance-title"
      aria-busy={updating}
      className="today-guidance mt-6 border-t border-rule pt-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="today-guidance-title" className="flow-section-title">
          Try this today
        </h2>
        <p role="status" className="today-guidance-status text-xs text-muted-foreground">
          {updating ? (
            <>
              Updating<span className="sr-only"> today’s suggestion</span>…
            </>
          ) : null}
        </p>
      </div>
      <p className="prose-reading mt-2 text-foreground">{guidance.action}</p>
      {guidance.framing ? <p className="mt-3 text-sm">{guidance.framing}</p> : null}
      {guidance.reflection ? <p className="mt-3 text-sm">{guidance.reflection}</p> : null}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-primary">Why this suggestion</summary>
        <div className="mt-2 space-y-2 text-muted-foreground">
          {calculation && interpretation ? (
            <p>
              {interpretation.theme
                ? `From the reading for ${calculation.label}, which centres on ${interpretation.theme}.`
                : `From the reading for ${calculation.label}. Use it only if it fits.`}
            </p>
          ) : (
            <p>No published interpretation was used to choose this suggestion.</p>
          )}
          {context.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {context.map((item) => (
                <li key={`${item.label}:${String(item.value)}`}>
                  {item.label}:{" "}
                  {typeof item.value === "number"
                    ? `${item.value}/5`
                    : (DOMAIN_LABEL[item.value] ?? item.value)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No personal context was used.</p>
          )}
          <p>A check-in can shape this suggestion. It does not change the chart.</p>
          {calculation ? (
            <p className="font-mono text-xs">
              Current orb {calculation.orb.toFixed(2)}°
              {calculation.exactAt
                ? ` · closest pass ${timingDate(calculation.exactAt, timezone)}`
                : ""}
              {interpretation ? ` · source ${interpretation.releaseVersion}` : ""}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
