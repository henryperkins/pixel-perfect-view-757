# Mobile Member Flow Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 12 mobile audit findings while preserving Pattern’s existing reading, check-in, journal, account, and chart behavior.

**Architecture:** Keep the current routes, Shell, Tailwind styles, Button system, and Radix primitives. Add a narrowly scoped member-draft layer above route lifetimes, backed by encrypted browser storage; reconcile saves against immutable submitted snapshots. Fix request races, focus, semantics, and responsive layout in their existing owners, with production and physical-device verification separate from fixtures.

**Tech Stack:** React 19, TanStack Start/Router/Query, TypeScript, Tailwind 4, Radix AlertDialog, native IndexedDB and Web Crypto, existing Node test runner and records harness.

**Spec:** The user’s mobile audit contract and ten-area checklist, made executable by the frozen findings, behavioral decisions, and acceptance criteria in this document. Audit baseline: `e8eee400592848033df1e36d3fef6a123ad9b5c8`, examined on 2026-10-14. Existing project constraints: [AGENTS.md](../../../AGENTS.md). This document is a proposed implementation plan; no remediation or device qualification is claimed complete.

## Global Constraints

- Scope is the main member flow, prioritizing current iOS Safari and Android Chrome. Record exact OS/browser versions during execution; desktop WebKit is Render evidence, not iPhone Device evidence.
- Test portrait widths of 360–440 CSS px, the 320 px reflow width, and landscape. Include toolbar expansion/collapse, both iPhone toolbar placements, safe areas, virtual keyboards, and mixed grips.
- Make the smallest change that resolves each finding, using existing styling tokens and components. Do not redesign navigation, reading hierarchy, or chart presentation.
- Never disable or cap zoom. Preserve visible focus indicators, tap alternatives to gestures, and `prefers-reduced-motion` behavior.
- Add no dependency by default. Radix AlertDialog is already installed. Any proposed package requires its purpose, download/bundle/runtime cost, and maintenance cost to be recorded before addition.
- Keep chart sources, member language-provider selection, consent enforcement, server encryption, and evaluation workflows unchanged. Do not export server encryption keys to the browser or replay a model request to test recovery.
- Preserve unrelated dirty work, including `.env`. Never include secrets or real member text in fixtures, screenshots, logs, reports, or traces.
- Do not rewrite published Git history. Implementation commits, pushes, deployments, account mutations, and paid provider calls are outside the current document-writing authorization.
- Installation/PWA support was unspecified and no service worker or manifest was found. This plan adds neither. Local draft recovery does not promise an offline application shell after a full reload.
- Mark findings **Proposed**, **Implemented**, or **Verified**, naming the evidence scope. Unrun checks stay **Not tested**; unavailable performance numbers stay **not measured**.

## Review Focus

1. A save commits but its response is lost: recover the submitted snapshot without duplicate journal entries or erasing later edits. Tests belong to Tasks 2–4.
2. Logout, account switching, consent changes, and a delayed storage write overlap: prevent disclosure or resurrection of another account’s drafts. Tests belong to Tasks 1 and 3.
3. Two tabs edit, midnight changes the check-in day, or server data changes while a draft is suspended: retain each version and require an explicit reconciliation. Tests belong to Tasks 1, 3, and 4.
4. Place lookups resolve out of order after typing, manual coordinate edits, or unmount: only the current request may change values, errors, or loading state. Tests belong to Task 5.
5. Enlarged text, short landscape, keyboard focus, and an overlay combine: controls remain readable, reachable, and unobscured, with predictable Back and focus return. Tests belong to Tasks 6–10.

---

## Principal journey and evidence boundary

The principal journey is **read Today and save a personal check-in/reflection**. This is inferred from the member scope and interface, not traffic analytics.

1. Open Today as a returning member with a chart.
2. Read the daily reflection and use the Check-in section shortcut.
3. Select mood/energy and any permitted optional bands; write a note.
4. Save and receive a truthful confirmation.
5. Navigate away, return, or reopen the tab without losing unfinished work; optionally expand the reflection into a journal entry.

The audited journey completed at 390×844 in Chromium 155.0.8059.12 and desktop WebKit 26.6 against synthetic services. Failed requests could be retried, and Today already preserved edits made during a slow save. Navigation/Back/reload recovery and the new journal composer failed. Preserve the passing Today reconciliation behavior.

Audit coverage included 320×568, 360×800, 390×844, 440×956, 667×375, and 844×390. No physical phone or OS simulator was used. The 32 px root-font experiment was a text-enlargement stress test, not proof of actual phone 200% zoom. LCP, INP, and CLS were **not measured**. The source landing JPEG was 180,026 bytes; that observation alone does not establish a performance defect.

The original local evidence index is `/tmp/pattern-mobile-audit-20261014/full-audit-evidence.json`. It is supplementary and temporary: preserve sanitized reproductions with Task 10 rather than making completion depend on this path surviving.

## Findings and closure map

Line references describe the audit baseline and will move during implementation. All fixes below are **Proposed**. Unless noted, Code/Render behavior was observed in both desktop engines; iOS Safari and Android Chrome remain the intended device verification targets, in portrait and landscape.

