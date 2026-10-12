# Natal writing qualification — failed blinded AI round 1

The 2026-10-11 blinded AI review **fails writing qualification**: **3/8 candidate
model outputs pass, 0/8 candidate templates pass, and 0/8 positive cases fully
pass**. The candidate adds supported practical distinctions, including the
duty/freedom contrast, but several lenses remain appended and substantive claims
remain unresolved. Catalogue approval is separate from this failed writing gate.

The [frozen review summary](2026-10-11-blinded-review/review-summary.json) is the
source for the scores and verdicts below. The [evidence index](2026-10-11-blinded-review/README.md),
[source identity](2026-10-11-blinded-review/source-identity.json),
[review manifest](2026-10-11-blinded-review/review-manifest.json) and
[review integrity](2026-10-11-blinded-review/review-integrity.json) retain the exact
reports, reviewer packets, instructions, assignments and assessments. The original
artifacts remain unchanged; source-report `manualReview` fields remain null.

The earlier `4c96fd5` baseline and `builtin-0.6.0` candidate attempt that stopped on
gateway credit remain historical evidence. That failed catalogue and partial run
are separate from the `builtin-0.6.1` Enterprise pair reviewed here.

## Paired reports and provenance

These are actual-model **admin synthetic evaluation** reports from Gemini
Enterprise, using `gemini-enterprise/gemini-3.8-flash` and a `60000` ms deadline.
They do not verify the member-serving Lovable gateway. Current main uses a
`60000` ms daily deadline after `28bf467`; that source setting is separate from
observed member-provider latency and acceptance. Member readings and natal
chapters remain on the Lovable gateway.

| Recorded field                   | Baseline                                                           | Candidate                                                          |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Bundle selection/version         | `builtin` / `builtin-0.5.0`, natal-free                            | `natal-candidate` / `builtin-0.6.1`, inactive                      |
| Source-report SHA-256            | `ce0b8acdc47c5d9d2bffa8eb4bd469364145438a12897009b8d2cddf668d35a9` | `16af47ded750b4d2b4e31747395331a3657d6f8f26f1056247fe24ba7135343e` |
| Case inventory / attempts        | 28 / 27                                                            | 28 / 27                                                            |
| Accepted / unavailable / skipped | 25 / 2 / 1                                                         | 26 / 1 / 1                                                         |
| Generating `sourceRevision`      | `null`, unproven                                                   | `null`, unproven                                                   |
| Provider cost/token usage        | Absent                                                             | Absent                                                             |

Both reports record `partial: false`: their inventories are complete, but three
attempts timed out and have no model response. Each also contains the `no_cycle`
quiet skip. No unavailable response receives a prose score or counts as a pass.

Shared recorded metadata are `synthetic-daily-5`, case-set hash
`1fec5a7a3842cbc4f374a9058dfa3264294df875db607db2d3a92aa1306f9b07`,
`daily-synthesis-1`, `daily-natal-lens-2`, `natal-reliability-1`,
`daily-astro-body-8`, `daily-reference-5`, and transit-copy hash
`4d6048ea1d303410e2845d9dde9960da95749ff7ab20fd886779a4627abc677d`.
The [input integrity checks](2026-10-11-blinded-review/integrity-checks.json) find
matching configuration hashes, non-natal facts and reliability manifests; requests
change only in the eight selected-lens cases. There are **24 complete model pairs**,
including **7/8 natal-positive** and **3/4 natal-negative** pairs.

The [strict natal comparison](2026-10-11-blinded-review/natal-comparison.json)
retains both generating-revision gaps; `sourceRevisionMatch` is `null`. Neither the
review checkout's `c3ac5ca` nor the review workspace's `bb033d3` proves the revision
that generated either report. Recorded metadata matching is not proof that both
runs used one deployed source revision.

| Missing model response              | Recorded outcome    | Effect on coverage                                            |
| ----------------------------------- | ------------------- | ------------------------------------------------------------- |
| Baseline `natal-exact-house`        | `timeout`, 60000 ms | No paired positive model comparison                           |
| Baseline `natal-degraded-positions` | `timeout`, 60000 ms | No paired negative model comparison                           |
| Candidate `saturn-square-moon-warm` | `timeout`, 60000 ms | Uncovered candidate failure outside the eight natal positives |

## Review coverage and gate

