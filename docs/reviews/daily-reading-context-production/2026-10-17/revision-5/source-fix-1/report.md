# Revision 5 source follow-up

**The two named omissions are fixed and both changed compositions pass their latest independent AI source reviews. The five-case set remains unready for a paid pilot: synthesis fails distinctness and voice, and natal-and-transit fails voice on the final wording.**

This is an uncommitted offline follow-up to `716fe8090ace7be2879327dc017f20120f303685` on `codex/context-structure-revision-5-20261017`. No provider pilot request, push, deployment or activation occurred. `writer_rollout` was reported off in the handoff; it was not queried or changed. No fresh pilot authorization was granted.

## Source fixes

- Natal-only `N1.2` now says: “You could give the task a clear stopping point, with the other ideas waiting as notes.” The optional boundary applies to the responsibility itself. The reference and R2 edit use that close.
- Synthesis `I2.ease` and `I2.2` now preserve both low-friction effort and the alternative of pursuing an emerging opening, without promising an opening will arrive. The synthesis reference matches.
- Fresh source review also led to explicit “deliberate” effort, “agreed limits”, and the method-or-boundary alternatives in synthesis. Each source claim still has one carrier. All source facts, conditions, citations, chronology and paragraph requirements are preserved.
- The pilot plan and proposal pin material SHA-256 `1c2374490a07be6856a3639660f8ee6014ba60f5ab9c922bb2b9bd078c1ad5bc`. The unpublished material identity stays `daily-context-material-5`; its changed bytes change the rollout and plan hashes.

## Reviews on exact final wording

Four new AI reviewers ran sequentially, each as a fresh agent with its own packet and no session history. Each froze before mapping. The source and reader reviewers were separate. No human review was performed.

[Source round 3](reviews/source-3/report.md) passes natal-only but finds that synthesis leaves low-friction effort implicit. [Round 4](reviews/source-4/report.md) accepts the clarified I2 and finds three other omissions: deliberate effort, agreed limits, and the method-or-boundary alternatives. Earlier reviewers had accepted these paraphrases. They were made explicit in synthesis; [round 5](reviews/source-5/report.md) passes the resulting composition and body with zero unsupported claims, zero omitted meanings, preserved conditions/citations, exact chronology and integration 4. These failed intermediate reviews and their packets are retained.

[Reader round 5](reviews/reader-5/report.md) reads all four final natal bodies. The two natal-only bodies pass every dimension at 4. Synthesis scores 4/4/4/3/3 (recognition/meaning/direction/distinctness/voice); it crowds undeveloped meanings and leaves the formal chronology weakly connected to the advice. Natal-and-transit scores 4/4/4/4/3: the chronology also keeps voice below the bar. Both are current failures. No body is left with a reader verdict on earlier wording.

| Current authored body | Source | Reader |
| --- | --- | --- |
| contact-only reference | Pass | Pass |
| natal-only reference | Pass | Pass |
| transit-only reference | Pass | Pass |
| natal-and-transit reference | Pass | Fail: voice 3 |
| synthesis-natal-and-transit reference | Pass | Fail: distinctness 3, voice 3 |
| contact-only edit | Pass | Pass |
| natal-only edit | Pass | Pass |
| transit-only edit | Pass | Pass |

[body-review-ledger.json](body-review-ledger.json) binds every verdict to the exact current body hash. The four unchanged contact/transit reader passes and earlier source passes are reused only where the bytes match. All eight current authored bodies have a matching source pass; six pass the reader gate. This is authored offline evidence, not generated qualification.

## Verification

- Full suite on final code/material: 1,094 pass, four existing skips, zero failures (1,098 total). TypeScript, ESLint on the changed TypeScript file, the production build and whitespace checks pass. No new tests were added for this wording-only follow-up.
- All eight authored bodies are accepted losslessly in offline replay. The saved contact-only R3 failure remains rejected as `writing_quality` and uses the authored fallback.
- [requests.json](requests.json) captures all five cases through the Workflow and member Today adapters: ten intercepted requests, identical messages on both routes, zero external-call attempts. User messages are 2,417–4,307 characters. [premise-analysis.json](premise-analysis.json) finds each detected premise once.
- [preserved-inputs.json](preserved-inputs.json) verifies 57 files against `716fe80`, including the source bundle, benchmarks, runtime fallbacks, transport/contract code, historical captures and earlier reviews. The three unchanged mode requests are byte-identical to the committed captures; natal-only is byte-identical to its passing source-round-3 request.

Exact identities, counts, review receipts and private log hashes are in [verification.json](verification.json). Main checkout preservation is recorded separately in [preservation.json](preservation.json).

## Still open

The synthesis-only paragraph proposal remains unimplemented. The natal-and-transit voice finding also needs resolution before the five-case authored set can pass the unchanged reader bar. Two runtime fallbacks, natal-only and natal-and-transit, still need the reviewed `possible` / `free` correction before natal activation. These fallbacks are unchanged here. The [pilot proposal](../next-pilot-manifest.md) remains unauthorized under its existing $5 ceiling; no request or activation follows from these offline reviews. Timeout cause remains unknown; provider, deadline, no-retry and halt policy are unchanged.