| Priority | Finding and evidence                                                                           | Baseline owner / cause                                                                                                           | Minimal resolution and owner task                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | **F02 — Drafts disappear on navigation, Back, and reload. Code + Render.**                     | `TodayCheckIn.tsx:140`; `journal.tsx:87`: route-local state has no durable recovery.                                             | Root-lifetime state plus encrypted local checkpoints, account/day isolation, restore/discard, and save reconciliation. Tasks 1, 3, 4.                                               |
| P0       | **F01 — Delayed journal save clears newer input. Code + Render.**                              | `journal.tsx:116–141`: unconditional clearing in `onSuccess` despite editable pending fields.                                    | Submit an immutable revision, make the composer read-only while pending, and clear only acknowledged, unchanged data. Task 4, using Task 2.                                         |
| P0       | **F03 — Late birthplace resolution overwrites newer input. Code + Render.**                    | `onboarding.tsx:76`; `birth.tsx:191`: responses are not bound to the current form generation.                                    | Shared request-generation guard, cancellation, current-input validation, and explicit valid manual coordinates. Task 5.                                                             |
| P1       | **F09 — Fixed navigation wholly obscures focused controls. Code + Render.**                    | `styles.css:214,405,2492`: top-only scroll clearance and fixed bottom navigation.                                                | Measure actual fixed surfaces, reserve scroll clearance, and minimally reveal obscured focus. Task 8.                                                                               |
| P1       | **F04 — Journal deletion is immediate and irreversible in the UI. Code + Render.**             | `journal.tsx:399`; `pattern.server.ts:2734`: no confirmation or Undo before hard delete.                                         | Existing Radix confirmation, Cancel-first focus, truthful pending/error states, and focus/Back handling. Task 6.                                                                    |
| P1       | **F05 — Long saved URL breaks reflow. Code + Render.**                                         | `journal.tsx:364,370`; `.journal-entry` at `styles.css:2170`: unbroken content cannot shrink/wrap.                               | Local `min-width: 0` and `overflow-wrap: anywhere`, retaining the full text. Task 9.                                                                                                |
| P1       | **F06 — Onboarding accuracy selection has no accessible state. Code + Render.**                | `onboarding.tsx:136`: selection exists only in styling.                                                                          | Mirror the birth editor’s `aria-pressed` pattern and verify labels/state. Task 7.                                                                                                   |
| P1       | **F12 — Personal input purposes are missing. Code + Render.**                                  | `onboarding.tsx:123`; `birth.tsx:300`; `privacy.tsx:434`.                                                                        | `autocomplete="bday"` for birth date and `autocomplete="nickname"` for display name. Task 7.                                                                                        |
| P2       | **F07 — Small editable text risks iPhone focus zoom. Code + Render; focus zoom Inferred.**     | Auth, birth forms, journal editor, account security, and landscape check-in fields compute to 12–14 px.                          | At least 16 px editable text throughout phone layouts, including landscape. Task 7. Android gets a legibility improvement; do not attribute Safari zoom behavior to Chrome Android. |
| P2       | **F10 — Enlarged text causes overlap/overflow. Code + Render; actual phone scaling Inferred.** | `styles.css:431,549`; `TodayCheckIn.tsx:326`: nowrap labels, nonshrinking summaries, and growing minimum widths.                 | Permit wrapping and shrinking; constrain Save; measure the resulting navigation height. Tasks 8, 9.                                                                                 |
| P2       | **F08 — Sticky Timing surfaces leave only 89 px for content in landscape. Code + Render.**     | `styles.css:1143,405`; `Shell.tsx:243`: 83 px header plus filters ending at y=213, with navigation starting at y=302 at 667×375. | Put Timing filters in normal flow on short phone viewports. Task 8.                                                                                                                 |
| P2       | **F11 — Closing membership confirmation drops focus. Code + Render.**                          | `MembershipSettings.tsx:105,124`: the focused control unmounts without a return target.                                          | Restore Cancel-membership trigger or the section heading after success. Task 6.                                                                                                     |

## Decisions that make recovery complete

These are implementation choices proposed by this plan, not existing product promises.

### Draft scope and lifecycle

- Recover Today check-ins, new journal entries, and unsaved edits to existing journal entries. Do not persist passwords, authentication tokens, security forms, or birth details in this layer.
- Keep draft state under `QueryClientProvider` in `__root.tsx`, above `Outlet`. Today is outside the authenticated route group, so an authenticated-layout-only provider would miss the principal journey.
- Use native IndexedDB database `pattern-member-drafts`, schema version 1. Store a non-extractable AES-GCM key per account and encrypted, versioned draft envelopes. Use a fresh 96-bit IV and bind account, draft ID, kind, entity key, schema, and account generation as authenticated additional data.
- Plaintext envelope metadata is limited to opaque account/draft identifiers, scope/day, revision, timestamps, expiry, and generation. Encrypt note/title/body, bands, attachments, baselines, and pending submission payloads. Never put their plaintext in localStorage, URLs, analytics, or error logs.
- This prevents plaintext draft records on disk; a same-origin script with access to the browser key can still decrypt them. Do not describe this as protection from a compromised origin or a shared unlocked browser profile. Keep the existing server-key boundary intact.
- Proposed expiry is **seven days after the last committed edit**. Explain this near recovery controls and in privacy information. Expired records are not offered for restore and are removed on the next application/storage access; a closed browser cannot run timed deletion. Signing out, deleting the account, and explicit discard also remove records.
- Hydrate only after the current account is verified. Distinguish loading, verified anonymous, authenticated, and session-check failure. A temporary network error must neither delete drafts nor expose a previously stored account’s text on a fresh load.
- Update in-memory state synchronously on each edit and immediately queue an encrypted checkpoint. Serialize writes per draft; retain the latest queued revision. Show “Draft saved on this device” only after the IndexedDB transaction commits. Before then use “Saving draft on this device…”. An operating-system kill before that commit can still lose the uncommitted keystrokes.
- Keep navigation within the app safe through provider state. Flush queued writes on blur/visibility changes as an additional measure, not the only persistence mechanism. Use a leave warning only when changes are not durable; never claim `beforeunload` makes phone discard safe.
- On storage denial, quota failure, or unsupported key persistence, retain the in-memory draft and show “This draft is only kept while this page stays open. Save it to your account or copy it before leaving.” Provide Copy text. Do not silently fall back to plaintext storage or disable account Save.
- Maintain an account-generation fence, per-record revision checks, and per-draft discard tombstones inside storage transactions. Logout invalidates the account generation; discard or acknowledged removal invalidates only the relevant draft before removing its ciphertext. Keep the minimal fence metadata needed to reject outstanding writers, without retaining private content or a purged account key. Multiple tabs use independent draft IDs; a conflicting write to a resumed draft forks a recoverable version instead of overwriting either version. Signal invalidations with BroadcastChannel, with focus/visibility rechecks as the fallback.
- Offer Resume and Discard when returning. If new text already exists, never replace it automatically: show the recoverable version separately, with Copy and an explicit Replace action. Explicit discard asks for confirmation when it would remove unsaved content.
- Bind a check-in draft to its original day and timezone. At midnight, start Today from the new day’s server values and retain the earlier draft under its original date. Offer a dated recovery panel with all entered bands/text and Copy; do not silently transplant it into Today. Preserve journal date overrides and unavailable attachments for review instead of resetting them.
- Remove sleep/stress values from memory and encrypted drafts when their source consent is revoked, while retaining unrelated note/mood/energy edits. Reapply current consent before every restore and submit. Retain the existing server checks and retention policy as the authority.

### Save identity and acknowledgements

- A pending submission is an immutable snapshot: draft ID, local revision, payload, operation ID, and relevant server baseline. Persist it before dispatch when storage is available. A storage failure permits a clearly labeled in-memory save attempt; it does not justify pretending reload recovery is guaranteed.
- New journal creation needs an idempotent operation ID so recovery after an uncertain response does not create duplicate entries. This is an enabling change for safe recovery, not an additional audit finding about an observed duplicate.
- Generate one UUID `clientMutationId` per new-entry submission. Derive its database entry ID from `fingerprint(["journal-create-v1", userId, clientMutationId])`. Use an atomic insert that does nothing on that ID’s conflict, then return the owned canonical row. Never implement replay with an upsert that overwrites existing content. The existing text primary key supports this without a schema migration.
- Add an authenticated read that resolves a `clientMutationId` to the current owned entry, including edits since creation. On unknown outcomes, “Check save” reads first; a retry uses the same operation ID and exact original snapshot. Different content gets a new operation only after the old attempt has been reconciled.
- A replayed operation returns the current canonical entry. Clear a draft only if that acknowledgement covers its submitted content and the current local revision has not changed; otherwise retain the draft and explain the difference. Do not treat the existence of an entry as proof that later text was saved.
- Today’s `(user_id, day)` save and journal editing’s `expectedRevision` already have distinct semantics. Keep them. Re-read canonical data after uncertain responses, preserve divergent local edits, and require an explicit comparison before overwriting a changed server value. Never blindly replay a restored mutation.

