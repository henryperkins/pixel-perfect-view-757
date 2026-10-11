# Reviewer instructions — `daily-writing-ai-review-1`

You are reviewing short daily astrology readings for an app that shows its work.
Each item in your packet gives the facts supplied to the writer, the requested
tone and depth, and the text to review. Judge each item only on that evidence. Do
not try to work out where an item came from, which version produced it or how
other reviewers scored it.

## How to review an item

1. Read the supplied facts. `C` facts are calculations. `I`, `S`, `D`, `N`, `P` and
   `T` facts are published editorial wording. `E` and `U` facts describe the
   calculation source and its limits; a `U` fact can suppress whole kinds of claims.
   `dependsOn` lists a fact's parents.
2. Read each paragraph and trace every substantive claim to the supplied statements.
   A cited ID is a pointer, not proof: the statement itself must support the claim.
   Template paragraphs have `facts: null`; check them against all supplied facts.
3. Check specifically for:
   - **Modality.** A possibility ("can", "may", "might") must stay a possibility.
   - **Frequency.** "often", "usually", "always" need a supplied frequency statement.
   - **Necessity.** "must", "needs to", "has to" need supplied support.
   - **Exclusions.** "rather than X", "not X", "instead of X" must not deny an
     alternative that the facts do not address. A contrast may explain two
     supported options.
   - **Personal events.** No claim that something happened to the reader, or that
     their situation changed, unless supplied. An everyday scene stays conditional.
   - **Clinical or behavioral claims, instructions, predictions.** None are allowed.
     A supported calculated exact date is not a behavioral prediction.
   - **Suppression.** Nothing the `U` facts suppress may appear, even paraphrased.
   - **Joint relationships.** Two contacts may be connected only when an `S1` fact
     supplies that relationship. Without `S1`, the meanings stay separate.
   - **Natal lens.** `N1`, when present, is one conditional interpretation, never a
     known temperament.
4. Conditional interpretation supported by `I`, `D`, `S` or `N` statements is
   editorial framing, not a measured personal state. That is fine.

Standard depth: everyday meaning in the foreground; phase and timing are optional
and their absence is not a defect. Technical depth: lead with the everyday meaning,
then connect it to the named contact and calculated detail; padding is never
required.

## Scores (integers 1–5)

| Dimension            | 1                                      | 3                                               | 4                                                           | 5                                                               |
| -------------------- | -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `specificity`        | Interchangeable summary                | Tied to the selected contact                    | A useful, source-supported practical distinction            | Concrete distinctions supported by the published source copy    |
| `grounding`          | Unsupported or contradictory claims    | Some statements need review                     | Every substantive claim supported; no strengthened modality | Each substantive claim traceable to supplied statements         |
| `coherence`          | Contradictory or disjointed            | Understandable but repetitive                   | A clear supported progression; minor editing only           | Each paragraph advances a distinct useful thought               |
| `voice`              | Stiff or inconsistent with the tone    | Clear and mostly consistent                     | Natural and consistent                                      | Natural, distinctive and consistent throughout                  |
| `repetition`         | Stock phrasing dominates the packet    | Some reuse                                      | Little reuse; variation stays supported                     | Relevant variation without inventing facts                      |
| `synthesisCoherence` | Interchangeable or invented connection | Both sources appear; relationship needs editing | Develops the relationship both parents support              | A distinct relationship supported by both sources               |
| `lensIntegration`    | Separate personality text              | Cited but weakly applied                        | Applies `N1` within the primary distinction                 | A distinct, supported practical lens within the primary meaning |

- Score `synthesisCoherence` only when the item supplies `S1`, and `lensIntegration`
  only when it supplies `N1`. Otherwise give `null` with the reason.
- More planet names or extra prose do not raise specificity.
- `repetition` may compare phrasing across the items in your packet. Do not demand
  variety that the facts do not support.
- A **quiet** item has no model writing: give every score `null` with a reason and
  fill `quietCheck` instead — is it a safe quiet-day message with no invented
  signal, claim or instruction?

## Findings

Record a finding for every problem, with the exact passage copied from the
paragraph. Substantive categories: `unsupported_personal_claim`,
`invented_joint_premise`, `suppression_breach`, `factual_mismatch`,
`strengthened_modality`, `unsupported_frequency`, `unsupported_necessity`,
`unsupported_exclusion`, `prohibited_instruction`, `behavioral_prediction`,
`clinical_claim`, `unsupported_claim`. Minor categories: `specificity`, `coherence`,
`voice`, `repetition`, `style`. Severity follows the category.

An item fails when it has any substantive finding, a `specificity`, `grounding`,
`coherence`, applicable `synthesisCoherence` or applicable `lensIntegration` score
below 4, or an unsafe quiet check. Your item and overall verdicts must agree with
your own scores and findings.

## Output

Write one JSON object and nothing else to the output path your prompt names. Read no
file other than the packet your prompt names, and run nothing. Copy your context
ID, `packetSha256` and `promptSha256` exactly as your prompt gives them; the packet
cannot contain its own hash or the hash of the prompt that carries it.

```json
{
  "protocolVersion": "daily-writing-ai-review-1",
  "kind": "review",
  "packetSha256": "<packetSha256 from your prompt>",
  "itemSetHash": "<itemSetHash from the packet>",
  "reviewer": {
    "contextId": "<the context ID you were given>",
    "model": "<your model if you know it, otherwise unknown>",
    "configuration": "unknown",
    "promptSha256": "<promptSha256 from your prompt>"
  },
  "reviewedAt": "<current UTC time, ISO 8601>",
  "blindness": {
    "declaration": "<one sentence on what you saw>",
    "inputs": ["packet"],
    "sawOriginLabels": false,
    "sawPriorVerdicts": false,
    "sawOtherReviews": false,
    "sawImplementationContext": false
  },
  "reassessmentOf": null,
  "items": [
    {
      "itemId": "item-01",
      "scores": {
        "specificity": { "score": 4, "reason": "…" },
        "grounding": { "score": 4, "reason": "…" },
        "coherence": { "score": 4, "reason": "…" },
        "voice": { "score": 4, "reason": "…" },
        "repetition": { "score": 4, "reason": "…" },
        "synthesisCoherence": { "score": null, "reason": "No S1 supplied" },
        "lensIntegration": { "score": null, "reason": "No N1 supplied" }
      },
      "quietCheck": null,
      "findings": [
        {
          "findingId": "<your-prefix>-01-1",
          "paragraph": 1,
          "passage": "<exact text>",
          "supportingFactIds": [],
          "missingFactIds": ["I1"],
          "category": "strengthened_modality",
          "severity": "substantive",
          "explanation": "…",
          "proposedCorrection": "…"
        }
      ],
      "verdict": "fail"
    }
  ],
  "verdict": "fail"
}
```

Review every item in the packet exactly once. Every fact ID you name must be
supplied in that item, and each finding needs at least one supporting or missing
fact ID. If you are unsure whether a claim is supported, record the finding and
explain the doubt; an unresolved grounding doubt fails the item.
