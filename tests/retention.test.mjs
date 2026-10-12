import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";
let h, api;
const now = new Date("2026-10-12T00:00:00Z");
before(async () => {
  h = await createRecordsHarness();
  api = existsSync(new URL("../src/lib/retention.server.ts", import.meta.url))
    ? await h.vite.ssrLoadModule("/src/lib/retention.server.ts")
    : {};
});
beforeEach(async (ctx) => {
  await h.reset();
  ctx.mock.timers.enable({ apis: ["Date"], now });
});
after(async () => h?.close());
const dayAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString().slice(0, 10);

test("civil-day expiry is fixed in UTC and expires at the end of the retained cutoff day", () => {
  assert.equal(typeof api.civilContextFresh, "function", "civil-day retention is missing");
  const expires = new Date("2026-10-13T00:00:00Z");
  assert.equal(api.civilContextFresh(dayAgo(180), 180, new Date(expires.getTime() - 1)), true);
  assert.equal(api.civilContextFresh(dayAgo(180), 180, expires), false);
  assert.equal(api.civilContextFresh("invalid", 180, now), false);
});

test("current civil days in UTC plus 14 and minus 12 preserve submitted check-in fields", async (ctx) => {
  ctx.mock.timers.setTime(Date.parse("2026-10-12T12:00:00Z"));
  await h.seedChart(h.records());
  for (const source of ["DEV-01", "WEL-03"])
    await h.app.setConsent(h.records(), h.userA, source, true);
  const tomorrow = await h.app.getToday(h.records(), h.userA, "Pacific/Kiritimati");
  assert.equal(tomorrow.day, "2026-10-13");
  const saved = await h.app.saveCheckIn(
    h.records(),
    h.userA,
    tomorrow.day,
    2,
    3,
    "Future UTC civil note",
    null,
    5,
  );
  assert.equal(saved.checkIn.mood, 2);
  assert.equal(saved.checkIn.energy, 3);
  assert.equal(saved.checkIn.note, "Future UTC civil note");
  assert.equal((await h.app.loadCheckIn(h.records(), h.userA, tomorrow.day)).stress, 5);
  ctx.mock.timers.setTime(Date.parse("2026-10-12T00:30:00Z"));
  const yesterday = await h.app.getToday(h.records(), h.userA, "Etc/GMT+12");
  assert.equal(yesterday.day, "2026-10-11");
  await h.app.saveCheckIn(h.records(), h.userA, yesterday.day, 4, 2, "Earlier civil note", null, 3);
  assert.equal(
    (await h.app.loadCheckIn(h.records(), h.userA, yesterday.day)).note,
    "Earlier civil note",
  );
  assert.equal(api.civilContextFresh("2026-10-14", 730, new Date()), false);
});

