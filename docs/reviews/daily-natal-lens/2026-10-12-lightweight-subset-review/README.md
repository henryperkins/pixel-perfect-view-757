# Lightweight natal writing review — targeted review of partial-run evidence

**AI targeted writing-readiness review failed. Both candidates remain inactive.**
One fresh AI reviewer passed **10/14 prose samples: 4/7 raw drafts and 6/7
templates**. Four of the seven cases fully pass. The quiet template is safe, and both
duty/freedom contrasts are supported. One substantive finding and below-threshold
lens, coherence and synthesis scores fail four samples in three cases.

This is the first review under the [lightweight readiness gate](../lightweight-readiness.md).
It reviews seven existing round-3 candidate cases: each case's raw draft and its
deterministic template. It is **not a complete benchmark**. It does not change the
failed [round-2 full assessment](../2026-10-12-qualification-round-2/README.md) or the
closed [round-3 partial capture](../2026-10-12-qualification-round-3/README.md). Both
reports keep `partial: true`. No model calls were made, no draft was backfilled and no
baseline was reviewed.

## Results

Tuples are **specificity / grounding / voice / repetition / coherence / lens
integration / synthesis coherence**. `—` means not supplied. Voice and repetition do
not gate. Every other applicable score must be at least 4, with no unresolved
substantive finding.

| Case                          | Raw draft               | Template                | Result                                                |
| ----------------------------- | ----------------------- | ----------------------- | ----------------------------------------------------- |
| `natal-duty-reflex`           | 4/4/3/3/4/3/— `item-09` | 5/5/4/3/4/5/— `item-03` | Raw fails: lens integration 3                         |
| `natal-freedom-reflex`        | 4/4/3/4/4/4/— `item-13` | 5/4/4/3/4/5/— `item-04` | Pass                                                  |
| `natal-exact-house`           | 4/5/3/3/4/4/— `item-01` | 4/4/3/3/4/4/— `item-07` | Pass                                                  |
| `natal-moon-fallback`         | 4/3/3/3/3/4/— `item-02` | 5/5/4/3/4/5/— `item-08` | Raw fails: modality finding, grounding 3, coherence 3 |
| `natal-synthesis-integration` | 4/4/3/3/3/4/3 `item-14` | 4/4/4/3/3/4/2 `item-15` | Both fail: coherence 3, synthesis coherence 3 and 2   |
| `saturn-square-moon-warm`     | 4/5/3/3/4/—/— `item-10` | 4/5/2/3/4/—/— `item-05` | Pass                                                  |
| `natal-legacy-snapshot`       | 4/4/3/3/4/—/— `item-12` | 4/5/3/2/4/—/— `item-06` | Pass: no unsupported claim in either sample           |
| `quiet-threshold`             | not attempted (quiet)   | safe `item-11`          | Pass: no invented signal, claim or instruction        |

Both contrast checks find a distinct, supported practical choice between duty
(preparation versus waiting to have everything settled) and freedom (the commitment
versus how much choice it leaves). Freedom, exact house, warm and legacy-snapshot
samples pass. Neither round-2 failure recurs. The reviewer found the freedom draft keeps
N1's condition conditional, with every claim traced (grounding 4, lens integration 4).
The exact-house draft makes no timing claim at all (grounding 5).

## Material defects

| Sample                                       | Exact passage                                                                                                                                                                  | Why it fails                                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Moon fallback raw, paragraph 1 (substantive) | “an unfinished reply offers a place to notice the difference between useful preparation and waiting to have everything settled”                                                | N1 says an unfinished reply **can offer** that place. The draft states it categorically: `strengthened_modality`. The reviewer also found the paragraph stitched together and the D1 paragraph detached (coherence 3).               |
| Duty raw, paragraph 1                        | “For an unfinished reply, a self-contained response to pressure can start with sorting what is manageable before sharing it.”                                                  | The reply is never tied to the paragraph's quiet moment or next task, so N1 reads as a separate example (lens integration 3). Suggested fix: “If the next task is an unfinished reply, a self-contained response to that pressure…”. |
| Synthesis raw, paragraphs 1–2                | “Following more than one line of curiosity can help a direction take shape, while Saturn's square to the Sun highlights where expectations outpace available capacity…”        | “while” sets N1 against I1, a contrast neither statement makes. S1 then appears before its Jupiter–Mars parent and is never tied back (coherence 3, synthesis coherence 3).                                                          |
| Synthesis template, paragraph 2              | “Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.” | S1 stands alone: the Jupiter–Mars parent (C2, I2) never appears and neither contact is named (synthesis coherence 2). The free-afternoon projects also sit awkwardly beside the demanding role (coherence 3).                        |

