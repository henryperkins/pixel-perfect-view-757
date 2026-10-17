# Independent bounded writer-runner review

Reviewed `scripts/validate-editorial-release.mjs` before any paid execution. No blocking findings.

Reviewed script SHA-256: `c23f857963b0d6c8a8a995fe4d9381c79665b74437a704ac9f939542ea8adf84`.

The runner binds the numeric 0.9.0 bundle checksum, complete source-file hash map, exact five synthetic inputs and native member requests. Its only request change is the explicit 65,536 output-token cap. The plan records that local shared-writer validation does not prove production execution, getToday persistence, cache behavior, chart correctness or member acceptance.

`node scripts/validate-editorial-release.mjs --verify` passed with zero network attempts and plan hash `38ae03fb6245ecdcfe8717b593f77527770d05d6e6033b72f029797bfb123249`. A later source commit requires re-preparing this source-SHA-bound plan before execution. The runtime hash map records exact files even while the worktree is uncommitted; the recorded HEAD alone is not a clean-runtime claim.

An isolated copy under `/tmp/pattern-runner-review-FD1TR3` used a fake key and a preload that replaced fetch entirely with local responses. Each simulated provider call asserted that the exclusive run lock, conservative reservation and sanitized request capture already existed on disk. Every scenario verified that a second run was refused without changing its ledger.

| Simulated result | Calls | Final reservation | Outcome |
| --- | ---: | ---: | --- |
| Five accepted responses with complete usage | 5 | $0.011 | Completed |
| Missing usage | 1 | $2.80 | Halted; usage uncertain |
| Timeout | 1 | $2.80 | Halted; transport uncertain |
| Two responses costing $2.00 each by the configured accounting formula | 2 | $4.00 | Halted before the next $2.80 reservation could exceed $5 |

All generated files and process output were checked for the fake credential and a thought-text sentinel; neither was retained. Request captures omit authentication headers. Native thought parts and raw error bodies are excluded; the production writer converts transport failures to closed diagnostic labels. Maximum five calls, one call per case, immutable restart denial and stop-on-uncertainty behavior passed these offline rehearsals.

These are mocked transport/accounting checks, not provider billing or production evidence. Reservation pricing remains the existing conservative estimate, not an invoice. No real credentials, live provider requests, production records, publication or activation were used by this review.
