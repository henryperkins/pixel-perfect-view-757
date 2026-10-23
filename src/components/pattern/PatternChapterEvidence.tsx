import { readableNarrativeCitations } from "@/lib/narrative-citations";

import { focusEvidenceTarget } from "./evidence-focus";
import { bodyName, chapterParagraphId, type PatternFeature } from "./pattern-view";

type Fact = { id: string; statement: string };

const LABELS: Record<string, string> = {
  a: "First body",
  b: "Second body",
  sign: "Sign",
  house: "House",
  degree: "Position in sign",
  orb: "Distance from exact angle",
  hard: "Hard aspect",
  applying: "Moving toward exact",
  elements: "Bodies by element",
  modalities: "Bodies by mode",
  topMode: "Most common mode",
  members: "Bodies in this group",
  longitude: "Ecliptic longitude",
};

function labelFor(key: string) {
  return LABELS[key] ?? bodyName(key.replace(/([a-z])([A-Z])/g, "$1 $2"));
}

function Value({
  value,
  field = "",
  raw = false,
}: {
  value: unknown;
  field?: string;
  raw?: boolean;
}) {
  if (value === null || value === undefined) return <>Not recorded</>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (typeof value === "number") {
    return (
      <>
        {value}
        {["orb", "degree", "longitude"].includes(field) ? "°" : ""}
      </>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-inside list-disc">
        {value.map((item, i) => (
          <li key={i}>
            <Value value={item} field={field} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") return <Values payload={value} />;
  if (raw) {
    return (
      <span className="block whitespace-pre-wrap break-words font-mono text-xs">
        {String(value)}
      </span>
    );
  }
  return <>{bodyName(String(value))}</>;
}

function Values({ payload }: { payload: object }) {
  return (
    <dl className="pattern-evidence-values">
      {Object.entries(payload).map(([key, value]) => (
        <div key={key}>
          <dt>{labelFor(key)}</dt>
          <dd>
            <Value value={value} field={key} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

type DescribedFact = {
  label: string;
  value: unknown;
  field?: string;
  raw?: boolean;
};

/** A value that cannot be parsed is shown verbatim rather than renamed. */
function parseFactValue(text: string): { value: unknown; raw: boolean } {
  try {
    return { value: JSON.parse(text), raw: false };
  } catch {
    return { value: text, raw: true };
  }
}

/** A shortened structured value has no closing token and cannot be repaired. */
function isTruncatedJson(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  const last = trimmed.at(-1);
  return last !== "}" && last !== "]";
}

function describeFact(fact: Fact): DescribedFact {
  if (fact.id === "N1")
    return {
      label: "Chart structure",
      value: fact.statement.replace(/ \(key [^)]+\)/g, "").replace(/ \(an app ranking[^)]+\)/g, ""),
    };
  if (fact.id.startsWith("R"))
    return {
      label: "Related chart structure",
      value: fact.statement.replace(/ \(an app ranking[^)]+\)/g, ""),
    };
  if (fact.id === "E1") return { label: "Calculation source", value: fact.statement };
  if (fact.id.startsWith("U")) return { label: "Birth-time limits", value: fact.statement };
  const match = fact.statement.match(/^([a-zA-Z_]+):\s*(.*)$/s);
  if (!match || match[1] === undefined || match[2] === undefined)
    return { label: "Supplied fact", value: fact.statement };
  const parsed = parseFactValue(match[2]);
  return { label: labelFor(match[1]), value: parsed.value, field: match[1], raw: parsed.raw };
}

export function PatternChapterEvidence({
  feature,
  facts,
  citations,
  evidenceAvailable,
  model,
  paragraphCount,
}: {
  feature: PatternFeature;
  facts: Fact[];
  citations: { paragraph: number; facts: string[] }[];
  evidenceAvailable: boolean;
  model: string | null;
  paragraphCount: number;
}) {
  const factId = (id: string) => `chapter-${feature.feature_key}-fact-${id}`;
  const safeFacts: Fact[] = Array.isArray(facts)
    ? facts.filter(
        (fact): fact is Fact =>
          Boolean(fact) &&
          typeof fact === "object" &&
          typeof fact.id === "string" &&
          typeof fact.statement === "string",
      )
    : [];
  const uniqueFacts = [...new Map(safeFacts.map((fact) => [fact.id, fact])).values()];
  const byId = new Map(uniqueFacts.map((fact) => [fact.id, fact]));
  const referenceLabels = new Map(
    uniqueFacts.map((fact, index) => [
      fact.id,
      `${describeFact(fact).label} · Reference ${index + 1}`,
    ]),
  );
  const visibleCitations = readableNarrativeCitations(citations).filter(
    (citation) => citation.paragraph <= paragraphCount,
  );
  return (
    <details className="pattern-chapter-evidence">
      <summary>Behind this chapter</summary>
      <div>
        {evidenceAvailable ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These are the facts supplied for this saved reading. A paragraph link names its
              sources. It does not prove every sentence.
            </p>
            {visibleCitations.length ? (
              <ol className="pattern-evidence-citations" aria-label="Sources by paragraph">
                {visibleCitations.map((citation, index) => (
                  <li key={`${citation.paragraph}-${index}`}>
                    <a
                      href={`#${chapterParagraphId(feature.feature_key, citation.paragraph)}`}
                      onClick={(event) => {
                        event.preventDefault();
                        focusEvidenceTarget(
                          chapterParagraphId(feature.feature_key, citation.paragraph),
                        );
                      }}
                    >
                      Paragraph {citation.paragraph}
                    </a>
                    <div>
                      {citation.facts.map((id) => {
                        const fact = byId.get(id);
                        return fact ? (
                          <a
                            key={id}
                            href={`#${factId(id)}`}
                            onClick={(event) => {
                              event.preventDefault();
                              focusEvidenceTarget(factId(id));
                            }}
                          >
                            {referenceLabels.get(id)}
                          </a>
                        ) : (
                          <span key={id}>Source unavailable</span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                No paragraph source links are available for the displayed reading.
                {uniqueFacts.length > 0 ? " Saved source facts are listed below." : null}
              </p>
            )}
            {uniqueFacts.length ? (
              <>
                <h4 className="mt-5 text-base">Facts behind the wording</h4>
                <ul className="pattern-evidence-facts">
                  {uniqueFacts.map((fact) => {
                    const described = describeFact(fact);
                    return (
                      <li id={factId(fact.id)} key={fact.id} tabIndex={-1}>
                        <h5>{referenceLabels.get(fact.id)}</h5>
                        <div>
                          <Value
                            value={described.value}
                            field={described.field ?? ""}
                            raw={described.raw ?? false}
                          />
                          {described.raw &&
                          typeof described.value === "string" &&
                          isTruncatedJson(described.value) ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              This recorded value was shortened when the chapter was saved.
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                No saved source facts are available for this reading.
              </p>
            )}
          </>
        ) : (
          <>
            <h4 className="text-base">Calculated values</h4>
            {feature.payload && typeof feature.payload === "object" ? (
              <Values payload={feature.payload} />
            ) : (
              <p>No calculated values are available.</p>
            )}
            {paragraphCount > 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                This older reading was saved before its source facts were retained. These values
                describe the current chart; paragraph source links are unavailable for that saved
                wording.
              </p>
            ) : null}
          </>
        )}
        {model ? <p className="mt-5 text-xs text-muted-foreground">Wording by {model}</p> : null}
      </div>
    </details>
  );
}
