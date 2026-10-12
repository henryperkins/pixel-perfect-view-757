import { analyticEpisode } from "../fixtures/transit-episodes/analytic.mjs";
import { syntheticNatalSamples } from "./natal-fixtures.mjs";
export async function seedTransitReading(h, { natal = false } = {}) {
  const { TRANSIT_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  await h.records().from("content_releases").insert({
    version: TRANSIT_CANDIDATE_BUNDLE.version,
    checksum: "synthetic-transit-candidate",
    bundle: TRANSIT_CANDIDATE_BUNDLE,
    is_active: true,
  });
  const chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts"),
    day = new Date().toISOString().slice(0, 10),
    ep = h.ephemerisModule;
  const sun = ep.norm360(
    ep.positionOf("saturn", ep.toJulianDay(new Date(day + "T12:00:00Z"))).lon - 90,
  );
  const fixture = analyticEpisode({ longitude: sun }),
    samples = syntheticNatalSamples(chart, ep, { sun: [sun, sun, sun] });
  const fingerprint = fixture.anchor.chartFingerprint;
  const { assessNatalReliability } = await h.vite.ssrLoadModule(
    "/src/lib/astro/natal-reliability.ts",
  );
  const seeded = await h.seedChart(h.records(), h.userA, {
    fingerprint,
    chart: { ...samples[1].chart, points: { sun: samples[1].chart.points.sun } },
    transitAnchors: fixture.anchor,
    ...(natal ? { natalReliability: assessNatalReliability(samples, fingerprint, "exact") } : {}),
  });
  h.setEpisode((request) => {
    const x = analyticEpisode({ longitude: request.targets[1].longitude, aspect: request.aspect });
    const shift = Date.parse(request.referenceAt) - Date.parse(x.scan.request.referenceAt);
    const scan = JSON.parse(
      JSON.stringify(x.scan, (_, v) =>
        typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v)
          ? new Date(Date.parse(v) + shift).toISOString()
          : v,
      ),
    );
    scan.request = request;
    scan.sourceId = request.sourceId;
    return Response.json(scan);
  });
  return { ...seeded, fixture };
}
