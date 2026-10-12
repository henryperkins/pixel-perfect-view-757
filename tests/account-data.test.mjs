import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, api, auth;
const password = "Synthetic acceptance password";
before(async () => {
  h = await createRecordsHarness();
  api = existsSync(new URL("../src/lib/account-data.server.ts", import.meta.url))
    ? await h.vite.ssrLoadModule("/src/lib/account-data.server.ts")
    : {};
  auth = await h.vite.ssrLoadModule("/src/lib/auth.server.ts");
});
beforeEach(async () => {
  await h.reset();
});
after(async () => {
  await h?.close();
});
async function passwordOwner(user = h.userA) {
  assert.equal(typeof auth.hashPassword, "function");
  h.sqlite
    .prepare("UPDATE users SET password_hash=? WHERE id=?")
    .run(await auth.hashPassword(password), user);
}
async function ownedFixture() {
  await passwordOwner();
  const seeded = await h.seedChart(h.records());
  await h.app.addLifeEvent(
    h.records(),
    h.userA,
    "2026-10-12",
    "work",
    "Retained note",
    "Retained body",
  );
  await h.app.addLifeEvent(h.records(), h.userB, "2026-10-12", "work", "Other owner note");
  await h.app.setConsent(h.records(), h.userA, "USR-07", true);
  await h.app.updatePrefs(h.records(), h.userA, "Name", "warm", "technical", "work");
  h.sqlite
    .prepare("INSERT INTO identity_links(id,user_id,issuer,subject,email) VALUES (?,?,?,?,?)")
    .run(
      "link-a",
      h.userA,
      "https://fixture.invalid/auth",
      "subject-a",
      "identity@example.invalid",
    );
  h.sqlite
    .prepare(
      "INSERT INTO assistant_grants(id,user_id,link_id,client_id,status,scopes) VALUES (?,?,?,?,?,?)",
    )
    .run("grant-a", h.userA, "link-a", "client-a", "active", '["today","journal"]');
  for (const token of ["session-a", "session-b"])
    h.sqlite
      .prepare("INSERT INTO sessions(id,user_id,created_at,expires_at) VALUES (?,?,?,?)")
      .run(
        createHash("sha256").update(token).digest("hex"),
        h.userA,
        new Date().toISOString(),
        "2030-01-01T00:00:00Z",
      );
  return seeded;
}

test("personalization reset keeps the login, encrypted journal and chart history", async () => {
  assert.equal(typeof api.resetPersonalization, "function", "personalization reset is missing");
  await ownedFixture();
  const before = h.sqlite
    .prepare("SELECT label_ct,body_ct FROM life_events WHERE user_id=?")
    .get(h.userA);
  await api.resetPersonalization(h.userA, h.records());
  assert.deepEqual(
    h.sqlite.prepare("SELECT label_ct,body_ct FROM life_events WHERE user_id=?").get(h.userA),
    before,
  );
  assert.ok(
    h.sqlite.prepare("SELECT wrapped_dek FROM profiles WHERE id=?").get(h.userA).wrapped_dek,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=?").get(h.userA).n,
    2,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM chart_snapshots WHERE user_id=?").get(h.userA).n,
    1,
  );
  assert.equal(
    (await h.app.loadConsents(h.records(), h.userA)).some((c) => c.granted),
    false,
  );
  assert.equal((await h.app.loadProfile(h.records(), h.userA)).domain_pref, null);
});

test("export paginates every retained owner category without calculating or writing", async () => {
  assert.equal(typeof api.exportAccountData, "function", "complete saved-data export is missing");
  const { dek } = await ownedFixture();
  const encrypted = await h.cryptoModule.encryptField(dek, "Saved fixture text");
  const event = h.sqlite.prepare(
    "INSERT INTO life_events(id,user_id,occurred_on,label_ct) VALUES (?,?,?,?)",
  );
  const reading = h.sqlite.prepare(
    "INSERT INTO daily_readings(id,user_id,reading_date,headline,body_ct,idempotency_key) VALUES (?,?,?,?,?,?)",
  );
  const feedback = h.sqlite.prepare(
    "INSERT INTO reading_feedback(id,user_id,reading_id,resonance) VALUES (?,?,?,?)",
  );
  const audit = h.sqlite.prepare(
    "INSERT INTO audit_events(id,user_id,kind,detail) VALUES (?,?,?,?)",
  );
  for (let i = 0; i < 611; i++) {
    event.run(`event-${i}`, h.userA, "2026-10-12", encrypted);
    reading.run(`reading-${i}`, h.userA, "2026-10-12", "Saved headline", encrypted, `saved-${i}`);
    feedback.run(`feedback-${i}`, h.userA, `reading-${i}`, 1);
    audit.run(`audit-${i}`, h.userA, "saved.fixture", "{}");
  }
  const start = h.requests.length;
  const result = await api.exportAccountData(h.userA, h.records());
  assert.equal(result.schema_version, "pattern-account-export-1");
  assert.equal(result.journal.events.length, 612);
  assert.equal(result.journal.feedback.length, 611);
  assert.equal(result.readings.length, 611);
  assert.equal(result.audit.length, 612);
  assert.equal(result.counts.life_events, 612);
  assert.ok(result.omitted.includes("password hashes, session identifiers and encryption keys"));
  const json = JSON.stringify(result);
  assert.equal(json.includes("Other owner note"), false);
  assert.equal(json.includes("password_hash"), false);
  assert.equal(json.includes("wrapped_dek"), false);
  assert.equal(h.gatewayRequests.length + h.swissRequests.length + h.episodeRequests.length, 0);
  assert.equal(
    h.requests.slice(start).some((r) => /^(insert|update|delete)/i.test(r.sql)),
    false,
  );
});

