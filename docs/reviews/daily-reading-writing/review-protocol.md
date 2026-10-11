# Daily writing AI review protocol — `daily-writing-ai-review-1`

Adopted 2026-10-11 by the
[writing qualification checklist](../../superpowers/plans/2026-10-11-daily-reading-writing-qualification-checklist.md).

## Lane

This is an **AI writing-review lane**. Human review is deferred. The existing
requirements for blinded _human_ review in the
[synthesis design](../../superpowers/specs/2026-10-11-daily-reading-synthesis-design.md),
the [natal design](../../superpowers/specs/2026-10-11-daily-reading-natal-temperament-design.md)
and [Reading evaluation](../../../READING-EVALUATION.md) remain unsatisfied. A pass
under this protocol may be reported only as **AI-reviewed synthetic
qualification** ("AI writing-review passed"). It is never human approval,
empirical psychological validation or proof of real-reader quality.

Every qualification summary records `humanReviewCompleted: false`. Validator
acceptance, AI review, human review, cost, Git sync, app publication and content
activation are reported as separate results.

Fresh reviewer contexts that use one model family are separate assessments. They
are not evidence of independent model families.

## Roles

| Role                   | Who                                                             | Sees                                                                                                 |
| ---------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Implementation agent   | Authors the correction and prepares packets                     | Everything; never reviews its own correction                                                         |
| Reviewer A, Reviewer B | Two fresh contexts with no inherited implementation history     | Only their own packet, which embeds the rubric and [reviewer instructions](reviewer-instructions.md) |
| Adjudicator            | A third fresh context, only when a dispute needs one            | The disputed findings, the affected items and their supplied facts                                   |
| Reassessor             | A further fresh context, only after an adjudication (see below) | The packet of the context it reassesses                                                              |

At least two reviewer contexts are required; one review never qualifies. Each
context receives its packet inline in its prompt and returns its review JSON as its
reply, using no file, search or shell tools, so it cannot open the assignment,
reports or advisory files. Its review must declare `inputs: ["packet"]` exactly. The
operator archives every reviewer, adjudicator and reassessor prompt text beside its
SHA-256, and keeps the assignment outside reviewer reach until every review is in.

Reviewers never see before/after labels, case or run names, generator identity,
versions, acceptance or rejection outcomes, advisory findings, existing scores, each
other's answers or the implementation conversation. Fact statements may reveal the
subject of a reading. Template items remain recognizable because their paragraphs
carry no citations (`facts: null`); the blinding covers run, case and outcome, not
whether an item is model or template prose.

## Packet

`scripts/reading-writing-review.mjs prepare` builds one packet per reviewer from
two complete reports (baseline and corrected). It makes no model or network calls.
It refuses the same report twice, an offline replay (only hosted `live-synthetic`
reports contain model writing), and reports whose fixture version, case set, input
configs, model or transit copy differ.

- **Items** cover every captured model candidate, including rejected drafts, and
  each distinct displayed or template body. Items are deduplicated only when the
  text and the full fact, tone, depth and suppression context all match; the
  private assignment keeps every case/output mapping.
- Each item carries a neutral `itemId`, the requested `tone` and `depth`, a `quiet`
  flag, the supplied facts (`id`, optional `kind`, `statement`, optional
  `dependsOn`) and its paragraphs. A candidate paragraph keeps the fact IDs it
  cited. Template paragraphs have `facts: null` because templates record no
  per-paragraph citations.
- Suppression limits are supplied facts (for example `U2`). Fact IDs are kept so
  claims can be traced.
- Each packet orders the items independently at random. Every packet records the
  shared canonical `itemSetHash` (SHA-256 of the items sorted by `itemId`) and the
  SHA-256 of the embedded [reviewer instructions](reviewer-instructions.md).
- The private **assignment** file maps each `itemId` to its run, case IDs and
  output kinds, lists each reviewer's packet SHA-256, records the report hashes and
  automated validator outcomes, and lists uncovered (unavailable or malformed)
  drafts. It is never given to a reviewer or adjudicator.
- A sanitized capture is a partial view of a draft, not a lossless raw response.
  The packet includes it as captured and the assignment marks it.

## Review artifact

One JSON file per reviewer context:

