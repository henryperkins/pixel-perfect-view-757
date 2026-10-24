import reference from "./chart-reference.json";
import { gmst, obliquity, positionOf, norm360, toJulianDay, type Body } from "./ephemeris";
import {
  ANGLE_KINDS,
  apparentSiderealDegrees,
  equatorial,
  lineLongitudeAt,
  orbitalLatitude,
  wrapLon,
  type AngleKind,
  type CartoLine,
} from "./astrocartography";

export const REFERENCE = reference;
export type ReferenceChart = (typeof reference.charts)[number];
export type ComparisonMethod = "refined" | "previous";

export function compareChart(chart: ReferenceChart, method: ComparisonMethod = "refined") {
  const jd = toJulianDay(new Date(chart.utcISO));
  const theta = method === "refined" ? apparentSiderealDegrees(jd) : gmst(jd);
  const rows = chart.bodies.flatMap((body) => {
    const lat =
      method === "refined"
        ? orbitalLatitude(body.key, jd)
        : body.key === "sun"
          ? 0
          : positionOf(body.key as Body, jd).lat;
    let eq = equatorial(body.lon, jd, lat);
    if (method === "previous") {
      const d = Math.PI / 180,
        l = body.lon * d,
        b = lat * d,
        e = obliquity(jd) * d;
      eq = {
        ra: norm360(
          Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) / d,
        ),
        dec: Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) / d,
      };
    }
    return body.lines.flatMap((sample) =>
      ANGLE_KINDS.map((angle) => {
        const actual = lineLongitudeAt(eq.ra, eq.dec, theta, angle, sample.latitude);
        const expected = sample[angle];
        return {
          body: body.key,
          label: body.label,
          angle,
          latitude: sample.latitude,
          actual,
          expected,
          error: actual === null || expected === null ? null : Math.abs(wrapLon(actual - expected)),
        };
      }),
    );
  });
  const errors = rows.flatMap((r) => (r.error === null ? [] : [r.error]));
  return {
    rows,
    maxError: Math.max(0, ...errors),
    meanError: errors.reduce((a, b) => a + b, 0) / Math.max(1, errors.length),
  };
}

/** Reference polylines use captured Swiss equatorial values, never Pattern outputs. */
export function referenceLines(chart: ReferenceChart): CartoLine[] {
  return chart.bodies.flatMap((body) =>
    ANGLE_KINDS.map((angle: AngleKind) => {
      const segments: [number, number][][] = [];
      let segment: [number, number][] = [];
      for (let latitude = -80; latitude <= 80; latitude += 0.25) {
        const lon = lineLongitudeAt(body.ra, body.dec, chart.siderealDegrees, angle, latitude);
        if (lon === null) continue;
        const previous = segment.at(-1);
        if (previous && Math.abs(previous[0] - lon) > 180) {
          if (segment.length > 1) segments.push(segment);
          segment = [];
        }
        segment.push([lon, latitude]);
      }
      if (segment.length > 1) segments.push(segment);
      return {
        id: `reference-${body.key}-${angle}`,
        body: body.key,
        label: `${body.label} reference`,
        angle,
        segments,
      };
    }),
  );
}
