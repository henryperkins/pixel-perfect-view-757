import { useMemberDraftLifecycle } from "@/components/pattern/MemberDraftProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { clearPatternQueries, clearReadingContextQueries } from "@/lib/pattern-query-cache";
import { LIFE_DOMAINS, type LifeDomain } from "@/lib/context-policy";
import { DOMAIN_LABEL } from "@/components/pattern/timing";
import { CurrentLocation } from "@/components/pattern/CurrentLocation";
import { MembershipSettings } from "@/components/pattern/MembershipSettings";
import { AccountSecurity } from "@/components/pattern/AccountSecurity";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import {
  addEvent,
  resetPersonalization,
  deleteAccount,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const deviceDrafts = useMemberDraftLifecycle();
  const bootstrapFn = useServerFn(fetchBootstrap);
  const consentFn = useServerFn(updateConsent);
  const prefsFn = useServerFn(savePrefs);
  const exportFn = useServerFn(exportData);
  const resetFn = useServerFn(resetPersonalization);
  const deleteFn = useServerFn(deleteAccount);
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [prefsReset, setPrefsReset] = useState(0);
  const deleteTrigger = useRef<HTMLButtonElement>(null);

  const granted = new Set(
    (boot.data?.consents ?? []).filter((c) => c.granted).map((c) => c.source_id),
  );
  const consentUnknown = !boot.data || boot.isError;

  const toggle = useMutation({
    mutationFn: (vars: { sourceId: string; granted: boolean }) => consentFn({ data: vars }),
    onSuccess: async (_result, vars) => {
      if (vars.sourceId === "WEL01" || vars.sourceId === "WEL03") {
        await deviceDrafts.invalidateConsentFields({
          sleep: vars.sourceId === "WEL01" ? vars.granted : granted.has("WEL01"),
          stress: vars.sourceId === "WEL03" ? vars.granted : granted.has("WEL03"),
        });
      }
      await clearPatternQueries(qc);
      await clearReadingContextQueries(qc);
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
      void qc.invalidateQueries({ queryKey: ["cycles"] });
    },
    onError: async (e: Error) => {
      await clearReadingContextQueries(qc);
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
      toast.error(e.message);
    },
  });
  const consentControlsDisabled = consentUnknown || boot.isFetching || toggle.isPending;

  const prefs = useMutation({
    mutationFn: (vars: {
      displayName: string | null;
      tone: string;
      depth: string;
      domainPref: LifeDomain | null;
    }) =>
      prefsFn({
        data: {
          displayName: vars.displayName,
          tone: vars.tone as "plain" | "warm" | "clinical",
          depth: vars.depth as "standard" | "technical",
          domainPref: vars.domainPref,
        },
      }),
    onSuccess: async () => {
      await clearPatternQueries(qc);
      await clearReadingContextQueries(qc);
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

  const doReset = useMutation({
    mutationFn: () => resetFn({}),
    onSuccess: async () => {
      await clearPatternQueries(qc);
      await clearReadingContextQueries(qc);
      await qc.invalidateQueries({ queryKey: ["bootstrap"] });
      setPrefsReset((value) => value + 1);
      await deviceDrafts.invalidateConsentFields({ sleep: false, stress: false });
      toast.success("Personalization reset. Your account, chart and journal are kept.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const doDelete = useMutation({
    mutationFn: () => deleteFn({ data: { password } }),
    onSuccess: async () => {
      await qc.cancelQueries();
      qc.clear();
      setPassword("");
      try {
        await deviceDrafts.purgeAccountDrafts();
      } catch {
        /* Root retries cleanup. */
      }
      window.location.assign("/auth");
    },
  });

  const profile = boot.data?.profile;

  return (
    <Shell>
      <div className="grid animate-rise gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="privacy-main min-w-0">
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

          <MembershipSettings />
          <section
            className="mt-10 border-t border-rule pt-6"
            aria-labelledby="device-drafts-heading"
          >
              <h2 id="device-drafts-heading" className="font-serif text-xl">
              Drafts on this device
            </h2>
            <p className="mt-2 text-sm">
              Unfinished birth details, check-ins and journal entries are encrypted in this browser.
              Drafts expire after seven days without edits and are cleared when you sign out. Save
              your details or entry to keep them in your account.
            </p>
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer py-3">Clear device drafts</summary>
              <p className="my-2 text-sm">
                This removes unsaved drafts from this browser. Saved account entries are kept.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await deviceDrafts.purgeAccountDrafts({ resume: true });
                    toast.success("Device drafts cleared.");
                  } catch {
                    toast.error("Device drafts could not be cleared.");
                  }
                }}
              >
                Confirm clear device drafts
              </Button>
            </details>
            {deviceDrafts.error && (
              <p role="alert" className="mt-2 text-sm">
                {deviceDrafts.error}
              </p>
            )}
          </section>
          <AccountSecurity />
          <section className="mt-8 max-w-2xl" aria-labelledby="reading-language-privacy">
            <h2 id="reading-language-privacy" className="font-serif text-xl">
              How reading language is written
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chart calculations use Swiss Ephemeris through AstroWay or Pattern’s own calculation
              service hosted on Fly.io. The configured service receives birth date, time and
              coordinates. Pattern’s service does not store calculation requests or log their
              contents. Its{" "}
              <a
                href="https://pattern-transit-calc.fly.dev/source"
                className="underline underline-offset-4"
              >
                calculation source code
              </a>{" "}
              is available under the GNU Affero General Public License.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Google Gemini, through Gemini Enterprise or the Lovable AI gateway, can write from
              calculated chart facts and curated interpretation text. Tone and depth preferences are
              included only when their source switches are on. With those switches off, readings use
              plain tone and standard depth.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Raw birth details, journal notes, check-in bands, sleep and stress bands, device
              timezone and local time-of-day context are never sent to the language provider.
              Context switches allow only the local uses listed below; turning them on does not
              authorize sending that context to a model.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A daily reading may also send one selected, chart-derived natal interpretation to the
              language provider. Its raw natal origins—signs, houses, aspects and uncertainty
              proofs—are omitted from the daily prompt. The derived wording remains personal
              information and can allow inference; it is not anonymous data or a psychological
              assessment. Its saved copy and detailed origins are encrypted and included in your own
              export.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              When qualified event timing is available, a daily reading may also send a calculated
              contact count, chapter, approved dates and reviewed conditional interpretation to the
              language provider. These derived dates remain personal information. Raw birth details,
              anchor samples, numerical proofs and private episode identifiers stay out of the
              prompt. The ephemeris service receives the selected transit, three natal longitudes
              and the calculation time to determine contacts. Saved anchors and detailed story
              evidence are encrypted, included in your export and removed with account erasure.
              Reopening a saved reading restores its original evidence and does not recalculate its
              history.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Upcoming Timing sends the owned ephemeris service the requested range and up to nine
              screened natal position triples, in bounded groups. Raw birth details and journal text
              are omitted from these requests. Global Moon and eclipse queries need no member chart.
              Daylight queries send only the coarse current location, calendar timezone and day that
              you explicitly permit. That location is separate from birthplace, is encrypted in
              Pattern, and is replaced on change or removed after 30 days. Daylight and seasonal
              framing stay in Your Context and never enter a model request or cycle ranking.
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

          <section className="mt-8 max-w-2xl" aria-labelledby="assistant-privacy">
            <h2 id="assistant-privacy" className="font-serif text-xl">
              Connected assistants
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connecting an assistant is optional and uses a separate sign-in linked from your
              Pattern account. You approve each assistant and choose Today and timing, Pattern and
              chapters, and optionally Journal. Tools read saved results only; they cannot edit your
              data or generate new readings.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The connection also shares information from your separate assistant sign-in, including
              its account ID, email and any profile or phone information saved with it. The consent
              page shows the requested identity permissions alongside your Pattern sharing choices.
              Approving access requires both your Pattern and assistant sign-ins.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The sign-in provider also lets connected assistants edit profile information on that
              separate assistant account. Pattern content remains read-only through these tools;
              changes to your Pattern account or sharing permissions require your normal Pattern
              sign-in.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Structured birth details, coordinates and check-ins are excluded. Readings influenced
              by check-ins and older readings without a separate chart-only copy are withheld.
              Journal sharing includes your own written titles and entry text, which may contain
              sensitive details. Calculated chart information and interpretations are personal data
              and can allow inferences about you.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your selected content is decrypted on the server for an authorized read and sent to
              the assistant. The assistant’s own privacy and retention policies apply to copies it
              receives. Revoking or unlinking stops future reads, but cannot delete copies already
              received. Deleting your Pattern data also removes every assistant link and grant.
            </p>
            <Button asChild variant="link" className="mt-2 min-h-11 px-0">
              <Link to="/assistants">Manage connected assistants</Link>
            </Button>
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
                          {s.available === false ? " This context is not available yet." : ""}
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
                        <Button
                          variant={on ? "secondary" : "outline"}
                          type="button"
                          aria-label={`Use ${s.label}`}
                          aria-pressed={consentUnknown ? undefined : on}
                          aria-describedby={`source-${s.id}-meta source-${s.id}-description source-${s.id}-uses`}
                          disabled={consentControlsDisabled || (s.available === false && !on)}
                          onClick={() => toggle.mutate({ sourceId: s.id, granted: !on })}
                          className="shrink-0"
                        >
                          {consentUnknown
                            ? boot.isPending || boot.isFetching
                              ? "loading…"
                              : "unavailable"
                            : s.available === false && !on
                              ? "unavailable"
                              : on
                                ? "on"
                                : "off"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {session ? (
            <CurrentLocation
              ownerId={session.userId}
              permitted={granted.has("DEV-02")}
              disabled={consentControlsDisabled}
            />
          ) : null}
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
              Saved tone, depth and life-area focus apply when their source switches above are on.
              Focus sets the initial Timing filter. Saving does not turn a source on.
            </p>
            {profile ? (
              <form
                key={prefsReset}
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  prefs.mutate({
                    displayName: String(data.get("displayName") ?? "") || null,
                    tone: String(data.get("tone")),
                    depth: String(data.get("depth")),
                    domainPref: (String(data.get("domainPref") ?? "") || null) as LifeDomain | null,
                  });
                }}
              >
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="technical text-muted-foreground">Display name</span>
                    <input
                      defaultValue={profile?.display_name ?? ""}
                      id="display-name"
                      name="displayName"
                      autoComplete="nickname"
                      maxLength={80}
                      className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                    />
                  </label>
                  <label className="block">
                    <span className="technical text-muted-foreground">Tone</span>
                    <select
                      id="tone"
                      name="tone"
                      defaultValue={profile?.tone_pref ?? "plain"}
                      className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
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
                      name="depth"
                      defaultValue={profile?.depth_pref ?? "standard"}
                      className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                    >
                      <option value="standard">standard</option>
                      <option value="technical">technical</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="technical text-muted-foreground">Life-area focus</span>
                    <select
                      name="domainPref"
                      defaultValue={profile.domain_pref ?? ""}
                      className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                    >
                      <option value="">Every area</option>
                      {LIFE_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {DOMAIN_LABEL[domain]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button variant="outline" type="submit" disabled={prefs.isPending} className="mt-4">
                  {prefs.isPending ? "Saving…" : "Save preferences"}
                </Button>
              </form>
            ) : null}
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-xl">Marked moments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A dated moment you choose to record. With Marked moments reuse on, matching entries
              appear as Your context beside a reading, timing window or chart chapter. Saving an
              entry keeps it in your Journal even when reuse is off.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="technical text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="pattern-mobile-field mt-1.5 rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
                />
              </label>
              <label className="block">
                <span className="technical text-muted-foreground">Domain</span>
                <select
                  value={eventDomain}
                  onChange={(e) => setEventDomain(e.target.value)}
                  className="pattern-mobile-field mt-1.5 rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                >
                  {["identity", "relationships", "work", "inner-life", "structure"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block flex-1 basis-48">
                <span className="technical text-muted-foreground">What happened</span>
                <input
                  value={eventLabel}
                  onChange={(e) => setEventLabel(e.target.value)}
                  className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                />
              </label>
              <Button
                variant="outline"
                type="button"
                disabled={!eventDate || !eventLabel || addMoment.isPending}
                onClick={() => addMoment.mutate()}
              >
                Add
              </Button>
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
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Export reads your retained saved data. Reset clears optional permissions and
              preferences while keeping your login, chart, readings and Journal.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={doExport.isPending}
                onClick={() => doExport.mutate()}
              >
                {doExport.isPending ? "Preparing export…" : "Export saved data (JSON)"}
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={doReset.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset optional permissions and reading preferences? Your account, chart, readings and journal will remain.",
                    )
                  ) {
                    doReset.mutate();
                  }
                }}
              >
                {doReset.isPending ? "Resetting…" : "Reset personalization"}
              </Button>
              <Button
                ref={deleteTrigger}
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete account
              </Button>
            </div>
            {deleteOpen ? (
              <form
                className="mt-6 max-w-lg space-y-4 border border-destructive/40 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  doDelete.mutate();
                }}
              >
                <p id="delete-account-consequences" className="text-sm">
                  Delete your Pattern login, all sessions, saved chart, readings, journal and
                  encryption key, cancel your membership immediately, and stop all connected
                  assistant access. This cannot be undone. Your separate Google or assistant sign-in
                  account is kept. Provider backups follow their own retention policy. No automatic
                  refund is issued. Stripe retains legally required payment records.
                </p>
                <label className="block text-sm">
                  Current password
                  <input
                    type="password"
                    autoFocus
                    aria-describedby="delete-account-consequences"
                    autoComplete="current-password"
                    required
                    maxLength={200}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={doDelete.isPending}
                    className="pattern-mobile-field mt-2 w-full rounded-sm border border-input bg-card px-3 py-2"
                  />
                </label>
                {doDelete.error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {doDelete.error.message}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="destructive"
                    disabled={!password || doDelete.isPending}
                    type="submit"
                  >
                    {doDelete.isPending ? "Deleting account…" : "Permanently delete account"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={doDelete.isPending}
                    onClick={() => {
                      setPassword("");
                      setDeleteOpen(false);
                      doDelete.reset();
                      requestAnimationFrame(() => deleteTrigger.current?.focus());
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}
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
