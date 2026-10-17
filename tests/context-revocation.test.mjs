import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";
let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async (ctx) => {
  await h.reset();
  ctx.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-12T12:00:00Z") });
  await h.records().exec("INSERT INTO memberships_v2(stripe_subscription_id,environment,user_id,status,plan,current_period_end,paid_until,updated_at) VALUES('sub_fixture','sandbox',?,'active','month',?,?,?)",[h.userA,Math.floor(Date.now()/1000)+86400,Math.floor(Date.now()/1000)+86400,new Date().toISOString()]);
});
after(async () => h?.close());
async function readingFixture() {
  const e = h.ephemerisModule,
    lon = e.positionOf("saturn", e.toJulianDay(new Date())).lon;
  await h.seedChart(h.records(), h.userA, {
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
  await h.app.setConsent(h.records(), h.userA, "WEL-03", true);
  await h.app.saveCheckIn(h.records(), h.userA, "2026-10-12", null, null, null, null, 5);
  h.setGateway(successfulReadingResponse);
}
function latch() {
  let enter, release;
  const entered = new Promise((resolve) => {
    enter = resolve;
  });
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  return { enter, release, entered, blocked };
}
function holdSQL(matches) {
  const gate = latch(),
    original = globalThis.fetch;
  let held = false;
  globalThis.fetch = async (input, init = {}) => {
    const raw = typeof init.body === "string" ? JSON.parse(init.body) : {};
    const statements = raw.statements ?? (raw.sql ? [raw] : []);
    if (!held && statements.some((statement) => matches(statement.sql))) {
      held = true;
      gate.enter();
      await gate.blocked;
    }
    return original(input, init);
  };
  return {
    ...gate,
    restore: () => {
      gate.release();
      globalThis.fetch = original;
    },
  };
}

test("revoking wellness during a model call prevents its return and storage without retry", async () => {
  await readingFixture();
  const gate = latch();
  h.setGateway(async (body) => {
    gate.enter();
    await gate.blocked;
    return successfulReadingResponse(body);
  });
  const pending = h.app.getToday(h.records(), h.userA, "UTC");
  await gate.entered;
  await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
  gate.release();
  await assert.rejects(pending, /privacy settings changed|context settings changed/i);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings").get().n, 0);
  assert.equal(h.gatewayRequests.length, 1);
});

test("an atomic consent fence rejects a delayed encrypted insert after revocation", async () => {
  await readingFixture();
  const gate = holdSQL((sql) => /insert into "daily_readings"/i.test(sql));
  try {
    const pending = h.app.getToday(h.records(), h.userA, "UTC");
    await gate.entered;
    await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
    gate.release();
    await assert.rejects(pending);
    assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings").get().n, 0);
  } finally {
    gate.restore();
  }
});

test("revoking marked moments during its query releases no journal context", async () => {
  await h.app.addLifeEvent(h.records(), h.userA, "2026-10-12", "work", "Held private journal");
  await h.app.setConsent(h.records(), h.userA, "USR-07", true);
  const gate = holdSQL((sql) => /select .* from "life_events"/i.test(sql));
  try {
    const pending = h.app.listReadingJournal(h.records(), h.userA, "2026-10-12", []);
    await gate.entered;
    await h.app.setConsent(h.records(), h.userA, "USR-07", false);
    gate.release();
    assert.deepEqual(await pending, { enabled: false, entries: [] });
  } finally {
    gate.restore();
  }
});

test("a long export stops if derived-context consent changes before releasing results", async () => {
  await readingFixture();
  await h.app.getToday(h.records(), h.userA, "UTC");
  const gate = holdSQL((sql) => /select .* from "reading_sources"/i.test(sql));
  try {
    const pending = h.app.exportEverything(h.records(), h.userA);
    await gate.entered;
    await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
    gate.release();
    await assert.rejects(pending, /privacy settings changed|context settings changed/i);
    assert.equal(h.gatewayRequests.length, 1);
  } finally {
    gate.restore();
  }
});

test("a long export cannot release saved private data after account deletion", async () => {
  const auth = await h.vite.ssrLoadModule("/src/lib/auth.server.ts");
  const account = await h.vite.ssrLoadModule("/src/lib/account-data.server.ts");
  const password = "Synthetic account deletion password";
  h.sqlite
    .prepare("UPDATE users SET password_hash=? WHERE id=?")
    .run(await auth.hashPassword(password), h.userA);
  await readingFixture();
  await h.app.getToday(h.records(), h.userA, "UTC");
  const gate = holdSQL((sql) => /select .* from "reading_sources"/i.test(sql));
  try {
    const pending = h.app.exportEverything(h.records(), h.userA);
    await gate.entered;
    await account.deleteAccount(h.userA, password, h.records());
    gate.release();
    await assert.rejects(pending, /account is unavailable|privacy settings changed/i);
  } finally {
    gate.restore();
  }
});

test("saved assistant Today and Timing withhold a device clock revoked during their final query", async () => {
  const { seedTransitReading } = await import("./helpers/transit-fixtures.mjs");
  const readers = await h.vite.ssrLoadModule("/src/lib/mcp/readers.server.ts");
  await seedTransitReading(h);
  await h.app.setConsent(h.records(), h.userA, "DEV-01", true);
  await h.app.getToday(h.records(), h.userA, "Pacific/Honolulu");
  for (const read of [readers.readToday, readers.readTiming]) {
    await h.app.setConsent(h.records(), h.userA, "DEV-01", true);
    const gate = holdSQL((sql) => /from cycle_instances/i.test(sql));
    try {
      const pending = read(h.userA, "Pacific/Honolulu");
      await gate.entered;
      await h.app.setConsent(h.records(), h.userA, "DEV-01", false);
      gate.release();
      const result = await pending;
      assert.equal(result.status, "unavailable");
      assert.equal(JSON.stringify(result).includes("Pacific/Honolulu"), false);
    } finally {
      gate.restore();
    }
  }
});

test("a delayed wellness save rechecks consent in the write and returns what was actually stored", async () => {
  await h.app.setConsent(h.records(), h.userA, "WEL-03", true);
  const gate = holdSQL((sql) => /insert into "check_ins"/i.test(sql));
  try {
    const pending = h.app.saveCheckIn(
      h.records(),
      h.userA,
      "2026-10-12",
      2,
      3,
      "Kept private note",
      null,
      5,
    );
    await gate.entered;
    await h.app.setConsent(h.records(), h.userA, "WEL-03", false);
    gate.release();
    const result = await pending;
    assert.equal(result.stored.stress, false);
    assert.equal(result.checkIn.stress, null);
    assert.equal(result.checkIn.note, "Kept private note");
    assert.equal(result.checkIn.mood, 2);
    assert.equal(
      h.sqlite.prepare("SELECT stress FROM check_ins WHERE user_id=?").get(h.userA).stress,
      null,
    );
  } finally {
    gate.restore();
  }
});

test("a saved assistant chapter withholds revoked tone after its final key read", async () => {
  const { dek, snapshotId } = await h.seedChart(h.records());
  await h.app.updatePrefs(h.records(), h.userA, null, "warm", "standard");
  await h.app.setConsent(h.records(), h.userA, "USR-01", true);
  await h
    .records()
    .from("natal_features")
    .insert({
      user_id: h.userA,
      snapshot_id: snapshotId,
      feature_key: "sun",
      family: "placement",
      title: "Saved Sun chapter",
    });
  const { FEATURE_ESSAY_VERSION } = await h.vite.ssrLoadModule("/src/lib/ai/chapter-policy.ts");
  const paragraphs = [
    "Saved warm chapter.",
    "Something to sit with: Where do you recognise this pattern?",
  ];
  await h
    .records()
    .from("feature_narratives")
    .insert({
      user_id: h.userA,
      snapshot_id: snapshotId,
      feature_key: "sun",
      essay_version: `${FEATURE_ESSAY_VERSION}|Placidus|local-fixture|0|warm`,
      narrative_ct: await h.cryptoModule.encryptJson(dek, {
        format: "pattern-natal-evidence-1",
        paragraphs,
        narrative: paragraphs.join("\n\n"),
        facts: [],
      }),
    });
  const readers = await h.vite.ssrLoadModule("/src/lib/mcp/readers.server.ts");
  assert.equal((await readers.readChapter(h.userA, "sun")).status, "available");
  const gate = holdSQL((sql) => /^select wrapped_dek from profiles/i.test(sql));
  try {
    const pending = readers.readChapter(h.userA, "sun");
    await gate.entered;
    await h.app.setConsent(h.records(), h.userA, "USR-01", false);
    gate.release();
    const result = await pending;
    assert.equal(result.status, "unavailable");
    assert.equal(JSON.stringify(result).includes("Saved warm chapter."), false);
  } finally {
    gate.restore();
  }
});
