# Catalogue reviewer instructions — `daily-writing-ai-review-1`

You are reviewing a frozen catalogue of short natal "lens" entries for a daily
astrology reading. When a reader's chart qualifies, the app may add one entry's
`mechanism` to that day's reading as a conditional, practical lens on the main
meaning. Review every entry in your packet on its own text. Do not try to find out
who wrote it, how anyone else judged it, or what the app does elsewhere.

Each entry has a `key`, a `role` (self direction, emotional reflex, expression,
preference or initiative), `anchorNatalPoints` (the bodies it may serve), its
`selectors` (the chart conditions that choose it: a sign, plus an aspect or house
for compound entries) and the `mechanism` text that readers would see.

## Checks for every entry

Answer each check `true` (the entry passes it) or `false` (it does not):

- `conditionalFraming` — the mechanism stays a possibility ("can", "may"), never a
  claim that the reader is, always does or must do something.
- `ordinaryScene` — it offers an ordinary, recognizable scene (a reply, a list, a
  routine), not an abstract trait.
- `practicalDistinction` — it names a useful distinction between two supported
  options (for example preparation versus needing everything settled).
- `roleAndAnchors` — the scene fits the entry's role and the bodies it may serve.
- `compoundEligibility` — only for entries with more than one selector: the extra
  aspect or house plausibly refines the sign's meaning without claiming a fact about
  the reader's work, health or life. Use `null` for single-selector entries.
- `noBiography` — no claim about the reader's past, family or life events.
- `noClinicalExplanation` — no nervous system, attachment style, trauma response,
  diagnosis or other clinical or biological explanation.
- `noBehavioralPrediction` — no prediction of what the reader will do or feel.
- `noStereotypeCertainty` — no sign stereotype stated as certain.
- `noDirectives` — no instruction or advice in the imperative.
- `noRawOrigin` — the mechanism names no planet, sign, house, aspect or degree; the
  origin stays in the selectors.

## Findings

Every `false` check needs at least one finding with its category, quoting the exact
passage from the mechanism:

| Check                    | Finding category        |
| ------------------------ | ----------------------- |
| `conditionalFraming`     | `unconditional_claim`   |
| `ordinaryScene`          | `missing_scene`         |
| `practicalDistinction`   | `missing_distinction`   |
| `roleAndAnchors`         | `role_mismatch`         |
| `compoundEligibility`    | `compound_ineligible`   |
| `noBiography`            | `biography`             |
| `noClinicalExplanation`  | `clinical_claim`        |
| `noBehavioralPrediction` | `behavioral_prediction` |
| `noStereotypeCertainty`  | `stereotype_certainty`  |
| `noDirectives`           | `directive`             |
| `noRawOrigin`            | `raw_origin`            |

These categories are substantive. Use `style` (minor) for wording that could be
clearer but is not a defect. An entry's verdict is `fail` exactly when a check is
`false` or it has a substantive finding; the overall verdict is `fail` when any entry
fails. Your verdicts must agree with your own checks and findings.

## Output

Write one JSON object and nothing else to the output path your prompt names. Read no
file other than the packet your prompt names, and run nothing. Copy your context
ID, `packetSha256` and `promptSha256` exactly as your prompt gives them.

```json
{
  "protocolVersion": "daily-writing-ai-review-1",
  "kind": "catalogue-review",
  "packetSha256": "<packetSha256 from your prompt>",
  "catalogueSha256": "<catalogueSha256 from the packet>",
  "bundleVersion": "<bundleVersion from the packet>",
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
    "sawPriorVerdicts": false,
    "sawOtherReviews": false,
    "sawImplementationContext": false
  },
  "entries": [
    {
      "key": "<entry key>",
      "checks": {
        "conditionalFraming": true,
        "ordinaryScene": true,
        "practicalDistinction": true,
        "roleAndAnchors": true,
        "compoundEligibility": null,
        "noBiography": true,
        "noClinicalExplanation": true,
        "noBehavioralPrediction": true,
        "noStereotypeCertainty": true,
        "noDirectives": true,
        "noRawOrigin": true
      },
      "findings": [],
      "verdict": "pass"
    }
  ],
  "verdict": "pass"
}
```

A finding is
`{ "findingId": "…", "passage": "<exact text>", "category": "…", "severity": "substantive" | "minor", "explanation": "…", "proposedCorrection": "…" }`.
Review every entry exactly once. If you are unsure whether an entry passes a check,
answer `false` and explain the doubt in a finding.
