import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Shell } from "@/components/pattern/Shell";
import { saveBirthProfile } from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Birth details — Pattern" },
      {
        name: "description",
        content:
          "Enter birth date, time accuracy and place so Pattern can calculate your chart.",
      },
      { property: "og:title", content: "Birth details — Pattern" },
      {
        property: "og:description",
        content: "Time accuracy is first class: unknown time suppresses angle claims.",
      },
    ],
  }),
  component: Onboarding,
});

const ACCURACY = [
  { value: "exact", label: "Exact", note: "From a record, to the minute." },
  { value: "near", label: "Within ~15 min", note: "Remembered closely." },
  { value: "hour", label: "Within an hour", note: "Rough recollection." },
  { value: "unknown", label: "Unknown", note: "Houses and angles get suppressed." },
] as const;

function localTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function Onboarding() {
  const navigate = useNavigate();
  const save = useServerFn(saveBirthProfile);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [accuracy, setAccuracy] = useState<(typeof ACCURACY)[number]["value"]>("exact");
  const [placeLabel, setPlaceLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState(localTz());
  const [lookingUp, setLookingUp] = useState(false);

  const submit = useMutation({
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
        },
      }),
    onSuccess: () => {
      toast.success("Chart calculated and fingerprinted.");
      void navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function lookupPlace() {
    if (!placeLabel.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(placeLabel)}`,
      );
      const json = (await res.json()) as {
        results?: { latitude: number; longitude: number; timezone: string; name: string; country?: string }[];
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

  const ready = birthDate && placeLabel && latitude !== "" && longitude !== "" && timezone;

  return (
    <Shell>
      <div className="mx-auto max-w-xl animate-rise">
        <h1 className="text-3xl">Birth details</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stored encrypted. Used only to compute positions, angles and cycles — never
          shared with the editorial system.
        </p>

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
              className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            />
          </label>

          <fieldset>
            <legend className="technical text-muted-foreground">Time accuracy</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ACCURACY.map((a) => (
                <button
                  key={a.value}
                  type="button"
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
          </fieldset>

          {accuracy !== "unknown" ? (
            <label className="block">
              <span className="technical text-muted-foreground">Birth time (local)</span>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
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
            <div className="mt-3 grid grid-cols-3 gap-2">
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
              <label className="block">
                <span className="technical text-muted-foreground">Zone</span>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1.5 w-full rounded-sm border border-input bg-card px-2 py-1.5 font-mono text-xs outline-none focus:border-ring"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!ready || submit.isPending}
            className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submit.isPending ? "Calculating…" : "Calculate my chart"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
