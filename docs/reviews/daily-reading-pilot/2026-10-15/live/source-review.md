# Offline source and prompt review

The captured request exposes conflicting writing sources. `src/lib/ai/language.server.ts:985` includes `dailyFactBlock`; `src/lib/ai/facts.ts:200` puts the legacy interpretation under “Curated meaning of the strongest cycle.” It supplies “A cycle of thought and communication resets with fresh curiosity,” followed by a claim that Mercury sharpens interest and brings mental focus back. The output copies that opening.

The selected editorial material instead supplies the editing distinction, a possible work-reply scene, and messenger imagery. Its separate constraint rejects claims that Mercury alters the reader's thinking. `src/lib/ai/daily-voice.ts:33` still treats I/S text and selected material as editorial authorities, leaving both formulations available for drafting.

In the output, “resets … as transiting Mercury…” conflicts with the candidate's intended boundary against asserted mental changes. “Attention returns” is less decisive alone, but reinforces that assertion in context. The orb of 0.42 degrees is supplied by C1 and permitted by the prompt: it is stylistic clutter, not invented geometry.

The validator checks reference membership, selected contradictions, specific personal events, and limited qualifier dropping. Acceptance does not establish semantic compliance. The legacy concrete-writing diagnostic also reports `scene_unavailable` because these new editorial frames use their own path; that diagnostic is not evidence that the resulting scene was independently assessed.

## Bounded correction to prepare before another run

1. Give the editorial writer a dedicated projection: retain exact source IDs, keys, parent bindings, and necessary geometry, while only selected `writingMaterial` supplies draftable interpretation. Keep complete original sources in the audit record and preserve legacy writer behavior.
2. State source precedence clearly. For warm/standard prose, exclude numeric orb and timing detail unless it adds approved reader meaning.
3. Add offline assertions proving the generated prompt contains the approved material without the legacy mechanism prose. Use this captured response as a regression example for the observable failure, without presenting a lexical test as complete semantic validation.
4. Version the changed editorial policy and prepare a new frozen identity. Separately add Workflow status reconciliation that can close failed scheduling without replaying a model request; test the case where the provider response is saved after the Workflow has already errored.

This review proves the conflicting source route and copied wording in one response. It does not establish a failure frequency, qualify absent cases, or explain Cloudflare's internal error. No provider calls or runtime changes were made for this review.
