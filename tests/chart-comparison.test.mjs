import assert from "node:assert/strict";
import { test } from "node:test";
import { REFERENCE, compareChart } from "../src/lib/astro/chart-comparison.ts";
import { linesFor, lineLongitudeAt, relocatedAngles, wrapLon } from "../src/lib/astro/astrocartography.ts";

for (const chart of REFERENCE.charts) {
  test(`${chart.id}: refined Sun/Moon/Pluto lines agree with independent Swiss reference within 0.002 degrees`, () => {
    const result = compareChart(chart);
    assert.equal(result.rows.length, 108);
    for (const row of result.rows) {
      assert.equal(row.actual === null, row.expected === null);
      if (row.error !== null) assert.ok(row.error < 0.002, `${row.body} ${row.angle} at ${row.latitude}: ${row.error}`);
    }
    assert.ok(result.maxError < compareChart(chart, "previous").maxError);
  });
  test(`${chart.id}: relocated angles agree with Swiss Placidus angles within 0.001 degrees`, () => {
    const angles = relocatedAngles(chart.utcISO, chart.latitude, chart.longitude);
    assert.ok(Math.abs(wrapLon(angles.ascendant - chart.ascendant)) < 0.001);
    assert.ok(Math.abs(wrapLon(angles.midheaven - chart.midheaven)) < 0.001);
  });
}
test("circumpolar bodies have no rising or setting horizon contact", () => {
  assert.equal(lineLongitudeAt(10, 30, 0, "AC", 80), null);
  assert.equal(lineLongitudeAt(10, 30, 0, "DC", 80), null);
  assert.equal(lineLongitudeAt(10, 30, 0, "MC", 80), 10);
});
test("curve generation rejects a zero step instead of looping forever", () => {
  assert.throws(() => linesFor([], "2000-01-01T12:00:00Z", 0), RangeError);
});
test("densified curves never bridge the antimeridian", () => {
  const chart = REFERENCE.charts[0];
  for (const line of linesFor(chart.bodies, chart.utcISO)) for (const segment of line.segments) {
    for (let i = 1; i < segment.length; i++) assert.ok(Math.abs(segment[i][0] - segment[i - 1][0]) <= 180);
  }
});