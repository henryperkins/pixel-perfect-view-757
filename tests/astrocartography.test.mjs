import assert from "node:assert/strict";
import { test } from "node:test";

const m = await import("../src/lib/astro/astrocartography.ts");
const e = await import("../src/lib/astro/ephemeris.ts");

const UTC = "1990-06-15T14:30:00.000Z";

test("a body's MC line is where it culminates at birth", () => {
  const [mc] = m.linesFor([{ key: "sun", label: "Sun", lon: 84 }], UTC).filter((l) => l.angle === "MC");
  const lon = mc.segments[0][0][0];
  const angles = e.computeAngles(e.toJulianDay(new Date(UTC)), 40, lon);
  assert.ok(Math.abs(e.signedDelta(angles.midheaven, 84)) < 0.01);
});

test("IC sits exactly opposite the MC", () => {
  const lines = m.linesFor([{ key: "mars", label: "Mars", lon: 200 }], UTC);
  const mc = lines.find((l) => l.angle === "MC").segments[0][0][0];
  const ic = lines.find((l) => l.angle === "IC").segments[0][0][0];
  assert.ok(Math.abs(Math.abs(m.wrapLon(ic - mc)) - 180) < 1e-9);
});

test("on a body's AC line it is rising (relocated ascendant matches for an equator body)", () => {
  const lines = m.linesFor([{ key: "sun", label: "Sun", lon: 0 }], UTC);
  const ac = lines.find((l) => l.angle === "AC");
  const point = ac.segments[0].find((p) => p[1] === 30);
  const r = m.relocatedAngles(UTC, point[1], point[0]);
  assert.ok(Math.abs(e.signedDelta(r.ascendant, 0)) < 0.5);
});

test("nearby lines report a place on a line at ~0 km and exclude far lines", () => {
  const lines = m.linesFor([{ key: "venus", label: "Venus", lon: 120 }], UTC);
  const mcLon = lines.find((l) => l.angle === "MC").segments[0][0][0];
  const near = m.nearbyLines(lines, [mcLon, 20], 300);
  assert.equal(near[0].line.angle, "MC");
  assert.ok(near[0].km < 1);
  assert.ok(near.every((n) => n.km <= 300));
});
