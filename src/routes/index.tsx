import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight } from "lucide-react";
import celestialScene from "@/assets/celestial-browsing.jpg";
import { CelestialScene } from "@/components/pattern/CelestialScene";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarQueryRefresh, useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { daysToLocalDate } from "@/lib/local-day";
import { timingDate } from "@/components/pattern/timing";
import { fetchJournal, fetchToday, saveDailyCheckIn, sendFeedback } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <TodayReading key={session.userId} accountId={session.userId} />
    </Shell>
  );
}

function Landing() {
  return (
    <div>
      <CelestialScene src={celestialScene}>
        <div className="landing-copy">
          <h1 className="leading-tight">Astrology that shows its work.</h1>
          <p className="prose-reading mt-6 text-foreground">
            Pattern calculates your chart from birth date, time and place, finds the cycles actually
            active today, and writes one theme at a time. Every paragraph opens to the bodies,
            aspect, orb and exact date it came from. Nothing is predicted; nothing is generated from
            a sun sign.
          </p>
          <Button asChild size="lg" className="landing-cta mt-8">
            <Link to="/auth">
              Start with your chart
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CelestialScene>
      <ul className="landing-foundations grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
        <li>· Unknown birth time is first class — angle claims get suppressed, not faked.</li>
        <li>· Context you opt into can rank a theme, never invent a chart fact.</li>
        <li>· Birth details, notes and readings are stored encrypted.</li>
      </ul>
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
          <Button
            variant="outline"
            size="icon"
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            className={`h-9 w-9 rounded-md border font-mono text-xs ${
              value === n
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                : "border-input bg-card hover:bg-secondary"
            }`}
          >
            {n}
          </Button>
        ))}
      </div>
      <span className="technical text-muted-foreground">{hint}</span>
    </div>
  );
}

type CheckInValues = {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  stress: number | null;
  note: string | null;
};
type CheckInDraft = Omit<CheckInValues, "note"> & { note: string };
type TodayWellness = CheckInValues & {
  savedAt: string | null;
  sleepEnabled: boolean;
  stressEnabled: boolean;
  retentionDays: number;
};

function checkInDraft(values: CheckInValues): CheckInDraft {
  return {
    mood: values.mood,
    energy: values.energy,
    sleep: values.sleep,
    stress: values.stress,
    note: values.note ?? "",
  };
}

function sameCheckIn(a: CheckInDraft, b: CheckInDraft) {
  return (
    a.mood === b.mood &&
    a.energy === b.energy &&
    a.sleep === b.sleep &&
    a.stress === b.stress &&
    a.note === b.note
  );
}

/** Update unchanged fields from storage, preserving every field edited since submission. */
function reconcileCheckIn(draft: CheckInDraft, previous: CheckInDraft, saved: CheckInDraft) {
  return {
    mood: draft.mood === previous.mood ? saved.mood : draft.mood,
    energy: draft.energy === previous.energy ? saved.energy : draft.energy,
    sleep: draft.sleep === previous.sleep ? saved.sleep : draft.sleep,
    stress: draft.stress === previous.stress ? saved.stress : draft.stress,
    note: draft.note === previous.note ? saved.note : draft.note,
  };
}

function permittedCheckIn(values: CheckInDraft, wellness: TodayWellness): CheckInDraft {
  return {
    ...values,
    sleep: wellness.sleepEnabled ? values.sleep : null,
    stress: wellness.stressEnabled ? values.stress : null,
  };
}