```json
{
  "protocolVersion": "daily-writing-ai-review-1",
  "kind": "review",
  "packetSha256": "<the reviewer's own packet hash>",
  "itemSetHash": "<shared canonical item-set hash>",
  "reviewer": {
    "contextId": "reviewer-a",
    "model": "<observed model, or unknown>",
    "configuration": "<observed configuration, or unknown>",
    "promptSha256": "<SHA-256 of the exact prompt given to this context>"
  },
  "reviewedAt": "2026-10-11T00:00:00Z",
  "blindness": {
    "declaration": "<what this context saw>",
    "inputs": ["packet"],
    "sawOriginLabels": false,
    "sawPriorVerdicts": false,
    "sawOtherReviews": false,
    "sawImplementationContext": false
  },
  "reassessmentOf": null,
  "items": [],
  "verdict": "pass"
}
```

Unexposed model or configuration values are recorded as `"unknown"`; they are
never guessed. `contextId` is lowercase letters, digits and hyphens.

Each entry in `items`:

```json
{
  "itemId": "item-07",
  "scores": {
    "specificity": { "score": 4, "reason": "…" },
    "grounding": { "score": 5, "reason": "…" },
    "coherence": { "score": 4, "reason": "…" },
    "voice": { "score": 4, "reason": "…" },
    "repetition": { "score": 3, "reason": "…" },
    "synthesisCoherence": { "score": null, "reason": "No S1 supplied" },
    "lensIntegration": { "score": null, "reason": "No N1 supplied" }
  },
  "quietCheck": null,
  "findings": [],
  "verdict": "pass"
}
```

- Every dimension needs a non-empty `reason`. Scores are integers 1–5 or `null`.
- `synthesisCoherence` is scored exactly when the item supplies `S1`;
  `lensIntegration` exactly when it supplies `N1`. Otherwise the score is `null`
  with the reason it is inapplicable.
- A **quiet** item (template-only, no model attempt) has `null` scores with a reason,
  and `quietCheck: { "safe": true|false, "explanation": "…" }`. It is excluded from
  model-writing score counts.
- Item `verdict` is `fail` exactly when the item has a substantive finding, a gate
  score below 4, or an unsafe quiet check. The review `verdict` is `fail` when any
  item fails. A self-reported verdict that disagrees with its own findings or scores
  makes the artifact invalid.

### Findings

```json
{
  "findingId": "a-07-1",
  "paragraph": 1,
  "passage": "<exact text copied from that paragraph>",
  "supportingFactIds": ["I1"],
  "missingFactIds": ["C1"],
  "category": "unsupported_exclusion",
  "severity": "substantive",
  "explanation": "…",
  "proposedCorrection": "…"
}
```

- `passage` must occur verbatim in the named paragraph. Every fact ID must be
  supplied in that item, and at least one of `supportingFactIds` (what does support
  part of the passage) or `missingFactIds` (cited or relevant facts that do not
  support it) is non-empty.
- **Substantive** categories: `unsupported_personal_claim`, `invented_joint_premise`,
  `suppression_breach`, `factual_mismatch`, `strengthened_modality`,
  `unsupported_frequency`, `unsupported_necessity`, `unsupported_exclusion`,
  `prohibited_instruction`, `behavioral_prediction`, `clinical_claim`,
  `unsupported_claim`.
- **Minor** categories: `specificity`, `coherence`, `voice`, `repetition`, `style`.
- `severity` follows the category. A citation is a pointer, not proof: reviewers
  check what each substantive claim says against the cited statements.

## Scores

`specificity`, `grounding`, `voice` and `repetition` use the existing 1–5 rubric
in [Reading evaluation](../../../READING-EVALUATION.md). The reviewer instructions
restate it; their 4-point entries for `voice` and `repetition` are interpolations
and do not gate. This protocol adds:

| Dimension            | 1                                            | 3                                                   | 4                                                          | 5                                                               |
| -------------------- | -------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| `coherence`          | Contradictory or disjointed                  | Understandable but repetitive                       | A clear supported progression; only minor editing needed   | Each paragraph advances a distinct useful thought               |
| `synthesisCoherence` | Interchangeable or invented connection       | Both sources appear; the relationship needs editing | Develops the actual relationship supported by both parents | A distinct relationship supported by both sources               |
| `lensIntegration`    | Interchangeable or separate personality text | Cited but weakly applied                            | Applies `N1` within the primary distinction                | A distinct, supported practical lens within the primary meaning |

The boundary between 3 and 4:

- **Specificity 4** identifies a useful, source-supported practical distinction.
  More planet names or extra prose do not raise it.