## File ownership and implementation order

All paths below are relative to the repository root. “Create” paths are proposed files, not existing artifacts. Keep new helpers focused; no general persistence framework or site-wide auth rewrite is required.

| Task | Files / responsibility                                                                                                                                                                             | Dependencies                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1    | Create `src/lib/member-drafts.ts`, `src/lib/member-draft-store.client.ts`, `tests/member-drafts.test.mjs`; typed recovery policy and encrypted store                                               | None                            |
| 2    | Modify `src/lib/pattern.functions.ts`, `src/lib/pattern.server.ts`; create `tests/journal-create.test.mjs`; idempotent creation and acknowledgement lookup                                         | None                            |
| 3    | Create `src/components/pattern/MemberDraftProvider.tsx`, `src/components/pattern/DraftRecoveryNotice.tsx`; modify root, auth hook, Shell, privacy, account security, Today                         | 1                               |
| 4    | Create `src/lib/journal-submit.ts`, `tests/journal-submit.test.mjs`; modify journal route and `JournalEntryEditor.tsx`; composer/editor recovery                                                   | 1–3                             |
| 5    | Create `src/lib/place-lookup.ts`, `src/hooks/usePlaceLookup.ts`, `tests/place-lookup.test.mjs`; modify onboarding and birth                                                                        | None                            |
| 6    | Create `src/components/pattern/JournalDeleteDialog.tsx`; modify journal and `MembershipSettings.tsx`; confirmation and focus return                                                                | 4 for integrated verification   |
| 7    | Modify auth, onboarding, birth, privacy, `AccountSecurity.tsx`, `JournalEntryEditor.tsx`, `TodayCheckIn.tsx`, `src/styles.css`; form semantics and sizes                                           | 3–5 for integrated verification |
| 8    | Modify `Shell.tsx`, `src/styles.css`, and Timing markup only if a selector is needed; measured fixed-surface clearance and short landscape                                                         | None                            |
| 9    | Modify `src/styles.css`, journal, `TodayCheckIn.tsx`; long content and text enlargement                                                                                                            | 8                               |
| 10   | Create `scripts/mobile-ui-fixture.mjs`, `tests/helpers/mobile-ui/main.tsx`, `services.ts`, `draft-store-cases.ts`, `browser-cases.md`, and completion checklist; verification and release evidence | 1–9                             |

Implement the three P0 paths first: Tasks 1–5. Tasks 6–9 remain small component/style changes. Task 10’s isolated fixture can be introduced during Task 1 to support browser-storage tests, then completed as each task lands. Within an authorized implementation session, use small reviewable commits; never stage unrelated files with `git add .`.

## Task 1: Build durable, account-scoped draft storage

**Files:** Create the three Task 1 files above. Follow existing Vite SSR-loading patterns for Node tests; browser-only IndexedDB checks belong in the isolated Task 10 fixture.

**Interfaces:** Export `DraftKind = "check-in" | "journal-new" | "journal-edit"`, a discriminated `MemberDraft`, and `DraftStore` from `member-drafts.ts`. Each envelope has `schemaVersion: 1`, `ownerId`, `draftId`, `kind`, `entityKey`, `generation`, `revision`, `updatedAt`, `expiresAt`, and typed `values`, `baseline`, and optional `submission`. Check-in values retain mood/energy/sleep/stress/note plus original day/timezone; new-journal values retain occurredOn/domain/label/body/cycleKey/featureKey; edit values retain entry ID/label/body/expectedRevision. Browser storage implements:

```ts
declare function openMemberDraftStore(): Promise<DraftStore>;
interface DraftStore {
  list(ownerId: string): Promise<MemberDraft[]>;
  put(
    draft: MemberDraft,
    expectedRevision: number | null,
  ): Promise<{ status: "stored" } | { status: "conflict" } | { status: "invalidated" }>;
  discard(ownerId: string, draftId: string): Promise<void>;
  purgeOwner(ownerId: string): Promise<void>;
  close(): void;
}
```

`put` checks account generation and expected revision in the transaction that writes ciphertext. Account generation/key initialization is atomic; a late caller cannot recreate an invalidated generation. Decryption/validation failure quarantines that record from restore and displays a recoverability error without exposing its raw contents.

- [ ] Write policy tests for seven-day expiry, schema rejection, original-day separation, consent filtering, snapshot immutability, revision comparison, and a server acknowledgement that arrives after a newer local revision.
- [ ] Run `node --test tests/member-drafts.test.mjs`; confirm each new behavior is initially absent before implementing the model and pure policy helpers.
- [ ] Implement the IndexedDB stores for account keys/generations and encrypted envelopes. Encrypt outside the transaction, then check fences/revisions and commit atomically. No long debounce, synchronous storage write, or crypto inside a rendering loop.
- [ ] Add real-browser store cases: write/reload/restore; two simultaneous writers; cross-account lookup; corrupted ciphertext; expiry; quota/blocked storage; purge or discard while encryption is paused; and unsupported CryptoKey cloning. Assert discarding one draft leaves other drafts intact, and stored note/title sentinels never appear as plaintext values in either storage API.
- [ ] Run those cases in Chromium and WebKit using the fixture. Expected: only committed drafts restore, conflicts preserve both variants, purged generations cannot return, and unsupported persistence presents the explicit in-memory fallback.
- [ ] Run the Node tests again and record actual results. Record a device storage test as pending until Task 10; desktop persistence is not evidence of Safari private-mode behavior.

## Task 2: Make new journal submissions safe to reconcile

**Files:** Modify `src/lib/pattern.functions.ts` and `src/lib/pattern.server.ts`; create `tests/journal-create.test.mjs`. Reuse `tests/helpers/records-harness.mjs`, existing encryption helpers, and the parameterized D1 executor. No `d1/schema.sql` change is planned.

**Interfaces:** Add optional validated UUID `clientMutationId` to `addEvent`. Extend the existing `addLifeEvent` signature with a final optional argument of that name, retaining legacy callers. Return `{ ok: true, id, entry, replayed }`, where `entry` is the same owned, decrypted journal-entry shape used by `listJournal`. Export `fetchJournalSubmission` as an authenticated read with input `{ clientMutationId: string }` and response `{ state: "missing" } | { state: "saved", entry }`. Its server owner is `resolveLifeEventSubmission(db, userId, clientMutationId)`.

