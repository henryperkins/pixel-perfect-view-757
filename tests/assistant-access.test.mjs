import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createHash } from "node:crypto";
import { generateKeyPair, exportJWK, SignJWT, jwtVerify } from "jose";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

const issuer = "https://assistant-fixture.supabase.co/auth/v1";
const env = {
  SUPABASE_PROJECT_ID: "assistant-fixture",
  SUPABASE_URL: "https://assistant-fixture.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "fixture-publishable",
  PATTERN_ASSISTANTS_ENABLED: "true",
};
const oldEnv = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
let h, api, keys, jwk, originalFetch, direct, delegated;
let confirmed = true;
let onConsent = null;
let cookieUser;
let failProviderReset = false;
const rememberedGrants = new Map();
let authRequests = [];
const authorizations = new Map();
async function token(sub = "identity-a", claims = {}, signingKey = keys.privateKey) {
  return new SignJWT({ role: "authenticated", ...claims })
    .setProtectedHeader({ alg: "ES256", kid: "fixture-key", typ: "JWT" })
    .setSubject(sub)
    .setIssuer(issuer)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(signingKey);
}
function request(id = "request-a", subject = "identity-a", client = "client-a") {
  authorizations.set(id, {
    authorization_id: id,
    redirect_uri: "https://assistant.example/callback",
    client: { id: client, name: "Test assistant", uri: "https://assistant.example", logo_uri: "" },
    user: { id: subject, email: `${subject}@example.invalid` },
    scope: "email",
  });
  return id;
}
before(async () => {
  h = await createRecordsHarness();
  Object.assign(process.env, env);
  keys = await generateKeyPair("ES256");
  jwk = { ...(await exportJWK(keys.publicKey)), kid: "fixture-key", alg: "ES256", use: "sig" };
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.startsWith(issuer)) return originalFetch(input, init);
    if (url.endsWith("/.well-known/jwks.json")) return Response.json({ keys: [jwk] });
    const bearer = new Headers(init.headers).get("authorization")?.slice(7);
    let claims;
    try {
      claims = (await jwtVerify(bearer, keys.publicKey, { issuer, audience: "authenticated" }))
        .payload;
    } catch {
      return Response.json({ error: "invalid_token" }, { status: 401 });
    }
    authRequests.push({ url, method: init.method ?? "GET" });
    if (url.endsWith("/user"))
      return Response.json({
        id: claims.sub,
        email: `${claims.sub}@example.invalid`,
        email_confirmed_at: confirmed ? "2026-01-01T00:00:00Z" : null,
        app_metadata: { provider: "email" },
      });
    if (url.includes("/user/oauth/grants")) {
      const clientId = new URL(url).searchParams.get("client_id");
      if (init.method === "DELETE") {
        if (failProviderReset) return new Response(null, { status: 503 });
        rememberedGrants.delete(`${claims.sub}:${clientId}`);
        return new Response(null, { status: 204 });
      }
      return Response.json([...rememberedGrants.values()].filter((g) => g.subject === claims.sub));
    }
    const match = new URL(url).pathname.match(/\/oauth\/authorizations\/([^/]+)(\/consent)?$/);
    const details = match && authorizations.get(match[1]);
    if (details?.redirect_url && !match[2])
      return Response.json({ redirect_url: details.redirect_url });
    if (!details || details.user.id !== claims.sub)
      return Response.json({ error: "invalid_request" }, { status: 400 });
    if (!match[2]) {
      if (rememberedGrants.has(`${claims.sub}:${details.client.id}`))
        return Response.json({ redirect_url: `${details.redirect_uri}?code=remembered` });
      return Response.json(details);
    }
    const action = JSON.parse(init.body).action;
    if (action === "approve")
      rememberedGrants.set(`${claims.sub}:${details.client.id}`, {
        subject: claims.sub,
        client: details.client,
        scopes: details.scope.split(" "),
        granted_at: new Date().toISOString(),
      });
    if (onConsent) await onConsent(action);
    authorizations.delete(match[1]);
    return Response.json({
      redirect_url: `${details.redirect_uri}?${action === "approve" ? "code=fixture-code" : "error=access_denied"}&state=fixture-state`,
    });
  };
  const raw = await h.vite.ssrLoadModule("/src/lib/assistant.server.ts");
  const { requestHandler } = await import("@tanstack/react-start/server");
  const inMemberRequest = async (fn) => {
    if (cookieUser) {
      h.sqlite
        .prepare(
          "insert or replace into sessions (id, user_id, expires_at, created_at) values (?, ?, ?, datetime('now'))",
        )
        .run(
          createHash("sha256").update(cookieUser).digest("hex"),
          cookieUser,
          new Date(Date.now() + 60_000).toISOString(),
        );
    }
    let value, failure;
    const handler = requestHandler(async () => {
      try {
        value = await fn();
      } catch (error) {
        failure = error;
      }
      return Response.json({ ok: !failure });
    });
    await handler(
      new Request("https://pattern.example/oauth/consent", {
        headers: cookieUser ? { cookie: `pattern_session=${cookieUser}` } : {},
      }),
    );
    if (failure) throw failure;
    return value;
  };
  api = {
    ...raw,
    getAuthorization: (...args) => inMemberRequest(() => raw.getAuthorization(...args)),
    decideAuthorization: (...args) => inMemberRequest(() => raw.decideAuthorization(...args)),
  };
  direct = await token();
  delegated = await token("identity-a", { client_id: "client-a" });
});
beforeEach(async () => {
  await h.reset();
  confirmed = true;
  onConsent = null;
  authRequests = [];
  authorizations.clear();
  rememberedGrants.clear();
  failProviderReset = false;
  cookieUser = h.userA;
});
after(async () => {
  await h?.close();
  for (const [k, v] of Object.entries(oldEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test("delegated tokens cannot authenticate grant management", async () => {
  await assert.rejects(api.verifyAssistantIdentity(delegated), /direct|delegated|assistant token/i);
});
test("direct identity verification rejects expired, forged, anonymous and unconfirmed accounts", async () => {
  confirmed = false;
  await assert.rejects(api.verifyAssistantIdentity(direct), /confirm/i);
  confirmed = true;
  await assert.rejects(
    api.verifyAssistantIdentity(await token("identity-a", { is_anonymous: true })),
    /sign.in|anonymous|account/i,
  );
  const expired = await new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "ES256", kid: "fixture-key", typ: "JWT" })
    .setSubject("identity-a")
    .setIssuer(issuer)
    .setAudience("authenticated")
    .setExpirationTime(1)
    .sign(keys.privateKey);
  await assert.rejects(api.verifyAssistantIdentity(expired));
  const other = await generateKeyPair("ES256");
  await assert.rejects(
    api.verifyAssistantIdentity(await token("identity-a", {}, other.privateKey)),
  );
});
test("link ownership is unique and preserves the existing encrypted profile", async () => {
  const db = h.records();
  await h.app.getDek(db, h.userA);
  const before = h.sqlite.prepare("select * from profiles where id = ?").get(h.userA);
  await api.linkIdentity(h.userA, direct);
  await api.linkIdentity(h.userA, direct);
  await assert.rejects(api.linkIdentity(h.userB, direct), /another|already/i);
  await assert.rejects(api.linkIdentity(h.userA, await token("identity-b")), /already/i);
  assert.deepEqual(h.sqlite.prepare("select * from profiles where id = ?").get(h.userA), before);
});
test("consent approves only the linked member and server-resolved client with selected areas", async () => {
  await api.linkIdentity(h.userA, direct);
  const result = await api.decideAuthorization(direct, request(), ["today"], "approve");
  assert.match(result.redirectUrl, /code=fixture-code/);
  const claims = { iss: issuer, sub: "identity-a", client_id: "client-a" };
  assert.deepEqual(await api.resolveAssistantCaller(claims, "today"), { userId: h.userA });
  assert.ok((await api.resolveAssistantCaller(claims, "journal")).error);
  assert.ok((await api.resolveAssistantCaller({ ...claims, sub: "identity-b" }, "today")).error);
  assert.ok(
    (await api.resolveAssistantCaller({ ...claims, client_id: "client-b" }, "today")).error,
  );
  assert.ok((await api.resolveAssistantCaller({ iss: issuer, sub: "identity-a" }, "today")).error);
});
test("revocation stops an unexpired token and that token cannot restore or expand access", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  await api.revokeGrant(h.userA, "client-a", direct);
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
  await assert.rejects(
    api.decideAuthorization(delegated, request("request-b"), ["today", "journal"], "approve"),
    /direct|delegated|assistant token/i,
  );
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "journal",
      )
    ).error,
  );
  assert.ok(
    authRequests.some((r) => r.method === "DELETE" && r.url.includes("/user/oauth/grants")),
  );
});
test("deny, unlinked accounts, expired IDs and another user's authorization never create a grant", async () => {
  await assert.rejects(api.decideAuthorization(direct, request(), ["today"], "approve"), /link/i);
  await api.linkIdentity(h.userA, direct);
  assert.match(
    (await api.decideAuthorization(direct, request("deny"), [], "deny")).redirectUrl,
    /access_denied/,
  );
  await assert.rejects(api.decideAuthorization(direct, "expired", ["today"], "approve"));
  await assert.rejects(
    api.decideAuthorization(direct, request("foreign", "identity-b"), ["today"], "approve"),
  );
  assert.equal(h.sqlite.prepare("select count(*) as n from assistant_grants").get().n, 0);
});
test("unlink and relink never resurrect old client grants", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today", "journal"], "approve");
  await api.unlinkIdentity(h.userA);
  await api.linkIdentity(h.userA, direct);
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "journal",
      )
    ).error,
  );
});
test("unlink or revocation racing an approval wins over the in-flight approval", async () => {
  for (const action of ["unlink", "revoke"]) {
    await h.reset();
    rememberedGrants.clear();
    await api.linkIdentity(h.userA, direct);
    onConsent = () =>
      action === "unlink" ? api.unlinkIdentity(h.userA) : api.revokeGrant(h.userA, "client-a");
    await assert.rejects(
      api.decideAuthorization(direct, request(action), ["today"], "approve"),
      /changed|revoked|unlinked/i,
    );
    assert.ok(
      (
        await api.resolveAssistantCaller(
          { iss: issuer, sub: "identity-a", client_id: "client-a" },
          "today",
        )
      ).error,
    );
  }
});
test("a failed provider consent never leaves an active local grant", async () => {
  await api.linkIdentity(h.userA, direct);
  onConsent = () => {
    throw new Error("Fixture provider unavailable");
  };
  await assert.rejects(api.decideAuthorization(direct, request(), ["today"], "approve"));
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
});

