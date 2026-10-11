# Reading evaluation

## Run an on-demand model evaluation

Sign in as an admin, open `/content`, choose the **Evaluation copy** and
**Language provider**, and choose **Run synthetic evaluation** in Reading quality.
This runs the 28 fixed cases below immediately: at most 27 eligible model requests
and one quiet-day check that makes no model call. Each case uses the production
prompt and validator with the chosen copy and the selected provider's model.
Provider keys stay on the server.

| Evaluation copy              | `bundleSource`    | Copy used                                                                     |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| Current active copy          | `active`          | The effective published release, or the built-in fallback when none is active |
| Natal-free built-in baseline | `builtin`         | `builtin-0.5.0`, without the natal catalogue                                  |
| Inactive natal candidate     | `natal-candidate` | `builtin-0.6.0`, for this run only                                            |

The choice is fixed when the run starts, sent with every case and recorded in the
report as `bundleSource`. Choosing a bundle never publishes, activates or caches it,
and a run cannot mix choices. Reports made before this selector existed have no
`bundleSource`; none is inferred.

The inputs are checked-in synthetic contacts. The endpoint accepts only a fixed
case ID, that closed copy choice and one of the two server-defined providers; it
does not accept a bundle, chart, prompt, model override, or account context. It
reads the admin role and, only for current active copy, the active release
(failing closed when that read fails), without reading birth records, check-ins,
notes, or daily readings, and writes no application records. Evaluation outcomes
do not enter the production Reading quality counts.

Cases run one at a time with the production daily timeout of 20 seconds per
request, including response-body reads. The JSON report records this budget as
`gatewayTimeoutMs`; it is separate from the model request payload. **Stop after current
case** preserves completed results. Requests are never retried automatically.
Missing configuration, authentication, credit, or rate-limit failures stop the
run. A change to the plan, prompt, validator, model or copy during a run also stops it
rather than combining unlike configurations.

Review the supplied facts, actual synthetic candidate paragraphs, displayed
result, and template fallback for each completed case. Rejected drafts remain
visible for review; generated paragraphs are bounded and marked when truncated.
New captures also record `captureLossless`, decided on the raw draft before any
bounding or filtering, so a dropped or cut paragraph, text or fact ID is never
mistaken for a clean capture. Provider error bodies, exception text and
credentials are excluded. Production reading diagnostics continue excluding
generated draft text.

Download the JSON report before leaving the page. Results are held only in page
memory. Partial runs are marked as partial; a before/after comparison needs all
28 fixed cases. A completed report is compatible with the comparison command:

```sh
npm run eval:reading -- --compare /tmp/pattern-before.json /tmp/pattern-after.json --output /tmp/pattern-comparison.json
```

### Language providers

- **Lovable AI gateway** (default) calls `google/gemini-3.7-flash` with
  `LOVABLE_API_KEY`. Member readings and natal chapters always use it.
- **Gemini Enterprise** calls `gemini-3.7-flash` directly on Gemini Enterprise
  Agent Platform (formerly Vertex AI) with the `GEMINI_ENTERPRISE_API_KEY` secret,
  sent as `x-goog-api-key` to the global `generateContent` endpoint. It receives the
  same system text, user text and JSON schema as the gateway; the 20-second budget,
  validator and template fallback are unchanged.

Only `/content` admin work can select Gemini Enterprise: synthetic evaluation and
**Draft a release** each have their own choice, which lasts for the page visit and
starts at the Lovable gateway; a provider without a server key cannot be selected.
Reports, diagnostics and drafts record `gemini-enterprise/gemini-3.7-flash` as the
model and the report `network` names the provider, so one run cannot mix providers
and the comparison command compares Gemini Enterprise reports only with other
Gemini Enterprise reports. The report `request` records the provider-neutral
messages and schema.

To configure it, use an Agent Platform API key from the Google Cloud project behind
Gemini Enterprise: a key bound to a service account with Agent Platform access and
restricted to `aiplatform.googleapis.com`. Add it in Lovable as the
`GEMINI_ENTERPRISE_API_KEY` secret. An invalid key, disabled API or billing, or a rate
limit stops the run like the gateway's credit and authentication failures.

