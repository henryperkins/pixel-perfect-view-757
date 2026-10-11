# Reading evaluation

Run the fixed suite before changing the daily prompt or published copy:

```sh
npm run eval:reading -- --output /tmp/pattern-before.json
npm run eval:reading -- --write-responses /tmp/pattern-candidates.json
```

The default run replays handwritten JSON through the actual `assembleReading`, `readingFacts`, and `generateReadingProse` modules. All application fetch, HTTP(S), TCP, TLS, UDP, and DNS calls are blocked; the language gateway receives an in-memory response. The CLI loads no project configuration or `.env` files, substitutes a fake gateway key, and restores the environment on exit. No account, birth record, provider request, or private notes are needed.

The baseline answers are validator fixtures, not model outputs or recommended prose. Its acceptance rate only describes those fixtures. It cannot measure the live fallback rate, provider performance, tone quality, or semantic truth. The chart plans are synthetic contacts, not an ephemeris accuracy test. Local dates and daylight-saving conversions use the app's date helpers.

The versioned `synthetic-daily-1` suite contains ten fixed cases:

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

The JSON report records the effective facts, production prompt and response schema, selected cycle keys, template body, displayed body, citations, bounded rejection code, and prompt/validator/bundle versions. Request headers and credentials are excluded. Attempt durations are local replay timings, not live service latency. Skipped cases are separate from attempts, and `liveAcceptanceRate` is always `null`.

To score candidate responses, replace the paragraph objects in the exported file with saved responses for these same synthetic cases. Keep all ten case IDs; the quiet case remains `null` because generation is skipped. Only the fixed JSON format is accepted, and candidate files never execute code or enable network access.

```sh
npm run eval:reading -- --responses /tmp/pattern-candidates.json --output /tmp/pattern-after.json
npm run eval:reading -- --compare /tmp/pattern-before.json /tmp/pattern-after.json --output /tmp/pattern-comparison.json
```

Output files must be new paths, so the CLI does not replace a saved baseline. Comparisons require the same fixture version, exact case IDs, and input configuration hashes. Prompt, validator, bundle, and model identities appear side by side; their changes are allowed so the same inputs can assess a revision. Replaying the same saved text against a new prompt cannot assess that prompt's effect: obtain new candidate responses separately for a writing comparison. This CLI deliberately makes no live model calls.

Every case has blank `manualReview` fields. Read the actual candidate body against its facts and fill these fields in a copy of the report. For a rejected candidate, review its draft in the candidate file as well as the displayed template body. Use the same reviewer and rubric before and after. Do not turn validation acceptance into a quality score.

| Field         | Manual rubric                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specificity` | 1: interchangeable summary; 3: tied to the selected contact; 5: concrete distinctions supported by the published source copy                         |
| `voice`       | 1: stiff or inconsistent with the requested tone; 3: clear and mostly consistent; 5: natural, distinctive, and consistent throughout                 |
| `repetition`  | 1: repeated stock phrasing dominates this suite; 3: some reuse; 5: relevant variation without inventing facts                                        |
| `grounding`   | 1: unsupported or contradictory claims; 3: some statements need review; 5: each substantive claim can be traced to supplied facts and editorial copy |
| `notes`       | Cite a paragraph and the supporting or missing fact; record the reason for the score                                                                 |

These are human judgments, not automated guarantees. Citation membership and the bounded contradiction checks cannot prove arbitrary prose semantically supported. An acceptance improvement can accompany worse writing or unsupported claims, so report validation results and manual judgments separately.
