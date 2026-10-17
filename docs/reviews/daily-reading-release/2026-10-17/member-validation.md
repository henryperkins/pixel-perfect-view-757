# Member persistence and compatibility validation

The limited `0.9.0` release passed the local member persistence checks below. These use the real application server modules, SQL, per-account envelope encryption, stored evidence validators, and a reopened disposable SQLite database. Model responses are controlled fixtures and outbound network calls are blocked by the harness. These checks do not establish production deployment, live provider quality, Swiss accuracy, or member adoption.

The test bundle is the exact editorial candidate with only its top-level version changed to `0.9.0`, matching the [prepared bundle](bundle.json). The clock is fixed at `2026-10-17T12:00:00Z`.

## Member path

[reading-editorial-member.test.mjs](../../../../tests/reading-editorial-member.test.mjs) exercises six cases:

- An unknown-time synthetic birth, saved through the application, selects Jupiter trine natal Sun. Warm/standard preferences and source consent select the editorial writer. One accepted mock response saves the body and editorial evidence encrypted, keeps the independent reflection out of clear metadata, and retains source linkage. Reopening the database returns the same reading and language evidence; owner export restores the saved content without another provider request.
- A synthetic empty chart selects an authored quiet entry. Its encrypted reflection and exact saved reading survive reopening with zero provider requests.
- Plain/standard and warm/technical preferences retain the existing writer and reload the same saved reading. A controlled provider failure falls back once without a retry.
- A warm reading with selected natal and transit context retains the existing writer, saves the `N1`, `A1`, and `P2` evidence in the required encrypted envelopes, and reloads it without another model or transit request.
- Activating the numeric release in the disposable database creates a new same-day reading while preserving the complete previous `0.7.1` row. The next read reuses the new row.

The first contact fixture uses birth date `1980-04-11`, unknown time, UTC, and coordinates `0, 0`. Its local chart uses the application's declared approximation fallback. It is a deterministic persistence fixture, not evidence that a service supplied those positions. The natal/transit fixture contains explicitly synthetic service-marked evidence and a mocked scan.

## Independent compatibility review

Reviewed the change to `assembleReading` in [reading.server.ts](../../../../src/lib/reading.server.ts): selected natal or transit context now prevents editorial selection, preserving the existing writer and its required source references. Passing no editorial context changes only editorial selection in `resolveDailyWritingPlan`; legacy and schema-5 writing plans remain available. Eligible contact and quiet cases retain their editorial selection.

No important findings remained. [reading-editorial-member-compat.test.mjs](../../../../tests/reading-editorial-member-compat.test.mjs) supplies five additional focused cases for natal-only, transit-only, combined context, eligible contact, and quiet/plain behavior. The member persistence case above independently verifies that the combined context can be encrypted and reopened successfully.

Runtime input checked: `src/lib/reading.server.ts` SHA-256 `8b8bb37864bccbe93243763a0b6cf6bccfb45dfe32c64f183727e5f490495910`. The review began from base commit `406516294b4400133b11e23b271e35cbb236a582` with the compatibility change in the working tree.

## Verification

- `npm test`: **969 tests; 965 passed, 4 skipped, 0 failed**, completed in 57.80 seconds. Log: `/tmp/pattern-editorial-release-full-tests-unrestricted.log`.
- Both focused member test files passed together. Scoped ESLint and `git diff --check` passed.
- The initial confined run hit `spawnSync git EPERM` in the disposable Git build-identity test. The complete rerun with subprocess permission passed, including that test. This was an execution-environment restriction; no test or application change was made to bypass it.
- Input hashes were unchanged after the complete run: member persistence test `f9eb5071b5ee293fcfd4eac7f21061d0831ff6f95b127e7eb08dec5cda7c1b16`; compatibility test `c5963e3a0e8ac30dd996ddfa8423d71b88c96c3969cfd43c14ae9231cb9f8f99`; runtime hash as recorded above.

Production staging, live provider prose review, activation, and hosted member cache/reload proof are separate release records. This validation did not invoke a live model, publish content, or write production member records.
