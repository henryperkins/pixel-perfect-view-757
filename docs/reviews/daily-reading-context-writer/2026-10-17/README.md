# Context-aware daily writer candidate

The second bounded provider pilot is complete. Reviewed scene material improved practical context application, but the generated set still fails the authored writing standard. Read the [second-pilot verdict](provider-pilot-2/verdict.md) and [actual captured bodies](provider-pilot-2/captured-readings.md). All five passed automatic structural validation; none met every reader-quality threshold, and the synthesis body lost a source qualifier. The candidate remains inactive for member readings.

The five [benchmark readings](benchmark-readings.md) remain the authored standard; the [independent editorial review](independent-editorial-review.md) explains how each added context changes the meaning. They are not captured model responses.

The comparison holds one synthetic Saturn-square-Sun contact constant across contact-only, natal-only, transit-only and combined-context readings. A fifth case adds the existing Jupiter–Mars synthesis with both contexts. Headline, cited paragraphs and an independent reflection are included for every case. The combined reading is the strongest demonstration: exploring an idea and committing an afternoon become distinct choices, while the transit chapter offers a smaller adjustment to the same boundary if an earlier method no longer fits.

## Implementation

The source brief separates draftable material from reference identity and controls. Version 2 uses independently reviewed, source-bound scene details, practical distinctions and optional directions, with each source's conditions in controls. It includes the selected primary interpretation, synthesis and its parents, natal distinction, transit chapter and immutable chronology. Full legacy source paragraphs, review/source proof, benchmark bodies, reliability selectors, local notes, private history and earlier reading text do not cross the provider boundary. Missing or changed selected source bindings fail closed. Tone and depth are independent: all six settings use the same observational principles, standard includes required chronology, and technical may add supported measurements. Generated prose across all settings remains unqualified.

An explicit fourth argument to the server-only `generateSyntheticReadingProse(input, provider, control, benchmark)` selects the candidate. Normal synthetic callers and the production member writer keep their existing behavior. The authored benchmark is matched against the exact selected source graph and its headline, reflection and complete fallback are validated before any provider request. Rejected output or provider failure returns that complete fallback after one attempt, without another provider or a repair call.

The candidate reuses the whole-draft validators. It retains full source parent checks, early natal and chapter coverage, conditionality checks, chronology exactly once in the first two paragraphs, suppression rules and calculated geometry checks. These are bounded checks; source IDs and automatic acceptance cannot prove arbitrary prose is semantically supported.

## Evidence

The following initial offline records remain historical evidence for candidate version 1:

- [Exact source-bound benchmark data](benchmark-drafts.json) records the frozen `0.9.0` bundle, fixture identity, source hashes, settings and paragraph citations.
- [Offline validation manifest](validation/manifest.json) records file hashes and five captures. Each includes the previous writer's body, candidate reading, provider-facing brief, constructed request and fallback checks.
- [Independent code review](independent-code-review.md) records implementation findings and their resolution.
- [Verification](verification.json) records final automated checks and the implementation's limits.

The offline validator supplied authored text through intercepted gateway transport and simulated a failure for each case. Ten intercepted requests exercised the actual construction, parsing and fallback path; there were zero live provider requests, paid requests, member writes, deployments or activations. Its accepted-draft metadata describes an offline contract exercise, not real model performance.

The independent assistant review scored every authored reading at least 4/5 for recognition, meaning, direction, distinctness and voice. Human review is still open. All five share one scene, one natal lens and one return chapter for a controlled comparison; this does not establish other source coverage, separate tone-specific prose quality or day-to-day variation. Four readings deliberately share the contact and situation so that context's contribution is visible.

For version 2, the [material source review](provider-pilot-2/material-source-review.md), [new offline validation](provider-pilot-2/offline-validation/manifest.json), [independent implementation review](provider-pilot-2/independent-implementation-review.md) and [preflight](provider-pilot-2/preflight.json) identify the exact revised code and material. [Pilot verification](provider-pilot-2/verification.json) binds those records to the actual second campaign. Reviewed input material and accepted mocked output are separate from generated-writing qualification.

## Reproduce

Run `node scripts/validate-context-writing-candidate.mjs --out /tmp/pattern-context-review-new` with a fresh output directory. The script refuses to overwrite an existing capture and blocks unconfigured network calls through the local harness. Run `node --test --test-concurrency=4 tests/reading-context-*.test.mjs` for the focused behavioral checks.

## Provider pilot result

The [first pilot](provider-pilot/verdict.md) completed five Gemini Enterprise attempts with zero retries and $0.274780 in conservative accounting. It mostly repeated source paragraphs; none of its bodies met every reader threshold.

The second campaign retained the same benchmarks, cases, bundle and provider, with revised reviewed material. It completed five attempts with zero retries and $0.255862 in conservative accounting against a new $5 cap. All five paragraph captures were retained. The admin browser closed during the run, and the final four requests started afterward. Temporary access was revoked. Active `0.9.0` and full publication state remained unchanged. Neither estimate is an invoice; both campaigns have consumed their five authorized attempts.

The second source review rated the four applicable context integrations 4/5; the first rated them 2/5. Different independent AI reviewers produced those judgments, so this is no paired A/B or member study. Reader direction scores are now 4/5 across the set, but voice remains below 4 in every body. Contact-only and natal-only need voice edits; combined and synthesis also need stronger coherence. The synthesis body turns “can increase” into “quickly increases,” while contact/natal add minor speed/ease emphasis. See the [mapped comparison](provider-pilot-2/comparison.json).

The next revision should let a visible addition or note carry the distinction, cut abstract repetition, keep the chapter beside its chronology and retain source qualifiers through paraphrase. The reader's illustrative edits require source review before use. Planetary imagery, broader sources, all tone/depth settings, consecutive days, human/member acceptance and member activation remain open. Headlines and reflections in both pilots are authored benchmark fields; neither pilot generated them.
