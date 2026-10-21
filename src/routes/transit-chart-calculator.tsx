import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, CircleDot, Sunrise, Sunset } from "lucide-react";

import { SectionNav } from "@/components/pattern/SectionNav";
import { Shell } from "@/components/pattern/Shell";
import {
  contactTitle,
  DOMAIN_LABEL,
  PHASE_LABEL,
  pointName,
  STRENGTH_BANDS,
  weightLabel,
} from "@/components/pattern/timing";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  ASPECTS,
  birthTimeSupport,
  TIME_ACCURACY_LABEL,
  type AspectKey,
  type TimeAccuracy,
} from "@/lib/astro/chart";
import { checkContact } from "@/lib/astro/contact-check";
import {
  BODY_WEIGHT,
  DOMAIN_BY_TARGET,
  NATAL_TARGETS,
  SOFT_ASPECT_FACTOR,
  TARGET_WEIGHT,
  TRANSIT_BODIES,
  transitOrb,
  UNCERTAIN_ANGLE_FACTOR,
} from "@/lib/astro/cycles";
import { BODY_LABEL, SIGNS } from "@/lib/astro/ephemeris";
import { jsonLd, publicPageHead } from "@/lib/seo";

const TITLE = "Transit chart calculator that shows its math — Pattern";
const DESCRIPTION =
  "See which planets aspect your natal chart, when each contact opens, peaks and closes, and the orb and rule behind it. Check the arithmetic on any pair.";

// Every number on this page is read from the rules the app calculates with.
const deg = (value: number) => `${value.toFixed(2)}°`;
const names = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : (items[0] ?? "");
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const bodyName = (body: string) => BODY_LABEL[body as keyof typeof BODY_LABEL] ?? pointName(body);

function groupBy<T>(items: readonly T[], key: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return [...groups.values()];
}

// Aspects whose limits match for every body share a column; bodies that match share a row.
const ORB_COLUMNS = groupBy(ASPECTS, (a) => TRANSIT_BODIES.map((b) => transitOrb(b, a.key)).join());
const ORB_ROWS = groupBy(TRANSIT_BODIES, (b) =>
  ORB_COLUMNS.map((column) => transitOrb(b, column[0]!.key)).join(),
);
const LIMITS = TRANSIT_BODIES.flatMap((b) => ASPECTS.map((a) => transitOrb(b, a.key)));
const ACCURACIES = Object.keys(TIME_ACCURACY_LABEL) as TimeAccuracy[];
const EXAMPLE_LIMIT = transitOrb("saturn", "square");
const aspectAngle = (key: AspectKey) => ASPECTS.find((a) => a.key === key)!.angle;
const aspectFactor = (hard: boolean) => (hard ? 1 : SOFT_ASPECT_FACTOR);

function bandRange(index: number): ReactNode {
  const band = STRENGTH_BANDS[index]!;
  const above = STRENGTH_BANDS[index - 1];
  if (!above)
    return (
      <>
        <Measure>{band.min.toFixed(2)}</Measure> or more
      </>
    );
  if (band.min === 0)
    return (
      <>
        Under <Measure>{above.min.toFixed(2)}</Measure>
      </>
    );
  return (
    <>
      <Measure>{band.min.toFixed(2)}</Measure> to under <Measure>{above.min.toFixed(2)}</Measure>
    </>
  );
}

function angleContacts(accuracy: TimeAccuracy): ReactNode {
  const support = birthTimeSupport(accuracy);
  if (support.angleClaimsSuppressed) return "Left out";
  if (support.housesReliable) return "Full weight";
  return (
    <>
      Weighted ×<Measure>{UNCERTAIN_ANGLE_FACTOR.toFixed(2)}</Measure>
    </>
  );
}

const orbSummary = ORB_ROWS.map(
  (bodies) =>
    `${deg(transitOrb(bodies[0]!, ORB_COLUMNS[0]![0]!.key))} for ${names(bodies.map(bodyName))}`,
).join("; ");

