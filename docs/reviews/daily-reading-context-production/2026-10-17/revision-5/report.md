# Revision 5: one wording per source claim, verified offline

**This is an offline revision. No provider request, push, deployment or activation was made; `writer_rollout` stays off, and another paid pilot needs fresh authorization.** The fourth campaign, including its unused fifth slot, stays closed.

## What changed

Each of the five pilot cases was captured offline through the real Workflow and member Today paths, with no network calls. The old request worded a single premise up to nine times, across system sentences, user instructions, summaries, scenes, distinctions, directions, role labels and condition lists. Each generated body stitched those wordings together. The new brief, `daily-context-brief-5`, sends one drafted wording per necessary source claim, chosen for its source graph, along with structural references and seven control flags. Source proof stays in the local material file. The writer fails closed on any unreviewed graph or inconsistent composition, so the established member writer serves it. Requests are now about a third of their earlier size, and every premise appears in exactly one string. See [structure-revision.md](structure-revision.md) and the [request trace](request-trace/README.md).

One bounded validator check rejects a body that states one of four reviewed source conditions twice. Prompt, validator, voice, brief, material and campaign identities are new (`daily-context-pilot-5`). Historical pilots 1–4, rollout guards, provider, the 60-second deadline and the no-retry policy are unchanged.

## Before and after

The fourth pilot's contact-only body (R3), as captured:

> An extra check can look small beside a familiar task you've set an afternoon aside to finish. A familiar responsibility can need more effort than usual, and if the original task already fills the afternoon, that extra check still needs some of the same hours.
>
> If it asks for more than the available hours can hold, what belongs in the task may need a clearer limit. Moving the task to a later calendar opening with the extra check still included leaves that demand in place; if the original work already fills the afternoon, the extra check could stay outside the task.

Its versioned edit:

> An extra check can look small beside a familiar task you've set an afternoon aside to finish. With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours.
>
> Moving the task to a later opening only takes the check along with it, but the check could also stay outside the task.

The edit removes the restated full-afternoon condition, the abstract limit and a formal re-explanation. It also names the contact. See [edited-failures.md](edited-failures.md) for all three edits, with cuts, carriers and per-sentence contributions, and [reference-readings.md](reference-readings.md) for one authored reading per source graph. These are authored examples, not generated qualification.

## Independent reviews (AI, not human)

| Body | Reader (blind) | Source |
| --- | --- | --- |
| Contact-only reference | Pass, round 2 | Pass, round 1 |
| Transit-only reference | Pass, round 2 | Pass, round 1 |
| Contact-only edit (R3) | Pass, round 2 | Pass, round 1 |
| Transit-only edit (R1) | Pass, round 2 | Pass, round 1 |
| Natal-only reference | Passed round 3 on earlier wording; not re-read | Fails, round 2: I1's clearer boundary not carried |
| Natal-only edit (R2) | Passed round 3 on earlier wording; not re-read | Fails, round 2: I1's clearer boundary not carried |
| Natal-and-transit reference | Passed round 3 on earlier wording; not re-read | Pass, round 2 (integration 4) |
| Synthesis reference | Fails: distinctness 3 in all four rounds | Fails, round 2: I2's "or pursue an emerging opening" not carried |

Source review round 1 found zero unsupported claims. But every natal wording had dropped part of N1's condition, "If several possible projects compete for the same **free** afternoon", and had put the competition in hours already spoken for. The original benchmarks and material-4 had the same wording. The condition was restored in the material and the four natal bodies. Round 2 reviewed only the three changed compositions and four changed bodies. The restored condition passes everywhere, with 0 unsupported claims and no lost condition, and natal-and-transit passes (integration 4). Two omissions remain open and are not fixed in this handoff. In natal-only, no wording says the task itself may need a clearer boundary: the note limits the new idea instead, which the reviewer calls borderline. In synthesis, I2's "or pursue an emerging opening" is carried nowhere; round 1 had recorded that narrowing without counting it. To save time, the four changed bodies were not given to another blind reader. Every reviewer was a fresh subagent that saw only its packet, froze its verdict before mapping, and was audited from its own tool calls. Reviews and receipts are in [reviews](reviews/).

**Synthesis is a contract-level finding.** S1, N1, P2 and the chronology must all land in paragraphs 1–2, which allow at most eight sentences, and S1's source is itself the tension between I1 and I2. The proposal, not implemented, applies to the synthesis graph only. N1 may be introduced in paragraph 3, and S1's wording carries the meeting of I2's ease and I1's effort. Every source, citation and the exact chronology are preserved. See [structure-revision.md](structure-revision.md#proposed-contract-change-for-review-not-implemented).

## Verification

- **Full suite:** 1,098 tests, 1,094 pass, 0 fail, 4 existing skips. TypeScript, ESLint on the 22 changed code and test files, and the production build all exit 0.
- **New structure tests:** 6 of 10 fail on base `d35e8b5` and all 10 pass on this revision. The other four check preserved behaviour: the saved requests, the capture hashes and the timeout policy.
- **Replay:** all eight authored bodies are accepted through the intercepted pilot path. The saved R3 failure is now rejected as `writing_quality` and served the authored fallback.
- **Request captures:** both routes send identical messages, with 0 external call attempts.

Log hashes are in [verification.json](verification.json).

## Timeout

The fourth attempt aborted at exactly 60 seconds, before headers. Its cause remains unknown: saved transport evidence cannot separate long generation, queueing and a stalled connection. Provider, deadline, retry and halt policy are unchanged. See [timeout-analysis.md](timeout-analysis.md).

## Limits

- Authored readings show the claims can compose without additions. They do not show that the provider will produce such readings; only generated readings that pass both reviews can qualify a mode.
- The four bodies changed by the source fix have no reader verdict on their final wording.
- The natal-only and natal-and-transit runtime fallbacks keep the benchmark wording that drops N1's "possible" and "free". They are unchanged and not served while the rollout is off, but they need a reviewed revision before any natal activation.
- Two source omissions are open. Natal-only needs I1's boundary on the task itself; natal-and-transit's "a clear point where the task stops" is the reviewed model. Synthesis needs I2's "or pursue an emerging opening", or a reviewed ruling that the narrowing is acceptable. Both affect the material sent in the proposed pilot, so fix and re-review them before authorizing it.
- The premise lexicon and the restated-condition check cover these five 0.9.0 sources only. A paraphrased restatement is still a reader judgment.
- All reviews are AI reviews, not human or member research.

## Next pilot

[next-pilot-manifest.md](next-pilot-manifest.md) proposes one five-case run of `daily-context-pilot-5`. It uses Gemini Enterprise with unchanged transport, a $5 ceiling, a $2.80 reservation per unresolved attempt and the three independent gates. It requires fresh, explicit authorization, and the deployed identity must equal the hashes in [next-pilot-manifest.json](next-pilot-manifest.json).
