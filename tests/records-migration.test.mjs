import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const runnerUrl = new URL("../scripts/migrate-records.mjs", import.meta.url);
const runner = await import(runnerUrl.href).catch((error) => {
  if (error.code === "ERR_MODULE_NOT_FOUND" && error.message.includes("migrate-records.mjs"))
    return {};
  throw error;
});
const schema = await readFile(new URL("../d1/schema.sql", import.meta.url), "utf8");
const migrationId = "20261012_journal_upgrade";
const expected = ["body_ct", "cycle_key", "feature_key", "updated_at", "revision"];

test("remote adapter uses the observed administrative batch wrapper without replaying failures", async () => {
  const requests = [];
  const statements = [
    { sql: "SELECT 1", params: [] },
    { sql: "SELECT 2", params: [] },
  ];
  let payload = {
    success: true,
    result: [
      { success: true, results: [] },
      { success: true, results: [] },
    ],
  };
  const remote = runner.remoteRecordsAdapter({
    accountId: "test-account",
    databaseId: "test-database",
    token: "local-test-token",
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return Response.json(payload);
    },
  });
  assert.equal((await remote.batch(statements)).length, 2);
  assert.deepEqual(requests[0], { batch: statements });
  payload = { success: true, result: [{ success: false, results: [] }] };
  await assert.rejects(remote.batch(statements), /maintenance query failed/i);
  assert.equal(requests.length, 2);
});

test("remote adapter rejects incomplete or malformed successful batch responses", async () => {
  const remote = runner.remoteRecordsAdapter({
    accountId: "test-account",
    databaseId: "test-database",
    token: "local-test-token",
    fetchImpl: async () =>
      Response.json({ success: true, result: [{ success: true, results: [] }] }),
  });
  await assert.rejects(
    remote.batch([{ sql: "SELECT 1" }, { sql: "SELECT 2" }]),
    /incomplete|malformed|count/i,
  );
});

function adapter(db) {
  return {
    async query(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const result = statements.map(({ sql, params = [] }) => ({
          results: db.prepare(sql).all(...params),
        }));
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

for (const state of ["old", "partial", "fresh"]) {
  test(`journal upgrade preserves ciphertext and is idempotent on ${state} schemas`, async () => {
    assert.equal(
      typeof runner.applyRecordsMigration,
      "function",
      "the safe migration runner is missing",
    );
    const db = new DatabaseSync(":memory:");
    try {
      if (state === "fresh") db.exec(schema);
      else {
        db.exec("CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users VALUES ('owner');");
        db.exec(
          "CREATE TABLE life_events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),occurred_on TEXT NOT NULL,domain TEXT NOT NULL DEFAULT 'general',label_ct TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')))",
        );
        if (state === "partial") db.exec("ALTER TABLE life_events ADD COLUMN body_ct TEXT");
      }
      if (state === "fresh")
        db.exec(
          "INSERT INTO users(id,email,password_hash,created_at) VALUES ('owner','owner@example.invalid','hash','2026-10-12')",
        );
      db.prepare("INSERT INTO life_events(id,user_id,occurred_on,label_ct) VALUES (?,?,?,?)").run(
        "event",
        "owner",
        "1990-01-01",
        "aes-gcm:encrypted-label-never-rewritten",
      );
      if (state !== "old")
        db.prepare("UPDATE life_events SET body_ct=?").run(
          "aes-gcm:encrypted-body-never-rewritten",
        );
      const original = db.prepare("SELECT * FROM life_events").get();
      const client = adapter(db);
      const result = await runner.applyRecordsMigration(client, migrationId);
      assert.equal(result.applied, true);
      const row = db.prepare("SELECT * FROM life_events").get();
      for (const [key, value] of Object.entries(original)) assert.equal(row[key], value);
      const columns = db.prepare("PRAGMA table_info(life_events)").all();
      for (const column of expected)
        assert.ok(
          columns.some((c) => c.name === column),
          column,
        );
      assert.equal(row.revision, 0);
      const after = db.prepare("SELECT * FROM life_events").all();
      assert.equal((await runner.applyRecordsMigration(client, migrationId)).applied, false);
      assert.deepEqual(db.prepare("SELECT * FROM life_events").all(), after);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pattern_record_migrations").get().n, 1);
    } finally {
      db.close();
    }
  });
}

test("incompatible existing columns and unsafe migration names leave the database untouched", async () => {
  assert.equal(typeof runner.planRecordsMigration, "function", "migration inspection is missing");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE life_events(id TEXT PRIMARY KEY, body_ct INTEGER)");
    const client = adapter(db);
    await assert.rejects(
      runner.planRecordsMigration(client, migrationId),
      /body_ct.*incompatible/i,
    );
    await assert.rejects(runner.planRecordsMigration(client, "../schema"), /migration.*name/i);
    assert.equal(
      db
        .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='pattern_record_migrations'")
        .get().n,
      0,
    );
  } finally {
    db.close();
  }
});

test("failed ledger insertion rolls back the schema upgrade", async () => {
  assert.equal(
    typeof runner.applyRecordsMigration,
    "function",
    "the safe migration runner is missing",
  );
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE life_events(id TEXT PRIMARY KEY)");
    const real = adapter(db);
    const client = {
      ...real,
      batch: (statements) =>
        real.batch([...statements, { sql: "INSERT INTO nonexistent_table VALUES ('fail')" }]),
    };
    await assert.rejects(runner.applyRecordsMigration(client, migrationId), /nonexistent_table/);
    assert.deepEqual(
      db
        .prepare("PRAGMA table_info(life_events)")
        .all()
        .map((x) => x.name),
      ["id"],
    );
    assert.equal(
      db
        .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='pattern_record_migrations'")
        .get().n,
      0,
    );
  } finally {
    db.close();
  }
});

test("default local CLI inspection performs no mutations; explicit apply is required", async () => {
  assert.equal(typeof runner.planRecordsMigration, "function", "migration inspection is missing");
  const dir = await mkdtemp(join(tmpdir(), "pattern-migration-cli-"));
  const file = join(dir, "records.sqlite");
  try {
    const db = new DatabaseSync(file);
    db.exec("CREATE TABLE life_events(id TEXT PRIMARY KEY)");
    db.close();
    const args = [
      fileURLToPath(runnerUrl),
      "--local",
      "--database",
      file,
      "--migration",
      migrationId,
    ];
    const inspect = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(inspect.status, 0, inspect.stderr);
    const checked = new DatabaseSync(file);
    assert.deepEqual(
      checked
        .prepare("PRAGMA table_info(life_events)")
        .all()
        .map((x) => x.name),
      ["id"],
    );
    checked.close();
    const apply = spawnSync(process.execPath, [...args, "--apply"], { encoding: "utf8" });
    assert.equal(apply.status, 0, apply.stderr);
    const upgraded = new DatabaseSync(file);
    assert.ok(
      upgraded
        .prepare("PRAGMA table_info(life_events)")
        .all()
        .some((x) => x.name === "revision"),
    );
    upgraded.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