The synthesis template is byte-identical to round 2, where both reviewers scored it 4
for synthesis coherence. A higher earlier score does not replace this judgment.
Scores are never averaged or adjudicated. The source cause is in
`composeNatalTemplate` (`src/lib/content/natal-template.ts`). For an authored
composition, paragraph 2 is `synthesis ?? primarySentences[1]`. The natal composition
also replaces the regular body (`src/lib/reading.server.ts`), dropping I1's contact
sentence and the “Also in range: jupiter trine natal mars” line that the natal-free
synthesis template keeps.

No second opinion was requested. The only substantive finding is a verifiable change
of source wording (“can offer” to “offers”), not a disputed reading. The other failures
are below-threshold scores, which the protocol never adjudicates or replaces.

## Useful wording changes (non-gating)

The reviewer also proposed these clarity edits. None gates by itself; they belong with
the reading-usefulness work.

- Warm and legacy-snapshot templates end with a separate “Timing: exact in 3 days.”
  paragraph after the phase sentence. That reads as a raw field label (warm voice 2,
  legacy voice 3). Proposed: “The contact is in its approaching phase and is exact in 3
  days; this reading falls in the middle part of the calculated window.” The legacy
  template's repetition 2 reflects verbatim source paragraphs that recur across items.
- Duty, warm and legacy raw drafts end two consecutive sentences on “calculated
  window”. Warm also says “The calculated exact date is 2026-10-14, which is exact in 3
  days.” Proposed: “The contact is exact on 2026-10-14, in 3 days.”
- Exact-house raw has a dangling modifier: “When mentally keeping track of the next
  task, an unfinished list may distinguish…”. Its template drops N1's subject: “one
  useful task may be different from making the entire routine a condition for taking a
  pause”.
- Freedom raw: “as in a calendar left too full” blurs I1's two scenes. “For the task
  being considered during that quiet moment” is stiff; D1's obligation that follows you
  into a quiet moment gives a smoother bridge.
- Legacy-snapshot raw places the D1 identity scene after the timing paragraph. Its
  opening “A routine or responsibility can show where expectations outpace available
  capacity” loses I1's sequence.

## Reliability observations

The selected raw drafts took 13.1–53.2 seconds, except `natal-legacy-snapshot` at
**100.6 seconds**. At the 60-second serving deadline that request would have shown its
labeled template, which passes here. The 120-second capture lane does not establish
60-second availability. The round-3 run's three timeouts and two unattempted cases
stay recorded in its [evidence index](../2026-10-12-qualification-round-3/interrupted-evidence-index.json)
and [partial-run audit](../2026-10-12-qualification-round-3/interrupted-run-audit.json).
None is a passing raw draft, and none is backfilled. Candidate raw negative coverage
remains 2/4.

## Next decisions for the operator

The gate's procedure is to fix the prose, then review only affected cases plus their
deterministic regressions. Each step below changes application source or needs paid
model calls, so none was started.

1. **Synthesis template (deterministic).** Compose the natal synthesis template with
   both parents: keep I1's contact sentence, and introduce I2 with its contact before
   S1. Preserve the archived-read contract in `consumedNatalTemplate`. Add regressions,
   then re-review only that template, plus the timing-label wording if it is changed.
2. **Raw drafts.** The guidance already asks to preserve modality and apply N1 inside
   the scene (`src/lib/ai/daily-voice.ts`). Options: a bounded validator check for a
   dropped “can/may/might” in near-verbatim reuse of a supplied sentence, and
   synthesis guidance to present both parents before S1. Revised drafts for duty, Moon
   fallback and synthesis require **new model calls**. That needs an explicit operator
   request, a separate output directory and truthful source identity; the closed
   round-3 run is never resumed.
3. Keep both candidates inactive. Release, publication and activation remain separate
   requests after the gate passes. Transit candidate chapters and P2 still need their
   own small review.

## Collection and provenance

