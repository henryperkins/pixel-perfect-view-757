import { TransitSequence } from "./TransitSequence";
import { primaryStoryOverlay } from "@/lib/astro/transit-presentation";
import type { DailyTransitCalculation } from "@/lib/astro/transit-episodes";
import type { ReactNode } from "react";
import type { fetchToday } from "@/lib/pattern.functions";
import { timingDate } from "./timing";
import type { NatalLensEvidence } from "@/lib/astro/natal-reliability";
import { plainEngineLabel } from "@/lib/plain-engine";
import {
  describeTodayFact,
  todayFactId,
  todayFactLabel,
  todayParagraphId,
  todayPhaseLabel,
  todayPointLabel,
  todaySourceCategory,
  todaySourceLabel,
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

function NatalOrigin({ evidence }: { evidence: NatalLensEvidence }) {
  const origin =
    evidence.kind === "sign"
      ? `${todayPointLabel(evidence.body)} in ${evidence.sign}`
      : evidence.kind === "house"
        ? `${todayPointLabel(evidence.body)} in Placidus house ${evidence.house}`
        : `${todayPointLabel(evidence.a)} ${evidence.aspect} ${todayPointLabel(evidence.b)}`;
  const proof =
    evidence.kind === "aspect"
      ? `Raw service orbs: ${evidence.orbs.map((n) => `${n.toFixed(4)}°`).join(" · ")}`
      : `Boundary margins: ${evidence.marginsDeg.map((n) => `${n.toFixed(3)}°`).join(" · ")}`;
  return (
    <li className="min-w-0">
      <p className="text-sm text-foreground">{origin}</p>
      <p className="mt-1 break-words font-mono text-xs leading-relaxed text-muted-foreground">
        {proof} (before · recorded · after)
      </p>
    </li>
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
  const natal = language?.natalLens;
  const story = language?.transitStory;
  const calculation: DailyTransitCalculation | null =
    story?.plan.status === "selected"
      ? {
          status: "qualified",
          evidence: story.plan.evidence,
          timingOverlay: story.plan.evidence.timingOverlay,
        }
      : null;
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
  const sources = provenance
    .map((source) => ({
      label: todaySourceLabel(source),
      category: todaySourceCategory(source.lane, source.source_id),
    }))
    .filter(
      (source, index, all) =>
        all.findIndex(
          (other) => other.label === source.label && other.category === source.category,
        ) === index,
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
              <li key={cycle.cycle_key} className="min-w-0 border-t border-rule pt-3">
                <h4 className="mb-3 text-sm font-medium text-foreground">
                  {todayPointLabel(cycle.transit_body)} {cycle.aspect} natal{" "}
                  {todayPointLabel(cycle.natal_point)}
                </h4>
                <LabelledValues
                  values={[
                    { label: "Current orb", value: `${cycle.orb.toFixed(2)}° from exact` },
                    {
                      label: "Phase",
                      value: todayPhaseLabel(
                        primaryStoryOverlay(calculation, cycle.cycle_key)?.phase ?? cycle.phase,
                      ),
                    },
                    {
                      label: "Calculated exact date",
                      value: primaryStoryOverlay(calculation, cycle.cycle_key)
                        ? primaryStoryOverlay(calculation, cycle.cycle_key)!.qualifiedExactDay
                          ? timingDate(
                              primaryStoryOverlay(calculation, cycle.cycle_key)!.qualifiedExactDay,
                              timezone,
                            )
                          : "See the saved sampled dates"
                        : cycle.exact_at
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
            No calculated windows were returned for this day.
          </p>
        )}
      </section>

      <section aria-labelledby="today-language-title">
        <h3 id="today-language-title" className="text-lg text-evidence-foreground">
          Wording and its references
        </h3>
        {language?.mode === "model" || language?.dailyWriting?.status === "saved" ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {language.mode === "model" ? (
                <>
                  {language.model
                    ? `Written by ${language.model} from the calculated facts. `
                    : "Written from the calculated facts. "}
                  A paragraph link names the reference supplied with that wording. It does not prove
                  every sentence.
                </>
              ) : (
                "This reading uses standard wording from published sources."
              )}
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
                              {todayFactLabel(id)}
                            </SourceLink>
                          ) : (
                            <span className="inline-block py-3 text-sm text-muted-foreground">
                              {todayFactLabel(id)} · archived text unavailable
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
            This reading uses standard wording from published sources. The references below are the
            calculations, published copy, and context retained with it.
          </p>
        )}

        {language?.dailyWriting?.status === "saved" &&
        language.dailyWriting.evidence.plan.scenes.length ? (
          <section className="mt-5" aria-labelledby="today-illustrations-title">
            <h4 id="today-illustrations-title" className="text-base text-foreground">
              Published illustrations
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These are possible examples published with the selected meaning. They do not establish
              that an event happened.
            </p>
            <ul className="mt-4 space-y-4">
              {language.dailyWriting.evidence.plan.scenes.map((scene) => {
                const saved =
                  language.dailyWriting!.status === "saved"
                    ? language.dailyWriting!.evidence
                    : null;
                const use = saved?.sceneUse.find((item) => item.id === scene.id);
                return (
                  <li key={scene.id} className="min-w-0 border-t border-rule pt-4">
                    <h5 className="text-sm font-medium text-foreground">Published illustration</h5>
                    <p className="mt-2 break-words text-sm leading-relaxed text-foreground">
                      {scene.situation} {scene.focus}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4">
                      {saved?.plan.theme && byId.has(saved.plan.theme.factId) ? (
                        <SourceLink id={todayFactId(readingId, saved.plan.theme.factId)}>
                          {todayFactLabel(saved.plan.theme.factId)}
                        </SourceLink>
                      ) : null}
                      {use && paragraphLinksAvailable && use.paragraph <= paragraphCount ? (
                        <SourceLink id={todayParagraphId(readingId, use.paragraph)}>
                          Used by paragraph {use.paragraph}
                        </SourceLink>
                      ) : (
                        <span className="py-3 text-xs text-muted-foreground">
                          {use
                            ? "Saved paragraph link unavailable"
                            : "Not used in this saved wording"}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : language?.dailyWriting?.status === "unavailable" ? (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            The saved reflection and illustration evidence are unavailable because their private
            context expired or its permission was removed.
          </p>
        ) : null}

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
                      <h5 className="text-sm font-medium text-foreground">{described.label}</h5>
                    </div>
                    {language?.mode === "model" ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {citations.some((citation) => citation.facts.includes(fact.id))
                          ? "Linked from a paragraph"
                          : "Supplied, not linked from a paragraph"}
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
                          ]}
                        />
                        <ul
                          className="flex flex-wrap gap-x-4"
                          aria-label="Published synthesis parents"
                        >
                          {synthesis.dependsOn.map((id) => (
                            <li key={id}>
                              <SourceLink id={todayFactId(readingId, id)}>
                                {todayFactLabel(id)}
                              </SourceLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {fact.id === "A1" ? <TransitSequence calculation={calculation} /> : null}
                    {fact.id === "P2" && story?.plan.status === "selected" ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm">Published chapter · {story.plan.releaseVersion}</p>
                        <ul
                          className="flex flex-wrap gap-x-4"
                          aria-label="Published chapter parents"
                        >
                          {["C1", "I1", "A1"].map((id) => (
                            <li key={id}>
                              <SourceLink id={todayFactId(readingId, id)}>
                                {todayFactLabel(id)}
                              </SourceLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {fact.id === "N1" && natal?.plan.lens ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm leading-relaxed text-foreground">
                          This is an astrological possibility you can recognize or reject, applied
                          to the primary reading rather than a measurement of temperament.
                        </p>
                        <LabelledValues
                          values={[
                            { label: "Source version", value: natal.plan.releaseVersion },
                            {
                              label: "Calculation source",
                              value: [
                                ...new Set(
                                  natal.plan.lens.screen.sampleEngines.map((engine) =>
                                    plainEngineLabel(engine),
                                  ),
                                ),
                              ].join(" · "),
                            },
                            {
                              label: "Birth-time accuracy",
                              value: `${todayPointLabel(natal.plan.lens.screen.accuracy)} · ±${natal.plan.lens.screen.sampleOffsetsMinutes[2]} minutes`,
                            },
                          ]}
                        />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Checked at the recorded time and both uncertainty boundaries. Those three
                          samples do not confirm the birth time or every moment between them.
                        </p>
                        <h6 className="text-sm font-medium text-foreground">
                          Natal origin saved with this reading
                        </h6>
                        <ul className="space-y-3" aria-label="Saved natal origins">
                          {natal.plan.lens.evidence.map((evidence, index) => (
                            <NatalOrigin key={index} evidence={evidence} />
                          ))}
                        </ul>
                        <ul
                          className="flex flex-wrap gap-x-4"
                          aria-label="Published natal lens parents"
                        >
                          {natal.plan.lens.dependsOn.map((id) => (
                            <li key={id}>
                              <SourceLink id={todayFactId(readingId, id)}>
                                {todayFactLabel(id)}
                              </SourceLink>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground">
                          {language?.mode === "model"
                            ? "Linked from the wording"
                            : "Used in the standard wording"}
                        </p>
                        <ul
                          className="flex flex-wrap gap-x-4"
                          aria-label="Natal lens consumed paragraphs"
                        >
                          {natal.usedParagraphs.map((paragraph) => (
                            <li key={paragraph}>
                              {paragraphLinksAvailable && paragraph <= paragraphCount ? (
                                <SourceLink id={todayParagraphId(readingId, paragraph)}>
                                  Paragraph {paragraph}
                                </SourceLink>
                              ) : (
                                <span>Paragraph {paragraph} · link unavailable</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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
        {sources.length ? (
          <ul className="mt-4 space-y-3">
            {sources.map((source, index) => (
              <li key={`${source.label}-${index}`} className="min-w-0 border-t border-rule pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm text-foreground">{source.label}</p>
                  <Category>{source.category}</Category>
                </div>
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
