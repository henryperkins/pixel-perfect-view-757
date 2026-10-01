import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchFeatureNarrative, fetchPattern } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/_authenticated/pattern")({
  head: () => ({
    meta: [
      { title: "Your pattern — Pattern" },
      {
        name: "description",
        content:
          "Natal chapters derived from your calculated chart, each openable to its supporting facts.",
      },
      { property: "og:title", content: "Your pattern — Pattern" },
      {
        property: "og:description",
        content: "Placements, aspects and structural patterns — gaps stay visibly empty.",
      },
    ],
  }),
  component: PatternPage,
});

type PatternData = Extract<
  Awaited<ReturnType<typeof fetchPattern>>,
  { needsOnboarding: false }
>;

function PatternPage() {
  const load = useServerFn(fetchPattern);
  const query = useQuery({ queryKey: ["pattern"], queryFn: () => load({}) });

  return (
    <Shell>
      {query.isPending ? (
        <p className="technical text-muted-foreground">Loading chart…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">{query.error.message}</p>
      ) : !query.data || query.data.needsOnboarding ? (
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl">No chart yet</h1>
          <Link to="/onboarding" className="mt-6 inline-flex technical text-primary">
            Enter birth details
          </Link>
        </div>
      ) : (
        <PatternView data={query.data as PatternData} />
      )}
    </Shell>
  );
}

const ASPECT_MEANING: Record<string, string> = {
  conjunction: "same place in the sky — the two blend and act as one",
  opposition: "facing each other — a pull between two needs",
  square: "at right angles — friction that asks for a decision",
  trine: "in easy flow — capacity that comes naturally",
  sextile: "mild support — works when you reach for it",
};

const ASPECT_ORDER = ["conjunction", "opposition", "square", "trine", "sextile"];
const ASPECT_LABEL: Record<string, string> = {
  conjunction: "Blended",
  opposition: "Pulled apart",
  square: "Friction",
  trine: "Easy flow",
  sextile: "Light support",
};
const ASPECT_DEG: Record<string, number> = {
  conjunction: 0, opposition: 180, square: 90, trine: 120, sextile: 60,
};

function AngleGlyph({ kind }: { kind: string }) {
  const deg = ASPECT_DEG[kind] ?? 45;
  const r = 14;
  const rad = ((deg - 90) * Math.PI) / 180;
  const x = 18 + r * Math.cos(rad);
  const y = 18 + r * Math.sin(rad);
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0 text-foreground" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeOpacity="0.25" />
      <line x1="18" y1="18" x2="18" y2={18 - r} stroke="currentColor" />
      <line x1="18" y1="18" x2={x} y2={y} stroke="currentColor" />
      <circle cx="18" cy={18 - r} r="2.5" fill="currentColor" />
      <circle cx={x} cy={y} r="2.5" fill="currentColor" />
    </svg>
  );
}

