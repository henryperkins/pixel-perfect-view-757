# Privacy, account lifecycle and retention release

Tasks 2–4 of the approved release-completion checklist. Source validation, publication and production acceptance have separate receipts.

## Changes

- Marked moments appear as **Your context** beside matching days, windows and chapters only with `USR-07`. Owner Journal management remains separate. `USR-11` enables previous resonance on the same interpretation; `USR-14` enables a local area label and initial Timing filter. These inputs never change astronomical ranking or provider requests. `AMB-05` stays visibly unavailable until its separately planned consumer is qualified.
- Consent revocation commits its setting, audit and signal removal together. Reading writes and long member, export and assistant reads recheck applicable consent/key state at their final boundary. Wellness saves check consent inside the actual SQL write.
- **Reset personalization** preserves login, chart, saved readings and Journal while clearing optional reuse permissions/preferences and derived chapter caches. **Delete account** verifies the current password, removes local assistant access first in the same transaction, and deletes the owner with all FK dependants and sessions. Requests holding erased keys cannot save delayed ciphertext. Cookie/private queries clear only after successful deletion.
- Export schema `pattern-account-export-1` paginates retained saved records independently of UI limits, decrypts saved evidence without calculating or generating content, reports counts/authentication omissions, and marks unavailable archives explicitly.
- New readings separate astronomical text/paragraphs from encrypted expiring context/reflection. Readers and exports withhold expired or revoked copies. Legacy inseparable bodies become unavailable at their earliest applicable cutoff. Legacy encrypted transit stories supply device-clock expiry metadata without recalculation. Non-UTC clock-bound archives are unavailable after permission revocation or 90-day expiry.
- `RetentionWorkflow` fixes its cutoff, commits pages of at most 100 owners atomically, and records counts-only complete/failed R2 receipts. UTC cron: `0 3 * * *`. No model or evaluation table is involved.

## Data scope

Check-ins preserve the complete cutoff civil day, matching the existing contract: clear wellness after the 180-day cutoff day and ordinary fields/note after the 730-day cutoff day. Valid current days in UTC+14 are accepted. Device timezone changes never move stored cutoffs. Events and feedback expire from `created_at` at exactly 1,825 and 730 days; editing does not extend the event clock. Persisted signals respect both explicit expiry and registry duration.

Lifetime birth/chart snapshots, features and astronomical cycles remain until owner deletion. Inseparable mixed archives may lose their derived body while retaining an unavailable record. Expiring source details and encrypted copies are removed together. Check-in notes follow ordinary check-in retention. Audits retain operation metadata, not notes/bands. Existing nightly R2 artifacts contain release/operation payloads, not member reading text. Device-clock/time-bucket request values are transient except for the guarded saved copies.

Pattern owns its D1 identity link and grants. Removal stops all Pattern tools, including already-issued delegated tokens; the MCP wrapper checks access again before releasing results. Separate assistant sign-in/Google accounts, remembered provider authorizations and provider backups are kept. The UI states this scope. Acceptance credentials, backups and session state remain outside Git.

## Validation and open gates

Local regressions cover two owners, 600+ records per export category, wrong password, two sessions, full owner FK deletion, atomic failure, erased-key delayed writes, held-request revocation, UTC+14/-12, exact expiry, no-visit owners, retained astronomical ciphertext, legacy clocks, page rollback/counts and Workflow continuation. Nine fixture browser checks cover consent off/on, owner Journal, saved focus, unavailable season, password failure, focus/cancel and 390px reduced motion.

Fresh review reproduced and closed the civil-day, source-revocation, legacy-clock and partial-page defects. Final review found no code blocker. Final test totals, app commit, Worker version, migrations and live acceptance belong in the manifest/publication receipt. Writing qualification, human editorial approval, real Google assistant acceptance and later product tasks remain independent gates.

## Migration and rollback

Additive migrations: `20261012_context_preferences`, `20261012_context_retention`. Use the named runner after inspection; never apply bootstrap SQL over production. The private pre-upgrade backup has 26 tables, stable Time Travel bookmark, zero FK errors and SHA256 `3d473878e4d0b2f6459d7d10f9c24744529f7663aeb5dcfcc69b80b298ff21b6`.

App rollback: commit `a267d073a58af38c31bbd41cabef42d51924ed54`, deployment `c12cdc82-e831-4d55-94d3-a73d7bc713a8`. Retain additive columns/ledger during a code rollback. Stop the retention cron before any authorized backup restoration. Code rollback cannot restore deleted accounts or expired data; never restore erased private data merely to reverse this release.

## Released result

Application `5bc7e4b6cab2995a8af8558bcbf5d18f60340683` is on main and published as `d1471321-9293-4240-88b0-fa3752f24d77`; four live assets match. Both migrations are applied, encrypted payloads were unchanged by the upgrade, and foreign keys pass. Worker `cc8d53f5-59c6-40f2-aa2a-8952cac8c045` retains its secret/data bindings and all three workflows, with the 03:00 UTC cron. Final suite: 630 tests, 628 passed, two existing skips, zero failures; typecheck, scoped lint and build passed. Nine fixture and fourteen production browser checks passed.

The first retention page failed because the existing production `language_mode` column is non-null. Its transaction rolled back and a failed R2 receipt was preserved. A red regression reproduced that constraint; the correction retains historical mode, clears private evidence/model, and marks the archive unavailable. After publication, manual resume completed one 15-owner page. Repeat acceptance removed one newly seeded expired ambient signal with every prior purge count zero. Retained journal and astronomical ciphertext remained identical. See [publication.json](publication.json) for complete counts and source/deployment boundaries.

The purpose-created account was deleted. All 21 owned-table checks were empty, other owner row counts stayed the same, the current cookie cleared, an unexpired second session was denied, and the old credentials could not sign in. No paid model call was made. Actual Google/delegated-token acceptance, chart-linked attachment/story acceptance, writing qualification and human editorial approval remain separate gates.
