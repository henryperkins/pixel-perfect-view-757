import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";

let h, policy;
const now = new Date("2026-10-12T12:00:00Z");
before(async () => {
  h = await createRecordsHarness();
  policy = existsSync(new URL("../src/lib/context-policy.ts", import.meta.url))
    ? await h.vite.ssrLoadModule("/src/lib/context-policy.ts")
    : {};
});
after(async () => h?.close());
beforeEach(async (context) => {
  await h.reset();
  context.mock.timers.enable({ apis: ["Date"], now });
});
const db = () => h.records();
async function chart(user = h.userA) {
  const e = h.ephemerisModule;
  const saturn = e.positionOf("saturn", e.toJulianDay(new Date("2026-10-12T12:00:00Z")));
  await h.seedChart(db(), user, {
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
}

test("optional context requires the permitted use, consent and unexpired data", () => {
  assert.equal(typeof policy.contextUseAllowed, "function", "context freshness policy is missing");
  const granted = new Set(["USR-07", "USR-14", "WEL-03"]);
  const allowed = (id, use, at) => policy.contextUseAllowed(id, use, granted, at, now);
  assert.equal(allowed("USR-07", "framing", now.toISOString()), true);
  assert.equal(allowed("USR-07", "external_language", now.toISOString()), false);
  assert.equal(allowed("USR-11", "personalisation", now.toISOString()), false);
  assert.equal(allowed("NO-01", "framing", now.toISOString()), false);
  assert.equal(allowed("unknown", "framing", now.toISOString()), false);
  assert.equal(allowed("USR-14", "framing", null), true);
  assert.equal(allowed("WEL-03", "framing", null), false);
  assert.equal(
    allowed("WEL-03", "framing", new Date(now.getTime() - 180 * 86400000).toISOString()),
    false,
  );
  assert.equal(
    allowed("WEL-03", "framing", new Date(now.getTime() - 179 * 86400000).toISOString()),
    true,
  );
  assert.equal(allowed("USR-07", "framing", "not-a-date"), false);
  assert.equal(allowed("USR-07", "framing", "2030-01-01"), false);
});

test("unavailable season/daylight cannot be enabled but an old grant can be revoked", async () => {
  await assert.rejects(h.app.setConsent(db(), h.userA, "AMB-05", true), /not available/i);
  h.sqlite
    .prepare("INSERT INTO source_consents(id,user_id,source_id,tier,granted) VALUES (?,?,?,?,?)")
    .run("old-ambient", h.userA, "AMB-05", 2, 1);
  await h.app.setConsent(db(), h.userA, "AMB-05", false);
  assert.equal(
    (await h.app.loadConsents(db(), h.userA)).find((x) => x.source_id === "AMB-05").granted,
    false,
  );
});

test("a failed revocation transaction preserves its original consent and stored signal", async () => {
  await h.app.setConsent(db(), h.userA, "USR-07", true);
  h.sqlite
    .prepare(
      "INSERT INTO context_signals(id,user_id,source_id,value,expires_at) VALUES (?,?,?,?,?)",
    )
    .run("signal", h.userA, "USR-07", "{}", "2030-01-01T00:00:00Z");
  h.setFault({
    matches: (sql) =>
      sql.startsWith("INSERT INTO audit_events") || sql.startsWith('insert into "audit_events"'),
  });
  await assert.rejects(h.app.setConsent(db(), h.userA, "USR-07", false));
  assert.equal(
    (await h.app.loadConsents(db(), h.userA)).find((x) => x.source_id === "USR-07").granted,
    true,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) AS n FROM context_signals").get().n, 1);
});

test("marked moments are reusable only with consent and always remain manageable by their owner", async () => {
  assert.equal(
    typeof h.app.listReadingJournal,
    "function",
    "permission-bound reading journal is missing",
  );
  await h.app.addLifeEvent(
    db(),
    h.userA,
    "2026-10-12",
    "work",
    "Owner A moment",
    "Private body",
    "matching-cycle",
  );
  await h.app.addLifeEvent(db(), h.userB, "2026-10-12", "work", "Owner B moment");
  let count = h.requests.length;
  assert.deepEqual(
    await h.app.listReadingJournal(db(), h.userA, "2026-10-12", ["matching-cycle"]),
    { enabled: false, entries: [] },
  );
  assert.equal(
    h.requests.slice(count).some((x) => x.sql.includes('"life_events"')),
    false,
  );
  await h.app.setConsent(db(), h.userA, "USR-07", true);
  const result = await h.app.listReadingJournal(db(), h.userA, "2026-10-12", ["matching-cycle"]);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].label, "Owner A moment");
  h.sqlite
    .prepare("UPDATE life_events SET created_at='2000-01-01T00:00:00Z' WHERE user_id=?")
    .run(h.userA);
  assert.equal(
    (await h.app.listReadingJournal(db(), h.userA, "2026-10-12", ["matching-cycle"])).entries
      .length,
    0,
  );
  h.sqlite
    .prepare("UPDATE life_events SET created_at=? WHERE user_id=?")
    .run(now.toISOString(), h.userA);
  await h.app.setConsent(db(), h.userA, "USR-07", false);
  assert.equal((await h.app.listReadingJournal(db(), h.userA, "2026-10-12", [])).enabled, false);
  assert.equal((await h.app.listJournal(db(), h.userA)).events.length, 1);
});

