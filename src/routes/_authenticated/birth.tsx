import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { clearPatternQueries, clearReadingContextQueries } from "@/lib/pattern-query-cache";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BirthChangeSummary } from "@/lib/pattern.server";

import { Field, Rail, Shell } from "@/components/pattern/Shell";
import { fetchBirthRecord, saveBirthProfile } from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/birth")({
  head: () => ({
    meta: [
      { title: "Birth record — Pattern" },
      {
        name: "description",
        content:
          "Review and correct the date, time and place your chart is calculated from. Stored encrypted.",
      },
      { property: "og:title", content: "Birth record — Pattern" },
      {
        property: "og:description",
        content:
          "Correcting a birth detail recalculates the chart and re-fingerprints the snapshot.",
      },
    ],
  }),
  component: BirthPage,
});

const ACCURACY = [
  { value: "exact", label: "Exact", note: "From a record, to the minute." },
  { value: "near", label: "Within ~15 min", note: "Remembered closely." },
  { value: "hour", label: "Within an hour", note: "Rough recollection." },
  { value: "unknown", label: "Unknown", note: "Houses and angles get suppressed." },
] as const;

type Accuracy = (typeof ACCURACY)[number]["value"];

function localTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const inputClass =
  "mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring";

function BirthSaveFeedback({ summary }: { summary: BirthChangeSummary }) {
  const labels = {
    date: "date",
    time: "time",
    accuracy: "time accuracy",
    place: "place or timezone",
  };
  const changed = summary.changedFields.map((field) => labels[field]).join(", ");
  const source = summary.current.engine.startsWith("swiss-ephemeris")
    ? "Swiss Ephemeris"
    : "Approximate fallback";
  const support =
    summary.current.housesSupported && summary.current.anglesSupported
      ? "Your birth time supports house and angle descriptions."
      : !summary.current.housesSupported && !summary.current.anglesSupported
        ? "House and angle descriptions are suppressed for an unknown birth time."
        : "House descriptions are suppressed at this time accuracy; angle descriptions remain available.";
  return (
    <section
      role="status"
      aria-live="polite"
      className="mt-6 border-l-2 border-primary bg-evidence p-4 text-sm text-evidence-foreground"
    >
      <h2 className="font-medium">
        {summary.previous === null
          ? "Birth chart saved"
          : summary.unchanged
            ? "Birth details are unchanged"
            : "Birth details updated"}
      </h2>
      {!summary.unchanged ? (
        <p className="mt-2">
          {summary.previous === null ? "Recorded" : "Changed"}: {changed}.
        </p>
      ) : null}
      <p className="mt-2">
        {source} ·{" "}
        {summary.current.precision === "high"
          ? "high-precision positions"
          : "approximate positions"}{" "}
        ·{" "}
        {summary.current.houseSystem === "Placidus" ||
        summary.current.houseSystem.toLowerCase() === "placidus"
          ? "Placidus"
          : summary.current.houseSystem}{" "}
        houses.
      </p>
      <p className="mt-2">{support}</p>
      {summary.previous && summary.previous.precision !== summary.current.precision ? (
        <p className="mt-2">
          Position precision changed from{" "}
          {summary.previous.precision === "high" ? "high" : "approximate"} to{" "}
          {summary.current.precision === "high" ? "high" : "approximate"}.
        </p>
      ) : null}
    </section>
  );
}

