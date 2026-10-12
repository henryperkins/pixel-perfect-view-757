import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEngine } from "../src/engine.mjs";

const input = {
  date: "1990-05-15",
  time: "19:34:00",
  timezoneOffset: 0,
  latitude: 34.0522,
  longitude: -118.2437,
};
test("real Swiss chart supplies all bodies, Placidus and coherent source metadata", () => {
  const engine = createEngine();
  const { data } = engine.chart(input);
  assert.equal(data.planets.length, 11);
  assert.equal(data.houses.system, "P");
  assert.equal(data.houses.cusps.length, 12);
  const sun = data.planets.find((p) => p.name === "Sun");
  assert.ok(sun.longitude > 54 && sun.longitude < 56);
  assert.ok(sun.speed > 0.9 && sun.speed < 1.1);
  assert.equal(data.meta.engineVersion, "2.10.03");
  assert.deepEqual(data.positionSource, engine.source);
  assert.equal(data.positionSource.returnedFlags, 258);
  assert.equal(data.positionSource.timeScale, "UT");
  assert.ok(data.aspects.length > 0);
  assert.equal(new Set(data.planets.map((p) => p.name)).size, 11);
  assert.ok(
    data.planets.every((p) => Number.isFinite(p.speed) && p.longitude >= 0 && p.longitude < 360),
  );
});
test("actual UTC conversion and direct position agree with chart samples", () => {
  const engine = createEngine();
  const instant = Date.parse("1990-05-15T19:34:00Z");
  const sun = engine.chart(input).data.planets.find((p) => p.name === "Sun");
  assert.equal(engine.position("sun", instant).longitude, sun.longitude);
  const secondsLater = engine.position("sun", instant + 1000);
  assert.ok(secondsLater.longitude > sun.longitude);
  assert.ok(secondsLater.longitude - sun.longitude < 0.00002);
});
test("invalid dates, shifted timezone, nonfinite coordinates and coverage are refused", () => {
  const engine = createEngine();
  for (const patch of [
    { date: "2026-02-30" },
    { time: "24:01:00" },
    { timezoneOffset: 1 },
    { latitude: NaN },
    { latitude: 91 },
    { longitude: 181 },
    { date: "1750-01-01" },
  ]) {
    assert.throws(() => engine.chart({ ...input, ...patch }));
  }
  assert.throws(() => engine.position("saturn", Date.parse("1799-01-01T00:00:00Z")));
  assert.throws(() => engine.position("unrecognized", Date.now()));
});
test("polar fallback is explicitly identified, never labelled Placidus", () => {
  const { data } = createEngine().chart({ ...input, latitude: 80 });
  assert.equal(data.houses.system, "O");
  assert.equal(data.meta.houseFallback, "placidus_unavailable");
});
test("changed ephemeris bytes are rejected before calculation", () => {
  const folder = mkdtempSync(join(tmpdir(), "pattern-ephe-"));
  try {
    cpSync(new URL("../data/ephe/", import.meta.url), folder, { recursive: true });
    const path = join(folder, "sepl_18.se1");
    const bytes = readFileSync(path);
    bytes[100] ^= 1;
    writeFileSync(path, bytes);
    assert.throws(() => createEngine({ ephemerisPath: folder }), /ephemeris_integrity/);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
