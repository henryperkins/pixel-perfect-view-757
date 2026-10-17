import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, api, auth, delegate, emails;
const hash = (raw) => createHash("sha256").update(raw).digest("hex");
const password = "Fixture current password";
before(async () => {
  h = await createRecordsHarness();
  api = await h.vite.ssrLoadModule("/src/lib/account-security.server.ts");
  auth = await h.vite.ssrLoadModule("/src/lib/auth.server.ts");
  delegate = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://api.lovable.dev/")) {
      emails.push(JSON.parse(String(init.body)));
      return Response.json({ success: true, message_id: "synthetic-delivery", status: "queued" });
    }
    return delegate(input, init);
  };
});
beforeEach(async () => {
  await h.reset();
  emails = [];
  process.env.LOVABLE_API_KEY = "synthetic-email-key";
  process.env.PATTERN_APP_URL = "https://pattern.example.invalid";
  h.sqlite
    .prepare("UPDATE users SET email=?,password_hash=? WHERE id=?")
    .run("fixture@example.invalid", await auth.hashPassword(password), h.userA);
  h.sqlite
    .prepare("INSERT INTO sessions(id,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .run(hash("old-session"), h.userA, new Date().toISOString(), "2030-01-01T00:00:00Z");
});
after(async () => {
  globalThis.fetch = delegate;
  await h?.close();
});
function emailToken() {
  const match = emails.at(-1).html.match(/#token=([a-f0-9]{64})/);
  assert.ok(match);
  return match[1];
}

test("delivery inspection is restricted to the owner's current email and returns metadata only", async () => {
  const currentFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://api.lovable.dev/")) {
      assert.equal(new URL(String(input)).searchParams.get("recipient"), "fixture@example.invalid");
      return Response.json({
        data: [
          {
            recipient: "fixture@example.invalid",
            timestamp: new Date().toISOString(),
            event_type: "delivered",
            message_id: "private-message-id",
          },
          {
            recipient: "another@example.invalid",
            timestamp: new Date().toISOString(),
            event_type: "bounced",
          },
        ],
        pagination: { has_more: false, next_cursor: null },
        history_starts_at: new Date().toISOString(),
      });
    }
    return currentFetch(input, init);
  };
  try {
    const result = await api.emailDeliveryStatus(h.userA, h.records());
    assert.equal(result.available, true);
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0].event, "delivered");
    assert.equal(JSON.stringify(result).includes("another@example"), false);
    assert.equal(JSON.stringify(result).includes("private-message-id"), false);
  } finally {
    globalThis.fetch = currentFetch;
  }
});

test("an unaccepted send removes its token and records only safe failure metadata", async () => {
  const currentFetch = globalThis.fetch;
  globalThis.fetch = (input, init) =>
    String(input).startsWith("https://api.lovable.dev/")
      ? Promise.resolve(Response.json({ success: false, status: "rejected" }))
      : currentFetch(input, init);
  try {
    await assert.rejects(api.sendConfirmation(h.userA, h.records()), /could not be sent/);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM account_tokens").get().n, 0);
    const receipt = h.sqlite
      .prepare("SELECT detail FROM audit_events WHERE kind='account.email'")
      .get();
    assert.equal(JSON.parse(receipt.detail).status, "failed");
    assert.equal(receipt.detail.includes("password"), false);
  } finally {
    globalThis.fetch = currentFetch;
  }
});

test("confirmation email uses the requested sender and trusted origin, and cannot be replayed", async () => {
  await api.sendConfirmation(h.userA, h.records());
  assert.equal(emails.length, 1);
  assert.match(emails[0].from, /Pattern.*noreply@acct\.patterns\.lakefrontdigital\.io/);
  assert.equal(emails[0].sender_domain, "acct.patterns.lakefrontdigital.io");
  assert.match(emails[0].html, /https:\/\/pattern.example.invalid\/confirm-email/);
  const token = emailToken(),
    row = h.sqlite.prepare("SELECT * FROM account_tokens").get();
  assert.equal(row.token_hash, hash(token));
  assert.equal(JSON.stringify(row).includes(token), false);
  await api.consumeAccountToken(token, "confirm", undefined, h.records());
  assert.equal((await api.securityStatus(h.userA, h.records())).confirmed, true);
  await assert.rejects(
    api.consumeAccountToken(token, "confirm", undefined, h.records()),
    /expired|used/,
  );
});

test("forgot password is non-enumerating and single-use reset revokes every session", async () => {
  const unknown = await api.requestPasswordReset(
    "unknown@example.invalid",
    "fixture-ip",
    h.records(),
  );
  assert.equal(emails.length, 0);
  const known = await api.requestPasswordReset(
    " FIXTURE@example.invalid ",
    "fixture-ip",
    h.records(),
  );
  assert.deepEqual(known, unknown);
  assert.equal(emails.length, 1);
  const token = emailToken();
  await assert.rejects(
    api.consumeAccountToken(token, "confirm", undefined, h.records()),
    /expired|used/,
  );
  await api.consumeAccountToken(token, "reset", "New fixture password", h.records());
  await assert.rejects(
    auth.requireCurrentPassword(h.userA, password, h.records()),
    /does not match/,
  );
  await auth.requireCurrentPassword(h.userA, "New fixture password", h.records());
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=?").get(h.userA).n,
    0,
  );
  await assert.rejects(
    api.consumeAccountToken(token, "reset", "Another fixture password", h.records()),
    /expired|used/,
  );
});

