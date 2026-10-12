# Transit lightweight review: failed

On 2026-10-12, the authorized joint-release preparation captured seven actual Gemini Enterprise drafts and reviewed those drafts, seven current templates and one quiet template. **3/15 samples pass**: the combined synthesis/natal/chapter draft and template, plus quiet safety. The other six cases fail in both raw and template form.

## Why it failed

All twelve failed samples contain instructions drawn directly from the published P1/P2 wording: “notice,” “start with,” “consider” or “let it stay.” The system prompt and the established writing rubric prohibit instructions. Factual support does not resolve that contradiction. The between-contacts template additionally repeats the same timing paragraph, scoring coherence 3. All other gated scores reach 4 or better. Both opening/return/closing contrasts are supported; no unsupported personal-history or astronomical claim was identified. Two additional voice/repetition suggestions are minor.

The catalogue authoring and preflight missed this source/prompt conflict before spending. It needs source-copy correction, not a weaker review threshold. The retained passing synthesis and quiet items are not failed by association. The natal lightweight gate remains passed; this review does not replace its evidence.

## Capture and binding

- Generating revision: `1f70941281a6deffc23481a2fda249f8292517da`.
- Seven sequential `gemini-enterprise/gemini-3.8-flash` calls, 30-second spacing, zero retries, seven lossless accepted drafts, no 429 or timeout. Source hashes stayed unchanged throughout. Cost is unknown; provider usage metadata is preserved in each result.
- Prompt `daily-astro-body-12`, original validator `daily-reference-8`; local capture deadline 180 seconds, serving deadline still 60 seconds. This does not establish member-provider availability.
- Before review, repair `b7255c4` added P1 modality coverage and restored Saturn–Sun before Jupiter–Mars/S1 in the combined template. Validator became `daily-reference-9`. Offline replay accepted all seven original drafts with exactly unchanged requests, facts and raw prose; no extra paid calls. Only paragraph 1 of the combined template changed among the eight captured templates.
- One fresh reviewer received only the randomized, citation-masked packet through a no-history context. Its output was frozen before coordinator inspection. Hashes, source-stable capture receipts, complete schedule, blindness, exact passages, scores and verdicts were checked by `check-review.mjs`. This is an AI writing review, not a human review or a full benchmark.

See `review-result.json`, `review.json`, `packet.json`, the assignment, dispatch and frozen receipts, `revalidation.json`, `template-diff.json`, and `verification.json`. The exact failing opening-case request is available as `exact-opening-transit-prompt.md` and `exact-opening-transit-request.json`.

## Release state at this review

Version `0.7.0` was staged inactive in the production records database while the review was pending: release ID `cbb7db71-99f9-40cf-a964-82e688cd879d`. Its round-trip bundle and unchanged active pointers were verified. It remains inactive after this failed result and must not be activated. A corrected bundle needs a new version; the staged bytes are immutable.

No push, deployment or activation occurred at this point. The independent native transit-source qualification remains open. AstroWay is the recorded natal chart provider; its public calendar documentation does not attest the custom episode proof and matching natal source identity. A content release does not supply those data.