test("real MCP transport enforces signed tokens, per-client scopes, strict arguments and immediate revocation", async () => {
  const { createMcpProtocolHandler } = await import("@lovable.dev/mcp-js/protocols/mcp");
  const { default: mcp } = await h.vite.ssrLoadModule("/src/lib/mcp/index.ts");
  const handle = createMcpProtocolHandler(mcp, { resourcePath: "/mcp" });
  const call = async (bearer, method, params = {}) => {
    const response = await handle(
      new Request("https://pattern.example/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }),
    );
    const raw = await response.text();
    const json = raw.startsWith("event:")
      ? JSON.parse(raw.split("data: ")[1].split("\n")[0])
      : JSON.parse(raw);
    return { status: response.status, json };
  };
  assert.equal((await call(null, "tools/list")).status, 401);
  assert.equal((await call(direct, "tools/list")).status, 401);
  const foreignKey = await generateKeyPair("ES256");
  assert.equal(
    (
      await call(
        await token("identity-a", { client_id: "client-a" }, foreignKey.privateKey),
        "tools/list",
      )
    ).status,
    401,
  );
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  const invoke = (name, args = {}, bearer = delegated) =>
    call(bearer, "tools/call", { name, arguments: args });
  const listing = await call(delegated, "tools/list");
  assert.equal(listing.status, 200, JSON.stringify(listing.json));
  assert.equal(listing.json.result.tools.length, 5);
  const seeded = await h.seedChart(h.records(), h.userA);
  await h
    .records()
    .from("daily_readings")
    .insert({
      user_id: h.userA,
      snapshot_id: seeded.snapshotId,
      reading_date: new Date().toISOString().slice(0, 10),
      headline: "PRIVATE original",
      body_ct: await h.cryptoModule.encryptField(
        seeded.dek,
        "PRIVATE original with check-in context",
      ),
      idempotency_key: "transport-reading",
      language_meta: {
        assistantShare: {
          version: 2,
          reading_ct: await h.cryptoModule.encryptJson(seeded.dek, {
            headline: "Saved reading",
            body: "Consider one manageable step.",
            prompt: null,
          }),
        },
      },
    });
  const result = (await invoke("get_today")).json.result;
  assert.equal(result.structuredContent.status, "available");
  assert.equal(result.structuredContent.reading.body, "Consider one manageable step.");
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|1990-01-01|12\.34567/);
  const initialized = await call(delegated, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "fixture", version: "1" },
  });
  assert.equal(initialized.json.result.serverInfo.name, "pattern");
  for (const overrides of [
    { iss: "https://foreign.example/auth" },
    { aud: "foreign" },
    { exp: 1 },
  ]) {
    const rejected = await new SignJWT({
      role: "authenticated",
      iss: issuer,
      sub: "identity-a",
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 600,
      client_id: "client-a",
      ...overrides,
    })
      .setProtectedHeader({ alg: "ES256", kid: "fixture-key", typ: "JWT" })
      .sign(keys.privateKey);
    assert.equal((await call(rejected, "tools/list")).status, 401);
  }
  assert.equal((await invoke("list_journal_entries")).json.result.isError, true);
  assert.equal((await invoke("get_today", { userId: h.userB })).json.result.isError, true);
  assert.equal(
    (await invoke("get_today", {}, await token("identity-b", { client_id: "client-a" }))).json
      .result.isError,
    true,
  );
  await api.revokeGrant(h.userA, "client-a");
  assert.equal((await invoke("get_today")).json.result.isError, true);
  process.env.PATTERN_ASSISTANTS_ENABLED = "false";
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
  process.env.PATTERN_ASSISTANTS_ENABLED = "true";
});

