import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchJournal } from "@/lib/pattern.functions";
import { DOMAIN_LABEL, timingDate } from "./timing";

export function TodayJournal({
  day,
  cycleKeys,
  accountId,
}: {
  day: string;
  cycleKeys: string[];
  accountId: string;
}) {
  const load = useServerFn(fetchJournal);
  const query = useQuery({
    queryKey: ["journal", accountId],
    queryFn: () => load({}),
    retry: false,
  });
  const keys = new Set(cycleKeys);
  const entries = (query.data?.events ?? []).filter(
    (entry) => entry.occurred_on === day || Boolean(entry.cycle_key && keys.has(entry.cycle_key)),
  );
  const previews = entries.slice(0, 3);

  return (
    <section id="today-journal" className="today-section">
      <div className="today-section-heading">
        <h2 className="flow-section-title">Your entries for today</h2>
        <Link to="/journal" className="today-text-link">
          Open journal <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {query.isPending ? (
        <div className="mt-4" aria-busy="true">
          <p role="status" className="text-sm text-muted-foreground">
            Loading your entries…
          </p>
          <div aria-hidden="true" className="mt-3 h-16 animate-pulse rounded-md bg-secondary/40" />
        </div>
      ) : null}
      {query.error ? (
        <div className="today-recovery mt-4">
          <p role="alert">
            {query.data
              ? "Your entries couldn’t refresh. These are the last entries loaded."
              : "Your entries couldn’t load. You can try again."}
          </p>
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
      {query.data && entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing written for today or today’s windows yet.{" "}
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
                    className="shrink-0 text-xs text-muted-foreground"
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
                  {entry.cycle_key ? " · linked to a timing window" : ""}
                  {entry.feature_key ? " · linked to a chart chapter" : ""}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            {entries.length > previews.length
              ? `${entries.length - previews.length} more ${entries.length - previews.length === 1 ? "entry" : "entries"}. `
              : ""}
            <Link to="/journal" className="underline underline-offset-4 text-primary">
              Read full entries in your journal
            </Link>
            .
          </p>
        </>
      ) : null}
    </section>
  );
}