- **Inputs, verified by hash before use:** the round-3
  [candidate partial report](../2026-10-12-qualification-round-3/natal-candidate-partial-report.json)
  `75a082fc…9d60`, [templates](../2026-10-12-qualification-round-3/templates.json)
  `f2434374…1254`, case contexts, template source manifest, capture receipt, source
  manifest, run plan, finish receipt, evidence index and audit. The unchanged
  [reviewer instructions](../2026-10-12-qualification-round-3/reviewer-instructions.md)
  are `822af5b1…a42b`. They share source revision `948aa00`, tracked source
  `a50ca0c8…e0` and runner `b0616656…518b`. Every selected raw draft is accepted and
  lossless, and its displayed body equals the draft. Every template body equals the
  offline capture. The [collection manifest](collection-manifest.json) records each
  sample's facts hash, tone, depth, limits, lens status, suppression flags and
  raw/template identity.
- **Packet:** [packet.json](packet.json) `98d230ae…a641`, item set `020f6fae…e14b`.
  It contains 15 unique items (7 raw, 7 templates, 1 quiet). No contexts were identical,
  so nothing deduplicated. Every paragraph citation array is masked as `null`; the
  originals stay in the [assignment](assignment-after-unblinding.json). The packet embeds
  the unchanged instructions and a short targeted scope, with two contrast sets and no
  repetition sets.
- **Reviewer:** one fresh context, `natal-subset-primary`, launched as a Claude Code
  general-purpose subagent (not a fork of the coordinator). It self-reports
  `claude-opus-5-5`, the coordinator's own model family, with configuration unknown.
  [Task text](reviewer-prompt.txt) `45f6670f…3538`, [full message](reviewer-dispatch-message.txt)
  and [dispatch record](reviewer-dispatch.json), dispatched 2026-10-12T04:10:14.446Z.
- **Freeze and unblinding:** [review.json](review.json) `6953fed9…e147` was frozen at
  04:26:19.551Z ([receipt](reviewer-frozen-receipt.json)) before the coordinator read
  it or the checker opened the assignment ([unblinding receipt](unblinding-receipt.json)).
  No score or finding was edited.
- **Blindness:** the reviewer declared only its packet as input. It named the session
  environment it was shown: AGENTS.md notes, a memory index, git status with commit
  subjects and file names, and tool listings. Its transcript shows four tool calls: it
  read the packet, wrote its review, read it back and edited its own output. It read no
  other file and ran no command ([tool audit](reviewer-tool-audit.json)). The transcript
  stays local because it embeds that environment context.
- **Checker:** [check-review.mjs](check-review.mjs) applies the
  `daily-writing-ai-review-1` item checks to one reviewer. It checks hashes, blindness
  flags, coverage, applicability, verbatim passages and contrast quotations, and
  verdict consistency, then writes [the result](targeted-review-result.json). Re-running
  it reproduces that file byte for byte. Sixteen offline fake-review checks confirmed it
  rejects malformed artifacts for the intended reason and fails low scores, unsafe quiet
  items and unsupported contrasts. [build-collection.mjs](build-collection.mjs) built
  the packet. The complete-round verifier and packet builder were neither used nor
  changed.

The checker expects the preserved local layout. Re-check with:

```sh
node docs/reviews/daily-natal-lens/2026-10-12-lightweight-subset-review/check-review.mjs \
  ~/.local/state/pixel-perfect-view-757/natal-qualification/20261012-lightweight-subset/collection-1 \
  ~/.local/state/pixel-perfect-view-757/natal-qualification/20261012-lightweight-subset/dispatch/reviewer-dispatch.json \
  ~/.local/state/pixel-perfect-view-757/natal-qualification/20261012-lightweight-subset/dispatch/reviewer-frozen-receipt.json \
  NEW_RESULT.json
```

That local directory also keeps the original isolated packet, the frozen review, the
private assignment, the reviewer transcript, build and check logs, and the offline
checker tests. The 299 round-3 local files were re-verified unchanged; their inventory
hash still matches the audit.

## Limitations

This is one AI assessment of synthetic writing, not human approval, empirical
psychological validation or proof of real-reader quality. `humanReviewCompleted`
remains `false`. The coordinator had unblinded context and shares the reviewer's model
family. Prose style or N1 can suggest an item's origin. The gate covers natal writing
only: seven cases, not the 62-item catalogue, a chronological week, hosted Workflow,
member Lovable, native Swiss/owner or cost lanes. No application source, provider,
content bundle, account, cache or deployment changed.
