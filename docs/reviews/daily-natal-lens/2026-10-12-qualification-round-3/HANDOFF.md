# Handoff prompt — natal remediation and closed partial round 3

Copy the following prompt into the next Codex session:

---

Continue the natal writing qualification work in
`/home/ubuntu/pixel-perfect-view-757/.worktrees/integrate-planning-natal-transit-20261011`
on branch `fix/natal-prose-remediation-20261012`. The operator requested a stopping
point and handoff. Finish read-only review and documentation work against the
available evidence; keep natal and transit candidates inactive. Do not start new
paid model calls unless the operator explicitly requests a new evidence round.
The interrupted run is closed, cannot resume, and must never be retried or
backfilled. Preserve all local-only evidence and main's provider implementation.

Read `AGENTS.md`,
`docs/reviews/daily-natal-lens/writing-qualification.md`,
`docs/reviews/daily-natal-lens/2026-10-12-remediation-round-3.md`,
and the round-3 `README.md`, `interrupted-evidence-index.json`,
`interrupted-run-audit.json` and `run-finished.json` before acting. Inspect Git
status/log; preserve unexpected work. No push, merge into main, deployment,
publication, activation or history rewriting is authorized by this handoff.

## Current source and verified changes

- `afb4896ac963a67baf29bcb9687cf7ae25351671` records the completed failed round-2
  qualification. Its natal-positive result was 6/9 models, 9/9 templates.
- `948aa00ed8935a6026904461831844a47e98356c` is the **round-3 generating source
  freeze**. Later documentation/evidence commits do not change its source.
- Model guidance preserves subjective “feels like yours,” N1's independent
  condition, transit-to-natal roles, and the current reading's window position.
  Bounded guards reject the observed causal/allocation/current-sky/timing errors.
  They do not establish arbitrary semantic support; the source-bound freedom
  matcher can also reject negated causal wording.
- The warm natal-free fallback develops its calendar/quiet-task scene once,
  then its contact's tension, without “Taking this gently:”. It binds both full
  published sources; edited source copy invalidates that composition. All nine
  natal-positive template bodies remain byte-identical to round 2.
- Policies: `synthetic-daily-6`, `daily-astro-body-11`, `daily-reference-7`,
  `daily-synthesis-1`, `daily-natal-lens-2`, `natal-reliability-1`.
- Verification: five claim regressions and two warm regressions failed before
  fixes; final **506/506 application tests**, typecheck, scoped lint and build
  passed. Build retains existing TanStack/bundling warnings. No browser/hosted
  or production-user verification occurred. Do not duplicate passing app checks
  unless source changes or a new concern justifies it.
- Provider transport functions, member Lovable default, model identities and
  serving deadlines remain unchanged. Gemini Enterprise is synthetic/admin-only.
  Source and main serving deadline remain 60,000 ms.

## Closed actual run — partial, never qualification

The runner was stopped with SIGINT at the current case boundary, finished that
case, checkpointed and exited intentionally with code 1. `run-finished.json`
records `halted`, `operator_stop_after_current_case`, no unsettled case and source
unchanged throughout. It contains **37/38 settled cases per bundle, 72 real
transports, 69 lossless drafts, three timeouts, two quiet controls, zero retries**.

| Lane            | Model attempts | Accepted raw drafts | Timeouts | Quiet |
| --------------- | -------------: | ------------------: | -------: | ----: |
| Built-in        |             36 |                  35 |        1 |     1 |
| Natal candidate |             36 |                  34 |        2 |     1 |

Timeouts are baseline `jupiter-trine-sun-technical`, candidate
`natal-unknown-time` and candidate `natal-degraded-positions` (120,000 ms each).
`arc-synthesis-natal-integration` was **unattempted in both lanes**. Eight of nine
natal-positive pairs have raw drafts; candidate raw negative coverage is 2/4.
Every fresh raw output remains **unscored**. Guard acceptance is not semantic
approval. No round-3 packets, reviewer contexts, scores, adjudication or complete
report inventories were produced.

This is a local production-module synthetic capture lane, **not hosted execution**.
A recorded Vite-only diagnostics substitution raised this runner's deadline to
120,000 ms, with original/transformed module hashes and exact specification bound
in the source manifest and plan. Provider/native generation configuration stayed
unchanged. Captures at 120 seconds cannot qualify 60-second serving availability.
Successful token counters do not establish monetary cost; failed-request usage
and monetary cost remain unknown.

