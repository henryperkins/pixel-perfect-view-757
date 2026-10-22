import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { fetchPattern } from "@/lib/pattern.functions";
import { userFacingError } from "@/lib/user-facing-error";
import { plainAccuracy, plainEngineLabel, plainPrecision } from "@/lib/plain-engine";

export const Route = createFileRoute("/_authenticated/sources")({
  head: () => ({
    meta: [
      { title: "Chart sources — Pattern" },
      {
        name: "description",
        content: "Where every placement, house and connection in your chart comes from.",
      },
      { property: "og:title", content: "Chart sources — Pattern" },
      {
        property: "og:description",
        content: "Check each calculated value in your chart against its source.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SourcesPage,
});

type Src = "service" | "in-app" | undefined | null;

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function fmtLon(lon: number) {
  const n = ((lon % 360) + 360) % 360;
  const sign = SIGNS[Math.floor(n / 30)]!;
  const d = n % 30;
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}' ${sign}`;
}

function name(k: string) {
  if (k === "node") return "North Node";
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function SourceChip({ src }: { src: Src }) {
  const service = src === "service";
  return (
    <span
      className={`technical inline-block min-w-0 max-w-full rounded-sm border px-1.5 py-0.5 [overflow-wrap:anywhere] ${
        service
          ? "border-rule bg-accent text-accent-foreground"
          : "border-rule bg-secondary text-muted-foreground"
      }`}
    >
      {service ? "Swiss Ephemeris" : src === "in-app" ? "Calculated in Pattern" : "Unrecorded"}
    </span>
  );
}

function SourcesPage() {
  const load = useServerFn(fetchPattern);
  const q = useQuery({ queryKey: ["pattern"], queryFn: () => load({}) });

  return (
    <Shell>
      {q.isPending ? (
        <div aria-busy="true" className="space-y-3">
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <div className="h-40 animate-pulse bg-muted" />
        </div>
      ) : q.error ? (
        <div role="alert" className="max-w-xl border border-destructive p-4">
          <h1 className="text-2xl sm:text-3xl">Chart sources</h1>
          <p className="mt-3 text-sm text-destructive">
            {userFacingError(q.error, "Your chart sources couldn’t load. You can try again.")}
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
        <SourcesView data={q.data} />
      )}
    </Shell>
  );
}

function SourcesView({
  data,
}: {
  data: Extract<Awaited<ReturnType<typeof fetchPattern>>, { needsOnboarding: false }>;
}) {
  const s = data.sources;
  const birth = data.snapshot.birth;
  const angles = data.placements.filter((p) => p.angleDependent);
  const bodies = data.placements.filter((p) => !p.angleDependent);

  return (
    <div className="animate-rise max-w-3xl">
      <Link to="/pattern" className="technical inline-flex min-h-11 items-center text-primary">
        <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" /> Your pattern
      </Link>
      <h1 className="mt-4 text-2xl sm:text-3xl">Chart sources</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Each value below shows where it came from, so you can check it in any chart program.
      </p>

      <section className="mt-8 border border-rule bg-evidence p-4">
        <h2 className="technical text-muted-foreground">Calculated for</h2>
        <dl className="mt-2 grid gap-1 font-mono text-xs text-evidence-foreground sm:grid-cols-2">
          <dt className="text-muted-foreground">Moment (UTC)</dt>
          <dd>{s?.utcISO ?? "—"}</dd>
          <dt className="text-muted-foreground">Latitude, longitude</dt>
          <dd>{s ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : "—"}</dd>
          {birth ? (
            <>
              <dt className="text-muted-foreground">Birthplace</dt>
              <dd>{birth.placeLabel}</dd>
              <dt className="text-muted-foreground">Local time</dt>
              <dd>
                {birth.birthDate} {birth.birthTime} · {birth.timezone}
              </dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Calculation source</dt>
          <dd>{plainEngineLabel(data.engine)}</dd>
          <dt className="text-muted-foreground">Precision</dt>
          <dd>{plainPrecision(data.ephemeris.precision)}</dd>
          <dt className="text-muted-foreground">Birth-time accuracy</dt>
          <dd>{plainAccuracy(data.uncertainty.accuracy)}</dd>
          <dt className="text-muted-foreground">House system</dt>
          <dd>{data.houseSystem}</dd>
        </dl>
        {!data.uncertainty.housesReliable ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Calculated house values are shown for reference, but house descriptions are left out
            because the birth time is uncertain.
            {data.uncertainty.angleClaimsSuppressed ? " Angle descriptions are also left out." : ""}
          </p>
        ) : null}
      </section>

      <Section title="Placements" src={s?.positions ?? null}>
        {bodies.map((p) => (
          <Row
            key={p.key}
            label={p.label}
            value={`${p.position}${p.retrograde ? " · retrograde" : ""}`}
          />
        ))}
      </Section>

      <Section title="Angles" src={s?.angles ?? null}>
        {angles.map((p) => (
          <Row
            key={p.key}
            label={p.key === "midheaven" ? "Midheaven (MC)" : p.label}
            value={p.key === "midheaven" ? `${p.position} · House ${p.house}` : p.position}
          />
        ))}
        <li className="py-3 text-xs leading-relaxed text-muted-foreground">
          {s?.angles === "service" && data.houseSystem.toLowerCase() === "placidus"
            ? "In the Placidus system the Midheaven defines where the tenth house begins, so “House 10” is its definition here—not a separate score assigned by Pattern."
            : "The Midheaven’s house follows the house system shown above; under whole-sign houses it can land in houses 9–11 rather than 10, and the house number then comes from the same calculation as the source chip here."}
        </li>
      </Section>

      <Section title="House boundaries" src={s?.houses ?? null}>
        {data.houseCusps.map((c, i) => (
          <Row key={i} label={`House ${i + 1}`} value={fmtLon(c)} />
        ))}
      </Section>

      <Section title="Connections">
        {data.allAspects.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">No connections within orb.</li>
        ) : (
          data.allAspects.map((a) => (
            <Row
              key={`${a.a}-${a.b}`}
              label={`${name(a.a)} ${a.aspect} ${name(a.b)}`}
              value={`orb ${a.orb.toFixed(2)}° · ${a.applying ? "applying" : "separating"}`}
              src={a.source}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  src,
  children,
}: {
  title: string;
  src?: Src;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 border-b border-rule pb-2">
        <h2 className="min-w-0 text-lg">{title}</h2>
        {src !== undefined ? <SourceChip src={src} /> : null}
      </div>
      <ul className="divide-y divide-rule">{children}</ul>
    </section>
  );
}

function Row({ label, value, src }: { label: string; value: string; src?: Src }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 py-2">
      <span className="text-sm">{label}</span>
      <span className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-xs">{value}</span>
        {src !== undefined ? <SourceChip src={src} /> : null}
      </span>
    </li>
  );
}
