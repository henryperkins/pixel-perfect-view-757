import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REFERENCE, compareChart, referenceLines, type ComparisonMethod } from "@/lib/astro/chart-comparison";
import { ANGLE_KINDS, ANGLE_THEME, linesFor, type AngleKind } from "@/lib/astro/astrocartography";

const RelocationMap = lazy(() => import("@/components/pattern/RelocationMap"));
export const Route = createFileRoute("/chart-comparison")({
  head: () => ({ meta: [
    { title: "Chart engine comparison — Pattern" },
    { name: "description", content: "Compare Pattern’s relocation lines with reproducible Swiss Ephemeris reference charts." },
    { property: "og:title", content: "Chart engine comparison — Pattern" },
    { property: "og:description", content: "Inspect measured Sun, Moon and Pluto line differences against an independent astronomical reference." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ComparisonPage,
});

const SWATCH: Record<AngleKind, string> = { MC: "bg-chart-1", IC: "bg-chart-2", AC: "bg-chart-3", DC: "bg-chart-4" };
function degrees(value: number | null) { return value === null ? "No horizon crossing" : `${value.toFixed(5)}°`; }

function ComparisonPage() {
  const [chartId, setChartId] = useState(REFERENCE.charts[0]?.id ?? "");
  const [method, setMethod] = useState<ComparisonMethod>("refined");
  const [angle, setAngle] = useState<AngleKind>("AC");
  const [body, setBody] = useState("pluto");
  const chart = REFERENCE.charts.find((c) => c.id === chartId) ?? REFERENCE.charts[0];
  const results = useMemo(() => chart ? compareChart(chart, method) : null, [chart, method]);
  const previous = useMemo(() => chart ? compareChart(chart, "previous") : null, [chart]);
  const refined = useMemo(() => chart ? compareChart(chart, "refined") : null, [chart]);
  const mapLines = useMemo(() => chart ? linesFor(chart.bodies.map((b) => ({ key: b.key, label: b.label, lon: b.lon })), chart.utcISO).filter((l) => l.body === body && l.angle === angle) : [], [chart, body, angle]);
  const reference = useMemo(() => chart ? referenceLines(chart).filter((l) => l.body === body && l.angle === angle) : [], [chart, body, angle]);
  if (!chart || !results || !previous || !refined) return <Shell signedIn={false}><h1>Reference charts unavailable</h1></Shell>;
  const rows = results.rows.filter((r) => r.body === body && r.angle === angle);
  return <Shell signedIn={false}><div className="max-w-4xl animate-rise">
    <h1 className="text-2xl sm:text-3xl">Chart engine comparison</h1>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Pattern’s planetary lines beside independently captured Swiss Ephemeris values. These are reproducible reference charts, not a member’s private birth chart.</p>
    <div className="mt-6 max-w-md"><label className="technical text-muted-foreground" id="reference-chart-label">Reference chart</label><Select value={chartId} onValueChange={setChartId}><SelectTrigger aria-labelledby="reference-chart-label" className="mt-2 min-h-11"><SelectValue /></SelectTrigger><SelectContent>{REFERENCE.charts.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></div>
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="technical text-muted-foreground">Birth moment · UTC</dt><dd className="mt-1 break-words">{chart.utcISO.replace("T", " ").replace(".000Z", " UTC")}</dd></div><div><dt className="technical text-muted-foreground">Coordinates</dt><dd className="mt-1">{chart.latitude}°, {chart.longitude}°</dd></div><div><dt className="technical text-muted-foreground">Chart convention</dt><dd className="mt-1">Tropical · Placidus angles</dd></div></dl>
    <section className="mt-8 border-y border-rule py-5" aria-label="Measured accuracy"><div className="grid gap-5 sm:grid-cols-3"><div><p className="technical text-muted-foreground">Previous · largest difference</p><p className="mt-2 text-2xl tabular-nums">{degrees(previous.maxError)}</p></div><div><p className="technical text-muted-foreground">Refined · largest difference</p><p className="mt-2 text-2xl tabular-nums text-primary">{degrees(refined.maxError)}</p></div><div><p className="technical text-muted-foreground">Refined · mean difference</p><p className="mt-2 text-2xl tabular-nums">{degrees(refined.meanError)}</p></div></div><p className="mt-4 text-xs text-muted-foreground">Longitude differences across Sun, Moon and Pluto, four angles and nine latitude bands. The same reference longitudes are used by both methods, isolating orbital latitude and Earth-rotation math; this does not certify all chart calculations.</p></section>
    <section className="mt-8" aria-label="Line overlay"><h2 className="text-xl">Reference overlay</h2><div className="mt-3 flex flex-wrap gap-2">{chart.bodies.map((b) => <Button key={b.key} size="sm" variant={body === b.key ? "secondary" : "outline"} aria-pressed={body === b.key} onClick={() => setBody(b.key)}>{b.label}</Button>)}</div><div className="mt-3 flex flex-wrap gap-2">{ANGLE_KINDS.map((a) => <Button key={a} size="sm" variant={angle === a ? "secondary" : "outline"} aria-pressed={angle === a} onClick={() => setAngle(a)}><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${SWATCH[a]}`} />{a} · {ANGLE_THEME[a].name}</Button>)}</div><p className="my-3 text-xs text-muted-foreground">Solid: refined Pattern. Dashed: Swiss reference. At this scale they nearly overlap.</p><ClientOnly fallback={<div className="h-[340px] bg-muted" />}><Suspense fallback={<div className="h-[340px] bg-muted" />}><RelocationMap lines={mapLines} referenceLines={reference} selected={null} onPick={() => {}} /></Suspense></ClientOnly></section>
    <section className="mt-8" aria-label="Numerical comparison"><h2 className="text-xl">Latitude-by-latitude comparison</h2><div className="mt-3 flex flex-wrap gap-2">{(["refined", "previous"] as const).map((m) => <Button key={m} size="sm" variant={method === m ? "secondary" : "outline"} aria-pressed={method === m} onClick={() => setMethod(m)}>{m === "refined" ? "Refined math" : "Previous math"}</Button>)}</div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs tabular-nums sm:text-sm"><caption className="sr-only">{body} {angle} longitude differences using {method} math</caption><thead className="border-b border-rule text-muted-foreground"><tr>{["Latitude", "Swiss longitude", "Pattern longitude", "Difference"].map((h) => <th key={h} scope="col" className="px-2 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.latitude} className="border-b border-rule"><th scope="row" className="px-2 py-3 font-medium">{r.latitude}°</th><td className="px-2 py-3">{degrees(r.expected)}</td><td className="px-2 py-3">{degrees(r.actual)}</td><td className="px-2 py-3">{degrees(r.error)}</td></tr>)}</tbody></table></div></section>
    <details className="mt-6 border-y border-rule py-4"><summary className="min-h-11 cursor-pointer font-medium">Reference sources and limits</summary><div className="mt-3 space-y-3 text-sm text-muted-foreground"><p>{REFERENCE.engine} {REFERENCE.version} · {REFERENCE.ephemeris}. Reference positions and equatorial coordinates were captured independently with pyswisseph; no online chart image or unverifiable published chart is used.</p><p>{REFERENCE.frame}. {REFERENCE.horizon}. Rising and setting use the spherical horizon equation. The reference samples are fixed captures, not calculated by Pattern’s ephemeris.</p><p>Refinement uses Astronomy Engine 2.1.19 geocentric orbital latitudes, apparent sidereal time and true obliquity, with quarter-degree curve sampling. Pattern still uses the saved chart’s longitude; its analytical latitude fallback is not native Swiss data. Refraction, lunar parallax, terrain and high-polar Placidus limitations are not included. Geographic crossings are not a complete traditional paran calculation.</p><a href={REFERENCE.documentation} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-primary underline">Swiss Ephemeris technical reference</a></div></details>
    <div className="mt-6 flex flex-wrap gap-4"><Button asChild variant="outline"><Link to="/relocation">Your relocation map</Link></Button><Link to="/accuracy" className="technical inline-flex min-h-11 items-center text-primary">Check your chart’s birth details</Link></div>
  </div></Shell>;
}