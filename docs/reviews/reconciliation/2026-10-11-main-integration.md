# Main reconciliation record

Integration base: `bb033d3ac85d5c3004b9865d2c399564e00c7dca`. Scope approved
on 2026-10-11 (America/Chicago): integrate planning documents, original blinded
review evidence and qualification results, then reconcile the transit-story app
candidate while preserving main's provider implementation and all local evidence.

## Preservation

A verified all-refs Git bundle, per-worktree staged/unstaged binary patches, exact
ref/status records, and SHA-256-checked copies of 395 files are held at
`/home/ubuntu/.local/state/pixel-perfect-view-757/reconciliation/20261011T235721Z/`.
Copies include all 137 local-only `.superpowers` evidence files and their three
ignore files. The five original working copies, their dirty files, snapshots and
locked session are retained. No branch/worktree cleanup or history rewrite is
part of this integration.

## Content and qualification

- Concrete-writing and transit-story plans/specifications are integrated. Main's
  already completed writing checklist remains authoritative; its older placeholder
  snapshot and session transcript remain recoverable rather than replacing it.
- The 21 original [blinded-review artifacts](../daily-natal-lens/2026-10-11-blinded-review/README.md)
  retain their exact bytes. [Natal writing qualification](../daily-natal-lens/writing-qualification.md)
  records the failed round: 3/8 candidate model positives pass, 0/8 candidate
  templates pass, and 0/8 cases pass both. Disagreements, timeouts, unproven
  generating revisions and missing provider cost remain explicit.
- All original transit replay/response/browser artifacts and the old
  `2026-10-11-daily-transit-story-candidate.json` remain historical evidence.
  Their 404-test and 36-case results describe snapshot `064dddb`, not this source.
  The [reconciled candidate](../../superpowers/releases/2026-10-11-transit-story-reconciled-candidate.json)
  is a separate inactive review artifact. No production content pointer was changed.

## Reconciliation decisions

Main's Lovable member/natal serving path and Gemini Enterprise admin alternative
are retained, including Gemini 3.8 Flash identities, the 60-second daily deadline,
copy selection and durable server evaluation jobs. Transit support adds bounded
proofs, shared birth-window anchors, encrypted immutable chronology, timing cache
and retained accessible contact panels. Later main natal re-screening/backoff,
retry-safe release reads, export row isolation, complete erasure and audit
redaction are preserved.

The fallback remains byte-identical `builtin-0.5.0`, SHA-256
`f68cc97e749d78d6a2332b9d87fb9fc4ce367d61d437ffa19f8485a2778330c1`;
the separate natal candidate remains `builtin-0.6.1`, SHA-256
`b073d625c23b5bede66eba25e37bd3f3397263710dd63ab67d8af06b6e216500`.
The transit candidate uses the current natal catalogue plus five conditional
chapters, never the fallback. An active chapter catalogue and explicitly configured
qualified episode source are both required for episode calls.

The original 28 daily/natal fixtures are retained. Ten synthetic arc cases extend
the current suite to `synthetic-daily-6` (38 rows, at most 37 attempts). New source
identities are `daily-astro-body-9` / `daily-reference-6`. Original natal v5/28 and
transit v5/36 reports remain historical; changed-policy replay requires their
original frozen snapshot. Admin/closed evaluation explicitly selects
`transit-candidate` without activation.

## Verification

Node.js `24.21.0`; dependency installation used the existing `bun.lock` with
`bun install --frozen-lockfile`. No package manifest or lockfile changed.

| Check                                 | Final result                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Main baseline                         | 424/424 tests passed serially before app reconciliation                                      |
| Full integrated suite                 | **484/484 passed**, `node --test --test-concurrency=1 --test-timeout=30000 tests/*.test.mjs` |
| TypeScript                            | `npx tsc --noEmit` passed                                                                    |
| Build                                 | `npm run build` passed; generated output remains local                                       |
| Changed/new code ESLint               | 67 paths, zero errors or warnings                                                            |
| Changed/new Markdown                  | 14 files, Prettier check passed                                                              |
| Whitespace/local links                | Passed                                                                                       |
| Original worktree preservation        | 395 files and five worktree states verified unchanged                                        |
| Frozen review/transit artifacts       | 32 original evidence files verified byte for byte                                            |
| Fresh independent whole-branch review | No remaining material findings after focused recheck                                         |

The first integrated full suite passed 478/480. Its failures reproduced a lost
main active-release read retry and a v5 budget-comparison test running on a v6
report. The retry was restored exactly; historical descriptive comparison and
current strict budget checks now have separate regressions. Independent review
also reproduced historical completed-run download and current natal-comparison
gaps; fixes preserve v5 inventories and allow the declared natal catalogue
experiment while freezing all other inputs. Transit comparisons retain the
separate `storyUse` ablation. Content rollback invalidates retained cycle queries.
The failed first run and all focused checks remain in the recovery directory.

UI checks exercise the real components through offline component tests. The
original browser screenshots remain historical; no new browser/device or
authenticated production verification was performed. Repository-wide lint was
not rerun; changed-code lint is the reported lane.

## Remaining qualification

Native episode repository/source identity, numerical reference tracks, actual-model
transit writing and blinded scoring, source-bound natal requalification, live
Swiss/member-provider/account behavior, chronological-week repetition and content
activation remain open. Build/test evidence does not establish deployment or
production behavior. This workflow invokes no live chart, episode or language
provider, and performs no content publication/activation.
