import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

// Real application SQL, envelope encryption, and deterministic template prose
// run against a disposable local SQLite database. No accounts or services are live.
let harness;
let localDay;
const fixedNow = new Date("2026-10-11T12:00:00.000Z");

before(async () => {
  harness = await createRecordsHarness();
  localDay = await harness.vite.ssrLoadModule("/src/lib/local-day.ts");
});
after(async () => harness?.close());
beforeEach(async (context) => {
  await harness.reset();
  context.mock.timers.enable({ apis: ["Date"], now: fixedNow });
});

const client = () => harness.records();
const today = (zone = "UTC", user = harness.userA) => harness.app.getToday(client(), user, zone);
const grant = (source, enabled = true, user = harness.userA) =>
  harness.app.setConsent(client(), user, source, enabled);
const checkIn = ({ mood = 2, energy = 3, sleep = null, stress = null, note = null } = {}) =>
  harness.app.saveCheckIn(client(), harness.userA, "2026-10-11", mood, energy, note, sleep, stress);
const sourceIds = (reading) => new Set(reading.provenance.map((entry) => entry.source_id));

test("unchanged daily context reuses the reading after an actual database reopen", async () => {
  await harness.seedChart(client(), harness.userA);
  const first = await today();
  assert.equal(first.needsOnboarding, false);
  await harness.reopen();
  const reopened = await today();
  assert.equal(reopened.reading.id, first.reading.id);
  assert.equal(reopened.reading.body, first.reading.body);
});

test("pre-fix cache prose is not reused and its reading and feedback remain intact", async () => {
  const fixture = await harness.seedChart(client(), harness.userA);
  const bundle = await harness.app.activeBundle(client());
  const unsafeBody =
    "Unsafe legacy cache sentinel: unconsented stress 5/5 was sent outside the application.";
  const unsafePrompt = "Unsafe legacy prompt sentinel";
  const result = await client()
    .from("daily_readings")
    .insert({
      user_id: harness.userA,
      reading_date: "2026-10-11",
      snapshot_id: fixture.snapshotId,
      release_version: bundle.version,
      headline: "Legacy cache fixture",
      body_ct: await harness.cryptoModule.encryptField(fixture.dek, unsafeBody),
      prompt: unsafePrompt,
      confidence: "medium",
      primary_cycle_key: null,
      idempotency_key: `${fixture.fingerprint}:2026-10-11:${bundle.version}`,
      language_mode: "model",
      language_model: "legacy-local-fixture",
      language_meta: { mode: "model", citations: [], facts: [] },
    })
    .select("id")
    .single();
  assert.equal(result.error, null);
  const legacyId = result.data.id;
  await harness.app.submitFeedback(client(), harness.userA, legacyId, -1, ["local-legacy-fixture"]);
  const legacy = harness.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(legacyId);
  const feedback = harness.sqlite
    .prepare("SELECT * FROM reading_feedback WHERE reading_id=?")
    .get(legacyId);
  const current = await today();
  assert.notEqual(current.reading.id, legacyId);
  assert.doesNotMatch(current.reading.body, /Unsafe legacy cache sentinel|unconsented stress/);
  assert.doesNotMatch(current.reading.prompt, /Unsafe legacy prompt sentinel/);
  assert.equal((await today()).reading.id, current.reading.id);
  assert.deepEqual(
    harness.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(legacyId),
    legacy,
  );
  assert.deepEqual(
    harness.sqlite.prepare("SELECT * FROM reading_feedback WHERE reading_id=?").get(legacyId),
    feedback,
  );
  assert.equal(await harness.cryptoModule.decryptField(fixture.dek, legacy.body_ct), unsafeBody);
  assert.equal(
    harness.sqlite
      .prepare("SELECT count(*) AS n FROM daily_readings WHERE user_id=?")
      .get(harness.userA).n,
    2,
  );
});

