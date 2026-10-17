# Bounded release writer validation

Preparation freezes five contact requests from numeric release 0.9.0 through the shared generateReadingProse/memberLanguageProvider path. Preparation and verification make zero provider calls.

Run `node scripts/validate-editorial-release.mjs --verify` to verify the frozen runtime, bundle and requests. `--run` is the explicit paid execution command: at most five sequential Gemini requests, one per contact case, zero retries and zero quiet requests, with a $5 conservative reservation ceiling. It creates an exclusive run.json lock before any request. An existing run can never be restarted with this script.

The live wrapper adds only a 65,536 output-token cap. A full $2.80 conservative reservation is durable before each request and is reduced only using complete valid provider usage. Unknown billing, unavailable response or rejected prose stops remaining requests. These are estimates, not invoices.

Requests omit authentication headers; response evidence excludes thought parts and raw error bodies. The script reads the Gemini key privately from .env only during --run. It uses no database, Workflow, content-publication or activation endpoint.

Results establish local shared-member-writer behavior on synthetic fixtures. Actual production getToday, persistence, cache and reload evidence must be recorded separately. Automated acceptance does not replace editorial review.
