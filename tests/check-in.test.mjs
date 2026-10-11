import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// The records client, server functions, encryption, validation, and schema are
// loaded from the application. Only the signed worker's database transport is
// replaced: generated SQL runs in a temporary SQLite file, never a live service.
const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
const userA = "local-check-in-user-a";
const userB = "local-check-in-user-b";
const day = new Date().toISOString().slice(0, 10);
const shiftDay = (days) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const envNames = [
  "PATTERN_ROOT_KEY",
  "PATTERN_WORKFLOW_URL",
  "PATTERN_WORKFLOW_SECRET",
  "LOVABLE_API_KEY",
  "SWISS_EPHEMERIS_URL",
  "SWISS_EPHEMERIS_KEY",
];
const oldEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
const originalFetch = globalThis.fetch;
let vite;
let app;
let cryptoModule;
let inputModule;
let records;
let sqlite;
let directory;
let file;
let schema;
let fault = null;
let requests = [];

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "pattern-check-in-"));
  file = join(directory, "records.sqlite");
  schema = await readFile(join(projectRoot, "d1/schema.sql"), "utf8");
  process.env.PATTERN_ROOT_KEY = randomBytes(32).toString("hex");
  process.env.PATTERN_WORKFLOW_SECRET = randomBytes(32).toString("hex");
  process.env.PATTERN_WORKFLOW_URL = "http://pattern-check-in-test.invalid";
  for (const name of ["LOVABLE_API_KEY", "SWISS_EPHEMERIS_URL", "SWISS_EPHEMERIS_KEY"])
    delete process.env[name];
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    assert.equal(
      url,
      `${process.env.PATTERN_WORKFLOW_URL}/d1/query`,
      "The harness forbids non-local application network calls",
    );
    assert.equal(init.method, "POST");
    const raw = String(init.body);
    const expected = createHmac("sha256", process.env.PATTERN_WORKFLOW_SECRET)
      .update(raw)
      .digest("hex");
    const signature = new Headers(init.headers).get("x-pattern-signature") ?? "";
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return Response.json({ error: "Invalid local test signature" }, { status: 401 });
    }
    const { sql, params } = JSON.parse(raw);
    requests.push({ sql, params });
    if (fault?.matches(sql)) {
      if (fault.empty) {
        sqlite.prepare(sql).all(...params);
        return Response.json({ results: [] });
      }
      return Response.json(
        { error: fault.message ?? "Injected local records failure" },
        { status: fault.status ?? 503 },
      );
    }
    try {
      return Response.json({ results: sqlite.prepare(sql).all(...params) });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  };
  vite = await createServer({
    root: projectRoot,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  app = await vite.ssrLoadModule("/src/lib/pattern.server.ts");
  ({ records } = await vite.ssrLoadModule("/src/lib/d1.server.ts"));
  cryptoModule = await vite.ssrLoadModule("/src/lib/crypto.server.ts");
  inputModule = await vite.ssrLoadModule("/src/lib/check-in.ts");
});

beforeEach(async () => {
  await rm(file, { force: true });
  sqlite = new DatabaseSync(file);
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(schema);
  fault = null;
  requests = [];
  const insert = sqlite.prepare(
    "INSERT INTO users(id,email,password_hash,created_at) VALUES(?,?,?,?)",
  );
  for (const user of [userA, userB])
    insert.run(
      user,
      `${user}@example.invalid`,
      "local-fixture-not-an-auth-password",
      new Date().toISOString(),
    );
});

