**Gemini Enterprise timeout investigation and writing review — 2026-10-12**

The evidence strongly supports a 60-second client deadline cutting off slow Gemini Enterprise calls. The captured writing passed this AI review, while model availability remains weak: 23 of 37 attempts succeeded (62.2%), and 14 timed out (37.8%). This investigation made no new Gemini generation calls and changed no application source or provider settings.

The uploaded report is preserved byte for byte in [source-report.json](source-report.json), SHA-256 `d7bf2cc09012a4a366edbc53b30a49cb504da6a3492029ba3d82756a096f6a54`. It records `gemini-enterprise/gemini-3.8-flash`, prompt `daily-astro-body-13`, validator `daily-reference-10`, fixture `synthetic-daily-6`, candidate bundle `builtin-0.7.1`, and a 60,000 ms deadline. All original manual-review fields remain blank; AI scores are separate artifacts.

**Timeout findings.** Read-only Google Cloud Monitoring queries were scoped to the project resolved from the locally configured Enterprise API key. The key was not saved in these artifacts. For the queried interval, the model's response counts match the uploaded run exactly:

| Evidence | Result | Interpretation |
| --- | --- | --- |
| Report outcomes | 23 accepted, 14 timeout, 1 quiet skip, 0 validator rejections | The observed failures occur before a captured draft is available. |
| Provider response counts | 23 HTTP 200, 14 HTTP 499; no returned 429/5xx counts | Consistent with the client cancelling pending requests. |
| Successful provider latency | Mean 40.716 seconds across 23 responses | Almost all successful elapsed time is accounted for by the provider call. |
| Successful app duration | Mean 40.812 seconds; median 35.985; range 23.293–57.496 | The two means differ by 0.096 seconds. |
| Failed app duration | 60.000–60.001 seconds | Matches the configured client deadline. |
| Failed-case output | All 14 candidates absent; all 14 displayed bodies equal their saved templates | Fallback behavior preserved usable output, but the missing drafts cannot be scored. |

