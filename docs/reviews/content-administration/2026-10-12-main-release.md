# Content administration release preparation — 2026-10-12

The release integrates the content-page remediation handed off in `session-ses_ed01.md` with main at `05164fe3418a5dae2f180b801f9d9e19a2edb859`. It also archives the completed [Gemini Enterprise investigation and existing-output review](../daily-transit-story/2026-10-12-enterprise-investigation/README.md). This record describes pre-publication verification; a Git push alone is not proof of deployment.

## Changes

- Expose the server-derived admin role in the current session, hide Content navigation from members, and prevent member sessions from fetching administration data.
- Organize Content into candidate drafts, published releases, the durable ledger, reading quality, and synthetic evaluation. Keep release-inventory failures independent of the other sections.
- Show complete draft entries and reflection questions, expandable synthesis rules, filtered-entry counts, and transit/natal coverage. Preserve provider availability checks in both drafting and evaluation.
- Distinguish activating a newer release from rolling back to an older one, record the previous version and actual operation in the audit event, and stop before changing the pointer if its current state cannot be read.
- Use accessible confirmation dialogs and shared Button controls. Describe discard as a status change, and retain measurement limitations so validator acceptance is not mistaken for editorial qualification.
- Reconcile DESIGN.md with the existing sage palette and Nunito Sans typography.

## Verification

The final source passed:

- `npm test`: 564 tests, 562 passed, 2 existing skips, 0 failures.
- `node_modules/.bin/tsc --noEmit`.
- ESLint on all eight changed TypeScript/TSX/test files.
- `npm run build` and `git -c core.whitespace=cr-at-eol diff --cached --check` (the archived CSV retains its original CRLF line endings and hash).
- Integrity checks for all 33 hashed investigation artifacts plus their manifest; a credential-pattern scan found no matches.

The regression coverage checks admin-role grants and revocation, rejects non-admin activation, distinguishes initial activation/forward activation/rollback, and verifies that an unreadable current pointer leaves both activation and the audit untouched. The pointer-read regression first failed before its implementation fix.

Chromium checks exercised the actual Content route and Shell with synthetic server-function responses at 1440×1000 and 390×844. They verified all five sections, both unavailable-provider controls, full entry/question and rule expansion, activation and rollback confirmation, cancellation without mutations, discard confirmation/cancellation, release-inventory failure and retry, and member access/navigation on desktop and mobile. The expanded mobile page had a 390px document width in a 390px viewport. There were no console errors after correcting an incomplete synthetic rule fixture. Screenshots and the fixture remain local under `output/playwright/` and `.release-browser.local/`; these checks did not sign in to production or call a language provider.

The first local attempt used an outdated dependency installation and was not a qualifying run. Final checks used the installation from the existing assistant-activation worktree after confirming identical `package.json` and `bun.lock` files.

## Scope and open acceptance work

This release does not activate another interpretation bundle or change member-provider routing, Gemini timeout/thinking settings, OAuth consent settings, or `PATTERN_ASSISTANTS_ENABLED`. No database migration is required by these changes.

The user's backlog assessment remains open: concrete writing is unstarted; assistant live acceptance, writing qualification, synthesis/natal/transit sign-off, R1 work, original MVP gaps, and language-layer workflow gaps are unfinished. The user verified the assistant status on `05164fe`; the remaining backlog statements came from earlier agent reviews and were not independently re-audited for this release. The archived single-report AI review is not a substitute for the current-prompt qualification round, human editorial approval, repetition review, or signed-in production acceptance.

The original stash, conflicted source copies, index backup, local environment file, unrelated untracked files, and earlier worktrees are preserved. Integration uses ordinary commits and a normal push, with no published-history rewrite.
