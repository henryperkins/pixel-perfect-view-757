# Production integration deployed; generated-writing activation held

The source-bound daily context writer is integrated, tested and deployed at `b7d9cf5fdfc463baca358a6318c4cf5c38702bb3`. The sole approved five-request pilot completed. **No generated mode passed every review gate, so `writer_rollout` remains NULL/off. Existing member readings continue through the established writer.**

The implementation supports the reviewed contact-only, natal-only, transit-only, combined natal/transit and synthesis combinations for warm/standard readings on release `0.9.0`. It uses actual selected facts and chronology, complete independently reviewed fallbacks, separately validated reflections, versioned cache identity and an exact source-policy guard. Unsupported combinations retain the established path. This bounded integration does not extend the style to every possible reading/source combination.

## Pilot and review

Run `b0aa4a22-c22b-4906-bb33-48366a38f46e` used the deployed production adapter/renderer through the existing durable Workflow. All five Gemini Enterprise / `gemini-3.8-flash` attempts were captured losslessly before validation, with no retry or provider switching. Conservative accounting was **$0.342324 against the $5 cap**; this is not an invoice. The five-request allowance is exhausted.

| Context mode | Automatic validation | Source review | Reader review | Activation |
|---|---|---|---|---|
| Contact only | Pass | Pass | Voice below threshold | Held |
| Natal only | Rejected: editorial claim | Unsupported additions; incomplete selected meaning | Pass at threshold | Held |
| Transit only | Pass | Pass | Voice and distinctness below threshold | Held |
| Natal and transit | Pass | Pass | Voice and distinctness below threshold | Held |
| Synthesis, natal and transit | Rejected: safety | Causal drift; incomplete selected meaning | Meaning, distinctness and voice below threshold | Held |

The independent reader review was blind to context mapping, source packet and automatic outcomes. It scored recognition, meaning, direction, distinctness and voice; each must reach four out of five. A separate source reviewer checked exact claims, qualifiers, parent citations, chronology and context integration. These are AI editorial reviews, not human/member research. Automatic acceptance, source grounding and reader quality remain distinct requirements.

The recurring voice problem is formal wording about expectations, capacity and boundaries. Transit/context drafts also repeat the scheduling-versus-scope distinction or append multiple small readings. The natal draft that passed the reader rubric introduced unsupported ease and a causal claim about attention. Source fidelity cannot be traded for livelier wording.

Read the [captured drafts](pilot/captured-readings.md), [combined qualification](pilot/qualification.md), [blind reader review](pilot/reader-review.md) and [source review](pilot/grounding-review.md). No captured body, benchmark or prior pilot was revised to secure a pass.

## Deployment and verification

The additive D1 migration was applied with rollout off. Lovable deployment `d0c5444f-f197-41f5-b24a-2f958734511e` serves the exact implementation source; the final public identity receipt confirms it. Active bundle `0.9.0`, its canonical checksum and publication state are unchanged. No Workflow Worker change or deployment was needed.

Verification completed with **1,073 passing tests, four existing skips, zero failures**, TypeScript, scoped ESLint and the exact committed-source production build. Independent integration review checked policy failures and disable races; source review checked runtime projections and complete fallbacks. See [verification](verification.json) and the independent review artifacts.

The hosted pilot proves the shared production writer in the Workflow. **Authenticated member Today/source selection/save/reload/export proof was deferred** after the activation gate failed. No temporary authored policy was enabled and no sixth member-model request was made. Browser closure during the pilot and subsequent transport timestamps establish continued server execution within the recorded evidence limits; they do not establish device behavior.

Temporary sessions and admin roles were revoked and the unused synthetic profile removed. The disabled owning user, sole evaluation run and five results remain for audit. Historical evaluation-run rows match their baseline fingerprint; prior tracked evidence/benchmarks match their original bytes. Historical production result rows were not independently fingerprinted. See [final state](final-state.json), [cleanup](cleanup.json) and the [independent evidence audit](independent-live-evidence-review.md).

## Remaining release work

The activation condition is unmet. Use the preserved drafts to simplify formal phrasing, remove repeated meaning and retain every qualifier and selected interpretation. Any further paid qualification needs a separately authorized request/cost limit. When generated modes pass, complete the deferred authenticated member-route proof before controlled activation. No new paid run or policy activation is authorized by this report.