The displayed acceptance rate describes model attempts in this synthetic run,
including gateway failures and excluding quiet skips, missing primary interpretations, and missing configuration.
It does not estimate acceptance for production users or score writing quality.
Writing quality is judged separately under the
[AI review lane](#current-writing-gate-ai-review-lane), before and after a prompt or
copy change.

## Offline replay

Every offline run names its copy explicitly with `--bundle builtin` (natal-free
`builtin-0.5.0`) or `--bundle natal-candidate` (inactive `builtin-0.6.0`). Active
copy exists only in the hosted app. Run the fixed suite before changing the daily
prompt or published copy:

```sh
npm run eval:reading -- --bundle natal-candidate --output /tmp/pattern-before.json
npm run eval:reading -- --write-responses /tmp/pattern-candidates.json
```

The fixture run replays handwritten JSON through the actual `assembleReading`, `readingFacts`, and `generateReadingProse` modules. All application fetch, HTTP(S), TCP, TLS, UDP, and DNS calls are blocked; the language gateway receives an in-memory response. The CLI loads no project configuration or `.env` files, substitutes a fake gateway key, and restores the environment on exit. No account, birth record, provider request, or private notes are needed.

The baseline answers are validator fixtures, not model outputs or recommended prose. Its acceptance rate only describes those fixtures. It cannot measure the live fallback rate, provider performance, tone quality, or semantic truth. The chart plans are synthetic contacts, not an ephemeris accuracy test. Local dates and daylight-saving conversions use the app's date helpers.

The `synthetic-daily-5` suite retains the sixteen v3 cases (including corrected
Mercury chronology and six synthesis cases) and adds twelve natal cases. Version 5
moves the Moon-lens cases onto a Moon contact and adds own-target and Moon-fallback
cases for the `daily-natal-lens-2` order. Saved v1–v4 reports remain historical
evidence; they cannot be compared against changed v5 inputs.

The offline runner evaluates the bundle named by `--bundle`. The natal-free
baseline is the built-in fallback (`builtin-0.5.0`); the natal candidate is
`builtin-0.6.0`. Version-5
comparisons require an identical normalized transit-copy hash (`transitCopyHash`)
and model, so the two bundles may differ only by release identity and natal
catalogue; that difference is listed among the configuration changes.

| Case                           | Coverage                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| `saturn-square-sun`            | Common hard contact; plain, standard depth                          |
| `saturn-square-moon-warm`      | Warm tone and inner-life source copy                                |
| `jupiter-trine-sun-technical`  | Soft contact, exact phase, technical depth                          |
| `mercury-conjunction-clinical` | Clinical tone and separating phase                                  |
| `venus-opposition-venus`       | Short preference contact and relationship framing                   |
| `unknown-birth-time`           | A stronger angle contact must be suppressed                         |
| `approximate-birth-time`       | A stronger house-placement contact must be suppressed               |
| `moon-dst-boundary`            | Moon date crosses midnight before a DST change                      |
| `multiple-cycles`              | Unsorted contacts, strongest-three cap, weak-contact filtering      |
| `quiet-threshold`              | No contact above the threshold; no language call                    |
| `synthesis-tension`            | Reviewed structure/expansion pair; synthesis in paragraph 1         |
| `synthesis-reinforcement`      | Reviewed persistence/initiative pair; synthesis in paragraph 2      |
| `synthesis-independent`        | Explicit independence; separately supported meanings                |
| `synthesis-reversed`           | Separately reviewed reversed tension orientation                    |
| `synthesis-suppressed-support` | Supporting angle removed before pair selection                      |
| `synthesis-unmatched`          | Reviewed meanings with no published pair rule                       |
| `natal-duty-reflex`            | Moon contact: preparation versus everything settled; matched inputs |
| `natal-freedom-reflex`         | Moon contact: commitment versus route; only natal evidence differs  |
| `natal-service-aspect`         | Compound Moon rule from raw synthetic service membership/orbs       |
| `natal-exact-house`            | Exact-time service Placidus routine comparison                      |
| `natal-own-target`             | Screened Sun sign leads for a Sun contact over a screened Moon      |
| `natal-moon-fallback`          | Unscreened Sun sign falls back to the screened Moon sign            |
| `natal-sign-boundary`          | Both candidate signs fail sampled cusp screening                    |
| `natal-unknown-time`           | No natal lens; ordinary transit still uses the model                |
| `natal-mixed-source`           | Missing house source preserves a qualified base sign                |
| `natal-degraded-positions`     | Degraded boundary makes the assessment unavailable                  |
| `natal-legacy-snapshot`        | Absent assessment cannot acquire a natal lens                       |
| `natal-synthesis-integration`  | Joint early `S1/N1` use with every parent; the Sun's own lens       |

The JSON report records the effective facts, production prompt and response schema, selected cycle keys, enriched fact dependencies, bounded interpretation-plan identity, template body, displayed body, citations, bounded rejection code, plan/prompt/validator/bundle versions, and configured gateway timeout budget. Request headers and credentials are excluded. Attempt durations are local replay timings, not live service latency. Skipped cases are separate from attempts, and `liveAcceptanceRate` is always `null`.

Daily prompt `daily-astro-body-8` defines plain, warm and clinical voices, each
with a short style-only example. The selected synthesis comes first, then primary and supporting meanings, optional
framing, and calculation references. The opening develops that meaning before technical
detail; domain, phase and timing receive space only when they add a distinct idea.
Standard and technical depth have separate length/detail guidance. The current
brief distinguishes conversational warmth from extra emotional claims, uses
familiar clinical wording, and discourages automatic repetition of the first
interpretation sentence. Everyday scenes remain conditional; a planet does not
establish what the reader feels or cause a decision, recovery or moment of clarity.
Each claim keeps the strength its source gives it: a supplied possibility stays a
possibility, and frequency, necessity or an exclusion needs its own supplied
support (and is kept when supplied). A contrast may set two supported options side by
side but does not rule out an alternative no fact mentions, and role or capacity
scenes do not become the reader's history. A selected reinforcement gives its two
joined meanings distinct paragraph functions, as `S1` relates them, then stops; the
instruction names no rule's themes, because any published reinforcement rule can
arrive there. Prompt
`daily-astro-body-7` is reserved by separate transit-story work, so this correction
uses `daily-astro-body-8`; whether its prose improves is decided only by fresh review
of actual model output.

Validator `daily-reference-5` accepts two to four paragraphs of one to four
complete sentences. The first paragraph still requires C1 and I1; every paragraph
requires supplied references. D1/P1/T1 coverage is optional, but the prompt requires
them wherever their claims are used. A paragraph naming a planet, aspect, orb or
ISO date still needs the matching calculated cycle ID, even when T1 repeats the
value. Numeric, relation, safety and suppression checks remain. The angle guard
now catches noun-like shorthand such as “your rising shapes…” while allowing
ordinary phrases such as “your rising workload”. This is a bounded lexical check,
not a complete test of semantic support or suppression paraphrases.

The fact sheet labels the orb at the reading's calculation time separately from
the calculated exact date. The prompt requires these in separate sentences.
The `timing` rejection enforces that structural distinction for a sentence that
combines an orb/degree reference with an ISO date or recognized exact-time wording.
Parentheses and semicolons do not separate sentences. Correctly split statements,
qualified rounding, and precision wording such as “the exact current orb” remain
valid. This bounded rule does not check every temporal paraphrase or prove that
each degree/date belongs to the right clause. A close, exact-phase contact with no
scanned exact date cannot acquire one from the phase label alone.

Built-in fallback copy `builtin-0.5.0` retains six reviewed exact interpretations and
six directional pair rules; the inactive natal candidate `builtin-0.6.0` adds 62 natal
possibilities without changing them. A selected tension/reinforcement relationship produces
`S1`; independent and unmatched pairs produce no joint narrative premise. Legacy
active arrays remain authoritative and inherit neither new themes nor new rules.
The daily cache includes plan/prompt/validator/model identity as well as content
version and local context, retaining old rows and feedback.

Source trails are saved with new readings and restored on cache reads. The records
client no longer adds a nonexistent `created_at` column to `reading_sources`.
If saving that trail fails, generation reports an error and removes only the
new incomplete reading so a retry can save the whole result. New readings also
record the expected source count: if cleanup fails, a later cache read reports
the incomplete trail instead of silently showing it as saved. This does not
reconstruct source rows missing from older readings, which have no count marker.

Older diagnostics stay instrumented with an unrecorded timeout budget rather
than acquiring the new value. Historical diagnostics keep their saved versions. The new daily policy digest
starts a new reading rather than reusing a pre-synthesis cache row. Natal chapters and
editorial drafting retain their separate 90-second budget.

To score candidate responses, replace the paragraph objects in the exported file with saved responses for these same synthetic cases. Keep all 28 case IDs; the quiet case remains `null` because generation is skipped. Only the fixed JSON format is accepted, and candidate files never execute code or enable network access. A replay without source evidence is a fixture run (`candidate-replay`).

```sh
npm run eval:reading -- --bundle natal-candidate --responses /tmp/pattern-candidates.json --output /tmp/pattern-after.json
npm run eval:reading -- --compare /tmp/pattern-before.json /tmp/pattern-after.json --output /tmp/pattern-comparison.json
```

To replay a downloaded hosted report, extract its captured candidates into that same
case-keyed dictionary, then bind the replay to the report:

```sh
npm run eval:reading -- --bundle builtin --extract-responses complete-report.json --output responses.json
npm run eval:reading -- --bundle builtin --responses responses.json --source-report complete-report.json --output replay.json
```

Extraction accepts only a complete report with all 28 unique cases whose fixtures,
input hashes, model and copy match the selected shipped bundle, and whose every
capture is lossless. Accepted, untruncated historical drafts remain usable; a
historical rejected draft has no proof of lossless capture and is refused. A report
made with custom active copy matches neither shipped bundle and is refused rather
than replayed against built-in copy. `--source-report` checks the report's SHA-256,
identities and exact candidates, then records the report's own identity
(`sourceReport`) apart from the replay's current metadata: replaying old text never
gives the source report a new prompt identity or a deployed revision.

A natal experiment uses the strict comparison, which permits only bundle and
evaluation-selector differences and checks source revisions through identity
records (`reading-evaluation-identity-1`). A record without a source revision is
reported as a qualification gap:

```sh
npm run eval:reading -- --compare-natal baseline.json candidate.json --before-identity baseline-identity.json --after-identity candidate-identity.json --output natal-comparison.json
```

Output files must be new paths, so the CLI does not replace a saved baseline. Comparisons require the same fixture version, exact case IDs, and input configuration hashes. Version-4 comparisons also require identical frozen bundle version/hash and model; the natal policy can differ to isolate using the lens. Historical reports do not acquire inferred versions. Plan, natal plan, reliability, prompt, validator, copy-selector and gateway budget changes remain explicit; a change during an in-page run stops it. Replaying saved text against a new prompt cannot assess that prompt's effect: obtain new candidate responses separately. This CLI deliberately makes no live model calls.

Every case keeps blank `manualReview` fields for a future human review; AI review
never fills them. Under the current AI review lane, reviews are separate artifacts
produced from blinded packets by `scripts/reading-writing-review.mjs` (see the
[protocol](docs/reviews/daily-reading-writing/review-protocol.md)). The fields below
remain the historical human rubric, which AI scoring reuses. Do not turn validation
acceptance into a quality score.

| Field                      | Manual rubric                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specificity`              | 1: interchangeable summary; 3: tied to the selected contact; 5: concrete distinctions supported by the published source copy                         |
| `voice`                    | 1: stiff or inconsistent with the requested tone; 3: clear and mostly consistent; 5: natural, distinctive, and consistent throughout                 |
| `repetition`               | 1: repeated stock phrasing dominates this suite; 3: some reuse; 5: relevant variation without inventing facts                                        |
| `grounding`                | 1: unsupported or contradictory claims; 3: some statements need review; 5: each substantive claim can be traced to supplied facts and editorial copy |
| `lensIntegration`          | 1: interchangeable or separate personality text; 3: cited but weakly applied; 5: a distinct, supported practical lens within the primary meaning     |
| `unsupportedPersonalClaim` | Boolean manual flag: any unsupported temperament certainty, clinical explanation, biography, prediction or claimed event                             |
| `notes`                    | Cite a paragraph and the supporting or missing fact; record the reason for the score                                                                 |

These are human judgments, not automated guarantees. Citation membership and the bounded contradiction checks cannot prove arbitrary prose semantically supported. An acceptance improvement can accompany worse writing or unsupported claims, so report validation results and manual judgments separately.

## Current writing gate: AI review lane

From 2026-10-11 the current writing gate uses the AI review lane defined in
[`daily-writing-ai-review-1`](docs/reviews/daily-reading-writing/review-protocol.md),
because no human prose reviewer is available. Two fresh, blinded AI reviewer
contexts score every corrected candidate and distinct displayed or template body.
Both must give specificity, grounding and coherence at least 4/5 (and synthesis
coherence at least 4/5 when `S1` is supplied), with no unresolved substantive
finding. A pass is reported only as **AI writing-review passed**, never as human
approval. Every qualification summary records `humanReviewCompleted: false`.

AI review artifacts are separate files with their own provenance. Exported
`manualReview` fields stay untouched. The blinded human review required in the two
gates below is historical and remains unsatisfied; it is deferred, not replaced.

The bookkeeping runs locally, with no model or network calls:

```sh
node scripts/reading-writing-review.mjs prepare --before baseline-report.json --after corrected-report.json --output-dir NEW_DIR
node scripts/reading-writing-review.mjs qualify --assignment NEW_DIR/assignment.json --review reviewer-a.json --review reviewer-b.json --output qualification.json
```

`prepare` writes one independently shuffled packet per reviewer under
`NEW_DIR/packets/` and a private `assignment.json` that maps neutral item IDs back
to runs and cases; reviewers never receive the assignment. `qualify` adds
`--adjudication` when a dispute needs one, and refuses incomplete, mismatched or
non-blind review files.

## Synthesis qualification gate

When supplied, paragraph 1 or 2 must cite `S1` and all four parents
`C1/I1/C2/I2`; every other paragraph using `S1` also cites those parents. Missing
parents reject with `dependencies`, and missing early synthesis rejects with
`synthesis_coverage`. Numeric and geometry claims require direct calculation IDs.
Without `S1`, the prompt prohibits an invented joint premise.

`scripts/reading-eval-cases.mjs` contains source-reviewed handwritten accepted and
rejected validator examples. One deliberately invented relationship in an
independent case passes structural validation but is marked for human rejection.
These examples demonstrate validator limits and are not actual model-quality evidence.

Obtain separately authorized complete baseline and candidate runs in isolated
environments, each with the same frozen v4 fixtures and reviewed bundle.
Preserve raw synthetic candidates, fallbacks, versions, bundle hashes, failures,
and the code identity for each run. Do not activate production content to qualify
the feature. Blinded reviewers use the same rubric on both runs; record synthesis
coherence from 1–5 in `manualReview.notes`: 1 = interchangeable/invented connection,
3 = both sources appear but the relationship needs editing, 5 = a distinct
relationship supported by both sources.

Selected tension/reinforcement cases must score at least 4/5 for specificity,
grounding, and synthesis coherence, with no unsupported substantive claims or
invented personal events. Independent/unmatched cases must invent no joint premise.
Record disagreements, revise source copy or prompt, and obtain a new complete
evidence round if the gate fails. Validation acceptance, writing scores, latency,
and gateway failures remain separate. Incomplete runs do not qualify.

Current qualification status: local implementation/replay only. Actual-model
baseline/candidate runs and blinded human scores are pending; publication,
activation, deployment, and live-account verification have not been performed.

## Natal qualification gate

The twelve natal cases contain raw synthetic service-marked sample responses rather
than hardcoded qualification booleans. Both runners build sample Charts with the
production helper and use the same pure reliability screen and lens planner.
Synthetic source labels test the pipeline, not live Swiss accuracy. Negative cases
omit `N1` and still exercise the model. The duty/freedom pair has identical primary,
timing, tone/depth and other editorial facts; only natal evidence changes.

Reports save `daily-natal-lens-2` / `natal-reliability-1` identities and synthetic
selection/source evidence. That detailed view exists only in synthetic reports;
production quality counts bounded IDs/codes and does not expose origins. When supplied,
`N1` requires paragraph-1-or-2 use and explicit `C1/I1` parents in every cited paragraph.
`natal_coverage`, `natal_claim`, and existing dependency/placement/geometry guards
exercise structural limits, not semantic proof or an empirical temperament claim.

For actual writing qualification, run these same fixtures, primary/synthesis copy,
model and permitted preferences twice on the same deployed code: the baseline with the
**Natal-free built-in baseline** evaluation copy (`bundleSource: builtin`) and the
candidate with the **Inactive natal candidate** copy (`bundleSource: natal-candidate`).
Choosing the candidate publishes and activates nothing, so no release pointer changes.
No separate checkout or policy switch is needed; the strict `--compare-natal`
comparison verifies identical transit copy, policies and source revision. Obtain fresh model results through an
explicitly invoked synthetic evaluation; retain inputs, hashes, outputs, attempts,
partial failures, durations and cost evidence. No production pointer change is needed. Independent reviewers score candidates and templates blind: each natal
positive needs specificity, grounding and lens integration ≥4/5, with zero unsupported
personal claims. Reviewers must identify a supported practical distinction in the
duty/freedom pair; adjective swaps do not pass. Negative cases must contain no natal
claim. All scores remain null in replay; actual-model writing qualification and
independent catalogue approval remain open.