Frozen runner SHA-256:
`b0616656b470dc9e482e907a008a6a061f1d7b641d1a62e526e23305480d518b`.
Tracked 171-file source aggregate:
`a50ca0c80f0998ff2c884ad70c5e9fa6548d7e60f30aabbe29bac31017fad7e0`.
Baseline partial report SHA-256:
`6f5c34c08fd2a4cbd4d9b8e247594eaa091707cb2c566c84c0760cb28f3f65f5`.
Candidate partial report SHA-256:
`75a082fc149dc616b994b358978afa61d224d0af4c14beec9bdfdacfa9a19d60`.
Never format or rewrite frozen reports, runner, template capture helper/data,
rubric or historical qualification copies.

## Evidence locations and preservation

- Repository evidence:
  `docs/reviews/daily-natal-lens/2026-10-12-qualification-round-3/`.
  The partial reports are byte copies of checkpoint 37 and retain `partial: true`.
  Actual source/plan/finish receipts and the partial-run audit bind them.
- Original journals/checkpoints/driver and test logs:
  `/home/ubuntu/.local/state/pixel-perfect-view-757/natal-qualification/20261012-round-3/`.
  Its `model-pair-run-1/` contains **222 journal files and 74 numbered partial
  checkpoints**. Keep them all. `offline-integrity-fixture-*` contains explicitly
  fake helper test data; never mix it with actual model evidence.
- `templates.json` has 114 deterministic offline bodies across builtin/natal/
  transit; `case-contexts.json` has all 38 fixed suppression contexts. Capture
  used the real evaluator, scrubbed credentials and blocked fetch, with no model
  requests or fixture replays. It does not qualify transit model/chapter writing.
- Earlier round-1/round-2 documents, packets, reviews and partial evidence remain
  untouched. The prior qualification document is archived byte for byte here;
  its relative links resolve from its original parent-directory base.
- Original recovery manifest:
  `/home/ubuntu/.local/state/pixel-perfect-view-757/reconciliation/20261011T235721Z/manifest.json`.
  Preserve its 395 files/backups and five original worktrees. Compare status using
  `git status --porcelain=v1 --untracked-files=all`; the user-added primary `.env`
  edit is an expected exception. That credential file is tracked, remains
  unstaged, and must never be printed, copied into evidence, staged or committed.
- Primary checkout remains on `feat/daily-reading-synthesis` at `c3ac5ca` with
  local work/evidence; do not reset, clean or stage there. Local `main` and
  `origin/main` remain `da4be89`; those refs were not fetched this turn.

## Remaining work

1. Verify the closed partial evidence and preservation receipts. Source comparison
   may prove the 37 settled configurations/non-natal facts match and only eight
   supplied N1 requests differ; it cannot turn this into a complete 38-case run.
2. If reviewing available pairs, create a **separately labeled, nonqualifying
   partial-evidence review collection**. Existing `verify-evidence.mjs` and
   `prepare-blinded-review.mjs` require complete reports and reject these partials
   by design. Do not remove those guards, flip flags, fabricate full sidecars,
   fill missing drafts from templates/old runs, or discard the five missing raw
   occurrences (three timeouts plus two unattempted cases).
3. Use two fresh reviewer contexts with no inherited implementation/history,
   uniform citation masking, complete visible fact/tone/depth/quiet context,
   exact-context deduplication and preserved occurrence counts. Keep the fixed
   rubric: both specificity/grounding/coherence scores at least 4/5, lens/synthesis
   scores when applicable, no unresolved substantive finding, and supported
   duty/freedom contrast. Freeze original judgments before unblinding; never
   average, edit scores or let a template rescue a raw failure. Human approval
   and model diversity remain unestablished.
4. Update qualification with honest partial results, exact findings and remaining
   gaps. A partial-review pass cannot promote the candidate. Round 2 remains the
   latest completed blinded assessment until a full replacement exists.
5. A new complete paired actual-model round requires a new operator request,
   isolated output directory and source/runtime identity. The old runner binds
   `948aa00`; a later documentation HEAD will fail its revision preflight. Do not
   execute it casually, change the old runner or reuse its closed directory.
6. Complete separate member Lovable, hosted Workflow/admin, native Swiss/owner,
   chronology/week/account/browser, cost and human-review lanes. Transit source
   gaps remain in `docs/reviews/daily-transit-story/2026-10-12-source-discovery.md`.
   Keep both candidates inactive; no production/release action is authorized.

---