Google describes HTTP 499 as a client closing a request before the server responds. This strengthens the deadline diagnosis, but the counts are aggregate: the export contains no provider response IDs or deployed build SHA, so individual request correlation is not established. The audit-log query returned no entries; it did not supply additional request-level evidence. See [Google's status guidance](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/retry-strategy), [monitoring summary](cloud-monitoring-summary.json), [raw metric responses](cloud-monitoring.json), and [derived findings](timeout-findings.json).

The matching local adapter uses one `AbortSignal.timeout(60000)` for the non-streamed fetch and complete response-body read. Both an aborted fetch and an aborted body read become `timeout`; HTTP 408/504 also become that code. Candidate capture happens only after complete response parsing. The server evaluation runs cases sequentially and does not automatically retry a failed model call. Relevant source: [provider adapter and deadline](/home/ubuntu/pixel-perfect-view-757/.worktrees/integrate-planning-natal-transit-20261011/src/lib/ai/language.server.ts:204), [daily deadline constant](/home/ubuntu/pixel-perfect-view-757/.worktrees/integrate-planning-natal-transit-20261011/src/lib/ai/diagnostics.ts:7), and [evaluation step](/home/ubuntu/pixel-perfect-view-757/.worktrees/integrate-planning-natal-transit-20261011/src/lib/evaluation-runs.server.ts:262).

The request payloads do not support a simple size-only explanation. Reconstructed native requests span 9,822–14,697 bytes; accepted and failed sizes overlap. The largest request succeeded in 54.874 seconds, while a 9,832-byte request timed out. Two cases with identical requests had different outcomes: `unknown-birth-time` timed out, while `natal-unknown-time` succeeded in 38.790 seconds. See [request analysis](request-analysis.json) and [identical-request groups](identical-request-groups.json).

Previously saved local captures provide another check without generating new text. Six requests exactly match corresponding requests, facts and config hashes in this upload. With an explicitly recorded 180-second experimental deadline, all six previously completed, including opening at 63.970 seconds, closing at 75.787 seconds, and between-passes at 152.841 seconds. The last case's diagnostic duration was clamped to 120 seconds, so the saved transport-to-settled timestamps are necessary to see the longer wait. These older captures have different suite hashes and are kept separate; they do not improve this run's 62.2% availability result. See [historical comparison](prior-capture-comparison.json).

**Thinking overhead is a plausible contributor, still unmeasured.** The native `generationConfig` sets only JSON MIME type and schema. It does not set `thinkingConfig`. Google currently documents `MEDIUM` as the default for Gemini 3.8 Flash, with `LOW` available to reduce latency; its model guidance also describes greater token consumption than 3.7. See [thinking controls](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking) and [Gemini 3.8 Flash guidance](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash).

All 23 successful responses fall in provider output-token buckets of 2,000–10,000, despite captured prose containing only 94–181 words. That is a useful clue. It is not a measurement of thinking tokens: the adapter discards `usageMetadata`, `responseId`, observed `modelVersion`, and `finishReason`, and the queried metrics do not split thinking from visible output. The interval records 51,291 input and 132,271 output tokens; these totals are not a reconciled bill. Cost remains unknown. No first-token metric samples were returned. Provider queueing, thinking, and generation time cannot yet be separated.

**Writing scores.** Two fresh AI contexts assessed each item against its supplied facts. All 38 displayed outputs are covered, together with five additional arc-template counterparts: 23 model bodies, 19 nonquiet templates and one quiet-day message. Ten templates belong to the arc fixture set: seven contain a selected transit chapter and three test safe chapter omission. All 42 nonquiet bodies passed both assessments, and the quiet message passed both safety checks. There were no substantive findings or flagged unsupported personal claims, invented history, or promised resolution.

Scores below use the lower of each item's two ratings, then average within the group. The scale is 1–5. Specificity, grounding, coherence and applicable integration dimensions require at least 4; voice and repetition are diagnostic scores. An average cannot override an item failure.

| Text group | Passed both | Specificity | Grounding | Coherence | Voice | Repetition |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Captured model bodies | 23/23 | 4.22 | 5.00 | 4.13 | 3.96 | 3.96 |
| Arc fixture templates | 10/10 | 4.10 | 5.00 | 4.00 | 4.00 | 3.10 |
| Other displayed nonquiet templates | 9/9 | 4.67 | 5.00 | 4.33 | 3.89 | 4.00 |

All seven chapter-bearing templates scored 5 for temporal coherence and at least 4 for chapter integration. The two captured chapter-bearing model bodies scored at least 4 on both dimensions. All nine preserve the supplied chronology exactly once within the first two paragraphs. Applicable synthesis scores range from 4–5 and natal-lens scores from 4–5. The arc templates' clearest editorial limitation is repeated phrasing; the reviewers did not require unsupported variation.

Four distinct minor issues were recorded:

| Case and text | Issue | Suggested edit |
| --- | --- | --- |
| `synthesis-unmatched`, model | Adjacent sentences repeat the expectations/capacity contrast. | State the contrast once while retaining the named contact and boundary meaning. |
| `natal-sign-boundary`, model | “exact on 2026-10-14, which is exact in 3 days” repeats “exact” with an awkward referent. | Express the supported date and interval in one fluent sentence. |
| `saturn-square-moon-warm`, model | “approaching square your natal Moon” is grammatically awkward. | Use “approaching a square to your natal Moon,” preserving the phase and orb. |
| `synthesis-tension`, displayed template | “Also in range: jupiter trine natal mars…” changes register and leaves names lowercase. | Use a plain sentence with capitalized planet names; the renderer is in `src/lib/reading.server.ts:327`. |

Exact quoted passages, source-fact IDs and both reviewers' reasons are preserved in [scorecard.json](scorecard.json). [Per-item scores](scorecard.md) and [CSV](scorecard.csv) provide all 43 rows. Scores concern body text; headlines and reflection questions were outside this review.

This is single-report AI scoring, not full release qualification. The four fresh contexts were requested from the same model family, in two batches, with two judgments per item. Case, version, outcome and per-item origin labels were withheld; template paragraphs remain recognizable by their absent citations. The first two reviewers' output paths contained `enterprise-investigation`, so strict generator blinding is not claimed. Reviewers declared the automatically attached repository notes and memory index; their declarations are retained. Repetition comparisons were limited to each batch. Human review remains incomplete. There is no matched baseline comparison, no new member-provider evaluation, and no native Swiss numerical validation in this work.

**Recommended follow-up, in order.**

1. Add bounded diagnostic metadata to the admin-only Enterprise evaluation path: HTTP status, abort phase, time to headers and completed body, requested thinking level, response ID, observed model version, finish reason, and numeric usage counts including thinking/candidate tokens. Carry the configuration into evaluation identity so different settings cannot be merged silently. Keep secrets and raw thought text out of artifacts. The adapter, diagnostics and evaluation export are the relevant files; member readings and natal chapters retain their Lovable routing.
2. Run a small, budgeted synthetic comparison of explicit `MEDIUM` and `LOW` using identical facts, prompts, schema and a 60-second deadline. Include an ordinary control and the missing opening, return, closing, five-pass and between-pass chapters. Predeclare repetitions and a call cap, use no automatic retries, and preserve every attempt. Compare completion, latency and token usage, then score captured prose with the same grounding and chronology gates. This is a proposed experiment; no such calls were made here.
3. Select a configuration only if it improves completion without weakening writing gates. Then run the complete 38-case suite and an appropriately matched baseline/candidate comparison, keeping provider identities separate. Recover and review the 14 missing model drafts, especially the five missing chapter outputs. A longer deadline can expose drafts but should be reported as a separate availability policy.
4. Address the four minor wording issues in a separate editorial change, then review only the affected outputs. Preserve these source captures as evidence. The lowercase template fragment can be corrected in its renderer; generated awkwardness should be handled through a scoped writing change rather than editing archived outputs.

**Verification and source boundaries.** The existing provider suite passed **11/11 tests** ([output](provider-tests.tap)). A separate offline probe passed **4/4 scenarios**: an immediate valid response, waiting for headers, waiting for the body, and HTTP 504. It uses a fake provider and a 25 ms simulated timer, confirming classification and fallback behavior rather than measuring live latency ([probe](probe-timeout.mjs), [results](offline-timeout-probe.json)). The evidence verifier checked all 86 item assessments, all packet/prompt hashes, every finding's exact quote and fact IDs, score applicability, and complete output coverage ([verification.json](verification.json)). It can be rerun with:

```sh
python3 docs/reviews/daily-transit-story/2026-10-12-enterprise-investigation/verify-and-summarize.py
```

Initial source inspection and the offline tests used the matching worktree at `6de843c110b62dd4fb5f785524de0b40959f230b`. Concurrent work later advanced it to `7d8e2f512c2057127e06b5f32b14fcb356151905` at the recorded follow-up observation. The provider/daily-generation portion of the language module, diagnostics, evaluator and provider tests were unchanged; the later language diff extracts the natal reflection helper, and the test-harness diff passes parameters to a fault-injection callback. [Source identity](source-identity.json) records both revisions and file hashes. The uploaded report itself lacks a deployed source SHA. This work made no commits, deployment, content activation, application changes or Gemini generation calls. Full app build, browser and production checks were not rerun.