const FAQ: { question: string; answer: string }[] = [
  {
    question: "What is a transit chart?",
    answer:
      "A transit chart lays the planets’ current positions over your natal chart, the sky at the time and place you were born. A transit is a moving planet at a set angle, called an aspect, to one of your natal points.",
  },
  {
    question: "When does Pattern count a transit?",
    answer: `When a moving body is within its orb limit of one of ${ASPECTS.length} aspects to a natal point. The limit is ${orbSummary}. The ${aspectAngle("quincunx")}° quincunx gets a narrower limit.`,
  },
  {
    question: "Do I need an exact birth time?",
    answer:
      "No. Pattern asks how accurate the time is. Within about 15 minutes, houses and angles are used. Within about an hour, house claims are suppressed and Ascendant and Midheaven contacts count for less. With an unknown time, Pattern assumes noon and leaves house and angle claims out. Contacts to the Sun, Moon and planets are still calculated, though the natal Moon moves about 13° a day, so its position can be several degrees off.",
  },
  {
    question: "Which house system and ephemeris does Pattern use?",
    answer:
      "Natal positions, Placidus houses and angles come from a Swiss Ephemeris service. If it is unavailable, an in-app approximate engine fills in and the reading says its precision is degraded. Day-to-day transit geometry comes from the in-app engine and is labelled approximate. When the day’s leading contact comes from Jupiter, Saturn, Uranus, Neptune or Pluto, its exact dates come from the Swiss Ephemeris service.",
  },
  {
    question: "Does Pattern predict what will happen?",
    answer:
      "No. A transit is described as a condition with a start, a peak and an end. Pattern never states what will happen.",
  },
  {
    question: "Is the reading written by AI?",
    answer:
      "The calculation never is. Google Gemini, through Gemini Enterprise or the Lovable AI gateway, may write the day’s reading from calculated facts and Pattern’s published interpretations. Paragraph links name the references supplied with the wording; they do not prove every sentence. Raw birth details are never sent to the language provider. If a draft fails Pattern’s checks, published standard wording is used instead. Each reading shows which wording you received.",
  },
  {
    question: "What happens to my birth details?",
    answer:
      "They are stored encrypted with your account and used to calculate your chart. You can export or erase them from Context & privacy.",
  },
];

export const Route = createFileRoute("/transit-chart-calculator")({
  head: () => ({
    ...publicPageHead({
      path: "/transit-chart-calculator",
      title: TITLE,
      description: DESCRIPTION,
    }),
    scripts: [
      jsonLd({
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }),
    ],
  }),
  component: TransitChartCalculatorPage,
});

function Measure({ children }: { children: ReactNode }) {
  return <span className="calculator-number">{children}</span>;
}

const LEDGER: { topic: string; horoscope: string; pattern: ReactNode }[] = [
  {
    topic: "Starts from",
    horoscope: "Your Sun sign, one of 12",
    pattern: "Your birth date, time and place",
  },
  { topic: "Written for", horoscope: "Everyone born under that sign", pattern: "Your chart alone" },
  {
    topic: "Compares",
    horoscope: "The sky against the sign as a whole",
    pattern: (
      <>
        <Measure>{TRANSIT_BODIES.length}</Measure> moving bodies against{" "}
        <Measure>{NATAL_TARGETS.length}</Measure> natal points, at{" "}
        <Measure>{ASPECTS.length}</Measure> angles
      </>
    ),
  },
  {
    topic: "Close enough",
    horoscope: "Anywhere in the sign’s 30°",
    pattern: (
      <>
        Within <Measure>{deg(Math.min(...LIMITS))}</Measure> to{" "}
        <Measure>{deg(Math.max(...LIMITS))}</Measure> of exact, set by body and aspect
      </>
    ),
  },
  {
    topic: "Timing",
    horoscope: "A day, week or month at a time",
    pattern: "Each contact dated: when it opens, is exact and closes",
  },
  {
    topic: "Birth time",
    horoscope: "Not needed",
    pattern: "Graded by accuracy; house and angle claims drop out when it can’t support them",
  },
  {
    topic: "What you see",
    horoscope: "Finished text",
    pattern: "The reading, with the engine, house system, orb and source behind it",
  },
  {
    topic: "Claims",
    horoscope: "A forecast for the sign",
    pattern: "Conditions that open, peak and close. Never a predicted event",
  },
];

