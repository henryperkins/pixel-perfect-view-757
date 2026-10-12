# Pattern release completion implementation plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. Each numbered task is an independently reviewable change. Follow the current user instructions and `AGENTS.md`; do not start parallel agents merely because this document mentions independent workstreams.

**Goal:** Finish the named product and release gaps, with working changes on main, verified publication, and honest editorial and live acceptance records.

**Architecture:** Keep the existing TanStack Start application, signed D1 data plane, Swiss service, and separately deployed Workflows Worker. Add small server modules for data lifecycle, release publication, and writing policy; reuse existing calculation and authorization boundaries. Deliver fixes in successive releases instead of holding all changes for completion of the original MVP.

**Tech stack:** TypeScript, React, TanStack Start/Query, D1/SQLite, Cloudflare Workers/Workflows/R2, Swiss Ephemeris service, Lovable publishing and member language gateway, separate Supabase OAuth identity for assistants.

**Specs:** This is the coordinating checklist for the [R1 release plan](../../../RELEASE-PLAN.md), [revised assistant plan](../../../.lovable/plan/agent-integrations-mcp-revised-after-review-2026-10-12.md), [original MVP](../../../.lovable/plan-pattern-like-astrology-app-web-mvp-2026-07-31.md), [AI language plan](../../../.lovable/plan/ai-generated-patterns-2026-08-23.md), and the linked writing specifications below. Detailed concrete-writing steps remain in their existing checklist, with the explicit version corrections in Task 11.

## Execution status — 2026-10-12

The implementation baseline advanced to current main `6d55d56`, preserving the landing/transit-calculator updates. Tasks 1 and 5 are implemented in application commit `a267d07`, pushed to main and published as deployment `c12cdc82-e831-4d55-94d3-a73d7bc713a8`. The additive production migration is applied. Live create/edit/reload/cancel and 390px checks passed on the canonical app, `https://patterns.lakefrontdigital.io`; cycle/chapter attachment acceptance with a recalculated chart remains open. Publication details are in the release receipt. [Verification record](../../reviews/release-completion/2026-10-12-data-journal/README.md).

The first slice pairs journal editing with its database foundation to verify the upgrade with its real consumer. Tasks 2–4 are implemented in `e8d4127`, corrected for the production non-null language mode in `5bc7e4b`, and published as deployment `d1471321-9293-4240-88b0-fa3752f24d77`. Both production migrations and Worker `cc8d53f5-59c6-40f2-aa2a-8952cac8c045` are applied. All 630 tests passed or retained the two existing skips (628 passed); typecheck, scoped lint, build, nine fixture and fourteen live browser checks passed. Live expiry/resume/repeat checks passed, and the test account was deleted with its second session denied. Real Google/assistant-token acceptance remains Task 8. All other unchecked requirements stay open. [Privacy verification record](../../reviews/release-completion/2026-10-12-privacy-retention/README.md).

Tasks 6–7 are implemented in `aaa4263`, corrected for delayed first-save hydration in `6564161`, pushed to main and published as deployment `9549e516-f3e4-4e7b-8f50-08c54c7aa854`. The backend suite passed 651 tests with two existing skips; final typecheck, scoped lint, build, twelve fixture and ten live browser checks passed. A controlled legacy chart recovered a screened transit manifest without re-saving birth details, preserved natal/chart evidence and reused the completed assessment. Cleanup passed. Chart-linked journal and final writing acceptance remain Task 14. [Birth and story verification record](../../reviews/release-completion/2026-10-12-birth-story/README.md).

Tasks 9–10 are on main in `2f85195`, published as deployment `2c9b810d-2e95-43bb-8bee-7a2cef5a63df`, with Worker `61de7326-4bf2-40bc-a1c7-a197461fe6a2`. Both production migrations are applied and retained prior data. Final suite: 678 tests, 676 passed, two existing skips; typecheck, scoped lint, build, thirteen fixture and eight live browser checks passed. Controlled 0.7.2 stage/activate/rollback proved immutable artifacts and matching app/edge pointers; 0.7.1 is restored, historical readings unchanged, and the test admin is deleted. Signed public success is local integration evidence; live invalid-signature rejection passed. [Content lifecycle verification](../../reviews/release-completion/2026-10-12-content-lifecycle/README.md).

## Baseline and evidence boundaries

Source inspected on 2026-10-12: `f3e7088f6a2a071f3878e0b89a62417bcfede905` on local `main`. The earlier release in this session integrated the pending Content administration work in `22102116b1a4bba28fa8f2f9a1ad31c8bd21d4b8`, pushed it, and published deployment `1aae3295-93f6-49e6-84cc-e64b2d463263`. The later `f3e7088` commit recovered Lovable synchronization without changing application code. That release's checks reported 564 tests: 562 passed, two existing skips, zero failures; typecheck, scoped lint, build, and live asset comparison passed. See the [source verification record](../../reviews/content-administration/2026-10-12-main-release.md); the final publication receipt is local at `/home/ubuntu/.local/state/pattern-main-release/20261012/final-publication.json`.

Those are prior release results, not fresh runtime checks for this document. This checklist was prepared through source and artifact inspection. Production schema, settings, authenticated flows, and current remote state must be rechecked at execution. No checkbox below is completed merely because code was already merged. New APIs and defaults below are proposed solutions, not claims about existing implementation. The existing code-to-main/publication priority has been fulfilled for that release; each new change must complete the same delivery process.

### Corrections to the inherited gap list

| Finding                                              | Source-confirmed interpretation                                                                                                                                                                 | Solution                                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Journal columns missing                              | `d1/schema.sql` contains `body_ct`, `cycle_key`, and `feature_key`; the D1 upgrade migration is missing. Actual production columns were not queried for this plan.                              | Inspect production schema and apply only missing changes; test upgrades as well as fresh databases (Task 1).                   |
| Delete my data keeps the account                     | `eraseEverything` removes personal chart/reading data and the wrapped key, but retains the login account and other account records.                                                             | Distinguish data reset from explicit account deletion; implement full owner deletion and session revocation (Task 3).          |
| Old charts always require a birth resave for stories | Natal rescreening can incidentally populate anchors. A chart with current natal reliability but missing transit anchors has no independent repair path.                                         | Add bounded anchor recovery independent of natal rescreening (Task 7).                                                         |
| Privacy toggles work because they save               | `USR-07`, `USR-11`, `USR-14`, and `AMB-05` have no corresponding runtime use in reading assembly.                                                                                               | Give each a concrete permitted consumer and consent tests; stop presenting unfinished consumers as effective (Tasks 2 and 17). |
| 33 missing source IDs can simply be added            | There are 21 current source definitions. The original plan cites 54 launch sources, but its IDs/meanings differ from today's registry; the normative registry is not in the inspected checkout. | Reconcile by meaning against the original artifact before assigning missing IDs (Task 15).                                     |
| Small reviews close writing qualification            | Earlier narrow reviews and the Enterprise output review have different coverage, prompts, deadlines, and reviewer limits.                                                                       | Preserve them as limited evidence; run matched qualification on the final member configuration (Task 13).                      |

### Coverage of every named plan

| Existing plan                                                                                                                                                           | Remaining work owned here                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Concrete writing design](../specs/2026-10-11-daily-reading-concrete-writing-design.md) and [90-step checklist](2026-10-11-daily-reading-concrete-writing-checklist.md) | Task 11 implements it after updating stale assumptions; Tasks 13–14 qualify and publish it.                                                                                            |
| Revised assistant plan and `roadmap.md` Implement box                                                                                                                   | Task 8 settings and live acceptance; Task 20 reconciles status.                                                                                                                        |
| [Writing qualification checklist](2026-10-11-daily-reading-writing-qualification-checklist.md)                                                                          | Task 13 reruns complete review on the final configuration.                                                                                                                             |
| [Synthesis spec](../specs/2026-10-11-daily-reading-synthesis-design.md) / [checklist](2026-10-11-daily-reading-synthesis-checklist.md)                                  | Tasks 12–14 cover catalogue breadth, writing, and signed-in acceptance.                                                                                                                |
| [Natal lens spec](../specs/2026-10-11-daily-reading-natal-temperament-design.md) / [checklist](2026-10-11-daily-reading-natal-temperament-checklist.md)                 | Tasks 11, 13–14 cover final integration, full review, human editorial approval, and production lenses.                                                                                 |
| [Transit story spec](../specs/2026-10-11-daily-reading-transit-story-design.md) / [checklist](2026-10-11-daily-reading-transit-story-checklist.md)                      | Tasks 7, 11, 13–14 cover old charts, final writing, seven-day repetition, and production stories.                                                                                      |
| R1                                                                                                                                                                      | Tasks 1, 5–6, 14 cover upgrade migration, journal editing, birth change feedback, and live acceptance.                                                                                 |
| Original MVP                                                                                                                                                            | Tasks 2–4, 15–18 cover source policy, deletion/export, retention, registry reconciliation, astronomy additions, and upcoming Timing.                                                   |
| AI language layer                                                                                                                                                       | Tasks 9–10 implement baseline comparison and a shared release ingestion lifecycle.                                                                                                     |
| Gemini Enterprise investigation and existing-output scoring                                                                                                             | Existing [investigation/review](../../reviews/daily-transit-story/2026-10-12-enterprise-investigation/README.md) remains evidence; Task 19 completes the remaining timeout experiment. |

