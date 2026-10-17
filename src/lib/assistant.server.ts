import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { exec } from "./d1.server";

export const ASSISTANT_SCOPES = ["today", "pattern", "journal"] as const;
export type AssistantScope = (typeof ASSISTANT_SCOPES)[number];
export function assistantsEnabled() {
  return process.env["PATTERN_ASSISTANTS_ENABLED"] !== "false";
}
export function assistantIssuer(): string {
  const ref =
    process.env["SUPABASE_PROJECT_ID"] ??
    import.meta.env["VITE_SUPABASE_PROJECT_ID"] ??
    process.env["VITE_SUPABASE_PROJECT_ID"];
  if (!ref || !/^[a-z0-9-]+$/.test(ref)) throw new Error("Assistant sign-in is not configured.");
  return `https://${ref}.supabase.co/auth/v1`;
}
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
async function authRequest(
  accessToken: string,
  path: string,
  action?: "approve" | "deny" | "revoke",
) {
  const url = process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Assistant sign-in is not configured.");
  let res: Response;
  try {
    res = await fetch(`${url.replace(/\/$/, "")}/auth/v1${path}`, {
      method: action === "revoke" ? "DELETE" : action ? "POST" : "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      ...(action && action !== "revoke" ? { body: JSON.stringify({ action }) } : {}),
      signal: AbortSignal.timeout(10_000),
      // workerd does not implement redirect:"error". Inspect every response ourselves
      // so a provider redirect can never forward the bearer or publishable key.
      redirect: "manual",
    });
  } catch {
    throw new Error("Assistant sign-in is temporarily unavailable. Try again.");
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(
      "This sign-in or authorization request has expired. Start the connection again.",
    );
  }
  return res.status === 204 ? null : res.json();
}

/** Delegated JWTs also pass /user. Only a direct, confirmed login may manage access. */
export async function verifyAssistantIdentity(accessToken: string) {
  const issuer = assistantIssuer();
  let jwks = keySets.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    keySets.set(issuer, jwks);
  }
  let claims;
  try {
    claims = (
      await jwtVerify(accessToken, jwks, {
        issuer,
        audience: "authenticated",
        algorithms: ["ES256", "RS256"],
        requiredClaims: ["sub", "exp", "iat"],
      })
    ).payload;
  } catch {
    throw new Error("Your assistant sign-in has expired or could not be verified. Sign in again.");
  }
  if (claims["client_id"] !== undefined || claims["azp"] !== undefined)
    throw new Error(
      "Use a direct sign-in to manage access; delegated assistant tokens cannot do this.",
    );
  if (claims["role"] !== "authenticated" || claims["is_anonymous"] === true)
    throw new Error("Sign in with a confirmed account to manage assistant access.");
  const user = await authRequest(accessToken, "/user");
  if (user?.id !== claims.sub || !user?.email_confirmed_at)
    throw new Error("Confirm the email for this assistant sign-in before linking it.");
  return { subject: claims.sub!, email: typeof user.email === "string" ? user.email : null };
}