afterEach(() => sqlite?.close());
after(async () => {
  await vite?.close();
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (oldEnv[name] === undefined) delete process.env[name];
    else process.env[name] = oldEnv[name];
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

const rawRow = (user = userA, selectedDay = day) =>
  sqlite.prepare("SELECT * FROM check_ins WHERE user_id = ? AND day = ?").get(user, selectedDay);
const consent = async (client, user, sleep = true, stress = true) => {
  if (sleep) await app.setConsent(client, user, "WEL-01", true);
  if (stress) await app.setConsent(client, user, "WEL-03", true);
};
const save = (
  client,
  {
    user = userA,
    selectedDay = day,
    mood = 2,
    energy = 4,
    sleep = 5,
    stress = 1,
    note = "A locally persisted reflection",
  } = {},
) => app.saveCheckIn(client, user, selectedDay, mood, energy, note, sleep, stress);
const assertBands = (value, expected) => {
  for (const field of ["mood", "energy", "sleep", "stress", "note"])
    assert.equal(value[field], expected[field], field);
};
async function seedChart(client, user = userA) {
  const dek = await app.getDek(client, user);
  const fingerprint = `local-fixture-${user}`;
  const birthId = randomUUID();
  const snapshotId = randomUUID();
  const inserts = [
    [
      "birth_profiles",
      {
        id: birthId,
        user_id: user,
        payload_ct: await cryptoModule.encryptJson(dek, {
          birthDate: "1990-01-01",
          birthTime: "12:00",
          placeLabel: "Local fixture",
          latitude: 0,
          longitude: 0,
          utcISO: "1990-01-01T12:00:00Z",
        }),
        fingerprint,
        time_accuracy: "exact",
        timezone: "UTC",
      },
    ],
    [
      "chart_snapshots",
      {
        id: snapshotId,
        user_id: user,
        birth_profile_id: birthId,
        fingerprint,
        engine: "swiss-ephemeris@local-fixture",
        contract_version: "local-fixture",
        positions: {},
        houses: {
          system: "Placidus",
          cusps: [],
          ephemeris: {
            precision: "high",
            degraded: false,
            degradedReason: null,
          },
        },
        aspects: [],
        uncertainty: {
          accuracy: "exact",
          minutes: 0,
          housesReliable: true,
          anglesReliable: true,
          angleClaimsSuppressed: false,
          ascendantSpreadDeg: 0,
          moonSpreadDeg: 0,
        },
      },
    ],
  ];
  for (const [table, row] of inserts) {
    const result = await client.from(table).insert(row);
    assert.equal(result.error, null, `${table}: ${result.error?.message}`);
  }
}

test("all four consented bands and encrypted note round-trip through signed SQL and a reopened database", async () => {
  const client = records();
  await consent(client, userA);
  const expected = {
    mood: 2,
    energy: 4,
    sleep: 5,
    stress: 1,
    note: "A locally persisted reflection",
  };
  const response = await save(client, expected);
  assert.equal(response.ok, true);
  assert.equal(response.day, day);
  assert.deepEqual(response.stored, {
    mood: true,
    energy: true,
    sleep: true,
    stress: true,
  });
  assertBands(response.checkIn, expected);
  assert.equal(response.checkIn.savedAt, response.savedAt);
  assert.ok(Number.isFinite(Date.parse(response.savedAt)));
  const stored = rawRow();
  assert.equal(stored.updated_at, response.savedAt);
  assert.notEqual(stored.note_ct, expected.note);
  assert.ok(!stored.note_ct.includes(expected.note));
  const ciphertext = stored.note_ct;
  const dekA = await app.getDek(client, userA);
  const dekB = await app.getDek(client, userB);
  assert.equal(await cryptoModule.decryptField(dekA, ciphertext), expected.note);
  await assert.rejects(cryptoModule.decryptField(dekB, ciphertext));
  sqlite.close();
  sqlite = new DatabaseSync(file);
  sqlite.exec("PRAGMA foreign_keys = ON");
  assertBands(await app.loadCheckIn(records(), userA, day), expected);
  assert.ok(requests.some(({ sql }) => sql.includes('on conflict("user_id", "day")')));
  assert.ok(requests.some(({ sql }) => sql.includes("returning")));
});

test("same-day saves upsert one row, preserve its identity, and persist cleared values", async () => {
  const client = records();
  await consent(client, userA);
  await save(client);
  const initial = rawRow();
  const expected = {
    mood: 5,
    energy: 1,
    sleep: 2,
    stress: 4,
    note: "Updated local reflection",
  };
  assertBands((await save(client, expected)).checkIn, expected);
  const changed = rawRow();
  assert.equal(changed.id, initial.id);
  assert.equal(changed.created_at, initial.created_at);
  assert.notEqual(changed.note_ct, initial.note_ct);
  assert.equal(
    sqlite.prepare("SELECT count(*) AS n FROM check_ins WHERE user_id=? AND day=?").get(userA, day)
      .n,
    1,
  );
  const cleared = {
    mood: null,
    energy: null,
    sleep: null,
    stress: null,
    note: null,
  };
  const result = await save(client, cleared);
  assertBands(result.checkIn, cleared);
  assert.deepEqual(result.stored, {
    mood: false,
    energy: false,
    sleep: false,
    stress: false,
  });
  assertBands(await app.loadCheckIn(client, userA, day), cleared);
  assert.equal(rawRow().note_ct, null);
});

test("per-source consent gates Sleep and Stress before they reach storage", async () => {
  const client = records();
  await consent(client, userA, true, false);
  const first = await save(client);
  assert.deepEqual(first.stored, {
    mood: true,
    energy: true,
    sleep: true,
    stress: false,
  });
  assert.equal(first.checkIn.sleep, 5);
  assert.equal(first.checkIn.stress, null);
  assert.equal(rawRow().stress, null);
  await app.setConsent(client, userA, "WEL-01", false);
  const second = await save(client);
  assert.equal(second.checkIn.sleep, null);
  assert.equal(second.checkIn.stress, null);
  assert.equal(rawRow().sleep, null);
  const noConsent = await save(client, { user: userB });
  assert.equal(noConsent.checkIn.sleep, null);
  assert.equal(noConsent.checkIn.stress, null);
});

test("same-day records, notes, and returned check-ins remain scoped to their account", async () => {
  const client = records();
  await consent(client, userA);
  await consent(client, userB);
  const a = {
    mood: 1,
    energy: 2,
    sleep: 3,
    stress: 4,
    note: "Account A local note",
  };
  const b = {
    mood: 5,
    energy: 4,
    sleep: 2,
    stress: 1,
    note: "Account B local note",
  };
  await save(client, a);
  await save(client, { user: userB, ...b });
  assertBands(await app.loadCheckIn(client, userA, day), a);
  assertBands(await app.loadCheckIn(client, userB, day), b);
  assert.equal(await app.loadCheckIn(client, userA, shiftDay(1)), null);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM check_ins WHERE day=?").get(day).n, 2);
  assert.notEqual(rawRow(userA).note_ct, rawRow(userB).note_ct);
});

test("180-day retention clears only expired wellness bands and only the current account", async () => {
  const client = records();
  await consent(client, userA);
  const outsideRetention = await save(client, {
    selectedDay: shiftDay(-181),
    note: "Expired-band local note",
  });
  assert.equal(outsideRetention.stored.sleep, false);
  assert.equal(outsideRetention.stored.stress, false);
  assert.equal(rawRow(userA, shiftDay(-181)).sleep, null);
  assert.equal(rawRow(userA, shiftDay(-181)).stress, null);
  await save(client, { selectedDay: shiftDay(-180) });
  assert.equal(rawRow(userA, shiftDay(-180)).sleep, 5, "cutoff date is retained");
  const dekA = await app.getDek(client, userA);
  const dekB = await app.getDek(client, userB);
  // Seed legacy rows that really contain expired bands; a no-op purge must fail.
  for (const [user, dek, mood, energy, sleep, stress, note] of [
    [userA, dekA, 2, 4, 5, 1, "Preserved account A expired-band note"],
    [userB, dekB, 3, 3, 4, 2, "Other account expired-band fixture"],
  ]) {
    const seed = await client.from("check_ins").upsert(
      {
        user_id: user,
        day: shiftDay(-181),
        mood,
        energy,
        sleep,
        stress,
        note_ct: await cryptoModule.encryptField(dek, note),
        updated_at: "2026-01-01T12:34:56.000Z",
      },
      { onConflict: "user_id,day" },
    );
    assert.equal(seed.error, null);
  }
  const beforeA = rawRow(userA, shiftDay(-181));
  const beforeB = rawRow(userB, shiftDay(-181));
  assert.equal(beforeA.sleep, 5);
  assert.equal(beforeA.stress, 1);
  await app.purgeExpiredWellness(client, userA);
  const afterA = rawRow(userA, shiftDay(-181));
  assert.deepEqual(
    { ...afterA },
    { ...beforeA, sleep: null, stress: null },
    "row, ordinary bands, ciphertext, identity, and timestamps survive the purge",
  );
  assert.equal(
    (await app.loadCheckIn(client, userA, shiftDay(-181))).note,
    "Preserved account A expired-band note",
  );
  assert.deepEqual(
    rawRow(userB, shiftDay(-181)),
    beforeB,
    "other account's complete row stays unchanged",
  );
  assert.equal(
    rawRow(userA, shiftDay(-180)).sleep,
    5,
    "cutoff-date band still survives explicit purge",
  );
});

test("cached Today and Journal load the persisted check-in from the checked-in schema", async () => {
  const client = records();
  await consent(client, userA);
  await seedChart(client);
  const expected = {
    mood: 2,
    energy: 4,
    sleep: 5,
    stress: 1,
    note: "A locally persisted reflection",
  };
  const saved = await save(client, expected);
  // Generate through the actual current cache key before closing SQLite.
  const generated = await app.getToday(client, userA, "UTC");
  assert.equal(generated.needsOnboarding, false);
  assertBands(generated.wellness, expected);
  sqlite.close();
  sqlite = new DatabaseSync(file);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const today = await app.getToday(records(), userA, "UTC");
  assert.equal(today.needsOnboarding, false);
  assert.equal(
    today.reading.id,
    generated.reading.id,
    "the reopened read reuses real cached prose",
  );
  assertBands(today.wellness, expected);
  assert.equal(today.wellness.savedAt, saved.savedAt);
  const journal = await app.listJournal(records(), userA);
  assertBands(
    journal.checkIns.find((entry) => entry.day === day),
    expected,
  );
  assert.deepEqual(journal.events, []);
  await app.setConsent(client, userA, "WEL-01", false);
  const afterRevocation = await app.getToday(client, userA, "UTC");
  assert.equal(afterRevocation.wellness.sleepEnabled, false);
  assert.equal(afterRevocation.wellness.sleep, null);
  assert.equal(afterRevocation.wellness.stress, 1);
  assert.equal(afterRevocation.wellness.note, expected.note);
});

test("concurrent first use establishes one encryption key for an account", async () => {
  const client = records();
  const [first, second] = await Promise.all([app.getDek(client, userA), app.getDek(client, userA)]);
  const sealed = await cryptoModule.encryptField(first, "Concurrent local key test");
  assert.equal(await cryptoModule.decryptField(second, sealed), "Concurrent local key test");
  const persisted = await app.getDek(client, userA);
  assert.equal(await cryptoModule.decryptField(persisted, sealed), "Concurrent local key test");
});

test("failed writes and missing RETURNING rows cannot report a successful save", async () => {
  const client = records();
  await consent(client, userA);
  fault = { matches: (sql) => sql.startsWith('insert into "check_ins"') };
  await assert.rejects(save(client), /Injected local records failure/);
  assert.equal(rawRow(), undefined);
  fault = {
    matches: (sql) => sql.startsWith('insert into "check_ins"'),
    empty: true,
  };
  await assert.rejects(save(client), /No row returned|persist|save|check-in/i);
});

test("check-in reads, consent reads, and retention failures propagate instead of looking empty", async () => {
  const client = records();
  await consent(client, userA);
  await seedChart(client);
  await save(client);
  const previouslySaved = rawRow();
  fault = {
    matches: (sql) => sql.startsWith("select") && sql.includes('from "check_ins"'),
  };
  await assert.rejects(app.loadCheckIn(client, userA, day), /Injected local records failure/);
  await assert.rejects(app.listJournal(client, userA), /Injected local records failure/);
  await assert.rejects(app.getToday(client, userA, "UTC"), /Injected local records failure/);
  fault = {
    matches: (sql) => sql.startsWith("select") && sql.includes('from "source_consents"'),
  };
  await assert.rejects(save(client), /Injected local records failure/);
  assert.deepEqual(
    rawRow(),
    previouslySaved,
    "transient consent failure must not erase the existing bands or note",
  );
  fault = { matches: (sql) => sql.startsWith('update "check_ins"') };
  await assert.rejects(app.purgeExpiredWellness(client, userA), /Injected local records failure/);
  await assert.rejects(app.getToday(client, userA, "UTC"), /Injected local records failure/);
});

test("malformed encrypted notes surface an error without returning a false empty note", async () => {
  const client = records();
  await save(client);
  sqlite
    .prepare("UPDATE check_ins SET note_ct=? WHERE user_id=? AND day=?")
    .run("invalid-ciphertext", userA, day);
  await assert.rejects(app.loadCheckIn(client, userA, day));
});

test("the shared input schema accepts unset bands and rejects invalid bands, dates, and oversized notes", () => {
  const schema = inputModule.checkInInputSchema;
  assert.ok(schema, "Export checkInInputSchema from the shared input module");
  const base = { day, mood: null, energy: null, note: null };
  assert.deepEqual(schema.parse(base), { ...base, sleep: null, stress: null });
  for (const band of ["mood", "energy", "sleep", "stress"]) {
    for (const value of [0, 6, 2.5, "3", NaN])
      assert.equal(
        schema.safeParse({ ...base, [band]: value }).success,
        false,
        `${band}: ${String(value)}`,
      );
    for (const value of [1, 5, null])
      assert.equal(
        schema.safeParse({ ...base, [band]: value }).success,
        true,
        `${band}: ${String(value)}`,
      );
  }
  assert.equal(schema.safeParse({ ...base, day: "not-a-date" }).success, false);
  for (const invalidDay of ["2026-02-30", "2026-02-31", "2026-13-01", "2026-02-29"]) {
    assert.equal(schema.safeParse({ ...base, day: invalidDay }).success, false, invalidDay);
  }
  assert.equal(schema.safeParse({ ...base, day: "2028-02-29" }).success, true);
  assert.equal(schema.safeParse({ ...base, note: "x".repeat(2001) }).success, false);
  assert.equal(schema.safeParse({ ...base, note: "x".repeat(2000) }).success, true);
});

test("server save validates its input before executing any records statement", async () => {
  const client = records();
  await assert.rejects(app.saveCheckIn(client, userA, day, 6, 4, "Invalid local band", 5, 1));
  for (const invalidDay of ["2026-02-30", "2026-02-31", "2026-13-01", "2026-02-29"]) {
    await assert.rejects(
      app.saveCheckIn(client, userA, invalidDay, 2, 4, "Invalid local date", 5, 1),
    );
  }
  assert.equal(requests.length, 0);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM check_ins").get().n, 0);
});