test("an empty recomputed day does not revive stored cycles from another snapshot", async () => {
  const fixture = await harness.seedChart(client(), harness.userA);
  const first = await today();
  assert.deepEqual(first.cycles, []);
  const { data: active } = await client()
    .from("chart_snapshots")
    .select("*")
    .eq("id", fixture.snapshotId)
    .single();
  const { id: ignoredId, ...metadata } = active;
  const prior = await client()
    .from("chart_snapshots")
    .insert({
      ...metadata,
      fingerprint: "older-local-snapshot-fixture",
      created_at: "2025-01-01T12:00:00Z",
    })
    .select("id")
    .single();
  assert.equal(prior.error, null);
  const stored = await client()
    .from("cycle_instances")
    .insert({
      user_id: harness.userA,
      snapshot_id: prior.data.id,
      cycle_key: "saturn_conjunction_sun",
      transit_body: "saturn",
      natal_point: "sun",
      aspect: "conjunction",
      domain: "identity",
      phase: "exact",
      orb: 0,
      importance: 1,
      computed_for: "2026-10-11",
      ingress_at: "2026-10-01T12:00:00Z",
      exact_at: "2026-10-11T12:00:00Z",
      egress_at: "2026-10-20T12:00:00Z",
    })
    .select("id")
    .single();
  assert.equal(stored.error, null);
  const cached = await today();
  assert.equal(cached.reading.id, first.reading.id, "exercise the cached branch");
  assert.deepEqual(cached.cycles, []);
  assert.equal(
    harness.sqlite.prepare("SELECT snapshot_id FROM cycle_instances WHERE id=?").get(stored.data.id)
      .snapshot_id,
    prior.data.id,
  );
});

test("saving, updating, and clearing check-in bands changes same-day prose and provenance", async () => {
  await harness.seedChart(client(), harness.userA);
  await grant("USR-04");
  const empty = await today();
  await checkIn();
  const first = await today();
  assert.notEqual(first.reading.id, empty.reading.id);
  assert.match(first.reading.body, /mood 2\/5 and energy 3\/5/);
  assert.ok(sourceIds(first).has("USR-04"));
  await checkIn({ mood: 5, energy: 1 });
  const changed = await today();
  assert.notEqual(changed.reading.id, first.reading.id);
  assert.match(changed.reading.body, /mood 5\/5 and energy 1\/5/);
  assert.doesNotMatch(changed.reading.body, /mood 2\/5/);
  await checkIn({ mood: null, energy: null });
  const cleared = await today();
  assert.notEqual(cleared.reading.id, changed.reading.id);
  assert.doesNotMatch(cleared.reading.body, /mood 5\/5|energy 1\/5/);
});

test("note-only saves reuse prose without leaking the note into the cache key", async () => {
  await harness.seedChart(client(), harness.userA);
  await grant("USR-04");
  await checkIn();
  const first = await today();
  await checkIn({ note: "Private fixture note that must not enter prose" });
  const second = await today();
  assert.equal(second.reading.id, first.reading.id);
  assert.equal(second.wellness.note, "Private fixture note that must not enter prose");
  const row = harness.sqlite
    .prepare("SELECT idempotency_key FROM daily_readings WHERE id=?")
    .get(second.reading.id);
  assert.doesNotMatch(row.idempotency_key, /Private fixture/);
  assert.doesNotMatch(second.reading.body, /Private fixture/);
});

test("wellness consent revocation refreshes cached body, prompt, and provenance independently", async () => {
  await harness.seedChart(client(), harness.userA);
  await grant("WEL-01");
  await grant("WEL-03");
  await checkIn({ sleep: 2, stress: 5 });
  const consented = await today();
  assert.match(consented.reading.body, /sleep 2\/5 and stress 5\/5/);
  assert.match(consented.reading.prompt, /pressure running high/);
  await grant("WEL-03", false);
  const stressRevoked = await today();
  assert.notEqual(stressRevoked.reading.id, consented.reading.id);
  assert.doesNotMatch(stressRevoked.reading.body, /stress 5\/5/);
  assert.doesNotMatch(stressRevoked.reading.prompt, /pressure running high/);
  assert.equal(sourceIds(stressRevoked).has("WEL-03"), false);
  assert.ok(sourceIds(stressRevoked).has("WEL-01"));
  await grant("WEL-01", false);
  const revoked = await today();
  assert.notEqual(revoked.reading.id, stressRevoked.reading.id);
  assert.doesNotMatch(revoked.reading.body, /sleep 2\/5|stress 5\/5/);
  assert.equal(sourceIds(revoked).has("WEL-01"), false);
});

test("revoking check-in framing does not serve previously consented prose", async () => {
  await harness.seedChart(client(), harness.userA);
  await grant("USR-04");
  await checkIn();
  const consented = await today();
  await grant("USR-04", false);
  const revoked = await today();
  assert.notEqual(revoked.reading.id, consented.reading.id);
  assert.doesNotMatch(revoked.reading.body, /You logged mood/);
  assert.equal(sourceIds(revoked).has("USR-04"), false);
});

