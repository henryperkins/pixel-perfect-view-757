import { JournalDeleteDialog } from "@/components/pattern/JournalDeleteDialog";
import { useMemberDraft, useMemberDraftLifecycle } from "@/components/pattern/MemberDraftProvider";
import { DraftRecoveryNotice } from "@/components/pattern/DraftRecoveryNotice";
import {
  canonicalJournalValues,
  createJournalSubmission,
  journalPayload,
  reconcileJournalSubmission,
} from "@/lib/journal-submit";
import type { DraftValuesMap } from "@/lib/member-drafts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  JournalEntryEditor,
  type EditableJournalEntry,
  type JournalEditInput,
} from "@/components/pattern/JournalEntryEditor";
import { NotebookPen, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarQueryRefresh, useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { useScrollableField } from "@/hooks/useScrollableField";

import { Shell } from "@/components/pattern/Shell";
import { contactTitle, DOMAIN_LABEL } from "@/components/pattern/timing";
import { userFacingError } from "@/lib/user-facing-error";
import {
  addEvent,
  editEvent,
  fetchJournal,
  fetchJournalSubmission,
  fetchPattern,
  fetchToday,
  removeEvent,
} from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  validateSearch: (search: Record<string, unknown>): { chapter?: string; deleteEntry?: string } => {
    const result: { chapter?: string; deleteEntry?: string } = {};
    if (
      typeof search["chapter"] === "string" &&
      search["chapter"].length > 0 &&
      search["chapter"].length <= 120
    )
      result.chapter = search["chapter"];
    if (
      typeof search["deleteEntry"] === "string" &&
      /^[a-zA-Z0-9_-]{1,120}$/.test(search["deleteEntry"])
    )
      result.deleteEntry = search["deleteEntry"];
    return result;
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
const JOURNAL_DOMAIN_LABEL: Record<(typeof DOMAINS)[number], string> = {
  general: "General",
  work: "Work",
  relationships: "Relationships",
  health: "Health",
  money: "Money",
};

function journalEntryContext(
  entry: { domain: string; cycle_key?: string | null; feature_key?: string | null },
  cycles: { cycle_key: string; transit_body: string; aspect: string; natal_point: string }[],
  features: { feature_key: string; title: string }[],
) {
  const cycle = entry.cycle_key
    ? cycles.find((item) => item.cycle_key === entry.cycle_key)
    : undefined;
  const chapter = entry.feature_key
    ? features.find((item) => item.feature_key === entry.feature_key)?.title
    : undefined;
  return [
    JOURNAL_DOMAIN_LABEL[entry.domain as (typeof DOMAINS)[number]] ??
      DOMAIN_LABEL[entry.domain] ??
      entry.domain,
    cycle
      ? contactTitle(cycle.transit_body, cycle.aspect, cycle.natal_point)
      : entry.cycle_key
        ? "Timing window"
        : null,
    chapter ?? (entry.feature_key ? "Chapter" : null),
  ]
    .filter(Boolean)
    .join(" · ");
}

function JournalPage() {
  const { chapter, deleteEntry } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const openedDelete = useRef<string | null>(null);
  const closingDelete = useRef<string | null>(null);
  const [dismissedDelete, setDismissedDelete] = useState<string | null>(null);
  useEffect(() => {
    closingDelete.current = null;
    setDismissedDelete(null);
  }, [deleteEntry]);
  useEffect(
    () =>
      router.history.subscribe(({ location }) => {
        if (new URLSearchParams(location.search).get("deleteEntry") !== deleteEntry)
          setDismissedDelete(deleteEntry ?? null);
      }),
    [router, deleteEntry],
  );
  const closeDelete = (expectedId?: string) => {
    const location = router.state.location;
    const currentId = location.search.deleteEntry;
    if (!currentId || (expectedId && currentId !== expectedId)) return;
    const key = location.state.__TSR_key ?? location.href;
    if (closingDelete.current === key) return;
    closingDelete.current = key;
    setDismissedDelete(currentId);
    if (openedDelete.current === currentId) router.history.back();
    else
      void navigate({
        search: (previous) => {
          const { deleteEntry: _removed, ...rest } = previous;
          return rest;
        },
        replace: true,
        resetScroll: false,
      });
  };
  const { session } = useAuth();
  const { discardJournalDrafts } = useMemberDraftLifecycle();
  const calendar = useCalendarRefresh();
  const journalFn = useServerFn(fetchJournal);
  const todayFn = useServerFn(fetchToday);
  const patternFn = useServerFn(fetchPattern);
  const addFn = useServerFn(addEvent);
  const removeFn = useServerFn(removeEvent);
  const editFn = useServerFn(editEvent);
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

  const [defaults, setDefaults] = useState<DraftValuesMap["journal-new"] | null>(null);
  const initialValues = defaults ?? {
    occurredOn: day.data && !day.data.needsOnboarding ? day.data.day : "",
    domain: "general",
    label: "",
    body: "",
    cycleKey: "",
    featureKey: chapter ?? "",
  };
  const recovery = useMemberDraft({
    kind: "journal-new",
    entityKey: "new",
    values: initialValues,
    baseline: { values: initialValues, version: null },
  });
  const values = recovery.draft?.values ?? initialValues;
  const { occurredOn, domain, label, body, cycleKey, featureKey } = values;
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  useScrollableField(bodyRef, body);
  const change = <K extends keyof DraftValuesMap["journal-new"]>(
    key: K,
    value: DraftValuesMap["journal-new"][K],
  ) => recovery.update({ ...(recovery.current()?.values ?? initialValues), [key]: value });
  const setOccurredOn = (value: string) => change("occurredOn", value);
  const setDomain = (value: string) => change("domain", value);
  const setLabel = (value: string) => change("label", value);
  const setBody = (value: string) => change("body", value);
  const setCycleKey = (value: string) => change("cycleKey", value);
  const setFeatureKey = (value: string) => change("featureKey", value);
  const [checkingSave, setCheckingSave] = useState(false);
  const [missingSave, setMissingSave] = useState(false);
  const [saveDifference, setSaveDifference] = useState(false);
  const [editing, setEditing] = useState<EditableJournalEntry | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const entriesHeading = useRef<HTMLHeadingElement | null>(null);
  const closeEditor = () => {
    setEditing(null);
    requestAnimationFrame(() => {
      const target = editTrigger.current?.isConnected
        ? editTrigger.current
        : entriesHeading.current;
      target?.focus();
    });
  };

  // A new chapter link updates only the attachment. Subsequent query refreshes
  // must not overwrite the reader's manual selection or their entry draft.
  const lastChapter = useRef(chapter);
  const chapterDraft = useRef(recovery);
  chapterDraft.current = recovery;
  useEffect(() => {
    const current = chapterDraft.current.current();
    if (chapter && chapter !== lastChapter.current && current)
      chapterDraft.current.update({ ...current.values, featureKey: chapter });
    lastChapter.current = chapter;
  }, [chapter]);

  const cycles = day.data && !day.data.needsOnboarding ? day.data.cycles.slice(0, 8) : [];
  const features = pattern.data && !pattern.data.needsOnboarding ? pattern.data.features : [];
  const chapterUnavailable =
    Boolean(featureKey) && !features.some((f) => f.feature_key === featureKey);

  const save = useMutation({
    mutationFn: async () => {
      if (chapterUnavailable)
        throw new Error("Choose an available chapter or select No chapter before saving.");
      const current = recovery.current() ?? recovery.update(values);
      const seed = createJournalSubmission(current, crypto.randomUUID());
      const submission = await recovery.checkpointSubmission(seed.values, seed.operationId);
      const result = await addFn({
        data: { ...journalPayload(submission.values), clientMutationId: submission.operationId },
      });
      return { result, submission };
    },
    onSuccess: async ({ result, submission }) => {
      const current = recovery.current();
      if (!current) return;
      const outcome = reconcileJournalSubmission(current, submission, result.entry);
      recovery.reconcileAcknowledgement(
        submission,
        canonicalJournalValues(result.entry),
        String(result.entry.revision),
      );
      setDefaults({ ...submission.values, label: "", body: "" });
      setMissingSave(false);
      setSaveDifference(outcome.kind === "different-server-value");
      toast.success(
        outcome.kind === "acknowledged"
          ? "Entry saved"
          : "Earlier entry saved. Your current draft is kept.",
      );
      await qc.invalidateQueries({ queryKey: ["journal"] });
      await qc.invalidateQueries({ queryKey: ["today"] });
    },
    onError: (e: Error) =>
      toast.error(userFacingError(e, "The entry couldn’t be saved. Your draft is kept.")),
  });
  const checkSave = async () => {
    const pending = recovery.current()?.submission;
    if (!pending) return;
    setCheckingSave(true);
    try {
      const result = await fetchJournalSubmission({
        data: { clientMutationId: pending.operationId },
      });
      if (result.state === "missing") {
        setMissingSave(true);
        return;
      }
      const current = recovery.current();
      if (!current) return;
      const outcome = reconcileJournalSubmission(current, pending, result.entry);
      recovery.reconcileAcknowledgement(
        pending,
        canonicalJournalValues(result.entry),
        String(result.entry.revision),
      );
      setDefaults({ ...pending.values, label: "", body: "" });
      setSaveDifference(outcome.kind === "different-server-value");
      setMissingSave(false);
      toast.success("Earlier save found. Any newer draft text is kept.");
      await qc.invalidateQueries({ queryKey: ["journal"] });
    } catch {
      toast.error("The save could not be checked. Your draft is kept.");
    } finally {
      setCheckingSave(false);
    }
  };

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: async (_result, id) => {
      await discardJournalDrafts(id);
      toast.success("Entry deleted");
      closeDelete(id);
      await qc.invalidateQueries({ queryKey: ["journal"] });
      requestAnimationFrame(() => {
        // Back can dismiss an already-confirmed request before its trigger is removed.
        if (document.activeElement === document.body) entriesHeading.current?.focus();
      });
      await qc.invalidateQueries({ queryKey: ["today"] });
    },
    onError: (e: Error) => toast.error(userFacingError(e, "The entry couldn’t be deleted.")),
  });

  const edit = useMutation({
    mutationFn: (input: JournalEditInput) => editFn({ data: input }),
    onSuccess: async () => {
      closeEditor();
      toast.success("Entry updated");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["journal"] }),
        qc.invalidateQueries({ queryKey: ["today"] }),
      ]);
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
  const entries = journal.data?.events ?? [];
  const deleteOpen = Boolean(
    deleteEntry &&
    dismissedDelete !== deleteEntry &&
    entries.some((entry) => entry.id === deleteEntry),
  );

  return (
    <Shell>
      <JournalDeleteDialog
        entry={entries.find((entry) => entry.id === deleteEntry) ?? null}
        open={deleteOpen}
        pending={remove.isPending}
        error={remove.error ? userFacingError(remove.error, "Pattern couldn’t be reached.") : null}
        onConfirm={() => {
          if (deleteEntry && !remove.isPending) remove.mutate(deleteEntry);
        }}
        onCancel={() => closeDelete()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            const target =
              deleteTrigger.current?.isConnected && !deleteTrigger.current.disabled
                ? deleteTrigger.current
                : entriesHeading.current;
            if (target?.isConnected) target.focus();
          });
        }}
      />
      {remove.isPending && !deleteOpen && (
        <p role="status" className="text-sm">
          Deleting entry…
        </p>
      )}
      {remove.isError && !deleteOpen && (
        <p role="alert" className="text-sm text-destructive">
          Deletion wasn’t confirmed. {userFacingError(remove.error, "Pattern couldn’t be reached.")}{" "}
          Check your entries before trying again.
        </p>
      )}
      <div className="animate-rise">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">Journal</h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            Write what happened. You can attach today’s timing window or a chapter. The attachment
            stays as it was when you saved it.
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
                if (!save.isPending && !checkingSave && !recovery.draft?.submission) save.mutate();
              }}
            >
              {recovery.draft?.submission && !save.isPending && (
                <div role="status" className="space-y-2 border border-rule p-3 text-sm">
                  <p>A previous save has not been confirmed. Check it before retrying.</p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={checkingSave}
                    onClick={() => void checkSave()}
                  >
                    {checkingSave ? "Checking…" : "Check save"}
                  </Button>
                  {missingSave && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() => save.mutate()}
                    >
                      Retry earlier save
                    </Button>
                  )}
                </div>
              )}
              {saveDifference && (
                <p role="status" className="text-sm">
                  The saved entry differs from the earlier submission. Review the entry below; your
                  draft is kept for a separate save.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="technical text-muted-foreground">Date</span>
                  <input
                    type="date"
                    readOnly={save.isPending || checkingSave}
                    value={occurredOn}
                    required
                    onChange={(e) => setOccurredOn(e.target.value)}
                    className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-xs"
                  />
                </label>
                <label className="block">
                  <span className="technical text-muted-foreground">Area of life</span>
                  <select
                    disabled={save.isPending || checkingSave}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {JOURNAL_DOMAIN_LABEL[d]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="technical text-muted-foreground">Title</span>
                <input
                  readOnly={save.isPending || checkingSave}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={400}
                  placeholder="What happened, in a line"
                  className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                />
              </label>

              <div>
                <label className="block">
                  <span className="technical text-muted-foreground">Entry · optional</span>
                  <textarea
                    ref={bodyRef}
                    readOnly={save.isPending || checkingSave}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    maxLength={4000}
                    aria-describedby="journal-entry-privacy"
                    placeholder="A longer note, if it helps"
                    className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm leading-relaxed"
                  />
                </label>
                <p id="journal-entry-privacy" className="mt-1 text-xs text-muted-foreground">
                  Stored encrypted.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="technical text-muted-foreground">Attach a timing window</span>
                  <select
                    disabled={save.isPending || checkingSave}
                    value={cycleKey}
                    onChange={(e) => setCycleKey(e.target.value)}
                    className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No window</option>
                    {cycles.map((c) => (
                      <option key={c.cycle_key} value={c.cycle_key}>
                        {contactTitle(c.transit_body, c.aspect, c.natal_point)}
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
                    disabled={save.isPending || checkingSave}
                    value={featureKey}
                    onChange={(e) => setFeatureKey(e.target.value)}
                    aria-describedby={chapterUnavailable ? "chapter-attachment-status" : undefined}
                    className="pattern-mobile-field mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
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

              <DraftRecoveryNotice
                draft={recovery.draft}
                candidates={recovery.recoveryCandidates}
                durability={recovery.durability}
                error={recovery.error}
                onResume={recovery.resume}
                onDiscard={recovery.discard}
                entityKey="new"
              />
              <Button
                type="submit"
                disabled={
                  save.isPending ||
                  checkingSave ||
                  Boolean(recovery.draft?.submission) ||
                  !occurredOn ||
                  chapterUnavailable
                }
                className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                <Save aria-hidden="true" />
                {save.isPending ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </section>

          <section className="mt-10">
            <h2
              ref={entriesHeading}
              tabIndex={-1}
              className="technical border-b border-rule pb-2 text-muted-foreground"
            >
              Entries
            </h2>

            {editing ? (
              <JournalEntryEditor
                key={editing.id}
                initialEntry={editing}
                latestEntry={entries.find((entry) => entry.id === editing.id)}
                pending={edit.isPending}
                onSave={(input) => edit.mutateAsync(input)}
                onRefresh={async () => {
                  const result = await journal.refetch();
                  if (result.error) throw result.error;
                  return result.data?.events.find((entry) => entry.id === editing.id);
                }}
                onCancel={closeEditor}
              />
            ) : null}

            {journal.isPending ? (
              <div aria-busy className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse border border-rule bg-secondary/40" />
                ))}
              </div>
            ) : journal.error ? (
              <div role="alert" className="mt-4 border border-destructive p-4 text-sm">
                <p className="text-destructive">
                  {userFacingError(journal.error, "Your entries couldn’t load. You can try again.")}
                </p>
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
                Nothing written yet. Use the form above to record what happened.
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      {journalEntryContext(e, cycles, features)}
                    </p>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={(event) => {
                        editTrigger.current = event.currentTarget;
                        setEditing(e);
                      }}
                      disabled={Boolean(editing) || remove.isPending}
                      className="mt-3 mr-3 technical"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={(event) => {
                        deleteTrigger.current = event.currentTarget;
                        openedDelete.current = e.id;
                        closingDelete.current = null;
                        setDismissedDelete(null);
                        remove.reset();
                        void navigate({
                          search: (previous) => ({ ...previous, deleteEntry: e.id }),
                          resetScroll: false,
                        });
                      }}
                      disabled={remove.isPending || editing?.id === e.id}
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
      </div>
    </Shell>
  );
}
