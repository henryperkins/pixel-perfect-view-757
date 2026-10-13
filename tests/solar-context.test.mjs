import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { readFile } from "node:fs/promises";
let h, solar;
before(async () => {
  h = await createRecordsHarness();
  solar = await h.vite.ssrLoadModule("/src/lib/astro/solar-context.server.ts");
});
after(async () => h?.close());
beforeEach(async () => h.reset());
test("seasonal framing distinguishes hemispheres and omits tropical or invalid calendar inputs", () => {
  assert.equal(solar.seasonalBand("2026-10-13", 52), "autumn");
  assert.equal(solar.seasonalBand("2026-10-13", -34), "spring");
  assert.equal(solar.seasonalBand("2026-06-21", 52), "summer");
  for (const latitude of [0, 23.44, -23.44, 91, NaN])
    assert.equal(solar.seasonalBand("2026-10-13", latitude), null);
  for (const day of ["2026-02-30", "nonsense", "2026-13-01"])
    assert.equal(solar.seasonalBand(day, 52), null);
});
test("invalid or missing coarse location and native configuration produce explicit unavailability", async () => {
  for (const input of [
    { latitude: 52.2, longitude: 0 },
    { latitude: 91, longitude: 0 },
    { latitude: 52, longitude: -181 },
  ]) {
    const r = await solar.getSolarContext({ day: "2026-10-13", timeZone: "UTC", ...input });
    assert.equal(r.daylight, "unavailable");
  }
  const r = await solar.getSolarContext({
    day: "2026-10-13",
    timeZone: "UTC",
    latitude: 52,
    longitude: 0,
  });
  assert.equal(r.reason, "not_configured");
  assert.equal(h.calculationRequests.length, 0);
});
test("ordinary, polar and both DST civil ranges accept only qualified local-day native results", async () => {
  for (const id of [
    "solar-north",
    "solar-dst-short",
    "solar-dst-long",
    "solar-polar-89-2026-06-21",
  ]) {
    const fixture = JSON.parse(
      await readFile(new URL("./fixtures/native-astronomy/" + id + ".json", import.meta.url)),
    );
    h.setSwissCalculations((body) => {
      assert.equal(body.from, fixture.input.from);
      assert.equal(body.to, fixture.input.to);
      return Response.json(fixture.actual);
    });
    const { day, timeZone, latitude, longitude } = fixture.input;
    const r = await solar.getSolarContext({ day, timeZone, latitude, longitude });
    assert.equal(r.daylight, fixture.actual.daylight);
    assert.equal(r.sunriseUtc, fixture.actual.sunriseUtc);
    assert.equal(r.precision, "native-for-coarse-1-degree-location");
    h.setSwissCalculations(() =>
      Response.json({ ...fixture.actual, sunriseUtc: "2026-01-01T00:00:00.000Z" }),
    );
    assert.equal(
      (await solar.getSolarContext({ day, timeZone, latitude, longitude })).daylight,
      "unavailable",
    );
  }
});