test("no-visit owners lose expired bands, feedback, journal and signals while lifetime chart data survives", async () => {
  assert.equal(typeof api.purgeExpiredContext, "function", "scheduled retention is missing");
  await h.seedChart(h.records());
  const { dek } = await h.seedChart(h.records(), h.userB);
  const sealed = await h.cryptoModule.encryptField(dek, "Retained owner B text");
  for (const owner of [h.userA, h.userB]) {
    h.sqlite
      .prepare(
        "INSERT INTO check_ins(id,user_id,day,mood,energy,sleep,stress,note_ct) VALUES (?,?,?,?,?,?,?,?)",
      )
      .run(owner + "-old", owner, dayAgo(181), 2, 3, 4, 5, null);
    h.sqlite
      .prepare(
        "INSERT INTO check_ins(id,user_id,day,mood,energy,sleep,stress,note_ct) VALUES (?,?,?,?,?,?,?,?)",
      )
      .run(owner + "-older", owner, dayAgo(731), 2, 3, 4, 5, sealed);
    h.sqlite
      .prepare(
        "INSERT INTO life_events(id,user_id,occurred_on,label_ct,created_at) VALUES (?,?,?,?,?)",
      )
      .run(
        owner + "-expired",
        owner,
        "2099-01-01",
        sealed,
        new Date(now.getTime() - 1825 * 86400000).toISOString(),
      );
    h.sqlite
      .prepare(
        "INSERT INTO life_events(id,user_id,occurred_on,label_ct,created_at) VALUES (?,?,?,?,?)",
      )
      .run(owner + "-fresh", owner, "1900-01-01", sealed, now.toISOString());
    h.sqlite
      .prepare(
        "INSERT INTO context_signals(id,user_id,source_id,value,captured_at,expires_at) VALUES (?,?,?,?,?,?)",
      )
      .run(owner + "-signal", owner, "AMB-02", "{}", dayAgo(31), "2099-01-01");
  }
  const first = await api.purgeExpiredContext({ now, cursor: null, limit: 1 }, h.records());
  assert.equal(first.nextCursor, h.userA);
  assert.equal(
    h.sqlite.prepare("SELECT sleep FROM check_ins WHERE id=?").get(h.userA + "-old").sleep,
    null,
  );
  assert.equal(
    h.sqlite.prepare("SELECT mood FROM check_ins WHERE id=?").get(h.userA + "-old").mood,
    2,
  );
  assert.equal(
    h.sqlite.prepare("SELECT note_ct FROM check_ins WHERE id=?").get(h.userA + "-older").note_ct,
    null,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM life_events WHERE user_id=?").get(h.userA).n,
    1,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM life_events WHERE user_id=?").get(h.userB).n,
    2,
  );
  await api.purgeExpiredContext({ now, cursor: first.nextCursor, limit: 100 }, h.records());
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM context_signals").get().n, 0);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM chart_snapshots").get().n, 2);
  assert.ok(
    h.sqlite.prepare("SELECT wrapped_dek FROM profiles WHERE id=?").get(h.userA).wrapped_dek,
  );
  const repeat = await api.purgeExpiredContext({ now, cursor: null, limit: 100 }, h.records());
  assert.equal(
    Object.entries(repeat.counts)
      .filter(([key]) => key !== "owners")
      .reduce((n, [, v]) => n + v, 0),
    0,
  );
});

test("failed owner batch is atomic and can resume using the same fixed cutoff", async () => {
  assert.equal(typeof api.purgeExpiredContext, "function");
  h.sqlite
    .prepare("INSERT INTO check_ins(id,user_id,day,mood,sleep) VALUES (?,?,?,?,?)")
    .run("old", h.userA, dayAgo(731), 3, 4);
  h.setFault({ matches: (sql) => sql.startsWith("DELETE FROM life_events") });
  await assert.rejects(api.purgeExpiredContext({ now, cursor: null, limit: 1 }, h.records()));
  assert.equal(h.sqlite.prepare("SELECT sleep FROM check_ins WHERE id='old'").get().sleep, 4);
  h.setFault(null);
  await api.purgeExpiredContext({ now, cursor: null, limit: 1 }, h.records());
  assert.equal(h.sqlite.prepare("SELECT sleep FROM check_ins WHERE id='old'").get().sleep, null);
});

test("a failed multi-owner page preserves every owner and its retry reports the full counts", async () => {
  for (const user of [h.userA, h.userB]) {
    h.sqlite
      .prepare("INSERT INTO check_ins(id,user_id,day,sleep) VALUES (?,?,?,?)")
      .run(user + "-band", user, dayAgo(181), 4);
    h.sqlite
      .prepare(
        "INSERT INTO life_events(id,user_id,occurred_on,label_ct,created_at) VALUES (?,?,?,?,?)",
      )
      .run(user + "-event", user, "2026-10-12", "expired-ciphertext", dayAgo(1826));
  }
  h.setFault({
    matches: (sql, params) =>
      sql.startsWith("DELETE FROM life_events") &&
      params.some((value) => typeof value === "string" && value.includes(h.userB)),
  });
  await assert.rejects(api.purgeExpiredContext({ now, cursor: null, limit: 100 }, h.records()));
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM life_events").get().n, 2);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM check_ins WHERE sleep=4").get().n, 2);
  h.setFault(null);
  const retry = await api.purgeExpiredContext({ now, cursor: null, limit: 100 }, h.records());
  assert.equal(retry.counts.journal, 2);
  assert.equal(retry.counts.wellness, 2);
});

