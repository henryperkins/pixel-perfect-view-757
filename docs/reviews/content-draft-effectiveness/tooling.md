# Frozen content pilot tooling

These commands operate on local files and make no model or network calls. The only
paid scope is the separately authorized four-case paired pilot: eight attempts
maximum, $5 total, no retries. The 70-case fixture manifest is offline coverage.

`frozen-pair.json` must be the complete `FrozenContentComparisonPlan` exported from
the selected persisted draft or inactive release. The attachment cycle comparison
is partial source evidence and cannot substitute for this complete plan.

Before generation, freeze the existing 1–5 body rubric, the added voice/repetition
minimum of 4/5, packet supplement, and reflection checks:

```sh
node scripts/evaluate-readings.mjs --freeze-content-rubric frozen-pair.json --output review-rubric.json
```

Archive that file and its SHA-256 beside the reviewed pair hash before making any
paid request. This step leaves every manual score and question judgment blank.
The existing `daily-writing-ai-review-1` item-verdict rules remain unchanged; the
voice/repetition threshold is an additional content-pilot qualification gate.

The UI's **Download pilot evidence** file contains both run captures, the frozen
pair and their reservation ledgers. Convert it into reports without discarding the
original capture:

```sh
node scripts/evaluate-readings.mjs --unpack-content-evidence content-pilot.json --output-dir unpacked-pilot
```

This creates `baseline-report.json`, `candidate-report.json`, `frozen-pair.json`,
both ledgers and `raw-envelope.json`. It refuses incomplete arms, uncertain
captures, changed pair identities, mismatched campaign IDs or a budget other than
the approved eight-attempt/$5 scope. Its `review-rubric-reconstructed.json` is a
local reconstruction, never evidence that a rubric was frozen before generation;
retain the original preflight rubric separately.

After both complete reports are available, compare only their declared pair:

```sh
node scripts/evaluate-readings.mjs --compare-content baseline-report.json candidate-report.json --content-plan frozen-pair.json --output comparison.json
node scripts/evaluate-readings.mjs --extract-content-responses candidate-report.json --content-plan frozen-pair.json --arm candidate --output candidate-responses.json
```

Extraction requires lossless, untruncated captures. To run the current production
assembly, prompt construction and validators against those captured responses:

```sh
node scripts/evaluate-readings.mjs --replay-content candidate-report.json --content-plan frozen-pair.json --arm candidate --output candidate-replay.json
```

Replay uses fake credentials and intercepts the selected provider's native response
in memory. HTTP(S), TCP, TLS, UDP and DNS remain blocked. The command requires the
local Git commit to match the frozen source SHA and rejects dirty runtime source;
documentation, tests and evidence artifacts may differ and that boundary is recorded.
It also rebuilds the frozen plans and compares each actual request to its captured
request. Changed prompts, policies, fixtures or source facts fail. Replay records
zero live model attempts and cannot count as a new live result or a repair call.

The generic and natal comparison commands retain their existing same-source
requirements. Missing or partial reports cannot become a complete pair. Every
output file uses exclusive creation; unpack/review directories must be new.

Prepare two neutral review packets and blank reflection companions:

```sh
node scripts/reading-writing-review.mjs prepare --before baseline-report.json --after candidate-report.json --content-plan frozen-pair.json --output-dir new-review
```

Give each fresh reviewer only their own packet and reflection companion. Keep
`assignment.json`, report outcomes and origin labels private. The companion uses
neutral item IDs and binds the packet, item-set and pair hashes. Every source
question needs `singleQuestion`, `answerableWithoutPremise`, and
`consistentWithSources`, plus a verbatim quote and explanation. Review the final
prompt separately for assumptions, consistency and coherence, recording its
question count. Schema 4 can append a domain question; that inherited composition
does not change the source question's one-question requirement.

Check completed body reviews using the existing adjudication workflow and the
reflection companions independently:

```sh
node scripts/reading-writing-review.mjs qualify --assignment new-review/assignment.json --review body-a.json --review body-b.json --output body-qualification.json
node scripts/reading-writing-review.mjs qualify-reflections --assignment new-review/assignment.json --review reflection-a.json --review reflection-b.json --output reflection-qualification.json
```

No additional paid reviewer calls are authorized. These tools validate bindings
and bookkeeping; they do not establish the truth of reviewer judgments. Body-only
review cannot approve the content change. Source selection, submission, accepted
citation, literal template/final rendering, and manual semantic incorporation are
separate evidence. The pilot covers four of the 20 reachable additions; the other
16 remain offline-only, while the two global fallbacks are shadowed in the complete
supported catalogue. Exact-content human approval and activation remain separate.
