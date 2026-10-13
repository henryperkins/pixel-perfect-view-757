# Execution ledger — content-draft-effectiveness checklist

Plan: `docs/superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md`

- Baseline: `c3619c061f2b8ca3579b94979cc9cce9959c443c`; branch `feat/content-draft-effectiveness`; isolated `.worktrees/content-draft-effectiveness-20261013`.
- Main checkout preserved: `.env` SHA256 `d1d4e605edd14896ba7feb163ce1ac2d2d42a95dd80efae0949a30000369e8e9`; unrelated transcripts/directories remain outside the implementation worktree.
- Dependencies: `bun install --frozen-lockfile` succeeded; package SHA256 `a22b5b71fece414a3fd4c219deb1d62b614c16bfcbb09bfcd30dfa7d240483a8`; lock SHA256 `d464759ac5d20f3be380c28a16e9d68126d2a3645b15ff5a074615badaad5667`.
- Ruling: User's replacement AGENTS instructions resolve provider policy. Member/natal writing uses explicit `PATTERN_MEMBER_LANGUAGE_PROVIDER`, otherwise Enterprise if configured, else Lovable; never provider-failover retries. Preserve that behavior and qualify on the selected member provider.
- Ruling: User rejected the proposed 138 paid calls and authorized an eight-call pilot with a $5 total generation cap. Full 70-case regression remains offline. Pilot has four changed-entry cases × baseline/candidate; a full targeted pair is not authorized. A pilot cannot be called full 20-key live qualification or human editorial approval.
- Preflight: source resolver → plan freezer shares complete bundles and identities; plan freezer → durable runner shares frozen suite, policy and source hashes; runner → UI/report exports shares manifest and per-stage coverage. Preserve legacy source selectors and historical hashes.
- Preflight: full plans include source SHA, so legitimate implementation changes alter plan hashes; preserve legacy case/config identities and policy counts rather than old whole-plan hashes.
- Implementation tasks 0–10 are in progress; no paid call, publication, human approval or content activation has occurred.

## Verified implementation and source update

- Resolver: 19 new tests plus 9 existing comparison tests passed. Freezer/controller initial focused verification passed 17 tests; reviewer then identified candidate-capture validation, cross-arm model drift, and role-revocation claim races, which are being tightened before release.
- Full authoritative source archived in `original-source-snapshot.json`. D1 source is open draft `5b1a0e46-a1eb-4a36-90b9-d884993cf212`; original canonical hashes exactly match the attachment.
- Revised source is `revised-source-snapshot.json`, canonical candidate `b92d8bcaeb03df7a60376a147e10938cb9120afcda78d54e88720e95754b9867`. Exactly 22 cycle entries change from the original draft; ancillary content and inherited entries are preserved.
- The revised bundle was saved through the published admin's existing guarded **Save candidate** action. A subsequent authoritative full JSON equality query matched it. Draft status remains `draft`, review hashes remain null, and active release remains 0.7.1. No approval, staging or activation was performed.
- Actual full-bundle offline inventory: 70 cases, zero model calls; legacy 50 select zero changed entries, targeted 20 reach all 20 additions. See `offline-coverage.json`.
- A purpose-created synthetic evaluation operator and two-hour browser session were provisioned for authenticated checks, without email delivery or member data. Private session material remains outside Git at `/home/ubuntu/.local/state/pattern-content-pilot/20261013/`. Remove its role and sessions after the run; preserve evaluation evidence and its owner record without a usable login.
- Browser CLI uses the installed Chromium executable with `/tmp/pattern-content-browser.json`; default Chrome distribution was absent. No browser install or dependency change was needed.
- Eight-call/$5 authorization remains unchanged. No live model call has been made.

## Validation checkpoint

- Full suite after cache isolation: `node --test --test-concurrency=4 --test-timeout=120000 tests/*.test.mjs` — 840 tests, 838 passed, 2 existing skips, 0 failed (55.9s). Initial concurrent run is retained at `/tmp/pattern-content-full-tests.log`: it encountered in-flight implementation changes and a shared Vite cache `ENOTEMPTY`; it is not a passing run. The final log is `/tmp/pattern-content-full-tests-final.log`.
- `tests/helpers/records-harness.mjs` now assigns each harness its own temporary Vite cache. The affected retention/controller/provider group passed 34/34 independently after that fix.
- Typecheck, scoped ESLint and preliminary production build passed. Later UI/CLI finishing changes still require their focused checks and final source build before publishing.
- Existing Worker protocol is unchanged. Read-only Cloudflare inspection found deployment `debd4c29-901c-45b1-9a55-a19d0fce31bb`, version `83d0842f-9898-4402-83cd-cd3d5b003440`, 100% traffic, created 2026-10-13T08:11:32.584653Z. No Worker deployment or migration is required by this change.

## Editorial refinement before generation

Independent unblinded source review found repeated comparison explanations and three awkward passages in revision 2026-10-13.1. Revision 2026-10-13.2 corrects them without provider calls. Re-review found all 22 pairs met the source-only >=4/5 targets and question checks. See `source-editorial-review.md`; this is not human approval. The prior revision is retained.

Final full bundle canonical hash: `78be37d2740102c827fd291777f43f686b9c9f3488c887d76c00212ca84db632`. Saved again through the guarded published UI; authoritative complete JSON equality matched it, with status `draft` and null approval hash. Offline 70-case coverage was regenerated for this hash; the inherited content and 22-key change scope remain unchanged. No live model call has occurred.

Final UI and CLI changes passed their focused checks: 50/50 in the root integration run, clean TypeScript and scoped ESLint. The CLI owner separately passed 70 combined regressions and 10 final report tests; UI owner passed 14 tests and recorded desktop/mobile mocked Chromium evidence, including delayed polling and inactive-release selection. The complete machine delta is exactly 20 additions, 2 changes, 109 unchanged rows. Final isolation extensions are pending their focused result before commit.

Final isolation extension passed 12/12 controller-file tests, including normalized complete snapshots of every non-evaluation table, populated idless/composite-key cases, phase-separated SQL allowlists, and unavailable candidate fallback after draft/active-pointer changes. No member data was read by the steps and no retries occurred. The final source review and all implementation findings are closed. Final publication build is next.