test("tone and depth changes get fresh cache entries; display-name-only changes reuse them", async () => {
  await harness.seedChart(client(), harness.userA);
  await grant("USR-01");
  await grant("USR-02");
  const first = await today();
  await harness.app.updatePrefs(client(), harness.userA, "Fixture reader", "warm", "standard");
  const warm = await today();
  assert.notEqual(warm.reading.id, first.reading.id);
  await harness.app.updatePrefs(client(), harness.userA, "Fixture reader", "warm", "technical");
  const technical = await today();
  assert.notEqual(technical.reading.id, warm.reading.id);
  await harness.app.updatePrefs(client(), harness.userA, "Renamed fixture", "warm", "technical");
  assert.equal((await today()).reading.id, technical.reading.id);
});

test("stored tone and depth are ignored when their framing sources are off", async () => {
  await harness.seedChart(client(), harness.userA);
  const first = await today();
  await harness.app.updatePrefs(client(), harness.userA, "Fixture reader", "warm", "technical");
  assert.equal((await today()).reading.id, first.reading.id);
});

test("only consented timezone and ambient bucket participate in same-day context", async (context) => {
  context.mock.timers.setTime(Date.parse("2026-10-11T00:30:00Z"));
  await harness.seedChart(client(), harness.userA);
  const ignoredZone = await today("Pacific/Kiritimati");
  assert.equal(ignoredZone.timezone, "UTC");
  assert.equal((await today("UTC")).reading.id, ignoredZone.reading.id);
  await grant("DEV-01");
  const local = await today("Pacific/Kiritimati");
  const utc = await today("UTC");
  assert.equal(local.day, utc.day, "same civil date, different effective noon");
  assert.notEqual(local.reading.id, utc.reading.id);
  await grant("AMB-02");
  context.mock.timers.setTime(Date.parse("2026-10-11T09:00:00Z"));
  const morning = await today();
  context.mock.timers.setTime(Date.parse("2026-10-11T13:00:00Z"));
  const afternoon = await today();
  assert.notEqual(afternoon.reading.id, morning.reading.id);
  assert.equal(
    afternoon.provenance.find((entry) => entry.source_id === "AMB-02").detail.bucket,
    "afternoon",
  );
  await grant("AMB-02", false);
  const withoutAmbient = await today();
  context.mock.timers.setTime(Date.parse("2026-10-11T20:00:00Z"));
  assert.equal((await today()).reading.id, withoutAmbient.reading.id);
});

test("same-day chart engine or contract changes invalidate the reading", async () => {
  await harness.seedChart(client(), harness.userA);
  const first = await today();
  const update = await client()
    .from("chart_snapshots")
    .update({ engine: "swiss-ephemeris@new-local-fixture", contract_version: "new-local-fixture" })
    .eq("user_id", harness.userA);
  assert.equal(update.error, null);
  const changed = await today();
  assert.notEqual(changed.reading.id, first.reading.id);
});

test("birth A→B→A uses the current birth fingerprint even when snapshot timestamps tie", async () => {
  const details = {
    birthDate: "1990-01-01",
    birthTime: "12:00",
    placeLabel: "Local fixture",
    latitude: 0,
    longitude: 0,
  };
  const a = await harness.app.saveBirth(client(), harness.userA, details, "unknown", "UTC");
  const aReading = await today();
  const b = await harness.app.saveBirth(
    client(),
    harness.userA,
    { ...details, birthDate: "1991-01-01" },
    "unknown",
    "UTC",
  );
  assert.notEqual(a.fingerprint, b.fingerprint);
  assert.equal(
    (await harness.app.loadSnapshot(client(), harness.userA)).fingerprint,
    b.fingerprint,
  );
  const bReading = await today();
  assert.notEqual(bReading.reading.id, aReading.reading.id);
  const back = await harness.app.saveBirth(client(), harness.userA, details, "unknown", "UTC");
  assert.equal(back.fingerprint, a.fingerprint);
  assert.equal(
    (await harness.app.loadSnapshot(client(), harness.userA)).fingerprint,
    a.fingerprint,
  );
  assert.equal((await today()).reading.id, aReading.reading.id);
});

test("cache reuse stays scoped to the requesting account", async () => {
  await harness.seedChart(client(), harness.userA);
  await harness.seedChart(client(), harness.userB);
  await grant("USR-04");
  await checkIn();
  const a = await today();
  const b = await today("UTC", harness.userB);
  assert.notEqual(a.reading.id, b.reading.id);
  assert.match(a.reading.body, /mood 2\/5/);
  assert.doesNotMatch(b.reading.body, /mood 2\/5/);
});