function TransitChartCalculatorPage() {
  const { session } = useAuth();

  return (
    <Shell signedIn={Boolean(session)}>
      <div className="calculator-page">
        <section className="calculator-hero" aria-labelledby="calculator-title">
          <h1 id="calculator-title">A transit chart calculator that shows its math</h1>
          <p className="calculator-lede prose-reading mt-6 text-foreground">
            Pattern lays the sky today over the sky you were born under. Each contact it finds comes
            with its orb, the dates it opens, peaks and closes, and the rule that let it count.
          </p>
          <PrimaryAction signedIn={Boolean(session)} />
        </section>
        <Ledger />
        <ContactCheckSection />
        <SectionNav label="Calculation rules" links={RULES} className="calculator-contents" />
        <RuleSections />
        <section className="calculator-section" aria-labelledby="calculator-faq-title">
          <h2 id="calculator-faq-title" className="flow-section-title">
            Questions
          </h2>
          <div className="calculator-faq">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="calculator-close" aria-labelledby="calculator-close-title">
          <h2 id="calculator-close-title" className="flow-section-title">
            Calculate your own transits
          </h2>
          <p className="prose-reading mt-3 text-foreground">
            Add your birth date, time and place. Pattern calculates your chart, lists every active
            contact with its window, and writes one reading a day from the strongest.
          </p>
          <PrimaryAction signedIn={Boolean(session)} />
        </section>
      </div>
    </Shell>
  );
}

/** Wide tables scroll inside their column when enlarged text outgrows a phone screen. */
function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="calculator-table-scroll" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

