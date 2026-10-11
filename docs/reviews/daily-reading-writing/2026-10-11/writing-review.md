# Blinded AI writing review — round 1

**Result: AI writing-review failed.** The corrected run (prompt `daily-astro-body-8`)
does not meet the `daily-writing-ai-review-1` gate, so the correction is **not
qualified**. Human review is deferred (`humanReviewCompleted: false`). This is an
AI-reviewed synthetic result only: it is not human approval, empirical
psychological validation or proof of real-reader quality.

## Inputs

- **Runs.** Baseline [`source-report.json`](source-report.json) (prompt
  `daily-astro-body-6`) and correction [`corrected-report.json`](corrected-report.json)
  (prompt `daily-astro-body-8`), matched on all 28 inputs, `builtin-0.5.0` copy,
  transit copy and model.
- **Packets.** 74 items: 54 model drafts (including the one draft the validator
  rejected) and 20 template or displayed bodies; item-set hash `443911fc…72c6`,
  nothing uncovered. Each reviewer saw its own order, with no run, case, version or
  outcome labels.
- **Reviewers.** `reviewer-a` (dispatched 20:15:53Z, about 24 minutes) and
  `reviewer-b` (dispatched 20:40:32Z, about 27 minutes): fresh Claude Code
  general-purpose subagents dispatched with `model=opus` (both report
  `claude-opus-5-5`), one at a time. Each read only its packet file and wrote only
  its review. Both declare environment context the harness attached (repository
  notes, a memory index and a git status with commit subjects) and no implementation
  context. Fresh contexts of one model family are separate assessments, not
  independent model families.
- Prompts, packets and the assignment are in
  [`writing-review-inputs/`](writing-review-inputs/assignment.json).

## Corrected-run failures

17 of the corrected run's items fail: 9 model drafts and 8 template bodies.
"Both" means both reviewers independently gave the score or raised the finding.

**Raw model drafts**