Protocol `natal-writing-blind-ai-1` used two fresh AI contexts, A
(`/root/blind_reviewer_a`) and B (`/root/blind_reviewer_b`), with distinct randomized,
source-masked packets. Each reviewed **79 unique prose/support contexts: 78 scored
and one quiet safety check**, representing **107 occurrences: 51 captured model
outputs and 56 template occurrences**. Deduplication required identical text,
support, tone, depth and suppression context. Each also covered all four contrast
sets and eight repetition sets. The quiet item was safe with null scores.

Both reviews were frozen before source assignments were revealed at
`2026-10-11T23:45:53.683614+00:00`; hash bindings, complete unique coverage, score
bounds/applicability and exact quoted findings passed the saved integrity check.
A's review SHA-256 is
`93bd33998761e69e0a8a6b0d5562c478940e94761713ce0cf690509cb5cad46a`;
B's is `4f3d5822eff6dc674b70ba772bc5dcffb9c1005a69ad356543ec2f96527fa79e`.

These contexts share the inherited model family. Their model/configuration
identities were not exposed; **model diversity and human review are not
established**. The coordinator had prior unblinded context; the reviewers declared
that they saw only their assigned packet/instructions and no prior verdicts or
other review. Tool access was not technically sandboxed, and N1 presence/prose
style can make treatment or template origin inferable. Citation arrays were masked
uniformly; structural acceptance remains separate from semantic review.

Under the [AI qualification contract](../daily-reading-writing/review-protocol.md),
both reviewers must give every eligible candidate/template specificity, grounding
and coherence **≥4/5**, plus lens integration **≥4/5** when N1 is supplied and
synthesis coherence **≥4/5** when S1 is supplied. There must be **zero unresolved
substantive findings**. Voice/repetition are recorded but do not gate by themselves.
Unavailable responses are uncovered failures. Baseline lens integration is null
because N1 is absent; that is inapplicability, not an integration failure. A safe
template cannot rescue a failed raw model output. Means and majority votes cannot
override any failing score or unresolved finding.

## Positive-case scores

Each tuple is **specificity / grounding / voice / repetition / coherence / lens
integration / synthesis coherence**, on the 1–5 rubric. `—` means inapplicable;
`unavailable` means there was no model prose. Values are the original individual
judgments in [review A](2026-10-11-blinded-review/review-a.json) and
[review B](2026-10-11-blinded-review/review-b.json).

| Candidate model case        | A             | B             | Model gate                          |
| --------------------------- | ------------- | ------------- | ----------------------------------- |
| natal-duty-reflex           | 4/5/4/4/4/4/— | 4/5/4/4/4/4/— | Pass                                |
| natal-freedom-reflex        | 4/5/4/3/3/3/— | 4/5/4/3/4/4/— | Fail: A coherence/integration       |
| natal-service-aspect        | 4/5/3/3/3/3/— | 4/5/3/3/3/3/— | Fail: both coherence/integration    |
| natal-exact-house           | 4/5/4/4/3/3/— | 4/5/4/4/4/3/— | Fail: A coherence, both integration |
| natal-own-target            | 5/5/4/4/4/4/— | 4/5/4/4/4/4/— | Pass                                |
| natal-moon-fallback         | 4/5/4/4/4/4/— | 4/5/4/4/4/4/— | Pass                                |
| natal-mixed-source          | 4/5/4/4/3/3/— | 4/5/4/4/4/3/— | Fail: A coherence, both integration |
| natal-synthesis-integration | 5/5/4/4/4/4/4 | 4/3/4/4/4/4/4 | Fail: B grounding/substantive claim |

| Candidate template case     | A             | B             | Template gate |
| --------------------------- | ------------- | ------------- | ------------- |
| natal-duty-reflex           | 4/5/3/2/3/3/— | 4/5/3/2/3/3/— | Fail          |
| natal-freedom-reflex        | 4/5/3/2/3/3/— | 4/5/3/2/3/3/— | Fail          |
| natal-service-aspect        | 4/5/3/2/3/3/— | 4/5/3/2/3/3/— | Fail          |
| natal-exact-house           | 4/5/3/2/3/3/— | 4/5/3/2/3/3/— | Fail          |
| natal-own-target            | 4/5/3/3/3/3/— | 4/5/3/3/3/3/— | Fail          |
| natal-moon-fallback         | 4/5/3/3/3/3/— | 4/5/3/3/3/3/— | Fail          |
| natal-mixed-source          | 4/5/3/2/3/3/— | 4/5/3/2/3/3/— | Fail          |
| natal-synthesis-integration | 4/5/3/2/3/3/4 | 4/5/3/3/3/3/4 | Fail          |

