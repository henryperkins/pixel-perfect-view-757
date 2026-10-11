# Reading evaluation

## Run an on-demand model evaluation

Sign in as an admin, open `/content`, and choose **Run synthetic evaluation** in
Reading quality. This runs the 16 fixed cases below immediately: at most 15 eligible
model requests and one quiet-day check that makes no model call. Each case uses
the production model, prompt, validator, and the effective active interpretation
bundle. The model key stays on the server.

The inputs are checked-in synthetic contacts. The endpoint accepts only a fixed
case ID; it does not accept a chart, prompt, model override, or account context.
It reads the admin role and active copy, without reading birth records, check-ins,
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
visible for manual review; generated paragraphs are bounded and marked when
truncated. Provider error bodies, exception text and credentials are excluded.
Production reading diagnostics continue excluding generated draft text.

Download the JSON report before leaving the page. Results are held only in page
memory. Partial runs are marked as partial; a before/after comparison needs all
16 fixed cases. A completed report is compatible with the comparison command:

```sh
npm run eval:reading -- --compare /tmp/pattern-before.json /tmp/pattern-after.json --output /tmp/pattern-comparison.json
```

The displayed acceptance rate describes model attempts in this synthetic run,
including gateway failures and excluding quiet skips, missing primary interpretations, and missing configuration.
It does not estimate acceptance for production users or score writing quality.
Use the manual rubric below to review specificity, voice, repetition and grounding
before and after a prompt or copy change.

## Offline replay

Run the fixed suite before changing the daily prompt or published copy:

```sh
npm run eval:reading -- --output /tmp/pattern-before.json
npm run eval:reading -- --write-responses /tmp/pattern-candidates.json
```

The default run replays handwritten JSON through the actual `assembleReading`, `readingFacts`, and `generateReadingProse` modules. All application fetch, HTTP(S), TCP, TLS, UDP, and DNS calls are blocked; the language gateway receives an in-memory response. The CLI loads no project configuration or `.env` files, substitutes a fake gateway key, and restores the environment on exit. No account, birth record, provider request, or private notes are needed.

The baseline answers are validator fixtures, not model outputs or recommended prose. Its acceptance rate only describes those fixtures. It cannot measure the live fallback rate, provider performance, tone quality, or semantic truth. The chart plans are synthetic contacts, not an ephemeris accuracy test. Local dates and daylight-saving conversions use the app's date helpers.

The `synthetic-daily-3` suite retains the ten v2 cases (including the corrected
Mercury chronology) and adds six synthesis cases. Build this same v3 catalogue into
both baseline and candidate evaluators before a writing comparison. Saved v1/v2
reports remain historical evidence; they cannot be compared against changed v3
inputs. Preserve each evaluator's commit/worktree identity and the exported bundle
hash separately.

| Case                           | Coverage                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `saturn-square-sun`            | Common hard contact; plain, standard depth                     |
| `saturn-square-moon-warm`      | Warm tone and inner-life source copy                           |
| `jupiter-trine-sun-technical`  | Soft contact, exact phase, technical depth                     |
| `mercury-conjunction-clinical` | Clinical tone and separating phase                             |
| `venus-opposition-venus`       | Short preference contact and relationship framing              |
| `unknown-birth-time`           | A stronger angle contact must be suppressed                    |
| `approximate-birth-time`       | A stronger house-placement contact must be suppressed          |
| `moon-dst-boundary`            | Moon date crosses midnight before a DST change                 |
| `multiple-cycles`              | Unsorted contacts, strongest-three cap, weak-contact filtering |
| `quiet-threshold`              | No contact above the threshold; no language call               |
| `synthesis-tension`            | Reviewed structure/expansion pair; synthesis in paragraph 1    |
| `synthesis-reinforcement`      | Reviewed persistence/initiative pair; synthesis in paragraph 2 |
| `synthesis-independent`        | Explicit independence; separately supported meanings           |
| `synthesis-reversed`           | Separately reviewed reversed tension orientation               |
| `synthesis-suppressed-support` | Supporting angle removed before pair selection                 |
| `synthesis-unmatched`          | Reviewed meanings with no published pair rule                  |

The JSON report records the effective facts, production prompt and response schema, selected cycle keys, enriched fact dependencies, bounded interpretation-plan identity, template body, displayed body, citations, bounded rejection code, plan/prompt/validator/bundle versions, and configured gateway timeout budget. Request headers and credentials are excluded. Attempt durations are local replay timings, not live service latency. Skipped cases are separate from attempts, and `liveAcceptanceRate` is always `null`.

Daily prompt `daily-astro-body-5` defines plain, warm and clinical voices, each
with a short style-only example. The selected synthesis comes first, then primary and supporting meanings, optional
framing, and calculation references. The opening develops that meaning before technical
detail; domain, phase and timing receive space only when they add a distinct idea.
Standard and technical depth have separate length/detail guidance. The current
brief distinguishes conversational warmth from extra emotional claims, uses
familiar clinical wording, and discourages automatic repetition of the first
interpretation sentence. Everyday scenes remain conditional; a planet does not
establish what the reader feels or cause a decision, recovery or moment of clarity.

Validator `daily-reference-4` accepts two to four paragraphs of one to four
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

Built-in copy `builtin-0.5.0` adds six reviewed exact interpretations and six
directional pair rules. A selected tension/reinforcement relationship produces
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

To score candidate responses, replace the paragraph objects in the exported file with saved responses for these same synthetic cases. Keep all 16 case IDs; the quiet case remains `null` because generation is skipped. Only the fixed JSON format is accepted, and candidate files never execute code or enable network access.

```sh
npm run eval:reading -- --responses /tmp/pattern-candidates.json --output /tmp/pattern-after.json
npm run eval:reading -- --compare /tmp/pattern-before.json /tmp/pattern-after.json --output /tmp/pattern-comparison.json
```

Output files must be new paths, so the CLI does not replace a saved baseline. Comparisons require the same fixture version, exact case IDs, and input configuration hashes. Plan, prompt, validator, bundle, model, and gateway timeout appear side by side; their changes are allowed so the same inputs can assess a revision. Older reports without plan identity or a timeout show those as unrecorded, not inferred. A policy change during an in-page run stops it rather than mixing budgets. Replaying the same saved text against a new prompt cannot assess that prompt's effect: obtain new candidate responses separately for a writing comparison. This CLI deliberately makes no live model calls.

Every case has blank `manualReview` fields. Read the actual candidate body against its facts and fill these fields in a copy of the report. For a rejected candidate, review its draft in the candidate file as well as the displayed template body. Use the same reviewer and rubric before and after. Do not turn validation acceptance into a quality score.

| Field         | Manual rubric                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specificity` | 1: interchangeable summary; 3: tied to the selected contact; 5: concrete distinctions supported by the published source copy                         |
| `voice`       | 1: stiff or inconsistent with the requested tone; 3: clear and mostly consistent; 5: natural, distinctive, and consistent throughout                 |
| `repetition`  | 1: repeated stock phrasing dominates this suite; 3: some reuse; 5: relevant variation without inventing facts                                        |
| `grounding`   | 1: unsupported or contradictory claims; 3: some statements need review; 5: each substantive claim can be traced to supplied facts and editorial copy |
| `notes`       | Cite a paragraph and the supporting or missing fact; record the reason for the score                                                                 |

These are human judgments, not automated guarantees. Citation membership and the bounded contradiction checks cannot prove arbitrary prose semantically supported. An acceptance improvement can accompany worse writing or unsupported claims, so report validation results and manual judgments separately.

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
environments, each with the same v3 fixtures and its intended reviewed bundle.
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
