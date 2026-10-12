# Agent integrations (MCP), protected with OAuth

## Why this needs a sign-in change first
Assistants sign in through the built-in accounts system. Your app currently runs its own sign-in (its own passwords and session cookies), so an assistant's sign-in can't be matched to a Pattern member. Before the tools can work, member sign-in has to move to the built-in accounts system.

## Step 1 — Move sign-in to built-in accounts
- The sign-in page uses built-in email/password, plus Google sign-in.
- Existing members are linked by email the first time they sign in. Their charts, readings, journal and check-ins stay where they are and stay encrypted.
- Existing passwords can't be carried over. Each existing member resets their password once, or uses Google.
- Admin roles and the privacy rules on every record stay exactly as they are.

## Step 2 — Assistant sign-in and consent
- Turn on the assistant sign-in server.
- Add a consent page where members approve or deny an assistant. If they aren't signed in, they're sent to sign in and brought back to the page afterwards.

## Step 3 — Read-only tools (each one acts as the signed-in member)
- `get_today` — today's reading, timing windows and confidence notices
- `get_pattern` — chart summary and chapter list
- `get_chapter` — one chapter essay, if it's already written (never starts a new AI run)
- `list_timing_windows` — cycles with their phases and dates
- `list_journal_entries` — recent entries

No write tools in the first version. Birth details, coordinates and check-in sleep/stress bands are never returned.

## Technical details
- Supabase auth becomes the identity source. A `profiles.auth_user_id` mapping links each auth user to the existing D1 `userId`, and `requireAuth` resolves the D1 user from a verified Supabase JWT.
- `@lovable.dev/mcp-js` with `mcpPlugin()` at `/mcp`, tools in `src/lib/mcp/`, `auth.oauth.issuer` with the direct project issuer, `requireOAuthClientClaim: true`.
- Tool handlers verify the caller token, map it to a D1 user, and reuse the existing ownership-scoped `pattern.server.ts` reads.
- Tests cover token rejection, cross-user isolation, and deny/approve on the consent page.

## Risks
- Every existing member has to reset their password once.
- This is a large change to authentication. It needs a full sign-in regression check before you publish.