function PrimaryAction({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="calculator-action">
      <Button asChild size="lg" className="landing-cta min-h-11">
        {signedIn ? (
          <Link to="/timing">
            Open your timing windows
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link to="/auth">
            Calculate your transits
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </Button>
      {signedIn ? null : (
        <p>
          Needs your birth date, time and place. Don’t know the time? Pattern leaves out what it
          can’t support.
        </p>
      )}
    </div>
  );
}

function Ledger() {
  const captionId = useId();
  return (
    <table className="calculator-ledger" role="table" aria-labelledby={captionId}>
      <caption id={captionId}>
        A sun-sign horoscope is the familiar text written for each of the 12 signs. Side by side
        with a Pattern transit chart:
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            <span className="sr-only">Compared on</span>
          </th>
          <th role="columnheader" scope="col" className="is-horoscope">
            Sun-sign horoscope
          </th>
          <th role="columnheader" scope="col" className="is-pattern">
            Pattern transit chart
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {LEDGER.map((row) => (
          <tr role="row" key={row.topic}>
            <th role="rowheader" scope="row">
              {row.topic}
            </th>
            <td role="cell" className="is-horoscope" data-label="Sun-sign horoscope">
              {row.horoscope}
            </td>
            <td role="cell" className="is-pattern" data-label="Pattern transit chart">
              {row.pattern}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Position = { sign: number; degrees: string; minutes: string };

const whole = (text: string, max: number) => {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
};
const longitude = (p: Position) => p.sign * 30 + whole(p.degrees, 29) + whole(p.minutes, 59) / 60;
const positionText = (p: Position) =>
  `${whole(p.degrees, 29)}°${String(whole(p.minutes, 59)).padStart(2, "0")}′ ${SIGNS[p.sign]}`;

function ContactCheckSection() {
  const [body, setBody] = useState("saturn");
  const [bodyAt, setBodyAt] = useState<Position>({ sign: 0, degrees: "12", minutes: "30" });
  const [point, setPoint] = useState("sun");
  const [pointAt, setPointAt] = useState<Position>({ sign: 9, degrees: "14", minutes: "0" });
  const [accuracy, setAccuracy] = useState<TimeAccuracy>("exact");
  const [edited, setEdited] = useState(false);
  const angle = point === "ascendant" || point === "midheaven";
  const result = checkContact({
    body,
    bodyLongitude: longitude(bodyAt),
    point,
    pointLongitude: longitude(pointAt),
    accuracy: angle ? accuracy : "exact",
  });
  const f = result.factors;
  const edit =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setEdited(true);
    };
  const value = (text: string) => (
    <span key={text} className={edited ? "calculator-number is-updated" : "calculator-number"}>
      {text}
    </span>
  );

  let headline = contactTitle(body, result.aspect, point);
  let context = `${DOMAIN_LABEL[DOMAIN_BY_TARGET[point] ?? ""] ?? ""} · ${weightLabel(result.importance ?? 0)} window`;
  if (!result.inOrb) {
    headline = "Not a contact";
    context = `${bodyName(body)} sits ${deg(result.orb)} from a ${result.aspect}, wider than its ${deg(result.limit)} limit.`;
  } else if (result.suppressed) {
    headline = "Left out";
    context =
      "Ascendant and Midheaven contacts need a known birth time, so Pattern skips this one.";
  }

  return (
    <section className="calculator-section" aria-labelledby="calculator-check-title">
      <h2 id="calculator-check-title" className="flow-section-title">
        Check one contact
      </h2>
      <p className="calculator-section-intro prose-reading">
        Place a moving body and a natal point anywhere in the zodiac. The page runs the check
        Pattern runs for every pair in your chart, with the same limits and weights. Nothing you
        enter leaves this page.
      </p>
      <div className="calculator-check">
        <form className="calculator-inputs" onSubmit={(event) => event.preventDefault()}>
          <fieldset>
            <legend>Moving body</legend>
            <Field label="Body">
              {(id) => (
                <div className="calculator-select">
                  <select
                    id={id}
                    className="calculator-control"
                    value={body}
                    onChange={(event) => edit(setBody)(event.target.value)}
                  >
                    {TRANSIT_BODIES.map((key) => (
                      <option key={key} value={key}>
                        {bodyName(key)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </div>
              )}
            </Field>
            <PositionFields label="Moving body" value={bodyAt} onChange={edit(setBodyAt)} />
          </fieldset>
          <fieldset>
            <legend>Natal point</legend>
            <Field label="Point">
              {(id) => (
                <div className="calculator-select">
                  <select
                    id={id}
                    className="calculator-control"
                    value={point}
                    onChange={(event) => edit(setPoint)(event.target.value)}
                  >
                    {NATAL_TARGETS.map((key) => (
                      <option key={key} value={key}>
                        {pointName(key)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </div>
              )}
            </Field>
            <PositionFields label="Natal point" value={pointAt} onChange={edit(setPointAt)} />
            {angle ? (
              <Field label="Birth time" className="mt-4">
                {(id) => (
                  <div className="calculator-select">
                    <select
                      id={id}
                      className="calculator-control"
                      value={accuracy}
                      onChange={(event) => edit(setAccuracy)(event.target.value as TimeAccuracy)}
                    >
                      {ACCURACIES.map((key) => (
                        <option key={key} value={key}>
                          {TIME_ACCURACY_LABEL[key]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </div>
                )}
              </Field>
            ) : null}
          </fieldset>
        </form>
        <div className="calculator-working">
          <div aria-live="polite">
            <p className="calculator-result-title">{headline}</p>
            <p className="calculator-result-context">{context}</p>
          </div>
          <ol className="calculator-steps" aria-label="Working">
            <li>
              <span className="calculator-step-label">Moving body</span>
              {value(deg(longitude(bodyAt)))}
              <span className="calculator-step-detail">
                {bodyName(body)} at {positionText(bodyAt)}
              </span>
            </li>
            <li>
              <span className="calculator-step-label">Natal point</span>
              {value(deg(longitude(pointAt)))}
              <span className="calculator-step-detail">
                {pointName(point)} at {positionText(pointAt)}
              </span>
            </li>
            <li>
              <span className="calculator-step-label">Separation</span>
              {value(deg(result.separation))}
              <span className="calculator-step-detail">The shorter way round the zodiac</span>
            </li>
            <li>
              <span className="calculator-step-label">Nearest aspect</span>
              {value(`${result.aspectAngle}°`)}
              <span className="calculator-step-detail">{capitalize(result.aspect)}</span>
            </li>
            <li>
              <span className="calculator-step-label">Orb</span>
              {value(deg(result.orb))}
              <span className="calculator-step-detail">
                {result.inOrb ? "Inside" : "Outside"} the {deg(result.limit)} limit for{" "}
                {bodyName(body)} at a {result.aspect}
              </span>
            </li>
            <li>
              <span className="calculator-step-label">Strength</span>
              {value(result.importance === null ? "—" : result.importance.toFixed(2))}
              <span className="calculator-step-detail">
                {result.importance === null
                  ? result.inOrb
                    ? "Not ranked: angle contacts need a known birth time"
                    : "Only contacts inside the limit are ranked"
                  : `${bodyName(body)} ${f.body.toFixed(2)} × ${pointName(point)} ${f.target.toFixed(2)} × closeness ${f.closeness.toFixed(2)} × ${result.aspect} ${f.aspect.toFixed(2)}${angle ? ` × birth time ${f.angle.toFixed(2)}` : ""}`}
              </span>
            </li>
          </ol>
          <p className="calculator-footnote">
            Dates and phase depend on how the planets move, so they come from the full calculation
            once your birth details are in.
          </p>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={`calculator-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  );
}

function PositionFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Position;
  onChange: (value: Position) => void;
}) {
  return (
    <div className="calculator-position" role="group" aria-label={`${label} position`}>
      <Field label="Sign">
        {(id) => (
          <div className="calculator-select">
            <select
              id={id}
              className="calculator-control"
              value={value.sign}
              onChange={(event) => onChange({ ...value, sign: Number(event.target.value) })}
            >
              {SIGNS.map((sign, index) => (
                <option key={sign} value={index}>
                  {sign}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        )}
      </Field>
      <Field label="Degrees">
        {(id) => (
          <input
            id={id}
            className="calculator-control"
            type="number"
            inputMode="numeric"
            min={0}
            max={29}
            step={1}
            value={value.degrees}
            onChange={(event) => onChange({ ...value, degrees: event.target.value })}
            onBlur={() => onChange({ ...value, degrees: String(whole(value.degrees, 29)) })}
          />
        )}
      </Field>
      <Field label="Minutes">
        {(id) => (
          <input
            id={id}
            className="calculator-control"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step={1}
            value={value.minutes}
            onChange={(event) => onChange({ ...value, minutes: event.target.value })}
            onBlur={() => onChange({ ...value, minutes: String(whole(value.minutes, 59)) })}
          />
        )}
      </Field>
    </div>
  );
}

// Shortcuts below the check; the hero and ledger keep the first viewport.
const RULES = [
  { href: "#calculator-compared", text: "What gets compared" },
  { href: "#calculator-orbs", text: "How close counts" },
  { href: "#calculator-window", text: "When it opens, peaks and closes" },
  { href: "#calculator-strength", text: "How contacts are ranked" },
  { href: "#calculator-sources", text: "Birth time and sources" },
  { href: "#calculator-faq-title", text: "Questions" },
] as const;

const PHASES = [
  { key: "building", Icon: Sunrise },
  { key: "exact", Icon: CircleDot },
  { key: "fading", Icon: Sunset },
] as const;

function RuleSections() {
  return (
    <>
      <section className="calculator-section" aria-labelledby="calculator-compared">
        <h2 id="calculator-compared" className="flow-section-title">
          What gets compared
        </h2>
        <p className="calculator-section-intro prose-reading">
          Each day Pattern takes the positions of {TRANSIT_BODIES.length} moving bodies and checks
          every one against {NATAL_TARGETS.length} points in your natal chart. A pair counts as a
          transit when the angle between them is close to one of {ASPECTS.length} aspects. Each day
          is measured at noon in your time zone, or in UTC if you haven’t shared one.
        </p>
        <div className="calculator-columns">
          <dl className="calculator-lists">
            <div>
              <dt>Moving bodies</dt>
              <dd>{names(TRANSIT_BODIES.map(bodyName))}</dd>
            </div>
            <div>
              <dt>Natal points</dt>
              <dd>{names(NATAL_TARGETS.map(pointName))}</dd>
            </div>
          </dl>
          <TableScroll label="Aspects">
            <table className="calculator-table">
              <caption>Aspects</caption>
              <thead>
                <tr>
                  <th scope="col">Aspect</th>
                  <th scope="col" className="is-number">
                    Angle
                  </th>
                  <th scope="col" className="is-number">
                    Strength factor
                  </th>
                </tr>
              </thead>
              <tbody>
                {ASPECTS.map((aspect) => (
                  <tr key={aspect.key}>
                    <th scope="row">{capitalize(aspect.key)}</th>
                    <td className="is-number calculator-number">{aspect.angle}°</td>
                    <td className="is-number calculator-number">
                      {aspectFactor(aspect.hard).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      </section>

      <section className="calculator-section" aria-labelledby="calculator-orbs">
        <h2 id="calculator-orbs" className="flow-section-title">
          How close counts
        </h2>
        <p className="calculator-section-intro prose-reading">
          The orb is how far a pair sits from its aspect’s exact angle. Pattern counts a contact
          only inside these limits. Slower bodies get a little more room, the Moon less, and the
          quincunx less than half.
        </p>
        <TableScroll label="Orb limits">
          <table className="calculator-table calculator-table-wide calculator-orb-table">
            <caption>Orb limits</caption>
            <thead>
              <tr>
                <th scope="col">Moving body</th>
                {ORB_COLUMNS.map((column) => (
                  <th scope="col" className="is-number" key={column[0]!.key}>
                    {capitalize(names(column.map((a) => a.key)))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORB_ROWS.map((bodies) => (
                <tr key={bodies.join()}>
                  <th scope="row">{names(bodies.map(bodyName))}</th>
                  {ORB_COLUMNS.map((column) => (
                    <td className="is-number calculator-number" key={column[0]!.key}>
                      {deg(transitOrb(bodies[0]!, column[0]!.key))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </section>

      <section className="calculator-section" aria-labelledby="calculator-window">
        <h2 id="calculator-window" className="flow-section-title">
          When it opens, peaks and closes
        </h2>
        <p className="calculator-section-intro prose-reading">
          A transit is a window, not a day. Pattern scans backward and forward to find when the orb
          first falls inside its limit, the closest pass, and when it leaves again. The phase
          follows the date of the closest pass.
        </p>
        <figure className="calculator-window">
          <div className="timing-timeline">
            <div className="timing-timeline-legend" aria-hidden="true">
              <span>
                <span className="timing-legend-dot" />
                Today
              </span>
              <span>
                <span className="timing-legend-tick" />
                Closest pass
              </span>
            </div>
            <div
              className="timing-arc"
              role="img"
              aria-label="Example window: today is about a third of the way through, before the closest pass at the midpoint."
            >
              <span className="timing-arc-fill" style={{ width: "32%" }} />
              <span className="timing-today-marker" style={{ left: "32%" }} />
              <span className="timing-exact-marker" style={{ left: "50%" }} />
            </div>
            <dl className="timing-milestones">
              <div>
                <dt>Opens</dt>
                <dd>
                  Orb falls to <Measure>{deg(EXAMPLE_LIMIT)}</Measure>
                </dd>
              </div>
              <div>
                <dt>Closest pass</dt>
                <dd>Smallest orb</dd>
              </div>
              <div>
                <dt>Closes</dt>
                <dd>
                  Orb back past <Measure>{deg(EXAMPLE_LIMIT)}</Measure>
                </dd>
              </div>
            </dl>
          </div>
          <figcaption>
            An example window for {contactTitle("saturn", "square", "sun")}. In Pattern each marker
            carries its date.
          </figcaption>
        </figure>
        <ul className="calculator-phases">
          {PHASES.map(({ key, Icon }) => (
            <li key={key}>
              <Icon aria-hidden="true" />
              <p className="calculator-phase-name">{PHASE_LABEL[key].label}</p>
              <p>{PHASE_LABEL[key].help}</p>
            </li>
          ))}
        </ul>
        <p className="calculator-section-note">
          Jupiter, Saturn, Uranus, Neptune and Pluto can turn retrograde and cross the same point
          again. When the day’s leading contact comes from one of them and your birth time is known,
          Pattern numbers each crossing (contact 2 of 3, say) and marks the stretch between
          crossings.
        </p>
      </section>

      <section className="calculator-section" aria-labelledby="calculator-strength">
        <h2 id="calculator-strength" className="flow-section-title">
          How contacts are ranked
        </h2>
        <p className="calculator-section-intro prose-reading">
          Strength decides which contact leads your day. Slow movers and your Sun, Moon and angles
          weigh most, and a contact grows stronger as its orb closes.
        </p>
        <p className="calculator-formula">
          strength = body weight × point weight × closeness × aspect factor
          <br />
          closeness = 1 − orb ÷ limit
          <br />
          aspect factor = {aspectFactor(true).toFixed(2)} for{" "}
          {names(ASPECTS.filter((a) => a.hard).map((a) => a.key))}; {aspectFactor(false).toFixed(2)}{" "}
          for {names(ASPECTS.filter((a) => !a.hard).map((a) => a.key))}
          <br />
          Ascendant and Midheaven × {UNCERTAIN_ANGLE_FACTOR.toFixed(2)} when the birth time is only
          known to the hour
        </p>
        <div className="calculator-columns calculator-columns-three">
          <TableScroll label="Body weights">
            <table className="calculator-table">
              <caption>Body weights</caption>
              <thead>
                <tr>
                  <th scope="col">Moving body</th>
                  <th scope="col" className="is-number">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {TRANSIT_BODIES.map((key) => (
                  <tr key={key}>
                    <th scope="row">{bodyName(key)}</th>
                    <td className="is-number calculator-number">
                      {(BODY_WEIGHT[key] ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <TableScroll label="Point weights">
            <table className="calculator-table">
              <caption>Point weights</caption>
              <thead>
                <tr>
                  <th scope="col">Natal point</th>
                  <th scope="col">Area</th>
                  <th scope="col" className="is-number">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {NATAL_TARGETS.map((key) => (
                  <tr key={key}>
                    <th scope="row">{pointName(key)}</th>
                    <td>{DOMAIN_LABEL[DOMAIN_BY_TARGET[key] ?? ""]}</td>
                    <td className="is-number calculator-number">
                      {(TARGET_WEIGHT[key] ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <TableScroll label="Strength labels">
            <table className="calculator-table">
              <caption>Strength labels</caption>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col" className="is-number">
                    Strength
                  </th>
                </tr>
              </thead>
              <tbody>
                {STRENGTH_BANDS.map((band, index) => (
                  <tr key={band.label}>
                    <th scope="row">{band.label}</th>
                    <td className="is-number">{bandRange(index)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      </section>

      <section className="calculator-section" aria-labelledby="calculator-sources">
        <h2 id="calculator-sources" className="flow-section-title">
          Birth time and sources
        </h2>
        <p className="calculator-section-intro prose-reading">
          Unknown or approximate birth times are normal. Pattern grades what the time can support
          and suppresses the claims that depend on it rather than softening them.
        </p>
        <TableScroll label="What each birth-time setting supports">
          <table className="calculator-table calculator-table-wide">
            <caption>What each birth-time setting supports</caption>
            <thead>
              <tr>
                <th scope="col">Birth time</th>
                <th scope="col">House claims</th>
                <th scope="col">Ascendant and Midheaven contacts</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACIES.map((key) => (
                <tr key={key}>
                  <th scope="row">{TIME_ACCURACY_LABEL[key]}</th>
                  <td>{birthTimeSupport(key).housesReliable ? "Supported" : "Suppressed"}</td>
                  <td>{angleContacts(key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <dl className="calculator-sources">
          <div>
            <dt>Your natal chart</dt>
            <dd>
              Positions, Placidus houses and angles come from a Swiss Ephemeris service. If it is
              unavailable, an in-app approximate engine fills in and the reading says its precision
              is degraded.
            </dd>
          </div>
          <div>
            <dt>Today’s geometry</dt>
            <dd>
              Transit positions and orbs come from the in-app analytical engine, labelled
              approximate on every reading.
            </dd>
          </div>
          <div>
            <dt>Exact dates for slow planets</dt>
            <dd>
              When the day’s leading contact comes from Jupiter to Pluto and your birth time is
              known, its dates come from the Swiss Ephemeris service, checked at your recorded time
              and at both ends of its uncertainty. Pattern names an exact day only when all three
              agree; otherwise the in-app dates stand.
            </dd>
          </div>
          <div>
            <dt>Source code</dt>
            <dd>
              The ephemeris service’s{" "}
              <a href="https://pattern-transit-calc.fly.dev/source">calculation source code</a>,
              including its pinned ephemeris files, is published under the GNU Affero General Public
              License.
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
