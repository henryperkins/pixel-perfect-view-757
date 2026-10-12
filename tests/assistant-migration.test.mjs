import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
const schema = await readFile(new URL("../d1/schema.sql", import.meta.url), "utf8");
const migration = await readFile(
  new URL("../d1/migrations/20261012_assistant_access.sql", import.meta.url),
  "utf8",
);
for (const legacy of [false, true])
  test(`assistant migration preserves member records ${legacy ? "with" : "without"} partial assistant tables`, () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(schema.slice(0, schema.indexOf("-- Opt-in assistant identities.")));
      db.exec(
        "insert into users(id,email,password_hash,created_at) values ('member','member@example.invalid','original-password-hash','2026-01-01'); insert into profiles(id,wrapped_dek) values ('member','original-encrypted-key'); insert into sessions(id,user_id,created_at,expires_at) values ('session','member','2026-01-01','2027-01-01');",
      );
      if (legacy)
        db.exec(`create table identity_links(id text primary key, user_id text unique, issuer text, subject text, email text, linked_at text default (datetime('now')), unique(issuer,subject));
      create table assistant_grants(id text primary key, user_id text, client_id text, client_name text, scopes text, created_at text, revoked_at text, unique(user_id,client_id));
      insert into identity_links(id,user_id,issuer,subject) values ('link','member','issuer','subject');
      insert into assistant_grants(id,user_id,client_id,scopes) values ('legacy-grant','member','client','["journal"]');`);
      const member = db.prepare("select * from users").all(),
        profiles = db.prepare("select * from profiles").all(),
        sessions = db.prepare("select * from sessions").all();
      db.exec(migration);
      assert.deepEqual(db.prepare("select * from users").all(), member);
      assert.deepEqual(db.prepare("select * from profiles").all(), profiles);
      assert.deepEqual(db.prepare("select * from sessions").all(), sessions);
      assert.equal(
        db.prepare("select count(*) as n from assistant_grants").get().n,
        0,
        "unverified old approvals require new consent",
      );
      if (legacy) assert.equal(db.prepare("select revision from identity_links").get().revision, 0);
      else
        db.exec(
          "insert into identity_links(id,user_id,issuer,subject) values ('link','member','issuer','subject')",
        );
      db.exec(
        "insert into assistant_grants(id,user_id,link_id,client_id,scopes,status) values ('grant','member','link','client','[\"today\"]','active')",
      );
      db.exec("update assistant_grants set status='revoked'");
      assert.equal(db.prepare("select revision from identity_links").get().revision, 1);
      db.exec("delete from identity_links");
      assert.equal(db.prepare("select count(*) as n from assistant_grants").get().n, 0);
    } finally {
      db.close();
    }
  });
