import type { ReactNode } from "react";
import type { fetchToday } from "@/lib/pattern.functions";
import { timingDate } from "./timing";
import {
  describeTodayFact,
  todayFactCategory,
  todayFactId,
  todayFactLabel,
  todayParagraphId,
  todayPhaseLabel,
  todayPointLabel,
  todaySourceCategory,
} from "./today-view";

type TodayData = Extract<Awaited<ReturnType<typeof fetchToday>>, { needsOnboarding: false }>;

export type TodayEvidenceProps = {
  readingId: string;
  cycles: TodayData["cycles"];
  provenance: TodayData["provenance"];
  language: TodayData["language"] | null | undefined;
  timezone: string;
  paragraphCount: number;
  /** Only true when exact stored paragraph boundaries have been recovered and checked. */
  paragraphLinksAvailable: boolean;
};

function focusTarget(id: string) {
  const target = document.getElementById(id);
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: "start", behavior: "instant" });
}

function SourceLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <a
      href={`#${id}`}
      onClick={(event) => {
        event.preventDefault();
        focusTarget(id);
      }}
      className="today-evidence-link inline-flex min-h-11 items-center text-primary underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function Category({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-sm border border-rule px-2 py-1 text-xs text-evidence-foreground">
      {children}
    </span>
  );
}