export async function linkIdentity(userId: string, accessToken: string) {
  await (await import("./account-security.server")).requireVerifiedEmail(userId);
  const identity = await verifyAssistantIdentity(accessToken);
  const issuer = assistantIssuer();
  await exec(
    `insert into identity_links (id, user_id, issuer, subject, email) values (?, ?, ?, ?, ?) on conflict do nothing`,
    [crypto.randomUUID(), userId, issuer, identity.subject, identity.email],
  );
  const [mine] = await exec<{ issuer: string; subject: string }>(
    "select issuer, subject from identity_links where user_id = ?",
    [userId],
  );
  if (mine?.issuer === issuer && mine.subject === identity.subject)
    return { linked: true, email: identity.email };
  if (mine) throw new Error("Your Pattern account is already linked. Unlink it first.");
  throw new Error("That assistant sign-in is already linked to another Pattern account.");
}
export async function unlinkIdentity(userId: string, accessToken?: string) {
  // Keep only the client IDs needed for best-effort provider cleanup after local revocation.
  const [link] = await exec<{ issuer: string; subject: string }>(
    "select issuer, subject from identity_links where user_id = ?",
    [userId],
  );
  const grants = await exec<{ client_id: string }>(
    "select client_id from assistant_grants where user_id = ?",
    [userId],
  );
  // The trigger removes grants atomically, including approvals in flight.
  await exec("delete from identity_links where user_id = ?", [userId]);
  if (accessToken && link) {
    try {
      const identity = await verifyAssistantIdentity(accessToken);
      if (link.issuer === assistantIssuer() && link.subject === identity.subject)
        await Promise.all(
          grants.map((g) =>
            authRequest(
              accessToken,
              `/user/oauth/grants?client_id=${encodeURIComponent(g.client_id)}`,
              "revoke",
            ),
          ),
        );
    } catch {
      /* Losing the assistant login never prevents unlinking from Pattern. */
    }
  }
  return { ok: true };
}
export function parseScopes(raw: unknown): AssistantScope[] {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? ASSISTANT_SCOPES.filter((s) => value.includes(s)) : [];
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
    "select client_id, client_name, scopes, created_at from assistant_grants where user_id = ? and status = 'active' and revoked_at is null order by created_at desc",
    [userId],
  );
  return {
    enabled: assistantsEnabled(),
    link: link ? { email: link.email, linkedAt: link.linked_at } : null,
    grants: grants.map((g) => ({
      clientId: g.client_id,
      clientName: g.client_name,
      scopes: parseScopes(g.scopes),
      createdAt: g.created_at,
    })),
  };
}
export async function revokeGrant(userId: string, clientId: string, accessToken?: string) {
  // The revision trigger prevents an older approval from restoring revoked access.
  await exec(
    `insert into assistant_grants (id, user_id, link_id, client_id, scopes, status, revoked_at)
    select ?, user_id, id, ?, '[]', 'revoked', datetime('now') from identity_links where user_id = ?
    on conflict(user_id, client_id) do update set status = 'revoked', revoked_at = datetime('now')`,
    [crypto.randomUUID(), clientId, userId],
  );
  let providerRevoked = false;
  if (accessToken) {
    try {
      const identity = await verifyAssistantIdentity(accessToken);
      if ((await userForSubject(assistantIssuer(), identity.subject)) === userId) {
        await authRequest(
          accessToken,
          `/user/oauth/grants?client_id=${encodeURIComponent(clientId)}`,
          "revoke",
        );
        providerRevoked = true;
      }
    } catch {
      /* Local revocation holds even after loss of the second login. */
    }
  }
  return { ok: true, providerRevoked };
}
export async function userForSubject(issuer: string, subject: string) {
  const [link] = await exec<{ user_id: string }>(
    "select user_id from identity_links where issuer = ? and subject = ?",
    [issuer, subject],
  );
  return link?.user_id ?? null;
}
const providerGrantSchema = z.array(
  z.object({
    client: z.object({ id: z.string().min(1).max(200), name: z.string().max(500).nullish() }),
  }),
);
/** Also finds remembered approvals whose local grants were removed by unlinking. */
export async function listRememberedGrants(userId: string, accessToken: string) {
  const identity = await verifyAssistantIdentity(accessToken);
  if ((await userForSubject(assistantIssuer(), identity.subject)) !== userId)
    throw new Error("Sign in to the assistant account linked to this Pattern account.");
  const result = providerGrantSchema.safeParse(
    await authRequest(accessToken, "/user/oauth/grants"),
  );
  if (!result.success) throw new Error("Remembered approvals could not load. Try again.");
  return result.data.map((grant) => ({
    clientId: grant.client.id,
    clientName: grant.client.name || "Unnamed assistant",
  }));
}
export async function resetRememberedGrant(userId: string, clientId: string, accessToken: string) {
  const grants = await listRememberedGrants(userId, accessToken);
  if (!grants.some((grant) => grant.clientId === clientId))
    throw new Error("That remembered approval is no longer present. Refresh connections.");
  // Stop local access first. A provider failure remains visible and can be retried.
  await revokeGrant(userId, clientId);
  try {
    await authRequest(
      accessToken,
      `/user/oauth/grants?client_id=${encodeURIComponent(clientId)}`,
      "revoke",
    );
  } catch {
    throw new Error(
      "Pattern access has stopped, but the remembered sign-in approval could not be cleared. Try again.",
    );
  }
  return { ok: true };
}
function safeRedirect(value: unknown) {
  if (typeof value !== "string") throw new Error("Invalid authorization response.");
  const redirect = new URL(value);
  if (
    redirect.username ||
    redirect.password ||
    !(
      redirect.protocol === "https:" ||
      (redirect.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(redirect.hostname))
    )
  )
    throw new Error("Invalid authorization redirect.");
  return redirect;
}
const authorizationSchema = z.object({
  authorization_id: z.string(),
  redirect_uri: z.string().url(),
  client: z.object({ id: z.string().min(1).max(200), name: z.string().max(500).nullish() }),
  user: z.object({ id: z.string() }),
  scope: z.string().max(2000),
});
const identityScopeNames = new Set(["openid", "email", "profile", "phone", "offline_access"]);
function identityPermissions(scope: string) {
  const identityScopes = [...new Set(scope.split(/\s+/).filter(Boolean))];
  return {
    identityScopes,
    unsupportedScopes: identityScopes.filter((s) => !identityScopeNames.has(s)),
  };
}
function authorizationPath(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) throw new Error("Invalid authorization request.");
  return `/oauth/authorizations/${id}`;
}
async function authorization(accessToken: string, authorizationId: string) {
  const identity = await verifyAssistantIdentity(accessToken);
  const response = await authRequest(accessToken, authorizationPath(authorizationId));
  if (typeof response?.redirect_url === "string") {
    const redirect = safeRedirect(response.redirect_url);
    return { kind: "redirect" as const, identity, redirectUrl: redirect.href };
  }
  const parsed = authorizationSchema.safeParse(response);
  // An already-consented redirect cannot establish new local rights.
  if (
    !parsed.success ||
    parsed.data.authorization_id !== authorizationId ||
    parsed.data.user.id !== identity.subject
  )
    throw new Error(
      "This authorization request is no longer available. Reconnect with a fresh consent request.",
    );
  const [link] = await exec<{ id: string; user_id: string; revision: number }>(
    "select id, user_id, revision from identity_links where issuer = ? and subject = ?",
    [assistantIssuer(), identity.subject],
  );
  return { kind: "consent" as const, details: parsed.data, identity, link };
}
export async function getAuthorization(accessToken: string, authorizationId: string) {
  const request = await authorization(accessToken, authorizationId);
  if (request.kind === "redirect")
    return {
      kind: "redirect" as const,
      redirectUrl: request.redirectUrl,
      redirectOrigin: new URL(request.redirectUrl).origin,
    };
  const { details, identity, link } = request;
  const { getSessionUser } = await import("./auth.server");
  const member = await getSessionUser();
  return {
    kind: "consent" as const,
    linked: Boolean(link),
    memberMatches: Boolean(member && member.userId === link?.user_id),
    ...identityPermissions(details.scope),
    email: identity.email,
    clientName: details.client.name || "Unnamed assistant",
    clientId: details.client.id,
    redirectOrigin: new URL(details.redirect_uri).origin,
  };
}
export async function decideAuthorization(
  accessToken: string,
  authorizationId: string,
  scopes: AssistantScope[],
  action: "approve" | "deny",
) {
  const request = await authorization(accessToken, authorizationId);
  if (request.kind !== "consent")
    throw new Error(
      "Clear the remembered approval in Connected assistants, then reconnect for fresh consent.",
    );
  const { details, link } = request;
  const selected = z.array(z.enum(ASSISTANT_SCOPES)).max(3).parse(scopes);
  if (action !== "approve" && action !== "deny") throw new Error("Invalid consent action.");
  if (action === "approve" && !assistantsEnabled())
    throw new Error("Assistant connections are currently unavailable.");
  if (action === "approve" && (!link || !selected.length))
    throw new Error("Link this sign-in and choose at least one area to share.");
  if (action === "approve") {
    const { getSessionUser } = await import("./auth.server");
    const member = await getSessionUser();
    if (!member || member.userId !== link?.user_id)
      throw new Error("Sign in to the matching Pattern account before approving assistant access.");
    if (identityPermissions(details.scope).unsupportedScopes.length)
      throw new Error(
        "This assistant requested unsupported sign-in permissions. Deny this request.",
      );
  }
  const operation = crypto.randomUUID();
  if (action === "approve" && link) {
    const pending = await exec<{ id: string }>(
      `insert into assistant_grants (id, user_id, link_id, client_id, client_name, scopes, status, authorization_id)
      select ?, user_id, id, ?, ?, ?, 'pending', ? from identity_links where id = ? and revision = ?
      on conflict(user_id, client_id) do update set id = excluded.id, link_id = excluded.link_id, client_name = excluded.client_name,
        scopes = excluded.scopes, status = 'pending', authorization_id = excluded.authorization_id, revoked_at = null, created_at = datetime('now') returning id`,
      [
        operation,
        details.client.id,
        details.client.name ?? null,
        JSON.stringify(selected),
        authorizationId,
        link.id,
        link.revision,
      ],
    );
    if (!pending.length)
      throw new Error("The account link changed or access was revoked. Start again.");
  }
  const result = await authRequest(
    accessToken,
    `${authorizationPath(authorizationId)}/consent`,
    action,
  );
  // The auth server alone determines the callback, never browser input.
  const redirect = safeRedirect(result.redirect_url);
  const registered = new URL(details.redirect_uri);
  if (redirect.origin !== registered.origin || redirect.pathname !== registered.pathname)
    throw new Error("Invalid authorization redirect.");
  if (action === "approve" && link) {
    const active = await exec<{ id: string }>(
      `update assistant_grants set status = 'active' where id = ? and status = 'pending'
      and exists (select 1 from identity_links where id = ? and revision = ?) returning id`,
      [operation, link.id, link.revision],
    );
    if (!active.length)
      throw new Error(
        "Access was revoked or the account link changed during approval. Start again.",
      );
  }
  return { redirectUrl: redirect.href };
}
/** Claims must come from the MCP SDK verifier, never request JSON. */
export async function resolveAssistantCaller(
  claims: Record<string, unknown>,
  scope: AssistantScope,
): Promise<{ userId: string } | { error: string }> {
  if (!assistantsEnabled()) return { error: "Assistant connections are currently unavailable." };
  const { iss, sub, client_id: clientId } = claims;
  if (
    typeof iss !== "string" ||
    typeof sub !== "string" ||
    typeof clientId !== "string" ||
    !clientId ||
    claims["is_anonymous"] === true
  )
    return { error: "This token is not an assistant token." };
  if (iss !== assistantIssuer()) return { error: "This token was issued elsewhere." };
  const [grant] = await exec<{ user_id: string; scopes: string }>(
    `select g.user_id, g.scopes from assistant_grants g
    join identity_links l on l.id = g.link_id and l.user_id = g.user_id
    where l.issuer = ? and l.subject = ? and g.client_id = ? and g.status = 'active' and g.revoked_at is null`,
    [iss, sub, clientId],
  );
  if (!grant) return { error: "Access for this assistant was revoked or never granted." };
  if (!parseScopes(grant.scopes).includes(scope))
    return { error: `The member hasn't shared ${scope} with this assistant.` };
  return { userId: grant.user_id };
}
