import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, readers, a, b;
before(async () => {
  h = await createRecordsHarness();
  readers = await h.vite.ssrLoadModule("/src/lib/mcp/readers.server.ts");
});
beforeEach(async () => {
  await h.reset();
  const db = h.records();
  await db.exec(
    "INSERT INTO memberships_v2(stripe_subscription_id,environment,user_id,status,plan,current_period_end,paid_until,updated_at) VALUES('sub_fixture','sandbox',?,'active','month',?,?,?)",
    [
      h.userA,
      Math.floor(Date.now() / 1000) + 86400,
      Math.floor(Date.now() / 1000) + 86400,
      new Date().toISOString(),
    ],
  );
  a = await h.seedChart(db, h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        sign: "Aries",
        degree: 5,
        house: 2,
        lon: 5,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  b = await h.seedChart(db, h.userB);
});
after(async () => {
  await h?.close();
});
async function reading({
  owner = h.userA,
  chart = a,
  date = new Date().toISOString().slice(0, 10),
  meta = {},
  safe = true,
} = {}) {
  const encrypted = await h.cryptoModule.encryptJson(chart.dek, {
    headline: "A steady pace",
    body: "Make room to consider your next step.",
    prompt: "Where could you leave more room?",
  });
  await h
    .records()
    .from("daily_readings")
    .insert({
      user_id: owner,
      snapshot_id: chart.snapshotId,
      reading_date: date,
      headline: "PRIVATE HEADLINE",
      body_ct: await h.cryptoModule.encryptField(
        chart.dek,
        "PRIVATE CHECK-IN: sleep low, stress high",
      ),
      idempotency_key: crypto.randomUUID(),
      language_meta: {
        assistantShare: { version: 2, reading_ct: safe ? encrypted : null },
        ...meta,
      },
    });
}
test("today shares only the versioned chart-only copy; history, missing and wellness readings are unavailable", async () => {
  await reading();
  const result = await readers.readToday(h.userA, "UTC");
  assert.equal(result.status, "available");
  assert.match(result.reading.body, /next step/);
  assert.doesNotMatch(
    JSON.stringify(result),
    /PRIVATE|sleep|stress|1990-01-01|12\.34567|76\.54321/,
  );
  for (const meta of [
    { assistantShare: { version: 1, wellnessUsed: false } },
    { assistantShare: { version: 2, reading_ct: null } },
    {},
  ]) {
    h.sqlite
      .prepare("update daily_readings set language_meta = ? where user_id = ?")
      .run(JSON.stringify(meta), h.userA);
    assert.equal((await readers.readToday(h.userA, "UTC")).status, "unavailable");
  }
  h.sqlite.prepare("delete from daily_readings where user_id = ?").run(h.userA);
  await reading({ date: "2000-01-01" });
  assert.equal((await readers.readToday(h.userA, "UTC")).status, "unavailable");
});
test("saved readers never write, call providers, initialize keys, or return another member's rows", async () => {
  await reading({ owner: h.userB, chart: b });
  await h
    .records()
    .from("life_events")
    .insert({
      user_id: h.userB,
      occurred_on: "2026-01-01",
      domain: "work",
      label_ct: await h.cryptoModule.encryptField(b.dek, "FOREIGN SECRET"),
    });
  h.requests.length = 0;
  const results = await Promise.all([
    readers.readToday(h.userA, "UTC"),
    readers.readPattern(h.userA),
    readers.readChapter(h.userA, "missing"),
    readers.readTiming(h.userA, "UTC"),
    readers.readJournal(h.userA, 20),
  ]);
  assert.doesNotMatch(
    JSON.stringify(results),
    /FOREIGN|Private birth|1990-01-01|12\.34567|76\.54321|birth_profile|wrapped_dek|fingerprint/,
  );
  assert.ok(h.requests.length > 0);
  assert.ok(h.requests.every(({ sql }) => /^\s*select\b/i.test(sql)));
  assert.deepEqual(h.gatewayRequests, []);
  h.sqlite.prepare("delete from profiles where id = ?").run(h.userA);
  h.requests.length = 0;
  await readers.readJournal(h.userA, 20);
  assert.ok(h.requests.every(({ sql }) => /^\s*select\b/i.test(sql)));
  assert.equal(
    h.sqlite.prepare("select count(*) as n from profiles where id = ?").get(h.userA).n,
    0,
  );
});
test("journal is bounded and returns selected written fields, never check-ins", async () => {
  await h
    .records()
    .from("life_events")
    .insert({
      user_id: h.userA,
      occurred_on: "2026-01-01",
      domain: "work",
      label_ct: await h.cryptoModule.encryptField(a.dek, "A moment"),
      body_ct: await h.cryptoModule.encryptField(a.dek, "My own words"),
    });
  const result = await readers.readJournal(h.userA, 1);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].body, "My own words");
  await assert.rejects(readers.readJournal(h.userA, 10000));
});
test("chapters require the current snapshot, essay policy, and an independently valid question", async () => {
  await h.records().from("natal_features").insert({
    user_id: h.userA,
    snapshot_id: a.snapshotId,
    feature_key: "sun",
    family: "placement",
    title: "Sun in Aries",
  });
  const save = async (version, question, snapshot = a.snapshotId) => {
    h.sqlite.prepare("delete from feature_narratives").run();
    const paragraphs = ["A saved chapter essay.", `Something to sit with: ${question}`];
    await h
      .records()
      .from("feature_narratives")
      .insert({
        user_id: h.userA,
        snapshot_id: snapshot,
        feature_key: "sun",
        essay_version: version,
        narrative_ct: await h.cryptoModule.encryptJson(a.dek, {
          format: "pattern-natal-evidence-1",
          paragraphs,
          narrative: paragraphs.join("\n\n"),
          facts: [],
        }),
      });
  };
  const version = "essay-6|Placidus|local-fixture|0|plain";
  await save(version, "Where do you recognise this pattern?");
  assert.equal((await readers.readChapter(h.userA, "sun")).status, "available");
  for (const args of [
    ["essay-1", "Where do you recognise this pattern?"],
    [version, "Sun in Aries"],
    [version, "Where do you recognise this pattern?", b.snapshotId],
  ]) {
    await save(...args);
    assert.equal((await readers.readChapter(h.userA, "sun")).status, "unavailable");
  }
});

