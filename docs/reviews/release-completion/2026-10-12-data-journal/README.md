# Data foundation and journal editing — 2026-10-12

This is the first implementation slice of the [approved completion checklist](../../../superpowers/plans/2026-10-12-release-completion-checklist.md), covering Tasks 1 and 5. It started from current main `6d55d5654f369fff51c747ac24934e2109c56b29`, preserving the newer landing and transit-calculator work.

The signed D1 client now supports atomic batches through the existing Worker endpoint. The migration CLI defaults to inspection, adds only absent columns, rejects incompatible existing definitions and changed applied SQL, and commits the additive schema upgrade with its immutable ledger entry. Production already had journal body/attachment columns; the applied upgrade added only `updated_at`, `revision`, and the migration ledger. Reinspection reports no pending changes. A consistent private SQLite backup of all 25 application tables and a Time Travel bookmark were captured first; the two existing journal rows' original payloads were byte-equivalent after migration.

Members can edit encrypted journal titles and bodies. Owner and revision predicates protect the actual update, including a concurrent change after the ownership check. Date, domain, cycle, and chapter attachments remain unchanged. Failed saves keep the draft; conflicts display the newer saved text and require deliberate reconciliation. Opening focuses the title, and save/cancel restores the originating control. Journal invalidation refreshes the existing TodayJournal component.

## Verification

- Full application suite: 593 tests, 591 passed, two existing skips, zero failures.
- TypeScript typecheck, scoped ESLint, production build, and whitespace checks passed.
- Local migration fixtures cover old, partial, and current databases, encrypted-row preservation, repeated application, malformed schema, atomic rollback, and default CLI inspection without writes.
- Administrative transport tests cover the supported batch wrapper, failure without replay, and incomplete responses. Production read-only checks confirmed `{batch:[...]}` returns both requested results; the top-level array is rejected by this endpoint. The app continues to use the separately signed `/d1/batch` endpoint. See Cloudflare's [D1 batch transaction contract](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
- Fresh code review found an editor-focus defect, which was fixed and checked. Its inferred administrative request-shape concern was withdrawn after observed contract verification. The reviewer reran 21 focused tests successfully and found no remaining blocker in this slice.
- Sixteen Chromium checks used the real Journal route, Shell, editor, and TodayJournal with synthetic services. They cover save failure/retry, cancellation without mutation, conflict/reconciliation, preserved attachments, focus, Today refresh, create/edit/delete at 390px and desktop, and reduced-motion mobile layout without horizontal overflow.

Browser fixtures are local verification, not signed-in production acceptance. The first browser script lost its expected editor during fixture hot reload; the stable run began with a fresh navigation and explicit Edit action. No application retries were added to hide it.

## Delivery and evidence

Application commit `a267d07` is on main and published as deployment `c12cdc82-e831-4d55-94d3-a73d7bc713a8`. [Publication receipt](publication.json) records four byte-matched live assets and live create/edit/reload/cancel/mobile checks on `https://patterns.lakefrontdigital.io`. Production attachment/recomputation acceptance remains open until the controlled chart checks. A Git push alone does not close that gate. The local execution ledger is in the isolated worktree under `.superpowers/sdd/2026-10-12-release-completion-checklist/`; screenshots remain under `output/playwright/`. Private backups are under `/home/ubuntu/.local/state/pattern-release-completion/20261012/` with restricted permissions; credentials, account records, and ciphertext backups are excluded from Git.

Remaining privacy/deletion/retention work, birth feedback, legacy-anchor recovery, assistant activation, and all writing qualification gates stay open in the master checklist. This slice changes no provider routing or interpretation release. Previous app code remains compatible with the additive journal columns.
