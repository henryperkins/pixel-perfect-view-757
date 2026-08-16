/**
 * Account and session handling.
 *
 * Passwords are stored as PBKDF2-SHA256 (210k iterations, per-user salt) and
 * sessions are opaque 256-bit tokens held in an HttpOnly cookie. Only the
 * SHA-256 of the token is persisted, so a database read cannot resurrect a
 * live session.
 */
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

import { records, exec } from "./d1.server";

const COOKIE = "pattern_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 210_000;

export interface SessionUser {
  userId: string;
  email: string;
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}

async function derive(password: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) ?? [], (b) => parseInt(b, 16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${await derive(password, salt)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, , salt, digest] = stored.split("$");
  if (scheme !== "pbkdf2" || !salt || !digest) return false;
  const candidate = await derive(password, salt);
  if (candidate.length !== digest.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ digest.charCodeAt(i);
  return diff === 0;
}

function readCookie(name: string): string | null {
  const header = getRequest()?.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function setSessionCookie(token: string | null) {
  const base = `${COOKIE}=${token ?? ""}; Path=/; HttpOnly; SameSite=Lax; Secure`;
  setResponseHeader(
    "set-cookie",
    token ? `${base}; Max-Age=${SESSION_DAYS * 86400}` : `${base}; Max-Age=0`,
  );
}

async function issueSession(userId: string) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const db = records();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  const { error } = await db
    .from("sessions")
    .insert({ id: await sha256Hex(token), user_id: userId, expires_at: expires });
  if (error) throw new Error(error.message);
  setSessionCookie(token);
  return token;
}

/** Creates an account and signs it in. */
export async function signUpWithPassword(email: string, password: string): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  const db = records();
  const { data: existing } = await db
    .from<{ id: string }>("users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (existing) throw new Error("An account already exists for that email.");

  const { data: created, error } = await db
    .from<{ id: string }>("users")
    .insert({ email: normalized, password_hash: await hashPassword(password) })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not create the account.");

  await db.from("profiles").upsert({ id: created.id }, { onConflict: "id" });
  await issueSession(created.id);
  return { userId: created.id, email: normalized };
}

/** Verifies a password and starts a session. */
export async function signInWithPassword(email: string, password: string): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  const db = records();
  const { data: user } = await db
    .from<{ id: string; email: string; password_hash: string }>("users")
    .select("id, email, password_hash")
    .eq("email", normalized)
    .maybeSingle();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new Error("That email and password do not match an account.");
  }
  await db.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
  await issueSession(user.id);
  return { userId: user.id, email: user.email };
}

/** Resolves the caller from the session cookie, or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = readCookie(COOKIE);
  if (!token) return null;
  const rows = await exec<{ user_id: string; email: string; expires_at: string }>(
    `select s.user_id, s.expires_at, u.email from sessions s
       join users u on u.id = s.user_id
      where s.id = ? limit 1`,
    [await sha256Hex(token)],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await exec("delete from sessions where id = ?", [await sha256Hex(token)]);
    setSessionCookie(null);
    return null;
  }
  return { userId: row.user_id, email: row.email };
}

/** Drops the current session on both sides. */
export async function signOutCurrent() {
  const token = readCookie(COOKIE);
  if (token) await exec("delete from sessions where id = ?", [await sha256Hex(token)]);
  setSessionCookie(null);
  return { ok: true };
}

/** Role check. Roles live in their own table, never on the profile. */
export async function hasRole(userId: string, role: string): Promise<boolean> {
  const rows = await exec<{ n: number }>(
    "select count(*) as n from user_roles where user_id = ? and role = ?",
    [userId, role],
  );
  return (rows[0]?.n ?? 0) > 0;
}