test("real daily save encrypts a chart-only share and withholds it when check-in framing is used", async (context) => {
  await h.reset();
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const { seedNatalReading, natalReadingResponse } = await import("./helpers/natal-fixtures.mjs");
  const { dek } = await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  const firstMeta = JSON.parse(
    h.sqlite.prepare("select language_meta from daily_readings where id = ?").get(first.reading.id)
      .language_meta,
  );
  assert.equal(firstMeta.assistantShare.version, 2);
  assert.equal(typeof firstMeta.assistantShare.reading_ct, "string");
  const shared = await h.cryptoModule.decryptJson(dek, firstMeta.assistantShare.reading_ct);
  assert.ok(shared.body.includes("responsibility"));
  assert.equal((await readers.readToday(h.userA, "UTC")).status, "available");
  await h.app.setConsent(h.records(), h.userA, "WEL-01", true);
  await h.app.setConsent(h.records(), h.userA, "WEL-03", true);
  await h.app.saveCheckIn(h.records(), h.userA, "2026-10-11", 2, 2, "PRIVATE NOTE", 1, 5);
  const wellness = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.notEqual(wellness.reading.id, first.reading.id);
  const meta = JSON.parse(
    h.sqlite
      .prepare("select language_meta from daily_readings where id = ?")
      .get(wellness.reading.id).language_meta,
  );
  assert.equal(meta.assistantShare.reading_ct, null);
  assert.equal((await readers.readToday(h.userA, "UTC")).status, "unavailable");
  assert.equal(
    h.sqlite.prepare("select note_ct from check_ins where user_id = ?").get(h.userA).note_ct
      .length > 0,
    true,
  );
});

test("sign-in return paths cannot escape the assistant flow", async () => {
  const { assistantReturnTo } = await h.vite.ssrLoadModule("/src/lib/assistant-navigation.ts");
  assert.equal(
    assistantReturnTo("/oauth/consent?authorization_id=fixture&next=https://foreign.example"),
    "/oauth/consent?authorization_id=fixture",
  );
  for (const value of [
    "https://foreign.example",
    "//foreign.example",
    "/content",
    "/oauth/consent?authorization_id=../bad",
    "/oauth/consent",
    null,
  ])
    assert.equal(assistantReturnTo(value), "/assistants");
});
