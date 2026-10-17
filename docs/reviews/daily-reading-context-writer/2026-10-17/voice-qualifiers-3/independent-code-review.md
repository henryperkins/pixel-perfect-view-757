# Independent implementation review

**Status: pass for the reviewed implementation scope. No blocking or unresolved implementation finding.** Reviewer: AI; 2026-10-17. Review base: `84950d0f9212c2aa1295538d44183ac737e0ed74`. The qualifier helper's language recognition and the revised material's sentence-level source support have separate reviewers; this report does not substitute for those reviews.

The review covered `daily-context-writing.ts`, the material projection and identity changes, `context-pilot-plan.server.ts`, the context-only integration and prompt changes in `language.server.ts`, the offline validation script, and related context tests. Production/member routing, campaign guards and historical report construction were inspected at their existing call sites. No implementation files were edited by this reviewer.

## Findings

- Source authority survives the projection. All five material cards retain their exact base `sourceFact`, `meaning` and `requiredConditions`. The I2, S1 and P2 cards are wholly unchanged. `reviewedCard` still requires an exact selected source match, and the brief retains source keys, releases, source meanings, conditions and full recursive parent closure. Moving `meaning` into `controls.sourceMeanings` creates no alternative source or fallback interpretation.
- Drafting material and shared instructions remain bounded. The provider receives only the selected cards' scene details, practical distinctions and optional directions, alongside their controls and structural references. Shared editing instructions contain only `id` and `instruction`. Inspected requests for every case exclude `sourceFact`, review support, benchmark/revision paths, provenance hashes, before/after audits, qualifier notes, sourceIds, and all complete revised or benchmark paragraphs. The two authored revised bodies remain review artifacts; they are accepted by intercepted transport without replacing the immutable benchmark fallback.
- Member routing remains unchanged. `generateReadingProse` still calls the established path with its existing authored release behavior; the context candidate option is set only by `generateSyntheticReadingProse` when given a validated context benchmark. The new claim check is gated by that option. No route, release pointer, source bundle, provider-selection code, retry policy or Workflow code changed in this diff.
- The five benchmark definitions, rendered benchmark readings, source bundle and source fixtures remain unchanged against the base. Headline, reflection, source graph and complete fallback still come from the original benchmark. Failed transport restores the entire original benchmark after one intercepted attempt.
- Current prompt, validator, voice, brief and material identities are version 3. The offline manifest is version 3 and hashes the new claim helper as well as the other changed runtime files. Its wording explicitly identifies uncommitted source-file hashes and offline authored contract validation; it does not describe these captures as generated prose.
- The paid campaign identity remains `daily-context-pilot-2`. Updating prompt/material identities does not grant another allowance. The existing insert guard still rejects any prior row for the same operator and campaign version, including failed dispatches. Frozen old plans cannot resume against changed runtime identity, while completed reports remain readable without rebuilding their old plans.

## Verification

`node --test tests/reading-context-brief.test.mjs tests/reading-context-material.test.mjs tests/reading-context-writer.test.mjs tests/reading-context-voice.test.mjs tests/reading-context-pilot-plan.test.mjs tests/reading-context-pilot.test.mjs`: **53 passed, 0 failed**. This includes five source combinations, tone/depth support, drift rejection, provider-boundary exclusions, immutable fallback, capture/replay/concurrency guards, dispatch failure, campaign reuse rejection and historical inventory checks.

`node scripts/validate-context-writing-candidate.mjs --out /tmp/pattern-context-implementation-review-offline-20261017`: **passed all five immutable authored controls and their complete 503 fallbacks**; 10 intercepted requests, zero live/provider requests. A separate inspection of all five captured requests verified the exclusions above, including the new complete authored revisions.

An additional offline probe loaded the exact checked-in `provider-pilot-2/run.json` results through the current report combiner. It remained a complete five-case report with `daily-context-body-2` and `daily-context-reference-2`, preserving every saved output. The exact saved source plan and five results were then seeded into the isolated records harness: `readEvaluationRun` returned the unchanged plan/results, and a current version-3 preview still identified campaign `daily-context-pilot-2`. Attempting to start with that preview was rejected as already started before Workflow/provider dispatch; the historical row and single-row count remained unchanged.

Byte comparisons independently confirmed the benchmark JSON hash `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024`, benchmark Markdown hash `75258c2eabec3625cd49b72374c3fcdc4b2d2d769bd6b383403a77b4a6e6ebf2`, and source bundle bytes are unchanged from the review base.

## Reviewed identity and limits

| File | SHA-256 |
| --- | --- |
| `src/lib/ai/daily-context-writing.ts` | `91c78185cf5211346e7f9b1cd8be6c1d3af680b5f3f931e9dca628aa44c11cac` |
| `src/lib/ai/context-writing-material.json` | `165a91a427937039757d4a7a3520038a725eb6b7495ee106fc4d1731058471ba` |
| `src/lib/ai/context-pilot-plan.server.ts` | `7b20e5b3b6e46cbd7ce68375b3cf01633db53228edf21cc86eee2bce3b29366a` |
| `src/lib/ai/language.server.ts` | `881b543214eb4e4507872fe6f2b0d1809da525678b3163f52191947577ed823c` |
| `scripts/validate-context-writing-candidate.mjs` | `3b3e33c9a7527cd396fd9502d6e9a72a3a28e92180ebf0a53d1b1a43c00bd20f` |
| `tests/reading-context-voice.test.mjs` | `5afd5fbbc1bdc56ead9fa260efada90148b9d7d50748225360992dab376e8f0b` |

This is offline implementation evidence. No live provider/model request, network verification, deployment, activation or member record write occurred. The review does not establish future generated voice/source quality, human editorial approval, physical-device behavior or a new paid allowance. Full-suite, TypeScript, lint and build results belong to the integration verification record; this reviewer ran the focused checks above.
