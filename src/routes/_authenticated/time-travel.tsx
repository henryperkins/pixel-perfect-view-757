import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchCycles, fetchJournal } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/_authenticated/time-travel")({
  head: () => ({
    meta: [
      { title: "Time travel — Pattern" },
      {
        name: "description",
        content:
          "Reconstruct the cycle state for any date and compare it against today's calculation.",
      },
      { property: "og:title", content: "Time travel — Pattern" },
      {
        property: "og:description",
        content:
          "Retrospective reconstruction is labelled separately from context you saved at the time.",
      },
    ],
  }),
  component: TimeTravelPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TimeTravelPage() {
  const load = useServerFn(fetchCycles);
  const journalFn = useServerFn(fetchJournal);
  const [date, setDate] = useState(todayISO());
  const [applied, setApplied] = useState(todayISO());

  const past = useQuery({
    queryKey: ["cycles", applied],
    queryFn: () => load({ data: { day: applied } }),
  });
  const now = useQuery({
    queryKey: ["cycles", todayISO()],
    queryFn: () => load({ data: { day: todayISO() } }),
  });
  const journal = useQuery({ queryKey: ["journal"], queryFn: () => journalFn({}) });

  const pastData = past.data && !past.data.needsOnboarding ? past.data : null;
  const nowData = now.data && !now.data.needsOnboarding ? now.data : null;

  const savedCheckIn = journal.data?.checkIns.find((c) => c.day === applied) ?? null;
  const savedEvents = journal.data?.events.filter((e) => e.occurred_on === applied) ?? [];

  const nowKeys = new Set((nowData?.cycles ?? []).map((c) => c.cycle_key));

  return (
    <Shell>
      {past.isPending ? (
        <p className="technical text-muted-foreground">Reconstructing…</p>
      ) : past.error ? (
        <p className="text-sm text-destructive">{past.error.message}</p>
      ) : !pastData ? (
        <div className="max-w-xl">
          <h1 className="text-3xl">No chart yet</h1>
          <Link to="/onboarding" className="mt-6 inline-flex technical text-primary">
            Enter birth details
          </Link>
        </div>
      ) : (
        <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <h1 className="text-3xl">Time travel</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Pick a date. Pattern recomputes the sky for that day from the same chart
              snapshot. Reconstruction is not memory — anything you actually saved is
              labelled as such.
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="technical text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
                />
              </label>
              <button
                type="button"
                onClick={() => setApplied(date)}
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Reconstruct
              </button>
            </div>

            <section className="mt-8">
              <h2 className="technical text-muted-foreground">
                Reconstructed cycle state · {pastData.day}
              </h2>
              <div className="mt-3 -mx-6 overflow-x-auto px-6">
                <table className="w-full min-w-[38rem] text-left font-mono text-xs">
                  <tbody>
                    {pastData.cycles.slice(0, 15).map((c) => (
                      <tr key={c.cycle_key} className="border-b border-rule">
                        <td className="py-1.5 pr-3 whitespace-nowrap text-foreground">
                          {c.transit_body} {c.aspect} natal {c.natal_point}
                        </td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{c.phase}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{c.orb.toFixed(2)}°</td>
                        <td className="py-1.5 whitespace-nowrap">
                          {nowKeys.has(c.cycle_key) ? "still active today" : "closed since"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </section>

            <section className="mt-10">
              <h2 className="technical text-muted-foreground">
                Saved context for that day
              </h2>
              {savedCheckIn || savedEvents.length ? (
                <div className="mt-3 space-y-2 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                  {savedCheckIn ? (
                    <p>
                      Check-in — mood {savedCheckIn.mood ?? "—"}, energy{" "}
                      {savedCheckIn.energy ?? "—"}
                      {savedCheckIn.note ? `: ${savedCheckIn.note}` : ""}
                    </p>
                  ) : null}
                  {savedEvents.map((e) => (
                    <p key={e.id}>
                      Marked moment ({e.domain}) — {e.label}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                  Nothing was saved on {applied}. Everything above is retrospective
                  reconstruction only.
                </p>
              )}
            </section>
          </div>

          <Rail title="Comparison">
            <Field label="Reconstructed" value={pastData.day} />
            <Field label="Today" value={nowData?.day ?? "—"} />
            <Field label="Then" value={pastData.cycles.length} />
            <Field label="Now" value={nowData?.cycles.length ?? "—"} />
            <Field label="Engine" value={pastData.engine} />
            <Field label="Precision" value={pastData.ephemeris.precision} />
            <Field label="Contract" value={pastData.contractVersion} />
          </Rail>
        </div>
      )}
    </Shell>
  );
}
