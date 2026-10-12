# Fresh natal evaluation and blinded AI review — round 2

**Writing qualification failed. Both candidates remain inactive.** The fresh
positive gate passes **6/9 raw models, 9/9 templates and 6/9 complete cases**.
Freedom retains an unsupported causal bridge; exact-house transfers the reading's
window position to the future exact date; Moon fallback timed out. Across the
whole non-quiet candidate suite, **26/37 models, 36/37 templates and 25/37 complete
cases pass**. The warm natal-free template also needs a coherence edit.

The [current qualification document](../writing-qualification.md) contains the
individual positive scores, exact candidate findings and remaining work. The
[machine summary](qualification-summary.json) retains both original judgments,
all case/lane mappings, disagreements and uncovered responses. No scores were
averaged, model outputs edited, findings adjudicated or missing drafts backfilled.

## Actual-model run

The operator explicitly selected Gemini Enterprise and configured its credential
in the primary checkout's private `.env`. Node loaded that file through its normal
`--env-file` mechanism; credential values were never printed or saved in evidence.
The runner used the existing server-side `runSyntheticEvaluationCase` function,
with Vite project configuration disabled, from observed local source revision
**`8b73148241adbe38d9e1f2e58e34e241314a92dd`**. The source and exact runner hashes
were checked throughout the run.

This is local production-module synthetic execution. The deployed Workflow,
signed callback, `/content` admin authentication and member-serving Lovable gateway
were not exercised. All facts were fixed synthetic inputs; there were no account,
reading-cache, content-pointer or live chart-service operations in this runner's
scope. Member readings and natal chapters retain main's provider implementation.

| Lane              | Cases | Attempts | Accepted | Rejected | Timeout | Quiet |
| ----------------- | ----: | -------: | -------: | -------: | ------: | ----: |
| Built-in baseline |    38 |       37 |       34 |        0 |       3 |     1 |
| Natal candidate   |    38 |       37 |       31 |        0 |       6 |     1 |

Both reports are complete inventories (`partial: false`). Model-pair coverage is
**28/37**, including **7/9 positives and 1/4 negatives**. Nine timeouts have no model
prose and remain uncovered failures. Exactly 74 transports were attempted, once
per non-quiet case, with zero retries. Every start, result, transport receipt and
numbered partial checkpoint is preserved locally.

Both runs use `synthetic-daily-6`, `daily-astro-body-10`, `daily-reference-6`,
`daily-synthesis-1`, `daily-natal-lens-2`, `natal-reliability-1`, the same declared
model `gemini-enterprise/gemini-3.8-flash`, and a 60,000 ms deadline. Only the nine
requests supplied with N1 differ. All configurations, non-natal facts, reliability
manifests and transit copy match; the strict comparison proves one observed
generating source. The three content bundle hashes remain unchanged.

The provider returned `modelVersion: gemini-3.8-flash` and token counters for 65
successful responses. Their observed total is 452,862 tokens, including 311,262
thought tokens. Nine failed-request usages and monetary cost remain unknown.
Missing usage fields are not evidence of zero use. Model `manualReview` fields
remain null; independent judgments live in separate frozen files.

## Blinding and integrity

Two fresh contexts received independently shuffled packets containing only exact
prose, supplied facts and tone/depth/quiet limits, with the rubric embedded. Each
covered **99 unique contexts: 98 scored and one quiet safety check**, representing
217 occurrences (65 raw captures, 76 displayed bodies and 76 templates).
Identical complete visible contexts alone deduplicate; every merged context has
matching underlying suppression flags. Paragraph citation arrays are masked
uniformly. Repeated examples retain their occurrence counts.

Both reviewers covered four contrast sets and eight cross-scenario reuse sets.
The original reviews were frozen before source mappings were revealed. Packet,
prompt, review and receipt hashes, applicability, score bounds, exact quoted
findings, complete set coverage and verdict consistency passed independent
bookkeeping checks. The `reviewedAt` field copies the supplied dispatch timestamp;
actual freeze timing is recorded separately in the frozen receipts.
The prompt hash binds the exact archived task text before its appended hash-binding
trailer; the full dispatched message has a separate hash.

The [review integrity audit](review-integrity-audit.json) reproduced all summary
fields. It preserves **56 item disagreements** and **10 substantive reviewer
findings**: seven candidate findings over five model items and three baseline-only
findings over three model items. No template has a substantive finding. Both
reviewers support the duty/freedom practical contrast, while the freedom raw
passage still fails B's grounding and integration scores.