The first assistant plan is superseded by the revised account-link plan; do not migrate primary member sign-in to built-in accounts to satisfy it. The owned Swiss service, Today/Pattern redesign, and `TODAY-UI-CHECKLIST.md` are completed baselines, not new implementation projects. `DESIGN.md` and `PRODUCT.md` remain governing references. New astronomy endpoints in Task 16 are separate additions to the completed Swiss service.

## Delivery order and ownership

| Priority      | Deliverable                                               | Dependencies                                                                              | Responsible role                                             |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| P0            | Task 0 inventory; Tasks 1–4 data and privacy correctness  | Task 1 before transactional writes; Task 2 before retention consumer audit                | Engineer; production operator for schema/deletion acceptance |
| P1            | Tasks 5–7 journal, birth feedback, existing-chart stories | Task 1; Task 7 can proceed independently of the writing redesign                          | Engineer                                                     |
| P1            | Task 8 assistant activation                               | Settings access, controlled Google account, existing migrations verified                  | Production operator and engineer                             |
| P2            | Tasks 9–12 editorial workflow and concrete writing        | Task 10 before publishing new bundles; Task 12 catalogue frozen before final frame review | Engineer and editor                                          |
| P2            | Tasks 13–14 final writing qualification and release       | Final source/content frozen, declared evaluation budget, human editorial reviewer         | Evaluation operator, editor, release engineer                |
| P3            | Tasks 15–18 remaining original MVP                        | Normative registry for complete inventory; astronomy before corresponding Timing events   | Engineer and product owner                                   |
| P3            | Task 19 Gemini admin optimization                         | Instrumentation, supported provider settings, declared pilot budget                       | Evaluation operator                                          |
| Every release | Task 20 closeout                                          | Actual receipts for the completed slice                                                   | Release engineer                                             |

Use Task 14 for **every** code slice; do not wait for P3 to publish P0/P1. Assistant settings can be resolved while engineering proceeds. Keep assistants disabled until the controlled live test can run. Existing production content stays available while a candidate is qualified.

## Global constraints

- Never force-push, rebase, amend, or squash published history. Preserve unrelated `.env`, transcripts, untracked directories, stashes, and other worktrees; stage only files belonging to the task.
- Swiss Ephemeris with Placidus owns natal houses, angles, and aspects. Local math is a degraded fallback and may fill omitted angle contacts. Preserve unknown-time suppression and source/precision labels.
- Keep main in a working state. A Git push proves source delivery to Lovable, not publication; record both separately.
- Member readings and natal chapters stay on the Lovable gateway. `GEMINI_ENTERPRISE_API_KEY` is admin-only for synthetic evaluation and drafting. Record each provider's actual model identity.
- Evaluation uses one server-side Workflow per run, signed `/api/public/evaluation-step` calls, and only `evaluation_runs`/`evaluation_results` for evaluation data. Never retry a model request, including after uncertain transport outcomes.
- Deploy `edge/pattern-workflows/worker.mjs` with its `wrangler.jsonc` from a copy outside the app tree. A Lovable publish does not deploy this Worker.
- Preserve primary/strongest-three selection, eligibility, suppression, and the `> 0.02` relevance threshold during the writing changes. Context must not become an astronomical fact or an inferred personal event.
- Keep wellness, journal text, and ambient context out of language-provider requests. Reflection stays locally assembled; natal reflection remains a separate validated field with fallback and versioned cache invalidation.
- Shared browsing motion stays in Shell/global styles, with reduced-motion overrides. Use the existing Button system. Never hide already-visible content or discard/refetch a visited chapter merely because it collapses.
- Preserve historical synthetic reports and failed runs; never rewrite a saved reading to pretend it used newer evidence. Owner deletion and retention expiry remove private saved data as required and leave an accurate unavailable state rather than regenerating it. Changed prompts/content require new identities and new qualification records. AI review is not human editorial approval.

## Review focus

1. A partially upgraded database must preserve encrypted journal rows and survive migration reapplication (Task 1).
2. Deletion or revoked consent must remain effective with a second session, cached reading, active assistant token, and background job (Tasks 2–4).
3. Two tabs saving birth data or editing a journal entry must not overwrite newer work or attach a story to the wrong snapshot (Tasks 5–7).
4. Unknown-time, legacy, missing-source, and corrupt-evidence readings must suppress unsupported claims and remain usable without fabricating a replacement (Tasks 7, 11, 13).
5. A mobile member with reduced motion, a provider timeout, or a failed publish must retain accessible content and receive an accurate result (Tasks 9–10, 13–14).

## Task 0 — Freeze the execution baseline

**Files:** Read `AGENTS.md`, `package.json`, `bun.lock`, the plan links above, `docs/reviews/content-administration/2026-10-12-main-release.md`; create `docs/reviews/release-completion/<release-id>/manifest.json` for each implemented release.

- [x] Record `git status --short`, `git rev-parse HEAD`, `git worktree list`, and `git ls-remote origin refs/heads/main`; inspect branch diffs before deciding there is unmerged work. Preserve hashes/backups of unrelated dirty files and use an isolated worktree when needed.
- [x] Match installed dependencies to `package.json` and `bun.lock`; use `bun install --frozen-lockfile` in the implementation checkout. The primary checkout's previous dependency installation was stale; another worktree's passing tests are not a substitute for this check.
- [x] Record actual deployed commit/build, active content version/hash, Worker version/bindings, assistant flag, and migration status using read-only inspection. Store identifiers and outcomes, never credentials or member plaintext.
- [x] Give each release manifest an explicit owned-path list, source SHA, dependency-lock hash, migration IDs, content checksum, test receipts, publication receipt, live acceptance result, and rollback target.

**Done when:** The next engineer can identify exactly what is in main, what is running, what remains local, and which configuration is being tested.

## Task 1 — Make schema upgrades and atomic D1 operations reliable

**Modify:** `src/lib/d1.server.ts`, `d1/schema.sql`, `tests/helpers/records-harness.mjs`. **Create:** `scripts/migrate-records.mjs`, `d1/migrations/20261012_journal_upgrade.sql`, `tests/records-migration.test.mjs`, `tests/records-batch.test.mjs`.

**Interfaces:** Export `execBatch(statements: { sql: string; params?: (string | number | null)[] }[]): Promise<{ results: Record<string, unknown>[]; meta: Record<string, unknown> | null }[]>`. Match the existing D1 primitive encoding, including booleans encoded as numbers. It uses the existing signed Worker `POST /d1/batch`; do not create a second transaction endpoint. The migration script supports `--local` or `--remote`, `--check`, and a named migration; defaults to inspection, never remote mutation.

- [x] Write upgrade fixtures for a pre-journal database, a fresh current schema, and a partially upgraded database with real ciphertext-shaped rows. Assert missing columns are added once, row bytes remain identical, and a second application is a no-op.
- [x] Inspect `PRAGMA table_info(life_events)` and the migration ledger on the target database. Add only absent `body_ct`, `cycle_key`, and `feature_key`; add `updated_at` and integer `revision NOT NULL DEFAULT 0` for Task 5. SQLite column additions need explicit inspection, not an assumed `ADD COLUMN IF NOT EXISTS`.
- [x] Make the migration runner apply the selected statements and ledger entry atomically, reject unexpected existing column definitions, and print the exact pending change set before applying it. Keep fresh-schema definitions consistent with the upgrade result.
- [x] Implement `execBatch` with the existing signing/error conventions. Extend the records harness to model batch rollback; assert an invalid middle statement leaves all earlier mutations unapplied.
- [x] Run `node --test tests/records-migration.test.mjs tests/records-batch.test.mjs tests/assistant-migration.test.mjs` and require all to pass. Back up the remote database before the eventual upgrade and record its schema/result receipt; never run the full bootstrap schema over production.

**Done when:** Fresh, old, and partially upgraded databases support the same journal contract, and later deletion/publication tasks have tested atomic writes.

## Task 2 — Make every advertised privacy control affect the stated use