Every candidate template has coherence/integration 3 from both reviewers.
Copying a supported lens into paragraph 1 does not establish meaningful application
to the primary scene. All eight candidate positive model/template personal-claim
flags are false, but B flags a separate unsupported substantive claim in the model
`natal-synthesis-integration`. No positive case passes both its model and template.

| Baseline model case         | A             | B             |
| --------------------------- | ------------- | ------------- |
| natal-duty-reflex           | 4/3/3/3/3/—/— | 3/5/3/3/3/—/— |
| natal-freedom-reflex        | 4/5/4/2/3/—/— | 3/5/4/2/3/—/— |
| natal-service-aspect        | 4/5/4/2/3/—/— | 3/5/4/2/3/—/— |
| natal-exact-house           | unavailable   | unavailable   |
| natal-own-target            | 4/5/4/3/4/—/— | 4/5/4/3/4/—/— |
| natal-moon-fallback         | 4/5/4/2/3/—/— | 4/3/4/3/4/—/— |
| natal-mixed-source          | 4/5/3/2/3/—/— | 3/5/4/2/3/—/— |
| natal-synthesis-integration | 4/5/4/4/4/—/4 | 4/5/4/4/4/—/4 |

| Baseline template case      | A             | B             |
| --------------------------- | ------------- | ------------- |
| natal-duty-reflex           | 4/5/3/2/3/—/— | 3/5/3/2/3/—/— |
| natal-freedom-reflex        | 4/5/3/2/3/—/— | 3/5/3/2/3/—/— |
| natal-service-aspect        | 4/5/3/2/3/—/— | 3/5/3/2/3/—/— |
| natal-exact-house           | 4/5/3/2/3/—/— | 3/5/3/2/3/—/— |
| natal-own-target            | 4/5/3/3/3/—/— | 3/5/3/3/3/—/— |
| natal-moon-fallback         | 4/5/3/3/3/—/— | 3/5/3/3/3/—/— |
| natal-mixed-source          | 4/5/3/2/3/—/— | 3/5/3/2/3/—/— |
| natal-synthesis-integration | 4/5/3/3/3/—/4 | 4/5/3/3/3/—/4 |

## Supported contrast, suppression and repetition

Both reviewers find a supported duty/freedom distinction in candidate models and
templates: **useful preparation versus waiting for everything to be settled**, and
**the commitment itself versus choice in carrying it out**. This passes the
practical-contrast check. It does not pass freedom-model integration (A: 3) or
either template's integration (both: 3). Baseline samples lack N1 and appropriately
offer no invented practical difference; their identical meanings are not an
integration failure.

Both reviewers found no raw natal-origin leakage, invented unsupplied joint
premise, personal-claim flag or suppression breach in the captured prose. The four
negative controls—sign boundary, unknown time, degraded positions and legacy
snapshot—remain natal-free in available models/templates. Baseline degraded
positions has no model response. The selected own-target and Moon-fallback model
outputs pass meaningful lens use; house/service/mixed-source outputs retain the
specific integration weaknesses above. Synthetic reliability labels do not prove
live Swiss Ephemeris/Placidus provenance.

| Cross-scenario repetition set                                     | Baseline model A/B | Baseline template A/B | Candidate model A/B | Candidate template A/B |
| ----------------------------------------------------------------- | ------------------ | --------------------- | ------------------- | ---------------------- |
| Moon/fallback: duty, service, exact-house, fallback, mixed-source | 2/2                | 1/2                   | 3/3                 | 1/1                    |
| Own-target and natal-synthesis-integration                        | 3/4                | 2/2                   | 3/3                 | 2/2                    |

The baseline model Moon/fallback set omits its unavailable exact-house response.
Reviewers describe recurring quiet-moment/calendar blocks, preparation/waiting
wording, and free-afternoon sampling/choosing wording; some candidate models add
supported contextual variation, while templates repeat whole blocks. These are
**likely-reuse assessments across scenarios, not an observed chronological week**.
The lens remains deterministic for contacts to one body and uses the Moon only
when the target body's sign is unscreened. A real week of contacts, cache reuse and
repeated-reader experience remain unverified; varying unsupported natal meaning
is not a remedy.

