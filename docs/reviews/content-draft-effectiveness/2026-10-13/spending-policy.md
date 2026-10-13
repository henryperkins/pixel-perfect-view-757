# Pilot spending policy — frozen before generation

Operator authorization: eight generation attempts total, $5 total generation cap, no retries. No additional paid reviewer round or broader live suite is authorized.

The controller reserves $2.80 before each attempt under existing bounded transport (65,536 input bytes and 65,536 output tokens). A later attempt starts only if its entire reservation fits within the campaign's remaining $5. Complete consistent usage reconciles the reservation using the conservative allowance of $2 per million input tokens and $20 per million output/reasoning tokens. Missing or inconsistent usage retains $2.80 and halts. This is reservation accounting, not an invoice or a claim about actual account charges.

Checked 2026-10-13: [Google's Enterprise Agent Platform pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) lists standard global Gemini 3.8 Flash text pricing through December 31, 2026 as $0.75 input and $3.75 output (response and reasoning) per million tokens; the published later standard rates also remain below the controller's allowances. The bounded request is below the long-context threshold. No promotion credit or cache discount is assumed. Account-specific billing/invoice access is unavailable; provider availability will be observed within the authorized attempts, never by an extra paid smoke test.

Selected serving provider is checked at preview, start and every step. Both arms must retain the same provider and actual model identity. A failure is captured and stops further affected work; no other provider is tried.
