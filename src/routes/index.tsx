import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createIsomorphicFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, RotateCcw } from "lucide-react";
import { Landing } from "@/components/pattern/Landing";

import { Field, Shell } from "@/components/pattern/Shell";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarQueryRefresh, useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { currentSession } from "@/lib/auth.shared";
import { localDayString } from "@/lib/local-day";
import { solarContextLine } from "@/lib/solar-context";
import { absoluteUrl, jsonLd, publicPageHead, SITE_NAME } from "@/lib/seo";
import {
  cycleTimingPhrase,
  DOMAIN_LABEL,
  PHASE_LABEL,
  timingDate,
  weightLabel,
  windowPhase,
  windowTitle,
} from "@/components/pattern/timing";
import { fetchToday } from "@/lib/pattern.functions";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";
import { TodayCheckIn } from "@/components/pattern/TodayCheckIn";
import { TodayJournal } from "@/components/pattern/TodayJournal";
import { TodayTiming } from "@/components/pattern/TodayTiming";
import { TodayEvidence } from "@/components/pattern/TodayEvidence";
import { TodayFeedback } from "@/components/pattern/TodayFeedback";
import { todayParagraphId } from "@/components/pattern/today-view";

const HOME_TITLE = "Pattern — Birth chart, transit timing and daily readings";
const HOME_DESCRIPTION =
  "Calculate your birth chart, see which transits are active and when each peaks, and read one daily theme with the exact facts behind it. Nothing is predicted.";

// A server render can tell that no session arrived, so visitors and crawlers get
// the landing in the HTML. Client navigations still wait for useAuth as before.
const signedOutOnServer = createIsomorphicFn()
  .server(async () => {
    try {
      return !(await currentSession()).session;
    } catch {
      return false;
    }
  })
  .client(async () => false);