test("new non-UTC archived timing is withheld immediately after device-clock consent revocation", async (ctx) => {
  ctx.mock.timers.setTime(Date.parse("2026-10-12T12:00:00Z"));
  await seedTransitReading(h);
  await h.app.setConsent(h.records(), h.userA, "DEV-01", true);
  const today = await h.app.getToday(h.records(), h.userA, "Pacific/Honolulu");
  assert.equal(today.language.transitStory.plan.evidence.timezone, "Pacific/Honolulu");
  await h.app.setConsent(h.records(), h.userA, "DEV-01", false);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exported.readings.find((row) => row.id === today.reading.id).available, false);
  assert.equal(JSON.stringify(exported).includes("Pacific/Honolulu"), false);
});

test("legacy encrypted device clocks expire without regeneration even with no source provenance", async (ctx) => {
  ctx.mock.timers.setTime(Date.parse("2026-10-12T12:00:00Z"));
  await seedTransitReading(h);
  await h.app.setConsent(h.records(), h.userA, "DEV-01", true);
  const today = await h.app.getToday(h.records(), h.userA, "Pacific/Honolulu");
  h.sqlite
    .prepare(
      "UPDATE daily_readings SET context_version=NULL,local_context_ct=NULL,local_context_sources=NULL,local_context_expires_at=NULL,mixed_context_expires_at=NULL,retention_state=NULL WHERE id=?",
    )
    .run(today.reading.id);
  assert.equal(
    h.sqlite
      .prepare("SELECT COUNT(*) n FROM reading_sources WHERE reading_id=? AND source_id='DEV-01'")
      .get(today.reading.id).n,
    0,
  );
  ctx.mock.timers.setTime(Date.parse("2027-01-11T12:00:00Z"));
  const exportBefore = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exportBefore.readings.find((row) => row.id === today.reading.id).available, false);
  await api.purgeExpiredContext({ now: new Date(), cursor: null, limit: 100 }, h.records());
  const row = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(today.reading.id);
  assert.equal(row.retention_state, "expired");
  assert.equal(row.body_ct, "");
  assert.equal(row.language_meta, "{}");
  assert.equal(h.episodeRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("an inseparable legacy wellness body is removed at expiry and stays visibly unavailable", async () => {
  assert.equal(typeof api.purgeExpiredContext, "function");
  const { dek } = await h.seedChart(h.records());
  const body = await h.cryptoModule.encryptField(dek, "Sky plus expired sleep 1/5");
  h.sqlite
    .prepare(
      "INSERT INTO daily_readings(id,user_id,reading_date,headline,body_ct,prompt,idempotency_key,language_meta) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      "legacy",
      h.userA,
      dayAgo(181),
      "Mixed",
      "" + body,
      "Expired private reflection",
      "legacy",
      "{}",
    );
  h.sqlite
    .prepare(
      "INSERT INTO reading_sources(id,user_id,reading_id,lane,source_id,label,detail) VALUES (?,?,?,?,?,?,?)",
    )
    .run("legacy-source", h.userA, "legacy", "reflection", "WEL-01", "sleep", '{"band":1}');
  h.sqlite
    .prepare(
      "INSERT INTO reading_feedback(id,user_id,reading_id,resonance,created_at) VALUES (?,?,?,?,?)",
    )
    .run("legacy-rating", h.userA, "legacy", 1, dayAgo(730));
  await api.purgeExpiredContext({ now, cursor: null, limit: 100 }, h.records());
  const row = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id='legacy'").get();
  assert.equal(row.retention_state, "expired");
  assert.equal(row.body_ct, "");
  assert.equal(row.prompt, null);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM reading_sources WHERE reading_id='legacy'").get().n,
    0,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM reading_feedback").get().n, 0);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exported.readings.find((row) => row.id === "legacy").available, false);
  assert.equal(h.gatewayRequests.length, 0);
});

test("readers and exports omit expired values before the scheduled purge", async () => {
  await h.seedChart(h.records());
  await h.app.addLifeEvent(h.records(), h.userA, "2026-10-12", "work", "Expired journal sentinel");
  h.sqlite
    .prepare("UPDATE life_events SET created_at=?")
    .run(new Date(now.getTime() - 1825 * 86400000).toISOString());
  assert.equal((await h.app.listJournal(h.records(), h.userA)).events.length, 0);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exported.journal.events.length, 0);
  const readers = await h.vite.ssrLoadModule("/src/lib/mcp/readers.server.ts");
  assert.equal((await readers.readJournal(h.userA, 50)).entries.length, 0);
  assert.equal(JSON.stringify(exported).includes("Expired journal sentinel"), false);
});

test("the retention endpoint verifies a timestamp-bound signature before any query", async () => {
  assert.equal(typeof api.handleRetentionStep, "function", "signed retention endpoint is missing");
  const { createHmac } = await import("node:crypto");
  const stamp = String(Math.floor(now.getTime() / 1000));
  const raw = JSON.stringify({ now: now.toISOString(), cursor: null, limit: 100 });
  const signature = createHmac("sha256", process.env.PATTERN_WORKFLOW_SECRET)
    .update(stamp + "\n" + raw)
    .digest("hex");
  const request = (sig = signature, timestamp = stamp) =>
    new Request("https://app.invalid/api/public/retention-step", {
      method: "POST",
      headers: { "x-pattern-signature": sig, "x-pattern-timestamp": timestamp },
      body: raw,
    });
  const before = h.requests.length;
  assert.equal((await api.handleRetentionStep(request("0".repeat(64)), h.records())).status, 401);
  assert.equal((await api.handleRetentionStep(request(signature, "1"), h.records())).status, 401);
  assert.equal(h.requests.length, before);
  assert.equal((await api.handleRetentionStep(request(), h.records())).status, 200);
});

test("new readings keep their astronomical body when expiring local text is revoked or purged", async (ctx) => {
  const e = h.ephemerisModule,
    lon = e.positionOf("saturn", e.toJulianDay(new Date("2026-10-12T12:00:00Z"))).lon;
  const { dek } = await h.seedChart(h.records(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon,
        sign: e.signOf(lon),
        degree: e.degreeInSign(lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  h.setGateway(successfulReadingResponse);
  for (const source of ["WEL-03", "USR-04"])
    await h.app.setConsent(h.records(), h.userA, source, true);
  await h.app.saveCheckIn(h.records(), h.userA, "2026-10-12", 2, 3, null, null, 5);
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  const saved = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(today.reading.id);
  const astro = await h.cryptoModule.decryptField(dek, saved.body_ct);
  assert.equal(astro.includes("stress 5/5"), false);
  assert.equal(astro.includes("mood 2/5"), false);
  assert.match(today.reading.body, /stress 5\/5/);
  assert.match((await h.app.getToday(h.records(), h.userA, "UTC")).reading.body, /stress 5\/5/);
  await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
  const revoked = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(revoked.readings.find((row) => row.id === today.reading.id).body, astro);
  assert.equal(
    revoked.data.reading_sources.some((row) => row.source_id === "WEL-03"),
    false,
  );
  ctx.mock.timers.setTime(now.getTime() + 181 * 86400000);
  const beforePurge = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(beforePurge.readings.find((row) => row.id === today.reading.id).body, astro);
  await api.purgeExpiredContext({ now: new Date(), cursor: null, limit: 100 }, h.records());
  const after = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(today.reading.id);
  assert.equal(after.body_ct, saved.body_ct);
  assert.equal(after.local_context_ct, null);
  assert.equal(after.retention_state, "available");
  const result = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(result.readings.find((row) => row.id === today.reading.id).body, astro);
  assert.equal(
    result.data.reading_sources.some(
      (row) => row.source_id === "USR-04" || row.source_id === "WEL-03",
    ),
    false,
  );
  assert.equal(h.gatewayRequests.length, 1);
});