- **Grounding 4** supports every substantive claim without strengthening its
  modality. A source-supported possibility stays a possibility. Conditional
  interpretation supported by `I`, `D`, `S` or `N` statements is editorial framing,
  not a measured personal state.
- **Synthesis coherence 4** develops the actual parent-supported relationship.
- **Lens integration 4** applies `N1` within that primary distinction.

Standard-depth readings need not cover phase (`P`) or timing (`T`); omitting them is
not a failure. A technical-depth item is reviewed against its own detail guidance:
lead with the everyday meaning, then connect it to the named contact and calculated
detail. Technical padding is never required, and suppressed detail is never
expected.

## Gate for a corrected run

The gate applies to the **corrected run**. Baseline grades are kept only for
comparison.

1. Both reviewers score `specificity`, `grounding` and `coherence` at least 4 for
   every eligible candidate and every distinct non-quiet displayed or template body.
2. When `S1` is supplied, both reviewers also score `synthesisCoherence` at least 4.
3. When `N1` is supplied (natal qualification), both reviewers also score
   `lensIntegration` at least 4.
4. `voice` and `repetition` are recorded with reasons. Material defects there are
   fixed in a later round but do not gate by themselves.
5. Every substantive claim has support, regardless of scores. Zero unresolved
   substantive findings are allowed: no unsupported personal claim, invented joint
   premise, suppression breach, factual mismatch, unsupported frequency, necessity
   or exclusion, strengthened modality, prohibited instruction, clinical claim or
   behavioral prediction. A properly supported calculated future exact date is not
   a behavioral prediction.
6. Quiet template-only items pass the safety/skip check (`quietCheck.safe`) with no
   substantive finding.
7. An unavailable or malformed draft is an **uncovered failure**. It is never
   dropped silently.
8. A safe displayed fallback cannot rescue a failed raw candidate. Raw-candidate
   failures and displayed fallback behaviour are reported separately.

The qualifying property is a supported practical distinction, not more planet
names or extra prose. Independent, unmatched and suppressed-support items must
contain no joint premise.

## Disputes, adjudication and reassessment

- A **dispute** is a substantive finding that another assessment does not share. A
  finding both assessments raise on overlapping text is not a dispute: no single
  adjudicator can overturn it, and the item fails until a new evidence round.
- An adjudicator compares the exact passage with the exact supplied statements. Each
  resolution names the original reviewer `contextId` and `findingId`, repeats the
  exact passage, quotes the fact statements verbatim (`factEvidence`: the whole
  statement, or whole sentences of it), and records `resolution: "supported"` (the
  passage is supported; the finding is resolved) or `"unsupported"` (the finding
  stands and the item fails). An unresolved grounding dispute fails the item. The
  adjudicator declares only `findings` and `items` as inputs.
- Adjudication resolves findings only. It never changes a score. A below-threshold
  score on an item where the adjudication found that reviewer's disputed passage
  supported still fails unless a **fresh blinded reassessment** replaces that
  reviewer's scores **on those items only**. A reassessment is a complete review
  artifact from a new context, with `reassessmentOf` naming the original `contextId`
  and bound to that context's packet. It is refused unless the adjudication resolved
  one of the original reviewer's findings as supported. The original artifact, its
  replaced judgments (`supersededAssessments` in the summary) and all of its
  substantive findings stay in the record, and those findings still need resolution.
- Original judgments and adjudication are preserved. Scores are never averaged, and
  no substantive failure is averaged away.
- If prose or source copy changes, a new evidence round starts with a new
  actual-model run and fresh blind review. Model output is never hand-edited into a
  passing report.

Adjudication artifact:

```json
{
  "protocolVersion": "daily-writing-ai-review-1",
  "kind": "adjudication",
  "itemSetHash": "…",
  "adjudicator": {
    "contextId": "adjudicator-1",
    "model": "unknown",
    "configuration": "unknown",
    "promptSha256": "…"
  },
  "adjudicatedAt": "2026-10-11T00:00:00Z",
  "blindness": {
    "declaration": "…",
    "inputs": ["findings", "items"],
    "sawOriginLabels": false,
    "sawImplementationContext": false
  },
  "resolutions": [
    {
      "reviewerContextId": "reviewer-a",
      "findingId": "a-07-1",
      "itemId": "item-07",
      "passage": "<identical to the finding>",
      "factEvidence": [{ "factId": "I1", "statement": "<verbatim from that fact>" }],
      "resolution": "supported",
      "explanation": "…"
    }
  ]
}
```

