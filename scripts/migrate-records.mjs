/**
 * Inspect-before-apply additive D1 upgrades.
 * Local: node scripts/migrate-records.mjs --local --database FILE --migration ID [--apply]
 * Remote: same with --remote; uses the configured Cloudflare administrative identity.
 * Inspection is the default. SQL source and ledger are immutable after application.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const LEDGER = "pattern_record_migrations";
const DEFAULT_DATABASE = "9054f856-4e28-48c0-8f6f-d02f479466fb";
const identifier = /^[a-z][a-z0-9_]*$/i;
const quote = (value) => {
  if (!identifier.test(value)) throw new Error("Invalid migration identifier");
  return '"' + value + '"';
};

async function migrationSource(id) {
  if (!/^[0-9]{8}_[a-z0-9_]+$/.test(id)) throw new Error("Invalid migration name");
  const text = await readFile(new URL("../d1/migrations/" + id + ".sql", import.meta.url), "utf8");
  const hash = createHash("sha256").update(text).digest("hex");
  const statements = text
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const columns = statements.map((sql) => {
    const match = sql.match(
      /^ALTER TABLE ([a-z][a-z0-9_]*) ADD COLUMN ([a-z][a-z0-9_]*) (TEXT|INTEGER)( NOT NULL)?(?: DEFAULT (0))?$/i,
    );
    if (!match) throw new Error("Migration must contain only supported additive column statements");
    return {
      sql,
      table: match[1],
      name: match[2],
      type: match[3].toUpperCase(),
      notnull: match[4] ? 1 : 0,
      defaultValue: match[5] ?? null,
    };
  });
  if (!columns.length) throw new Error("Migration has no column changes");
  return { id, hash, columns };
}

/** Pure inspection: query-only adapter; never creates the ledger or changes columns. */
export async function planRecordsMigration(adapter, id) {
  const source = await migrationSource(id);
  const ledger = await adapter.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [LEDGER],
  );
  let applied = null;
  if (ledger.length) {
    [applied] = await adapter.query("SELECT source_hash FROM " + quote(LEDGER) + " WHERE id=?", [
      id,
    ]);
    if (applied && applied.source_hash !== source.hash)
      throw new Error("Applied migration source hash has changed");
  }
  const definitions = new Map();
  const pending = [];
  for (const column of source.columns) {
    if (!definitions.has(column.table)) {
      const actual = await adapter.query("PRAGMA table_info(" + quote(column.table) + ")");
      if (!actual.length) throw new Error("Migration target table is missing: " + column.table);
      definitions.set(column.table, actual);
    }
    const actual = definitions.get(column.table).find((c) => c.name === column.name);
    if (!actual) pending.push(column);
    else {
      const value =
        actual.dflt_value == null ? null : String(actual.dflt_value).replace(/^\((.*)\)$/, "$1");
      if (
        String(actual.type).toUpperCase() !== column.type ||
        Number(actual.notnull) !== column.notnull ||
        value !== column.defaultValue
      ) {
        throw new Error(column.name + " has an incompatible existing column definition");
      }
    }
  }
  if (applied && pending.length) throw new Error("Applied migration schema is incomplete");
  return {
    id,
    sourceHash: source.hash,
    applied: Boolean(applied),
    pendingColumns: pending.map((c) => c.name),
    statements: pending.map((c) => ({ sql: c.sql, params: [] })),
  };
}

/** DDL additions and the ledger entry commit together or roll back together. */
export async function applyRecordsMigration(adapter, id) {
  const plan = await planRecordsMigration(adapter, id);
  if (plan.applied) return { ...plan, applied: false, alreadyApplied: true };
  await adapter.batch([
    {
      sql:
        "CREATE TABLE IF NOT EXISTS " +
        quote(LEDGER) +
        " (id TEXT PRIMARY KEY,source_hash TEXT NOT NULL,applied_at TEXT NOT NULL)",
      params: [],
    },
    ...plan.statements,
    {
      sql: "INSERT INTO " + quote(LEDGER) + " (id,source_hash,applied_at) VALUES (?,?,?)",
      params: [id, plan.sourceHash, new Date().toISOString()],
    },
  ]);
  return { ...plan, applied: true, alreadyApplied: false };
}

export function localRecordsAdapter(db) {
  return {
    async query(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = statements.map(({ sql, params = [] }) => ({
          results: db.prepare(sql).all(...params),
        }));
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export function remoteRecordsAdapter({ accountId, databaseId, token, fetchImpl = fetch }) {
  if (!accountId || !databaseId || !token)
    throw new Error("Cloudflare account/database identity is not configured");
  const url =
    "https://api.cloudflare.com/client/v4/accounts/" +
    encodeURIComponent(accountId) +
    "/d1/database/" +
    encodeURIComponent(databaseId) +
    "/query";
  async function request(body, expectedCount) {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("D1 maintenance request failed (" + response.status + ")");
    const result = await response.json();
    if (
      !result.success ||
      !Array.isArray(result.result) ||
      result.result.some((r) => !r || r.success === false)
    ) {
      throw new Error("D1 maintenance query failed");
    }
    if (result.result.length !== expectedCount) {
      throw new Error("D1 maintenance response count was incomplete");
    }
    if (result.result.some((r) => !Array.isArray(r.results))) {
      throw new Error("Malformed D1 maintenance response");
    }
    return result.result;
  }
  return {
    async query(sql, params = []) {
      return (await request({ sql, params }, 1)).flatMap((r) => r.results);
    },
    batch(statements) {
      if (!Array.isArray(statements) || !statements.length)
        throw new Error("D1 maintenance batch requires statements");
      return request({ batch: statements }, statements.length);
    },
  };
}

async function main(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (["--local", "--remote", "--apply", "--check"].includes(arg)) options[arg.slice(2)] = true;
    else if (["--database", "--database-id", "--migration"].includes(arg)) {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(arg + " requires a value");
      options[arg.slice(2)] = argv[++i];
    } else throw new Error("Unknown migration option: " + arg);
  }
  if (Boolean(options.local) === Boolean(options.remote))
    throw new Error("Choose exactly one of --local or --remote");
  if (!options.migration) throw new Error("--migration is required");
  if (options.apply && options.check) throw new Error("--check and --apply cannot be combined");
  let db;
  try {
    let adapter;
    if (options.local) {
      if (!options.database || !existsSync(options.database))
        throw new Error("--database must name an existing local database");
      db = new DatabaseSync(options.database);
      db.exec("PRAGMA foreign_keys=ON");
      adapter = localRecordsAdapter(db);
    } else {
      adapter = remoteRecordsAdapter({
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        databaseId: options["database-id"] ?? DEFAULT_DATABASE,
        token: process.env.CLOUDFLARE_API_TOKEN,
      });
    }
    const plan = await planRecordsMigration(adapter, options.migration);
    console.log(
      JSON.stringify(
        {
          mode: options.remote ? "remote" : "local",
          action: options.apply ? "apply" : "inspect",
          plan,
        },
        null,
        2,
      ),
    );
    if (options.apply)
      console.log(JSON.stringify(await applyRecordsMigration(adapter, options.migration), null, 2));
  } finally {
    db?.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