test("Today and current Timing share the effective day across UTC boundaries", async (context) => {
  context.mock.timers.setTime(Date.parse("2026-10-11T10:30:00Z"));
  await harness.seedChart(client(), harness.userA);
  await grant("DEV-01");
  for (const [zone, expectedDay] of [
    ["Pacific/Kiritimati", "2026-10-12"],
    ["Pacific/Honolulu", "2026-10-11"],
  ]) {
    const reading = await today(zone);
    const timing = await harness.app.getCyclesFor(client(), harness.userA, undefined, zone);
    assert.equal(reading.day, expectedDay);
    assert.equal(timing.day, expectedDay);
    assert.equal(timing.timezone, reading.timezone);
    assert.equal(timing.referenceAt, localDay.localNoon(expectedDay, zone).toISOString());
  }
  await grant("DEV-01", false);
  const timing = await harness.app.getCyclesFor(
    client(),
    harness.userA,
    undefined,
    "Pacific/Kiritimati",
  );
  assert.equal(timing.day, "2026-10-11");
  assert.equal(timing.timezone, "UTC");
  assert.equal(timing.referenceAt, "2026-10-11T12:00:00.000Z");
});

test("a local midnight creates a new Today reading without changing its timezone", async (context) => {
  context.mock.timers.setTime(Date.parse("2026-10-11T09:59:00Z"));
  await harness.seedChart(client(), harness.userA);
  await grant("DEV-01");
  const before = await today("Pacific/Kiritimati");
  context.mock.timers.setTime(Date.parse("2026-10-11T10:01:00Z"));
  const after = await today("Pacific/Kiritimati");
  assert.equal(before.day, "2026-10-11");
  assert.equal(after.day, "2026-10-12");
  assert.notEqual(after.reading.id, before.reading.id);
});

test("Timing calculates at local noon and classifies exact timestamps by that calendar", async () => {
  const ephemeris = await harness.vite.ssrLoadModule("/src/lib/astro/ephemeris.ts");
  await harness.seedChart(client(), harness.userA);
  await grant("DEV-01");
  for (const [selectedDay, zone] of [
    ["2026-10-11", "Pacific/Kiritimati"],
    ["2026-10-11", "Pacific/Honolulu"],
    ["2026-03-08", "America/New_York"],
    ["2026-11-01", "America/New_York"],
  ]) {
    const noon = localDay.localNoon(selectedDay, zone);
    const moon = ephemeris.positionOf("moon", ephemeris.toJulianDay(noon));
    const update = await client()
      .from("chart_snapshots")
      .update({
        positions: {
          sun: {
            key: "sun",
            label: "Sun",
            lon: moon.lon,
            sign: moon.sign,
            degree: moon.degree,
            house: 1,
            speed: 0,
            retrograde: false,
            angleDependent: false,
          },
        },
      })
      .eq("user_id", harness.userA);
    assert.equal(update.error, null);
    const timing = await harness.app.getCyclesFor(client(), harness.userA, selectedDay, zone);
    assert.equal(timing.referenceAt, noon.toISOString());
    const contact = timing.cycles.find((cycle) => cycle.cycle_key === "moon_conjunction_sun");
    assert.ok(contact, "the seeded contact is exact at local noon");
    assert.equal(contact.orb, 0);
    for (const cycle of timing.cycles)
      assert.equal(
        cycle.days_to_exact,
        localDay.daysToLocalDate(cycle.exact_at, selectedDay, zone),
      );
  }
});

test("calendar days and local noon work across UTC+14, UTC−10, and DST", () => {
  const instant = new Date("2026-10-11T10:30:00Z");
  assert.equal(localDay.localDayString(instant, "Pacific/Kiritimati"), "2026-10-12");
  assert.equal(localDay.localDayString(instant, "Pacific/Honolulu"), "2026-10-11");
  assert.equal(
    localDay.localDayString(new Date("2026-10-11T02:30:00Z"), "Pacific/Honolulu"),
    "2026-10-10",
  );
  for (const [day, zone, expected] of [
    ["2026-10-11", "Pacific/Kiritimati", "2026-10-10T22:00:00.000Z"],
    ["2026-10-11", "Pacific/Honolulu", "2026-10-11T22:00:00.000Z"],
    ["2026-03-07", "America/New_York", "2026-03-07T17:00:00.000Z"],
    ["2026-03-08", "America/New_York", "2026-03-08T16:00:00.000Z"],
    ["2026-10-31", "America/New_York", "2026-10-31T16:00:00.000Z"],
    ["2026-11-01", "America/New_York", "2026-11-01T17:00:00.000Z"],
  ])
    assert.equal(localDay.localNoon(day, zone).toISOString(), expected, `${day} ${zone}`);
  assert.equal(localDay.calendarDaysBetween("2026-03-09", "2026-03-08"), 1);
  assert.equal(localDay.calendarDaysBetween("2026-11-02", "2026-11-01"), 1);
});