## Unresolved findings and remaining qualification

The summary preserves **43 item disagreements**, including **seven disagreements
on substantive-claim flags**. A flags five substantive items and B flags eight:
three overlap, leaving ten distinct items with unresolved substantive findings.
The table retains every affected item and each reviewer's grounding score. A
reviewer not flagging a passage does not resolve the other reviewer's finding.

| Source/model case; item                                     | Grounding A/B; claimant | Exact passage and unresolved source-support issue                                                                                                                             |
| ----------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline `jupiter-trine-sun-technical`; `item-75c165b573`   | 5/3; B                  | “can allow an existing plan to look roomier” adds a causal effect of considering curiosity (`I1`).                                                                            |
| Baseline `mercury-conjunction-clinical`; `item-6038eb1772`  | 3/5; A                  | “How you articulate what you mean becomes the central focus” adds central priority (`I1`).                                                                                    |
| Baseline `multiple-cycles`; `item-bc55d7c7e3`               | 5/3; B                  | “giving you space to notice where curiosity fits alongside what's already underway.” adds a definite personal benefit (`I2`).                                                 |
| Baseline `natal-duty-reflex`; `item-1b44910009`             | 3/5; A                  | “while a small obligation takes up more room than its size suggests.” turns a possibility into an asserted outcome (`I1`).                                                    |
| Baseline `natal-moon-fallback`; `item-d5098717a0`           | 5/3; B                  | “framing the places where deliberate effort is called for.” drops the conditional established-role scene (`I1`).                                                              |
| Candidate `mercury-conjunction-clinical`; `item-51003eb7a6` | 5/3; B                  | “sharpening curiosity around new phrasing, questions, or ideas.” makes returned focus cause curiosity (`I1`).                                                                 |
| Candidate `natal-synthesis-integration`; `item-493bd0abab`  | 5/3; B                  | “That distinction shows where a routine or responsibility needs clearer boundaries.” makes N1's sampling/choosing distinction establish a boundary need (`I1`, `N1`).         |
| Baseline `synthesis-reversed`; `item-dce1e5e69a`            | 3/3; both               | “allowing enthusiasm and practical initiative to reinforce one another.” makes low friction enable reinforcement, rather than retaining the well-chosen-aim condition (`I1`). |
| Candidate `synthesis-reversed`; `item-bd72385300`           | 3/3; both               | “An aim that is well chosen lets effort encounter little friction.” makes aim selection enable low friction (`I1`).                                                           |
| Candidate `synthesis-reinforcement`; `item-f2fd99f6bc`      | 3/3; both               | “where energy flows easily” omits the condition that action lines up with what matters (`I2`; B also cites `S1`).                                                             |

Exact full findings, paragraph numbers, fact IDs, proposed corrections and all
score disagreements remain in the original reviews and summary. No adjudication
or fresh reassessment has resolved them; below-threshold scores still fail even
if a later adjudication resolves a finding. Joint substantive failures require a
new evidence round. The source already contains some categorical statements;
reviewers distinguished their supported retention from the added relationships
above. A calculated future exact date was not classified as behavioral prediction.

Qualification still requires corrected candidate/template prose, a versioned
frozen source if copy or policy changes, complete fresh paired responses on one
**observed generating revision**, and renewed blinded review without unresolved
findings or below-threshold applicable scores. Preserve the three missing responses
and unknown cost/token usage; do not backfill either from this checkout. Member
Lovable behavior under the current 60-second deadline, live Swiss/owner paths and chronological-week repetition
need their own evidence. Human review remains deferred and model diversity remains
unestablished. Public deployment, content publication, activation and rollback are
separate requested gates; this documentation update performs none of those actions.

## Integration evidence boundary

Reconciliation retains the original reports, packets and reviews byte for byte.
Current transit-aware code uses `daily-astro-body-9`, `daily-reference-6`, and
`synthetic-daily-6` with 38 cases. The preserved fallback and natal candidate
bundle hashes remain identical to this round. The original body-8 scores and
unknown generating revisions do not establish qualification of current code;
a fresh frozen-source evidence round remains necessary. See the
[integration record](../reconciliation/2026-10-11-main-integration.md).
