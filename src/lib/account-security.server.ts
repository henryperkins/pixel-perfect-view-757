import { createHash, randomBytes } from "node:crypto";
import { records, type DBClient } from "./d1.server";
import { hashPassword, requireCurrentPassword } from "./auth.server";
import { appOrigin } from "./app-origin.server";
import { sendTemplateEmail } from "./email-templates/send-email";
import { EmailAPIError, listEmailLogs } from "@lovable.dev/email-js";

type Purpose = "verify" | "reset" | "change";
type Account = { id: string; email: string; password_hash: string };
type Token = {
  token_hash: string;
  user_id: string;
  purpose: Purpose;
  email: string;
  new_email: string | null;
  password_hash: string;
  expires_at: number;
};
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const invalidLink = "This link has expired or already been used. Request a new link.";

export async function accountRateLimit(key: string, limit: number, db = records()) {
  const now = Date.now(),
    windowStart = now - 3600_000;
  const [row] = await db.exec<{ attempts: number }>(
    "INSERT INTO account_rate_limits(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts",
    [digest(key), now, windowStart, windowStart],
  );
  // Bounded anonymous identifiers, never raw email addresses or IPs.
  await db.exec("DELETE FROM account_rate_limits WHERE window_start<?", [windowStart]);
  return Boolean(row && row.attempts <= limit);
}

async function emailToken(account: Account, purpose: Purpose, db: DBClient, newEmail?: string) {
  const origin = appOrigin();
  if (!process.env["LOVABLE_API_KEY"])
    throw new Error("Account email is unavailable. Please try again later.");
  const token = randomBytes(32).toString("hex"),
    hash = digest(token),
    now = Date.now();
  const route = purpose === "reset" ? "reset-password" : "confirm-email";
  const confirmationUrl = `${origin}/${route}#token=${token}`;
  await db.batch([
    {
      sql: "DELETE FROM account_tokens WHERE expires_at<?",
      params: [now],
    },
    {
      sql: "INSERT INTO account_tokens(token_hash,user_id,purpose,email,new_email,password_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)",
      params: [
        hash,
        account.id,
        purpose,
        account.email,
        newEmail ?? null,
        account.password_hash,
        now,
        now + (purpose === "reset" ? 3600_000 : 86400_000),
      ],
    },
  ]);
  try {
    const result = await sendTemplateEmail(
      purpose === "reset"
        ? "password-reset"
        : purpose === "change"
          ? "email-change"
          : "account-confirmation",
      newEmail ?? account.email,
      {
        idempotencyKey: `pattern-account-${hash}`,
        templateData: {
          siteName: "Pattern",
          siteUrl: origin,
          recipient: account.email,
          oldEmail: account.email,
          email: newEmail ?? account.email,
          newEmail: newEmail ?? account.email,
          confirmationUrl,
        },
      },
    );
    if (!result.sent)
      throw new EmailAPIError(
        409,
        "Email delivery is unavailable for this address.",
        null,
        result.reason,
      );
    // A failed resend must not destroy an earlier usable link.
    await db.exec("DELETE FROM account_tokens WHERE user_id=? AND purpose=? AND token_hash<>? AND created_at<=?", [account.id, purpose, hash, now]);
    await db.from("audit_events").insert({
      user_id: account.id,
      kind: "account.email",
      detail: {
        purpose,
        status: "accepted",
        messageId: result.messageId ?? null,
        providerStatus: result.status ?? null,
        recipient: newEmail ?? account.email,
      },
    });
  } catch (error) {
    await db.from("audit_events").insert({
      user_id: account.id,
      kind: "account.email",
      detail: {
        purpose,
        status: "failed",
        providerStatus: error instanceof EmailAPIError ? error.status : null,
        providerCode: error instanceof EmailAPIError ? error.code : "send_failed",
        recipient: newEmail ?? account.email,
      },
    });
    await db.exec("DELETE FROM account_tokens WHERE token_hash=?", [hash]);
    throw new Error("The email could not be sent. Please try again later.");
  }
}

