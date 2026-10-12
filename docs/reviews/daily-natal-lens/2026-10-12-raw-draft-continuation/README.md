# Step 3 complete: all six raw drafts pass

**The lightweight natal writing gate passes.** The fresh blinded reviewer passed
all four newly captured drafts with no substantive findings. Combined with the
two passing drafts from the [first partial run](../2026-10-12-raw-draft-recheck/README.md),
all **six requested drafts pass: two each for duty, Moon fallback and synthesis**.
The [combined result](combined-result.json) verifies every case/repetition slot;
the earlier failed reviews and partial-run results remain unchanged.

Scores are specificity / grounding / coherence / voice / repetition / synthesis /
lens integration. Voice and repetition are recorded but do not gate alone.

| Case | Draft | Scores | Result |
| --- | --- | --- | --- |
| Duty | 1, first partial run | 5 / 5 / 4 / 4 / 3 / — / 4 | Pass |
| Duty | 2, continuation | 5 / 5 / 5 / 4 / 4 / — / 5 | Pass |
| Moon fallback | 1, first partial run | 4 / 5 / 4 / 3 / 4 / — / 4 | Pass |
| Moon fallback | 2, continuation | 5 / 5 / 4 / 4 / 4 / — / 5 | Pass |
| Synthesis | 1, continuation | 5 / 5 / 5 / 3 / 3 / 5 / 5 | Pass |
| Synthesis | 2, recovery | 4 / 5 / 4 / 3 / 3 / 5 / 4 | Pass |

The reviewer found no substantive defects. The four minor findings concern stiff
contact phrasing and repeated wording between the two synthesis drafts. Duty's
scene integration, Moon's qualified claim and the synthesis relationship all clear
their gates. Original model prose and [review judgments](review.json) are unedited.
The seven previously passing templates, quiet safety check, other four raw cases
and supported duty/freedom distinctions remain the retained evidence for the rest
of the [lightweight gate](../lightweight-readiness.md).

## Gemini health and completed execution

The requested authenticated [health probe](gemini-health.json) returned **HTTP 200**
and generated text with response model `gemini-3.8-flash`. Its small token limit
ended generation with `MAX_TOKENS`; it did not produce the exact requested “OK.”
This establishes authenticated reachability at that time. The public
[service-status observation](service-status.json) is supporting context only;
neither check diagnoses the earlier 429's cause.

The four scheduled continuation calls ran sequentially with 30-second pauses.
Synthesis 1, duty 2 and Moon 2 returned accepted, lossless raw drafts. Synthesis 2
timed out at 120 seconds. Under the operator's instruction to continue, one
separate [recovery run](../2026-10-12-synthesis-recovery/README.md) captured that last
draft successfully. No new call returned 429. There were **six provider calls in
this continuation: one health probe, four scheduled attempts and one recovery**.
There were no automatic retries; the separate recovery attempt is retained.

The original [continuation capture](paid-run/capture.json) still contains the
timeout. Its finish status means all four attempts settled, not that all succeeded.
The recovery used a local 180-second capture deadline and returned in 14.23 seconds.
Moon 2 took 103.18 seconds. The application and member-serving 60-second deadline
were unchanged; these observations do not establish member-path availability.

[Transport observations](transport-observations.json) record **40,534 tokens** from
the four successful drafts plus **65** from the probe. Usage for the timed-out
request and monetary cost are unknown. Across step 3 there were eight full-draft
attempts: six successes, the original 429 and this timeout, plus one health probe.

## Review, source and verification

The derived [review selection](review-selection/capture.json) explicitly maps four
raw results from two preserved runs; it is not presented as a single provider run.
The [source audit](source-audit.json) verifies those results are unchanged, both
runners and deadline helpers match their recorded hashes, and all 172 application
source files match the manifests. Source revision `440a62e` is byte-identical for
those files to the tested implementation `79ad050`.

The fresh `/root/writing_continuation` context used `fork_turns: none` and received
only its shuffled [packet](packet.json) and review instructions, with uniformly
masked paragraph citation arrays. Automatically attached repository notes,
environment metadata, memory index and general tool/skill instructions were visible;
tool access was not technically sandboxed and model diversity is not established.
The [original review](review.json) was [frozen](reviewer-frozen-receipt.json) before
the coordinator read its verdict. Hash bindings, complete coverage, raw prose/facts,
score applicability, finding quotes and verdict consistency pass the
[checker](check-review.mjs); the [result](recheck-result.json) is 4/4. Artifact paths
inside original receipts retain their local execution locations. The
[evidence index](evidence-index.json) identifies the archived copies by hash.

All seven new tooling files pass syntax checks and scoped lint. No application
tests were rerun because the source is unchanged. The retained implementation
evidence is **521 passing tests**, passing typecheck/build/changed-file lint, and
documented pre-existing full-repository lint failures. See
[tooling checks](tooling-checks.json) and
[source parity](application-source-parity.json).

This completes the targeted natal writing decision, not the historical full
benchmark. Both candidates remain inactive. Transit-candidate writing, the live
built-in synthesis gap, member-serving Lovable, hosted Workflow/admin and release
verification remain outside this check. Nothing was pushed, deployed or activated.