function LabelledValues({ values }: { values: { label: string; value: string }[] }) {
  return (
    <dl className="today-evidence-values grid gap-3 text-sm sm:grid-cols-2">
      {values.map((value) => (
        <div key={value.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{value.label}</dt>
          <dd className="mt-1 break-words text-foreground">{value.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TodayEvidence({
  readingId,
  cycles,
  provenance,
  language,
  timezone,
  paragraphCount,
  paragraphLinksAvailable,
}: TodayEvidenceProps) {
  const facts = language?.facts ?? [];
  const byId = new Map(facts.map((fact) => [fact.id, fact]));
  const savedSynthesis = language?.interpretationPlan?.synthesis;
  const synthesisFact = byId.get("S1");
  const synthesis =
    savedSynthesis &&
    synthesisFact?.kind === "synthesis" &&
    synthesisFact.sourceKey === savedSynthesis.ruleKey &&
    synthesisFact.releaseVersion === savedSynthesis.releaseVersion &&
    synthesisFact.dependsOn?.join("|") === "C1|I1|C2|I2" &&
    savedSynthesis.dependsOn.join("|") === synthesisFact.dependsOn.join("|") &&
    savedSynthesis.dependsOn.every((id) => byId.has(id))
      ? savedSynthesis
      : null;
  const citations = (language?.citations ?? []).filter(
    (citation) =>
      citation &&
      Number.isSafeInteger(citation.paragraph) &&
      citation.paragraph >= 1 &&
      Array.isArray(citation.facts) &&
      citation.facts.every((id) => typeof id === "string"),
  );

  return (
    <div id="today-evidence" className="today-evidence mt-4 space-y-8 bg-evidence p-4 sm:p-5">
      <section aria-labelledby="today-calculation-title">
        <h3 id="today-calculation-title" className="text-lg text-evidence-foreground">
          Calculated windows for this day
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          These values describe the calculated angles to your birth chart. An interpretation or a
          reflection is separate from the calculation.
        </p>
        {cycles.length ? (
          <ul className="today-evidence-calculations mt-4 grid gap-3">
            {cycles.map((cycle) => (
              <li key={cycle.cycle_key} className="min-w-0 border border-rule bg-card p-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">
                  {todayPointLabel(cycle.transit_body)} {cycle.aspect} natal{" "}
                  {todayPointLabel(cycle.natal_point)}
                </h4>
                <LabelledValues
                  values={[
                    { label: "Current orb", value: `${cycle.orb.toFixed(2)}° from exact` },
                    { label: "Phase", value: todayPhaseLabel(cycle.phase) },
                    {
                      label: "Calculated exact date",
                      value: cycle.exact_at
                        ? timingDate(cycle.exact_at, timezone)
                        : "Not found in the scanned window",
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No calculated windows were returned for this day. An empty result is valid.
          </p>
        )}
      </section>

      <section aria-labelledby="today-language-title">
        <h3 id="today-language-title" className="text-lg text-evidence-foreground">
          Wording and its references
        </h3>
        {language?.mode === "model" ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {language.model ? `Wording by ${language.model}. ` : "Model-written wording. "}
              Paragraph citations identify the supplied references. They do not prove that every
              interpretation is supported by a reference.
            </p>
            {!paragraphLinksAvailable && citations.length ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This older reading did not retain verified paragraph boundaries. Its saved source
                references are listed below; links back to paragraphs are unavailable.
              </p>
            ) : null}
            {citations.length ? (
              <ol
                className="today-evidence-citations mt-4 space-y-3"
                aria-label="Sources by paragraph"
              >
                {citations.map((citation, index) => (
                  <li
                    key={`${citation.paragraph}-${index}`}
                    className="min-w-0 border-t border-rule pt-2"
                  >
                    {paragraphLinksAvailable && citation.paragraph <= paragraphCount ? (
                      <SourceLink id={todayParagraphId(readingId, citation.paragraph)}>
                        Paragraph {citation.paragraph}
                      </SourceLink>
                    ) : (
                      <p className="py-2 text-sm font-medium text-foreground">
                        Paragraph {citation.paragraph} · link unavailable
                      </p>
                    )}
                    <ul
                      className="flex flex-wrap gap-x-4"
                      aria-label={`Paragraph ${citation.paragraph} references`}
                    >
                      {[...new Set(citation.facts)].map((id) => (
                        <li key={id}>
                          {byId.has(id) ? (
                            <SourceLink id={todayFactId(readingId, id)}>
                              {todayFactLabel(id)} <span className="ml-1 text-xs">({id})</span>
                            </SourceLink>
                          ) : (
                            <span className="inline-block py-3 text-sm text-muted-foreground">
                              {todayFactLabel(id)} ({id}) · archived text unavailable
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No paragraph citations were retained for this saved reading.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This reading uses published template wording. Model paragraph citations do not apply;
            the source trail below identifies its calculations, reference copy, and local context.
          </p>
        )}

        {facts.length ? (
          <>
            <h4 className="mt-5 text-base text-foreground">
              Saved references supplied for this reading
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These references were retained with the saved wording. Published reference copy gives
              the calculated cycles meaning; it is not an additional astronomical measurement.
            </p>
            <ul className="today-evidence-facts mt-4 space-y-4">
              {facts.map((fact) => {
                const described = describeTodayFact(fact);
                return (
                  <li
                    id={todayFactId(readingId, fact.id)}
                    key={fact.id}
                    tabIndex={-1}
                    className="today-evidence-target min-w-0 border-t border-rule pt-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-medium text-foreground">
                        {described.label} <span className="font-mono text-xs">({fact.id})</span>
                      </h5>
                      <Category>{todayFactCategory(fact.id)}</Category>
                    </div>
                    {language?.mode === "model" ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {citations.some((citation) => citation.facts.includes(fact.id))
                          ? "Cited in model paragraphs"
                          : "Supplied · not cited in model paragraphs"}
                      </p>
                    ) : null}
                    {described.values ? (
                      <div className="mt-3">
                        <LabelledValues values={described.values} />
                      </div>
                    ) : (
                      <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                        {described.text}
                      </p>
                    )}
                    {fact.id === "S1" && synthesis ? (
                      <div className="mt-3 space-y-2">
                        <LabelledValues
                          values={[
                            {
                              label: "Relationship",
                              value: todayPointLabel(synthesis.relationship),
                            },
                            { label: "Source version", value: synthesis.releaseVersion },
                            { label: "Published rule", value: synthesis.ruleKey },
                          ]}
                        />
                        <ul
                          className="flex flex-wrap gap-x-4"
                          aria-label="Published synthesis parents"
                        >
                          {synthesis.dependsOn.map((id) => (
                            <li key={id}>
                              <SourceLink id={todayFactId(readingId, id)}>
                                {todayFactLabel(id)} <span className="ml-1 text-xs">({id})</span>
                              </SourceLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-primary">
                        Original supplied text
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                        {fact.statement}
                      </p>
                    </details>
                  </li>
                );
              })}
            </ul>
          </>
        ) : language?.mode === "model" ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Exact supplied references were not retained with this older reading. Current calculated
            values above cannot establish which facts its wording used.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="today-source-title">
        <h3 id="today-source-title" className="text-lg text-evidence-foreground">
          Source trail
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The categories distinguish calculations, published wording, and context you chose to
          record. Personal context is added locally and does not change the chart calculation.
        </p>
        {provenance.length ? (
          <ul className="mt-4 space-y-3">
            {provenance.map((source, index) => (
              <li
                key={`${source.source_id}-${index}`}
                className="min-w-0 border-t border-rule pt-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm text-foreground">{source.label}</p>
                  <Category>{todaySourceCategory(source.lane, source.source_id)}</Category>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{source.source_id}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No source trail was retained for this reading.
          </p>
        )}
      </section>
    </div>
  );
}