export async function requestPasswordReset(email: string, ip: string, db = records()) {
  if (!process.env["LOVABLE_API_KEY"])
    throw new Error("Password reset email is unavailable. Please try again later.");
  appOrigin();
  const normalized = email.trim().toLowerCase();
  const permitted = await accountRateLimit(`reset-email:${normalized}`, 5, db);
  const ipPermitted = await accountRateLimit(`reset-ip:${ip}`, 25, db);
  if (permitted && ipPermitted) {
    const [account] = await db.exec<Account>(
      "SELECT id,email,password_hash FROM users WHERE email=?",
      [normalized],
    );
    if (account) {
      try {
        await emailToken(account, "reset", db);
      } catch {
        console.warn("Pattern password reset email delivery failed.");
      }
    }
  }
  // Same result for unknown accounts, throttling and delivery failures.
  return { ok: true };
}

export async function sendConfirmation(userId: string, db = records()) {
  if (!(await accountRateLimit(`verify:${userId}`, 5, db)))
    throw new Error("Too many requests. Please wait before requesting another email.");
  const [account] = await db.exec<Account>("SELECT id,email,password_hash FROM users WHERE id=?", [
    userId,
  ]);
  if (!account) throw new Error("Sign in again to confirm your email.");
  await emailToken(account, "verify", db);
  return { ok: true };
}

export async function securityStatus(userId: string, db = records()) {
  const [row] = await db.exec<{ email: string; confirmed_at: string | null }>(
    "SELECT u.email,s.confirmed_at FROM users u LEFT JOIN account_email_state s ON s.user_id=u.id WHERE u.id=?",
    [userId],
  );
  if (!row) throw new Error("Sign in again to manage this account.");
  return { email: row.email, confirmed: Boolean(row.confirmed_at) };
}

export async function requireVerifiedEmail(userId: string, db = records()) {
  if (!(await securityStatus(userId, db)).confirmed)
    throw new Error("Confirm your Pattern email in Context & privacy before purchasing or linking an assistant.");
}

/** Removing the identity link fences approvals in flight through the existing triggers. */
export async function signOutAll(userId: string, db = records()) {
  await db.batch([
    { sql: "DELETE FROM identity_links WHERE user_id=?", params: [userId] },
    { sql: "DELETE FROM sessions WHERE user_id=?", params: [userId] },
    { sql: "DELETE FROM account_tokens WHERE user_id=?", params: [userId] },
  ]);
  return { ok: true };
}

/** Delivery metadata only, scoped to the signed-in account's current address. */
export async function emailDeliveryStatus(userId: string, db = records()) {
  const { email } = await securityStatus(userId, db);
  const attempts = await db.exec<{ detail: string; created_at: string }>(
    "SELECT detail,created_at FROM audit_events WHERE user_id=? AND kind='account.email' ORDER BY created_at DESC LIMIT 20",
    [userId],
  );
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Email delivery status is unavailable.");
  try {
    const pending = await db.exec<{new_email: string}>("SELECT new_email FROM account_tokens WHERE user_id=? AND purpose='change' AND expires_at>?", [userId, Date.now()]);
    const recipients = [...new Set([email, ...pending.map((row) => row.new_email).filter(Boolean)])];
    const results = await Promise.all(recipients.map((recipient) => listEmailLogs(
      { recipient, since: new Date(Date.now() - 7 * 86400_000).toISOString(), limit: 20 },
      { apiKey },
    )));
    return {
      available: true as const,
      attempts,
      events: results.flatMap((result) => result.data)
        .filter((event) => recipients.some((recipient) => event.recipient.toLowerCase() === recipient.toLowerCase()))
        .map((event) => ({
          timestamp: event.timestamp,
          event: event.event_type,
          status: event.status ?? "",
          tags: event.tags ?? [],
        })),
    };
  } catch (error) {
    return {
      available: false as const,
      attempts,
      providerStatus: error instanceof EmailAPIError ? error.status : null,
      providerCode: error instanceof EmailAPIError ? (error.code ?? null) : null,
    };
  }
}

