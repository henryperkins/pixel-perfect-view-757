# Independent code review of the context-aware candidate

Reviewed the candidate implementation read-only in `src/lib/ai/daily-context-writing.ts`, `src/lib/ai/daily-context-candidate.server.ts` and the changes to `src/lib/ai/language.server.ts`, together with the context brief/writer tests and their fixture reconstruction helper. This review is an AI assistant's implementation assessment, not editorial qualification of actual generated output or production evidence.

No unresolved implementation defect was found in the reviewed candidate. It is suitable for bounded synthetic evaluation. It does not activate the candidate for member requests.

## Findings resolved during review

The brief projection initially spread the nested cycle object and could retain an unexpected private field in the exported selected-fact projection. The final implementation explicitly selects the five typed cycle fields. Its provider-bound brief independently selects its permitted fields. The nested privacy regression now passes without mutating the original validation facts.

The daily reference parser's existing possessive normalization initially applied only to the published editorial path. Applying it to this candidate also ensures that a contradicted contact such as “Saturn's trine to your natal Sun” receives the same relation check as “Saturn is trine your natal Sun.” Both straight and curly apostrophe regressions pass. This preserves the existing member path's behavior when the candidate option is absent.

The authored benchmarks were also tightened to preserve the selected natal source's explicit competing-projects condition in the natal-only and combined variants. The source meaning itself and the selected fact graph were not rewritten. The exact revised packet has its separate [editorial review](independent-editorial-review.md).

## Implementation assessment

- The candidate is reached only through the explicit optional benchmark argument to the existing synthetic server seam. The member call retains its current writer and authored-release routing. The default synthetic call also retains its prior behavior.
- Preparation validates the complete incoming fact graph before projecting the primary meaning, selected synthesis and its two parents, natal lens, and transit chronology/chapter. Unjoined supporting meanings and optional legacy framing are deliberately excluded from this candidate brief. Missing required source parents fail before a provider request.
- The supplied benchmark must match the selected source atoms exactly, including statements, source keys, release identity, dependencies, geometry and chronology. Its recorded source hash is checked as well. A reviewed benchmark cannot silently qualify changed source text.
- Provider-bound material carries exact curated meaning once, separately from structural references and controls. It excludes legacy fallback prose, authored headlines/reflections, audit prose, local notes and recent reading text. The legacy prompt is built lazily, so the candidate path does not construct or send competing legacy material. Standard depth omits optional orb/exact-date details while preserving the required chronology; technical depth receives the typed calculated details.
- The authored fallback's paragraph structure, references, chronology and writing-quality checks run before the provider request. Provider failure or rejected output returns the complete context-aware fallback with its separate headline and reflection. The code does not repair a failure by discarding natal or transit context or by retrying another provider.
- Existing source-parent, natal wording, suppression, astronomical relation, timing and transit checks remain active. Candidate-specific diagnostics distinguish its prompt and validator versions. The candidate adds the bounded personal-event check and Standard detail check while allowing exactly the immutable chronology sentence.
- Plain, Warm and Clinical all select the same observational policy, with separate tone instructions; Standard and Technical control optional geometry detail. The tests establish request construction and validation compatibility for these settings, not the quality of model prose in each setting.

## Independent verification

Ran:

```sh
node --test tests/reading-context-brief.test.mjs tests/reading-context-writer.test.mjs
```

Result after the final lazy-prompt refactor and added suppression/history cases: **17 tests passed, zero failed, zero skipped**. The intercepted Lovable and Gemini Enterprise responses are local mocks; this verification made no live provider request. An earlier review run observed the possessive-reference regression before its fix; the final rerun passed the straight and curly apostrophe cases and the full focused suite.

The focused cases exercise all five reconstructed source graphs; provider-request privacy, excluded recent history and one-copy material; source mismatch and invalid fallback rejection before an attempt; lost natal/chapter coverage; full parent references; immutable chronology; natal certainty; source modality; wrong geometry; unsupplied personal events; each tone/depth; angle/house suppression; and a single failed attempt with complete fallback on each provider. Broader application tests, typecheck and build remain the implementer's separate verification record.

Independently recomputed all 13 source-file hashes in [the offline manifest](validation/manifest.json) and inspected the five saved captures. Each capture matches its exact benchmark source atoms, source hash, headline, paragraphs, reflection and word count. Every cited source has its required paragraph-local parents, and all required sources occur within the first two paragraphs. The three transit cases retain the unchanged chronology exactly once in those first two paragraphs. Each captured request contains the same structured brief recorded beside it, carries each material meaning once, and excludes authored headlines/reflections, the original “Published…” prose prefixes and demonstration identifiers. Structural source keys remain available for references. All five captures record accepted intercepted authored text and complete fallback after an intercepted 503.

These artifacts establish a bounded offline contract check: ten intercepted requests, zero live or paid provider requests, zero member records written, no deployment and no activation. The manifest explicitly distinguishes its current source-file hashes from the unchanged starting Git HEAD and labels the supplied response text as authored rather than model-generated.

## Limits

The reference and wording guards are intentionally bounded. A model can satisfy citation coverage while making an unsupported paraphrase or omit a source's practical distinction while still citing its ID. Those cases need actual-output editorial review; passing these tests cannot establish the intended voice, source grounding of arbitrary generated sentences, integration quality or consecutive-day variety. The five benchmarks cover one natal lens and one transit chapter on synthetic inputs, not the full catalogue. There has been no live generation, member persistence check, publication or activation for this candidate as part of this independent review.

Reviewed runtime file SHA-256 identities:

- `src/lib/ai/daily-context-writing.ts`: `470ef0b789109096d5c12bb32a4bc104ac0718475f2f41384d32870c11e2a20d`
- `src/lib/ai/daily-context-candidate.server.ts`: `d6ae643008ed21942f0ffc4a94bb21b075879bf878267f9d6d3c38da2c35f56d`
- `src/lib/ai/language.server.ts`: `172af7c02775ec1ea21032f2afd9987dd7a6b8bb60e1d2785bf3cea39c2af1e8`
