# Daily writing qualification — release record

Plan: [writing qualification checklist](../plans/2026-10-11-daily-reading-writing-qualification-checklist.md).
Protocol: [`daily-writing-ai-review-1`](../../reviews/daily-reading-writing/review-protocol.md).
Evidence: [evidence index](../../reviews/daily-reading-writing/2026-10-11/evidence-index.md).

**Status: not qualified.** The ordinary/synthesis correction (prompt
`daily-astro-body-8`) failed its first blinded AI writing review. It is deployed,
but it is not an AI-qualified release. Each result below is reported separately;
none stands in for another.

## Results

| Result                       | Status                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Implementation and checks    | Merge `4c96fd5` passed the full suite, typecheck and build before its push. Later commits on the branch (tooling, natal copy `builtin-0.6.1`, records) pass 401/401 tests at `67805ea`.                                                    |
| Git sync                     | `origin/main` = `4c96fd5`, pushed 2026-10-11T18:30:19Z with a normal fast-forward; Lovable reported the same `latest_commit_sha`. The later branch commits are not pushed.                                                                 |
| Public deployment            | The public app served `4c96fd5` at 19:55:30Z (`index-GoBnfK44.js`; at 18:30:40Z it still served `index-DDwSyCYe.js`). The owner reports having most likely published it; the time is unknown.                                              |
| Hosted natal-free run        | Complete: 28 cases, 27 model attempts, 26 accepted, one validator rejection (`jupiter-trine-sun-technical`, `sentence`), one quiet skip. Matched to the pre-correction run on all inputs, copy and model. Median attempt latency 11.552 s. |
| Validator integrity          | Offline replays of both live reports reproduce all 28 outcomes each.                                                                                                                                                                       |
| Blinded AI writing review    | **Failed** ([record](../../reviews/daily-reading-writing/2026-10-11/writing-review.md)): 17 corrected-run items fail, 9 model drafts and 8 template fallbacks. Grounding improved (mean 3.28 → 4.37); repetition worsened (3.80 → 3.22).   |
| Human writing review         | Deferred (`humanReviewCompleted: false`).                                                                                                                                                                                                  |
| Cost                         | Unknown. Reports return no usage; one complete suite makes at most 27 calls. No cost is inferred from latency.                                                                                                                             |
| Gateway                      | The natal-free run succeeded. A following natal-candidate run stopped on its first case with code `credit` (no available credit); nothing was retried.                                                                                     |
| Effective production content | Observed through the preview's content admin just before the hosted run: one inactive release (`ai-20261011163222`, no natal lenses); the active copy is the built-in fallback `builtin-0.5.0`. Content was not changed.                   |
| Authenticated smoke of Today | Not run. With the gateway out of credit, a check would only show the template fallback, and it would save that reading for the owner's day.                                                                                                |
| Natal lenses                 | Inactive. Candidate `builtin-0.6.1` passed the AI catalogue review (human approval deferred); the matched actual-model natal experiment has not run.                                                                                       |

## Operational consequences

- **Cache.** The Today cache key includes the prompt identity, so each active
  reader's first Today load under `daily-astro-body-8` regenerates once. Older rows
  and feedback stay. While the gateway has no credit, that regeneration falls back to
  the template and is reused for the rest of that day.
- **No migration.** The correction changes no schema and activates no content.

## Rollback

Roll back with a forward revert commit of the correction, a normal push and a
Publish in Lovable; never rewrite published history. A rollback is another prompt
identity change: readers regenerate once more, and saved readings and feedback are
not rewritten. Content needs no rollback, because no content pointer changed.

## Next correction round

The [writing review](../../reviews/daily-reading-writing/2026-10-11/writing-review.md)
names what a second round must change: keep `T1`'s window position separate from the
exact date, keep the conditions of enabling statements, give the template fallback a
connected form, and watch repetition. It needs a new prompt identity, a fresh hosted
run (at most 27 calls, after gateway credit is restored) and fresh blinded reviewers.
