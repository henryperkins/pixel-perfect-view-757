# Daily writing qualification evidence — 2026-10-11

This directory holds the evidence for the
[writing qualification checklist](../../../superpowers/plans/2026-10-11-daily-reading-writing-qualification-checklist.md).
Each artifact below has its own provenance. Validator acceptance, AI writing review,
human review, cost, Git sync, app publication and content activation are separate
results; one does not stand in for another.

## Pre-correction writing baseline

| Artifact                                                                       | SHA-256                                                            | Provenance and limits                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`source-report.json`](source-report.json)                                     | `166124efbabfb7ad690bda2d178fa4fd8fbbc7f9e7b4df668cdb4db0c6dc588f` | Unchanged copy of the user-uploaded hosted `live-synthetic` report `reading-evaluation-complete-2026-10-11T16-31-23.json`. The hash matches the original upload.                                                     |
| [`source-identity.json`](source-identity.json)                                 | n/a (derived record)                                               | Recorded versions, content/input hashes, coverage, latency and the gaps that remain. Unknown values stay `null`.                                                                                                     |
| [`matched-integrity-summary.json`](matched-integrity-summary.json)             | `c66f5262319267f1378166e9a8c7d7f84de070b2e274d6bca814a14f24a05f85` | Unchanged copy of the offline replay summary. The saved candidates were replayed with the matching natal-free `builtin-0.5.0` bundle: 27 accepted, one quiet skip, no identity mismatches and no new provider calls. |
| [`unblinded-ai-advisory/`](unblinded-ai-advisory/ordinary-prose-advisory.json) | see below                                                          | **Unblinded AI advisory review.** It is not a blinded review, a human review or a qualification score.                                                                                                               |

Unblinded AI advisory files (copied unchanged):

- [`ordinary-prose-advisory.json`](unblinded-ai-advisory/ordinary-prose-advisory.json) — `3a6b53950e4096de2271b44c3043aa86ee1c4d7eab7bed339858736fef08e63d`
- [`synthesis-advisory.json`](unblinded-ai-advisory/synthesis-advisory.json) — `76a3e93d797411a5d551ab030ea4ed4bee4e135f5a08f6cca042c2f3df781430`

The reviewers who wrote these files could see case names, outcomes and the
implementation context. Their findings are regression inputs for the prompt
correction. They are not the blind judges for Task 7.

## What the baseline establishes

- A complete hosted `live-synthetic` run of fixture `synthetic-daily-5`: 28 unique
  cases, 27 model attempts, 27 accepted, zero rejected or unavailable, and one
  `no_cycle` quiet skip (`quiet-threshold`). No candidate was truncated.
- Model `google/gemini-3.7-flash`, plan `daily-synthesis-1`, natal plan
  `daily-natal-lens-2`, reliability `natal-reliability-1`, prompt
  `daily-astro-body-6`, validator `daily-reference-5`, gateway timeout 20,000 ms.
- Natal-free copy `builtin-0.5.0` (bundle hash `f68cc97e…30c1`, transit-copy hash
  `4d6048ea…677d`). No case contains an `N1` fact, including cases whose fixture
  names begin with `natal-`.
- Recorded attempt latency: median 11.538 s, maximum 18.432 s, sum 315.934 s.
  These figures describe this run only.

## What it does not establish

- **Writing quality.** Every exported `manualReview` field is null and stays
  untouched. No blinded review or human review exists for this run.
- **Cost.** The report returns no billing usage or cost. None is inferred from
  latency.
- **Deployed code identity.** The report records no commit SHA or build identity.
  `source-identity.json` keeps `build.sourceRevision: null`.
- **Raw HTTP.** No raw provider response is retained.
- **Natal-lens behaviour.** This is a natal-free run. It is not a natal-candidate
  result.
- **A pre-synthesis comparison.** The earlier historical-code runner used different
  copy and is not the matched comparison for this plan.

## Temporary supporting material

The offline replay working directory
`/tmp/pattern-live-eval-review-20261011-9xsz690y/` is temporary supporting
material, not a durable release record. Its `matched-validator-replay.json`
(SHA-256 `73da45bd60961acc8476998205cd4edcd0bc879f5515086080041a24cc584d1e`) is
the full replay behind the integrity summary. The files named
`unmatched-natal-candidate-probe*` used the CLI's different default bundle; their
eight natal-coverage rejections are not failures of the uploaded natal-free run.

## Later rounds

Later tasks add the corrected hosted report, replay logs, comparison, blinded
packets, both AI reviews, any adjudication, and the qualification summary here.
Each keeps `humanReviewCompleted: false`.