| Case                          | Shown to the reader?           | Why it fails                                                                                                                        |
| ----------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `natal-duty-reflex`           | Yes                            | Both: factual mismatch (timing sentence, below); grounding 3 and coherence 3                                                        |
| `natal-unknown-time`          | Yes                            | Both: factual mismatch (timing sentence); grounding 3                                                                               |
| `unknown-birth-time`          | Yes                            | Both: factual mismatch (timing sentence); grounding 3                                                                               |
| `synthesis-reinforcement`     | Yes                            | Both: strengthened modality ("effort produces tangible results" for I2's "allowing effort to produce"); grounding 3. A: coherence 3 |
| `natal-synthesis-integration` | Yes                            | Both: strengthened modality ("make it natural" without I2's conditions); grounding 3                                                |
| `natal-freedom-reflex`        | Yes                            | Both: coherence 3                                                                                                                   |
| `saturn-square-moon-warm`     | Yes                            | A only: strengthened modality ("can easily get crowded"); grounding 3                                                               |
| `approximate-birth-time`      | Yes                            | B only: coherence 3                                                                                                                 |
| `jupiter-trine-sun-technical` | No — the validator rejected it | A only: strengthened modality ("offers" for D1's "can offer"); grounding 3                                                          |

The timing pattern: three drafts say the calculated exact date falls "in the middle
part of the calculated window". `T1` gives that position for today's reading, not
for the exact date.

**Displayed fallback behaviour.** `jupiter-trine-sun-technical` displayed its
template after the validator rejected the draft; both reviewers passed that
template. Every other failing draft was displayed. The template bodies below are
the deterministic fallbacks. Both runs share them, because the copy is identical,
so the prompt change cannot affect them:

| Template body                                                        | Why it fails                                |
| -------------------------------------------------------------------- | ------------------------------------------- |
| `synthesis-tension`, `synthesis-reinforcement`, `synthesis-reversed` | Both: coherence 3 and synthesis coherence 3 |
| `natal-synthesis-integration`                                        | Both: coherence 3 and synthesis coherence 3 |
| `saturn-square-moon-warm`                                            | Both: coherence 3                           |
| natal duty/freedom body (shared by two cases)                        | Both: coherence 3                           |
| natal service, exact-house and mixed-source body (shared by three)   | Both: coherence 3                           |
| `approximate-birth-time`                                             | B only: coherence 3                         |

Both reviewers describe these bodies as published statements placed one after
another, without connection.

## Compared with the baseline

The baseline grades are kept for comparison only. Over the same item set, 25
baseline items fail against 17 corrected ones (templates count in both). Mean
draft scores over 54 reviewer-and-case pairs:

| Dimension           | Baseline | Corrected | Pairs up | Pairs down |
| ------------------- | -------- | --------- | -------- | ---------- |
| Grounding           | 3.28     | 4.37      | 38       | 5          |
| Specificity         | 4.24     | 4.46      | 11       | 0          |
| Coherence           | 4.04     | 3.91      | 1        | 7          |
| Voice               | 4.00     | 3.89      | 0        | 6          |
| Repetition          | 3.80     | 3.22      | 0        | 28         |
| Synthesis coherence | 4.00     | 4.00      | 0        | 0          |

The correction mostly fixed claim strength, its target. Repetition across the suite
rose; it is not a gate dimension, but the next round should watch it.

## Disputes

No adjudication was run. Adjudication resolves findings and never raises a score,
and every failing corrected item has a score below 4 from at least one reviewer.
Thirteen of the 17 also fail on findings or scores both reviewers gave
independently, so no adjudication or reassessment could change the round's result.
The four single-reviewer failures (the `saturn-square-moon-warm` and
`jupiter-trine-sun-technical` drafts, and the `approximate-birth-time` draft and
template) remain on record for the next round.

## What the next round must address

1. **Timing:** keep `T1`'s position of today's reading in the window separate from
   the calculated exact date.
2. **Enabling statements:** keep the conditions and enabling verbs of statements
   such as "allowing effort to produce" or "frames moments when".
3. **Template fallbacks:** give the deterministic fallback a connected form. This is
   a code change, not a prompt change, and both runs' templates would change.
4. **Repetition:** check that a new prompt does not trade variety for safety.

A new round needs a new prompt identity, a fresh hosted run (at most 27 model calls)
and fresh blinded reviewers. No model output is edited, and these reviews are not
reused as the new round's judges.

## Files

| File                                                                             | SHA-256                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`reviewer-a.json`](reviewer-a.json)                                             | `13ce28f554d18dcc116eb7ec34226303074ca2f78b8ade5230d07c0a42c29e78` |
| [`reviewer-b.json`](reviewer-b.json)                                             | `52f2bab8dabee58b8d84bd507e81d064367c4598655d25c3b9607ad830356153` |
| [`qualification.json`](qualification.json)                                       | `2ac6c71808bb8b25474c858959dbcd4346bfbf86f5831a4a6e20adf6b16501a2` |
| [`writing-review-inputs/assignment.json`](writing-review-inputs/assignment.json) | `52a047e66e6faf7a08bc08870050ea99c8181686e91ad7ff8297debd9cf023be` |
| `writing-review-inputs/packet-reviewer-a.json`                                   | `40da3f5ddd22826307390d7d850c4dfecc1818fc90aa60fd3790113ff646ca1d` |
| `writing-review-inputs/packet-reviewer-b.json`                                   | `eb94c3b5c54c05df9f116eae4400be0fb7b3d05af0f6896d35ecfa9ee0628069` |
| `writing-review-inputs/prompt-reviewer-a.txt`                                    | `90636bfa3caa5e20c4429af8b38c065a0faeb2a3eae73d2ade30a5442d0af2ee` |
| `writing-review-inputs/prompt-reviewer-b.txt`                                    | `8627b2eb0993917b55670d6bba329c18c4cb22479a8a8468ca3ea1fe945169d9` |

Each prompt file is the text above its trailer line; the dispatched prompt ended
with a line giving that text's SHA-256. The qualification was produced by
`scripts/reading-writing-review.mjs qualify` after the quiet-check fix in
`67805ea`, which changed only how the checker reads a field name both reviewers
used.