test("ordinary member and admin access still requires the original cookie, including after linking", async () => {
  const { requestHandler } = await import("@tanstack/react-start/server");
  const auth = await h.vite.ssrLoadModule("/src/lib/auth.server.ts");
  const request = (headers = {}) => new Request("https://pattern.example/", { headers });
  const current = requestHandler(async () => Response.json(await auth.getSessionUser()));
  assert.equal(
    await (await current(request({ authorization: `Bearer ${delegated}` }))).json(),
    null,
  );
  const signup = requestHandler(async () =>
    Response.json(
      await auth.signUpWithPassword("cookie-fixture@example.invalid", "test-password-fixture"),
    ),
  );
  const signedUp = await signup(request());
  const member = await signedUp.json();
  const cookie = signedUp.headers.get("set-cookie").split(";")[0];
  assert.equal((await (await current(request({ cookie }))).json()).isAdmin, false);
  await h.records().from("user_roles").insert({ user_id: member.userId, role: "admin" });
  await api.linkIdentity(member.userId, direct);
  const admin = requestHandler(async () => {
    const session = await auth.getSessionUser();
    return Response.json({
      session,
      admin: session ? await auth.hasRole(session.userId, "admin") : false,
    });
  });
  assert.deepEqual(await (await admin(request({ authorization: `Bearer ${delegated}` }))).json(), {
    session: null,
    admin: false,
  });
  const withCookie = await (
    await admin(request({ cookie, authorization: `Bearer ${delegated}` }))
  ).json();
  assert.equal(withCookie.session.userId, member.userId);
  assert.equal(withCookie.session.isAdmin, true);
  assert.equal(withCookie.admin, true);
  await h.records().from("user_roles").delete().eq("user_id", member.userId);
  assert.equal((await (await current(request({ cookie }))).json()).isAdmin, false);
  const signin = requestHandler(async () =>
    Response.json(
      await auth.signInWithPassword("cookie-fixture@example.invalid", "test-password-fixture"),
    ),
  );
  assert.equal((await (await signin(request())).json()).userId, member.userId);
  const signout = requestHandler(async () => {
    await auth.signOutCurrent();
    return Response.json({ ok: true });
  });
  await signout(request({ cookie }));
  assert.equal(await (await current(request({ cookie }))).json(), null);
});

