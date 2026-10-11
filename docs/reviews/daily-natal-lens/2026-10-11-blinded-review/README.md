# Blinded AI natal writing review, 2026-10-11

This directory preserves the two uploaded actual-model reports and a fresh-context
AI editorial review. The review used 79 unique prose/support contexts: 78 scored
items and one quiet-day item checked for safety. These represent 51 captured model
outputs and 56 template occurrences across two 28-case reports. Deduplication
requires identical text, fact support, tone, depth and suppression context.

The reports record Gemini Enterprise `gemini-enterprise/gemini-3.8-flash`,
`synthetic-daily-5`, `daily-astro-body-8`, `daily-reference-5`, and a 60,000 ms
deadline. They do not record the observed generating source revision or provider
cost. The review workspace revision does not fill either gap.

## Evidence index

| Artifact | Purpose |
| --- | --- |
| [baseline-report.json](baseline-report.json) | Exact original built-in `builtin-0.5.0` report; manual scores remain null |
| [candidate-report.json](candidate-report.json) | Exact original natal `builtin-0.6.1` report; manual scores remain null |
| [source-identity.json](source-identity.json) | Original paths/checksums, recorded metadata and provenance gaps |
| [baseline-identity.json](baseline-identity.json), [candidate-identity.json](candidate-identity.json) | Hash-bound identity records with generating revisions explicitly unknown |
| [comparison.json](comparison.json) | General comparison from the initial checkout |
| [natal-comparison.json](natal-comparison.json) | Strict natal comparison from `origin/main`; retains both unproven-revision gaps |
| [integrity-checks.json](integrity-checks.json) | Input, request, factual-support, source-summary and paired-coverage checks |
| [review-instructions.txt](review-instructions.txt) | Frozen rubric, applicability rules, claim checks and blindness constraints |
| [reviewer-a-task.txt](reviewer-a-task.txt), [reviewer-b-task.txt](reviewer-b-task.txt) | Exact reviewer assignment prompts |
| [packet-a.json](packet-a.json), [packet-b.json](packet-b.json) | Independently randomized, source-label-masked reviewer packets |
| [review-a.json](review-a.json), [review-b.json](review-b.json) | Original frozen item scores, exact quoted findings, contrast/repetition judgments and blindness declarations |
| [assignment-after-unblinding.json](assignment-after-unblinding.json) | Original assignment key, revealed after both reviews were complete |
| [review-manifest.json](review-manifest.json) | Packet/rubric/task/review hashes, context provenance and blinding limitations |
| [review-integrity.json](review-integrity.json) | Completeness, hash binding, applicability and exact-passage validation |
| [review-summary.json](review-summary.json) | Both judgments mapped to sources/cases, individual gates, disagreements and missing model responses |

These are separate AI contexts using the inherited model configuration; independent
model families and human review are not established. The coordinator had seen the
earlier reports and advisory findings. The two fresh reviewers received only their
own masked packet and rubric, and did not receive that conversation, source
assignments or each other's judgments. N1 presence and prose style can still make
a sample's treatment or origin inferable. Citation arrays were omitted uniformly;
semantic review and structural citation acceptance are separate evidence.

The packets, original reports and original review artifacts must retain their
exact bytes because their SHA-256 values bind the assessments. Source assignments
are public within this synthetic evidence directory after unblinding. A future
fresh reviewer must receive only a new masked packet and its instructions.

The current results and remaining qualification work are recorded in
[writing-qualification.md](../writing-qualification.md). No external generation,
publication, deployment or content activation was performed for this review.
