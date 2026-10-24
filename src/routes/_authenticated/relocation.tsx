import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useId, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceLookup } from "@/hooks/usePlaceLookup";
import {
  ANGLE_KINDS,
  ANGLE_THEME,
  crossingsNear,
  lineCrossings,
  linesFor,
  nearbyLines,
  relocatedAngles,
  type AngleKind,
} from "@/lib/astro/astrocartography";
import { fetchPattern } from "@/lib/pattern.functions";
import {
  ANGLE_LENS,
  crossingReading,
  HISTORY,
  lineReading,
  PLANET_THEME,
} from "@/lib/astro/relocation-editorial";
import type { PlaceFields } from "@/lib/place-lookup";
import { userFacingError } from "@/lib/user-facing-error";

const RelocationMap = lazy(() => import("@/components/pattern/RelocationMap"));

export const Route = createFileRoute("/_authenticated/relocation")({
  head: () => ({
    meta: [
      { title: "Relocation map — Pattern" },
      {
        name: "description",
        content:
          "See where on Earth each planet in your birth chart was rising, setting or overhead.",
      },
      { property: "og:title", content: "Relocation map — Pattern" },
      {
        property: "og:description",
        content: "Explore your planetary lines and how a city reshapes your chart's angles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelocationPage,
});

const LINE_BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];
const ANGLE_SWATCH: Record<AngleKind, string> = {
  MC: "bg-chart-1",
  IC: "bg-chart-2",
  AC: "bg-chart-3",
  DC: "bg-chart-4",
};

type PatternData = Extract<Awaited<ReturnType<typeof fetchPattern>>, { needsOnboarding: false }>;

function RelocationPage() {
  const load = useServerFn(fetchPattern);
  const q = useQuery({ queryKey: ["pattern"], queryFn: () => load({}) });
  return (
    <Shell>
      {q.isPending ? (
        <div aria-busy="true" className="space-y-3">
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <div className="h-80 animate-pulse bg-muted" />
        </div>
      ) : q.error ? (
        <div role="alert" className="max-w-xl border border-destructive p-4">
          <h1 className="text-2xl sm:text-3xl">Relocation map</h1>
          <p className="mt-3 text-sm text-destructive">
            {userFacingError(q.error, "Your chart couldn’t load. You can try again.")}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
            className="mt-4"
          >
            <RotateCcw aria-hidden="true" />
            {q.isFetching ? "Trying again…" : "Try again"}
          </Button>
        </div>
      ) : !q.data || q.data.needsOnboarding ? (
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl">No chart yet</h1>
          <Link
            to="/onboarding"
            className="technical mt-6 inline-flex min-h-11 items-center text-primary"
          >
            Enter birth details
          </Link>
        </div>
      ) : (
        <RelocationView data={q.data} />
      )}
    </Shell>
  );
}

function RelocationView({ data }: { data: PatternData }) {
  const id = useId();
  const utcISO = data.sources?.utcISO ?? null;
  const suppressed = data.uncertainty.angleClaimsSuppressed || !utcISO;
  const bodies = useMemo(
    () =>
      data.placements
        .filter((p) => LINE_BODIES.includes(p.key) && typeof p.lon === "number")
        .map((p) => ({ key: p.key, label: p.label, lon: p.lon as number })),
    [data.placements],
  );
  const allLines = useMemo(
    () => (utcISO && !suppressed ? linesFor(bodies, utcISO) : []),
    [bodies, utcISO, suppressed],
  );
  const [hiddenBodies, setHiddenBodies] = useState<Set<string>>(() => new Set());
  const [hiddenAngles, setHiddenAngles] = useState<Set<AngleKind>>(() => new Set());
  const lines = useMemo(
    () => allLines.filter((l) => !hiddenBodies.has(l.body) && !hiddenAngles.has(l.angle)),
    [allLines, hiddenBodies, hiddenAngles],
  );

  const cityInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<PlaceFields>({
    placeLabel: "",
    latitude: "",
    longitude: "",
    timezone: "",
  });
  const [selected, setSelected] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const place = usePlaceLookup({
    fields,
    onResolve: (next) => {
      setFields(next);
      setSelected({
        latitude: Number(next.latitude),
        longitude: Number(next.longitude),
        label: next.placeLabel,
      });
    },
  });

  function toggle<T>(set: Set<T>, value: T, apply: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply(next);
  }

  const nearby = selected
    ? nearbyLines(allLines, [selected.longitude, selected.latitude], 800)
    : [];
  const crossings = useMemo(() => lineCrossings(allLines), [allLines]);
  const nearCross = selected ? crossingsNear(crossings, selected.latitude).slice(0, 6) : [];
  const relocated =
    selected && utcISO && !suppressed
      ? relocatedAngles(utcISO, selected.latitude, selected.longitude)
      : null;

  return (
    <div className="animate-rise max-w-4xl">
      <h1 className="text-2xl sm:text-3xl">Relocation map</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Each line marks where on Earth one of your planets was rising, setting, overhead or
        underfoot at the moment you were born. Search a city or tap the map to see which lines run
        nearby.
      </p>

      {suppressed ? (
        <div className="mt-8 max-w-xl border border-rule bg-evidence p-4 text-sm">
          <p>
            Planetary lines depend on your exact birth time—four minutes moves a line about one
            degree of longitude. Your saved birth time is too uncertain to place them honestly.
          </p>
          <Link
            to="/birth"
            className="technical mt-4 inline-flex min-h-11 items-center text-primary"
          >
            Update birth details
          </Link>
        </div>
      ) : (
        <>
          <section aria-label="Explore a city" className="mt-6 max-w-xl">
            <label htmlFor={`${id}-city`} className="technical text-muted-foreground">
              Explore a city
            </label>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void place.lookup();
              }}
            >
              <Input
                ref={cityInput}
                id={`${id}-city`}
                value={fields.placeLabel}
                autoComplete="off"
                placeholder="City or town"
                onChange={(e) => {
                  const v = e.target.value;
                  setFields({ placeLabel: v, latitude: "", longitude: "", timezone: "" });
                  place.invalidate();
                  place.scheduleLookup(v);
                }}
              />
              <Button type="submit" variant="outline" disabled={place.pending}>
                {place.pending ? "Finding…" : "Find"}
              </Button>
            </form>
            {place.error && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {place.error}
              </p>
            )}
            <p role="status" aria-live="polite" className="sr-only">
              {place.pending
                ? "Finding matching places…"
                : place.candidates.length
                  ? `${place.candidates.length} matching places.`
                  : ""}
            </p>
            {place.candidates.length > 0 && (
              <ul aria-label="Matching places" className="mt-2 space-y-2">
                {place.candidates.map((c) => (
                  <li key={c.id}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
                      onClick={() => {
                        // The chosen button unmounts; keep focus in the search field.
                        if (place.select(c)) cityInput.current?.focus({ preventScroll: true });
                      }}
                    >
                      {c.label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-6">
            <ClientOnly
              fallback={<div className="h-[340px] animate-pulse bg-muted sm:h-[460px]" />}
            >
              <Suspense
                fallback={<div className="h-[340px] animate-pulse bg-muted sm:h-[460px]" />}
              >
                <RelocationMap
                  lines={lines}
                  selected={selected}
                  onPick={(latitude, longitude) => {
                    place.invalidate();
                    setFields({ placeLabel: "", latitude: "", longitude: "", timezone: "" });
                    setSelected({
                      latitude,
                      longitude,
                      label: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
                    });
                  }}
                />
              </Suspense>
            </ClientOnly>
          </div>

          <fieldset className="mt-4">
            <legend className="technical text-muted-foreground">Angles</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ANGLE_KINDS.map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={hiddenAngles.has(a) ? "outline" : "secondary"}
                  aria-pressed={!hiddenAngles.has(a)}
                  onClick={() => toggle(hiddenAngles, a, setHiddenAngles)}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${ANGLE_SWATCH[a]}`}
                  />
                  {a} · {ANGLE_THEME[a].name}
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-3">
            <legend className="technical text-muted-foreground">Planets</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {bodies.map((b) => (
                <Button
                  key={b.key}
                  type="button"
                  size="sm"
                  variant={hiddenBodies.has(b.key) ? "outline" : "secondary"}
                  aria-pressed={!hiddenBodies.has(b.key)}
                  onClick={() => toggle(hiddenBodies, b.key, setHiddenBodies)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </fieldset>

          {selected && relocated ? (
            <section aria-live="polite" className="mt-8 border border-rule p-4 sm:p-5">
              <h2 className="text-xl">{selected.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Born at the same moment here, your rising sign would be{" "}
                <strong className="text-foreground">{relocated.risingSign}</strong> and your
                Midheaven <strong className="text-foreground">{relocated.midheavenSign}</strong>.
              </p>
              {nearby.length ? (
                <ul className="mt-4 divide-y divide-rule">
                  {nearby.map(({ line, km }) => (
                    <li key={line.id} className="flex flex-wrap items-baseline gap-x-3 py-3">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${ANGLE_SWATCH[line.angle]}`}
                      />
                      <span className="font-medium">
                        {line.label} {ANGLE_THEME[line.angle].name}
                      </span>
                      <span className="technical text-muted-foreground">
                        {km < 50 ? "right here" : `about ${Math.round(km / 10) * 10} km away`}
                      </span>
                      <span className="basis-full text-sm text-muted-foreground">
                        {lineReading(line.body, line.label, line.angle)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No planetary lines run within 800 km of here.
                </p>
              )}
              {nearCross.length ? (
                <div className="mt-6">
                  <h3 className="technical text-muted-foreground">
                    Line crossings on this latitude
                  </h3>
                  <ul className="mt-2 divide-y divide-rule">
                    {nearCross.map((c) => (
                      <li key={c.id} className="py-3 text-sm">
                        <span className="font-medium">
                          {c.a.label} {c.a.angle} × {c.b.label} {c.b.angle}
                        </span>{" "}
                        <span className="technical text-muted-foreground">
                          at {Math.abs(c.lat).toFixed(1)}°{c.lat >= 0 ? "N" : "S"}
                        </span>
                        <p className="mt-1 text-muted-foreground">{crossingReading(c.a, c.b)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby={`${id}-guide`} className="mt-10">
            <h2 id={`${id}-guide`} className="text-xl">
              Reading the lines
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {ANGLE_KINDS.map((a) => (
                <div key={a} className="border border-rule p-4">
                  <dt className="flex items-center gap-2 font-medium">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${ANGLE_SWATCH[a]}`}
                    />
                    {a} · {ANGLE_THEME[a].name}
                  </dt>
                  <dd className="mt-2 text-sm text-muted-foreground">
                    A planet here {ANGLE_LENS[a]}
                  </dd>
                </div>
              ))}
            </dl>
            <details className="mt-4 border border-rule p-4">
              <summary className="min-h-11 cursor-pointer font-medium">
                What each planet brings
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {bodies.map((b) => (
                  <li key={b.key}>
                    <span className="font-medium">{b.label}</span>{" "}
                    <span className="text-muted-foreground">— {PLANET_THEME[b.key]}</span>
                  </li>
                ))}
              </ul>
            </details>
            <details className="mt-3 border border-rule p-4">
              <summary className="min-h-11 cursor-pointer font-medium">History and context</summary>
              <div className="mt-3 space-y-4 text-sm">
                {HISTORY.map((h) => (
                  <div key={h.title}>
                    <h3 className="font-medium">{h.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{h.body}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Lines and relocated angles are calculated in Pattern from your chart’s planet positions
            and birth moment, using each planet’s real orbital latitude so Moon and Pluto lines
            follow their true paths.{" "}
            <Link to="/accuracy" className="text-primary underline">
              Check the birth details used
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
