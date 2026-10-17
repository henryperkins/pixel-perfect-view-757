# Independent qualifier code review

Date: 2026-10-17. Scope: candidate-only qualifier changes relative to `84950d0f9212c2aa1295538d44183ac737e0ed74`, specifically `daily-context-claims.ts`, its `language.server.ts` integration and `reading-context-qualifiers.test.mjs`. This review did not assess the concurrently revised voice/material implementation or qualify generated writing. All execution used the offline records harness; no provider request, deployment or live-state change occurred.

## Final status

**Pass for the declared bounded regression objective.** The three exact second-pilot failures reject, the demonstrated destination-only and embedded-anchor ease-license bypasses are fixed, the two source-clean pilot bodies and all five unchanged authored benchmarks remain accepted, and no additional blocking integration defect was found. This is lexical regression coverage, not proof that every accepted claim is semantically supported.

## Finding and resolution

**P2, resolved: an unrelated I2 destination phrase licensed unsupported ease.** The first reviewed implementation accepted this paragraph in the synthesis/natal/transit benchmark:

> An extra check or another version can easily slip into the larger piece of work.

The full offline `generateSyntheticReadingProse` seam returned `model` / `accepted`, and the direct helper returned `null`. `sharedSourcePhrase` found I2's `larger piece` vocabulary, allowing the observed unsupported `can easily slip` relationship even though I2's little-friction meaning concerns effort. Source coverage and a destination phrase did not establish support for that relationship.

An intermediate revision added `sharesAmplifiedAnchor`, requiring a nearby pre-adverb word from the source clause directly containing the ease/speed property. The reviewer then demonstrated that `An extra check for this effort can easily slip into the larger piece of work.` still accepted: `effort` appeared inside a different subject phrase. The final revision requires the complete normalized pre-adverb clause lead to match a contiguous phrase in the source's short amplified anchor, instead of accepting any overlapping word.

Both exact repros now return `template` / `editorial_claim`. Each rejected paragraph is retained losslessly, the full authored benchmark is returned, and only one mocked gateway request occurs. Added regression tests exercise both full paths. The reviewer also confirmed rejection of `An extra check or another version for the same effort can easily slip into the larger piece of work.` Both the existing supported `effort can easily move toward a larger piece of work` control and the new direct `effort can easily encounter little friction` control remain accepted.

## Verification

Reviewer reran:

```sh
node --test tests/reading-context-qualifiers.test.mjs tests/reading-modality.test.mjs
```

Result: **36 passed, 0 failed, 0 skipped**. The reviewer also independently ran all three fixed repro variants and both I2 positive controls through the full synthetic seam.

The tests establish rejection of the exact contact-only speed, natal-only ease and synthesis certainty/speed captures; local modal handling across the specified intervening adverbs; resistance to a modal in another claim; supported I2 ease; candidate-only gating; lossless rejected expected paragraph fields; the complete benchmark fallback; and one attempt without provider failover. Code inspection confirms the new claim check runs only when `contextCandidate` is true, after supplied-ID/dependency checks and before normal editorial checks. It does not alter provider selection, transport, retry, capture or fallback implementations. The shared modality helper is unchanged.

## Remaining limits

- The modal extension recognizes a retained source subject fragment, present verb and two following words, with a bounded set of intervening words. Changed subjects, negation and arbitrary paraphrase still require source review.
- The amplification extension covers the observed `quickly` and `easily` additions. It does not identify all speed/ease vocabulary or all forms of semantic strengthening.
- The new anchor remains lexical rather than a subject/predicate parser. It does not validate arbitrary changes after the adverb: for example, `When an aim is well chosen, effort can easily slip an extra check into the larger piece of work.` still accepts. That changed predicate requires source review; accepted output does not establish semantic support. The fixed attachment cases do not establish arbitrary attachment or paraphrase correctness.
- Comma-isolated wording can conservatively reject even when a human would find it supported, for example `When an aim is well chosen, a larger piece of work can be taken up, easily.` The implementation explicitly documents this bound.
- Offline mocked requests establish local control flow. They do not establish current provider behavior, live deployment behavior, reader quality, human/member acceptance or candidate activation.

## Reviewed input identities

SHA-256 values for the final reviewed bytes:

| Input | SHA-256 |
| --- | --- |
| `src/lib/ai/daily-context-claims.ts` | `9430501befc9d290e859104f75447570a158033d5dcfc458727cd323a7838e85` |
| `src/lib/ai/language.server.ts` | `881b543214eb4e4507872fe6f2b0d1809da525678b3163f52191947577ed823c` |
| `tests/reading-context-qualifiers.test.mjs` | `92e7b601a4f27bc4776c82c7d1589b3b3691eb15fc3ff2ac1f7b2053b5fac593` |
| `src/lib/ai/daily-modality.ts` | `f024203444419f6d636c3aae69dabd3a7e72097daaf7dd56dc7bce4863f68910` |
| `docs/reviews/daily-reading-context-writer/2026-10-17/benchmark-drafts.json` | `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024` |