- [ ] Write records-harness tests for concurrent identical creates, a committed insert with a lost response, retries after process restart, and two users using the same operation ID. Assert one owned row per user/operation and identical IDs on replay.
- [ ] Add a replay test with different submitted text and a replay after the entry has been edited. Neither may overwrite the row; the response must expose the canonical current content for client reconciliation. Test lookup beyond the journal list’s recent-entry limit.
- [ ] Run `node --test tests/journal-create.test.mjs` and confirm the new contract fails before implementation.
- [ ] Implement the owner-scoped deterministic ID and atomic `INSERT ... ON CONFLICT(id) DO NOTHING`, with encrypted fields and parameterized values. Read back by both ID and owner. Preserve ordinary creation for existing callers without an operation ID.
- [ ] Implement authenticated resolution with UUID validation and owner scoping. Invalid inputs fail before database calls; errors expose no ciphertext or private text.
- [ ] Run `node --test tests/journal-create.test.mjs tests/journal-edit.test.mjs`. Expected: retries create no duplicates, existing edit CAS/ownership checks still pass, and database records contain encrypted private fields.

## Task 3: Wire recovery into Today and account lifecycle

**Files:** Create `MemberDraftProvider.tsx` and `DraftRecoveryNotice.tsx`. Modify `src/routes/__root.tsx`, `src/hooks/useAuth.ts`, `src/components/pattern/TodayCheckIn.tsx`, `Shell.tsx`, `AccountSecurity.tsx`, and `src/routes/_authenticated/privacy.tsx`. Extend `tests/member-drafts.test.mjs` and Task 10 browser cases.

**Interfaces:** Extend `useAuth()` without removing its current return fields: add `status: "loading" | "authenticated" | "anonymous" | "unavailable"`; only a successful session response establishes authenticated/anonymous. `MemberDraftProvider` owns a verified account and store, and exports:

```ts
useMemberDraft({ kind, entityKey, initialValues, baseline });
// => { draft, recoveryCandidates, durability, update, resume, discard,
//      checkpointSubmission, reconcileAcknowledgement, flush }
useMemberDraftLifecycle();
// => { purgeAccountDrafts, invalidateConsentFields }
```

Keep these typed by draft kind. `durability` distinguishes pending, stored, unavailable, and error; it is separate from account-save status. Provider session checks use a deduplicated query, refresh on identity/navigation/focus changes, and never rehydrate a different owner into a mounted draft. An existing verified, loaded tab can continue editing during network failure; a fresh load must verify identity before revealing durable records.

- [ ] Write recovery cases for Today navigation/Back/reload, delayed server acknowledgement with continued typing, server changes while a draft is suspended, midnight/timezone changes, and sleep/stress consent revocation. Preserve the existing `reconcileCheckIn` behavior instead of replacing it with unconditional hydration.
- [ ] Mount the provider under `QueryClientProvider` above `Outlet`; bind check-in edits to its synchronous state and queued durable revisions. Extract only the existing check-in types/pure reconciliation needed for shared tests.
- [ ] Implement the status/Resume/Discard/Copy UI using existing Buttons and a restrained live region. Announce meaningful state transitions, not every keystroke. A saved-on-device message must never stand in for the existing account-save acknowledgement.
- [ ] On restored pending check-ins, fetch canonical data before offering retry. Clear an exactly acknowledged snapshot, retain subsequent edits, and offer a comparison when the saved value diverges. Keep the original day visible on older drafts; provide access to every field through the dated recovery panel.
- [ ] Wire both Shell sign-out controls, successful password-change logout, and successful account deletion to invalidate writes, clear plaintext state, and purge account drafts before redirect. Purge failures must not prevent server logout; clear in-memory data and surface the local-cleanup failure without claiming deletion succeeded. Test retrying cleanup on the next accessible page.
- [ ] Wire privacy/consent changes to remove revoked optional fields from all relevant draft versions. Add a small “Drafts on this device” privacy section with the retention explanation and an explicit clear action. Do not erase unrelated journal work when personalization is reset.
- [ ] Test account A → logout → account B, network failure during auth refresh, session expiry, stale tab resume, and account purge while a checkpoint is in flight. Expected: no cross-account text flash and no resurrection. Confirm passwords/tokens never enter the draft store.
- [ ] Run `node --test tests/member-drafts.test.mjs tests/check-in.test.mjs` and the Today/lifecycle browser cases. Account-save failures must retain drafts; consent and retention tests must remain green.

## Task 4: Protect journal creation and editing from input loss

**Files:** Modify `src/routes/_authenticated/journal.tsx` and `src/components/pattern/JournalEntryEditor.tsx`. Create `src/lib/journal-submit.ts` and `tests/journal-submit.test.mjs` for immutable submission/reconciliation policy. Extend the Task 10 fixture.

**Interfaces:** `createJournalSubmission(draft, clientMutationId)` produces a frozen `{ draftId, revision, clientMutationId, payload }`. `reconcileJournalSubmission(currentDraft, submission, canonicalEntry)` returns `{ kind: "acknowledged" | "newer-local-edits" | "different-server-value", draft }`. Components consume Task 3’s hook and Task 2’s save-resolution endpoint.

- [ ] Write tests reproducing the 1.8-second save race: submit revision N, inject revision N+1 before acknowledgement, and assert N+1 survives. Add response-loss/reload/reconcile, trimmed text comparison, failed save, unavailable chapter, stale editor revision, and account-switch cases.
- [ ] Run `node --test tests/journal-submit.test.mjs`; then implement the snapshot and acknowledgement helpers. Compare normalized submitted fields with canonical fields; never compare a mutable closure to itself.
- [ ] Bind the new-entry form’s full state to a `journal-new` draft. While a save is pending, use `readOnly` for editable text and disable selectors/duplicate submit; keep text selectable. Capture the submission once, checkpoint it, then dispatch. Clear only the acknowledged revision; retain date/domain/attachment defaults according to the existing composer behavior.
- [ ] Replace unconditional `setLabel("")`/`setBody("")` with reconciliation. Retain immutable pending attempts after uncertain failures. “Check save” uses the resolution endpoint; explicit retry reuses the original ID/payload. If the user edited after failure, keep those edits separate from the unresolved attempt and never label them saved by its acknowledgement.
- [ ] Bind editor changes to `journal-edit` drafts keyed by entry ID and expected server revision. Reopening or reloading offers recovery; cancellation closes the editor without discarding its draft. Give explicit Discard a clear confirmation. Preserve the existing server conflict comparison and read-only pending editor behavior.
- [ ] After edit response loss, refetch the owned entry. If the expected update is already present, acknowledge it; if another revision differs, retain both versions and use the existing comparison flow. Do not force-overwrite or reissue blindly.
- [ ] Verify chapter links/refetches do not reset active drafts. If an attachment is no longer available, preserve its original label/key in recovery and require the existing explicit replacement/removal before Save.
- [ ] Run `node --test tests/journal-submit.test.mjs tests/journal-create.test.mjs tests/journal-edit.test.mjs tests/member-drafts.test.mjs` and the browser cases. Expected: one creation per operation, no cleared newer input, and unchanged ownership/CAS protections.