**Modify:** `src/lib/registry.ts`, `src/lib/pattern.server.ts`, `src/lib/reading.server.ts`, `src/routes/_authenticated/privacy.tsx`. **Create:** `src/lib/context-policy.ts`, `tests/context-policy.test.mjs`. **Extend:** `tests/reading-writing-privacy.test.mjs`, `tests/reading-request-policy.test.mjs`, `tests/assistant-readers.test.mjs`.

**Interface:** `contextUseAllowed(sourceId, use, granted, observedAt, now): boolean` composes existing registry permission checks with source freshness. All consumers use this decision before loading optional private context. Each cache identity includes the bounded, keyed identity of the context actually used.

| Source                     | Concrete permitted behavior                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `USR-07` marked moments    | Show owner-saved, explicitly attached journal context alongside the matching cycle/chapter as **Your Context**. Keep it out of astronomical prose and ranking; correct the current ranking claim in Privacy. Revocation removes these contextual links from reading surfaces while the owner can still manage their Journal. |
| `USR-11` resonance         | With consent, show the owner's previous resonance on the same interpretation in a local reflection/context panel; never infer a personality trait or alter chart facts. Keep personal storage separate from `USR-15` aggregate reporting permission.                                                                         |
| `USR-14` life-domain focus | Persist an explicit domain preference and use it to select a permitted local domain modifier/filter default. Do not change the selected celestial cycles or send the preference to the provider.                                                                                                                             |
| `AMB-05` season/daylight   | Until Task 17 supplies the consumer, display an unavailable explanation and disable the control. Task 17 enables consented local framing with source/precision labels. This temporary correction does not mark the feature implemented.                                                                                      |

- [x] Add on/off, revoked, expired, absent, and prohibited-source cases for each consumer. Assert `NO-*` and unknown IDs are rejected and false consent never triggers a private-context load.
- [x] Wire the three local consumers above and fix Privacy descriptions to name their actual effect. Retain existing tone, depth, check-in, timezone, time-bucket, wellness, and aggregate-quality controls with regression coverage.
- [x] Make revocation stop future use immediately, invalidate affected member caches, and exclude revoked inputs from exports of derived context and assistant sharing where applicable. Explain that saving an owner journal entry/rating is distinct from permitting its reuse; do not silently delete the owner's journal on a personalization toggle.
- [x] Prove byte-identical outbound provider requests across journal, wellness, ambient, domain, and resonance changes. Assert local context can change without changing selected celestial facts.
- [x] Run `node --test tests/context-policy.test.mjs tests/reading-writing-privacy.test.mjs tests/reading-request-policy.test.mjs tests/assistant-readers.test.mjs`.

**Done when:** Every enabled control has a named consumer, truthful copy, permission enforcement, and a passing revocation test.


## Task 3 — Complete account deletion, personalization reset, and export

**Modify:** `src/lib/auth.server.ts`, `src/lib/pattern.server.ts`, `src/lib/pattern.functions.ts`, `src/routes/_authenticated/privacy.tsx`. **Create:** `src/lib/account-data.server.ts`, `tests/account-data.test.mjs`.

**Interfaces:** `resetPersonalization(userId): Promise<void>` clears optional consents/preferences and derived personalization caches without deleting the login or journal. `deleteAccount(userId, password): Promise<void>` verifies the current owner and password, revokes assistant access, removes owned data and all sessions, then clears the cookie. `exportAccountData(userId): Promise<AccountExport>` reads all saved owner data through paginated queries and reports an explicit export schema version and row counts.

- [x] Add two-owner fixtures, more than 60 journal/feedback records and more than 500 audit records. Assert a complete export has no artificial list-page truncation and cannot export another owner's rows; do not reuse `listJournal`'s limited UI result as the complete export.
- [x] Make export saved-data-only: it must not calculate a chart, create a reading, call a model, or refresh a chapter. Include all retained account-owned categories and distinguish withheld secret/authentication material from missing data.
- [x] Keep a clearly labelled personal-data reset if useful, and add explicit **Delete account** with accurate scope and recent password verification. Replace the ambiguous implication that the current `eraseEverything` deletes the login.
- [x] Revoke assistant grants/link access first; fail visibly if revocation cannot be established. Use Task 1's atomic batch for owner deletion, sessions, roles, profile, wrapped DEK, and dependent D1 rows; verify foreign-key cascades for every owned table. Prevent in-flight jobs from recreating rows after deletion. Clear private caches and the current cookie after commit.
- [x] Remove the app's separate assistant link/grants without deleting the person's Google account. Inventory any app-owned identity-provider record and remove only that owned record where appropriate. Verify retained operational records contain no personal payload or usable key; document the actual scope rather than promise deletion of unrelated provider accounts or backups.
- [x] Test wrong password, wrong owner, failed batch, repeated request, two active sessions, cached reads, in-flight job completion, and an unexpired assistant token after deletion. Assert no partial success toast and no remaining account access. Test reset preserves journal/history while removing optional reuse.
- [x] Run `node --test tests/account-data.test.mjs tests/assistant-access.test.mjs tests/assistant-readers.test.mjs`. Perform live destructive acceptance only on a purpose-created test account.

**Done when:** Reset, data erasure, and account deletion have distinct truthful behavior; a deleted test account cannot log in or read through an existing session/token; export contains all retained owner records.


## Task 4 — Enforce retention without relying on a member visiting the app

**Modify:** `src/lib/pattern.server.ts`, `edge/pattern-workflows/worker.mjs`, `edge/pattern-workflows/wrangler.jsonc`. **Create:** `src/lib/retention.server.ts`, `src/routes/api/public/retention-step.ts`, `tests/retention.test.mjs`; extend `tests/edge-pattern-workflows.test.mjs`.

**Interface:** `purgeExpiredContext({ now, cursor, limit }): Promise<{ nextCursor: string | null; counts: Record<string, number> }>` performs idempotent bounded batches. A new `RetentionWorkflow`, bound as `RETENTION`, processes at most 100 owners per signed endpoint call and persists continuation in Workflow state without invoking a model. Readers also exclude expired values before the next scheduled purge.

| Existing registry policy                       | Storage behavior to implement                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `WEL-01`, `WEL-03`: 180 days                   | Clear sleep/stress and derived copies at expiry. Keep the existing immediate read guards.                                                 |
| `USR-04`: 730 days                             | Expire mood/energy and derived check-in context; preserve unrelated retained fields until their own deadline.                             |
| `USR-07`: 1,825 days                           | Expire life-event label/body and attached copies by stored record age, not the historical date the user chose for the event.              |
| `USR-11`, `USR-15`: 730 days                   | Delete expired feedback once; both personal and aggregate readers must exclude it.                                                        |
| `DEV-01`: 90 days; `AMB-02`, `AMB-05`: 30 days | Purge any persisted source signals/copies; document transient request-only values as not stored. Do not invent rows solely to purge them. |
| Lifetime/null policies                         | Retain until the appropriate owner deletion/reset; do not apply a blanket short expiry to chart facts.                                    |

- [x] Inventory base columns, `context_signals`, caches, encrypted reading/context evidence, export, assistant copies, and logs for every expiring source. Define expiry from the check-in civil day for daily check-ins and `created_at` for saved events/feedback; test exact boundary instants and timezone changes.
- [x] Separate expiring local-context text/reflection evidence from the enduring astronomical body in new saved readings. Persist source IDs and expiry metadata sufficient to remove the expiring envelope without decrypting unrelated owners in the Worker. If a legacy encrypted mixed body cannot be safely separated, remove that affected derived body at its earliest applicable expiry and retain a visible unavailable record; never quietly retain the private text in an old cache.
- [x] Add the `0 3 * * *` UTC scheduled Worker handler, creating one `RetentionWorkflow` instance named `retention-YYYY-MM-DD`. Fix its cutoff instant for the run, page owners in stable ID order, and persist the cursor through Workflow steps until exhausted. Store a final counts-only receipt under R2 `operations/retention/<run-id>.json`; do not use evaluation tables or member reading rows as a job ledger. The signed endpoint uses the existing signature/timestamp validation pattern, rejects invalid requests, and returns no private text.
- [x] Test no-visit users, repeated batches, a crash/resume, concurrent readers, revoked consent, retained encrypted journal data before its cutoff, and removal of derived copies. Verify failures alert the operator without declaring the purge complete.
- [x] Run `node --test tests/retention.test.mjs tests/edge-pattern-workflows.test.mjs tests/reading-privacy.test.mjs tests/assistant-readers.test.mjs`; deploy the Worker separately and record one controlled expiry cycle.

**Done when:** Each finite retention policy has a storage owner, read guard, scheduled deletion path, boundary test, and observed production test result.


## Task 5 — Add safe journal editing

