import assert from "node:assert/strict";
import { test } from "node:test";
import sweph from "sweph";
import { createEngine } from "../src/engine.mjs";
import { calculateLunations } from "../src/lunations.mjs";
const engine = createEngine();
const request = (from = "2026-01-01T00:00:00.000Z", to = "2027-01-01T00:00:00.000Z") => ({
  contract: "swiss-astronomy-events/1",
  sourceId: engine.sourceId,
  from,
  to,
});
test("native lunar range returns12 new Moons,13 full Moons and four real eclipse classifications in2026", () => {
  const r = calculateLunations(request(), engine);
  assert.equal(r.status, "complete");
  assert.equal(r.events.length, 29);
  const counts = Object.fromEntries(
    [...new Set(r.events.map((e) => e.kind))].map((kind) => [
      kind,
      r.events.filter((e) => e.kind === kind).length,
    ]),
  );
  assert.deepEqual(counts, {
    "full-moon": 13,
    "new-moon": 12,
    "solar-annular": 1,
    "lunar-total": 1,
    "solar-total": 1,
    "lunar-partial": 1,
  });
  assert.deepEqual(
    r.events
      .filter((e) => e.kind.startsWith("solar-") || e.kind.startsWith("lunar-"))
      .map((e) => [e.kind, e.at.slice(0, 10)]),
    [
      ["solar-annular", "2026-02-17"],
      ["lunar-total", "2026-03-03"],
      ["solar-total", "2026-08-12"],
      ["lunar-partial", "2026-08-28"],
    ],
  );
  assert.ok(r.events.every((e) => e.localVisibility === null && e.sourceId === engine.sourceId));
  assert.ok(
    r.events.every((e, i) => i === 0 || Date.parse(e.at) >= Date.parse(r.events[i - 1].at)),
  );
});
test("a rolling year crossing2027 retains native penumbral eclipses despite contact-search diagnostics", () => {
  const r = calculateLunations(
    request("2026-10-13T00:00:00.000Z", "2027-10-13T00:00:00.000Z"),
    engine,
  );
  assert.equal(r.status, "complete");
  assert.deepEqual(
    r.events.filter((e) => e.nativeClassification !== null).map((e) => [e.kind, e.at.slice(0, 10)]),
    [
      ["solar-annular", "2027-02-06"],
      ["lunar-penumbral", "2027-02-20"],
      ["lunar-penumbral", "2027-07-18"],
      ["solar-total", "2027-08-02"],
      ["lunar-penumbral", "2027-08-17"],
    ],
  );
});
test("successful lunar flags do not admit other native errors, failed searches or invalid dates", (t) => {
  const original = sweph.lun_eclipse_when;
  const start = Date.parse("2027-02-21T00:00:00.000Z");
  for (const patch of [
    { error: "SwissEph file is unavailable" },
    { flag: -1, error: "no lunar eclipse at tjd = 2461605.174095" },
    { flag: 128, error: "no lunar eclipse at tjd = 2461605.174095" },
    { data: [NaN] },
  ]) {
    const mock = t.mock.method(sweph, "lun_eclipse_when", (...args) => ({
      ...original(...args),
      ...patch,
    }));
    assert.throws(() => engine.eclipseAfter("lunar", start), /unqualified_source/);
    mock.mock.restore();
  }
});
test("range boundaries are half open, event identity is stable across overlapping queries, and short empty ranges are complete", () => {
  const events = calculateLunations(
    request("2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"),
    engine,
  ).events;
  const moon = events.find((e) => e.kind === "new-moon");
  const before = calculateLunations(request("2026-01-01T00:00:00.000Z", moon.at), engine).events;
  assert.ok(!before.some((e) => e.id === moon.id));
  const after = calculateLunations(request(moon.at, "2026-02-01T00:00:00.000Z"), engine).events;
  assert.ok(after.some((e) => e.id === moon.id));
  const overlap = calculateLunations(
    request("2026-01-10T00:00:00.000Z", "2026-01-25T00:00:00.000Z"),
    engine,
  ).events;
  assert.equal(overlap.find((e) => e.kind === "new-moon").id, moon.id);
  assert.equal(
    calculateLunations(request("2026-01-05T00:00:00.000Z", "2026-01-06T00:00:00.000Z"), engine)
      .events.length,
    0,
  );
});
test("unsupported contract, source, calendar, coverage and oversized ranges are rejected before native scanning", () => {
  for (const patch of [
    { contract: "made-up" },
    { sourceId: "other-engine" },
    { from: "2026-02-30T00:00:00.000Z" },
    { from: "1750-01-01T00:00:00.000Z" },
    { to: "2028-01-01T00:00:00.000Z" },
    { from: "2026-01-01T00:00:00+02:00" },
    { latitude: 52 },
  ])
    assert.throws(() => calculateLunations({ ...request(), ...patch }, engine));
  assert.throws(() =>
    calculateLunations(request("2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"), engine),
  );
});
