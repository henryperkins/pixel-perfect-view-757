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

## Corrected natal-free run (Task 6)

| Artifact                                                           | SHA-256                                                            | Provenance and limits                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`corrected-report.json`](corrected-report.json)                   | `afc9bdbf879c45b5dc3bd437402d05193cf4b3f3edd6ff90c4e2aeab8ed7372b` | Unchanged copy of `reading-evaluation-complete-builtin-2026-10-11T18-39-29.json`, run 18:33–18:39 UTC on the Lovable preview with **Natal-free built-in baseline** selected. The owner uploaded it with Chrome's `.crdownload` suffix; its bytes and hash equal the hash taken in the page at download time. |
| [`corrected-source-identity.json`](corrected-source-identity.json) | n/a (derived record)                                               | Matched-input checks, coverage, latency and gaps. Source revision `4c96fd5` is inferred from push and Lovable sync evidence; the report itself records no build identity.                                                                                                                                    |
| [`source-responses.json`](source-responses.json)                   | `e82f652ed706971f891eae4698a1f8777e516f892d32ee8ef9c57ed94a808115` | Responses extracted from `source-report.json` with `--bundle builtin`.                                                                                                                                                                                                                                       |
| [`source-replay.json`](source-replay.json)                         | `23aa22c21db48f62fef8acc6fe2909e79d4bd889948a88764cc38ee6a4d515ab` | Offline replay bound to the source report: 27 accepted, one skip; all 28 outcomes match. Its `sourceReport` keeps the source's `daily-astro-body-6` identity.                                                                                                                                                |
| [`corrected-responses.json`](corrected-responses.json)             | `ffb588735a5c8cfddb4cc528b8d6fa63d93659f50298c91a22847a76bd99a2fc` | Responses extracted from `corrected-report.json` with `--bundle builtin`.                                                                                                                                                                                                                                    |
| [`corrected-replay.json`](corrected-replay.json)                   | `0adadcc227d3cde5bd775a89bb8949c3a6325e7d2abe7d61fa57bb5eeafc1438` | Offline replay bound to the corrected report: 26 accepted, one `sentence` rejection, one skip; all 28 outcomes match.                                                                                                                                                                                        |
| [`comparison.json`](comparison.json)                               | `5405ab4e0661824b233dd36a41084cd9e378b5c24f61a0dff859e494eb642699` | Live source versus live corrected report. Changes: `promptVersion` `daily-astro-body-6` → `daily-astro-body-8` and `bundleSource` `null` → `builtin`. Accepted delta −1.                                                                                                                                     |

What the corrected run establishes:

- The same 28 inputs (`caseSetHash` and all 28 config hashes), `builtin-0.5.0` copy,
  transit copy and model as the baseline; prompt `daily-astro-body-8` is the
  intended change.
- 27 model attempts: 26 accepted, one validator rejection
  (`jupiter-trine-sun-technical`, `sentence`, paragraph 2) and one `no_cycle` quiet
  skip. All 27 drafts were captured losslessly (`captureLossless: true`), including
  the rejected one.
- Recorded attempt latency: median 11.552 s (minimum 5.168 s, maximum 19.508 s,
  sum 316.438 s).

What it does not establish: writing quality (the blinded AI review below decides
it), cost (no usage is returned; at most 27 calls), a raw HTTP record, or any
natal-lens behaviour. Replays show validator integrity only; they cannot show the
prompt change's effect.

## Blinded AI writing review (Task 7)

Packets were prepared from the two live reports above: item-set hash
`443911fc…72c6`, 74 items (54 model drafts and 20 template or displayed bodies),
nothing uncovered. The assignment stays outside reviewer reach until both reviews
are in. Reviews, any adjudication and the qualification summary are added here when
they complete; each keeps `humanReviewCompleted: false`.
