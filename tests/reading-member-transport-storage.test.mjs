import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";

let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => {
  await h.reset();
});
after(async () => {
  await h?.close();
});

async function prepare() {
  const db = h.records();
  const e = h.ephemerisModule;
  const day = new Date().toISOString().slice(0, 10);
  const saturn = e.positionOf("saturn", e.toJulianDay(new Date(`${day}T12:00:00Z`)));
  await h.seedChart(db, h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon: saturn.lon,
        sign: e.signOf(saturn.lon),
        degree: e.degreeInSign(saturn.lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  return db;
}

for (const failure of [false, true]) {
  test(`${failure ? "provider timeout fallback" : "generated wording"} retains member transport in storage without regenerating on reload`, async () => {
    const db = await prepare();
    h.setGateway(async (body) => {
      if (failure) return Response.json({ error: "private-provider-error" }, { status: 504 });
      const response = await successfulReadingResponse(body);
      return Response.json({
        ...(await response.json()),
        model: "google/gemini-3.8-flash",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 180,
          total_tokens: 280,
          completion_tokens_details: { reasoning_tokens: 120 },
        },
      });
    });
    const first = await h.app.getToday(db, h.userA, "UTC");
    assert.equal(first.language.mode, failure ? "template" : "model");
    const saved = () =>
      JSON.parse(
        h.sqlite
          .prepare("SELECT language_meta FROM daily_readings WHERE id=?")
          .get(first.reading.id).language_meta,
      );
    const meta = saved();
    assert.equal(meta.diagnostics.transport.version, "member-daily-transport-1");
    assert.equal(meta.diagnostics.transport.provider, "lovable");
    assert.equal(meta.diagnostics.transport.httpStatus, failure ? 504 : 200);
    assert.equal(meta.diagnostics.transport.deadlineAbortMs, null);
    assert.equal(meta.diagnostics.transport.phase, failure ? "headers" : "body");
    assert.doesNotMatch(JSON.stringify(meta.diagnostics), /private-provider-error|local-test-key/);
    h.reopen();
    const reopened = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.equal(reopened.reading.id, first.reading.id);
    assert.equal(reopened.language.mode, first.language.mode);
    assert.deepEqual(saved().diagnostics.transport, meta.diagnostics.transport);
    assert.equal(h.gatewayRequests.length, 1);
    assert.equal(h.geminiEnterpriseRequests.length, 0);
  });
}
