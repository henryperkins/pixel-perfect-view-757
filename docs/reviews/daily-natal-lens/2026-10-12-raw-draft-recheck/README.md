# Step 3: two passing paid drafts; run stopped by rate limit

The qualifier guard and writing guidance are implemented in local commit
`79ad05086b1f06179c0456b7e38a389757a5898c`. The authorized paid recheck made
**three model calls**: duty and Moon fallback returned lossless drafts; synthesis
returned **HTTP 429**. The runner stopped with **zero retries**. The three scheduled
second drafts were not attempted. This run is closed; it has no resume facility.

One fresh blinded reviewer passed **both captured raw drafts**, with no substantive
finding. **Step 3 remains incomplete and the writing gate does not pass**: four of
its six planned samples are unavailable. Both candidates remain inactive. Nothing
was pushed, published, deployed or activated.

| Case | First draft | Second draft | Specificity / grounding / coherence / voice / repetition / synthesis / lens |
| --- | --- | --- | --- |
| Duty | Pass | Unattempted | 5 / 5 / 4 / 4 / 3 / — / 4 |
| Moon fallback | Pass | Unattempted | 4 / 5 / 4 / 3 / 4 / — / 4 |
| Synthesis | HTTP 429; no draft | Unattempted | — |

The duty draft now places the unfinished reply inside the primary quiet-moment
scene. The Moon draft preserves “can offer.” The reviewer’s two minor findings
concern repeated timing wording in duty and formal transitions in Moon fallback.
The originals and findings are retained in [review.json](review.json); no output was
edited to obtain a passing score. [recheck-result.json](recheck-result.json) separates
the two individual passes from the incomplete six-sample result.

## Implementation and validation

- `daily-modality.ts` rejects bounded near-verbatim reuse that drops “can/may/might,”
  including “can offer” becoming “offers” and “may be” becoming “are.” It checks the
  claim’s adjacent subject, verb and following words, rather than accepting an
  unrelated modal elsewhere in the paragraph. Exact supported categorical sentences
  remain valid. This lexical guard does not establish arbitrary semantic support;
  changed subjects, paraphrases and intervening qualifiers still need review.
- Daily guidance keeps a natal example inside the primary scene, puts both contact
  meanings before their synthesis, and checks each reused claim’s qualification.
  Prompt/validator identities advance to `daily-astro-body-12` / `daily-reference-8`.
  Published template bodies, provider transports and member routing are unchanged.
- Six of the 13 new regressions failed before implementation; all 13 pass afterward.
  **All 521 application tests pass**, with no skips. Typecheck, build and changed-file
  lint pass. Build retains the existing TanStack deprecation and bundling warnings.
- Full `npm run lint` fails with 7,612 errors and six warnings in 32 files. Every
  reported file is byte-identical to the pre-change commit; these are existing
  repository failures, not a clean full lint result. See
  [implementation-checks.json](implementation-checks.json) and
  [lint-baseline-check.json](lint-baseline-check.json).
- The historical round-2 exact-house test input also drops “can take.” Its raw draft
  now fails the new guard. The timing regression repairs only that independent
  qualifier in its local test input, verifies timing still fails, then verifies the
  corrected timing passes. Archived evidence is unchanged.
- [Offline runner checks](runner-offline.json) cover six scheduled fake transports,
  rejected-draft preservation without retries, stopping on a credit error, refusing
  an existing output folder, wrong revision or missing key, and a zero-call dry plan.

## Execution and evidence

This was the existing local production-module synthetic lane with Gemini Enterprise,
`gemini-enterprise/gemini-3.8-flash`; both successful responses report
`gemini-3.8-flash`. The runtime-only capture timeout was 120 seconds. Member readings
and natal chapters retain Lovable and the 60-second serving deadline. The Moon call
took 67.68 seconds, so this capture does not prove member-path availability.
Hosted Workflow/admin authentication, browser behavior and live member generation
were not checked.

[Transport observations](transport-observations.json) record 21,288 reported tokens
across the two successful calls (5,114 prompt, 441 candidate and 15,733 thought).
The rate-limited call has no usage counter. **Monetary cost is unknown**; missing
usage is not treated as zero.

The [source manifest](source-manifest.json), [run plan](run-plan.json), original
[finish receipt](run-finished.json), and [capture](capture.json) retain all attempted
results. The source was checked before/after each case and before each transport.
An independent [source audit](source-audit.json) confirms all 172 source files,
the runner and its deadline helper match their recorded hashes. The runner’s
`sourceUnchangedThroughout` flag is false for any halted run, including this rate
limit; the audit explains that bookkeeping limitation without changing the receipt.

The [packet](packet.json) contains only the two raw drafts and their complete visible
facts, with opaque shuffled IDs and uniformly masked citation arrays. The reviewer
was `/root/writing_primary`, started with `fork_turns: none`, and declared only the
packet as its task input. Automatically attached repository notes, memory index,
skill listings and environment metadata were visible. Tool access was not technically
sandboxed; reviewer model/configuration were unknown. The review was frozen before
unblinding. Hash bindings, raw prose and facts, score applicability, exact finding
quotes and verdict consistency passed [the checker](check-review.mjs).

The previous step-2 result remains historical evidence: 11/14 samples passed,
including all seven templates. The two new passes do not supply the missing
synthesis draft or the three requested second samples. The old round-3 partial run
and all earlier reviews remain unchanged. The transit candidate and live built-in
synthesis template remain outside this recheck.

Any further paid capture belongs in a new run after the provider rate limit is
resolved. It must retain this partial run and the already passing samples. Release
and activation remain separate decisions.