test("an exact timestamp is classified by its local civil date, not its UTC date", () => {
  assert.equal(
    localDay.daysToLocalDate("2026-10-11T10:30:00Z", "2026-10-11", "Pacific/Kiritimati"),
    1,
  );
  assert.equal(
    localDay.daysToLocalDate("2026-10-11T10:30:00Z", "2026-10-11", "Pacific/Honolulu"),
    0,
  );
  assert.equal(
    localDay.daysToLocalDate("2026-10-11T08:00:00Z", "2026-10-11", "Pacific/Honolulu"),
    -1,
  );
  assert.equal(
    localDay.daysToLocalDate("2026-03-09T03:30:00Z", "2026-03-08", "America/New_York"),
    0,
  );
  assert.equal(
    localDay.daysToLocalDate("2026-03-09T04:30:00Z", "2026-03-08", "America/New_York"),
    1,
  );
  assert.equal(localDay.daysToLocalDate(null, "2026-10-11", "UTC"), null);
  assert.equal(localDay.daysToLocalDate("not-an-instant", "2026-10-11", "UTC"), null);
});

test("timezone fallback is deterministic and civil dates are never silently normalized", () => {
  assert.equal(localDay.validTimeZone("Invalid/Fixture"), "UTC");
  assert.equal(localDay.validTimeZone(""), "UTC");
  assert.equal(localDay.validTimeZone("Pacific/Kiritimati"), "Pacific/Kiritimati");
  assert.throws(() => localDay.zonedToUtc("1990-01-01", "12:00", "Invalid/Fixture"));
  assert.throws(() => localDay.localNoon("2026-02-31", "UTC"));
  assert.throws(() => localDay.localNoon("2026-13-01", "UTC"));
  assert.equal(localDay.localNoon("2028-02-29", "UTC").toISOString(), "2028-02-29T12:00:00.000Z");
});

test("the pre-synthesis privacy cache key is replaced while its sources and feedback remain intact", async () => {
  const fixture = await harness.seedChart(client(), harness.userA);
  const snapshot = await harness.app.loadSnapshot(client(), harness.userA);
  const bundle = await harness.app.activeBundle(client());
  const contextKey = await harness.cryptoModule.keyedFingerprint(harness.userA, {
    version: "daily-privacy-2",
    snapshot,
    timezone: "UTC",
    tone: "plain",
    depth: "standard",
    localBucket: null,
    checkIn: null,
    wellness: null,
    grants: [],
  });
  const oldKey = `daily-privacy-2:${fixture.fingerprint}:2026-10-11:${bundle.version}:${contextKey}`;
  const old = await client()
    .from("daily_readings")
    .insert({
      user_id: harness.userA,
      reading_date: "2026-10-11",
      snapshot_id: fixture.snapshotId,
      release_version: bundle.version,
      headline: "Pre-synthesis reading",
      body_ct: await harness.cryptoModule.encryptField(fixture.dek, "Earlier saved wording."),
      idempotency_key: oldKey,
      language_mode: "template",
      language_meta: { facts: [] },
    })
    .select("id")
    .single();
  assert.equal(old.error, null);
  await client()
    .from("reading_sources")
    .insert({
      user_id: harness.userA,
      reading_id: old.data.id,
      lane: "content",
      source_id: "AST-05",
      label: "Historical reference",
      detail: { bundle: bundle.version },
    });
  await harness.app.submitFeedback(client(), harness.userA, old.data.id, 1, []);
  const source = harness.sqlite
    .prepare("SELECT * FROM reading_sources WHERE reading_id=?")
    .all(old.data.id);
  const feedback = harness.sqlite
    .prepare("SELECT * FROM reading_feedback WHERE reading_id=?")
    .all(old.data.id);
  const current = await today();
  assert.notEqual(current.reading.id, old.data.id);
  assert.equal((await today()).reading.id, current.reading.id);
  assert.deepEqual(
    harness.sqlite.prepare("SELECT * FROM reading_sources WHERE reading_id=?").all(old.data.id),
    source,
  );
  assert.deepEqual(
    harness.sqlite.prepare("SELECT * FROM reading_feedback WHERE reading_id=?").all(old.data.id),
    feedback,
  );
  assert.equal(
    harness.sqlite.prepare("SELECT idempotency_key FROM daily_readings WHERE id=?").get(old.data.id)
      .idempotency_key,
    oldKey,
  );
});
