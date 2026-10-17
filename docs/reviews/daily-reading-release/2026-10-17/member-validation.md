# Member persistence and compatibility validation

The limited authored `0.9.0` release passed the local member persistence checks below. These use the real application server modules, SQL, per-account envelope encryption, stored evidence validators, and a reopened disposable SQLite database. Eligible editorial readings make zero provider requests even when both providers are configured. Legacy provider responses are controlled fixtures and outbound network calls are blocked by the harness. These checks do not establish production deployment, live provider quality, Swiss accuracy, or member adoption.

The test bundle is the exact editorial candidate with only its top-level version changed to `0.9.0`, matching the [prepared bundle](bundle.json). The clock is fixed at `2026-10-17T12:00:00Z`.

## Member path

[reading-editorial-member.test.mjs](../../../../tests/reading-editorial-member.test.mjs) exercises six cases:

- An unknown-time synthetic birth, saved through the application, selects Jupiter trine natal Sun. Warm/standard preferences and source consent select the exact authored headline, paragraphs, and reflection. The body and editorial evidence are encrypted, the independent reflection stays out of clear metadata, and source linkage is retained. Metadata records `template`, no model, `authored_editorial`, `skipped`, and `attempted: false`. Reopening the database returns the same reading and language evidence; owner export restores the saved content with zero provider requests throughout.
- A synthetic empty chart selects an authored quiet entry. Its encrypted reflection and exact saved reading survive reopening with zero provider requests.
- Plain/standard and warm/technical preferences retain the existing writer and reload the same saved reading. A controlled provider failure falls back once without a retry.
- A warm reading with selected natal and transit context retains the existing writer, saves the `N1`, `A1`, and `P2` evidence in the required encrypted envelopes, and reloads it without another model or transit request.
- Activating the numeric release in the disposable database creates a new same-day reading while preserving the complete previous `0.7.1` row. The next read reuses the new row.

The first contact fixture uses birth date `1980-04-11`, unknown time, UTC, and coordinates `0, 0`. Its local chart uses the application's declared approximation fallback. It is a deterministic persistence fixture, not evidence that a service supplied those positions. The natal/transit fixture contains explicitly synthetic service-marked evidence and a mocked scan.

## Independent compatibility review

Reviewed the change to `assembleReading` in [reading.server.ts](../../../../src/lib/reading.server.ts): selected natal or transit context now prevents editorial selection, preserving the existing writer and its required source references. Passing no editorial context changes only editorial selection in `resolveDailyWritingPlan`; legacy and schema-5 writing plans remain available. Eligible contact and quiet cases retain their editorial selection.

No important findings remained. [reading-editorial-member-compat.test.mjs](../../../../tests/reading-editorial-member-compat.test.mjs) supplies five additional focused cases for natal-only, transit-only, combined context, eligible contact, and quiet/plain behavior. The member persistence case above independently verifies that the combined context can be encrypted and reopened successfully.

The authored route in [language.server.ts](../../../../src/lib/ai/language.server.ts) is also independently reviewed. Only `generateReadingProse` enables the private authored option, and only when the selected editorial release is exactly `0.9.0`. Fact-graph, brief, template-reference, and quality validation still run before returning the authored copy. The synthetic entry point never enables the option, so evaluation still measures generated output. Plain/technical and selected natal/transit-context readings have no selected editorial entry and retain the existing writer. Diagnostic decoding in [diagnostics.ts](../../../../src/lib/ai/diagnostics.ts) accepts authored mode only as a skipped request with no attempt. No important findings remained.

[reading-editorial-authored-member.test.mjs](../../../../tests/reading-editorial-authored-member.test.mjs) adds five cases: all nine entries under both configured providers with no request, retained synthetic model generation, another release retaining the model path, malformed authored source rejection, and honest diagnostic decoding.

Checked runtime SHA-256 identities: `reading.server.ts` `8b8bb37864bccbe93243763a0b6cf6bccfb45dfe32c64f183727e5f490495910`; `language.server.ts` `d047347ed2609c28f63052342ede9711895e2699fbf34884923a291412b28ef5`; `diagnostics.ts` `d24888fbdbe4ca47d955a1691f3558751393942d02c298833c7dc2cc9650f76a`. The initial compatibility review began from base commit `406516294b4400133b11e23b271e35cbb236a582`.

## Verification

- Final authored route: all three focused member files passed together, **16 tests, 16 passed, 0 skipped, 0 failed**, in 1.61 seconds. Scoped ESLint and `git diff --check` passed.
- Before the authored route was introduced, the complete compatibility suite passed: **969 tests; 965 passed, 4 skipped, 0 failed**, in 57.80 seconds. Log: `/tmp/pattern-editorial-release-full-tests-unrestricted.log`. This historical full-suite result does not qualify the later routing change; final full-suite verification is recorded by the release operator after these focused checks.
- The initial confined run hit `spawnSync git EPERM` in the disposable Git build-identity test. The complete rerun with subprocess permission passed, including that test. This was an execution-environment restriction; no test or application change was made to bypass it.
- Current focused-test hashes: member persistence `3d08192779bd8edce3cdceaa1f56b2ab79bf1367f64ecdb602b9602203932867`; authored routing `4258c27a447686cc0f28ca0518a2f65e47232e52a16aa070c470b37bbd71e392`; compatibility `c5963e3a0e8ac30dd996ddfa8423d71b88c96c3969cfd43c14ae9231cb9f8f99`.

Production staging, live provider prose review, activation, and hosted member cache/reload proof are separate release records. This validation did not invoke a live model, publish content, or write production member records.
