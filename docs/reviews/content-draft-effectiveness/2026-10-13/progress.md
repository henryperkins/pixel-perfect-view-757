# Execution ledger — content-draft-effectiveness checklist

Plan: `docs/superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md`

This is a chronological ledger. Early “pending” and “no live call” entries describe those checkpoints; the final outcome is in the closing section and `effectiveness-summary.md`.

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
- At this checkpoint, the first revision had canonical candidate `b92d8bcaeb03df7a60376a147e10938cb9120afcda78d54e88720e95754b9867`; it is now archived in `prior-editorial-revision.json`. The later final snapshot is separately recorded below. Exactly 22 cycle entries change from the original draft; ancillary content and inherited entries are preserved.
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

## Publication and live pilot start

Implementation commit `82efe38df4c5ee571d6c583de144498c93f596f1` was pushed normally to main and published as deployment `36df77ad-e352-4452-a03b-1afdcd8a0e49`. Public source identity matches; CSS is byte-identical and JavaScript parity is qualified by asset-reference hashes and the injected public payment setting (see `publication.json`). The existing Worker is unchanged. Final production build passed.

The published admin prepared and downloaded `frozen-pair.json` before any paid call. Pair hash `21bbc57f6ef4492a1715d5aa645b2c0ca019c0c7be137a88ba68005d5665f10e`; provider Gemini Enterprise, actual requested model gemini-3.8-flash. `pilot-preflight.json` records the pre-generation rubric and file hashes. An authoritative query found zero operator runs, active 0.7.1 and the draft unapproved immediately before start.

Baseline campaign/run `197e497d-8696-4605-a202-f20c562315b8` started at 2026-10-13T09:39:53.531Z using the published explicit $5-cap action. The browser left /content while the durable server advanced to a second attempt, then recovered the run after return. A legacy generic panel showed an incorrect fixed-catalogue case label; actual persisted IDs and new pilot panel counts remain correct. A display-only correction will follow captured-response replay without altering this paid round.

## Completed authorized pilot

Baseline run `197e497d-8696-4605-a202-f20c562315b8` and candidate run `04ac4a72-087f-4747-ba54-407c26f87d7e` each captured all four cases. The candidate preparation was downloaded again and compared exactly equal to the pre-generation full frozen pair. All eight outputs passed the automatic validator; acceptance delta is zero. There were eight attempts, zero retries, zero uncertain captures and $0.879908 reconciled under conservative reservation accounting, below $5. This is not an invoice.

Downloaded raw envelope, full plans, reports and ledgers are in `pilot/`; the unpacker and comparison checks passed. All four candidate keys were selected as I1, submitted and accepted-cited. The final text literally contains every source sentence in two cases; manual source/output tracing confirms semantic use in all four (`pilot/semantic-trace.json`). Sixteen reachable additions remain offline-only, and both global catch-alls remain shadowed by the supported catalogue. No member-use claim follows from synthetic evidence.

Two strict offline captured-response replay attempts failed before transport on the full legacy `transitFixtureHash`. Independent runtime diagnosis reproduced the live hash under local workerd and found one approximately 3e-17 floating-point difference under Node in a legacy transit bracket speed. Four-case plans otherwise match. This is an unresolved cross-runtime replay portability limitation, not a successful replay or changed paid round; preserve both captures and identities. No identity was weakened and no live model call was made to diagnose it.

Two new context-isolated reviewers received only independently shuffled neutral packets, instructions and blank companion schemas. All 16 distinct model/template items are included. Dispatch prompts, hashes and results are retained under `review/`; source/output mapping remains outside reviewer packets.

## Editorial outcome and closeout

Both fresh body/reflection reviews passed artifact validation and failed editorial qualification. Three disputed substantive findings were adjudicated by a third fresh blinded context and upheld. The candidate improves specificity in Mars/Uranus/Neptune; all four unique source questions pass both reviewers. Only two final prompts pass because inherited identity/rest questions reintroduce premises. Repeated optional phase wording affects every candidate body/template item; Saturn additionally regresses in coherence/voice and has an upheld aspect-geometry wording concern. See `effectiveness-summary.md` for concrete remedies and `review/` for unchanged judgments. No extra provider generation or paid review API calls were made.

Display-only follow-up `e1571ef0ca315c0d8ba7e2c48b2f75d7c7dbd22e` passed 38 focused tests, typecheck, scoped lint, formatting and a final exact-commit production build. It was pushed normally and published as `6a97a844-237c-45e0-832e-cc57014ffe9b`. Public identity and authenticated live completion/arm labels match. This does not change the pilot's source82 identity or generation behavior. The Worker remains unchanged.

Final authoritative checks: active0.7.1; draft still `draft`, both review hashes null; two complete evaluation runs and eight results retained. The synthetic operator's admin role was removed; the live page showed “Administrator access required.” All its sessions were deleted and password login disabled while preserving audit/evaluation owner records. No content approval, staging or activation occurred. Main .env hash remained unchanged. The eight-attempt authorization is exhausted even though accounting is below the dollar cap.
