import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchCycles } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/_authenticated/timing")({
  head: () => ({
    meta: [
      { title: "Timing — Pattern" },
      {
        name: "description",
        content:
          "Active and upcoming cycles with ingress, exact passes, egress and phase, filterable by domain.",
      },
      { property: "og:title", content: "Timing — Pattern" },
      {
        property: "og:description",
        content: "Every window shows calculation status and last refresh.",
      },
    ],
  }),
  component: TimingPage,
});

const DOMAINS = ["all", "identity", "relationships", "work", "inner-life", "structure"] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TimingPage() {
  const load = useServerFn(fetchCycles);
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("all");
  const [slowOnly, setSlowOnly] = useState(false);
  const day = todayISO();

  const query = useQuery({
    queryKey: ["cycles", day],
    queryFn: () => load({ data: { day } }),
  });

  const data = query.data && !query.data.needsOnboarding ? query.data : null;
  const rows = (data?.cycles ?? []).filter((c) => {
    if (domain !== "all" && c.domain !== domain) return false;
    if (slowOnly && ["moon", "sun", "mercury", "venus"].includes(c.transit_body)) return false;
    return true;
  });

  return (
    <Shell>
      {query.isPending ? (
        <p className="technical text-muted-foreground">Scanning cycles…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">{query.error.message}</p>
      ) : !data ? (
        <div className="max-w-xl">
          <h1 className="text-3xl">No chart yet</h1>
          <Link to="/onboarding" className="mt-6 inline-flex technical text-primary">
            Enter birth details
          </Link>
        </div>
      ) : (
        <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <h1 className="text-3xl">Timing</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Windows, not days. Each row is a real transit arc with the dates it opens,
              perfects and closes.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomain(d)}
                  className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                    domain === d
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-input bg-card hover:bg-secondary"
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSlowOnly((v) => !v)}
                className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                  slowOnly
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-input bg-card hover:bg-secondary"
                }`}
              >
                slow movers only
              </button>
            </div>

            <div className="mt-6 -mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[46rem] text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="py-2 pr-3 technical text-muted-foreground">Cycle</th>
                    <th className="py-2 pr-3 technical text-muted-foreground">Phase</th>
                    <th className="py-2 pr-3 technical text-muted-foreground">Opens</th>
                    <th className="py-2 pr-3 technical text-muted-foreground">Exact</th>
                    <th className="py-2 pr-3 technical text-muted-foreground">Closes</th>
                    <th className="py-2 technical text-muted-foreground">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.cycle_key} className="border-b border-rule">
                      <td className="py-2 pr-3 whitespace-nowrap text-foreground">
                        {c.transit_body} {c.aspect} natal {c.natal_point}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{c.phase}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {c.ingress_at?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {c.exact_at?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {c.egress_at?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="py-2 whitespace-nowrap">{c.importance.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <p className="mt-4 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                Nothing active in that filter. An empty window is a valid result.
              </p>
            ) : null}
          </div>

          <Rail title="Calculation status">
            <Field label="Reference day" value={data.day} />
            <Field label="Engine" value={data.engine} />
            <Field label="Precision" value={data.ephemeris.precision} />
            <Field label="Contract" value={data.contractVersion} />
            <Field label="Refreshed" value={data.computedAt.slice(11, 19) + "Z"} />
            <Field label="Rows" value={`${rows.length}/${data.cycles.length}`} />
            <Field label="Time accuracy" value={data.uncertainty.accuracy} />
          </Rail>
        </div>
      )}
    </Shell>
  );
}
