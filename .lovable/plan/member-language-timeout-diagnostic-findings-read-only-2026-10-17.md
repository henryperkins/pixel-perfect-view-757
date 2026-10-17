# Member language timeout: diagnostic findings (read-only)

## Findings
- Selected member provider: **gemini-enterprise**. `PATTERN_MEMBER_LANGUAGE_PROVIDER` is unset, so the default rule picks Enterprise because its key is present (source fa4420f).
- `GEMINI_ENTERPRISE_API_KEY` configured: **true**, in project secrets and in this sandbox's server environment.
- `LOVABLE_API_KEY` configured: **true**, in both places.
- Runtime logs for 2026-10-17T22:49:00Z–22:50:04Z: **none available**. Worker logs only cover the last hour, and searches for "gemini" and "timeout" in both published and preview logs returned nothing. That window is now past retention. No transport phase or HTTP status can be recovered from the logs here.
- Sandbox HEAD is fa4420f. I can't tell whether the 917c7c4-era request ran on the published build or the preview build.

## What this environment can do (not run)
- The sandbox server has both provider keys in its environment, so a bounded synthetic diagnostic could run on the server through the existing `generateSyntheticReadingProse` path. It would use synthetic fixtures, one request, no retry and the 60s deadline. Results would expose only diagnostic codes and transport trace fields (phase timestamps, HTTP status, request/response IDs, usage). Keys would never be printed or exported.
- The Gemini Enterprise provider would be selected explicitly.

## Proposed next step (only if approved)
1. Run one synthetic Enterprise case and record its transport trace (startedAt, headersAt, bodyAt, abortAt, httpStatus, deadlineMs).
2. Optionally run one Lovable gateway case for comparison, as a separate request with no fallback.
3. For future member timeouts, capture logs within one hour of the event.
