# Candidate recent-onset regression

Worktree: `/tmp/pattern-context-material-worktree-20261017`.

Changed only `src/lib/ai/language.server.ts` and new `tests/reading-context-claim-scope.test.mjs`. No production/provider calls or commits.

## RED

Command: `node --test tests/reading-context-claim-scope.test.mjs`

Before implementation: 4 tests, 3 pass, 1 fail, exit 1. The exact first-pilot contact-only draft returned `mode: "model"` when the new regression expected `"template"`. The assertion failed on mode before checking the expected rejection code. The draft's first sentence contains `You might find`; its second sentence separately asserts `expectations have begun to outpace your available capacity`.

Existing validators therefore did not already catch this specific regression. The hypothetical control, all five approved benchmark controls, and normal member/synthetic route controls passed before implementation.

## GREEN

Command: `node --test tests/reading-context-claim-scope.test.mjs`

After implementation: 4 tests, 4 pass, 0 fail, exit 0. The exact prior body rejects as `editorial_claim` at paragraph 1 after one gateway request, keeps its lossless raw capture unchanged, and restores the complete approved authored candidate fallback including headline and reflection. The same recent-onset wording under an explicit `If` remains accepted. The preceding sentence's `might` does not license the assertion. All five benchmark bodies and normal member/synthetic routes remain accepted.

Compatibility command: `node --test --test-concurrency=4 tests/reading-context-claim-scope.test.mjs tests/reading-context-writer.test.mjs tests/reading-editorial-authored-member.test.mjs`

Result: 17 tests, 17 pass, 0 fail, exit 0. This includes existing context candidate coverage/source checks and all nine 0.9.0 member authored selections.

Command: `npx eslint src/lib/ai/language.server.ts tests/reading-context-claim-scope.test.mjs`

Result: exit 0 after a manual Prettier-only wrap of the new helper. `git diff --check` on the two owned paths also passed. The benchmark test title was subsequently clarified from qualification to structural acceptance; no test logic changed.

## Guard limits

The new helper matches only the known recent-onset phrase, with a conditional qualifier required in its own clause. It is invoked only when `contextCandidate` is true. It does not claim to verify arbitrary semantic grounding, other recent-onset assertions, or general personal certainty. Independent source review is still required. Existing member/editorial validators and routing are unchanged.
