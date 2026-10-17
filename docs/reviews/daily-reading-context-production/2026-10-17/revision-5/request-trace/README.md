# Intercepted provider requests

Offline captures of the exact Gemini Enterprise request body for all five context cases. Both were taken through the frozen pilot path, `runSyntheticEvaluationCase(…, "gemini-enterprise", …, { boundedQualification: true }, "daily-context-1")`, and through the member Today route, `generateReadingProse` with all five modes allowed. The records harness replaces `fetch`, answers the provider with HTTP 503 and fails on any other external call; the capture counts any such attempt in `externalAttempts` (0 in both files). No network or provider request was made.

- [before-requests.json](before-requests.json): revision 4 at `d35e8b5`. The four cases sent in pilot 4 match the saved pilot captures byte-for-byte. Synthesis was never sent.
- [after-requests.json](after-requests.json): revision 5. Both routes send identical system and user messages; only the pilot sets `maxOutputTokens`.
- [premise-analysis.json](premise-analysis.json): for each request, how many separate strings word each premise, using `tests/helpers/context-premises.mjs`. It also counts premise restatement by sentence in the authored and saved bodies.

Reproduce with the [scripts](../scripts/): `node capture-requests.mjs <checkout> <out.json> [label]`, then `node analyze.mjs <checkout> <before.json> <after.json> <out.json>`. `node replay.mjs <checkout>` returns each authored or saved body as the intercepted response and prints the production validator's outcome.
