import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { clearPatternQueries } from "@/lib/pattern-query-cache";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  addEvent,
  eraseData,
  exportData,
  fetchBootstrap,
  fetchJournal,
  savePrefs,
  updateConsent,
} from "@/lib/pattern.functions";
import { PROHIBITED_SOURCES, TIERS, sourcesForTier, type Tier } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({
    meta: [
      { title: "Context & privacy — Pattern" },
      {
        name: "description",
        content:
          "Every data source Pattern may use, its permission tier, allowed uses and retention — with per-source controls.",
      },
      { property: "og:title", content: "Context & privacy — Pattern" },
      {
        property: "og:description",
        content: "Tier 0 is required for calculation; everything else is opt-in and revocable.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { session } = useAuth();
  const bootstrapFn = useServerFn(fetchBootstrap);
  const consentFn = useServerFn(updateConsent);
  const prefsFn = useServerFn(savePrefs);
  const exportFn = useServerFn(exportData);
  const eraseFn = useServerFn(eraseData);
  const eventFn = useServerFn(addEvent);
  const journalFn = useServerFn(fetchJournal);
  const qc = useQueryClient();

  const boot = useQuery({
    queryKey: ["bootstrap", session?.userId],
    queryFn: () => bootstrapFn({}),
    enabled: Boolean(session),
  });
  const journal = useQuery({
    queryKey: ["journal", session?.userId],
    queryFn: () => journalFn({}),
    enabled: Boolean(session),
  });

  const [eventDate, setEventDate] = useState("");
  const [eventDomain, setEventDomain] = useState("identity");
  const [eventLabel, setEventLabel] = useState("");

  const granted = new Set(
    (boot.data?.consents ?? []).filter((c) => c.granted).map((c) => c.source_id),
  );
  const consentUnknown = !boot.data || boot.isError;

  const toggle = useMutation({
    mutationFn: (vars: { sourceId: string; granted: boolean }) => consentFn({ data: vars }),
    onSuccess: async () => {
      await clearPatternQueries(qc);
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
      void qc.invalidateQueries({ queryKey: ["cycles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const consentControlsDisabled = consentUnknown || boot.isFetching || toggle.isPending;

  const prefs = useMutation({
    mutationFn: (vars: { displayName: string | null; tone: string; depth: string }) =>
      prefsFn({
        data: {
          displayName: vars.displayName,
          tone: vars.tone as "plain" | "warm" | "clinical",
          depth: vars.depth as "standard" | "technical",
        },
      }),
    onSuccess: async () => {
      await clearPatternQueries(qc);
      toast.success("Preferences saved.");
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMoment = useMutation({
    mutationFn: () =>
      eventFn({
        data: { occurredOn: eventDate, domain: eventDomain, label: eventLabel },
      }),
    onSuccess: () => {
      setEventLabel("");
      toast.success("Marked moment saved (encrypted).");
      void qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doExport = useMutation({
    mutationFn: () => exportFn({}),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pattern-export.json";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doErase = useMutation({
    mutationFn: () => eraseFn({}),
    onSuccess: () => {
      toast.success("Personal data destroyed, including the encryption key.");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profile = boot.data?.profile;

  return (
    <Shell>
      <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <h1 className="text-3xl">Context &amp; privacy</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            This is the registry the reading engine actually enforces. A source can only be used for
            the uses listed beside it; anything else fails at the policy boundary.
          </p>

          {boot.isPending || boot.isFetching ? (
            <p role="status" className="mt-4 text-sm text-muted-foreground">
              Loading privacy settings…
            </p>
          ) : boot.error ? (
            <div role="alert" className="mt-4 border border-destructive/40 p-4 text-sm">
              <p>
                Privacy settings couldn’t load. Source controls are unavailable until they refresh.
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={() => boot.refetch()}
                className="mt-3"
              >
                Retry privacy settings
              </Button>
            </div>
          ) : null}

          <section className="mt-8 max-w-2xl" aria-labelledby="reading-language-privacy">
            <h2 id="reading-language-privacy" className="font-serif text-xl">
              How reading language is written
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Google Gemini, through the Lovable AI gateway, can write from calculated chart facts
              and curated interpretation text. Tone and depth preferences are included only when
              their source switches are on. With those switches off, readings use plain tone and
              standard depth.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Raw birth details, journal notes, check-in bands, sleep and stress bands, device
              timezone and local time-of-day context are never sent to the language provider.
              Context switches allow only the local uses listed below; turning them on does not
              authorize sending that context to a model.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The Daily check-in switch controls whether mood and energy frame your reading. You can
              still save a private check-in with that switch off. Saving never turns the switch on.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Feedback scores are never sent to the language provider. Scores count locally in
              aggregate admin quality reports only when the Reading quality feedback switch is on.
              Notes and labels are excluded. Turning this switch off excludes your saved scores from
              future reports; saving a rating never turns it on.
            </p>
          </section>

          {TIERS.filter((t) => t.tier !== 3 || sourcesForTier(3).length > 0).map((tier) => (
            <section key={tier.tier} className="mt-10">
              <h2 className="font-serif text-xl">
                Tier {tier.tier} · {tier.name}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{tier.summary}</p>
              <div className="mt-4 space-y-2">
                {sourcesForTier(tier.tier as Tier).map((s) => {
                  const on = tier.required || granted.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-start justify-between gap-4 border border-rule bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p
                          id={`source-${s.id}-meta`}
                          className="font-mono text-xs text-muted-foreground"
                        >
                          {s.id} · {s.sensitivity} ·{" "}
                          {s.retention_days === null
                            ? "retained until deletion"
                            : `${s.retention_days}d retention`}
                        </p>
                        <p id={`source-${s.id}-label`} className="mt-1 text-sm font-medium">
                          {s.label}
                        </p>
                        <p
                          id={`source-${s.id}-description`}
                          className="mt-1 max-w-xl text-sm text-muted-foreground"
                        >
                          {s.description}
                        </p>
                        <p
                          id={`source-${s.id}-uses`}
                          className="mt-1.5 font-mono text-xs text-muted-foreground"
                        >
                          uses: {s.allowed_uses.map((use) => use.replaceAll("_", " ")).join(", ")}
                        </p>
                      </div>
                      {tier.required ? (
                        <span className="technical shrink-0 text-muted-foreground">required</span>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Use ${s.label}`}
                          aria-pressed={consentUnknown ? undefined : on}
                          aria-describedby={`source-${s.id}-meta source-${s.id}-description source-${s.id}-uses`}
                          disabled={consentControlsDisabled}
                          onClick={() => toggle.mutate({ sourceId: s.id, granted: !on })}
                          className={`shrink-0 rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                            !consentUnknown && on
                              ? "border-primary bg-accent text-accent-foreground"
                              : "border-input bg-card hover:bg-secondary"
                          }`}
                        >
                          {consentUnknown
                            ? boot.isPending || boot.isFetching
                              ? "loading…"
                              : "unavailable"
                            : on
                              ? "on"
                              : "off"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="mt-12">
            <h2 className="font-serif text-xl">Never collected</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are encoded as a rejected list. No code path can introduce them.
            </p>
            <ul className="mt-3 grid gap-1 font-mono text-xs text-muted-foreground sm:grid-cols-2">
              {PROHIBITED_SOURCES.map((p) => (
                <li key={p.id}>
                  {p.id} · {p.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-xl">Reading preferences</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Saved tone and depth apply when their source switches above are on. Saving a
              preference does not turn a source on.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="technical text-muted-foreground">Display name</span>
                <input
                  defaultValue={profile?.display_name ?? ""}
                  id="display-name"
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                />
              </label>
              <label className="block">
                <span className="technical text-muted-foreground">Tone</span>
                <select
                  id="tone"
                  defaultValue={profile?.tone_pref ?? "plain"}
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                >
                  <option value="plain">plain</option>
                  <option value="warm">warm</option>
                  <option value="clinical">clinical</option>
                </select>
              </label>
              <label className="block">
                <span className="technical text-muted-foreground">Depth</span>
                <select
                  id="depth"
                  defaultValue={profile?.depth_pref ?? "standard"}
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                >
                  <option value="standard">standard</option>
                  <option value="technical">technical</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              disabled={prefs.isPending}
              onClick={() => {
                const name = (document.getElementById("display-name") as HTMLInputElement).value;
                const tone = (document.getElementById("tone") as HTMLSelectElement).value;
                const depth = (document.getElementById("depth") as HTMLSelectElement).value;
                prefs.mutate({ displayName: name || null, tone, depth });
              }}
              className="mt-4 rounded-sm border border-input bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Save preferences
            </button>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-xl">Marked moments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A dated moment you choose to record. Used to rank relevance — never to make a claim
              about you.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="technical text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1.5 rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
                />
              </label>
              <label className="block">
                <span className="technical text-muted-foreground">Domain</span>
                <select
                  value={eventDomain}
                  onChange={(e) => setEventDomain(e.target.value)}
                  className="mt-1.5 rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                >
                  {["identity", "relationships", "work", "inner-life", "structure"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block flex-1">
                <span className="technical text-muted-foreground">What happened</span>
                <input
                  value={eventLabel}
                  onChange={(e) => setEventLabel(e.target.value)}
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                />
              </label>
              <button
                type="button"
                disabled={!eventDate || !eventLabel || addMoment.isPending}
                onClick={() => addMoment.mutate()}
                className="rounded-sm border border-input bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <ul className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
              {(journal.data?.events ?? []).map((e) => (
                <li key={e.id}>
                  {e.occurred_on} · {e.domain} · {e.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12 border-t border-rule pt-6">
            <h2 className="font-serif text-xl">Your data</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={doExport.isPending}
                onClick={() => doExport.mutate()}
                className="rounded-sm border border-input bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
              >
                Export everything (JSON)
              </button>
              <button
                type="button"
                disabled={doErase.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Destroy birth details, chart, readings, notes and the encryption key? This cannot be undone.",
                    )
                  ) {
                    doErase.mutate();
                  }
                }}
                className="rounded-sm border border-destructive px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                Delete my data
              </button>
            </div>
          </section>
        </div>

        <Rail title="Status">
          <Field
            label="Chart"
            value={boot.data ? (boot.data.hasChart ? "calculated" : "missing") : "—"}
          />
          <Field label="Tier 1 on" value={consentUnknown ? "—" : granted.size} />
          <Field label="Check-ins" value={journal.data?.checkIns.length ?? "—"} />
          <Field label="Moments" value={journal.data?.events.length ?? "—"} />
          <Field label="Feedback" value={journal.data?.feedback.length ?? "—"} />
          <p className="pt-2 text-xs">
            Editorial content is published into the app by a signed release; it never receives your
            chart, notes or readings.
          </p>
        </Rail>
      </div>
    </Shell>
  );
}
