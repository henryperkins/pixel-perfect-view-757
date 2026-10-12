# Assistant connections

Pattern keeps its existing password and HttpOnly cookie sign-in. Assistant accounts are an optional, separate Supabase identity. Member records and data encryption keys are not migrated.

The implementation is on `feat/assistant-mcp`, based on `f62ef72` in the isolated worktree `.worktrees/assistant-mcp-20261012`. Publication is paused. The endpoint is disabled unless the server environment has `PATTERN_ASSISTANTS_ENABLED=true`.

## Access contract

- `/assistants` requires the Pattern member cookie. Linking additionally requires an asymmetrically signed, confirmed, direct Supabase login. Identity is matched by canonical issuer and subject, never email. Delegated tokens cannot link, approve, or restore grants. Approval also requires the existing Pattern cookie to match the linked member, independently of the assistant identity provider.
- `/assistant-auth` provides email/password, confirmation, password recovery and Google sign-in for assistant identities. Only `/assistants` and a validated `/oauth/consent?authorization_id=...` can be return destinations.
- `/oauth/consent` reads the client and subject from the auth server's authorization request. The browser submits the authorization ID and selected areas, never an authoritative client ID or member ID. Journal is off by default. The page discloses requested provider identity permissions (`openid`, `email`, `profile`, `phone`) separately from Pattern areas; unknown provider permissions cannot be approved. Sign-in tokens can themselves include account identity information, so this is disclosed even when only `email` is requested. See the [Supabase scope contract](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows#available-scopes).
- Grants are bound to the current identity link and client. A pending grant becomes active only after provider approval and a final link-revision check. Revocation and unlinking defeat in-flight approvals. Every tool checks current permission before reading and again before releasing data.
- Revocation is immediate in D1. Provider grant cleanup is also attempted when the member has a matching direct assistant login; losing that login never prevents local revocation. Unlinking removes all local grants atomically. Personal-data erasure also unlinks assistants.
- Remembered OAuth approvals may return a provider redirect instead of new consent details. That path changes no Pattern permissions. To add areas or recover after local-only revocation or unlinking, sign in to both linked accounts and use **Clear remembered approval** on Connected assistants, then reconnect from the assistant. The server lists provider approvals even when local grant records have been deleted. Clearing stops local reads before provider cleanup; cleanup failures stay visible and can be retried. No token refresh restores local rights. This flow does not depend on `prompt=consent`, which [current Supabase authorization source](https://raw.githubusercontent.com/supabase/auth/master/internal/api/oauthserver/authorize.go) does not implement.

## Saved-only tools

| Tool                   | Area                 | Result                                                                 |
| ---------------------- | -------------------- | ---------------------------------------------------------------------- |
| `get_today`            | Today and timing     | Today's eligible saved reading and saved timing windows                |
| `get_pattern`          | Pattern and chapters | Saved placements, reliable rising sign and chapter keys                |
| `get_chapter`          | Pattern and chapters | Saved current-version essay and validated reflection question          |
| `list_timing_windows`  | Today and timing     | Today's saved cycles, phases and dates                                 |
| `list_journal_entries` | Journal              | Recent written titles, dates, domains and text; default 20, maximum 50 |

Readers issue only SELECTs. They do not create keys, update retention, upgrade charts, calculate ephemerides or call language providers. They query the linked member's records and use explicit output schemas. They never return birth records, coordinates, check-in rows, raw source payloads or diagnostic metadata. Chart information itself remains personal data and permits inference.

New member readings save an encrypted `assistantShare` version 2 copy containing only chart prose, headline and prompt. A reading framed by wellness/check-in bands is ineligible. A second text check is conservative and can withhold harmless uses of words such as “energy.” Old version 1 flags and missing/corrupt envelopes are never treated as safe. Existing member readings and caches remain intact; unavailable assistant content is prepared by opening Pattern normally, not by a tool call.

Journal text is intentionally shared only with its separate permission. Members can write birth or health information in their own entries; this is explained in consent and Privacy. No promise is made to remove every sensitive fact from user-authored text. Revocation stops future reads and cannot recall copies an assistant already received.

Timezone inputs are used only when the member's existing DEV-01 source permission is on; otherwise Today and timing use UTC. No timezone is inferred from a birth record. Saved phases and dates are not silently refreshed.

## Configuration and publication order

1. Keep `PATTERN_ASSISTANTS_ENABLED` absent or `false` while preparing the release. Take a D1 backup and inspect the current assistant-table definitions before applying the migration. Do not replace the member database with `schema.sql`.
2. Existing installations: apply `d1/migrations/20261012_assistant_access.sql` once to the `pattern-records` database using the existing workflow Worker configuration. It creates missing link tables, adds the revision field, replaces **only** the untested assistant-grant table, and requires fresh consent for legacy assistant permissions. It preserves identity links, member accounts, sessions, encryption keys and content. New empty databases can use `d1/schema.sql`; do not then apply the upgrade migration a second time.
3. Configure server `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` (the existing `VITE_` public equivalents are supported). The JWT issuer must be the direct project issuer `https://<ref>.supabase.co/auth/v1`, even if API traffic uses a Lovable proxy. Existing `PATTERN_ROOT_KEY` and records-plane credentials stay unchanged.
4. In Supabase/Lovable, verify the OAuth server and public client registration are enabled, the authorization UI is the deployed `/oauth/consent`, and Google, confirmed email sign-in and recovery redirects are configured for the deployed `/assistant-auth` callback and its validated query parameters. Use authorization-code flow with PKCE. Verify the production site's proxy overwrites forwarded host/protocol headers; the generated Lovable routes trust that proxy.
5. Publish through the existing connected-project deployment configuration. The isolated worktree build auto-generates a Worker name containing the worktree path; do **not** deploy its generated `.output/server/wrangler.json` as the production configuration. Publish the reviewed build with the migration already applied. Enable the endpoint for the qualification environment, then run the live acceptance flow below. Enable production access only after it succeeds. Publishing is a separate, pending action.

An example migration command, after the schema check and backup, is:

```sh
npx wrangler d1 execute pattern-records --remote \
  --config edge/pattern-workflows/wrangler.jsonc \
  --file d1/migrations/20261012_assistant_access.sql
```

Record that this once-only migration was applied. Running it again fails at the duplicate revision column; do not skip that error and continue with the later destructive statement. Do not hand-run individual fragments. The migration intentionally invalidates any old, unverified assistant permissions.

The committed `.lovable/mcp/manifest.json` is generated with `node_modules/.bin/lovable-mcp-extract-manifest`. Vite's `mcpPlugin()` generates `/mcp` and `/.well-known/oauth-protected-resource`. Both HTTP endpoints return 503 while the flag is off. Tool-level checks also deny reads while disabled. Metrics are disabled.

## Verification

Final local verification on 2026-10-12: **555 tests passed, 2 existing skips, 0 failed (557 total)**. TypeScript, production build, manifest extraction, changed-file lint and `git diff --check` passed. Repository-wide lint remains non-green in existing generated integration and skill files; no unrelated formatting changes were made. One fresh whole-branch review was completed. Its remembered-approval recovery and identity-permission disclosure findings, plus the provider trust-boundary concern, were addressed with failing-then-passing regression tests and the full suite. No findings were deferred.

Local commands:

```sh
bun install --frozen-lockfile
npm test
node_modules/.bin/tsc --noEmit
npm run build
node_modules/.bin/lovable-mcp-extract-manifest
node --test tests/assistant-*.test.mjs
```

Security tests use signed ES256 fixture JWTs, the actual MCP HTTP handler, real SQLite queries, and real encryption. They cover the complete local link → consent → saved tool result flow, token rejection, client/user isolation, scoped sharing, revocation, unlink races, deny/expired requests, migration preservation and the unchanged cookie/admin boundary. Additional regressions cover missing/wrong Pattern cookies during approval, unsupported identity scopes, provider cleanup failure/retry, and recovery after unlinking while signed out of the assistant identity. Provider responses are synthetic; no test sends member data or buys model runs.

For rendered browser checks, run `node scripts/assistant-ui-fixture.mjs` and open `http://127.0.0.1:4187/assistants`. This serves the real page components with synthetic auth/records responses and no `.env`. `window.assistantFixture.reset(...)` sets local scenarios. This verifies UI behavior, not live provider configuration. Firefox desktop and WebKit/iPhone 15 checks covered member and assistant sign-in return paths, linking, approval, deny, Journal default-off and explicit selection, empty-area blocking, unlink/revoke, remembered-approval cleanup failure and retry, the matching-member approval gate, expired requests, and mobile layout without horizontal overflow. Identity permissions were inspected in the rendered mobile consent page. Browser screenshots and CLI traces are retained outside the checkout in `/tmp/pattern-assistant-browser-evidence`.

Read-only public preflight on 2026-10-12 confirmed the configured project exposes an ES256/EC JWKS and matching OIDC issuer, authorization, token and registration endpoints. This does not prove registration settings, Google callbacks, email delivery, deployed routes or a real token exchange.

Before production activation, use two controlled test accounts and a real MCP client to verify: normal member login and logout; Google and confirmed-email assistant login; linking and collisions; approve and deny; each allowed tool and Journal default-off; revocation using an unexpired token; unlink while signed out of the assistant identity, relink, clear remembered approval, and reconnect with fresh consent; permission changes and unknown provider scopes; and a saved reading with wellness context. Confirm client callbacks and metadata on the public domain. Keep production disabled until this evidence exists. Supabase OAuth access tokens have the provider’s normal user-data authority; verify no legacy Supabase tables, storage policies or account-management behavior expose Pattern data through those tokens. Pattern D1 records and grant activation remain protected by the separate member cookie and local grants, even if a provider identity is compromised.

## Rollback

Set `PATTERN_ASSISTANTS_ENABLED=false` and redeploy the environment setting. This immediately denies the next tool call and closes discovery without changing member login or destroying links, grants or content. Keep the additive schema in place; do not drop tables or rewrite published Git history. Restore code only through a normal forward commit if necessary.
