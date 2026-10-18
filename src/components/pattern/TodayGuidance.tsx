import type { DailyGuidance } from "@/lib/daily-guidance";
import { DOMAIN_LABEL, timingDate } from "./timing";

export function TodayGuidance({
  guidance,
  timezone,
}: {
  guidance: DailyGuidance;
  timezone: string;
}) {
  const { calculation, interpretation, context } = guidance.basis;
  return (
    <section
      aria-labelledby="today-guidance-title"
      className="mt-6 rounded-sm border border-rule bg-secondary/40 p-5"
    >
      <h2 id="today-guidance-title" className="flow-section-title">
        Try this today
      </h2>
      <p className="prose-reading mt-2 text-foreground">{guidance.action}</p>
      {guidance.framing ? <p className="mt-3 text-sm">{guidance.framing}</p> : null}
      {guidance.reflection ? <p className="mt-3 text-sm">{guidance.reflection}</p> : null}
      {guidance.focus ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your chosen focus: {DOMAIN_LABEL[guidance.focus]}.
        </p>
      ) : null}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-primary">Why this suggestion</summary>
        <div className="mt-2 space-y-2 text-muted-foreground">
          {calculation && interpretation ? (
            <p>
              {interpretation.theme
                ? `The published reading for ${calculation.label} centres on ${interpretation.theme}. This suggestion offers one way to explore that theme.`
                : `This published reflection comes from the reading for ${calculation.label}. Use it only if it fits your experience.`}
            </p>
          ) : (
            <p>
              This is an open reflection suggestion; no published calculation theme was used to
              select it.
            </p>
          )}
          {context.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {context.map((item) => (
                <li key={`${item.sourceId}:${item.label}`}>
                  {item.label}:{" "}
                  {typeof item.value === "number"
                    ? `${item.value}/5`
                    : (DOMAIN_LABEL[item.value] ?? item.value)}
                  {item.use === "reflection_prompt"
                    ? " — shapes the reflection question"
                    : item.sourceId === "USR-14"
                      ? " — shown as your focus label"
                      : item.label === "Energy"
                        ? interpretation?.theme
                          ? " — shapes the step’s size"
                          : " — shapes the suggested approach"
                        : " — shapes the framing"}
                  .
                </li>
              ))}
            </ul>
          ) : (
            <p>No personal context was used for this suggestion.</p>
          )}
          <p>
            Your check-in describes what you reported. It does not change the chart calculation.
            Personal context stays within Pattern.
          </p>
          {calculation && interpretation ? (
            <p className="text-xs">
              {interpretation.key} · source release {interpretation.releaseVersion} · current orb{" "}
              {calculation.orb.toFixed(2)}°
              {calculation.exactAt
                ? ` · exact contact ${timingDate(calculation.exactAt, timezone)}`
                : ""}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
