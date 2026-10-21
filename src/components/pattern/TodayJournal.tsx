import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchReadingJournal } from "@/lib/pattern.functions";
import { useAuth } from "@/hooks/useAuth";
import { DOMAIN_LABEL, timingDate } from "./timing";

export function TodayJournal({
  day,
  cycleKeys,
  accountId,
  featureKeys = [],
  permission,
  surfaceId = "today-journal",
}: {
  day?: string;
  cycleKeys: string[];
  accountId: string;
  featureKeys?: string[];
  permission?: boolean;
  surfaceId?: string;
}) {
  const load = useServerFn(fetchReadingJournal);
  const query = useQuery({
    queryKey: ["journal", accountId, "reading-context", day, cycleKeys, featureKeys],
    queryFn: () => load({ data: { day, cycleKeys, featureKeys } }),
    enabled: Boolean(accountId) && permission !== false,
    retry: false,
  });
  const permitted = permission !== false && query.data?.enabled === true && !query.isError;
  const entries = permitted ? (query.data?.entries ?? []) : [];
  const previews = entries.slice(0, 3);

  return (
    <section id={surfaceId} className="today-section">
      <div className="today-section-heading">
        <h2 className="flow-section-title">Journal</h2>
        <Link to="/journal" className="today-text-link">
          Open journal <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {permission === false || query.data?.enabled === false ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Matching journal entries are off. Your entries remain in your Journal. You can allow them
          here in{" "}
          <Link to="/privacy" className="underline">
            Context &amp; privacy
          </Link>
          .
        </p>
      ) : null}
      {query.isPending && permission !== false ? (
        <div className="mt-4" aria-busy={query.isFetching}>
          <p role="status" className="text-sm text-muted-foreground">
            {query.isPaused
              ? "Waiting for a connection. Your entries will load automatically when you’re back online."
              : "Loading your entries…"}
          </p>
          <div aria-hidden="true" className="mt-3 h-16 animate-pulse rounded-md bg-secondary/40" />
        </div>
      ) : null}
      {query.error ? (
        <div className="today-recovery mt-4">
          <p role="alert">Your journal entries couldn’t load. You can try again.</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RotateCcw aria-hidden="true" />
            {query.isFetching ? "Retrying…" : "Retry entries"}
          </Button>
        </div>
      ) : null}
      {permitted && entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No saved entries match this reading yet.{" "}
          <Link to="/journal" className="underline underline-offset-4 text-primary">
            Write an entry
          </Link>
          .
        </p>
      ) : null}
      {previews.length ? (
        <>
          <ul className="today-journal-previews mt-4">
            {previews.map((entry) => (
              <li key={entry.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium text-foreground">{entry.label}</p>
                  <time
                    dateTime={entry.occurred_on}
                    className="shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    {timingDate(entry.occurred_on)}
                  </time>
                </div>
                {entry.body ? (
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {entry.body}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {DOMAIN_LABEL[entry.domain] ?? entry.domain}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function AttachedJournalContext({
  cycleKey,
  featureKey,
}: {
  cycleKey?: string;
  featureKey?: string;
}) {
  const { session } = useAuth();
  if (!session) return null;
  return (
    <TodayJournal
      accountId={session.userId}
      cycleKeys={cycleKey ? [cycleKey] : []}
      featureKeys={featureKey ? [featureKey] : []}
      surfaceId={`context-${featureKey ?? cycleKey}`}
    />
  );
}
