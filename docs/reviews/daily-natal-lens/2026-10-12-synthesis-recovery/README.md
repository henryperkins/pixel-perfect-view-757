# Synthesis second-draft recovery

The final scheduled continuation call timed out at 120 seconds. Its original
[capture](../2026-10-12-raw-draft-continuation/paid-run/capture.json) remains unchanged.
Under the operator's instruction to continue, this separate one-call run captured
the outstanding second synthesis draft successfully in 14.23 seconds. It returned
HTTP 200, identified `gemini-3.8-flash`, and passed structural validation with a
lossless raw draft. There were no retries inside either runner; this was one
separate recovery attempt after the timeout.

The local capture deadline was extended to 180 seconds by the recorded
[runtime transform](deadline.mjs). The application, native provider request,
member-serving Lovable route and 60-second serving deadline were unchanged. The
successful call does not prove that extending the deadline resolved the earlier
timeout, or establish serving reliability.

[Capture](capture.json), [plan](run-plan.json), [finish receipt](run-finished.json)
and [source manifest](source-manifest.json) retain the original run bytes. The raw
draft joins the other three continuation drafts in the fresh blinded
[writing review](../2026-10-12-raw-draft-continuation/README.md). Its original sample
ID is `sample-1`; the derived four-draft review collection assigns it `sample-4`
and records that mapping explicitly.
