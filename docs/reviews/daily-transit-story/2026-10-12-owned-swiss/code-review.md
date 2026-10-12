# Independent implementation review

A fresh reviewer inspected `52a589f..25e8f37` against the owned-service plan and transit specification. It inspected numerical, HTTP, source-distribution and app integration code, verified the five numerical source hashes and all 35 evidence hashes, and reproduced issues in temporary directories and raw sockets. It did not mutate the implementation or repeat the dense qualification.

The verdict was **with fixes**, with no critical findings. Both findings are now fixed in one regression-tested pass:

| Finding | Resolution and observed regression |
| --- | --- |
| Important: Swiss auxiliary timing files could change positions while retaining the qualified source ID | Startup permits exactly the pinned regular files and requires the effective native environment path to match the verified directory. Auxiliary-file and environment-override tests failed before the fix and pass after it. |
| Reviewer minor, upgraded to important: rejected streaming bodies kept consuming connections after admission was released | Error responses close unfinished uploads after flushing, and body listeners/timers are removed. A raw-socket regression first failed on an unauthenticated upload; after the fix it passes for unauthenticated, oversized chunked and timed-out uploads. The severity was upgraded because the public endpoint exceeded its resource deadline while accepting further work. |

Post-fix verification: **22/22 service tests**, **532/532 application tests**, and **15/15 refreshed independent numerical cases**. All raw scans and dense tracks remain byte-identical; only qualification timing measurements and the engine source hash changed. The maximum numerical difference remains 5.625 seconds. Typecheck, scoped route lint and application build passed before the service-only fixes; no application TypeScript changed afterward. The Docker build runs the service suite again on Node 22 before deployment.

## Decisions recorded during execution

- A true station tangent with no honest contact proof returns a closed unavailable error. This preserves omission rather than inventing an ordinal; the tradeoff is less specific incomplete-scan diagnostics.
- Adjacent-millisecond native Jupiter speeds demonstrated that a 1e-9 station tolerance was below the measured noise floor. The solver uses 5e-8, within the application's unchanged 1e-7 contract; the real five-body integration regression verifies acceptance.
- Two initially mislabelled single-contact fixtures were corrected to require five contacts after both independent enumerators found five. The failed original fixture report is retained. Numerical tolerances and solver behavior were not relaxed.
- Whole-change review ran before public deployment so its fixes could be included in the first release. Deployed behavior remains subject to separate remote checks.
- The reviewer deferred judging live Fly behavior, production settings and activation. Those require the deployment receipt; local tests cannot substitute for them.
- The reviewer inspected the standalone AGPL source offer but did not make a legal determination about the application/service boundary. The service imports no proprietary application code and publishes its complete service sources. This technical implementation does not settle legal interpretation; a different interpretation could require licensing or distribution changes.

No minor code findings remain deferred. No second reviewer was used: observed failing regressions, the passing full suites and refreshed numerical evidence verify the fixes.