export async function changeEmail(userId: string, password: string, email: string, db = records()) {
  if (!(await accountRateLimit(`account-change:${userId}`, 10, db)))
    throw new Error("Too many attempts. Please try again later.");
  const hash = await requireCurrentPassword(userId, password, db);
  const [account] = await db.exec<Account>(
    "SELECT id,email,password_hash FROM users WHERE id=? AND password_hash=?",
    [userId, hash],
  );
  if (!account) throw new Error("Your account changed. Sign in again.");
  const normalized = email.trim().toLowerCase();
  if (normalized === account.email) throw new Error("Enter a different email address.");
  if ((await db.exec("SELECT id FROM users WHERE email=?", [normalized])).length)
    throw new Error("That email address is unavailable.");
  await emailToken(account, "change", db, normalized);
  return { ok: true };
}

export async function changePassword(
  userId: string,
  current: string,
  next: string,
  db = records(),
) {
  if (!(await accountRateLimit(`account-change:${userId}`, 10, db)))
    throw new Error("Too many attempts. Please try again later.");
  const previous = await requireCurrentPassword(userId, current, db);
  const hash = await hashPassword(next);
  await db.batch([
    {
      sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE id=? AND password_hash=?) THEN 1 ELSE json('account-changed') END",
      params: [userId, previous],
    },
    { sql: "UPDATE users SET password_hash=? WHERE id=?", params: [hash, userId] },
    { sql: "DELETE FROM sessions WHERE user_id=?", params: [userId] },
    { sql: "DELETE FROM account_tokens WHERE user_id=?", params: [userId] },
    { sql: "DELETE FROM identity_links WHERE user_id=?", params: [userId] },
  ]);
  return { ok: true };
}

/** Consume a one-time link and its account change in the same D1 transaction. */
export async function consumeAccountToken(
  raw: string,
  purpose: "reset" | "confirm",
  password?: string,
  db = records(),
) {
  if (!/^[a-f0-9]{64}$/.test(raw)) throw new Error(invalidLink);
  const hash = digest(raw),
    now = Date.now();
  const [token] = await db.exec<Token>(
    "SELECT * FROM account_tokens WHERE token_hash=? AND expires_at>?",
    [hash, now],
  );
  if (!token || (purpose === "reset" ? token.purpose !== "reset" : token.purpose === "reset"))
    throw new Error(invalidLink);
  if (purpose === "reset" && (!password || password.length < 8 || password.length > 200))
    throw new Error("Use a password between 8 and 200 characters.");
  const statements = [
    {
      sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM account_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND t.expires_at>? AND t.password_hash=u.password_hash AND t.email=u.email) THEN 1 ELSE json('expired-link') END",
      params: [hash, now] as (string | number | null)[],
    },
  ];
  if (purpose === "reset")
    statements.push({
      sql: "UPDATE users SET password_hash=? WHERE id=?",
      params: [await hashPassword(password ?? ""), token.user_id],
    });
  if (token.purpose === "change")
    statements.push({
      sql: "UPDATE users SET email=? WHERE id=?",
      params: [token.new_email, token.user_id],
    });
  if (purpose === "confirm")
    statements.push({
      sql: "INSERT INTO account_email_state(user_id,confirmed_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET confirmed_at=excluded.confirmed_at",
      params: [token.user_id, new Date(now).toISOString()],
    });
  if (purpose === "reset" || token.purpose === "change")
    statements.push({ sql: "DELETE FROM sessions WHERE user_id=?", params: [token.user_id] });
  if (purpose === "reset")
    statements.push({ sql: "DELETE FROM identity_links WHERE user_id=?", params: [token.user_id] });
  statements.push(purpose === "reset" || token.purpose === "change"
    ? { sql: "DELETE FROM account_tokens WHERE user_id=?", params: [token.user_id] }
    : { sql: "DELETE FROM account_tokens WHERE token_hash=?", params: [hash] });
  try {
    await db.batch(statements);
  } catch {
    throw new Error(invalidLink);
  }
  if (token.purpose === "change" && token.new_email) {
    // The login has already changed; Stripe failing here must not undo or block it.
    try {
      await (await import("./billing.server")).syncBillingEmail(token.user_id, token.new_email, db);
    } catch {
      console.warn("Pattern billing email update failed; checkout and the portal retry it.");
    }
  }
  return { ok: true, signInRequired: purpose === "reset" || token.purpose === "change" };
}
