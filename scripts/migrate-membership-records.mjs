// Inspect first; pass --apply only after taking a private D1 backup.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { remoteRecordsAdapter } from "./migrate-records.mjs";
const root = new URL("../", import.meta.url).pathname;
const db = remoteRecordsAdapter({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: "9054f856-4e28-48c0-8f6f-d02f479466fb",
  token: process.env.CLOUDFLARE_API_TOKEN,
});
const sql = await readFile(root + "/d1/migrations/20261013_membership_accounts.sql", "utf8"),
  hash = createHash("sha256").update(sql).digest("hex");
const fixture = new DatabaseSync(":memory:");
fixture.exec("CREATE TABLE users(id TEXT PRIMARY KEY)");
fixture.exec(sql);
const tables = fixture
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name<>'users' ORDER BY name")
  .all();
const inventory = [];
for (const { name } of tables) {
  const actual = await db.query(`PRAGMA table_info(${name})`);
  const expected = fixture.prepare(`PRAGMA table_info(${name})`).all();
  const normalized = (rows) =>
    rows.map(({ cid, name, type, notnull, dflt_value, pk }) => ({
      cid,
      name,
      type,
      notnull,
      dflt_value,
      pk,
    }));
  if (actual.length && JSON.stringify(normalized(actual)) !== JSON.stringify(normalized(expected)))
    throw new Error("Existing incompatible table: " + name);
  inventory.push({ table: name, present: actual.length > 0, columns: expected.length });
}
const before = {
  users: (await db.query("SELECT count(*) n FROM users"))[0].n,
  foreignKeys: await db.query("PRAGMA foreign_key_check"),
};
console.log(
  JSON.stringify({ sourceHash: hash, inventory, before, apply: process.argv.includes("--apply") }),
);
if (process.argv.includes("--apply")) {
  const statements = sql
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sql) => ({ sql, params: [] }));
  await db.batch(statements);
  const after = {
    users: (await db.query("SELECT count(*) n FROM users"))[0].n,
    foreignKeys: await db.query("PRAGMA foreign_key_check"),
  };
  if (before.users !== after.users || after.foreignKeys.length)
    throw new Error("Post-migration checks failed");
  console.log(JSON.stringify({ applied: true, after }));
}
fixture.close();
