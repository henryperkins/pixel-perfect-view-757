# Context-aware daily writer candidate

The bounded provider pilot is complete and the generated set fails the authored writing standard. Read the [pilot verdict](provider-pilot/verdict.md) and [actual captured bodies](provider-pilot/captured-readings.md). All five passed automatic structural validation, but none met every reader-quality threshold; one also failed source grounding. The context-aware candidate remains inactive for member readings.

The five [benchmark readings](benchmark-readings.md) remain the authored standard; the [independent editorial review](independent-editorial-review.md) explains how each added context changes the meaning. They are not captured model responses.

The comparison holds one synthetic Saturn-square-Sun contact constant across contact-only, natal-only, transit-only and combined-context readings. A fifth case adds the existing Jupiter–Mars synthesis with both contexts. Headline, cited paragraphs and an independent reflection are included for every case. The combined reading is the strongest demonstration: exploring an idea and committing an afternoon become distinct choices, while the transit chapter offers a smaller adjustment to the same boundary if an earlier method no longer fits.

## Implementation

The new source brief separates draftable meaning from reference identity and controls. It includes the selected primary interpretation, synthesis and its parents, natal distinction, transit chapter and immutable chronology. Auxiliary legacy prose, reliability selectors, local notes, private history and earlier reading text do not cross the provider boundary. Tone and depth are independent: all six settings use the same observational principles, standard includes required chronology, and technical may add supported measurements.

An explicit fourth argument to the server-only `generateSyntheticReadingProse(input, provider, control, benchmark)` selects the candidate. Normal synthetic callers and the production member writer keep their existing behavior. The authored benchmark is matched against the exact selected source graph and its headline, reflection and complete fallback are validated before any provider request. Rejected output or provider failure returns that complete fallback after one attempt, without another provider or a repair call.

The candidate reuses the whole-draft validators. It retains full source parent checks, early natal and chapter coverage, conditionality checks, chronology exactly once in the first two paragraphs, suppression rules and calculated geometry checks. These are bounded checks; source IDs and automatic acceptance cannot prove arbitrary prose is semantically supported.

## Evidence

- [Exact source-bound benchmark data](benchmark-drafts.json) records the frozen `0.9.0` bundle, fixture identity, source hashes, settings and paragraph citations.
- [Offline validation manifest](validation/manifest.json) records file hashes and five captures. Each includes the previous writer's body, candidate reading, provider-facing brief, constructed request and fallback checks.
- [Independent code review](independent-code-review.md) records implementation findings and their resolution.
- [Verification](verification.json) records final automated checks and the implementation's limits.

The offline validator supplied authored text through intercepted gateway transport and simulated a failure for each case. Ten intercepted requests exercised the actual construction, parsing and fallback path; there were zero live provider requests, paid requests, member writes, deployments or activations. Its accepted-draft metadata describes an offline contract exercise, not real model performance.

The independent assistant review scored every authored reading at least 4/5 for recognition, meaning, direction, distinctness and voice. Human review is still open. All five share one scene, one natal lens and one return chapter for a controlled comparison; this does not establish other source coverage, separate tone-specific prose quality or day-to-day variation. Four readings deliberately share the contact and situation so that context's contribution is visible.

## Reproduce

Run `node scripts/validate-context-writing-candidate.mjs --out /tmp/pattern-context-review-new` with a fresh output directory. The script refuses to overwrite an existing capture and blocks unconfigured network calls through the local harness. Run `node --test tests/reading-context-brief.test.mjs tests/reading-context-writer.test.mjs` for the focused behavioral checks.

## Provider pilot result

The source-pinned production Workflow completed five Gemini Enterprise attempts with zero retries and $0.274780 in conservative usage accounting against the $5 ceiling. All five raw captures were retained. The admin browser was closed during the run; the remaining cases completed on the server. Temporary operator access was revoked, and active content `0.9.0` and its publication state remained unchanged. [Pilot verification](provider-pilot/verification.json) records the identities, limits and evidence.

The independent assistant reader review found that the bodies explain capacity, boundaries and curiosity without the benchmarks' observable details and practical consequences. The source review found context mostly included beside the primary interpretation, with no context-bearing case reaching 4/5 integration. The contact-only body adds an unsupported recent-onset claim. Headlines and reflections in the assembled captures remain authored benchmark fields; this pilot generated bodies only. These are AI assistant reviews, not human or member research.

The next candidate should supply reviewed, source-bound scene details, practical distinctions and optional directions as writing material, then apply natal and chapter meaning within one situation while preserving each condition. That is a proposed remedy based on the captured brief and outputs, not a demonstrated fix. A revised candidate needs its own bounded provider qualification; this campaign has exhausted all five authorized attempts. Wider source coverage, consecutive-day review and member activation remain open.
