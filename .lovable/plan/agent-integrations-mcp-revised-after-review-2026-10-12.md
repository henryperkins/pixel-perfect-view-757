# Agent integrations (MCP), revised after review

Implementation and release procedure: [docs/assistant-integrations.md](../../docs/assistant-integrations.md).
The code is implemented on `feat/assistant-mcp`; production migration, publication and live qualification remain pending.

## What changes from the approved plan

- No full sign-in migration. Members keep their current Pattern sign-in. Connecting an assistant is opt-in: a member links a built-in-accounts identity to their Pattern account from inside Pattern while signed in.
- Assistant access is kept separate from normal app access. An assistant's token never works on any page or action in the app itself, admin actions included.
- Tools read saved results only. They never write a reading, recalculate a chart or start a new AI run.
- Each member chooses what an assistant can see. They can revoke access at any time, and access stops on the assistant's next call.

## Step 1: Opt-in account link

- A "Connected assistants" page (signed in) lets a member link an assistant identity. The member must already be signed in to Pattern (proof of the existing account). The new identity must have a confirmed email (including confirmed Google identities). Emails are never matched automatically.
- Each link connects exactly one Pattern account to one identity. Links are created on the server only and can't be created twice or overwritten in a race. After linking, the account is looked up by the identity's issuer and ID, never by email.
- Recovery: unlinking is available from the same page. If the member has lost the identity, unlinking from Pattern removes all assistant access.

## Step 2: Consent, grants and revocation

- Consent page at the standard path. If the visitor isn't signed in to the assistant identity, they're sent to sign in and brought back. If the identity isn't linked to a Pattern account yet, the page explains how to link it and denies the request.
- Approval requires the existing Pattern cookie to match the linked member as well as the verified direct assistant login. The consent page discloses the provider identity permissions separately and refuses unsupported permissions.
- Remembered approvals can be cleared from Connected assistants after signing in to both linked accounts, including after unlinking has removed local records. Clearing stops local access first and reports provider cleanup failures for retry. Reconnect to choose new areas.
- Grant scopes chosen per assistant: Today and timing (default on), Pattern chapters (default on), Journal (off by default, with its own explanation).
- Every tool call checks for a current, unrevoked grant for that member and assistant. Revoking marks the grant revoked and advances the link revision, so the next call fails even if the assistant's token hasn't expired yet.
- The Privacy page gains a short section on what assistants can see, and states that journal text is shared only when the member turns it on.

## Step 3: Read-only tools with fixed output shapes

- `get_today`: today's saved reading (headline, reading text, reflection prompt, confidence), timing windows and notices. If nothing is saved for today, or the reading predates clean separation of wellness bands, the status is "unavailable" and nothing is generated. Version 1 flags are never enough to share a reading.
- `get_pattern`: chart summary (placements, rising sign, chapter list) from the saved chart only. No birth date, time, place or coordinates.
- `get_chapter`: a saved chapter essay, only if it matches the current chart and essay version and its reflection question passes the existing check. Otherwise "unavailable".
- `list_timing_windows`: saved cycles with phases and dates.
- `list_journal_entries`: only with the Journal grant. Titles, dates, domains and body text, with a clear note that this is the member's own writing.
- Sleep and stress bands are never returned. Reading text is checked for wellness band phrases and withheld when they appear. Check-in values are omitted from every field.

## Technical details

- Identity: new D1 table `identity_links(user_id UNIQUE, issuer, subject, linked_at, UNIQUE(issuer, subject))`, written by a server function that requires the existing D1 cookie session plus a verified Supabase access token (`email_confirmed_at` set or Google provider). Insert-only with uniqueness constraints; a conflict returns a clear error.
- Grants use pending/active/revoked state, bind to the current link ID, and activate only after a matching Pattern cookie, auth-server consent and a link-revision check. The browser cannot supply the authoritative member or client identity.
- Grants: D1 table `assistant_grants(user_id, client_id, scopes, created_at, revoked_at, UNIQUE(user_id, client_id))`, written on consent approval. Revocation also attempts Supabase OAuth grant cleanup when a matching direct login is available; handlers re-check the D1 grant on every call.
- Isolation: `requireAuth` and every existing server function stay cookie-only. MCP handlers resolve the user only through `ctx` claims (`iss`, `sub`, `client_id`) and then `identity_links`. A guard test asserts that a bearer token is ignored by app server functions.
- MCP: `@lovable.dev/mcp-js`, `mcpPlugin()` at `/mcp`, `auth.oauth.issuer({ issuer: https://<ref>.supabase.co/auth/v1, acceptedAudiences: "authenticated" })`, `requireOAuthClientClaim: true`, no `requiredScopes`, metrics disabled. The OAuth server is activated with dynamic client registration. Read-only preflight found an ES256 public signing key. No live signing settings were changed.
- Dedicated readers in `src/lib/mcp/readers.server.ts`: select-only D1 queries with explicit zod output schemas. No calls to `getToday` / `getPattern` / `getFeatureNarrative` or journal retention.
- Wellness separation: new readings store an encrypted chart-only copy in assistantShare version 2. Any reading framed by wellness or check-in bands is withheld, as are legacy readings. Normal member reading text is unchanged.
- Built-in email/password and Google are enabled only for assistant identities. Pattern sign-in is unchanged.

## Acceptance tests

- A delegated token is rejected by ordinary endpoints, including for admins.
- Link collisions: the same identity linked twice, two accounts racing, and relinking after unlink.
- Encrypted data is unchanged after linking.
- Private values are absent from nested fields and from prose (sleep/stress, birth data).
- No generation or database writes during tool calls (write counter on the harness).
- Revocation with an unexpired token stops access.
- Missing/wrong Pattern cookies cannot approve or expand grants; identity scopes are disclosed and unknown scopes refused.
- Remembered provider approvals can be reset after unlinking without the assistant login; provider cleanup failures keep access stopped and permit retry.
- End to end: link, then consent, then a tool call, plus the deny path and missing or expired authorization IDs.

## Rollback

- Assistant access can be turned off without touching member sign-in: set `PATTERN_ASSISTANTS_ENABLED=false`; preserve the link and grant tables. Member data and encryption are untouched throughout.

Local verification: 555 passed, 2 existing skips, 0 failed; TypeScript, production build, manifest extraction and changed-file lint passed. One whole-branch review and Firefox desktop/WebKit mobile fixture checks are complete. The live provider/client flow remains a publication gate; see the runbook for evidence boundaries.
