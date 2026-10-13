import assert from "node:assert/strict";
import { test } from "node:test";
import { createEngine } from "../src/engine.mjs";
import { calculateSolarContext } from "../src/solar.mjs";
const engine = createEngine();
const input = (patch = {}) => ({
  contract: "swiss-solar-context/1",
  sourceId: engine.sourceId,
  day: "2026-10-13",
  timeZone: "UTC",
  from: "2026-10-13T00:00:00.000Z",
  to: "2026-10-14T00:00:00.000Z",
  latitude: 52,
  longitude: 0,
  ...patch,
});
test("native sunrise/sunset return an ordinary civil day with source and precision", () => {
  const r = calculateSolarContext(input(), engine);
  assert.equal(r.daylight, "ordinary");
  assert.equal(r.sunriseUtc.slice(0, 10), "2026-10-13");
  assert.equal(r.sunsetUtc.slice(0, 10), "2026-10-13");
  assert.ok(r.daylightMinutes > 600 && r.daylightMinutes < 720);
  assert.equal(r.sourceId, engine.sourceId);
  assert.equal(r.precision, "native-for-supplied-location");
  assert.ok(Math.abs(Date.parse(r.sunriseUtc) - Date.parse("2026-10-13T06:21:11.000Z")) < 60000);
});
test("both hemispheres and polar day/night preserve nonexistent rise/set events as null", () => {
  for (const [latitude, day, expected] of [
    [89, "2026-06-21", "polar_day"],
    [89, "2026-12-21", "polar_night"],
    [-89, "2026-06-21", "polar_night"],
    [-89, "2026-12-21", "polar_day"],
  ]) {
    const from = day + "T00:00:00.000Z",
      to = new Date(Date.parse(from) + 86400000).toISOString();
    const r = calculateSolarContext(input({ latitude, day, from, to }), engine);
    assert.equal(r.daylight, expected);
    assert.equal(r.sunriseUtc, null);
    assert.equal(r.sunsetUtc, null);
    assert.equal(r.daylightMinutes, expected === "polar_day" ? 1440 : 0);
  }
});
test("polar transition days use the refracted topocentric upper limb, rather than the center plus radius", () => {
  for (const [latitude, day] of [
    [-90, "2026-09-21"],
    [90, "2026-09-24"],
  ]) {
    const from = day + "T00:00:00.000Z",
      to = new Date(Date.parse(from) + 86400000).toISOString();
    const r = calculateSolarContext(input({ latitude, day, from, to }), engine);
    assert.equal(r.daylight, "polar_day");
    assert.equal(r.daylightMinutes, 1440);
    assert.equal(r.sunriseUtc, null);
    assert.equal(r.sunsetUtc, null);
  }
});
test("23/25-hour DST civil ranges use actual bounds, including sunset before sunrise in UTC", () => {
  for (const [day, from, to] of [
    ["2026-03-08", "2026-03-08T05:00:00.000Z", "2026-03-09T04:00:00.000Z"],
    ["2026-11-01", "2026-11-01T04:00:00.000Z", "2026-11-02T05:00:00.000Z"],
  ]) {
    const r = calculateSolarContext(
      input({ day, from, to, timeZone: "America/New_York", latitude: 41, longitude: -74 }),
      engine,
    );
    assert.equal(r.daylight, "ordinary");
    assert.ok(Date.parse(r.sunriseUtc) >= Date.parse(from));
    assert.ok(Date.parse(r.sunsetUtc) < Date.parse(to));
    assert.ok(
      r.daylightMinutes > 0 && r.daylightMinutes < (Date.parse(to) - Date.parse(from)) / 60000,
    );
  }
  const island = calculateSolarContext(input({ latitude: 0, longitude: 175 }), engine);
  assert.equal(island.daylight, "ordinary");
  assert.ok(Date.parse(island.sunsetUtc) < Date.parse(island.sunriseUtc));
  assert.ok(island.daylightMinutes > 600 && island.daylightMinutes < 800);
});
test("wrong date boundaries, invalid zones/coordinates and extra birthplace fields are rejected", () => {
  for (const patch of [
    { timeZone: "not-a-zone" },
    { latitude: 91 },
    { longitude: 181 },
    { latitude: NaN },
    { day: "2026-02-30" },
    { to: "2026-10-14T01:00:00.000Z" },
    { birthplace: "private" },
    { latitude: null },
  ])
    assert.throws(() => calculateSolarContext(input(patch), engine));
});
