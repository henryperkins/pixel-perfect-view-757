import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchPattern } from "@/lib/pattern.functions";
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

function PatternView({ data }: { data: PatternData }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div>
        <h1 className="text-3xl">Your pattern</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Chapters below come from structures actually present in the calculation. If a
          structure isn't there, nothing is written for it.
        </p>

        <div className="mt-8 space-y-3">
          {data.features.length === 0 ? (
            <p className="border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
              No structural patterns passed the strength threshold for this chart. That is a
              real result, not a loading state.
            </p>
          ) : null}
          {data.features.map((f) => (
            <article key={f.feature_key} className="border border-rule bg-card">
              <button
                type="button"
                onClick={() => setOpen(open === f.feature_key ? null : f.feature_key)}
                className="flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left"
              >
                <span>
                  <span className="technical text-muted-foreground">{f.family}</span>
                  <span className="mt-1 block font-serif text-lg">{f.title}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {Number(f.strength).toFixed(2)}
                </span>
              </button>
              {open === f.feature_key ? (
                <div className="border-t border-rule bg-evidence px-4 py-3">
                  <FeatureNarrative featureKey={f.feature_key} />
                  <pre className="mt-4 overflow-x-auto font-mono text-xs text-evidence-foreground">
                    {JSON.stringify(f.payload, null, 2)}
                  </pre>
                </div>
              ) : null}

            </article>
          ))}
        </div>

        <EphemerisNotice state={data.ephemeris} className="mt-10" />

        <section className="mt-12">
          <h2 className="technical text-muted-foreground">Placements</h2>
          <div className="mt-3 -mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[34rem] text-left font-mono text-xs">
              <tbody>
                {data.placements.map((p) => (
                  <tr key={p.key} className="border-b border-rule">
                    <td className="py-1.5 pr-3 whitespace-nowrap text-foreground">{p.label}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{p.position}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {p.angleDependent && !data.uncertainty.housesReliable
                        ? "house suppressed"
                        : p.house
                          ? `house ${p.house}`
                          : "—"}
                    </td>
                    <td className="py-1.5">{p.retrograde ? "Rx" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        <section className="mt-10">
          <h2 className="technical text-muted-foreground">Natal aspects</h2>
          <table className="mt-3 w-full text-left font-mono text-xs">
            <tbody>
              {data.aspects.map((a, i) => (
                <tr key={i} className="border-b border-rule">
                  <td className="py-1.5 pr-3 text-foreground">
                    {a.a} {a.aspect} {a.b}
                  </td>
                  <td className="py-1.5">{a.orb.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <Rail title="Calculation">
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
      </Rail>
    </div>
  );
}