## Task 5: Reject stale birthplace lookups

**Files:** Create `src/lib/place-lookup.ts`, `src/hooks/usePlaceLookup.ts`, and `tests/place-lookup.test.mjs`; modify `src/routes/_authenticated/onboarding.tsx` and `src/routes/_authenticated/birth.tsx`.

**Interfaces:** Define `PlaceFields = { placeLabel: string; latitude: string; longitude: string; timezone: string }`. `usePlaceLookup({ fields, onResolve })` returns `{ lookup, invalidate, pending, resolution, error }`; `resolution` is `"unresolved" | "lookup" | "manual" | "saved"`. `invalidate()` increments the input generation and aborts the current request. Shared pure helpers validate finite latitude in −90…90, longitude in −180…180, nonempty label, and a timezone accepted by the existing server rules.

- [ ] Write deterministic tests with deferred fetches: Paris requested, Berlin typed, Paris resolves; two lookups finish in reverse order; coordinates/timezone are manually changed while a lookup waits; old request rejects after a new request succeeds; component unmounts while pending.
- [ ] Run `node --test tests/place-lookup.test.mjs`; then implement generation-plus-request identity checks for every success, error, and `finally` update. AbortController saves work; the generation comparison supplies correctness even when abort loses the race.
- [ ] Replace both duplicated lookup implementations with the shared hook. Only the current request may apply label, latitude, longitude, timezone, toast/error, or loading state. Validate response status and fields before applying a result atomically.
- [ ] Invalidate resolved coordinates when the place label changes. Invoke invalidation from user edit handlers, not from an effect that also invalidates the hook’s own successful resolution. Editing manual coordinates/timezone cancels lookup and uses the manual path only when all fields validate. Existing saved birth records start as `saved`; refreshing them resets lookup identity. Do not make lookup mandatory for people entering coordinates themselves.
- [ ] Guard the submit handler as well as button state: no calculation while lookup is pending or fields are unresolved/invalid. Keep the existing chart revision guard and Swiss Ephemeris source unchanged. Preserve entered fields on lookup failure and give a tap-accessible retry/manual path.
- [ ] Run the Node tests and reproduce each race in both forms in the browser fixture. Expected: the Paris result never changes Berlin’s form or enables a mismatched calculation.

## Task 6: Add deletion confirmation and restore focus

**Files:** Create `src/components/pattern/JournalDeleteDialog.tsx`; modify the journal route and `src/components/pattern/MembershipSettings.tsx`. Use the existing `src/components/ui/alert-dialog.tsx` primitives rather than replacing their implementation.

**Interfaces:** `JournalDeleteDialog({ entry, open, pending, error, onConfirm, onCancel, onCloseAutoFocus })` receives the selected owned entry and controlled state. Extend journal search validation with optional opaque `deleteEntry` ID, preserving `chapter`. A local history-state marker distinguishes a dialog opened here from a directly loaded URL.

- [ ] Replace direct Delete mutation with a controlled alert dialog naming the entry and stating that deletion is permanent. Initially focus Cancel. Use existing Buttons; do not use a primitive action that closes automatically before an asynchronous result is known.
- [ ] Push the dialog’s search state when opening. Browser Back closes it without deleting or leaving the journal; Cancel/Escape returns through the owned history entry. For a directly loaded dialog URL, closing replaces only the dialog parameter. Do not put title/body in the URL. Forward may reopen only a still-existing entry.
- [ ] On confirmation, issue exactly one mutation and retain the dialog with a pending state; disable repeat confirmation and the Cancel button while that request is in flight. Failure keeps its text and exposes a retryable error. On success, invalidate the existing queries, remove corresponding edit drafts, close, and focus the next surviving entry control or entries heading. If Back dismisses an already-confirmed pending request, do not claim cancellation; show “Deleting entry…” and the eventual result in the journal.
- [ ] Scope dialog sizing to available width/height with safe-area padding, an internal scrollable content region when necessary, and a z-index above Shell navigation. Use `100vh` fallback before `100dvh`; keep Cancel and confirmation reachable at 320 px, short landscape, and enlarged text. Verify body scroll lock and no focus behind the overlay.
- [ ] Add refs to membership’s Cancel-membership trigger and section heading. After Keep membership closes the inline confirmation, return focus to the trigger. After confirmed cancellation removes that trigger, focus the heading. Preserve the existing inline group and billing behavior.
- [ ] Browser-check Cancel, Escape, Back/Forward, direct URL, failed delete, double tap, successful delete, and a deleted trigger. Expected: no deletion before explicit confirmation; no focus drop to `body`; no live billing/account operation needed for fixture verification.

## Task 7: Correct mobile form text, purpose, and state

**Files:** Modify `src/routes/auth.tsx`, `src/routes/_authenticated/onboarding.tsx`, `birth.tsx`, `privacy.tsx`, `AccountSecurity.tsx`, `JournalEntryEditor.tsx`, `TodayCheckIn.tsx`, and scoped form rules in `src/styles.css`.

**Interfaces:** Keep current form names, validation, and Button variants. Use a shared, explicitly applied `.pattern-mobile-field` class for editable inputs/textareas/selects where current utilities/inherited labels produce small text. Do not restyle decorative text, hidden radios, checkboxes, or all controls globally.

- [ ] Apply at least 16 px computed editable text below the existing 1024 px desktop breakpoint, including landscape. Allow root text enlargement to increase it: `font-size: 16px` fallback followed by `font-size: max(1rem, 16px)`. Resolve Tailwind layer/specificity conflicts by checking computed styles, not by adding broad `!important` rules.
- [ ] Add `autoComplete="bday"` to both birth-date fields and `autoComplete="nickname"` to display name. Preserve existing email/current-password/new-password metadata; do not assign birthday autocomplete to journal event dates.
- [ ] Add `aria-pressed={accuracy === option.value}` to onboarding accuracy buttons, matching the existing birth editor, with their fieldset/legend intact. Check exactly one active state and unchanged keyboard/tap behavior.
- [ ] Audit `type`, `inputMode`, and `enterKeyHint` per edited field. Use `next` for sequential single-line fields and `done`/`go` only where the action matches; multiline reflection/journal fields must retain newline entry. An enter-key hint does not replace submit logic.
- [ ] For latitude/longitude, test signed decimal entry before applying `inputMode="decimal"`. If either target keyboard omits a usable minus sign, keep normal text input on those fields; preserve paste and server numeric/range validation. Do not switch to integer-only numeric input or silently coerce negative coordinates.
- [ ] Make frequent check-in Save and band controls 48 px high using existing size utilities, while retaining their current layout. Do not force five 48 px widths into the 320 px grid: preserve at least the current 44 px width and spacing. This is a comfort opportunity, not correction of an observed AA target-size failure.
- [ ] Verify computed field sizes and the accessibility tree in both desktop engines at all phone widths and landscape. Then verify focus zoom, actual keyboards, autofill, VoiceOver, and TalkBack in Task 10. Simple attribute/CSS changes need these behavioral checks, not tests that merely search source strings.

