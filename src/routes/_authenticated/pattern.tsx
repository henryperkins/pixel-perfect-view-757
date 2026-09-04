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
          <h1 className="text-3xl">No chart yet</h1>
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

function PatternView({ data }: { data: PatternData }) {
  const [open, setOpen] = useState<string | null>(
    data.features[0]?.feature_key ?? null,
  );

  return (
    <div className="grid animate-rise gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl">Your pattern</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This page has three parts, in order: the <strong>chapters</strong> — structures
          the calculation actually found in your chart; your <strong>placements</strong> —
          where each body sat at your birth; and your <strong>connections</strong> — the
          angles between those bodies. Nothing here is written unless the calculation
          supports it, so empty space means "not present", not "still loading".
        </p>

        <section className="mt-8 sm:mt-10">
          <div className="grid gap-1 border-b border-rule pb-2 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="technical text-muted-foreground">
              1 · Chapters ({data.features.length})
            </h2>
            <span className="technical text-muted-foreground">
              strength = how defined the structure is (0–1)
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
                <article key={f.feature_key} className="border border-rule bg-card">
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
                      strength {Number(f.strength).toFixed(2)}
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


        <EphemerisNotice state={data.ephemeris} className="mt-10" />

        <section className="mt-12">
          <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
            2 · Placements
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Where each body sat at the moment of your birth. "Rx" means the body appeared to
            move backwards from Earth.
            {data.uncertainty.housesReliable
              ? " Houses are the area of life the body falls into."
              : " Houses are suppressed here because your birth time isn't precise enough to place them honestly."}
          </p>
          <div className="mt-4 -mx-6 overflow-x-auto px-6">
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

        <section className="mt-12">
          <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
            3 · Connections between bodies
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The angles your bodies make with each other. "Orb" is how far the angle is from
            exact — smaller means stronger.
          </p>
          <div className="mt-4 space-y-2">
            {data.aspects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No connections inside the orb limits for this chart.
              </p>
            ) : null}
            {data.aspects.map((a, i) => (
              <div
                key={i}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-2"
              >
                <span className="font-mono text-xs text-foreground">
                  {a.a} {a.aspect} {a.b}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  orb {a.orb.toFixed(2)}°
                </span>
                <span className="w-full text-sm text-muted-foreground sm:w-auto">
                  {ASPECT_MEANING[a.aspect] ?? "measured angle between the two bodies"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Rail title="How this was calculated">
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
        <p className="pt-2 text-sm text-muted-foreground">
          "Spread" is how much a value could move given the uncertainty in your birth time.
          A large spread is why some claims get suppressed.
        </p>
      </Rail>
    </div>
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
      <p className="mt-3 technical text-muted-foreground">
        {query.data.mode === "model"
          ? `Wording by ${query.data.model} · cites ${query.data.citations
              .map((c) => c.facts.join("+"))
              .join(" / ")}`
          : "Template wording"}
      </p>
    </div>
  );
}