test("wrong password or owner cannot delete an account", async () => {
  assert.equal(typeof api.deleteAccount, "function", "account deletion is missing");
  await ownedFixture();
  await assert.rejects(api.deleteAccount(h.userA, "wrong password", h.records()), /password/i);
  await assert.rejects(api.deleteAccount(h.userB, password, h.records()), /password/i);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM users").get().n, 2);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM assistant_grants").get().n, 1);
});

test("failed account deletion rolls back both assistant revocation and account data", async () => {
  assert.equal(typeof api.deleteAccount, "function");
  await ownedFixture();
  h.setFault({ matches: (sql) => sql.startsWith("DELETE FROM users") });
  await assert.rejects(api.deleteAccount(h.userA, password, h.records()), /could not be deleted/i);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM identity_links").get().n, 1);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM assistant_grants WHERE status='active'").get().n,
    1,
  );
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=?").get(h.userA).n,
    2,
  );
  assert.equal((await h.app.listJournal(h.records(), h.userA)).events.length, 1);
});

test("successful deletion removes every owner foreign key, both sessions and assistant access", async () => {
  assert.equal(typeof api.deleteAccount, "function");
  const { dek } = await ownedFixture();
  await api.deleteAccount(h.userA, password, h.records());
  for (const { name } of h.sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()) {
    const cols = h.sqlite.prepare(`PRAGMA table_info("${name}")`).all();
    const owner = cols.some((c) => c.name === "user_id")
      ? "user_id"
      : name === "profiles" || name === "users"
        ? "id"
        : null;
    if (owner)
      assert.equal(
        h.sqlite.prepare(`SELECT COUNT(*) n FROM "${name}" WHERE "${owner}"=?`).get(h.userA).n,
        0,
        name,
      );
  }
  assert.equal(await auth.resolveSessionToken("session-a"), null);
  assert.equal(await auth.resolveSessionToken("session-b"), null);
  const assistant = await h.vite.ssrLoadModule("/src/lib/assistant.server.ts");
  assert.equal(await assistant.userForSubject("https://fixture.invalid/auth", "subject-a"), null);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM life_events WHERE user_id=?").get(h.userB).n,
    1,
  );
  await assert.rejects(api.deleteAccount(h.userA, password, h.records()), /password|account/i);
  const inFlight = await h
    .records()
    .from("daily_readings")
    .insert({
      user_id: h.userA,
      reading_date: "2026-10-12",
      headline: "Late job",
      body_ct: await h.cryptoModule.encryptField(dek, "Late body"),
      idempotency_key: "in-flight",
    });
  assert.ok(inFlight.error, "an in-flight job cannot resurrect a deleted owner");
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM users WHERE id=?").get(h.userA).n, 0);
});

test("reset transaction failure leaves consents and preferences intact", async () => {
  assert.equal(typeof api.resetPersonalization, "function");
  await ownedFixture();
  h.setFault({ matches: (sql) => sql.startsWith("UPDATE profiles") });
  await assert.rejects(api.resetPersonalization(h.userA, h.records()));
  assert.equal(
    (await h.app.loadConsents(h.records(), h.userA)).find((c) => c.source_id === "USR-07").granted,
    true,
  );
  assert.equal((await h.app.loadProfile(h.records(), h.userA)).domain_pref, "work");
});

test("a delayed write with an erased data key fails instead of restoring unreadable private data", async () => {
  await ownedFixture();
  const client = h.records(),
    dek = await h.app.getDek(client, h.userA);
  const held = await h.cryptoModule.encryptField(dek, "Delayed private text");
  h.setFault({ matches: (sql) => sql.includes('delete from "chart_snapshots"') });
  await assert.rejects(h.app.eraseEverything(h.records(), h.userA));
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM identity_links").get().n, 1);
  assert.equal((await h.app.listJournal(h.records(), h.userA)).events.length, 1);
  h.setFault(null);
  await h.app.eraseEverything(h.records(), h.userA);
  const late = await client
    .from("life_events")
    .insert({ user_id: h.userA, occurred_on: "2026-10-12", label_ct: held });
  assert.ok(late.error);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM life_events WHERE user_id=?").get(h.userA).n,
    0,
  );
  assert.equal(
    h.sqlite.prepare("SELECT wrapped_dek FROM profiles WHERE id=?").get(h.userA).wrapped_dek,
    null,
  );
});