## Task 8: Keep focus visible and restore landscape reading space

**Files:** Modify `src/components/pattern/Shell.tsx` and `src/styles.css`; touch `src/routes/_authenticated/timing.tsx` only to expose a scoped filter selector if necessary.

**Interfaces:** Extend Shell’s existing measurement lifecycle to publish `--pattern-header-height` and `--pattern-bottom-nav-height` from actual element border boxes. Apply root scroll clearances through `--pattern-scroll-top` and `--pattern-scroll-bottom`; cleanup restores them when Shell unmounts. Measurements must not trigger a render for each input edit or form a ResizeObserver feedback loop.

- [ ] Measure rendered fixed header/navigation heights with the existing ResizeObserver pattern. Include navigation padding/safe-area contribution once; do not add the same inset again to measured clearance. Desktop navigation absence yields a zero bottom-nav height.
- [ ] Set scroll-padding on the actual document scroll container and corresponding scroll-margin for headings/field targets. Keep page-end padding sufficient for the last control. Replace the hard-coded bottom allowance with the measured value plus a small focus-ring gap.
- [ ] Test focus entry with Tab and Shift+Tab. If native focus scrolling still leaves a control obscured, add a Shell focus handler that compares its rectangle with the visible area between fixed surfaces and scrolls only the necessary delta. Recheck after viewport resize; use instant movement for focus repair and reduced motion. Do not continuously reposition the page while the user scrolls or types.
- [ ] Use `window.visualViewport` only as a progressive source of visible bounds. Account for offset and scale; never infer “keyboard open” solely from a shorter height or move fixed navigation to follow every toolbar animation. Fallback is document viewport bounds, normal scrolling, and static secondary surfaces. Do not depend on VirtualKeyboard API, keyboard-inset variables, or `scrollend`.
- [ ] Under `(max-width: 1023px) and (max-height: 500px)`, put Timing filters in normal flow and remove their sticky offset. Retain all filter controls. At 667×375, scrolling past filters must leave the timeline between header and bottom navigation instead of the audited 89 px window.
- [ ] At large text sizes, let bottom labels wrap and navigation grow rather than overlap or clip. Measure the new height and update clearance. When fixed surfaces leave less than 160 CSS px of visible content, make secondary sticky surfaces static; if necessary put bottom navigation in document flow for that constrained state, retaining all destinations and testing focus continuity.
- [ ] Reproduce the focused Yes button at 390×844 and Energy controls at 667×375. Acceptance is the full focused control and focus ring visible, not merely a nonzero sliver. For a textarea taller than the available viewport, preserve a visible caret/focus origin and usable scrolling instead of repeatedly trying to expose its entire box. Also test section-anchor navigation, final page controls, rotation, and text enlargement.
- [ ] Retain current viewport zoom metadata. Do not add `viewport-fit=cover` as a speculative fix; if device evidence requires edge-to-edge treatment, cover top/left/right/bottom insets on every fixed surface before enabling it and rerun the complete device matrix.

## Task 9: Make saved text and enlarged controls reflow

**Files:** Modify journal markup, `src/styles.css` around `.journal-entry`, navigation labels and summary flex rules, and `src/components/pattern/TodayCheckIn.tsx` around Save.

**Interfaces:** Keep content and DOM reading order unchanged. Prefer scoped CSS and existing Tailwind utilities: `min-w-0`, `max-w-full`, wrapping, and removal of unnecessary fixed/minimum widths.

- [ ] Apply `overflow-wrap: anywhere` to saved entry titles/body and any rendered attachment labels that can carry unbroken text. Make their flex/grid parents shrinkable. Include editor comparison text and recovered-draft previews so the new recovery path cannot reintroduce the same defect.
- [ ] Reproduce the saved URL that made the page 975 px wide at phone widths; add a long title, no-space Unicode string, multiline note, and long attachment label. Require document scroll width to stay within client width (allowing 1 px rounding), with all content readable. Do not hide page overflow, truncate the text, or force all prose into `word-break: break-all`.
- [ ] Let summary headings and metadata wrap; remove the nonshrinking title constraint where it causes overflow. Preserve heading hierarchy and emphasis.
- [ ] Replace Check-in Save’s expanding `min-w-36` constraint with a container-safe width/min-width combination. Keep its label, icon, focus ring, and pending state inside the card at 320 px and with a doubled root font.
- [ ] Recheck navigation with Task 8’s measured height, all six audited viewports, root font 32 px, and actual device 200% zoom/text settings. Record the stress test separately from real zoom. Preserve the already adaptive chart lists and tables.

## Task 10: Verify all ten areas and prepare a bounded release

**Files:** Create the Task 10 fixture files in the ownership table and `docs/superpowers/plans/2026-10-14-mobile-member-flow-completion-checklist.md` during implementation. This completion file is a future deliverable, not created or marked passed by writing this plan.

**Interfaces:** `node scripts/mobile-ui-fixture.mjs` starts the isolated fixture on `127.0.0.1:4198` by default, overridable with `PATTERN_MOBILE_UI_PORT`. Follow `scripts/assistant-ui-fixture.mjs`: `envFile: false`, isolated service aliases, actual route components/styles/fonts/provider, synthetic accounts, no real database or provider. `draft-store-cases.ts` exports `runDraftStoreCases()` returning named pass/fail assertions; use installed browser tooling without adding a project dependency. `browser-cases.md` records exact actions and expected results below.