function BirthPage() {
  const load = useServerFn(fetchBirthRecord);
  const save = useServerFn(saveBirthProfile);
  const qc = useQueryClient();

  const query = useQuery({ queryKey: ["birth-record"], queryFn: () => load({}) });

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [accuracy, setAccuracy] = useState<Accuracy>("exact");
  const [placeLabel, setPlaceLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState(localTz());
  const [lookingUp, setLookingUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [revision, setRevision] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState<BirthChangeSummary | null>(null);

  const record = query.data ?? null;

  useEffect(() => {
    if (!record || hydrated) return;
    setBirthDate(record.birthDate ?? "");
    setBirthTime(record.birthTime ?? "12:00");
    setAccuracy((record.accuracy as Accuracy) ?? "exact");
    setPlaceLabel(record.placeLabel ?? "");
    setLatitude(String(record.latitude ?? ""));
    setLongitude(String(record.longitude ?? ""));
    setTimezone(record.timezone ?? localTz());
    setRevision(record.revision);
    setHydrated(true);
  }, [record, hydrated]);

  const submit = useMutation({
    onMutate: () => setChangeSummary(null),
    mutationFn: () =>
      save({
        data: {
          birthDate,
          birthTime: accuracy === "unknown" ? "12:00" : birthTime,
          placeLabel,
          latitude: Number(latitude),
          longitude: Number(longitude),
          timezone,
          accuracy,
          expectedRevision: revision,
        },
      }),
    onSuccess: async (result) => {
      setRevision(result.revision);
      setChangeSummary(result.changeSummary);
      await clearPatternQueries(qc);
      await clearReadingContextQueries(qc);
      void qc.invalidateQueries({ queryKey: ["birth-record"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
      void qc.invalidateQueries({ queryKey: ["cycles"] });
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
  });

  async function reloadSavedDetails() {
    const result = await query.refetch();
    if (!result.data) return;
    const saved = result.data;
    setBirthDate(saved.birthDate);
    setBirthTime(saved.birthTime);
    setAccuracy(saved.accuracy as Accuracy);
    setPlaceLabel(saved.placeLabel);
    setLatitude(String(saved.latitude));
    setLongitude(String(saved.longitude));
    setTimezone(saved.timezone);
    setRevision(saved.revision);
    setHydrated(true);
    setChangeSummary(null);
    submit.reset();
  }

  async function lookupPlace() {
    if (!placeLabel.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(placeLabel)}`,
      );
      const json = (await res.json()) as {
        results?: {
          latitude: number;
          longitude: number;
          timezone: string;
          name: string;
          country?: string;
        }[];
      };
      const hit = json.results?.[0];
      if (!hit) {
        toast.error("No match. Enter coordinates manually.");
        return;
      }
      setLatitude(hit.latitude.toFixed(4));
      setLongitude(hit.longitude.toFixed(4));
      if (hit.timezone) setTimezone(hit.timezone);
      setPlaceLabel(hit.country ? `${hit.name}, ${hit.country}` : hit.name);
      toast.success("Coordinates and zone resolved.");
    } catch {
      toast.error("Lookup failed. Enter coordinates manually.");
    } finally {
      setLookingUp(false);
    }
  }

  const ready =
    birthDate !== "" &&
    placeLabel.trim() !== "" &&
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    timezone !== "";

  return (
    <Shell>
      <div className="grid animate-rise gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl">Birth record</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Everything on your pattern and timing pages is calculated from these four things: the
            date, the time, how sure you are of the time, and the place. Correct any of them and the
            new chart is saved together with the corrected details. Your journal and saved readings
            stay available under their retention settings.
          </p>

          {query.isPending ? (
            <div className="mt-8 space-y-3" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-sm bg-secondary" />
              ))}
            </div>
          ) : query.error ? (
            <div className="mt-8 border-l-2 border-destructive bg-card p-4">
              <p className="text-sm text-destructive">{query.error.message}</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-3 rounded-sm border border-input bg-card px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {changeSummary ? <BirthSaveFeedback summary={changeSummary} /> : null}
              {submit.error ? (
                <div
                  role="alert"
                  className="mt-6 border-l-2 border-destructive bg-card p-4 text-sm"
                >
                  <p>{submit.error.message}</p>
                  {submit.error.message.includes("changed in another tab") ? (
                    <Button
                      variant="outline"
                      type="button"
                      className="mt-3"
                      onClick={() => void reloadSavedDetails()}
                      disabled={query.isFetching}
                    >
                      Reload saved details
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {!record ? (
                <p className="mt-6 border-l-2 border-primary bg-evidence px-3 py-2 text-sm text-evidence-foreground">
                  You have no birth record yet. Fill this in and your chart will be calculated for
                  the first time.
                </p>
              ) : null}

              <form
                className="mt-8 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit.mutate();
                }}
              >
                <label className="block">
                  <span className="technical text-muted-foreground">Birth date</span>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </label>

                <fieldset>
                  <legend className="technical text-muted-foreground">
                    How sure are you of the time?
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ACCURACY.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        aria-pressed={accuracy === a.value}
                        onClick={() => setAccuracy(a.value)}
                        className={`rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                          accuracy === a.value
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-input bg-card hover:bg-secondary"
                        }`}
                      >
                        <span className="block font-medium">{a.label}</span>
                        <span className="block text-xs text-muted-foreground">{a.note}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    This is your declared accuracy, not a verified birth time. Saving or
                    recalculating checks eligible natal origins at the recorded time and both
                    uncertainty boundaries. This also prepares transit-story timing from the same
                    calculation source. Saving recalculates your chart; existing readings keep their
                    original evidence. Unknown time omits daily natal lenses and transit stories; if
                    the service or a sample is unavailable, the ordinary reading remains available.
                  </p>
                </fieldset>

                {accuracy !== "unknown" ? (
                  <label className="block">
                    <span className="technical text-muted-foreground">Birth time (local)</span>
                    <input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </label>
                ) : (
                  <p className="border-l-2 border-primary bg-evidence px-3 py-2 text-xs text-evidence-foreground">
                    With an unknown time, houses, ascendant, midheaven and fast Moon claims are
                    suppressed rather than guessed. Everything else still calculates.
                  </p>
                )}

                <div>
                  <label className="block">
                    <span className="technical text-muted-foreground">Birth place</span>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        required
                        value={placeLabel}
                        onChange={(e) => setPlaceLabel(e.target.value)}
                        placeholder="City, country"
                        className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                      />
                      <button
                        type="button"
                        onClick={() => void lookupPlace()}
                        disabled={lookingUp}
                        className="shrink-0 rounded-sm border border-input bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-50"
                      >
                        {lookingUp ? "…" : "Resolve"}
                      </button>
                    </div>
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="technical text-muted-foreground">Lat</span>
                      <input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="mt-1.5 w-full rounded-sm border border-input bg-card px-2 py-1.5 font-mono text-xs outline-none focus:border-ring"
                      />
                    </label>
                    <label className="block">
                      <span className="technical text-muted-foreground">Lon</span>
                      <input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="mt-1.5 w-full rounded-sm border border-input bg-card px-2 py-1.5 font-mono text-xs outline-none focus:border-ring"
                      />
                    </label>
                    <label className="col-span-2 block sm:col-span-1">
                      <span className="technical text-muted-foreground">Time zone</span>
                      <input
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="mt-1.5 w-full rounded-sm border border-input bg-card px-2 py-1.5 font-mono text-xs outline-none focus:border-ring"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
                  <button
                    type="submit"
                    disabled={!ready || submit.isPending}
                    className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submit.isPending
                      ? "Recalculating…"
                      : record
                        ? "Save and recalculate"
                        : "Calculate my chart"}
                  </button>
                  <Link to="/pattern" className="technical text-primary">
                    See the chart snapshot
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        <Rail title="Stored record">
          {record ? (
            <>
              <Field label="Date" value={record.birthDate} />
              <Field
                label="Time"
                value={record.accuracy === "unknown" ? "unknown" : record.birthTime}
              />
              <Field label="Accuracy" value={record.accuracy} />
              <Field label="Place" value={record.placeLabel} />
              <Field label="Zone" value={record.timezone} />
              <Field
                label="Fingerprint"
                value={<span className="break-all">{record.fingerprint.slice(0, 16)}…</span>}
              />
              <Field label="Last changed" value={new Date(record.updated_at).toLocaleString()} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing stored yet.</p>
          )}
        </Rail>
      </div>
    </Shell>
  );
}