test("remembered OAuth consent returns without creating or restoring Pattern rights", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  await api.revokeGrant(h.userA, "client-a");
  authorizations.set("remembered", {
    redirect_url: "https://assistant.example/callback?code=remembered&state=fixture-state",
  });
  assert.equal((await api.getAuthorization(direct, "remembered")).kind, "redirect");
  await assert.rejects(
    api.decideAuthorization(direct, "remembered", ["journal"], "approve"),
    /fresh consent/,
  );
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
  authorizations.set("unsafe", { redirect_url: "javascript:alert(1)" });
  await assert.rejects(api.getAuthorization(direct, "unsafe"), /redirect/);
});

test("deleting member data removes assistant access as well as private records", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  await h.app.eraseEverything(h.records(), h.userA);
  assert.equal((await api.assistantAccess(h.userA)).link, null);
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
});

test("approval and expansion require the matching Pattern cookie as well as the direct identity", async () => {
  await api.linkIdentity(h.userA, direct);
  for (const member of [null, h.userB]) {
    cookieUser = member;
    const id = request(`no-matching-cookie-${member}`);
    const details = await api.getAuthorization(direct, id);
    await assert.rejects(
      api.decideAuthorization(direct, id, ["journal"], "approve"),
      /Pattern|sign.in/i,
    );
    assert.equal(details.memberMatches, false);
    assert.equal(h.sqlite.prepare("select count(*) as n from assistant_grants").get().n, 0);
  }
  cookieUser = null;
  assert.match(
    (await api.decideAuthorization(direct, request("denied-without-cookie"), [], "deny"))
      .redirectUrl,
    /access_denied/,
  );
  cookieUser = h.userA;
  assert.equal(
    (await api.getAuthorization(direct, request("matching-cookie"))).memberMatches,
    true,
  );
  await api.decideAuthorization(direct, "matching-cookie", ["today"], "approve");
});