- [ ] Before implementation, save Git status and hashes of tracked files and preserve unrelated dirty work. Reconfirm the baseline and paths; if changes overlap, isolate the work before editing. Keep secrets out of the preservation report.
- [ ] Build deterministic fixture controls for delayed/out-of-order lookup, save failure, committed save with dropped response, slow save, account switching, consent revocation, midnight, server revision changes, and storage failure. Keep synthetic server persistence separate from the real browser draft store under test.
- [ ] Run targeted Node tests from Tasks 1–5, then `npm test`, `./node_modules/.bin/tsc --noEmit`, and `npm run build`. Run ESLint and Prettier against changed source/test files only. Record pre-existing failures separately; do not change unrelated code or run repository-wide format. Stop broad repetition once required checks pass unless a later change warrants rerunning them.
- [ ] Walk the principal journey first in Chromium and WebKit at 390×844, then run the complete viewport/failure matrix. Use settled fonts, actual styles, and fresh state per case. Capture before/after screenshots, active-element rectangles, scroll dimensions, accessibility states, console errors, and request counts. Record exact fixture/revision/browser identity.
- [ ] Execute the real-device plan below with synthetic or designated test-account data. Keep any live model, billing, deletion, or email action outside fixture verification and within separately established authorization.
- [ ] Measure performance on a production build and a real mid-range Android phone under documented slow/variable network conditions. Complete the protocol below before marking the performance area tested; fixture render timings cannot qualify production performance.
- [ ] Produce a completion row for each F01–F12 with implementation files, test evidence, browser/orientation, remaining limits, and Proposed/Implemented/Verified status. Retain a separate disposition for every audit area, including those with no defect found.
- [ ] Review the final diff for smallest scope, no new dependency, no secret/plaintext storage, no chart/provider changes, and preservation of unrelated work. Only after subsequent authorization, commit/push/deploy through the existing project workflow; verify the deployed revision and principal journey separately from a successful build or HTTP response.

### Ten-area acceptance ledger

| Area                              | Audit disposition                                                                                           | Required completion evidence                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Reach and placement            | **Defect found**, F09. Physical grips not tested.                                                           | Focus unobscured; frequent Save/Check-in/navigation actions workable with one thumb, two thumbs, and cradled use. Observe large-phone reach before moving any action.       |
| 2. Viewport and safe areas        | **Defect found**, F05/F08/F10. Physical chrome/insets not tested.                                           | 320–440 px and landscape reflow; notch/home-indicator clearance; toolbar expansion/collapse and keyboard do not hide actions.                                               |
| 3. Touch targets                  | **No defect found** in sampled Code/Render controls. Bands were 46×44 at 320 px; Save 144×44 at 390 px.     | Recheck 24×24 minimum or spacing exception, excluding inline text links; retain 44 px primary targets and verify the 48 px height comfort change without overflow.          |
| 4. Forms and keyboard             | **Defect found**, F01/F02/F03/F07/F12. Actual keyboard/autofill not tested.                                 | All form tasks, negative coordinates, purpose metadata, autofill, focus zoom, submit visibility, durable drafts, and uncertain-save recovery.                               |
| 5. Gestures and scrolling         | **No defect found** in Code/Render. Physical edge swipe/pull-to-refresh not tested.                         | Native scrolling and tap alternatives; no hover-only content, nested trap, accidental destructive edge swipe, or data loss after pull-to-refresh.                           |
| 6. Overlays/navigation/dense data | **Defect found**, F11. Menu/editor focus and chart list adaptation passed.                                  | New deletion overlay: focus trap/return, scroll lock, Back, safe-area fit; membership return focus; preserve responsive chart data and existing menu behavior.              |
| 7. Content priority               | **No defect found**: reading and check-in lead, section shortcuts expose later detail.                      | Recovery notices remain contextual and do not push the primary journey beneath persistent banners. Preserve reading order and retained chapter content.                     |
| 8. Performance                    | **Not tested** on a production mid-range phone/slow network.                                                | Measured LCP/INP/CLS where tooling supports them, trace evidence, network/device/build identity, and narrowly targeted fixes if a bottleneck is found.                      |
| 9. Errors and recovery            | **Defect found**, F01/F02/F03/F04. Simulated request retries already passed.                                | Offline editing, durable checkpoint/reload recovery after reconnection, no false save success, no duplicate create, delete confirmation, and retained input through errors. |
| 10. Mobile accessibility          | **Defect found**, F06/F09/F10/F12. Reduced-motion and emulated pinch checks passed; physical AT not tested. | VoiceOver/TalkBack order, names/states, error/status announcements, 200% zoom, both orientations, visible focus, and reduced-motion behavior including portaled dialogs.    |

“No defect found” remains limited to what was exercised. Use “Not applicable” only for a capability absent from the flow, such as installed-PWA launch in the current scope; do not use it for missing hardware or measurements.

### Real iOS Safari and Android Chrome plan

Record device model, OS, browser build, CSS viewport, text/zoom settings, orientation, network, build SHA/URL, and evidence filename for every run. Use a notched/home-indicator iPhone with current Safari and a real mid-range Android with current Chrome. Include a large phone for reach and a compact phone where available; render testing supplies the exact 320 px case when physical hardware does not.

1. **Principal journey and grip:** Complete Today → reading → Check-in → all permitted fields → Save → Journal in one-thumb, two-thumb, and cradled grips. Record regrips/mis-taps as observations, not assumed reach defects. Confirm local-draft and account-save messages are distinguishable.
2. **Chrome, safe areas, and orientation:** Repeat portrait/landscape with expanded and collapsed browser UI. On iPhone test both top and bottom toolbar settings. Scroll to the final field/action, rotate mid-form, and return to the top. Inspect notch, bottom indicator, fixed navigation, Timing filters, and the delete dialog.
3. **Keyboard and autofill:** Focus every edited field, open/close the keyboard, change focus with Next, and submit. Check email/password managers, birthday/display-name autofill, negative coordinates, multiline Return, and Save visibility. Confirm Safari does not unexpectedly zoom on focus; separately test permitted pinch zoom to 200%.
4. **Durability and failure:** Type unique synthetic sentinels and wait for the local checkpoint acknowledgement. Navigate, Back/Forward, reload, background/discard and reopen, and interrupt network before/after server commit. Confirm pending operation reconciliation produces one journal entry and retains later text. Test a kill before checkpoint separately and record that uncommitted window honestly.
5. **Offline and storage limits:** Go offline in a loaded page, edit, then reconnect. After offline reload, allow for an unavailable app shell; after connection/authentication returns, recover the committed draft. Exercise Safari private browsing and blocked/quota storage where available; the fallback must be explicit and usable. Verify sign-out/account switch clears accessible previous-account state.
6. **Focus, overlays, gestures, and AT:** Use VoiceOver/TalkBack through the complete journey, selected accuracy buttons, errors, and draft notices. Exercise an external keyboard where available. Open/cancel/confirm deletion; test Back/edge-swipe, scroll lock, focus return, and membership Keep. Pull-to-refresh must not lose a committed draft. All gesture actions have ordinary tap controls.
7. **Zoom, text, and motion:** Test 200% browser zoom and OS/browser text enlargement separately. No lost controls, overlapping nav labels, horizontal page scrolling at the target reflow width, or hidden focus. Enable reduced motion; shared motion stays in Shell/global styles, already-visible content remains visible, and opening a visited chapter does not replay or refetch it.
8. **Performance:** Perform the measured production-build protocol below on Android and capture Safari responsiveness/scroll/keyboard behavior separately. If a metric is unavailable in Safari tooling, say “not measured” for Safari rather than substituting Chromium results.

