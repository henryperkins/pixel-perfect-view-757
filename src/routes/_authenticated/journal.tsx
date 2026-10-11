import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NotebookPen, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarQueryRefresh, useCalendarRefresh } from "@/hooks/useCalendarRefresh";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  addEvent,
  fetchJournal,
  fetchPattern,
  fetchToday,
  removeEvent,
} from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  validateSearch: (search: Record<string, unknown>): { chapter?: string } => {
    const chapter = search["chapter"];
    return typeof chapter === "string" && chapter.length > 0 && chapter.length <= 120
      ? { chapter }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Journal — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Write entries and tie them to the timing windows and chapters that were live when you wrote them.",
      },
      { property: "og:title", content: "Journal — Pattern" },
      {
        property: "og:description",
        content: "Your own record, attached to the cycles and chapters live at the time.",
      },
    ],
  }),
  component: JournalPage,
});

const DOMAINS = ["general", "work", "relationships", "health", "money"] as const;

function JournalPage() {
  const { chapter } = Route.useSearch();
  const { session } = useAuth();
  const calendar = useCalendarRefresh();
  const journalFn = useServerFn(fetchJournal);
  const todayFn = useServerFn(fetchToday);
  const patternFn = useServerFn(fetchPattern);
  const addFn = useServerFn(addEvent);
  const removeFn = useServerFn(removeEvent);
  const qc = useQueryClient();

  const journal = useQuery({
    queryKey: ["journal", session?.userId],
    queryFn: () => journalFn({}),
    enabled: Boolean(session),
  });
  const day = useQuery({
    queryKey: ["today", session?.userId],
    queryFn: () => todayFn({ data: { timezone: calendar.timezone } }),
    enabled: Boolean(session),
    refetchOnWindowFocus: "always",
  });
  useCalendarQueryRefresh(calendar, ["today", session?.userId]);
  const pattern = useQuery({
    queryKey: ["pattern", session?.userId],
    queryFn: () => patternFn({}),
    enabled: Boolean(session),
  });

  const prettyKey = (key: string) => key.replace(/[_-]+/g, " ");

  const [dateOverride, setOccurredOn] = useState<string | null>(null);
  const occurredOn = dateOverride ?? (day.data && !day.data.needsOnboarding ? day.data.day : "");
  const [domain, setDomain] = useState<string>("general");
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [cycleKey, setCycleKey] = useState("");
  const [featureKey, setFeatureKey] = useState(chapter ?? "");

  // A new chapter link updates only the attachment. Subsequent query refreshes
  // must not overwrite the reader's manual selection or their entry draft.
  useEffect(() => setFeatureKey(chapter ?? ""), [chapter]);

  const cycles = day.data && !day.data.needsOnboarding ? day.data.cycles.slice(0, 8) : [];
  const features = pattern.data && !pattern.data.needsOnboarding ? pattern.data.features : [];
  const chapterUnavailable =
    Boolean(featureKey) && !features.some((f) => f.feature_key === featureKey);

  const save = useMutation({
    mutationFn: () => {
      // Check again when saving: a recalculated chart may have removed the
      // chapter after the link was opened or a manual selection was made.
      if (chapterUnavailable) {
        throw new Error("Choose an available chapter or select No chapter before saving.");
      }
      return addFn({
        data: {
          occurredOn,
          domain,
          label: label.trim(),
          body: body.trim() ? body.trim() : null,
          cycleKey: cycleKey || null,
          featureKey: featureKey || null,
        },
      });
    },
    onSuccess: async () => {
      setLabel("");
      setBody("");
      toast.success("Entry saved");
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Entry deleted");
      await qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const entries = journal.data?.events ?? [];

  return (
    <Shell>
      <div className="grid animate-rise gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">Journal</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Write what actually happened. You can attach an entry to one of today's timing windows
            and to a chapter of your pattern; the attachment is stored as it was at the moment you
            wrote, so a later recalculation never rewrites your record.
          </p>

          <section className="journal-compose mt-8">
            <h2 className="flow-section-title flex items-center gap-3">
              <NotebookPen aria-hidden="true" className="h-5 w-5" />
              New entry
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!label.trim()) {
                  toast.error("Give the entry a short title first.");
                  return;
                }
                save.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="technical text-muted-foreground">Date</span>
                  <input
                    type="date"
                    value={occurredOn}
                    required
                    onChange={(e) => setOccurredOn(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-xs"
                  />
                </label>
                <label className="block">
                  <span className="technical text-muted-foreground">Area of life</span>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="technical text-muted-foreground">Title</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={400}
                  placeholder="What happened, in a line"
                  className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="technical text-muted-foreground">Entry</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  maxLength={4000}
                  placeholder="Optional longer note — stored encrypted"
                  className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm leading-relaxed"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="technical text-muted-foreground">Attach a timing window</span>
                  <select
                    value={cycleKey}
                    onChange={(e) => setCycleKey(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No window</option>
                    {cycles.map((c) => (
                      <option key={c.cycle_key} value={c.cycle_key}>
                        {c.transit_body} {c.aspect} {c.natal_point}
                      </option>
                    ))}
                  </select>
                  {cycles.length === 0 ? (
                    <span className="mt-1 block technical text-muted-foreground">
                      No measurable window today
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="technical text-muted-foreground">Attach a chapter</span>
                  <select
                    value={featureKey}
                    onChange={(e) => setFeatureKey(e.target.value)}
                    aria-describedby={chapterUnavailable ? "chapter-attachment-status" : undefined}
                    className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No chapter</option>
                    {chapterUnavailable ? (
                      <option value={featureKey} disabled>
                        {pattern.isPending ? "Loading chapter…" : "Chapter unavailable"}
                      </option>
                    ) : null}
                    {features.map((f) => (
                      <option key={f.feature_key} value={f.feature_key}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                  {chapterUnavailable ? (
                    <span
                      id="chapter-attachment-status"
                      role="status"
                      className="mt-1 block text-xs leading-relaxed text-muted-foreground"
                    >
                      {pattern.isPending
                        ? "Checking the linked chapter…"
                        : pattern.isError
                          ? "Chapters could not be loaded. Select No chapter to save without an attachment."
                          : "This chapter is no longer available in your current chart. Choose another chapter or select No chapter."}
                    </span>
                  ) : null}
                </label>
              </div>

              <Button
                type="submit"
                disabled={save.isPending || !occurredOn || chapterUnavailable}
                className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                <Save aria-hidden="true" />
                {save.isPending ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </section>

          <section className="mt-10">
            <h2 className="technical border-b border-rule pb-2 text-muted-foreground">
              2 · Entries ({entries.length})
            </h2>

            {journal.isPending ? (
              <div aria-busy className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse border border-rule bg-secondary/40" />
                ))}
              </div>
            ) : journal.error ? (
              <div role="alert" className="mt-4 border border-destructive p-4 text-sm">
                <p className="text-destructive">{journal.error.message}</p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void journal.refetch()}
                  className="mt-3 technical text-primary"
                >
                  Retry
                </Button>
              </div>
            ) : entries.length === 0 ? (
              <p className="mt-4 border border-rule bg-evidence p-4 text-sm text-evidence-foreground">
                Nothing written yet. The journal is where your own account of events lives, so that
                over time you can compare what you noticed against what was calculated. Nothing here
                is a prediction.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {entries.map((e) => (
                  <li key={e.id} className="journal-entry">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                      <p className="min-w-0 text-sm font-medium text-foreground">{e.label}</p>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {e.occurred_on}
                      </span>
                    </div>
                    {e.body ? (
                      <p className="prose-reading mt-2 whitespace-pre-line text-sm text-foreground">
                        {e.body}
                      </p>
                    ) : null}
                    <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
                      {e.domain}
                      {e.cycle_key ? ` · window ${prettyKey(e.cycle_key)}` : ""}
                      {e.feature_key
                        ? ` · chapter ${
                            features.find((f) => f.feature_key === e.feature_key)?.title ??
                            prettyKey(e.feature_key)
                          }`
                        : ""}
                    </p>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => remove.mutate(e.id)}
                      disabled={remove.isPending}
                      className="mt-3 technical text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-rule pt-6 lg:border-t-0 lg:pt-0">
          <Rail title="This record">
            <Field label="Entries" value={String(entries.length)} />
            <Field label="Windows today" value={String(cycles.length)} />
            <Field label="Chapters" value={String(features.length)} />
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
              Titles and entry text are encrypted with your own key before they are stored.
              Attachments are captured at write time and never re-derived.
            </p>
          </Rail>
        </div>
      </div>
    </Shell>
  );
}
