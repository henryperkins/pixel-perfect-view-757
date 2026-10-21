# Daily reading editorial sample design

## Purpose and approval

The reader should finish a Pattern reading with a recognizable human situation,
a clearer understanding of its significance, and a useful choice. The user
approved this editorial direction and requested a plan for the first step:
six complete before-and-after readings that establish the writing standard.

This specification covers the sample pack. It does not authorize implementation,
provider experiments, publication, or activation. Its deliverables establish an
editorial target for later content and generation work.

## Editorial reference

The user selected Refinery29 as a reference. The examined
[March 29–April 4 weekly horoscope](https://www.refinery29.com/en-au/weekly-horoscopes-march-29-to-april-4-meaning-effects)
connects personal tensions with recognizable choices. The
[March 2026 monthly horoscope](https://www.refinery29.com/en-au/march-monthly-horoscope-2026-meanings-effects)
gives emotional developments a narrative across time. These are weekly/monthly
Sun-and-Rising readings, not personalized daily outputs.

Create original Pattern prose. The reference establishes a reader experience;
the samples retain Pattern's chart sources, uncertainty, and individual agency.
Keep links and short craft notes; do not copy article passages into prompts or
the sample pack.

## Deliverable

Produce one readable pack with six pairs, a one-page editorial standard, exact
baseline evidence, and a review/decision record. Each pair includes:

- A historical synthetic scenario and a short reader-facing theme.
- The unchanged baseline headline, body, and reflection.
- An original proposed headline, complete body, and one reflection question.
- A separate author note identifying the intended recognition, meaning, and
  optional direction, plus the source material supporting each substantive idea.
- Explicitly labeled proposed interpretation additions and later policy needs.

The author notes and source bookkeeping stay outside the reading itself.

## Fixed scope and baseline

- Use exactly six cases, in the order below, from `draft-fallback-2`.
- Use `bundles.baseline` from
  `docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json`.
  It is the saved `0.7.1`, schema-4 bundle, not a fresh production-pointer read.
- Expected SHA-256 of `JSON.stringify(bundles.baseline)` is
  `300173610977707a1852f4e5898d8e27a2e0d4b932ab3fc4db398eda7efbdad8`.
- Reassemble baseline templates with the source checkout used during execution;
  record its commit and relevant source-file hashes. Planning inspected
  `8f7caa9f80adcb513b0ebcd1149ea23eb5a9f445`; execution must record its own identity.
- Use warm, standard presentation for all six pairs. Preserve the original
  fixture/config/hash and record this presentation override separately. Keep
  chart geometry, cycle ordering, date, timezone, and uncertainty unchanged.
- Call no provider, database, ephemeris service, or member endpoint. Use no
  member charts, notes, check-ins, or private records. Provider identity is
  `none`; the proposed readings are authored editorial drafts.
- Describe the before text as a **recomputed template baseline using saved
  content**. Describe the after text as an **editorial target draft**. This is
  not a matched comparison of two live generation systems.

| Order | Reader topic  | Existing fixture ID             | Expected selected source                                                                      | Editorial boundary                                                                                                                   |
| ----- | ------------- | ------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Communication | `writing-reply-scene`           | `conjunction:mercury:mercury`                                                                 | Existing copy supports articulating a thought; emotional motives need an explicit proposed extension.                                |
| 2     | Relationships | `venus-opposition-venus`        | `opposition:venus:venus`                                                                      | Explore differing preferences; do not claim to know another person's motives or behavior.                                            |
| 3     | Ambition      | `synthesis-tension`             | `square:saturn:sun`, `trine:jupiter:mars`, and `square:saturn:sun_tension_trine:jupiter:mars` | Keep the supplied relationship between growing scope and available structure; avoid making every reading about productivity.         |
| 4     | Self-worth    | `jupiter-trine-sun-technical`   | `soft:jupiter:sun`                                                                            | Source supports permission to explore and express ambition. Self-worth is proposed editorial meaning, not an established chart fact. |
| 5     | Uncertainty   | `fallback-hard-neptune-mercury` | `hard:*:*`                                                                                    | The baseline is generic. Neptune–Mercury meaning requires a proposed source extension; never borrow `hard:neptune:sun`.              |
| 6     | A quiet day   | `quiet-threshold`               | None                                                                                          | No selected contact means no invented astrological explanation, urgency, or promised peaceful day.                                   |

The last two rows are important coverage: weak source material and an absent
signal must remain visible. Do not swap cases to make the pack easier to write.
Emotional uncertainty must never be inferred from uncertain birth data.

## Writing standard

Use recognition → meaning → astrological connection → useful direction → an
earned ending as a composition guide. The final reading is flowing prose, not
five labeled sections or a repeated sentence formula.

- Headline: a short human theme, normally 3–9 words.
- Non-quiet body: usually 130–200 words in 2–4 short paragraphs. This is an
  editorial target, not a production validator change; avoid padding.
- Quiet body: usually 60–110 words; explicitly acknowledge the absent signal
  and offer an ordinary invitation without attaching it to a fictitious transit.
- Develop one central tension and at most two closely related possible scenes.
- Explain the emotional significance. A practical suggestion alone is not enough.
- Include one natural astrological connection when supported. Exact technical
  values can remain in the source note unless they help the reader.
- Offer one proportionate, optional everyday response. Never diagnose, coerce,
  promise outcomes, or assert a personal event that is not known.
- End with exactly one separately labeled reflection question, at most 220
  characters, on the same theme. The body need not ask additional questions.
- Use warmth, familiar language, and direct address. Qualify an uncertain
  situation naturally; avoid layers of hedging and repeated caveats.
- Across the set, include connection, desire, enjoyment, and possibility as well
  as difficulty. Vary settings and endings; do not turn all six into work advice.

## Source and policy handling

Every substantive idea in an after draft is marked in its author note as one of:

1. **Existing support:** an exact source key/fact and a brief explanation of fit.
2. **Proposed editorial extension:** original new meaning, its contact-specific
   rationale, and the exact source sentence or rule that would need authoring.
3. **Unsupported:** revise or remove it. Merely labeling an invented factual,
   personal, or causal claim as a proposal does not make it acceptable.

Proposed extensions are legitimate exploration in this sample pack. Keep their
status visible; approval of an example's voice is not publication of its source
extension. A reviewer must assess the rationale, conditions, and distinctness.

Record compatibility issues instead of changing runtime code. Existing
`daily-voice.ts` prohibits instructions, the shared `safetyPass` rejects some bare
commands, and the historical writing-review protocol prohibits instructions.
The sample rubric may permit low-stakes optional invitations. It does not amend
those production contracts or qualify a draft under the old protocol.

## Review and completion

Run a reader pass and a separate source/policy pass, then show the revised pack
to the user. Score recognition, meaning, useful direction, distinctness, and
voice/readability from 1–5 with a quoted reason for each draft. A target draft is
ready for user review when each score is at least 4 and no unsupported factual,
personal, predictive, or causal claim remains. Quiet-day distinctness means
honesty and usefulness without inventing a chart theme. Keep scores for the
baseline too; baseline failures do not excuse a weak proposed reading.

The reader pass sees neutrally labeled texts without before/after labels or
source notes. The source/policy pass sees all evidence and is not called blind.
Neither pass establishes member usefulness empirically or replaces human review.

Separate **pack delivered** from **editorial target approved**. Record the user's
decision per case as `pending`, `revise`, or `approved_as_editorial_target`, with
remaining source/policy dependencies. Never infer approval from elapsed time.
The final output identifies the next content/prompt changes needed; those belong
to later steps. A seven-day generation study, full tone/depth coverage, mobile
implementation, and deployment remain outside this sample-pack step.