/** This form is scoped to an account and the server's current day. */
function TodayCheckIn({
  day,
  accountId,
  wellness,
}: {
  day: string;
  accountId: string;
  wellness: TodayWellness;
}) {
  const checkIn = useServerFn(saveDailyCheckIn);
  const qc = useQueryClient();
  const mounted = useRef(false);
  const pendingSave = useRef<CheckInDraft | null>(null);
  const [state, setState] = useState(() => {
    const values = permittedCheckIn(checkInDraft(wellness), wellness);
    return {
      draft: values,
      saved: values,
      savedAt: wellness.savedAt,
      error: null as string | null,
    };
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const saving = pendingSave.current !== null;
    setState((previous) => {
      // An older background response cannot undo a confirmed save.
      const newer =
        !previous.savedAt ||
        Boolean(wellness.savedAt && Date.parse(wellness.savedAt) >= Date.parse(previous.savedAt));
      const saved = permittedCheckIn(newer ? checkInDraft(wellness) : previous.saved, wellness);
      const draft = permittedCheckIn(
        saving ? previous.draft : reconcileCheckIn(previous.draft, previous.saved, saved),
        wellness,
      );
      const savedAt = newer ? wellness.savedAt : previous.savedAt;
      const error =
        newer && wellness.savedAt && wellness.savedAt !== previous.savedAt ? null : previous.error;
      if (
        sameCheckIn(draft, previous.draft) &&
        sameCheckIn(saved, previous.saved) &&
        savedAt === previous.savedAt &&
        error === previous.error
      )
        return previous;
      return { ...previous, draft, saved, savedAt, error };
    });
  }, [wellness]);

  const draft = permittedCheckIn(state.draft, wellness);
  const dirty = !sameCheckIn(draft, permittedCheckIn(state.saved, wellness));
  const edit = <K extends keyof CheckInDraft>(field: K, value: CheckInDraft[K]) => {
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));
  };

  const saveNote = useMutation({
    mutationFn: (submitted: CheckInDraft) =>
      checkIn({
        data: { day, ...submitted, note: submitted.note.trim() || null },
      }),
    onMutate: (submitted) => {
      pendingSave.current = submitted;
      setState((previous) => ({ ...previous, error: null }));
    },
    onSuccess: (res, submitted) => {
      void qc.invalidateQueries({ queryKey: ["today", accountId] });
      void qc.invalidateQueries({ queryKey: ["journal"] });
      if (!mounted.current) return;
      const saved = checkInDraft(res.checkIn);
      setState((previous) => {
        const next = reconcileCheckIn(previous.draft, submitted, saved);
        // Consent may have changed on the server while this request was in flight.
        if (submitted.sleep !== null && saved.sleep === null) next.sleep = null;
        if (submitted.stress !== null && saved.stress === null) next.stress = null;
        return {
          draft: permittedCheckIn(next, wellness),
          saved,
          savedAt: res.checkIn.savedAt,
          error: null,
        };
      });
      toast.success(
        saved.note ? "Check-in saved. Reflection note stored encrypted." : "Check-in saved.",
      );
    },
    onError: () => {
      if (!mounted.current) return;
      setState((previous) => ({ ...previous, error: "Save could not be confirmed." }));
    },
    onSettled: () => {
      pendingSave.current = null;
    },
  });
  const editedWhileSaving =
    saveNote.isPending && saveNote.variables && !sameCheckIn(draft, saveNote.variables);
  const savedTime = state.savedAt
    ? new Date(state.savedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const status = saveNote.isPending
    ? editedWhileSaving
      ? "Saving earlier changes; newer edits are unsaved."
      : "Saving…"
    : state.error
      ? "Couldn’t confirm this save. Your edits are still here. Try again."
      : dirty
        ? savedTime
          ? `Unsaved changes · last saved ${savedTime}`
          : "Unsaved changes"
        : savedTime
          ? `Saved ${savedTime}`
          : "Not saved yet today";

  return (
    <>
      <div className="mt-5 rounded-sm border border-rule bg-secondary/30 p-4">
        <p className="technical text-muted-foreground">Today's check-in</p>
        <div className="mt-3 space-y-3">
          <BandPicker
            label="Mood"
            hint="1 low · 5 bright"
            value={draft.mood}
            onChange={(value) => edit("mood", value)}
          />
          <BandPicker
            label="Energy"
            hint="1 flat · 5 charged"
            value={draft.energy}
            onChange={(value) => edit("energy", value)}
          />
          {wellness.sleepEnabled && (
            <BandPicker
              label="Sleep"
              hint="1 poor · 5 rested"
              value={draft.sleep}
              onChange={(value) => edit("sleep", value)}
            />
          )}
          {wellness.stressEnabled && (
            <BandPicker
              label="Stress"
              hint="1 calm · 5 pressed"
              value={draft.stress}
              onChange={(value) => edit("stress", value)}
            />
          )}
        </div>
        {(wellness.sleepEnabled || wellness.stressEnabled) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sleep and stress are self-reported (tier 3), kept {wellness.retentionDays} days. Used
            locally for framing and reflection prompts; never sent to the language model or used in
            chart calculation or ranking.
          </p>
        )}
      </div>
      <textarea
        aria-label="Reflection note"
        aria-describedby="today-check-in-status"
        value={draft.note}
        onChange={(event) => edit("note", event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Optional. Stored encrypted in your account; never sent to the language model."
        className="mt-3 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={saveNote.isPending || (!dirty && !state.error)}
          onClick={() => saveNote.mutate({ ...draft })}
          className="rounded-sm border border-input bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {saveNote.isPending ? "Saving…" : state.error ? "Try saving again" : "Save check-in"}
        </Button>
        <span
          id="today-check-in-status"
          className={`font-mono text-[0.7rem] ${state.error ? "text-destructive" : "text-muted-foreground"}`}
          role={state.error ? "alert" : "status"}
          aria-live={state.error ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {status}
        </span>
      </div>
    </>
  );
}

const PHASE_COPY: Record<string, { label: string; help: string }> = {
  approaching: { label: "Building", help: "Tightening toward its closest pass." },
  applying: { label: "Building", help: "Tightening toward its closest pass." },
  exact: { label: "Exact", help: "At its closest point today." },
  separating: { label: "Fading", help: "Past its closest pass; easing off." },
};

function phaseLabel(phase: string) {
  return PHASE_COPY[phase] ?? { label: phase, help: "" };
}

const DOMAIN_LABEL: Record<string, string> = {
  work: "work and output",
  relationships: "relationships and affection",
  "inner-life": "inner life and rest",
  identity: "identity and direction",
  structure: "structure and commitments",
};

/** Whole days from `day` to the exact pass, preferring the calculated value. */
function daysToExact(
  cycle: { exact_at: string | null; days_to_exact?: number | null },
  day: string,
  timezone: string,
): number | null {
  if (
    cycle.days_to_exact !== null &&
    cycle.days_to_exact !== undefined &&
    Number.isFinite(cycle.days_to_exact)
  ) {
    return cycle.days_to_exact;
  }
  return daysToLocalDate(cycle.exact_at, day, timezone);
}

/** Plain-language days-to-exact, e.g. "exact in 4 days". */
function exactPhrase(days: number | null): string {
  if (days === null) return "no exact pass in range";
  if (days === 0) return "exact today";
  if (days === 1) return "exact tomorrow";
  if (days === -1) return "exact yesterday";
  return days > 0 ? `exact in ${days} days` : `exact ${Math.abs(days)} days ago`;
}

/** Weight from the transit's own speed, the natal point it touches and the orb. */
const NICE_NAME: Record<string, string> = {
  node: "North Node",
  ascendant: "Ascendant",
  midheaven: "Midheaven",
};
function niceName(k: string): string {
  return NICE_NAME[k] ?? k.charAt(0).toUpperCase() + k.slice(1);
}

function strengthLabel(weight: number): string {
  if (weight >= 0.7) return "Major";
  if (weight >= 0.4) return "Prominent";
  return "Background";
}

const ASPECT_MEANING: Record<string, string> = {
  conjunction: "merging with",
  opposition: "pulling against",
  square: "pressing on",
  trine: "supporting",
  sextile: "opening",
  quincunx: "unsettling",
};

/**
 * Entries the person wrote against today's date or against one of the windows
 * that is live today. Attachments were captured at write time, so this block
 * never re-derives them.
 */
function JournalToday({
  day,
  cycleKeys,
  accountId,
}: {
  day: string;
  cycleKeys: string[];
  accountId: string;
}) {
  const load = useServerFn(fetchJournal);
  const query = useQuery({ queryKey: ["journal", accountId], queryFn: () => load({}) });

  const keys = new Set(cycleKeys);
  const entries = (query.data?.events ?? []).filter(
    (e) => e.occurred_on === day || (e.cycle_key ? keys.has(e.cycle_key) : false),
  );

  return (
    <section id="today-journal" className="mt-14 border-t border-rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flow-section-title">Your entries for today</h2>
        <Link to="/journal" className="technical text-primary">
          Open journal
        </Link>
      </div>

      {query.isPending ? (
        <div aria-busy className="mt-4 h-16 animate-pulse border border-rule bg-secondary/40" />
      ) : query.error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {query.error.message}
        </p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing written against today or today's windows yet.{" "}
          <Link to="/journal" className="text-primary">
            Write an entry
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="border border-rule bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                <p className="min-w-0 text-sm font-medium text-foreground">{e.label}</p>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {e.occurred_on}
                </span>
              </div>
              {e.body ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {e.body}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
                {e.domain}
                {e.cycle_key ? ` · window ${e.cycle_key.replace(/[_-]+/g, " ")}` : ""}
                {e.feature_key ? ` · chapter ${e.feature_key.replace(/[_-]+/g, " ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TodayReading({ accountId }: { accountId: string }) {
  const today = useServerFn(fetchToday);
  const feedback = useServerFn(sendFeedback);
  const [openEvidence, setOpenEvidence] = useState(false);

  const calendar = useCalendarRefresh();
  const query = useQuery({
    queryKey: ["today", accountId],
    queryFn: () => today({ data: { timezone: calendar.timezone } }),
    refetchOnWindowFocus: "always",
  });
  useCalendarQueryRefresh(calendar, ["today", accountId]);

  const rate = useMutation({
    mutationFn: (vars: { readingId: string; resonance: number }) =>
      feedback({ data: { readingId: vars.readingId, resonance: vars.resonance, labels: [] } }),
    onSuccess: () => toast.success("Feedback saved."),
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isPending) {
    return (
      <div className="max-w-2xl space-y-4" aria-busy="true">
        <p className="technical text-muted-foreground">
          Writing today's reading from your chart — the first one each day takes a few seconds.
        </p>
        <div className="h-10 w-3/4 animate-pulse rounded-sm bg-secondary" />
        <div className="h-4 w-full animate-pulse rounded-sm bg-secondary" />
        <div className="h-4 w-11/12 animate-pulse rounded-sm bg-secondary" />
        <div className="h-4 w-4/5 animate-pulse rounded-sm bg-secondary" />
      </div>
    );
  }
  if (query.error && !query.data) {
    return (
      <p role="alert" className="text-sm text-destructive">
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
          Pattern needs birth date, time and place before it can say anything specific. Unknown time
          is fine — the reading will label what it can't support.
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
  const timing = data.cycles.slice(0, 5);

  return (
    <div className="today-flow">
      <div className="today-details order-2 border-t border-rule pt-6 lg:border-t-0 lg:pt-0">
        <details>
          <summary className="technical text-primary">Reading details</summary>
          <Rail title="Reading details">
            <Field label="Date" value={data.day} />
            <Field label="Zone" value={data.timezone} />
            <Field label="Confidence" value={data.reading.confidence} />
            <Field label="Content" value={data.reading.release_version} />
            <Field
              label="Language"
              value={data.language?.mode === "model" ? "model" : "template"}
            />
          </Rail>
        </details>
      </div>

      <article className="today-reading order-1">
        <p className="technical mb-3 text-muted-foreground">Today · {data.day}</p>
        <h1 className="text-3xl leading-snug sm:text-4xl">{data.reading.headline}</h1>
        <nav
          aria-label="Today sections"
          className="today-section-nav mt-5 flex flex-wrap items-center text-sm text-primary"
        >
          <a href="#today-timing" className="inline-flex items-center gap-1.5">
            Timing <ArrowDown className="h-3 w-3" aria-hidden="true" />
          </a>
          <a href="#today-journal">Journal</a>
          <a href="#today-reflection">Reflection</a>
        </nav>

        {primary ? (
          <div className="mt-5 grid grid-cols-3 gap-3 border-y border-rule py-3">
            <span className="technical text-muted-foreground">
              Phase ·{" "}
              <span className="mt-1 block text-foreground">{phaseLabel(primary.phase).label}</span>
            </span>
            <span className="technical text-muted-foreground">
              Strength ·{" "}
              <span className="mt-1 block text-foreground">
                {strengthLabel(primary.importance)}
              </span>
            </span>
            <span className="technical text-muted-foreground">
              Timing ·{" "}
              <span className="mt-1 block text-foreground">
                {exactPhrase(daysToExact(primary, data.day, data.timezone))}
              </span>
            </span>
          </div>
        ) : null}

        <div className="prose-reading mt-6 space-y-5 text-foreground">
          {data.reading.body.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {primary ? (
          <details className="mt-5 border-b border-rule pb-5">
            <summary className="technical cursor-pointer text-primary">Reading calculation</summary>
            <div className="mt-3 grid gap-2 font-mono text-xs text-muted-foreground sm:grid-cols-2">
              <p>
                Orb · <span className="text-foreground">{primary.orb.toFixed(2)}°</span>
              </p>
              <p>
                Exact ·{" "}
                <span className="text-foreground">
                  {primary.exact_at ? timingDate(primary.exact_at, data.timezone) : "not in window"}
                </span>
              </p>
              <p>
                Domain ·{" "}
                <span className="text-foreground">
                  {DOMAIN_LABEL[primary.domain] ?? primary.domain}
                </span>
              </p>
              <p>
                Cycle ·{" "}
                <span className="text-foreground">
                  {primary.transit_body} {primary.aspect} {primary.natal_point}
                </span>
              </p>
            </div>
          </details>
        ) : null}

        <EphemerisNotice state={data.ephemeris} className="mt-8" />

        <section id="today-timing" className="mt-14 border-t border-rule pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flow-section-title">Timing today</h2>
            <Link to="/timing" className="inline-flex items-center gap-2 text-sm text-primary">
              All windows <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Calculated from your birth positions for {data.day}. Phase and strength come from where
            today's sky sits relative to your chart — not from a generic forecast.
          </p>

          {timing.length === 0 ? (
            <p className="mt-4 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
              No measurable window against your chart today. An empty result is a valid one.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {timing.map((c) => {
                const phase = phaseLabel(c.phase);
                return (
                  <li
                    key={c.cycle_key}
                    className="window-card border-l-2 border-primary/40 bg-secondary/40 p-5 transition-colors hover:bg-secondary"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {niceName(c.transit_body)}{" "}
                        <span className="text-muted-foreground">
                          {ASPECT_MEANING[c.aspect] ?? c.aspect}
                        </span>{" "}
                        your {niceName(c.natal_point)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-input px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {strengthLabel(c.importance)}
                        </span>
                        <span className="rounded-sm bg-accent px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-accent-foreground">
                          {phase.label}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{phase.help}</p>
                    <p className="mt-2 text-xs text-foreground">
                      {exactPhrase(daysToExact(c, data.day, data.timezone))} ·{" "}
                      {DOMAIN_LABEL[c.domain] ?? c.domain}
                    </p>
                    <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground">
                      {c.orb.toFixed(2)}° from exact ·{" "}
                      {c.exact_at
                        ? `peak ${timingDate(c.exact_at, data.timezone)}`
                        : "no peak in window"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <JournalToday
          day={data.day}
          cycleKeys={timing.map((c) => c.cycle_key)}
          accountId={accountId}
        />

        <section id="today-reflection" className="mt-14 border-t border-rule pt-8">
          <h2 className="flow-section-title">Reflection</h2>
          <p className="prose-reading mt-2 text-foreground">{data.reading.prompt}</p>

          <TodayCheckIn
            key={`${accountId}:${data.day}`}
            day={data.day}
            accountId={accountId}
            wellness={data.wellness}
          />
        </section>

        <section className="mt-8 border-t border-rule pt-6">
          <Button
            variant="ghost"
            type="button"
            aria-expanded={openEvidence}
            aria-controls="today-evidence"
            onClick={() => setOpenEvidence((v) => !v)}
            className="technical h-auto justify-start px-0 text-primary"
          >
            {openEvidence ? "Hide evidence & provenance" : "Evidence & provenance"}
          </Button>

          {openEvidence ? (
            <div id="today-evidence" className="mt-4 space-y-6 overflow-x-auto bg-evidence p-4">
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
                          {c.exact_at ? timingDate(c.exact_at, data.timezone) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="technical text-evidence-foreground">Sources behind this reading</h3>
                <ul className="mt-2 space-y-1.5 font-mono text-xs">
                  {data.provenance.map((p, i) => (
                    <li key={`${p.source_id}-${i}`} className="flex flex-wrap gap-x-3">
                      <span className="text-foreground">{p.source_id}</span>
                      <span>{p.label}</span>
                      <span className="text-muted-foreground">
                        [
                        {p.lane === "context" || p.lane === "reflection"
                          ? "Your context"
                          : "Celestial fact"}
                        ]
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="technical text-evidence-foreground">Language layer</h3>
                {data.language?.mode === "model" ? (
                  <>
                    <p className="mt-2 font-mono text-xs">
                      Wording written by {data.language.model} using the supplied chart facts.
                      {data.language.dropped > 0
                        ? ` ${data.language.dropped} paragraph(s) did not pass the wording checks.`
                        : ""}
                    </p>
                    <p className="mt-2 font-mono text-xs">
                      Citation checks confirm that each cited ID was supplied. They do not establish
                      that the wording is semantically supported by that fact.
                    </p>
                    <ul className="mt-2 space-y-1.5 font-mono text-xs">
                      {data.language.citations.map((c) => (
                        <li key={c.paragraph} className="flex flex-wrap gap-x-3">
                          <span className="text-foreground">¶{c.paragraph}</span>
                          <span>cites {c.facts.join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                    {data.language.facts.length ? (
                      <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted-foreground">
                        {data.language.facts.map((f) => (
                          <li key={f.id} className="flex flex-wrap gap-x-3">
                            <span className="text-foreground">{f.id}</span>
                            <span>{f.statement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 font-mono text-xs">
                    Template wording.
                    {data.language?.reason ? ` Fell back because: ${data.language.reason}.` : ""}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </article>

      <div className="today-details order-3 border-t border-rule pt-6 lg:border-t-0 lg:pt-0">
        <Rail title="Does this land?">
          <div>
            <div className="flex gap-2">
              {[
                { v: 1, label: "Yes" },
                { v: 0, label: "Unsure" },
                { v: -1, label: "No" },
              ].map((o) => (
                <Button
                  variant="outline"
                  size="sm"
                  key={o.v}
                  type="button"
                  disabled={rate.isPending}
                  onClick={() => rate.mutate({ readingId: data.reading.id, resonance: o.v })}
                  className="rounded-sm border border-input bg-card px-2.5 py-1 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {o.label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your rating is saved to your account. Aggregate quality reports require a separate{" "}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
                permission in Context &amp; privacy
              </Link>
              .
            </p>
            <details className="mt-6 border-t border-rule pt-3">
              <summary className="technical cursor-pointer text-muted-foreground">
                Technical details
              </summary>
              <div className="mt-3 space-y-3">
                <Field label="Time accuracy" value={data.uncertainty?.accuracy ?? "unknown"} />
                <Field
                  label="ASC spread"
                  value={`${(data.uncertainty?.ascendantSpreadDeg ?? 0).toFixed(2)}°`}
                />
                <Field
                  label="Houses"
                  value={data.uncertainty?.housesReliable ? "usable" : "suppressed"}
                />
                <Field label="Cycles scanned" value={data.cycles.length} />
              </div>
            </details>
          </div>
        </Rail>
      </div>
    </div>
  );
}
