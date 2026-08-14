import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { useAuth } from "@/hooks/useAuth";
import { fetchToday, saveDailyCheckIn, sendFeedback } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Pattern" },
      {
        name: "description",
        content:
          "One calculated theme for today, the cycle behind it, and the exact facts it rests on.",
      },
      { property: "og:title", content: "Today — Pattern" },
      {
        property: "og:description",
        content:
          "One calculated theme for today, the cycle behind it, and the exact facts it rests on.",
      },
    ],
  }),
  component: TodayPage,
});

function localTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function TodayPage() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Shell signedIn={false}>
        <p className="technical text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  if (!session)
    return (
      <Shell signedIn={false}>
        <Landing />
      </Shell>
    );

  return (
    <Shell>
      <TodayReading />
    </Shell>
  );
}

function Landing() {
  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <h1 className="text-4xl leading-tight">
        Astrology that shows its work.
      </h1>
      <p className="prose-reading mt-6 text-foreground">
        Pattern calculates your chart from birth date, time and place, finds the cycles
        actually active today, and writes one theme at a time. Every paragraph opens to the
        bodies, aspect, orb and exact date it came from. Nothing is predicted; nothing is
        generated from a sun sign.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
        <li>· Unknown birth time is first class — angle claims get suppressed, not faked.</li>
        <li>· Context you opt into can rank a theme, never invent a chart fact.</li>
        <li>· Birth details, notes and readings are stored encrypted.</li>
      </ul>
      <Link
        to="/auth"
        className="mt-10 inline-flex rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Start with your chart
      </Link>
    </div>
  );
}

function BandPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-16 text-sm text-foreground">{label}</span>
      <div className="flex gap-1" role="group" aria-label={`${label} band`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            className={`h-8 w-8 rounded-sm border font-mono text-xs transition-colors ${
              value === n
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-card hover:bg-secondary"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="technical text-muted-foreground">{hint}</span>
    </div>
  );
}

function TodayReading() {

  const today = useServerFn(fetchToday);
  const feedback = useServerFn(sendFeedback);
  const checkIn = useServerFn(saveDailyCheckIn);
  const qc = useQueryClient();
  const [openEvidence, setOpenEvidence] = useState(false);
  const [note, setNote] = useState("");
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);

  const tz = localTz();
  const query = useQuery({
    queryKey: ["today", tz],
    queryFn: () => today({ data: { timezone: tz } }),
  });

  const wellness = query.data?.needsOnboarding ? null : (query.data?.wellness ?? null);
  const storedSleep = wellness?.sleep ?? null;
  const storedStress = wellness?.stress ?? null;
  const sleepValue = sleep ?? storedSleep;
  const stressValue = stress ?? storedStress;

  const rate = useMutation({
    mutationFn: (vars: { readingId: string; resonance: number }) =>
      feedback({ data: { readingId: vars.readingId, resonance: vars.resonance, labels: [] } }),
    onSuccess: () => toast.success("Noted. Feedback tunes ranking only."),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveNote = useMutation({
    mutationFn: (vars: { day: string }) =>
      checkIn({
        data: {
          day: vars.day,
          mood: null,
          energy: null,
          note: note.trim() || null,
          sleep: wellness?.sleepEnabled ? sleepValue : null,
          stress: wellness?.stressEnabled ? stressValue : null,
        },
      }),
    onSuccess: (res) => {
      const bands = [
        res.stored.sleep ? "sleep" : null,
        res.stored.stress ? "stress" : null,
      ].filter(Boolean);
      toast.success(
        bands.length
          ? `Saved (encrypted). ${bands.join(" and ")} recorded for ${wellness?.retentionDays ?? 180} days.`
          : "Reflection saved (encrypted).",
      );
      void qc.invalidateQueries({ queryKey: ["journal"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  if (query.isPending) {
    return <p className="technical text-muted-foreground">Calculating…</p>;
  }
  if (query.error) {
    return (
      <p className="text-sm text-destructive">
        Today's reading could not be calculated: {query.error.message}
      </p>
    );
  }

  const data = query.data;
  if (!data || data.needsOnboarding) {
    return (
      <div className="max-w-xl animate-rise">
        <h1 className="text-3xl">Your chart isn't calculated yet</h1>
        <p className="prose-reading mt-4 text-foreground">
          Pattern needs birth date, time and place before it can say anything specific.
          Unknown time is fine — the reading will label what it can't support.
        </p>
        <Link
          to="/onboarding"
          className="mt-8 inline-flex rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Enter birth details
        </Link>
      </div>
    );
  }

  const primary = data.cycles.find((c) => c.cycle_key === data.reading.primary_cycle_key);

  return (
    <div className="grid animate-rise gap-10 lg:grid-cols-[10rem_minmax(0,1fr)_14rem]">
      <Rail title="Reading">
        <Field label="Date" value={data.day} />
        <Field label="Zone" value={data.timezone} />
        <Field label="Confidence" value={data.reading.confidence} />
        <Field label="Content" value={data.reading.release_version} />
      </Rail>

      <article>
        <h1 className="text-3xl leading-snug">{data.reading.headline}</h1>

        {primary ? (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-rule py-3">
            <span className="technical text-muted-foreground">
              Phase · <span className="text-foreground">{primary.phase}</span>
            </span>
            <span className="technical text-muted-foreground">
              Orb · <span className="text-foreground">{primary.orb.toFixed(2)}°</span>
            </span>
            <span className="technical text-muted-foreground">
              Exact ·{" "}
              <span className="text-foreground">
                {primary.exact_at ? primary.exact_at.slice(0, 10) : "not in window"}
              </span>
            </span>
            <span className="technical text-muted-foreground">
              Domain · <span className="text-foreground">{primary.domain}</span>
            </span>
          </div>
        ) : null}

        <div className="prose-reading mt-6 space-y-5 text-foreground">
          {data.reading.body.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <EphemerisNotice state={data.ephemeris} className="mt-8" />

        <section className="mt-10 border-t border-rule pt-6">
          <h2 className="technical text-muted-foreground">Reflection</h2>
          <p className="prose-reading mt-2 text-foreground">{data.reading.prompt}</p>

          {(wellness?.sleepEnabled || wellness?.stressEnabled) && (
            <div className="mt-5 rounded-sm border border-rule bg-secondary/30 p-4">
              <p className="technical text-muted-foreground">
                Tier 3 · self-reported · kept {wellness.retentionDays} days
              </p>
              <div className="mt-3 space-y-3">
                {wellness.sleepEnabled && (
                  <BandPicker
                    label="Sleep"
                    hint="1 poor · 5 rested"
                    value={sleepValue}
                    onChange={setSleep}
                  />
                )}
                {wellness.stressEnabled && (
                  <BandPicker
                    label="Stress"
                    hint="1 calm · 5 pressed"
                    value={stressValue}
                    onChange={setStress}
                  />
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Framing and prompts only. These bands never enter the calculation or the
                ranking, and never leave your account.
              </p>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Optional. Stored encrypted; only used to weigh what to surface."
            className="mt-3 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <button
            type="button"
            disabled={saveNote.isPending}
            onClick={() => saveNote.mutate({ day: data.day })}
            className="mt-3 rounded-sm border border-input bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Save reflection
          </button>
        </section>

        <section className="mt-8 border-t border-rule pt-6">
          <button
            type="button"
            onClick={() => setOpenEvidence((v) => !v)}
            className="technical text-primary"
          >
            {openEvidence ? "Hide evidence & provenance" : "Evidence & provenance"}
          </button>

          {openEvidence ? (
            <div className="mt-4 space-y-6 bg-evidence p-4">
              <div>
                <h3 className="technical text-evidence-foreground">Celestial fact</h3>
                <table className="mt-2 w-full text-left font-mono text-xs">
                  <tbody>
                    {data.cycles.map((c) => (
                      <tr key={c.cycle_key} className="border-b border-rule">
                        <td className="py-1.5 pr-3">
                          {c.transit_body} {c.aspect} natal {c.natal_point}
                        </td>
                        <td className="py-1.5 pr-3">{c.orb.toFixed(2)}°</td>
                        <td className="py-1.5 pr-3">{c.phase}</td>
                        <td className="py-1.5">
                          {c.exact_at ? c.exact_at.slice(0, 10) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="technical text-evidence-foreground">
                  Sources behind this reading
                </h3>
                <ul className="mt-2 space-y-1.5 font-mono text-xs">
                  {data.provenance.map((p, i) => (
                    <li key={`${p.source_id}-${i}`} className="flex flex-wrap gap-x-3">
                      <span className="text-foreground">{p.source_id}</span>
                      <span>{p.label}</span>
                      <span className="text-muted-foreground">
                        [{p.lane === "context" || p.lane === "reflection"
                          ? "Your context"
                          : "Celestial fact"}
                        ]
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      </article>

      <Rail title="Technical">
        <Field
          label="Time accuracy"
          value={data.uncertainty?.accuracy ?? "unknown"}
        />
        <Field
          label="ASC spread"
          value={`${(data.uncertainty?.ascendantSpreadDeg ?? 0).toFixed(2)}°`}
        />
        <Field
          label="Houses"
          value={data.uncertainty?.housesReliable ? "usable" : "suppressed"}
        />
        <Field label="Cycles scanned" value={data.cycles.length} />
        <div className="pt-2">
          <p className="technical text-muted-foreground">Does this land?</p>
          <div className="mt-2 flex gap-2">
            {[
              { v: 1, label: "Yes" },
              { v: 0, label: "Unsure" },
              { v: -1, label: "No" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                disabled={rate.isPending}
                onClick={() =>
                  rate.mutate({ readingId: data.reading.id, resonance: o.v })
                }
                className="rounded-sm border border-input bg-card px-2.5 py-1 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </Rail>
    </div>
  );
}