test("expired tokens and tokens predating an account change cannot alter the account", async () => {
  await api.requestPasswordReset("fixture@example.invalid", "fixture-ip", h.records());
  const expired = emailToken();
  h.sqlite.prepare("UPDATE account_tokens SET expires_at=0").run();
  await assert.rejects(
    api.consumeAccountToken(expired, "reset", "New fixture password", h.records()),
  );
  await api.requestPasswordReset("fixture@example.invalid", "fixture-ip", h.records());
  const stale = emailToken();
  h.sqlite.prepare("UPDATE users SET email=? WHERE id=?").run("changed@example.invalid", h.userA);
  await assert.rejects(
    api.consumeAccountToken(stale, "reset", "New fixture password", h.records()),
  );
  await auth.requireCurrentPassword(h.userA, password, h.records());
});

test("email changes require the current password and new-address confirmation before replacing login", async () => {
  await assert.rejects(
    api.changeEmail(h.userA, "wrong password", "new@example.invalid", h.records()),
    /does not match/,
  );
  assert.equal(emails.length, 0);
  await api.changeEmail(h.userA, password, "new@example.invalid", h.records());
  assert.equal(emails[0].to, "new@example.invalid");
  assert.equal((await api.securityStatus(h.userA, h.records())).email, "fixture@example.invalid");
  await api.consumeAccountToken(emailToken(), "confirm", undefined, h.records());
  assert.equal((await api.securityStatus(h.userA, h.records())).email, "new@example.invalid");
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=?").get(h.userA).n,
    0,
  );
});

test("password changes verify the current password and revoke pending links and sessions", async () => {
  await api.sendConfirmation(h.userA, h.records());
  await assert.rejects(
    api.changePassword(h.userA, "wrong password", "New fixture password", h.records()),
  );
  await api.changePassword(h.userA, password, "New fixture password", h.records());
  await auth.requireCurrentPassword(h.userA, "New fixture password", h.records());
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=?").get(h.userA).n,
    0,
  );
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM account_tokens").get().n, 0);
});

test("reset requests throttle known and unknown addresses without leaking membership", async () => {
  for (let i = 0; i < 7; i++)
    assert.deepEqual(
      await api.requestPasswordReset("fixture@example.invalid", "fixture-ip", h.records()),
      { ok: true },
    );
  assert.equal(emails.length, 5);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM account_tokens").get().n, 1);
  assert.equal(
    JSON.stringify(h.sqlite.prepare("SELECT * FROM account_rate_limits").all()).includes(
      "fixture@example.invalid",
    ),
    false,
  );
});

test("unknown or malformed tokens fail without changing any account", async () => {
  for (const value of ["", "bad", randomBytes(32).toString("hex")])
    await assert.rejects(
      api.consumeAccountToken(value, "reset", "New fixture password", h.records()),
    );
  await auth.requireCurrentPassword(h.userA, password, h.records());
});

test("confirming email does not invalidate a pending password reset", async () => {
  await api.requestPasswordReset("fixture@example.invalid", "fixture-ip", h.records());
  const reset = emailToken();
  await api.sendConfirmation(h.userA, h.records());
  const confirm = emailToken();
  await api.consumeAccountToken(confirm, "confirm", undefined, h.records());
  await api.consumeAccountToken(reset, "reset", "Replacement fixture password", h.records());
  await auth.requireCurrentPassword(h.userA, "Replacement fixture password", h.records());
});
test("a failed resend preserves the earlier usable confirmation", async () => {
  await api.sendConfirmation(h.userA, h.records());
  const original = emailToken();
  const delegate = globalThis.fetch;
  globalThis.fetch = (input, init) =>
    String(input).startsWith("https://api.lovable.dev/")
      ? Promise.resolve(Response.json({ success: false, status: "rejected" }))
      : delegate(input, init);
  try {
    await assert.rejects(api.sendConfirmation(h.userA, h.records()));
  } finally {
    globalThis.fetch = delegate;
  }
  await api.consumeAccountToken(original, "confirm", undefined, h.records());
  assert.equal((await api.securityStatus(h.userA, h.records())).confirmed, true);
});
async function assistantLink() {
  await h
    .records()
    .exec(
      "INSERT INTO identity_links(id,user_id,issuer,subject) VALUES('link',?,'fixture','subject')",
      [h.userA],
    );
  await h
    .records()
    .exec(
      "INSERT INTO assistant_grants(id,user_id,link_id,client_id,status) VALUES('grant',?,'link','client','active')",
      [h.userA],
    );
}
test("password change revokes assistant links and grants", async () => {
  await assistantLink();
  await api.changePassword(h.userA, password, "Replacement fixture password", h.records());
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM identity_links").get().n, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM assistant_grants").get().n, 0);
});
test("password recovery revokes assistant links and grants", async () => {
  await assistantLink();
  await api.requestPasswordReset("fixture@example.invalid", "fixture-ip", h.records());
  await api.consumeAccountToken(emailToken(), "reset", "Replacement fixture password", h.records());
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM assistant_grants").get().n, 0);
});
test("sign out all revokes member sessions and assistant access", async () => {
  await assistantLink();
  await api.signOutAll(h.userA, h.records());
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM sessions").get().n, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM assistant_grants").get().n, 0);
});