export const Route = createFileRoute("/")({
  loader: async () => ({ visitor: await signedOutOnServer() }),
  // Never reuse a visitor answer from an earlier load, e.g. right after sign-in.
  gcTime: 0,
  head: () => ({
    ...publicPageHead({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION }),
    scripts: [
      jsonLd({
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: HOME_DESCRIPTION,
        inLanguage: "en",
      }),
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { visitor } = Route.useLoaderData();
  const { session, loading } = useAuth();

  if (loading && !visitor) {
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

type TodayData = Extract<Awaited<ReturnType<typeof fetchToday>>, { needsOnboarding: false }>;

function TodayReading({ accountId }: { accountId: string }) {
  const today = useServerFn(fetchToday);
  const [openEvidence, setOpenEvidence] = useState(false);
  const calendar = useCalendarRefresh();
  const query = useQuery({
    queryKey: ["today", accountId],
    queryFn: () => today({ data: { timezone: calendar.timezone } }),
    refetchOnWindowFocus: "always",
    retry: false,
  });
  useCalendarQueryRefresh(calendar, ["today", accountId]);

  if (query.isPending) {
    return (
      <div className="max-w-2xl space-y-4" aria-busy="true">
        <h1 className="text-3xl text-primary">Your day is taking shape</h1>
        <p role="status" className="text-sm text-muted-foreground">
          Preparing today’s reading from your chart. The first reading of the day can take a little
          longer.
        </p>
        <div aria-hidden="true" className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-sm bg-secondary" />
          <div className="h-4 w-full animate-pulse rounded-sm bg-secondary" />
          <div className="h-4 w-11/12 animate-pulse rounded-sm bg-secondary" />
          <div className="h-4 w-4/5 animate-pulse rounded-sm bg-secondary" />
        </div>
      </div>
    );
  }
  if (query.error && !query.data) {
    return (
      <section className="today-recovery max-w-xl">
        <h1 className="text-3xl text-primary">Your reading couldn’t load</h1>
        <p role="alert">We couldn’t complete the request. You can try again.</p>
        <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RotateCcw aria-hidden="true" /> {query.isFetching ? "Retrying…" : "Retry reading"}
        </Button>
      </section>
    );
  }

  const data = query.data;
  if (!data || data.needsOnboarding) {
    return (
      <div className="max-w-xl animate-rise">
        <h1 className="text-3xl">Your chart isn’t calculated yet</h1>
        <p className="prose-reading mt-4 text-foreground">
          Pattern needs birth date, time and place before it can say anything specific. Unknown time
          is fine — the reading will label what it can’t support.
        </p>
        <Button asChild className="mt-8">
          <Link to="/onboarding">Enter birth details</Link>
        </Button>
      </div>
    );
  }

  return (
    <TodayContent
      data={data}
      accountId={accountId}
      openEvidence={openEvidence}
      setOpenEvidence={setOpenEvidence}
      refreshFailed={Boolean(query.error)}
      refreshing={query.isFetching}
      readingRevision={query.dataUpdatedAt}
      retry={() => void query.refetch()}
    />
  );
}

function TodayContent({
  data,
  accountId,
  openEvidence,
  setOpenEvidence,
  refreshFailed,
  refreshing,
  readingRevision,
  retry,
}: {
  data: TodayData;
  accountId: string;
  openEvidence: boolean;
  setOpenEvidence: (open: boolean) => void;
  refreshFailed: boolean;
  refreshing: boolean;
  readingRevision: number;
  retry: () => void;
}) {
  const primary = data.cycles.find((cycle) => cycle.cycle_key === data.reading.primary_cycle_key);
  const staleDay = data.day !== localDayString(new Date(), data.timezone);
  const phase = primary
    ? windowPhase(primary, data.day, data.timezone, data.storyCalculation)
    : null;

  return (
    <div className="today-flow">
      <article className="today-reading">
        {refreshFailed || staleDay ? (
          <div className="today-recovery mb-6">
            <p role={refreshFailed ? "alert" : "status"}>
              {staleDay
                ? `Showing your reading for ${timingDate(data.day)}. ${refreshing ? "Updating today’s reading…" : "Refresh to load the new day before checking in."}`
                : "Your reading couldn’t refresh. You’re viewing the last version loaded."}
            </p>
            <Button variant="outline" disabled={refreshing} onClick={retry}>
              <RotateCcw aria-hidden="true" /> {refreshing ? "Refreshing…" : "Refresh reading"}
            </Button>
          </div>
        ) : null}
        <p className="technical mb-3 text-muted-foreground">
          Today · <time dateTime={data.day}>{timingDate(data.day)}</time>
        </p>
        <h1 className="text-3xl leading-snug sm:text-4xl">{data.reading.headline}</h1>
        <nav
          aria-label="Today sections"
          className="today-section-nav mt-5 flex flex-wrap items-center text-sm text-primary"
        >
          <a href="#today-reflection" className="inline-flex items-center gap-1.5">
            Check-in <ArrowDown className="h-3 w-3" aria-hidden="true" />
          </a>
          <a href="#today-timing">Timing</a>
          <a href="#today-journal">Journal</a>
          <a href="#today-evidence-section">Sources</a>
        </nav>
        {primary && phase ? (
          <dl className="today-cycle-summary mt-5">
            <div>
              <dt>Phase</dt>
              <dd>{PHASE_LABEL[phase].label}</dd>
            </div>
            <div>
              <dt>Strength</dt>
              <dd>{weightLabel(primary.importance)}</dd>
            </div>
            <div>
              <dt>Timing</dt>
              <dd>{cycleTimingPhrase(primary, data.day, data.timezone, data.storyCalculation)}</dd>
            </div>
          </dl>
        ) : null}
        {data.ephemeris ? <EphemerisNotice state={data.ephemeris} className="mt-5" /> : null}
        <div className="prose-reading mt-6 space-y-5 text-foreground">
          {data.reading.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              id={todayParagraphId(data.reading.id, index + 1)}
              tabIndex={-1}
              className="today-evidence-target whitespace-pre-line"
            >
              {paragraph}
            </p>
          ))}
        </div>
        {data.localContext?.solar ? (
          <section className="mt-5 border-t border-rule pt-4" aria-labelledby="today-solar-context">
            <h2 id="today-solar-context" className="flow-section-title">
              Your Context
            </h2>
            <p className="mt-2 text-sm">{solarContextLine(data.localContext.solar)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.localContext.solar.timeZone} · selected current location on a 1° grid ·{" "}
              {data.localContext.solar.source}. Daylight is calculated with standard refraction at
              sea level; seasons use calendar months outside the tropics.
            </p>
          </section>
        ) : null}
        <details className="today-reading-calculation mt-5 border-b border-rule pb-4">
          <summary className="text-sm text-primary">Reading calculation</summary>
          {primary ? (
            <dl className="today-calculated-values mt-3">
              <div>
                <dt>Cycle</dt>
                <dd>{windowTitle(primary)}</dd>
              </div>
              <div>
                <dt>Current orb</dt>
                <dd>{primary.orb.toFixed(2)}° from exact</dd>
              </div>
              <div>
                <dt>Closest pass</dt>
                <dd>{timingDate(primary.exact_at, data.timezone)}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{DOMAIN_LABEL[primary.domain] ?? primary.domain}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No measurable primary window today.
            </p>
          )}
          {!data.ephemeris?.degraded ? (
            <EphemerisNotice state={data.ephemeris} className="mt-4" />
          ) : null}
        </details>
        <section id="today-reflection" className="today-section">
          <h2 className="flow-section-title">Reflection &amp; check-in</h2>
          <p className="prose-reading mt-2 text-foreground">{data.reading.prompt}</p>
          {data.localContext?.preferredDomain ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Your chosen focus: {DOMAIN_LABEL[data.localContext.preferredDomain]}. This sets the
              initial area filter in Timing.
            </p>
          ) : null}
          {data.localContext?.previousResonance ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You rated this interpretation{" "}
              {data.localContext.previousResonance.score === 1
                ? "resonant"
                : data.localContext.previousResonance.score === -1
                  ? "not resonant"
                  : "mixed"}{" "}
              on {timingDate(data.localContext.previousResonance.day)}.
            </p>
          ) : null}
          <TodayCheckIn
            key={`${accountId}:${data.day}`}
            day={data.day}
            accountId={accountId}
            wellness={data.wellness}
            disabled={staleDay}
          />
        </section>
        <TodayTiming
          cycles={data.cycles}
          day={data.day}
          timezone={data.timezone}
          calculation={data.storyCalculation}
        />
        <TodayJournal
          day={data.day}
          cycleKeys={data.cycles.map((cycle) => cycle.cycle_key)}
          accountId={accountId}
          permission={data.localContext?.markedMoments ?? false}
        />
        <section id="today-evidence-section" className="today-section">
          <Button
            variant="ghost"
            type="button"
            aria-expanded={openEvidence}
            aria-controls="today-evidence"
            onClick={() => setOpenEvidence(!openEvidence)}
            className="today-evidence-toggle px-0 text-primary"
          >
            {openEvidence ? "Hide sources behind this reading" : "Sources behind this reading"}
          </Button>
          {openEvidence ? (
            <TodayEvidence
              readingId={data.reading.id}
              cycles={data.cycles}
              provenance={data.provenance}
              language={data.language}
              timezone={data.timezone}
              paragraphCount={data.reading.paragraphs.length}
              paragraphLinksAvailable={data.reading.paragraphLinksAvailable}
            />
          ) : null}
        </section>
      </article>
      <aside className="today-sidebar" aria-label="Reading details and feedback">
        <details className="today-metadata">
          <summary className="text-sm text-primary">Reading details</summary>
          <div className="mt-3 space-y-3">
            <Field label="Date" value={timingDate(data.day)} />
            <Field label="Time zone" value={<span className="break-all">{data.timezone}</span>} />
            <Field label="Confidence" value={data.reading.confidence} />
            <Field label="Content version" value={data.reading.release_version} />
            <Field label="Wording" value={data.language?.mode === "model" ? "Model" : "Template"} />
            <Field label="Birth-time accuracy" value={data.uncertainty?.accuracy ?? "unknown"} />
            <Field
              label="House claims"
              value={data.uncertainty?.housesReliable ? "Supported" : "Suppressed"}
            />
            <Field label="Active windows" value={data.cycles.length} />
          </div>
        </details>
        <TodayFeedback
          key={data.reading.id}
          readingId={data.reading.id}
          accountId={accountId}
          saved={data.feedback}
          readingRevision={readingRevision}
        />
      </aside>
    </div>
  );
}