**Modify:** `src/lib/pattern.server.ts`, `src/lib/pattern.functions.ts`, `src/routes/_authenticated/journal.tsx`. **Create:** `tests/journal-edit.test.mjs`.

**Interface:** `updateLifeEvent(db: DBClient, userId, { id, label, body, expectedRevision }): Promise<{ id: string; revision: number; updatedAt: string }>` encrypts label/body and updates only `WHERE id = ? AND user_id = ? AND revision = ?`; expose through an authenticated `editEvent` server function.

- [x] Add failing cases for wrong owner, stale revision, missing entry, empty/oversized label, body over 4,000 characters, and encryption failure. Match the existing creation limits, including the 400-character label maximum.
- [x] Implement the revision-guarded encrypted update using Task 1's columns. Keep the original date/domain and cycle/chapter attachments stable; this edit changes the text, not historical associations.
- [x] Add Edit/Save/Cancel controls with inline errors, visible saving state, accessible labels, and preserved unsaved text on failure or query refresh. A conflict asks the member to reconcile newer text instead of overwriting it.
- [x] Invalidate Journal and Today queries after a successful edit; verify both show the change without a reload and recomputation retains the attachment.
- [x] Run `node --test tests/journal-edit.test.mjs tests/today-feedback.test.mjs`; exercise create/edit/cancel/delete and two-tab conflict at 390px and desktop.

**Done when:** An owner can edit an entry from the app, see the updated text on both surfaces, and recover safely from failures/conflicts.

## Task 6 — Explain the effect of saving birth details

**Modify:** `src/lib/pattern.server.ts`, `src/lib/pattern.functions.ts`, `src/routes/_authenticated/birth.tsx`, `src/routes/_authenticated/pattern.tsx`. **Create:** `tests/birth-change-summary.test.mjs`.

**Interface:** Extend the save result with `changeSummary: { changedFields: ('date' | 'time' | 'accuracy' | 'place')[]; previous: ChartPrecisionSummary | null; current: ChartPrecisionSummary; unchanged: boolean }`, retaining `snapshotId` and `fingerprint`. `ChartPrecisionSummary` contains engine, precision, house system, time accuracy, and whether houses/angles are supported; no raw birth values enter logs.

- [x] Test exact→unknown, unknown→exact, changed place/timezone, unchanged save, degraded service, and two overlapping saves. Assert precision/suppression changes come from the stored calculation result.
- [x] Calculate the candidate before committing the new birth/snapshot pointer together. On failure preserve the previous usable profile/chart; guard against a slower old request replacing a newer successful save.
- [x] Replace the generic success toast with a concise inline change summary: fields changed, new precision, and whether house/angle claims became available or suppressed. Give an accurate no-change message.
- [x] Refresh Today, Timing, Pattern summary, and birth form from the committed snapshot. Unknown time continues to suppress unsupported claims everywhere.
- [x] Run `node --test tests/birth-change-summary.test.mjs tests/reading-natal-snapshot.test.mjs tests/reading-transit-snapshot.test.mjs tests/pattern-chapters.test.mjs`; verify the signed-in flow under Task 14.

**Done when:** A birth edit atomically produces a consistent chart and an understandable account of what changed, without relying on a hard reload.


## Task 7 — Repair missing transit anchors for existing charts

**Modify:** `src/lib/astro/transit-anchors.server.ts`, `src/lib/pattern.server.ts`; extend `tests/transit-anchors.test.mjs`, `tests/reading-transit-storage.test.mjs`, `tests/reading-transit-integration.test.mjs`.

**Interface:** `ensureTransitAnchors(db, userId, snapshot, dek, now): Promise<TransitAnchorAvailability>` returns existing valid anchors, newly calculated anchors, or an explicit unavailable reason. Keep present-but-corrupt evidence as an integrity error, separate from genuinely absent legacy data.

- [x] Add the missed regression: a saved chart has current natal reliability, valid birth input, and no `transitAnchors_ct`; opening Today/Timing can recover anchors without a birth resave.
- [x] Reuse the existing Swiss birth-calculation pipeline and anchor eligibility rules. Run recovery independently of natal rescreening, with a persisted six-hour failure backoff and an owner/snapshot lease so concurrent requests do not duplicate work.
- [x] Before writing, compare the birth fingerprint and current snapshot; merge anchor metadata without replacing newer natal/house evidence. A concurrent birth edit invalidates the old result. Do not trigger calculation from saved-only assistant readers.
- [x] Test unknown time, degraded Swiss response, missing birth input, corrupt ciphertext, fingerprint mismatch, two simultaneous requests, and backoff expiry. Unsupported anchors stay unavailable; never infer them from prose or a different chart.
- [x] Include the recovered anchor identity in future reading cache selection while preserving historical reading IDs/evidence. Use bounded on-demand recovery first; any later bulk backfill must use the same function and produce an owner-count receipt.
- [x] Run `node --test tests/transit-anchors.test.mjs tests/reading-transit-storage.test.mjs tests/reading-transit-integration.test.mjs tests/assistant-readers.test.mjs` and test one controlled legacy production chart.

**Done when:** Eligible existing members receive a story without re-entering unchanged birth details, with no unsupported story for ineligible charts.


## Task 8 — Activate and prove assistant connections

**Read:** [Activation handoff](../../reviews/assistant-activation/2026-10-12.md), revised assistant plan. **Configuration:** Lovable project `16964b03-ff4a-4ee1-b4a5-76757e94bec3`; OAuth consent URL; `PATTERN_ASSISTANTS_ENABLED`. **Evidence:** Create a dated continuation of the activation record.

The migrations and disabled deployment already exist. The recorded blocker is Lovable workspace credits for agent-driven setting changes. The solution is direct project-editor configuration, or restoring credits if that is the chosen configuration path; rebuilding the feature is unnecessary. Real Google authentication requires the account owner to complete the interactive sign-in, not credentials pasted into a transcript.

- [ ] Verify both existing migrations are applied and current main is published. Run `node --test tests/assistant-access.test.mjs tests/assistant-readers.test.mjs tests/assistant-migration.test.mjs` before enabling access.
- [ ] Change the provider's consent destination from `https://pixel-perfect-view-757.lovable.app/.lovable/oauth/consent` to `https://pixel-perfect-view-757.lovable.app/oauth/consent`. Preserve the disclosed Google identity/profile permission and the separate Pattern-account link.
- [ ] Prepare controlled linked and unlinked test accounts, a fresh assistant client, and a revocation cleanup record. Set `PATTERN_ASSISTANTS_ENABLED=true` only when the live test can immediately run, and publish/restart the affected runtime so the setting is effective.
- [ ] Complete Google sign-in, consent, authorization-code/PKCE exchange, token refresh, and return to the original member session. Confirm primary member authentication still works independently of assistant identity.
- [ ] Exercise all five tools: `get_today`, `get_pattern`, `get_chapter`, `list_timing_windows`, `list_journal_entries`. Verify owner identity, saved-data-only behavior, no new model/calculation calls, and correct unavailable results for missing/stale evidence.
- [ ] Verify journal permission defaults off and requires explicit opt-in; insufficient scope, expired token, wrong issuer/audience, unlinked identity, and cross-account requests fail. Exercise consent denial, unlink/relink, grant revocation with an otherwise unexpired token, and remembered-consent behavior. Confirm wellness/legacy private readings stay excluded and journal text is treated as data.
- [ ] Verify delegated tokens cannot use the general data API to bypass tool scopes. Remove test clients/accounts/grants; retain only redacted receipts. If any access boundary fails, restore the flag to false, publish, and prove discovery/MCP return the expected disabled response.

**Done when:** Settings are live, real Google authorization and all five tools pass, negative access cases pass, and cleanup is recorded. Unit tests or an enabled flag alone do not close the roadmap box.

## Task 9 — Give editors a real baseline comparison

**Modify:** `src/routes/_authenticated/content.tsx`, `src/lib/pattern.functions.ts`, `src/lib/pattern.server.ts`, `d1/schema.sql`. **Create:** `src/lib/content/draft-comparison.ts`, `tests/content-draft-comparison.test.mjs`, `d1/migrations/20261012_content_draft_review.sql` for draft review metadata.

**Interface:** `getDraftComparison(draftId)` returns the draft's frozen base release version/hash, candidate hash, and typed added/changed/removed/unchanged entries. `approveDraftReview({ draftId, candidateHash, baseHash })` binds approval to the exact reviewed data. Add the base identity at draft creation; old drafts without it show “Original comparison unavailable” until explicitly rebased/reviewed.