**Deep-dive modules worth running next:** The request names modules 2–7 without supplying a separate module catalog, so this plan maps those numbers to its supplied audit areas: **2, viewport/safe areas**, to close real toolbar/notch/keyboard gaps; **3, touch targets**, to validate the 48 px comfort opportunity across grips; **4, forms/keyboard**, to qualify the three P0 paths and Safari input behavior; **5, gestures/scrolling**, to test edge swipe and pull-to-refresh recovery; **6, overlays/navigation/dense data**, because the deletion confirmation adds a modal and history state; **7, content priority**, to confirm recovery/conflict notices preserve the short Today journey. Run 4 and 2 first, then 6 and 5; 3 and 7 are bounded regression reviews, not redesign work.

### Performance measurement and remediation protocol

- Baseline and post-change runs use the same production build configuration, representative saved reading/chart/journal data, account state, network profile, and actual device. Record at least five cold navigations and five warm journey repetitions; report individual samples and their median/range. Do not present this small laboratory sample as field p75.
- Record a repeatable slow-network profile, for example 1.6 Mbps down, 750 Kbps up, and 150 ms RTT, as a **test condition**, plus a separate interrupted/variable connection run. A real mid-range device provides the CPU baseline; desktop CPU throttling is supplementary Render/lab evidence.
- Capture LCP element/resource timing, CLS entries, interaction traces for band taps, typing, Save, restore, and navigation, and long tasks. Interaction traces/Lighthouse TBT are not substitutes for measured INP. Use current supported tooling and say “not measured” when the metric cannot be collected.
- Proposed quality targets are LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1. Field qualification requires mobile p75 for all three; fixture or five-run lab results do not establish it. Source: [Google’s Web Vitals guidance](https://web.dev/articles/vitals).
- If measured evidence misses a target, repair the demonstrated cause: prioritize/resize the actual LCP image only if it is the bottleneck; reserve dimensions for the shifting element; defer optional work causing long tasks; keep draft encryption asynchronous and serialize/coalesce checkpoints without losing revisions. Preserve reading order and do not preload all assets or remove animations indiscriminately.
- Rerun the same affected scenario after a performance fix and record bundle/transfer changes. No speculative image/library/font migration is included. Record before/after evidence or leave performance qualification open; never manufacture an improvement percentage.

## Opportunities included without redesign

| Observed step                                                              | Proposed improvement                                                                      | Acceptance                                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Choosing a check-in band and tapping Save; current controls are 44 px high | Task 7 increases frequent control height to 48 px where the current grid permits it       | No overflow at 320 px; mixed-grip testing shows comfortable taps; no incorrect AA-failure claim            |
| Resuming a reflection after navigation/reload, F02                         | Tasks 1/3/4 provide contextual Resume/Discard and distinct local/account-save status      | Restores every committed field, protects newer text, and does not add a permanent dashboard panel          |
| Manually entering birthplace coordinates after lookup failure, F03         | Task 7 uses a signed-decimal-friendly keyboard only where device tests establish it works | Users can type or paste negative values on both target keyboards; ordinary text input remains the fallback |

## Platform support and accessibility references

Support was checked against current documentation on 2026-10-14. Recheck if execution occurs materially later. Broad API availability does not guarantee private-mode storage, mobile keyboard behavior, or screen-reader behavior.

| Proposed mechanism                | Support/source                                                                                                                                                                                                                                                                                               | Required fallback                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| IndexedDB open                    | MDN marks [IDBFactory.open](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open) Baseline widely available                                                                                                                                                                                      | Explicit in-memory-only recovery warning and Copy/Save when storage fails                                                                        |
| AES-GCM browser encryption        | [SubtleCrypto.encrypt](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) is Baseline widely available and requires a secure context                                                                                                                                                     | No plaintext persistence; keep in-memory fallback if encryption/key storage is unavailable                                                       |
| Cross-tab notification            | [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) is Baseline widely available                                                                                                                                                                                           | Focus/visibility rechecks; transactional generation fences remain authoritative                                                                  |
| Visible viewport measurements     | [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) is Baseline widely available; individual members vary                                                                                                                                                                      | Feature-detect bounds/events used; document viewport and normal-flow layout; do not require `scrollend`                                          |
| Long-word and focus clearance CSS | [overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap) and [scroll-padding-bottom](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding-bottom) are widely available                                                                                                     | Shrinkable layout plus measured focus repair if native focus scrolling remains insufficient                                                      |
| Dynamic viewport sizing           | [MDN viewport lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#relative_length_units_based_on_viewport) and [current compatibility](https://caniuse.com/viewport-unit-variants) confirm support in target browsers; Safari/iOS 15.4+ and Chromium 108+ support the variants | Use `100vh` followed by `100dvh` for bounded overlay height, with internal scrolling; actual keyboard/chrome behavior still needs device testing |

Accessibility acceptance follows [target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [error prevention for user-controlled data](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html), and [identify input purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html). A screenshot or successful automated check alone does not establish overall WCAG conformance.

## Completion and rollback criteria

- [ ] Every F01–F12 has an implemented minimal fix and linked regression evidence. P0 closure requires recovery/race tests, including the unknown-save outcome, not just a successful normal save.
- [ ] All ten areas have an explicit final disposition and scope. Physical keyboard, safe-area, toolbar, VoiceOver/TalkBack, and actual zoom checks are completed or explicitly remain open; do not call the full mobile solution verified while they are untested.
- [ ] Principal journeys pass on real current iOS Safari and Android Chrome in both orientations. Layout changes preserve all existing mobile reading priorities, chart data, menu behavior, and reduced-motion behavior.
- [ ] Performance has measured production/device evidence and any demonstrated regression is resolved. If field metrics are unavailable, retain that limitation separately from laboratory results.
- [ ] Dependency and schema changes remain zero under this plan. If implementation requires either, update the plan with the concrete cost/migration and validation before adding it.
- [ ] A later authorized rollout records application revision, environment, and post-deploy journey evidence separately from local tests. The records Worker does not need deployment for the planned schema-free journal change; verify that assumption against the final diff.
- [ ] Roll back application changes with a new revert commit through the existing release path, never a history rewrite. The server journal API remains backward-compatible. Preserve encrypted local envelopes when disabling draft UI; do not wipe them as rollback cleanup. Restore access with the compatible version or provide Copy recovery before deliberate removal.
- [ ] If device testing uncovers an additional defect, record its evidence, affected browser, journey impact, smallest fix, and owning task; retest that scenario before claiming closure.

## Execution inputs still needed

No additional input is required to review this plan. To complete implementation qualification, provide or establish an authorized production-like preview, designated test-account data, and access to real iOS/Android devices with recorded versions. Confirm any older-browser support floor or installed-PWA requirement if either differs from the current-browser/non-PWA assumptions. The proposed seven-day local draft retention should be reviewed as product behavior before release; implementation must not silently substitute an unlimited lifetime.