## Qualification summary

`scripts/reading-writing-review.mjs qualify` validates both reviews (and any
adjudication or reassessment) against the assignment and writes a new file. It
rejects an assignment with fewer than two reviewer contexts, a missing or extra
item, a duplicate reviewer context, a packet hash that differs from that reviewer's
assigned hash, a wrong item-set hash, an out-of-range score, a missing applicability
reason, a non-blind declaration (including declared inputs other than the packet),
an inconsistent verdict, evidence that is not whole sentences, an adjudication of a
shared finding, and a reassessment without a supported adjudication. An unresolved
substantive finding fails the gate. The summary records:

- `humanReviewCompleted: false`;
- automated validator outcomes for each run, separate from AI review results;
- reviewer provenance, the reviewer count, packet hashes and coverage, and any
  superseded original judgments;
- per-item failures for the corrected run, baseline defects, and score deltas
  between matching cases;
- resolved disputes and uncovered failures;
- the result `"AI writing-review passed"` or `"AI writing-review failed"`, with
  known limitations.

The checker's tests establish bookkeeping. They do not establish that any reviewer
judgment is true.

## Natal lens catalogue review

The frozen natal catalogue (currently `builtin-0.6.0`, 62 entries, bundle hash
`99ddec7c…d994`) is approved under this lane only by at least two fresh reviewer
contexts that each cover every frozen key. Each receives its packet inline, built by
`scripts/reading-writing-review.mjs catalogue-packets`: every entry's `key`, `role`,
`anchorNatalPoints`, `selectors` and `mechanism`, plus the
[catalogue reviewer instructions](../daily-natal-lens/catalogue-reviewer-instructions.md).
The author's own editorial and structural review is never shown to them. The packet
order is reproducible from the catalogue hash and the context ID, so the checker can
rebuild each packet and bind each review to it.

Every entry answers eleven checks: conditional framing, ordinary scene, practical
distinction, role and anchors, compound eligibility (compound entries only), and the
absence of biography, clinical explanation, behavioral prediction, stereotype
certainty, directives and raw origin claims. A `false` check needs a finding of the
matching substantive category that quotes the mechanism verbatim. `style` findings are
minor.

```sh
node scripts/reading-writing-review.mjs catalogue-packets --bundle docs/superpowers/releases/2026-10-11-daily-natal-candidate.json --output-dir NEW_DIR
node scripts/reading-writing-review.mjs catalogue --bundle docs/superpowers/releases/2026-10-11-daily-natal-candidate.json --review catalogue-a.json --review catalogue-b.json --output catalogue-qualification.json
```

`catalogue` checks the bundle against the manifest's recorded checksum, and refuses
missing, duplicate or unknown keys, a different catalogue hash or packet, undeclared
inputs and inconsistent checks or verdicts. A `catalogue-adjudication` (inputs:
`findings` and `entries`; a fresh context) may find a disputed defect `acceptable`
or confirm it as a `defect`; a defect both reviewers raised on overlapping text
stands. Approval is reported only as **AI catalogue review passed**, with
`humanApproval: "deferred"`. It is recorded separately from the catalogue author's
structural review and never activates the catalogue.

## Semantic regression examples

These passages come from the pre-correction baseline
([evidence](2026-10-11/evidence-index.md)). They are not lens-writing defects: the
baseline is natal-free. Reviewers of a corrected run check for the same failure
modes rather than the same words.

| Observed passage                                                              | Why it fails                                                      | A supported alternative                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "Rather than indicating a sudden change in purpose" (`I1`: a demanding role)  | Unsupported exclusion: `C1`/`I1` do not address purpose at all    | Develop the supplied role/capacity distinction without the exclusion        |
| "daily obligations have expanded"                                             | Asserts a reader event; `I1` says a role _can feel_ demanding     | Keep the scene conditional                                                  |
| "often" where `I1` says "can"                                                 | Strengthened modality: a possibility does not establish frequency | Keep the possibility unless frequency is supplied                           |
| Scope "also increases" structure where `S1` says "can increase"               | Drops the qualification in the joint relationship                 | Preserve "can increase"                                                     |
| A second reinforcement paragraph restating dependable progress or persistence | Adds little (coherence, repetition)                               | Distinguish continuity from targeted action using `I1`/`I2`/`S1`, then stop |

A structurally accepted draft can still contain these defects. Lexical validation
does not prove semantic support; semantic results come only from fresh prose review.
