import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { successfulReadingResponse } from "./helpers/records-harness.mjs";
import { readFile } from "node:fs/promises";
let h, location;
before(async () => {
  h = await createRecordsHarness();
  location = await h.vite.ssrLoadModule("/src/lib/solar-location.server.ts");
});
after(async () => h?.close());
beforeEach(async () => h.reset());
test("coarse current location requires its own opt-in, accepts only integer degrees and keeps one encrypted value", async () => {
  const db = h.records(),
    input = { latitude: 52, longitude: 0, timeZone: "Europe/London" };
  await assert.rejects(() => location.saveCoarseLocation(db, h.userA, input), /permission/);
  await h.app.setConsent(db, h.userA, "DEV-02", true);
  await assert.rejects(
    () => location.saveCoarseLocation(db, h.userA, { ...input, latitude: 52.12345 }),
    /coarse/,
  );
  await location.saveCoarseLocation(db, h.userA, input);
  await location.saveCoarseLocation(db, h.userA, {
    latitude: -34,
    longitude: 151,
    timeZone: "Australia/Sydney",
  });
  const rows = h.sqlite.prepare("SELECT * FROM context_signals WHERE user_id=?").all(h.userA);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_id, "DEV-02");
  assert.ok(!rows[0].value.includes("latitude"));
  assert.equal(
    Math.round((Date.parse(rows[0].expires_at) - Date.parse(rows[0].captured_at)) / 86400000),
    30,
  );
  const loaded = await location.loadCoarseLocation(db, h.userA);
  assert.equal(loaded.latitude, -34);
  assert.equal(loaded.longitude, 151);
  assert.equal(loaded.gridDegrees, 1);
  assert.equal(await location.loadCoarseLocation(db, h.userB), null);
  await h.app.setConsent(db, h.userA, "DEV-02", false);
  assert.equal(await location.loadCoarseLocation(db, h.userA), null);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM context_signals").get().n, 0);
});
test("ambient solar framing requires both live grants and never falls back to birthplace or expired location", async () => {
  const db = h.records();
  await h.app.setConsent(db, h.userA, "AMB-05", true);
  assert.equal(await location.solarForToday(db, h.userA), null);
  assert.equal(h.calculationRequests.length, 0);
  await h.app.setConsent(db, h.userA, "DEV-02", true);
  await location.saveCoarseLocation(db, h.userA, { latitude: 52, longitude: 0, timeZone: "UTC" });
  const result = await location.solarForToday(db, h.userA);
  assert.equal(result.daylight, "unavailable");
  assert.equal(result.reason, "not_configured");
  h.sqlite.prepare("UPDATE context_signals SET expires_at='2000-01-01T00:00:00Z'").run();
  assert.equal(await location.loadCoarseLocation(db, h.userA), null);
  assert.equal(await location.solarForToday(db, h.userA), null);
});
test("a delayed location read cannot return a value after revocation", async () => {
  const db = h.records();
  await h.app.setConsent(db, h.userA, "DEV-02", true);
  await location.saveCoarseLocation(db, h.userA, { latitude: 52, longitude: 0, timeZone: "UTC" });
  const original = globalThis.fetch;
  let intercepted = false;
  globalThis.fetch = async (input, init) => {
    const response = await original(input, init);
    const body = JSON.parse(String(init.body));
    if (!intercepted && body.sql?.includes("context_signals") && body.sql.includes("captured_at")) {
      intercepted = true;
      await h.app.setConsent(db, h.userA, "DEV-02", false);
    }
    return response;
  };
  try {
    assert.equal(await location.loadCoarseLocation(db, h.userA), null);
    assert.ok(intercepted);
  } finally {
    globalThis.fetch = original;
  }
});
test("revoke/regrant or clearing a pending first save cannot resurrect an earlier location", async () => {
  const db = h.records();
  for (const action of [
    async () => {
      await h.app.setConsent(db, h.userA, "DEV-02", false);
      await h.app.setConsent(db, h.userA, "DEV-02", true);
    },
    async () => location.clearCoarseLocation(db, h.userA),
  ]) {
    await h.app.setConsent(db, h.userA, "DEV-02", true);
    const original = globalThis.fetch;
    let intercepted = false;
    globalThis.fetch = async (input, init) => {
      const body = JSON.parse(String(init.body));
      if (
        !intercepted &&
        body.statements?.some((s) => s.sql.startsWith("DELETE FROM context_signals"))
      ) {
        intercepted = true;
        await action();
      }
      return original(input, init);
    };
    try {
      await assert.rejects(
        () =>
          location.saveCoarseLocation(db, h.userA, { latitude: 52, longitude: 0, timeZone: "UTC" }),
        /permission changed|location changed/,
      );
      assert.ok(intercepted);
      assert.equal(await location.loadCoarseLocation(db, h.userA), null);
    } finally {
      globalThis.fetch = original;
    }
  }
});
test("different permitted solar context leaves complete actual member request bytes identical", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-13T10:00:00.000Z") });
  const db = h.records(),
    ephem = h.ephemerisModule;
  const saturn = ephem.positionOf(
    "saturn",
    ephem.toJulianDay(new Date("2026-10-13T12:00:00.000Z")),
  );
  for (const user of [h.userA, h.userB])
    await h.seedChart(db, user, {
      positions: {
        sun: {
          key: "sun",
          label: "Sun",
          lon: saturn.lon,
          sign: ephem.signOf(saturn.lon),
          degree: ephem.degreeInSign(saturn.lon),
          house: 1,
          speed: 1,
          retrograde: false,
          angleDependent: false,
        },
      },
    });
  for (const user of [h.userA, h.userB])
    for (const source of ["DEV-02", "AMB-05"]) await h.app.setConsent(db, user, source, true);
  await location.saveCoarseLocation(db, h.userA, { latitude: 52, longitude: 0, timeZone: "UTC" });
  await location.saveCoarseLocation(db, h.userB, {
    latitude: -34,
    longitude: 151,
    timeZone: "Australia/Sydney",
  });
  const north = JSON.parse(
      await readFile(new URL("./fixtures/native-astronomy/solar-north.json", import.meta.url)),
    ),
    south = JSON.parse(
      await readFile(new URL("./fixtures/native-astronomy/solar-south.json", import.meta.url)),
    );
  h.setSwissCalculations((body) =>
    Response.json(body.latitude === 52 ? north.actual : south.actual),
  );
  h.setGateway(successfulReadingResponse);
  const a = await h.app.getToday(db, h.userA, "UTC"),
    b = await h.app.getToday(db, h.userB, "UTC");
  assert.equal(h.gatewayRequests.length, 2);
  assert.equal(JSON.stringify(h.gatewayRequests[0]), JSON.stringify(h.gatewayRequests[1]));
  assert.equal(a.localContext.solar.daylight, "ordinary");
  assert.equal(b.localContext.solar.daylight, "ordinary");
  assert.equal(a.localContext.solar.seasonalBand, "autumn");
  assert.equal(b.localContext.solar.seasonalBand, "spring");
  assert.equal(a.reading.body, b.reading.body);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});