- [x] Test a changed mechanism/question, new/deleted entry, changed synthesis rule, natal lens, transit chapter, and future writing frame; assert all semantic fields survive comparison and editing. A changed active release must not silently replace a draft's frozen baseline.
- [x] Show baseline and candidate together on desktop, labelled stacked blocks on mobile, with changed-field emphasis and counts. Keep full prose available, including unchanged context needed to judge meaning; render untrusted draft text as text.
- [x] Require review of the candidate hash before publishing; invalidate approval on any edit, rebase, or regenerated draft. Preserve explicit frame invalidations from Task 11.
- [x] Run `node --test tests/content-draft-comparison.test.mjs`; exercise keyboard review, long prose, empty/missing baseline, failed load/retry, and no horizontal overflow at 390px. Use the existing Button and confirmation-dialog patterns.

**Done when:** An editor can see exactly what changed against the correct release and can only publish the version they reviewed.

## Task 10 — Unify ingestion, staging, activation, and rollback

**Modify:** `src/lib/pattern.server.ts`, `src/routes/api/public/content-releases.ts`, `src/routes/api/public/content-releases.rollback.ts`, `d1/schema.sql`; extend `tests/reading-content-releases.test.mjs`. **Create:** `src/lib/content/release-lifecycle.server.ts`, `tests/content-release-lifecycle.test.mjs`, `d1/migrations/20261012_content_release_checksum.sql` for explicitly labelled checksum metadata.

**Interfaces:** `stageContentRelease({ version, bundle, actor, reviewHash, source }): Promise<ReleaseReceipt>` validates and stores an immutable inactive release. `setActiveContentRelease({ version, expectedPreviousVersion, actor }): Promise<ReleaseReceipt>` atomically changes the pointer and audit record through Task 1's batch. Both the admin server function and signed public route call these functions. `ReleaseReceipt` reports stored version/hash, previous/active version, and edge publication state.

- [x] Write regressions for equal-version/different-content rejection, harmless identical reupload, invalid graph, failed middle write, concurrent activation, rollback, non-admin admin calls, and invalid public signatures. A failed batch must leave the old active release and audit consistent.
- [x] Refactor the two entry points onto the shared service instead of making the app issue an internal HTTP request with a signing secret. Retain public HMAC authentication. Publishing an admin draft stages it inactive; activation remains a separate explicit action.
- [x] Require numeric semantic versions for newly published releases from either entry point, chosen in the review UI; keep existing `ai-*` releases readable and eligible for rollback. Compute a canonical SHA-256 content checksum for new releases and label its algorithm. Preserve legacy stored checksums with their legacy semantics rather than relabelling/recomputing historical evidence.
- [x] Preserve the public route's existing activate-on-upload behavior for callers that omit the new `activate` option; allow `activate:false` for staging. Apply identical graph/immutability checks to both paths, including all synthesis/natal/transit/writing arrays.
- [x] Use `expectedPreviousVersion` to reject stale activation decisions and guarantee one active release. Record version, previous version, actor, and operation in the same transaction. Rollback changes the active pointer, never historical reading rows.
- [x] Publish mirrors/artifacts after the database transition with an idempotent receipt/reconciliation path. A mirror failure reports a partial publication state and blocks the release's live-completion check; retries of artifact delivery are allowed and never retry a model call.
- [x] Run `node --test tests/content-release-lifecycle.test.mjs tests/reading-content-releases.test.mjs tests/reading-content.test.mjs`. Exercise stage/activate/rollback on a controlled candidate and prove readers agree on the active version.

**Done when:** Every publishing path uses one validated lifecycle, the pointer/audit transition is atomic, and failures or rollback cannot silently lose the previous release.

## Task 11 — Implement concrete writing on the actual current baseline

**Primary specification and steps:** [Design](../specs/2026-10-11-daily-reading-concrete-writing-design.md), [existing nine-task checklist](2026-10-11-daily-reading-concrete-writing-checklist.md). Execute its detailed steps with these corrections; do not treat its old starting-state claims as current.

| Identity or limit         | Current source                                                                | Candidate decision                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Daily prompt              | `daily-astro-body-13`                                                         | Reserve the next unused identity, provisionally `daily-astro-body-14`.                                                                   |
| Daily validator           | `daily-reference-10`                                                          | Reserve the next unused identity, provisionally `daily-reference-11`.                                                                    |
| Member model / deadline   | `google/gemini-3.8-flash`, 60,000 ms                                          | Preserve both; do not restore the old plan's 3.7 / 20-second assumptions.                                                                |
| Admin Enterprise identity | `gemini-enterprise/gemini-3.8-flash`                                          | Keep distinct; do not use its longer experimental deadline as member qualification.                                                      |
| Fixtures                  | `synthetic-daily-6`, **38** cases                                             | Add the proposed 12 once: **50**, not 48; reserve `synthetic-daily-7` if unused. Recalculate model attempts from the dry plan.           |
| Content                   | Active transit release recorded as `0.7.1`; built-in fallback `builtin-0.5.0` | Preserve all existing arrays; schema 5, provisional `builtin-0.8.0` and numeric published `0.8.0`, after verifying version availability. |

**Files:** Create `src/lib/content/daily-writing.ts`, `src/lib/content/daily-reflection.ts`, `src/lib/ai/daily-writing-quality.ts`, and the new tests named in the detailed checklist. Modify content schema/default bundle, `daily-voice.ts`, `language.server.ts`, `reading.server.ts`, `pattern.server.ts`, evaluation modules, and saved-evidence UI exactly where the detailed checklist assigns ownership. Use Task 10's shared lifecycle for the new content fields.

- [ ] **11.1 Content:** Add schema-5 `dailyWritingFrames`, at most 2,000 frames, unique source bindings and frame keys, one/two scenes, 180-character situation/focus bounds, 220-character questions, and the exact cue/sentence checks in the spec. Legacy absence becomes `[]`; never borrow a built-in frame for a missing active-release source. Seed reviewed frames for the actual interpretation/positive-synthesis inventory after Task 12, not a stale fixed count. Editing/deleting source copy invalidates/removes affected frames.
- [ ] **11.2 Theme plan:** Implement the spec's `DailyWritingPlan` and exact source selector. Positive `S1` owns the central theme; otherwise `I1` does. Independent pairs do not acquire a joint story. Select only reviewed source scenes, preserve required fact parents, and keep supporting cycles/natal/history from introducing unrelated scenes.
- [ ] **11.3 Voice:** Add all six complete `plain`/`warm`/`clinical` × standard/technical examples and `DAILY_VOICE_EXAMPLES_VERSION`. Use the spec's identical synthetic source card across tones, with isolated `EX-*` IDs. Review examples as authored copy; test that an unrelated reply scene does not borrow calendar/project meaning.
- [ ] **11.4 Quality:** Add the separate bounded editorial checker after existing safety/reference validation. Reject invalid scene references/parents, the spec's narrowly recognized unqualified past-event assertions, exact duplicate sentences of at least eight words, and copied complete demonstration sentences of at least ten words unless independently present in supplied published copy. Broader semantic invention remains a review responsibility. Keep stock abstractions and bounded recent/repeated phrases as warnings, with at most 20 issue records and 32 source texts of at most 2,000 characters. Do not add broad word bans to `safetyPass`.
- [ ] **11.5 Generation/fallback:** Pass the writing plan to the existing one-call model contract and record scene use independently from fact citations. Apply the same plan to deterministic fallback. Rejection/timeouts use the complete valid fallback; no repair call or silent model retry. Distinguish a minimal emergency fallback from a qualified framed template.
- [ ] **11.6 Reflection:** Implement `dailyQuestionProblem` and `resolveDailyReflection` with one conceptual question centered on the selected source. Choose standard/high-stress/low-sleep variants locally; stop concatenating unrelated prompts. Preserve the separate natal reflection contract.
- [ ] **11.7 Saved evidence:** Add the spec's encrypted `language_meta.daily_writing_ct` envelope with plan, source-bound reflection, paragraph scene use, astronomical paragraph count, versions, and bounded issue codes. For new rows leave clear `daily_readings.prompt` null; preserve legacy reading compatibility. Present-but-corrupt evidence fails closed without a silent recomputation. Include bounded canonical writing identities in cache HMACs, never random ciphertext or private recent bodies.
- [ ] **11.8 History:** Implement `loadRecentDailyWritingBodies` only after a cache miss: same owner/snapshot/effective timezone; preceding three civil days; at most four rows per day, 12 examined, three usable bodies. Compare only stored astronomical paragraphs. Do not send history to the model or add it to the cache identity. Consent/retention rules still govern any private evidence loaded.
- [ ] **11.9 Evaluation/UI:** Add the 12 named writing fixtures from the detailed plan once, show source-supported illustrative scenes accurately in Evidence, and extend quality diagnostics without exposing private bodies or editorial internals in the main reading. Update fixture declarations, evaluation UI, `READING-EVALUATION.md`, and `READING-INTEGRITY.md`.
- [ ] Run `node --test tests/reading-writing-*.test.mjs tests/reading-daily-*.test.mjs tests/reading-template-composition.test.mjs tests/reading-cache.test.mjs tests/reading-request-policy.test.mjs tests/today-evidence.test.mjs`, then the final checks in Task 14. Keep the candidate inactive until Task 13 passes.

