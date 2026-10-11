# Daily natal lens local validation

Local candidate: `builtin-0.6.0`, schema 3, revision 2. It is an **inactive**
candidate: the built-in fallback stays `builtin-0.5.0` (schema 2, no natal
catalogue), so deploying this code does not activate lenses. The adjacent
[candidate manifest](2026-10-11-daily-natal-candidate.json) contains the complete
bundle, copy checksum, ordered code-file hashes, catalogue keys, policy identities
and replay evidence. Copy checksum (unchanged from the first candidate):
`99ddec7c32088a75e7ff84427c83780415d15402287b0e27e2aa9b206ce8d994`. Normalized
transit-copy hash, equal for the fallback and the candidate:
`4d6048ea1d303410e2845d9dde9960da95749ff7ab20fd886779a4627abc677d`. Final code
identity: `3ab0fd5ad59e480573aa22519e5b4ff0059f72c0700832fbb229e46dbddbe530`
(supersedes `397db233…`). Continuation base: `cc6a3cd26e4582e5f391892b8020f3a746d79627`
on `feat/daily-reading-synthesis`, uncommitted.

## Revision 2

An independent verification reproduced every check of the first candidate and found
no defect against its design, but judged four of its consequences undesirable and
found one older erasure gap. The design's
[Revision 2](../specs/2026-10-11-daily-reading-natal-temperament-design.md#revision-2-verification-findings)
section records the contract changes:

- Lens selection follows the day's contact (`daily-natal-lens-2`): the transited
  body's own rules lead, with Moon rules as the fallback. Moon-first selection had
  given about 90% of known-time readers the same Moon sentence on every lens day.
- The catalogue moved out of the built-in fallback into an inactive candidate bundle,
  and readings without `N1` send the pre-lens request byte for byte.
- While a catalogue is active, Today re-screens legacy, stale-version or retryably
  failed assessments, rate-limited (approved by the project owner, including cost).
- Export isolates one unreadable row; the active-release read retries once.
- Erasure deletes chapter essays and clears birth fingerprints from retained audit
  events.

## Implemented local contracts

- Schema-3 validation extends schema 2; legacy/empty natal catalogues remain
  authoritative. Cycle drafting preserves the 60 base plus two compound entries of
  an active catalogue. [Individual catalogue review](../../reviews/daily-natal-lens/catalogue-review.md)
  records origins, roles, anchors, scenes and practical contrasts. This is agent
  editorial/structural review, not independent approval or psychological evidence.
- The reviewed catalogue ships only in `NATAL_CANDIDATE_BUNDLE`. The fallback is
  byte-identical to the validated prior graph (`f68cc97e…`), and the candidate
  differs from it only by release identity, schema version and catalogue. Activation
  requires publishing the candidate as a release: the signed editorial endpoint
  (which validates and activates it), or an operator-staged inactive row activated
  by an admin.
- Birth saves reuse the central Swiss response and screen two concurrent UTC
  uncertainty boundaries with the existing six-second deadlines. Unknown/degraded
  centers add no requests. While the active release carries a catalogue, Today re-runs
  a missing, stale-version or retryably failed screen through the same calculation
  before computing the reading's identity: at most once per six hours per snapshot,
  never for unknown time, only with a configured service, storing only an improvement.
  A failed attempt records only its time, which never enters cache identity.
- One optional lens follows the documented `daily-natal-lens-2` order and the shared
  template/fact plan. Own-target compound rules are eligible. `N1` sends only curated
  conditional meaning. A request without `N1` matches `cc6a3cd`'s request byte for
  byte, verified for all fifteen pre-natal fixture requests (the quiet case makes
  none). Daily generation still uses one strict body-only call to
  `google/gemini-3.7-flash` under 20,000 ms. Natal essay/question behavior is separate.
- Reliability manifests and exact saved natal copy/origins are owner-DEK-encrypted.
  Canonical decrypted state, not randomized ciphertext, versions the cache; a manifest
  from another reliability version supplies no lens instead of failing. Owner
  reopen/archive/export preserves facts, proof labels and consumed paragraphs.
  Corruption/wrong keys fail closed for owner reads; export marks one unreadable row
  (`unreadable`, counted in `unreadableReadings`) instead of failing every row. Admin
  metrics only count IDs/codes. Failed erasure retains the key for retry; erasure
  also deletes chapter essays and clears `birth_profile.saved` fingerprints.
- The active-release read retries once, then fails closed rather than serving
  built-in copy under the wrong release identity or drafting from the wrong catalogue.
- Evidence labels, saved origin details and primary-parent links are unchanged from
  the first candidate. Privacy and birth accuracy copy remain accurate.

## Automated checks

Node.js `24.21.0`; no dependency manifest or lockfile changes.

| Lane                                                 | Final result                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `node --test --test-timeout=120000 tests/*.test.mjs` | 369/369 in four parallel runs (~3 s each), last on final code     |
| `npx tsc --noEmit`                                   | passed                                                            |
| `npm run build`                                      | passed; build only                                                |
| `git diff --check`, plus untracked files             | passed; no whitespace errors in new files                         |
| Lint on the 49 changed or new code paths             | 0 errors, 0 warnings                                              |
| Repository lint, excluding `.worktrees/`             | 7,553 errors, 6 warnings, all in unchanged files (same as before) |
| Request identity against `cc6a3cd`                   | 15/15 pre-natal requests identical; lens-less natal cases omit N1 |
| Changed Markdown                                     | Prettier-clean                                                    |

The suite grew from 355 to 369 tests. New tests cover the selection order and
fallback, own-target compound rules, the natal-free fallback and transit-copy
identity, the release-read retry, the request brief without a lens, the own-target
record path, the Today re-screen (legacy, inactive catalogue, backoff, unknown time,
stale version, failed attempt), export row isolation and the erasure additions.
Records-level natal tests now activate the candidate release explicitly.

Two earlier parallel full-suite attempts stalled for over ten minutes, in
`reading-language` and then `reading-natal-data`. Each file passes alone (91/91 and
4/4 in under a second). Both stalls coincided with another agent's test suite running
in a separate worktree on the same machine, and neither recurred in four later runs.
They are not counted as passes; the root cause was not determined. The repository-wide
lint count excludes that agent's `.worktrees/` checkout, which ESLint would otherwise
scan.

No live Swiss, external model or production records were used.

## Fixed evaluation

`synthetic-daily-5`: 28 cases, 27 in-memory intercepted attempts accepted and one
quiet-day skip. Selections: duty `nl-moon-10`, freedom `nl-moon-09`, service aspect
`nl-moon-10-aspect-01`, exact house `nl-moon-10-house-01`, own target `nl-sun-03`,
Moon fallback `nl-moon-10`, mixed source `nl-moon-10`, synthesis integration
`nl-sun-03`; boundary, unknown time, degraded and legacy cases have no lens. Both
runners derive manifests through production chart/screen code; synthetic service
labels do not establish live Swiss accuracy. All manual scores remain null.

```sh
npm run eval:reading -- --output "$DIR/baseline-replay.json"
npm run eval:reading -- --write-responses "$DIR/candidates.json"
npm run eval:reading -- --responses "$DIR/candidates.json" --output "$DIR/candidate-replay.json"
npm run eval:reading -- --compare "$DIR/baseline-replay.json" "$DIR/candidate-replay.json" --output "$DIR/comparison.json"
```

Case-set hash `1fec5a7a3842cbc4f374a9058dfa3264294df875db607db2d3a92aa1306f9b07`;
bundle and transit-copy hashes as above; accepted delta zero. Version-5 comparisons
require identical transit copy and model, so a natal-free baseline on the built-in
fallback can be compared with the candidate directly. These are validator and report
plumbing results, not evidence of model writing quality. The artifacts were written
to a temporary session directory; the commands regenerate them.

## Browser coverage

The evidence UI files are byte-identical to the first candidate, whose component
check covered `TodayEvidence` at 1440×900 and 390×844 with reduced motion, keyboard
links, retained collapsed content, a legacy switch and no console errors. It was not
re-run for revision 2. Live signed-in account, actual device and production-source
verification remain open.

## Activation notes

- Activation is an explicit release action; this record performs none.
- After activation, each existing reader's next Today load re-screens once: up to
  three Swiss requests, waiting for them (bounded by the six-second deadlines). A
  failed attempt waits six hours before the next.
- Independently of activation, the prompt/validator identities change the reading
  cache key, so each active reader's first Today load after deploy regenerates once.
  Readings already cached for that day keep their rows and feedback.

## Remaining qualification and release work

- Independent approval of the authored catalogue.
- Fresh actual-model reports on identical frozen v5 inputs in an isolated
  environment: baseline with no active release, candidate with the candidate release
  activated, with cost/failure evidence.
- The same blinded reviewers scoring actual candidates and templates: specificity,
  grounding and lens integration each ≥4/5, zero unsupported personal claims, a
  supported duty/freedom contrast, no natal claim in negative cases, and a read for
  repetition across a week of contacts to one body. See the
  [writing qualification record](../../reviews/daily-natal-lens/writing-qualification.md).
- Any explicitly requested publication, activation or deployment, and
  live-account/source checks, including the actual production prior pointer.

The prior `builtin-0.5.0` graph is now both the built-in fallback and the validated
rollback target. No model spend, real Swiss request, production pointer change,
deployment, commit or history rewrite occurred.

## Addendum — 2026-10-11, writing qualification round

Recorded by the
[writing qualification checklist](../plans/2026-10-11-daily-reading-writing-qualification-checklist.md).
The sections above describe the earlier local phase and stay as written.

- **Code.** The inactive candidate code was committed and reached `main` in merge
  `4c96fd5` (pushed 2026-10-11T18:30:19Z). The public app was observed serving
  `4c96fd5` at 19:55Z; that publication was not performed by the qualification
  session. Lenses remain inactive: the fallback is still `builtin-0.5.0` and no
  release row carries the catalogue.
- **Commands.** Offline runs now require `--bundle builtin` or
  `--bundle natal-candidate`. The commands under "Fixed evaluation" predate that
  flag and are historical; current commands are in
  [Reading evaluation](../../../READING-EVALUATION.md).
- **Catalogue.** `builtin-0.6.0` failed the AI catalogue review: both fresh
  reviewers found `nl-sun-03` (scene belongs to expression) and `nl-venus-08` (no
  ordinary scene). It is superseded by `builtin-0.6.1` (copy checksum
  `b073d625c23b5bede66eba25e37bd3f3397263710dd63ab67d8af06b6e216500`, transit copy
  unchanged), which changes only `nl-sun-03`, `nl-moon-09` and `nl-venus-08`; see
  its [manifest](2026-10-11-daily-natal-candidate-0.6.1.json). Its offline replay
  accepts all 27 attempts with the same selections. `builtin-0.6.1` passed the AI
  catalogue review (two fresh reviewers and one adjudication); human approval stays
  deferred. Evidence:
  [catalogue review](../../reviews/daily-natal-lens/catalogue-review.md).
- **Actual-model experiment.** A hosted `natal-candidate` run of `builtin-0.6.0`
  stopped on its first case with gateway code `credit`; nothing was retried. Both
  hosted runs (the `builtin` baseline and the `natal-candidate` candidate) must be
  repeated on the revision that serves `builtin-0.6.1`, which has not been pushed.
- **Still open.** The matched actual-model experiment and its blind writing review,
  live Swiss and owner-path checks, human approval, and any requested publication
  or activation.
