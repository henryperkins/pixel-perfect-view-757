/**
 * Assistant (MCP) identity links and per-assistant grants.
 *
 * Pattern sign-in stays cookie-only. An assistant identity (built-in accounts)
 * is linked to a Pattern account only while the member is signed in to Pattern,
 * and is then resolved by issuer + subject, never by email.
 */
import { exec } from "./d1.server";

export const ASSISTANT_SCOPES = ["today", "pattern", "journal"] as const;
export type AssistantScope = (typeof ASSISTANT_SCOPES)[number];

export function assistantIssuer(): string {
  const ref = process.env["SUPABASE_PROJECT_ID"] ?? process.env["VITE_SUPABASE_PROJECT_ID"];
  if (!ref) throw new Error("Assistant sign-in is not configured.");
  return `https://${ref}.supabase.co/auth/v1`;
}

export interface VerifiedIdentity {
  subject: string;
  email: string | null;
}

/** Verifies a built-in accounts access token with the auth server. */
export async function verifyAssistantIdentity(accessToken: string): Promise<VerifiedIdentity> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Assistant sign-in is not configured.");
  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Your assistant sign-in has expired. Sign in again.");
  const user = (await res.json()) as {
    id?: string;
    email?: string;
    email_confirmed_at?: string | null;
    app_metadata?: { provider?: string; providers?: string[] };
  };
  if (!user.id) throw new Error("Your assistant sign-in could not be verified.");
  const providers = user.app_metadata?.providers ?? [user.app_metadata?.provider ?? ""];
  if (!user.email_confirmed_at && !providers.includes("google")) {
    throw new Error("Confirm the email for this assistant sign-in before linking it.");
  }
  return { subject: user.id, email: user.email ?? null };
}

export async function linkIdentity(userId: string, accessToken: string) {
  const identity = await verifyAssistantIdentity(accessToken);
  const issuer = assistantIssuer();
  // Insert-only: both UNIQUE constraints make concurrent or repeat links fail closed.
  try {
    await exec(
      `insert into identity_links (id, user_id, issuer, subject, email) values (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), userId, issuer, identity.subject, identity.email],
    );
  } catch {
    const mine = await exec<{ subject: string }>(
      "select subject from identity_links where user_id = ?",
      [userId],
    );
    if (mine[0]?.subject === identity.subject) return { linked: true, email: identity.email };
    if (mine[0]) throw new Error("Your Pattern account is already linked. Unlink it first.");
    throw new Error("That assistant sign-in is already linked to another Pattern account.");
  }
  return { linked: true, email: identity.email };
}

/** Unlinking also revokes every grant, so assistants lose access on their next call. */
export async function unlinkIdentity(userId: string) {
  await exec("delete from assistant_grants where user_id = ?", [userId]);
  await exec("delete from identity_links where user_id = ?", [userId]);
  return { ok: true };
}

export async function assistantAccess(userId: string) {
  const [link] = await exec<{ email: string | null; linked_at: string }>(
    "select email, linked_at from identity_links where user_id = ?",
    [userId],
  );
  const grants = await exec<{
    client_id: string;
    client_name: string | null;
    scopes: string;
    created_at: string;
  }>(
    "select client_id, client_name, scopes, created_at from assistant_grants where user_id = ? and revoked_at is null order by created_at desc",
    [userId],
  );
  return {
    link: link ? { email: link.email, linkedAt: link.linked_at } : null,
    grants: grants.map((g) => ({
      clientId: g.client_id,
      clientName: g.client_name,
      scopes: parseScopes(g.scopes),
      createdAt: g.created_at,
    })),
  };
}

export async function revokeGrant(userId: string, clientId: string) {
  await exec(
    "update assistant_grants set revoked_at = datetime('now') where user_id = ? and client_id = ?",
    [userId, clientId],
  );
  return { ok: true };
}

export function parseScopes(raw: unknown): AssistantScope[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(value)
    ? ASSISTANT_SCOPES.filter((s) => (value as unknown[]).includes(s))
    : [];
}

export async function userForSubject(issuer: string, subject: string): Promise<string | null> {
  const rows = await exec<{ user_id: string }>(
    "select user_id from identity_links where issuer = ? and subject = ?",
    [issuer, subject],
  );
  return rows[0]?.user_id ?? null;
}

/** Consent page: who this assistant identity is linked to. */
export async function consentStatus(accessToken: string) {
  const identity = await verifyAssistantIdentity(accessToken);
  const userId = await userForSubject(assistantIssuer(), identity.subject);
  return { linked: Boolean(userId), email: identity.email };
}

export async function recordGrant(
  accessToken: string,
  clientId: string,
  clientName: string | null,
  scopes: AssistantScope[],
) {
  const identity = await verifyAssistantIdentity(accessToken);
  const userId = await userForSubject(assistantIssuer(), identity.subject);
  if (!userId) throw new Error("Link this sign-in to your Pattern account first.");
  await exec(
    `insert into assistant_grants (id, user_id, client_id, client_name, scopes) values (?, ?, ?, ?, ?)
     on conflict(user_id, client_id) do update set
       scopes = excluded.scopes, client_name = excluded.client_name,
       revoked_at = null, created_at = datetime('now')`,
    [crypto.randomUUID(), userId, clientId, clientName, JSON.stringify(scopes)],
  );
  return { ok: true };
}

/** Every tool call: verified claims → linked member → current grant with the scope. */
export async function resolveAssistantCaller(
  claims: Record<string, unknown>,
  scope: AssistantScope,
): Promise<{ userId: string } | { error: string }> {
  const iss = typeof claims["iss"] === "string" ? claims["iss"] : "";
  const sub = typeof claims["sub"] === "string" ? claims["sub"] : "";
  const clientId = typeof claims["client_id"] === "string" ? claims["client_id"] : "";
  if (!iss || !sub || !clientId) return { error: "This token is not an assistant token." };
  if (iss !== assistantIssuer()) return { error: "This token was issued elsewhere." };
  const userId = await userForSubject(iss, sub);
  if (!userId) return { error: "This sign-in isn't linked to a Pattern account." };
  const [grant] = await exec<{ scopes: string }>(
    "select scopes from assistant_grants where user_id = ? and client_id = ? and revoked_at is null",
    [userId, clientId],
  );
  if (!grant) return { error: "Access for this assistant was revoked or never granted." };
  if (!parseScopes(grant.scopes).includes(scope))
    return { error: `The member hasn't shared ${scope} with this assistant.` };
  return { userId };
}
