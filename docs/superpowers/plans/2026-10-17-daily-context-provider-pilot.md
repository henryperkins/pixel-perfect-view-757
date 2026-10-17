# Context-aware writer provider pilot

The user approved a bounded provider pilot of the context-aware candidate against its five reviewed authored benchmarks. This is a new campaign, not a retry or continuation of any earlier run. The candidate's member activation is outside this pilot.

## Frozen scope and decisions

- Provider: Gemini Enterprise, configured model `gemini-3.8-flash`; preserve the existing 60-second deadline and native bounded transport.
- Ordered cases: `contact-only`, `natal-only`, `transit-only`, `natal-and-transit`, `synthesis-natal-and-transit`.
- Five attempts maximum, zero retries, $5 conservative reservation ceiling, no separate paid review allocation. Reserve $2.80 atomically before each request; settle only complete consistent model/usage receipts. Unknown billing retains the reservation and halts.
- Freeze the exact built source SHA, case fixture/hash, candidate bundle `0.9.0` and benchmark bytes SHA `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024`. Core voice and body-generation code are unchanged from the reviewed candidate.
- Continue to distinct unattempted cases after a structural rejection only when the response capture is lossless and transport/model/usage are valid. Stop on failed transport, uncertain response, lost capture, source/model drift, missing authority or exhausted limits. Never retry an attempted position.
- Run through the existing durable `pattern-workflows` Workflow and signed app callback. Store only evaluation runs/results; do not generate member readings or activate content. The Worker protocol does not need a change.
- The model writes body paragraphs. Headlines and reflections are authored benchmark fields. Assess raw generated bodies separately from accepted prose and authored fallbacks.

Google's [Agent Platform pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) was refreshed for this pilot on 2026-10-17. Gemini 3.8 Flash introductory rates are $0.75/M input and $3.75/M output through 2026-12-31. Existing app accounting uses the higher $2/M input and $20/M total output including thinking, with a $2.80 per-attempt reservation. These are conservative estimates, not invoices.

## Execution ledger

1. Complete: added the closed case set/plan and explicit admin run mode. Exercise real selection, atomic reservations, replay/concurrency and failed-Workflow recovery with offline tests. Preserve prior manifests and campaigns.
2. In progress: independent implementation review and 30 focused tests passed; TypeScript and scoped lint passed. The first default-concurrency full-suite run stalled in the unchanged `reading-writing-plan` Vite test; that file passed 4/4 in two isolated runs. The stalled child was terminated, its log retained, and the complete unchanged suite is running at concurrency 4. The complete suite passed at concurrency 4 (1,017 passed, four skipped), build passed, and source-pinned app deployment is ready. The deployed app's member behavior keeps the reviewed `0.9.0` route.
3. Pending: create a scoped disabled-login synthetic operator; inspect the hosted dry plan, persist its identity and start exactly one Workflow with the expected plan hash. Leave the run to the server and poll read-only.
4. Pending: preserve run/result/transport/candidate evidence and compare actual generated bodies against the benchmarks for recognition, meaning, direction, distinctness, voice, source grounding and integration.
5. Pending: revoke temporary session/admin authority after terminal capture, retain evaluation evidence, verify active content unchanged and write the verdict with exact limits.
