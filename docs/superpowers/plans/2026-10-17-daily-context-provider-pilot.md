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
2. Complete: independent implementation review and 30 focused tests passed; TypeScript and scoped lint passed. The first default-concurrency full-suite run stalled in the unchanged `reading-writing-plan` Vite test; that file passed 4/4 in two isolated runs. The stalled child was terminated and its log retained. The complete unchanged suite passed at concurrency 4 (1,017 passed, four skipped), and build passed. Pushed runtime source `be0522bcc86187280fd8c2951b8dac1a3f1fdd54` was verified on serving deployment `43b3a438-c357-4338-9a9a-885e90554d45` before any provider attempt. An earlier publish had the old source; no model calls were made against it. The Worker needed no deployment.
3. Complete: a disabled-login synthetic operator invoked the normal authenticated preview/start RPC. Hosted plan `b9d70a46fac7d7379a1dd9b79ede5987beb55d47a918fdc9f8db86b7275ffbba` pinned the exact source and artifacts. Workflow/run `e5b9b69d-7cb6-4527-af9d-15a79e89a080` completed all five positions once, with zero retries. The admin browser closed at `2026-10-17T08:25:13.224Z`; subsequent requests and terminal completion remained on the server. Conservative accounting settled at 274,780 micros ($0.274780), below the $5 cap. All five authorized attempts are consumed.
4. Complete: preserved all five lossless raw captures, native usage and model receipts, accepted bodies, source plans and authored benchmark fields. Independent metadata-hidden AI reader and source reviews were completed before mapping back to cases. All five bodies passed automatic validation, but none met all five reader thresholds; the four context-bearing cases scored 2/5 integration. The contact-only body also failed grounding by asserting an unsupported recent onset. See the [verdict](../../reviews/daily-reading-context-writer/2026-10-17/provider-pilot/verdict.md).
5. Complete: temporary sessions, admin role and profile were removed after terminal capture; the disabled user remains only as evaluation evidence owner. Operator member readings: zero; evaluation runs: one; evaluation results: five. Active `0.9.0`, its checksum and publication state were unchanged, as was the historical failed pilot. No member writer activation occurred. The final evidence commit contains documentation only and is separate from the deployed runtime source.

## Result and follow-up boundary

The experiment ran successfully; the generated writing failed qualification. No additional call, retry, prompt repair or candidate activation is part of this completed campaign. The next proposed change is reviewed, source-bound scene/distinction/direction material and stronger conditional-scope validation, followed by a separately authorized bounded pilot. More style adjectives alone are not an evidence-backed remedy. Wider sources, all tone/depth combinations, consecutive days and human/member acceptance remain unestablished.