test("consent discloses provider identity scopes and refuses undisclosed permissions", async () => {
  await api.linkIdentity(h.userA, direct);
  const id = request("identity-scopes");
  authorizations.get(id).scope = "openid email profile phone";
  assert.deepEqual((await api.getAuthorization(direct, id)).identityScopes, [
    "openid",
    "email",
    "profile",
    "phone",
  ]);
  authorizations.get(id).scope = "email future_permission";
  const details = await api.getAuthorization(direct, id);
  assert.deepEqual(details.unsupportedScopes, ["future_permission"]);
  await assert.rejects(
    api.decideAuthorization(direct, id, ["today"], "approve"),
    /unsupported|permission/i,
  );
  assert.equal(h.sqlite.prepare("select count(*) as n from assistant_grants").get().n, 0);
  assert.match(
    (await api.decideAuthorization(direct, id, [], "deny")).redirectUrl,
    /access_denied/,
  );
});

test("the live provider's offline_access scope is disclosed and can be approved", async () => {
  await api.linkIdentity(h.userA, direct);
  const id = request("refresh-access");
  authorizations.get(id).scope = "openid email offline_access";
  const details = await api.getAuthorization(direct, id);
  assert.deepEqual(details.identityScopes, ["openid", "email", "offline_access"]);
  assert.deepEqual(details.unsupportedScopes, []);
  await api.decideAuthorization(direct, id, ["today"], "approve");
  assert.deepEqual(
    await api.resolveAssistantCaller(
      { iss: issuer, sub: "identity-a", client_id: "client-a" },
      "today",
    ),
    { userId: h.userA },
  );
});

test("remembered provider approvals can be reset after unlinking without the assistant login", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  await api.unlinkIdentity(h.userA);
  await api.linkIdentity(h.userA, direct);
  assert.equal((await api.getAuthorization(direct, request("stranded"))).kind, "redirect");
  const grants = await api.listRememberedGrants(h.userA, direct);
  assert.deepEqual(grants, [{ clientId: "client-a", clientName: "Test assistant" }]);
  await api.resetRememberedGrant(h.userA, "client-a", direct);
  assert.deepEqual(await api.listRememberedGrants(h.userA, direct), []);
  assert.equal((await api.getAuthorization(direct, request("reconnected"))).kind, "consent");
  await api.decideAuthorization(direct, "reconnected", ["pattern"], "approve");
  const claims = { iss: issuer, sub: "identity-a", client_id: "client-a" };
  assert.deepEqual(await api.resolveAssistantCaller(claims, "pattern"), { userId: h.userA });
  assert.ok((await api.resolveAssistantCaller(claims, "today")).error);
});

test("remembered approval reset requires both accounts and provider failures leave access stopped and retryable", async () => {
  await api.linkIdentity(h.userA, direct);
  await api.decideAuthorization(direct, request(), ["today"], "approve");
  await assert.rejects(api.listRememberedGrants(h.userB, direct), /linked|match/i);
  await assert.rejects(api.listRememberedGrants(h.userA, delegated), /direct|delegated/i);
  await assert.rejects(
    api.resetRememberedGrant(h.userA, "client-a", await token("identity-b")),
    /linked|match/i,
  );
  failProviderReset = true;
  await assert.rejects(api.resetRememberedGrant(h.userA, "client-a", direct), /try|again|expired/i);
  assert.ok(
    (
      await api.resolveAssistantCaller(
        { iss: issuer, sub: "identity-a", client_id: "client-a" },
        "today",
      )
    ).error,
  );
  assert.equal((await api.listRememberedGrants(h.userA, direct)).length, 1);
  failProviderReset = false;
  await api.resetRememberedGrant(h.userA, "client-a", direct);
  assert.deepEqual(await api.listRememberedGrants(h.userA, direct), []);
});