**Done when:** All nine original implementation packages are built against the current versions, the 90 detailed items have real evidence, and model/template/reflection/storage use the same reviewed theme. Final editorial approval belongs to Task 13.

## Task 12 — Broaden synthesis only where reviewed source copy supports it

**Modify:** `src/lib/content/default-bundle.ts` and candidate release data; extend `tests/reading-synthesis.test.mjs`. **Create:** `scripts/synthesis-coverage.mjs` and `docs/reviews/daily-synthesis/coverage.json` during execution.

Current source has six directed rules for three unordered pairs: four positive directions and two explicit independent directions. An unmatched pair is a supported independent/no-synthesis outcome, not permission to invent a connection.

- [ ] Enumerate all interpretation pairs reached by the fixed synthetic suite and any already-authorized, non-personal coverage sample. Report both-direction coverage, eligible/selected positive synthesis, explicit independence, and unmatched pairs; do not turn synthetic percentages into claims about all members.
- [ ] Build the editorial matrix for all directed pairs of concrete, non-wildcard interpretations in the published catalogue that can coexist; mark impossible combinations with their calculation constraint. Prioritize pairs reached by the 50-case suite and production scenarios, then finish the remaining matrix. For each possible pair, an editor must add a defensible tension/reinforcement rule or explicitly classify it independent with a source-based reason. Do not mass-label unreviewed pairs independent just to close the checklist.
- [ ] Review both directions separately and enforce existing selection priority/thresholds. Add source-bound frames for each new positive direction in Task 11; never annotate an independent rule with a joint theme.
- [ ] Test deterministic selection, invalid/missing source rejection, directionality, no-synthesis fallback, and catalogue preservation through staging/rollback. Run `node --test tests/reading-synthesis.test.mjs tests/reading-content-releases.test.mjs` and the new coverage script offline.

**Done when:** The published concrete-pair matrix and defined acceptance population have explicit editorial decisions, all justified positive rules are implemented in both reviewed directions, and the coverage report states wildcard/unmatched limits without implying universal synthesis.

## Task 13 — Qualify the final writing stack with matched evidence

**Modify:** `src/lib/ai/reading-evaluation.server.ts`, `src/lib/ai/reading-evaluation.shared.ts`, `src/lib/evaluation-runs.server.ts`, fixture modules, `scripts/reading-writing-review.mjs`, `docs/reviews/daily-reading-writing/review-protocol.md`; extend `tests/reading-writing-review.test.mjs`, `tests/reading-evaluation-runs.test.mjs`, `tests/reading-eval-fixtures.test.mjs`. **Create:** `docs/reviews/release-completion/<release-id>/qualification/` during the run.

**Interface:** Add a closed admin-only `qualificationProfile` enum to evaluation run metadata and signed steps. Profiles select reviewed deterministic policy variants; they never accept arbitrary prompts, member IDs, or user-supplied executable settings. Pin source SHA, release/hash, fixture/hash, profile, prompt/validator versions, actual provider/model, timeout, and request policy in every report.

### One campaign, four reusable arms

| Arm | Writing                                                       | Natal lens | Transit story | Purpose                                      |
| --- | ------------------------------------------------------------- | ---------- | ------------- | -------------------------------------------- |
| A   | Final concrete-writing policy                                 | Off        | Off           | Base for natal comparison                    |
| B   | Final concrete-writing policy                                 | On         | Off           | A→B isolates the natal addition              |
| C   | Final concrete-writing policy                                 | On         | On            | B→C isolates transit; final member candidate |
| D   | Frozen pre-concrete-writing prompt 13 / validator 10 behavior | On         | On            | D→C isolates concrete writing                |

Use identical fixture facts, final source-copy catalogue, provider/model and deadline across arms; explicitly disable only the feature being compared. The baseline ignores schema-5 writing frames. Test that arm configuration changes only its declared policy inputs. These evaluation profiles never change production member defaults or write member data. Synthesis rules remain fixed across the arms and receive their own coverage/composition scoring within them.

- [ ] Reconcile historical evidence first: preserve the failed blinded writing round, the failed full natal reviews, later limited reviews, and the Enterprise review as separate records. Label the six small template compositions and later targeted output checks by exact prompt/content/deadline; none automatically signs off the final stack.
- [ ] Extend the review protocol with versioned concrete-writing and transit dimensions/flags; keep the existing dimensions and failure rules. Include the separately assembled reflection and its source bindings in the new packets so question focus is actually reviewed. Add checker tests for missing reviewers/items/reflections, mismatched hashes, duplicate assessments, changed source identity, unreviewable raw output, and leaked origin/prior-verdict labels.
- [ ] Freeze all four dry plans and template captures before paid generation. With 50 cases and one quiet case, the provisional ceiling is **196 generation attempts** across four arms. Recompute this from the plans; if the count differs, stop the run setup and record the new scope. Record a dollar ceiling including generation and paid review, who authorized it, and a stop condition; this document does not authorize unlimited spend.
- [ ] Generate through server Workflows on the **member Lovable provider and 60-second deadline**. Leaving `/content` must not stop the run. Each planned case gets at most one model attempt; transport uncertainty, truncation, timeout, or capture failure is retained as such. No retries or replacing failures under the same run ID.
- [ ] Score all losslessly captured raw candidates, including rejected drafts, and all actual deterministic fallback/template outputs. Record unavailable raw candidates as coverage gaps. A useful fallback does not establish quality of a missing model response.
- [ ] Prepare three blinded comparisons (A/B, B/C, D/C), with two fresh reviewer contexts, using the frozen source graphs and randomized origin labels. Reviewers must not see earlier verdicts or each other's assessments. Record disagreements and adjudication; never silently drop the lower score.
- [ ] Apply the original plans' complete gates. Require candidate specificity, grounding, coherence, and applicable synthesis/lens/temporal/chapter integration scores of at least 4/5; no substantive unsupported claims, invented events, suppression breaches, example-subject leaks, unrelated scenes, or multiple-question focus. For concrete writing also require scene support/question focus at least 4/5 and the planned improvement on problem cases without grounding/voice regression. Report availability/latency separately from prose scores. A failed or uncovered required case leaves that sign-off open.
- [ ] Run the seven-day repetition check on four fixed synthetic profiles: stable slow transit, changing fast transit, overlapping natal/story context, and unknown-time/degraded coverage. Use seven consecutive civil dates and seed history sequentially; do not require waiting seven real days. This adds at most **28** planned generation attempts, for a provisional campaign ceiling of **224**. Score repeated openings/sentences, scene variety, continuity, factual changes, and reflection focus; preserve every day's full output and template. Require both reviewers to rate useful variation/continuity at least 4/5 for each sequence, with no unresolved substantive defects. Required literal chronology is exempt from lexical repeat warnings, not from factual review.
- [ ] Have an actual human editor approve the final source catalogue, six voice examples, representative complete readings, and natal/transit integrations. Record person/date/artifact hashes and requested corrections. Keep `humanReviewCompleted:false` until this occurs; an AI reviewer cannot close this requirement.
- [ ] Run `node --test tests/reading-writing-review.test.mjs tests/reading-evaluation-runs.test.mjs tests/reading-eval-fixtures.test.mjs tests/reading-natal-evaluation.test.mjs tests/reading-transit-evaluation.test.mjs`. Publish a qualification matrix: full/partial coverage, each gate, each reviewer, human approval, latency/fallback rates, cost known/unknown, and final release recommendation.

Existing offline review commands, to run against each frozen comparison with new output paths:

```bash
node scripts/reading-writing-review.mjs prepare --before BEFORE.json --after AFTER.json --output-dir NEW_REVIEW_DIR
node scripts/reading-writing-review.mjs qualify --assignment NEW_REVIEW_DIR/assignment.json --review REVIEWER_A.json --review REVIEWER_B.json --output NEW_QUALIFICATION.json
```

Replace the uppercase path placeholders with the manifest's paths. These commands prepare/check review files; they do not obtain reviewer judgments or generate readings. The run controller must enforce the model-attempt budget. Any remediation changes source identity and requires a newly scoped evidence run, not overwriting the failed one.

**Done when:** Writing, synthesis, natal lens, and transit story each have their required final-version review, full declared coverage, seven-day evidence where applicable, and human sign-off. The existing smaller reviews remain valid only within their recorded limits.

## Task 14 — Merge, publish, and verify each completed release

