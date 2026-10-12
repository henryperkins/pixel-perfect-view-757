# Transit-story original local candidate

This is historical validation of snapshot `064dddb`, preserved with its original
replay, response, screenshot, and candidate bytes. Current reconciliation and
checks are recorded in [the integration record](../reconciliation/2026-10-11-main-integration.md).

At the time of this validation, this was an uncommitted app candidate in `.worktrees/transit-story` on `feat/daily-reading-transit-story`, based on `cc6a3cd26e4582e5f391892b8020f3a746d79627` plus the 65 prerequisite files frozen at setup. The original checkout is being edited concurrently by another session; integration must reconcile its later changes. This task writes no original source files or published history.

The local app delivers qualified anchor storage, a disabled bounded episode client, proof and uncertainty validation, five release-owned chapters, A1/P2 prose guards, encrypted immutable cache/archive/export evidence, and a shared accessible contact sequence. Supported primary bodies are Jupiter, Saturn, Uranus, Neptune and Pluto. Primary ranking, orb policy and the existing reflection fields remain unchanged.

## Open release gates

- Native episode-service repository, source commit, endpoint and reviewed source identity are unavailable. Follow-up [source discovery](source-discovery.md) identifies the existing chart provider as hosted AstroWay, without an accessible backend repository to extend. Fifteen independent real Swiss tracks, event deltas, source frame/files/flags, coverage, latency and resource-budget qualification remain required. No episode endpoint or source ID was configured.
- Actual-model baseline/candidate writing and blind review remain unrun. Offline synthetic replay supplies structural evidence only.
- No inactive release has been inserted into a database; the candidate JSON is a review artifact. No activation, commit, push, service deployment, app deployment or production verification was performed.

## Verification

- Full Node suite: **404/404 passed**, via `DEBUG=vite:load,vite:transform npm test -- --test-concurrency=1 --test-timeout=30000`. The environment had intermittent Vite module-load stalls in earlier runs; a prior complete run was 395/400, and all five failures were repaired before this complete green run. No failure retry was added to the tests or service clients.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed. Build output remains local; its generated Worker configuration was not deployed.
- `npm run lint -- --format json`: 7,537 pre-existing errors and 6 warnings; all implementation-owned source/test files have zero errors or warnings. The prerequisite baseline was 7,553 errors and 6 warnings; formatting owned files removed 16 existing errors.
- `git diff --check`: passed.
- Focused final review regressions: 20/20 passed before the full suite. The review found and fixed inconsistent monotonic-track points, unsupported return/passage claims, and repeated Timing/Time Travel episode calls. Added owner-erasure/retention coverage brings the final suite to 404.
- [Browser results](browser/results.json): Chromium, seven states at 390px and 1280px; keyboard open/close, retained/inert panels, no collapse requests, no horizontal overflow, no page/console errors during the final check; reduced-motion transition is `0s`. Screenshots: [mobile five contacts](browser/five-390.png), [desktop five contacts](browser/five-1280.png), [uncertain range](browser/range-reduced-mobile.png). Initial harness-only favicon/HMR issues were removed before this check.
- Offline baseline and candidate: **36 rows, 35/35 accepted replay attempts, one quiet skip each**; manual scores null and no real model calls. [Comparison](replay-comparison.json) changes only `storyUse` from false to true. [Baseline](baseline-replay.json), [candidate](candidate-replay.json), and separate response files are frozen synthetic evidence.

The baseline checkout is `/tmp/pattern-transit-baseline-20261011`; candidate is `.worktrees/transit-story`. Both use the same raw fixtures and catalogue. Their only evaluation policy difference is `SYNTHETIC_STORY_ENABLED`. The baseline's input response file omits story prose while preserving the combined S1/N1 case.

[Inactive candidate](../../superpowers/releases/2026-10-11-daily-transit-story-candidate.json) includes the complete validated graph, file hashes, policy identities and replay hashes. Native source identity and writing qualification remain unset. Browser evidence uses the actual timing components and global styles with synthetic qualified evidence in an isolated fixture. It does not establish authenticated production behavior or native-service accuracy.

## Implementation decisions

- Work against the frozen prerequisite snapshot in an isolated worktree while earlier external writing gates remain open; later integration may need adjustment.
- Keep the source disabled until its repository and numerical qualification can be established.
- Permit A1 dates only inside the unchanged server chronology sentence; other dates retain the original per-cycle checks. This narrows permissible model wording.
- Keep unavailable results immutable under the same source/content identity; changed configuration creates a new reading identity.
- Encrypt the overlaid C/P/T facts in addition to A1/P2 because their qualified dates are derived personal chronology.

## Review and timing retention

The independent review raised three Important findings; no Critical or Minor findings. All three regressions were first observed failing and then passed after fixes. Reference, contacts, station brackets and orb edges must describe the same monotonic track, including equal-time consistency across samples. Return/passage count and finality vocabulary now uses the same fail-closed guard as pass/contact vocabulary, even when no story is supplied.

Timing exploration retains client query results for a selection, with explicit calendar/birth/consent invalidation. A bounded server cache coalesces duplicate requests using an HMAC identity containing owner, snapshot, canonical anchors, day/timezone, primary, source policy and chapter release. It holds at most 64 selections in private worker memory for 15 minutes, includes immutable unavailable results during that retention, and clears an owner's entries on erasure. Cold workers or expired/evicted entries can calculate a new exploration result; saved daily reading history remains durably immutable in the encrypted database envelope. No persistent cache table was added.

The reviewer could not judge native numerical accuracy/deployed latency or actual-model writing quality. These are open gates, not accepted substitutes for testing. Activation remains disabled until both are qualified.

Candidate checksum: `b1e9bbd7b88c426261821c96ea56a3a6b9a92e6aa2aa1f71b87dd215ee847144`. Source snapshot: `510c4d0e91537fbd4d6cdc0caeb9726a83e75fabe70c1702292f197fff6f448d`. Raw transit fixture hash: `2025ee9077bb7c0053af5c601e076d7d0858754644901f680862090f01d665f7`.