function PatternView({ data }: { data: PatternData }) {
  const [open, setOpen] = useState<string | null>(
    data.features[0]?.feature_key ?? null,
  );

  return (
    <div className="grid animate-rise gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="flex min-w-0 flex-col">
        <h1 className="text-2xl sm:text-3xl">Your pattern</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This page has three parts, in order: the <strong>chapters</strong> — structures
          the calculation actually found in your chart; your <strong>placements</strong> —
          where each body sat at your birth; and your <strong>connections</strong> — the
          angles between those bodies. Nothing here is written unless the calculation
          supports it, so empty space means "not present", not "still loading".
        </p>

        <details className="order-5 mt-10 border border-rule bg-evidence p-4 sm:mt-12">
          <summary className="technical cursor-pointer text-primary">Your chart snapshot</summary>
          <div className="grid gap-1 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="technical mt-3 text-muted-foreground">Birth and calculation record</h2>
            <span className="flex gap-4">
              <Link to="/sources" className="technical text-primary">
                Sources
              </Link>
              <Link to="/birth" className="technical text-primary">
                Edit birth details
              </Link>
            </span>
          </div>
          {data.snapshot.birth ? (
            <p className="mt-2 font-mono text-xs leading-relaxed text-evidence-foreground">
              {data.snapshot.birth.birthDate} {data.snapshot.birth.birthTime} ·{" "}
              {data.snapshot.birth.placeLabel} · {data.snapshot.birth.timezone} · time accuracy{" "}
              {data.snapshot.birth.accuracy}
            </p>
          ) : (
            <p className="mt-2 text-sm text-evidence-foreground">
              No stored birth record for this snapshot.
            </p>
          )}
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
            {data.snapshot.engine} · houses {data.houseSystem} · precision{" "}
            {data.ephemeris.precision} · {data.snapshot.placementCount} placements ·{" "}
            {data.snapshot.aspectCount} connections · contract{" "}
            {data.snapshot.contractVersion}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {data.uncertainty.housesReliable
              ? "Your birth time is precise enough for house and angle claims."
              : "House and angle claims are suppressed because your birth time isn't precise enough."}
          </p>
        </details>

        {data.rising ? (
          <section className="order-3 mt-8 sm:mt-10">
            <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
              Your main lens · {data.rising.sign} rising
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
              The sign that was coming up over the horizon at your birth was{" "}
              <strong>{data.rising.sign}</strong>, at {data.rising.position}. That one
              measurement sets where every house falls, and the houses are what decide{" "}
              <em>which part of your life</em> a placement or a timing window actually
              touches. Everything below is arranged by it.
            </p>
            <details className="mt-5 border-y border-rule py-3">
              <summary className="technical cursor-pointer text-primary">Explore all 12 houses</summary>
              <ul className="mt-3">
                {data.rising.houses.map((h) => (
                <li
                  key={h.house}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-rule py-2.5"
                >
                  <span className="min-w-0 text-sm leading-snug text-foreground">
                    <span className="font-mono text-xs text-muted-foreground">
                      {h.house} · {h.sign}
                    </span>
                    <span className="mt-0.5 block">{h.area}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {h.bodies.length ? h.bodies.join(", ") : "empty"}
                  </span>
                </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                "Empty" means no body sat in that house at your birth — an ordinary result, not
                a missing area of life.
              </p>
            </details>
          </section>
        ) : (
          <section className="order-3 mt-8 border border-rule bg-evidence p-4 sm:mt-10">
            <h2 className="technical text-muted-foreground">Your main lens</h2>
            <p className="mt-2 text-sm leading-relaxed text-evidence-foreground">
              Your rising sign is the frame everything else hangs on, but it moves about a
              degree every four minutes — so it isn't shown here because your recorded birth
              time isn't precise enough to place it honestly.{" "}
              <Link to="/birth" className="text-primary">
                Sharpen your birth time
              </Link>{" "}
              and this section appears.
            </p>
          </section>
        )}

        {data.features.length > 0 ? (
          <section className="order-2 mt-8 sm:mt-10">
            <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
              What most shapes you
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The {Math.min(3, data.features.length)} strongest structures in your chart —
              the ones the calculation defines most sharply. Tap one to read it.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {data.features.slice(0, 3).map((f, i) => (
                <button
                  key={f.feature_key}
                  type="button"
                  onClick={() => {
                    setOpen(f.feature_key);
                    document
                      .getElementById(`chapter-${f.feature_key}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="border border-rule bg-card p-4 text-left transition-colors hover:bg-evidence"
                >
                  <span className="technical block text-muted-foreground">
                    {i + 1} · {f.family}
                  </span>
                  <span className="mt-2 block font-serif text-base leading-snug sm:text-lg">
                    {f.title}
                  </span>
                  <ChapterLead featureKey={f.feature_key} />
                  <span className="mt-2 block font-mono text-xs text-muted-foreground">
                    {strengthLabel(f)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}



          <section className="order-4 mt-8 sm:mt-10">
          <div className="grid gap-1 border-b border-rule pb-2 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="technical text-muted-foreground">
              1 · Chapters ({data.features.length})
            </h2>
            <span className="technical text-muted-foreground">
              ordered from most to least defining
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Open a chapter to read what the structure means and see the exact facts it was
            built from.
          </p>

          <div className="mt-5 space-y-3">
            {data.features.length === 0 ? (
              <p className="border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                No structural patterns passed the strength threshold for this chart. That is a
                real result, not a loading state — your placements and connections below are
                still complete.
              </p>
            ) : null}
            {data.features.map((f) => {
              const isOpen = open === f.feature_key;
              return (
                <article
                  key={f.feature_key}
                  id={`chapter-${f.feature_key}`}
                  className="scroll-mt-24 border border-rule bg-card"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : f.feature_key)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-2 px-4 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="technical block truncate text-muted-foreground">
                        {f.family}
                      </span>
                      <span className="mt-1 block font-serif text-base leading-snug sm:text-lg">
                        {f.title}
                      </span>
                    </span>
                    <span className="technical shrink-0 self-start text-muted-foreground">
                      {isOpen ? "Close" : "Read"}
                    </span>
                    <span className="col-span-2 font-mono text-xs text-muted-foreground sm:col-span-1 sm:col-start-1">
                      {strengthLabel(f)}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-rule bg-evidence px-4 py-3">
                      <FeatureNarrative featureKey={f.feature_key} />
                      <details className="mt-4">
                        <summary className="technical cursor-pointer text-muted-foreground">
                          Underlying calculated values
                        </summary>
                        <pre className="mt-3 -mx-1 overflow-x-auto px-1 font-mono text-xs text-evidence-foreground">
                          {JSON.stringify(f.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>


        <div className="order-6">
          <EphemerisNotice state={data.ephemeris} className="mt-8 sm:mt-10" />
        </div>

        <section className="order-7 mt-10 sm:mt-12">
          <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
            2 · Placements
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Where each body sat at the moment of your birth. "Rx" means the body appeared to
            move backwards from Earth.
            {data.uncertainty.housesReliable
              ? " Houses are the area of life the body falls into."
              : " Houses are suppressed here because your birth time isn't precise enough to place them honestly."}
          </p>

          {/* Mobile: one row per body, stacked so nothing needs horizontal scrolling */}
          <ul className="mt-4 sm:hidden">
            {data.placements.map((p) => {
              const house =
                p.angleDependent && !data.uncertainty.housesReliable
                  ? "suppressed"
                  : p.house
                    ? `house ${p.house}`
                    : "—";
              return (
                <li
                  key={p.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-rule py-2.5"
                >
                  <span className="min-w-0 truncate font-mono text-xs text-foreground">
                    {p.label}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-foreground">
                    {p.position}
                  </span>
                  <span className="technical text-muted-foreground">{house}</span>
                  <span className="technical shrink-0 text-muted-foreground">
                    {p.retrograde ? "Rx" : "direct"}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[34rem] text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-rule technical text-muted-foreground">
                  <th className="py-1.5 pr-3 font-normal">Body</th>
                  <th className="py-1.5 pr-3 font-normal">Sign &amp; degree</th>
                  <th className="py-1.5 pr-3 font-normal">House</th>
                  <th className="py-1.5 font-normal">Motion</th>
                </tr>
              </thead>
              <tbody>
                {data.placements.map((p) => (
                  <tr key={p.key} className="border-b border-rule">
                    <td className="py-1.5 pr-3 whitespace-nowrap text-foreground">{p.label}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{p.position}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {p.angleDependent && !data.uncertainty.housesReliable
                        ? "suppressed"
                        : p.house
                          ? `house ${p.house}`
                          : "—"}
                    </td>
                    <td className="py-1.5">{p.retrograde ? "Rx" : "direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="order-8 mt-10 sm:mt-12">
          <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
            3 · How your bodies connect
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pairs that interact. Fuller bar = tighter angle = stronger pull.
          </p>
          {data.aspects.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No connections inside the orb limits for this chart.
            </p>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {ASPECT_ORDER.filter((k) => data.aspects.some((a) => a.aspect === k))
                .concat(
                  [...new Set(data.aspects.map((a) => a.aspect))].filter(
                    (k) => !ASPECT_ORDER.includes(k),
                  ),
                )
                .map((kind) => {
                  const rows = data.aspects
                    .filter((a) => a.aspect === kind)
                    .sort((x, y) => x.orb - y.orb);
                  return (
                    <div key={kind} className="border-t border-foreground pt-3">
                      <div className="flex items-center gap-3">
                        <AngleGlyph kind={kind} />
                        <div className="min-w-0">
                          <p className="font-display text-base capitalize text-foreground">
                            {ASPECT_LABEL[kind] ?? kind}
                            <span className="ml-2 font-mono text-xs text-muted-foreground">
                              ×{rows.length}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ASPECT_MEANING[kind] ?? "measured angle between two bodies"}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {rows.map((a, i) => {
                          const pct = Math.max(8, Math.round((1 - Math.min(a.orb, 8) / 8) * 100));
                          return (
                            <li
                              key={i}
                              className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3"
                              title={`${bodyName(a.a)} ${a.aspect} ${bodyName(a.b)} · orb ${a.orb.toFixed(2)}°`}
                            >
                              <span className="truncate text-sm text-foreground">
                                {bodyName(a.a)} <span className="text-muted-foreground">·</span> {bodyName(a.b)}
                              </span>
                              <span
                                className="h-1.5 bg-muted"
                                aria-label={`orb ${a.orb.toFixed(2)} degrees`}
                              >
                                <span className="block h-full bg-foreground" style={{ width: `${pct}%` }} />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>

      <div className="border-t border-rule pt-6 lg:border-t-0 lg:pt-0">
        <Rail title="Chart at a glance">
          <Field label="Rising" value={data.rising?.sign ?? "suppressed"} />
          <Field label="Chapters" value={data.features.length} />
          <Field label="Placements" value={data.placements.length} />
          <Field label="Connections" value={data.aspects.length} />
          <details className="pt-3">
            <summary className="technical cursor-pointer text-muted-foreground">Calculation details</summary>
            <div className="mt-3 space-y-3">
          <Field label="Engine" value={data.engine} />
          <Field label="Precision" value={data.ephemeris.precision} />
          <Field label="Contract" value={data.contractVersion} />
          <Field label="Houses" value={data.houseSystem} />
          <Field label="Time accuracy" value={data.uncertainty.accuracy} />
          <Field
            label="ASC spread"
            value={`${data.uncertainty.ascendantSpreadDeg.toFixed(2)}°`}
          />
          <Field
            label="Moon spread"
            value={`${data.uncertainty.moonSpreadDeg.toFixed(2)}°`}
          />
          <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
            "Spread" is how much a value could move given the uncertainty in your birth time.
            A large spread is why some claims get suppressed.
          </p>
            </div>
          </details>
        </Rail>
      </div>
    </div>

  );
}


/**
 * Opening line of a chapter's essay, shown on the "What most shapes you"
 * cards. Shares the chapter query, so opening the chapter costs nothing extra.
 */
function ChapterLead({ featureKey }: { featureKey: string }) {
  const load = useServerFn(fetchFeatureNarrative);
  const query = useQuery({
    queryKey: ["feature-narrative", featureKey],
    queryFn: () => load({ data: { featureKey } }),
    staleTime: Infinity,
  });

  if (!query.data?.available) return null;
  const lead = query.data.narrative.split(/(?<=\.)\s/).slice(0, 2).join(" ");
  return (
    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
      {lead}
    </span>
  );
}

/**
 * Narrative for one chapter. Written by the language layer from the
 * structure's own calculated payload, verified claim-by-claim; when nothing
 * survives verification the chapter shows the facts alone rather than filler.
 */
function FeatureNarrative({ featureKey }: { featureKey: string }) {
  const load = useServerFn(fetchFeatureNarrative);
  const query = useQuery({
    queryKey: ["feature-narrative", featureKey],
    queryFn: () => load({ data: { featureKey } }),
    staleTime: Infinity,
  });

  if (query.isPending) {
    return <p className="technical text-muted-foreground">Writing this chapter…</p>;
  }
  if (query.error) {
    return (
      <p className="technical text-muted-foreground">
        Narrative unavailable: {query.error.message}
      </p>
    );
  }
  if (!query.data?.available) {
    return (
      <p className="technical text-muted-foreground">
        No narrative for this structure — {query.data?.reason ?? "nothing supportable to say"}.
        The facts below are the reading.
      </p>
    );
  }

  return (
    <div>
      <div className="prose-reading space-y-4 text-foreground">
        {query.data.narrative.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <details className="mt-3">
        <summary className="technical cursor-pointer text-muted-foreground">
          How this was written
        </summary>
        <p className="mt-2 technical text-muted-foreground">
          {query.data.mode === "model"
            ? `Wording by ${query.data.model} · cites ${query.data.citations
                .map((c) => c.facts.join("+"))
                .join(" / ")}`
            : "Template wording"}
        </p>
      </details>
    </div>
  );
}

const BODY_NAME: Record<string, string> = {
  node: "North Node", north_node: "North Node", true_node: "North Node", mean_node: "North Node",
  south_node: "South Node", ascendant: "Ascendant", midheaven: "Midheaven", chiron: "Chiron",
};
function strengthLabel(f: { family: string; strength: unknown; payload?: unknown }): string {
  if (f.family === "distribution") {
    const el = (f.payload as { elements?: Record<string, number> } | undefined)?.elements;
    if (el) {
      const vals = Object.values(el);
      const total = vals.reduce((a, b) => a + b, 0);
      const top = Math.max(...vals);
      return `${top} of ${total} bodies share this element`;
    }
  }
  const s = Number(f.strength);
  if (s >= 0.85) return "Core to your chart";
  if (s >= 0.6) return "Clearly present";
  if (s >= 0.4) return "Noticeable";
  return "In the background";
}
function bodyName(k: string): string {
  return BODY_NAME[k] ?? k.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