**Files/evidence:** The Task 0 manifest, owned file list, migration receipt, content hash, Worker deployment receipt when relevant, Lovable publication receipt, and signed-in live acceptance record. Use the existing [Lovable project](https://lovable.dev/projects/16964b03-ff4a-4ee1-b4a5-76757e94bec3) and [app](https://pixel-perfect-view-757.lovable.app).

- [ ] Run the changed subsystem's tests, then `npm test`, `node_modules/.bin/tsc --noEmit`, ESLint on the changed supported source/test files, `npm run build`, and `git diff --check`. Review every failure/skip against the baseline; do not claim the earlier 564-test receipt is the new release's result.
- [ ] Run local UI checks at 390px and desktop, including keyboard/reduced motion, loading/empty/error states, no horizontal overflow, retained drafts, and shared Button controls. Ensure evidence shows the real route/components; fixture browser checks must be labelled as fixtures.
- [ ] Back up and apply additive schema upgrades before deploying code that requires new columns. Verify schema compatibility for both old and new app versions; do not delete columns or keys to roll back an additive release.
- [ ] If the Worker changed, copy only its required sources/config outside the app tree, deploy with Wrangler from that copy, verify the account/bindings/version and signed endpoint health, and store the receipt. Do not copy secrets into the repository or assume Lovable published it.
- [ ] Inspect the full owned diff, commit explicit paths, integrate with current main using ordinary commits/merges, and push normally. Resolve any new upstream changes and rerun only checks affected by them. Record local/main/remote commit parity.
- [ ] Confirm Lovable has synchronized that commit, then publish. Record the actual deployment/build identifier, production health, and live JS/CSS/content identities. A successful push or editor preview is not the publication receipt.
- [ ] Stage the candidate content through Task 10, verify its stored checksum and schema, then activate only after its relevant qualification gate is satisfied. Prove the app, durable records, and published artifact agree on the active version; exercise rollback on a controlled release before relying on it.
- [ ] Perform the applicable signed-in acceptance cases below with controlled accounts and actual production services. Record which cases required real provider calls and keep them inside a stated smoke-test budget. If a case cannot be exercised, leave that specific acceptance box open rather than mark the release fully accepted.
- [ ] On regression, disable the affected optional feature or restore the previous content pointer; for app code use a forward revert commit and republish, and restore a previous Worker version if needed. Recheck health and affected member flows. Account erasure and expired-data deletion are irreversible operations, not features that a code rollback can undo.

| Live acceptance case | Required result                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1 check-in          | Save, sign out/in, and verify owner-only persistence and effective local day; relevant caches refresh without losing an unsaved journal draft.               |
| Journal              | Create from Today, edit in Journal, see changes in both; recompute the chart and retain the saved cycle/chapter association.                                 |
| Birth edit           | Save a meaningful correction and an exact/unknown transition; see changed fingerprint/summary/suppression consistently in Birth, Pattern, Today, and Timing. |
| Synthesis            | Controlled chart with a known positive rule displays the supported synthesis; unmatched/independent case remains independent.                                |
| Natal lens           | Eligible exact-time chart displays a source-supported lens; ineligible/unknown-time case obeys reliability rules.                                            |
| Transit story        | New chart and legacy chart with missing anchors display a valid story when eligible; service failure degrades accurately.                                    |
| Concrete writing     | Published scenes, one focused reflection, model output and forced fallback all use the same source plan; saved Evidence survives a reload.                   |
| Privacy/data         | Toggle/revoke a real consumer; export a seeded long history; delete a dedicated test account; verify another session and assistant token lose access.        |
| Assistants           | Task 8's real Google flow, five tools, access negatives, revocation, and cleanup.                                                                            |

**Done when:** The release is committed on main, pushed, published, and proven on the live app with versioned evidence. Mark narrower outcomes such as “published; human review pending” exactly when that is the true state.

## Task 15 — Reconcile and complete the original source registry

**Modify:** `src/lib/registry.ts` and actual source consumers as discovered. **Create:** `docs/data-source-coverage.md`, `tests/source-registry-coverage.test.mjs`; store the retrieved normative registry under `docs/reference/` with origin/version/hash.

- [ ] Retrieve `pattern_like_astrology_app_data_source_registry_v0.2` and its topology from the original project artifact/history. The cited 54-launch-source inventory cannot be reconstructed safely from today's IDs. If the artifact remains unavailable, record that precise external dependency; do not manufacture 33 definitions or claim the original MVP complete.
- [ ] Build one coverage row per normative launch source, mapped by meaning: original ID, current ID/alias, producer, storage, allowed/prohibited uses, consent gate, freshness/confidence/cadence, retention, UI/evidence, test, and status. Preserve all 24 `NO-*` exclusions as permanent prohibitions.
- [ ] Map known implementations, superseded architecture decisions, and genuinely missing behavior separately. D1/Workflows, the owned Swiss service, current design system, and the later AI plan supersede old “out of scope,” approximate-only, font/palette, and no-LLM assumptions; do not reverse those delivered decisions.
- [ ] For each genuinely missing launch row, assign an independently testable implementation task with its exact producer/consumer and acceptance assertion before coding that row. Group calculation gaps with Task 16, environmental gaps with Task 17, Timing gaps with Task 18, and source lifecycle gaps with Tasks 2–4. Record any additional category explicitly instead of assuming these four groups exhaust the missing artifact.
- [ ] Extend the runtime registry with required metadata and stable semantic mappings; do not renumber IDs already stored on member rows. Enforce unknown/prohibited source rejection and allowed-use boundaries at ingestion and consumption, not just in a settings display.
- [ ] Run `node --test tests/source-registry-coverage.test.mjs tests/context-policy.test.mjs tests/reading-privacy.test.mjs`. Require every supported launch row to have a real producer, consumer or documented operational purpose, test, and retention owner. Explicitly deferred requirements remain open unless the product scope is deliberately amended.

**Done when:** All 54 original launch entries are traceable to supported behavior or an explicit approved scope change; a count of registry constants alone is insufficient.

## Task 16 — Add source-backed lunations and eclipses

**Modify:** `services/swiss-ephemeris/src/contract.mjs`, `engine.mjs`, `server.mjs`, `src/lib/astro/swiss.server.ts`, `src/lib/registry.ts`. **Create:** `services/swiss-ephemeris/src/lunations.mjs`, `services/swiss-ephemeris/tests/lunations.test.mjs`, `src/lib/astro/lunations.server.ts`, `tests/lunations.test.mjs`.

**Contract:** Add a versioned bounded service query for a UTC date range returning stable event IDs, event kind, exact UTC instant, relevant positions/geometry, calculation engine/ephemeris identity, and uncertainty. Eclipse visibility is a separate optional location-dependent fact; a global eclipse must not imply local visibility.

- [ ] Map the required facts to the reconciled registry and verify which native Swiss routines the deployed binding supports. Implement actual numerical calculation in the owned service; do not derive eclipses from generic new/full Moon labels or model prose.
- [ ] Add frozen native-reference cases for new/full Moon, solar/lunar eclipse, no-event ranges, range boundaries, multiple events, and unsupported/out-of-range inputs. The proposed acceptance contract requires identical event kinds/counts, instants within 60 seconds, and normalized longitudes within 0.001 degrees of independently captured native reference results. Record reference commands/versions and fail qualification rather than silently loosening these tolerances.
- [ ] Add bounded range validation, cache identity, request deadline, cancellation, and missing-service responses consistent with the existing service. Keep natal Placidus/uncertainty behavior unchanged.
- [ ] Render events in the relevant Timing/Evidence surface using calculated labels. Reading interpretations require reviewed published content and explicit evidence bindings; absent copy leaves a factual event, not invented personal meaning.
- [ ] Run `node --test services/swiss-ephemeris/tests/lunations.test.mjs tests/lunations.test.mjs tests/owned-swiss-service.test.mjs`, the service's existing numerical/HTTP suites, and its qualification procedure. Deploy the service and verify an actual range query before enabling the UI.

**Done when:** Lunations/eclipses have qualified numerical sources and visible evidence, with no unsupported timing, visibility, or personal predictions.

## Task 17 — Add consented daylight and seasonal framing

**Modify:** `src/lib/registry.ts`, `src/lib/pattern.server.ts`, `src/lib/reading.server.ts`, `src/routes/_authenticated/privacy.tsx`, and the owned service's `contract.mjs`/`server.mjs`. **Create:** `services/swiss-ephemeris/src/solar.mjs`, `services/swiss-ephemeris/tests/solar.test.mjs`, `src/lib/astro/solar-context.server.ts`, `tests/solar-context.test.mjs`.

**Contract:** `getSolarContext({ day, timeZone, latitude, longitude }): Promise<{ daylight: 'ordinary' | 'polar_day' | 'polar_night' | 'unavailable'; sunriseUtc: string | null; sunsetUtc: string | null; seasonalBand: 'spring' | 'summer' | 'autumn' | 'winter' | null; source: string; precision: string }>` uses qualified solar calculations. Proposed seasonal framing uses northern meteorological month bands (March–May spring, June–August summer, September–November autumn, December–February winter), reversed in the south, labelled as a coarse convention. Within 23.44 degrees of the equator omit that seasonal label; daylight can still be shown. Do not infer local weather or wet/dry seasons.

- [ ] Define and label the location input explicitly. Use a member-selected coarse current location with its own registry permission; do not silently treat birthplace as current location or request continuous location tracking. Without an authorized location, show unavailable and omit the framing.
- [ ] Implement ordinary and polar-day/night results, both hemispheres, DST/local-date boundaries, and invalid/missing location. Avoid forcing nonexistent sunrise/sunset times into the result.
- [ ] Add a short locally authored context line only when `AMB-05` and the location source are permitted. Keep it in **Your Context**, out of celestial eligibility and provider prompts. Enable the previously disabled Privacy control with accurate freshness/precision and retention text.
- [ ] Test on/off/revoked permissions, latitude/date boundaries, northern/southern seasons, no retained precise location beyond its contract, and byte-identical model requests with different solar context. Apply the 30-day policy to stored `AMB-05` values through Task 4.
- [ ] Run `node --test services/swiss-ephemeris/tests/solar.test.mjs tests/solar-context.test.mjs tests/context-policy.test.mjs tests/reading-request-policy.test.mjs`, qualify solar event times against independently captured native results within 60 seconds, deploy the service, then perform a controlled production location/date check.

**Done when:** The switch has a real, permission-bound local effect and accurately handles places/dates without ordinary daylight cycles.

## Task 18 — Show genuinely upcoming cycles in Timing

**Modify:** `src/routes/_authenticated/timing.tsx`, `src/lib/pattern.functions.ts`, `src/lib/pattern.server.ts`, `src/lib/astro/transit-episodes.server.ts`. **Create:** `tests/timing-upcoming.test.mjs`; extend `tests/timing-calendar.test.mjs`, `tests/transit-timing-cache.test.mjs`.

**Interface:** Add authenticated `fetchUpcomingCycles({ fromDay, horizonDays, domain, duration })` with a default 90-day horizon and a hard maximum of 365 days. Return source-backed windows with start, all exact passes, end, phase, domain, duration, confidence/availability, and last calculation time. Keep active and future windows distinct.

- [ ] Extend the owned episode query to scan the bounded future interval, including windows that are outside today's orb. Do not relabel an active “building” transit as the complete upcoming list.
- [ ] Test a window starting tomorrow, none in range, a window spanning today, multiple exact passes, a repeated retrograde episode, end-boundary exclusion, unknown-time suppression, service failure, and timezone rollover. Deduplicate stable episode IDs across active/upcoming views.
- [ ] Add Active/Upcoming navigation and actual domain/duration filters. Define short as under 7 days, medium as 7–30 inclusive, long as over 30; display unknown duration separately rather than misclassifying it. Preserve visited/cached content when views close or filters reset.
- [ ] Show start, exact dates, end, calculation status and last refresh; state unavailable honestly for incomplete source windows. Integrate Task 16 events with their own event type and filters, not fake transit windows.
- [ ] Run `node --test tests/timing-upcoming.test.mjs tests/timing-calendar.test.mjs tests/transit-timing-cache.test.mjs tests/transit-episodes.test.mjs`; verify an actual future window on production at 390px and desktop.

**Done when:** A member can inspect and filter a qualified future interval, including cycles not active today, with truthful timing and uncertainty.

## Task 19 — Finish the Gemini Enterprise timeout investigation

**Read:** [Existing investigation and scoring](../../reviews/daily-transit-story/2026-10-12-enterprise-investigation/README.md). **Modify:** `src/lib/ai/language.server.ts`, `src/lib/ai/diagnostics.ts`, evaluation report types; extend `tests/reading-provider.test.mjs`, `tests/reading-diagnostics.test.mjs`, `tests/reading-evaluation-runs.test.mjs`.

The archived report contains 23 accepted responses and 14 timeouts among 37 model attempts. Provider observations support a deadline/latency problem; they do not yet establish that thinking settings caused it. Later long-deadline samples cannot establish reliability at the member 60-second deadline. Existing output/template scores are already archived; do not buy another run solely to reproduce them.

- [ ] Add admin-only bounded transport telemetry: requested provider/model/configuration, actual model, request/response identifiers where available, start/headers/body/abort timestamps, deadline, HTTP/finish status, token usage including thinking counts when returned, and explicit unknowns. Never record keys, hidden reasoning text, or member payloads.
- [ ] Verify currently supported Gemini 3.8 thinking controls in official provider documentation and the actual API contract before sending them. If a proposed setting is unsupported, record that result and stop that arm; do not substitute a different model unnoticed.
- [ ] Freeze a small comparison: six synthetic cases covering an ordinary reading and the five missing transit raw-output shapes, two supported thinking settings, two independent repetitions: **at most 24 attempts**, all with the same 60-second deadline. Use low/medium only if both are supported; otherwise record the supported comparison in the run plan before starting. Declare a separate dollar ceiling; one case failure is not a retry opportunity.
- [ ] Run through the same server evaluation orchestration. Preserve all outcomes and cancellation timing; compare completion rate, latency distribution with sample size, timeout counts, usage/cost, validator result, and blinded prose/temporal quality. Do not count a timeout as a successful latency sample or infer individual causality from aggregate provider metrics.
- [ ] If the pilot supports a new admin default, qualify it with matched full-suite baseline/candidate Enterprise runs before changing that default. Today's 38-case suite permits at most 74 additional attempts across two arms; the planned 50-case suite permits at most 98. Freeze whichever fixture version is current and authorize that separate call/dollar ceiling before running. Review newly generated counterparts of all 14 previously missing drafts; preserve the original missing responses as missing. A failed pilot needs no expanded run.
- [ ] Select an admin default only if the pilot and full-suite check improve timely completion without degrading required quality; otherwise retain the current configuration and document the unresolved provider limitation. Longer deadlines may be an explicitly labelled admin experiment, never an unqualified member change.
- [ ] Run `node --test tests/reading-provider.test.mjs tests/reading-diagnostics.test.mjs tests/reading-evaluation-runs.test.mjs tests/reading-request-policy.test.mjs`; verify member/natal requests still route only through Lovable and that neither the Worker nor client retries failed model cases.

**Done when:** The remaining latency hypothesis has a reproducible bounded result and a recorded admin configuration decision, with sample limits and cost stated. This task does not block member-product fixes or replace Task 13.

## Task 20 — Close the plans with evidence, not inferred completion

**Modify after implementation:** `roadmap.md`, `RELEASE-PLAN.md`, each corresponding checklist linked above, `READING-EVALUATION.md`, `READING-INTEGRITY.md`, and the dated release manifest. Preserve historical review files and superseded plans with clear pointers.

- [ ] For each completed checkbox, add the implementing commit, verification command/result, and live/editorial receipt where required. Label source-complete, tested, pushed, published, enabled, AI-reviewed, human-approved, and live-accepted separately.
- [ ] Close the assistant Implement item only after Task 8; close writing/synthesis/natal/transit sign-offs only against the exact Task 13/14 identities. Keep unavailable user sign-in, settings access, missing source artifacts, or editorial approval as named external dependencies with an owner and concrete next action.
- [ ] Reconcile the original 90 concrete-writing items with Task 11 and remove stale version/count assumptions from their execution instructions; retain the old values only as historical context. Never tick an item solely because another feature's smaller check passed.
- [ ] Record each deferred original-MVP requirement explicitly. Do not call all plans complete while retention, source coverage, or live acceptance is still open; distinguish an approved scope replacement from unfinished work.
- [ ] Confirm all owned code/docs are on main and the expected app/Worker/service/content versions are live. Verify unrelated local work is intact and attach the final release receipt.

**Overall finish condition:** Every named requirement is implemented and accepted, or explicitly superseded by an approved scope decision; every delivered change is on main and published; all remaining limitations are visible and evidence-backed. Preparing this checklist does not itself meet those implementation conditions.

## Checklist preparation record

Prepared against the local source SHA above, the existing specs, current registry/schema/server/routes, and archived release/review records. Source inspection confirmed the concrete gaps and corrected migration, deletion, anchor-recovery, and fixture-count claims. The plan was self-reviewed for coverage, dependencies, interfaces, failure cases, and delivery/rollback steps. Application tests, model calls, production mutations, and live acceptance were not run as part of drafting this document.