Precise reviewer model/configuration identities are unexposed, and model diversity
and human review are unestablished. The coordinator had prior unblinded context;
reviewers declared only their assigned packet. Tool access was not technically
sandboxed, and prose style/N1 can suggest a source. These are AI assessments of
synthetic writing, not human approval or empirical temperament validation.

## Frozen evidence index

- [Baseline report](builtin-report.json) and [identity](builtin-identity.json).
- [Candidate report](natal-candidate-report.json) and [identity](natal-candidate-identity.json).
- [Source manifest](source-manifest.json), [run plan](run-plan.json),
  [run finish](run-finished.json) and [transport observations](transport-observations.json).
- [Strict pair/input integrity](pair-integrity.json) and
  [independent provenance audit](integrity-audit.json).
- [Packet A](packet-a.json), [packet B](packet-b.json) and
  [embedded instructions](reviewer-instructions.md).
- [Review A](review-a.json), [review B](review-b.json),
  [A frozen receipt](reviewer-a-frozen-receipt.json) and
  [B frozen receipt](reviewer-b-frozen-receipt.json).
- [A task text](reviewer-a-prompt.txt), [B task text](reviewer-b-prompt.txt),
  [A full dispatch](reviewer-a-dispatch-message.txt),
  [B full dispatch](reviewer-b-dispatch-message.txt),
  [A dispatch metadata](reviewer-a-dispatch.json) and
  [B dispatch metadata](reviewer-b-dispatch.json).
- [Assignments after unblinding](assignment-after-unblinding.json),
  [unblinding receipt](unblinding-receipt.json),
  [packet context integrity](packet-context-integrity.json) and
  [independent review integrity](review-integrity-audit.json).
- [Qualification summary](qualification-summary.json) and
  [readable positive scores](score-tables.md).
- [Fresh deterministic templates](templates.json) and
  [fixed suppression contexts](case-contexts.json). The template snapshot also
  includes an offline transit preview; transit model writing was not evaluated.
- [Previous qualification document](previous-qualification-document.md), preserved
  byte for byte. Original round-1 evidence remains in its original directory.

## Reproduction and local preservation

[run-model-pair.mjs](run-model-pair.mjs) requires the exact observed `8b73148`
checkout, its recorded source/dependency files and the configured Enterprise
variable. The recorded run used Node 24; use Node 24 to reproduce it. Its source
bytes are immutable and match the runner hash in
the source manifest. A later documentation commit changes HEAD: reproduce only
from an isolated checkout of `8b73148`, copying this exact evidence runner into the
same relative path. `--dry-plan` makes no calls; `--preflight` additionally requires
a configured key. `--run --output-dir NEW_DIRECTORY` starts a new paid round,
refuses overwrite/resume, journals each attempt before dispatch and never retries.
This completed round is closed; further evidence requires a new requested run.

Offline verification uses [verify-evidence.mjs](verify-evidence.mjs) against the
saved reports/identity/run files and a new output path. The
[packet builder](prepare-blinded-review.mjs) validates real source reports, masks
citations and preserves occurrences; regenerated random packets have new hashes
and cannot be substituted for these frozen reviews. The
[round checker](summarize-round.mjs) uses the saved assignment, reviews, task text
and receipts. It checks complete item/set coverage and the natal contrast gate
without adding editorial judgments. It reports semantic and complete-pipeline
gates separately; both are false here.

Immutable local journals, 76 partial checkpoints, driver/test logs, original
preservation manifests and original isolated packets are under:

`/home/ubuntu/.local/state/pixel-perfect-view-757/natal-qualification/20261012-round-2/`

The existing review-bookkeeping tests passed **16/16**, with zero skips. The new
evidence scripts pass syntax checks, and the actual evidence passed strict source,
input, transport, packet and review checks. Application test/typecheck/build/browser
lanes were not rerun for this documentation/evidence task; source remained unchanged
from the remediation commit's previously recorded 494/494 test run.

Remaining work is the exact prose/timing/geometry corrections, warm fallback
coherence, complete model availability, a new frozen round, wider catalogue/week
coverage, and the separate member/hosted/native/account/human/cost lanes. Both
candidates remain inactive, with publication and activation requiring separate
qualification and authorization.