test("a chapter attachment is owner-only and its event date does not extend retention", async () => {
  await h.app.addLifeEvent(
    db(),
    h.userA,
    "1900-01-01",
    "identity",
    "Chapter note",
    null,
    null,
    "sun_aries",
  );
  await h.app.addLifeEvent(
    db(),
    h.userB,
    "1900-01-01",
    "identity",
    "Other owner",
    null,
    null,
    "sun_aries",
  );
  await h.app.setConsent(db(), h.userA, "USR-07", true);
  const result = await h.app.listReadingJournal(db(), h.userA, undefined, [], ["sun_aries"]);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].label, "Chapter note");
  assert.equal(
    (await h.app.listReadingJournal(db(), h.userA, undefined, [], ["moon_taurus"])).entries.length,
    0,
  );
});

test("life-domain focus changes local defaults without changing the reading or model request", async () => {
  await chart();
  h.setGateway(successfulReadingResponse);
  const first = await h.app.getToday(db(), h.userA, "UTC");
  assert.ok(first.localContext, "local reading context is missing");
  const request = JSON.stringify(h.gatewayRequests[0]);
  await h.app.updatePrefs(db(), h.userA, null, "plain", "standard", "work");
  assert.equal((await h.app.getToday(db(), h.userA, "UTC")).localContext.preferredDomain, null);
  await assert.rejects(
    h.app.updatePrefs(db(), h.userA, null, "plain", "standard", "unknown"),
    /supported life area/,
  );
  await h.app.updatePrefs(db(), h.userA, "New name", "warm", "technical");
  assert.equal((await h.app.loadProfile(db(), h.userA)).domain_pref, "work");
  await h.app.setConsent(db(), h.userA, "USR-14", true);
  const second = await h.app.getToday(db(), h.userA, "UTC");
  assert.equal(second.localContext.preferredDomain, "work");
  assert.equal(second.reading.id, first.reading.id);
  assert.deepEqual(second.cycles, first.cycles);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(JSON.stringify(h.gatewayRequests[0]), request);
  assert.equal((await h.app.getCyclesFor(db(), h.userA, undefined, "UTC")).preferredDomain, "work");
  await h.app.setConsent(db(), h.userA, "USR-14", false);
  assert.equal((await h.app.getToday(db(), h.userA, "UTC")).localContext.preferredDomain, null);
});

test("previous resonance is owner-only, source-bound, consented and never supplied to a model", async () => {
  await chart();
  h.setGateway(successfulReadingResponse);
  const first = await h.app.getToday(db(), h.userA, "UTC");
  assert.ok(first.localContext, "local reading context is missing");
  await h.app.submitFeedback(db(), h.userA, first.reading.id, 1, ["private feedback label"]);
  await h.app.setConsent(db(), h.userA, "WEL-03", true);
  await h.app.saveCheckIn(db(), h.userA, first.day, null, null, null, null, 3);
  const next = await h.app.getToday(db(), h.userA, "UTC");
  assert.notEqual(next.reading.id, first.reading.id);
  assert.equal(next.localContext.previousResonance, null);
  await h.app.setConsent(db(), h.userA, "USR-11", true);
  const reused = await h.app.getToday(db(), h.userA, "UTC");
  assert.equal(reused.localContext.previousResonance.score, 1);
  assert.deepEqual(h.gatewayRequests[0], h.gatewayRequests[1]);
  assert.equal(JSON.stringify(h.gatewayRequests).includes("private feedback label"), false);
  h.sqlite
    .prepare(
      "UPDATE reading_sources SET detail=json_set(detail,'$.sourceKey','different-interpretation') WHERE reading_id=? AND json_extract(detail,'$.factId')='I1'",
    )
    .run(first.reading.id);
  assert.equal((await h.app.getToday(db(), h.userA, "UTC")).localContext.previousResonance, null);
  h.sqlite
    .prepare(
      "UPDATE reading_sources SET detail=json_set(detail,'$.sourceKey',?) WHERE reading_id=? AND json_extract(detail,'$.factId')='I1'",
    )
    .run(first.language.facts.find((f) => f.id === "I1").sourceKey, first.reading.id);
  await h.app.setConsent(db(), h.userA, "USR-11", false);
  const count = h.requests.length;
  assert.equal((await h.app.getToday(db(), h.userA, "UTC")).localContext.previousResonance, null);
  assert.equal(
    h.requests.slice(count).some((r) => r.sql.startsWith("SELECT f.resonance")),
    false,
  );
  await h.app.setConsent(db(), h.userA, "USR-11", true);
  h.sqlite
    .prepare("UPDATE reading_feedback SET created_at='2000-01-01T00:00:00Z' WHERE user_id=?")
    .run(h.userA);
  assert.equal((await h.app.getToday(db(), h.userA, "UTC")).localContext.previousResonance, null);
});

test("journal, wellness, ambient, focus and resonance changes preserve exact outbound facts", async () => {
  await chart();
  h.setGateway(successfulReadingResponse);
  const first = await h.app.getToday(db(), h.userA, "UTC");
  await h.app.addLifeEvent(
    db(),
    h.userA,
    "2026-10-12",
    "work",
    "Private journal sentinel",
    "Private journal body",
  );
  await h.app.submitFeedback(db(), h.userA, first.reading.id, -1, ["Private rating sentinel"]);
  for (const source of ["USR-07", "USR-11", "USR-14", "WEL-03", "AMB-02"])
    await h.app.setConsent(db(), h.userA, source, true);
  await h.app.updatePrefs(db(), h.userA, null, "plain", "standard", "work");
  await h.app.saveCheckIn(db(), h.userA, first.day, null, null, "Private note sentinel", null, 4);
  const next = await h.app.getToday(db(), h.userA, "UTC");
  assert.notEqual(next.reading.id, first.reading.id);
  assert.equal(h.gatewayRequests.length, 2);
  assert.deepEqual(h.gatewayRequests[0], h.gatewayRequests[1]);
  assert.equal(JSON.stringify(h.gatewayRequests).includes("Private"), false);
  assert.deepEqual(next.cycles, first.cycles);
});
