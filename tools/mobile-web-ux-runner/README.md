# Mobile Web UX Runner

Private skills-only plugin, local candidate version 2.0.1. The existing plugin identity and presentation are preserved. This authoring copy has not been published or installed.

The runner integrates the October 20, 2026 r2 mobile-web audit contract with the project's installed Impeccable skill. Audit-only is the default; device-dependent fixes require separate apply-and-hand-off authorization and complete remaining coverage within half the human check-entry budget. The application, installed Impeccable version, tools, and actual evidence determine what can be claimed.

The active workflow is `skills/mobile-web-ux-runner/SKILL.md`. Its references contain the contract, module checks, reporting procedure, and schema-2 ledger. `scripts/run_state.py` supports init, validation, reporting, conservative migration of schema-1 ledgers, and results-only updates. It does not launch an app, execute tests, authenticate evidence, or provide devices.

Version 2.0.1 separates an observed mechanism/proxy scope from the device regression requirements of its fix. Requirements use `fix.device_regressions`, checks link them through `regression_covers`, and reported results use `regression_results`. Original `affects`, evidence, and `covers` retain their meaning. Separate planned state snapshots support grouped entries without treating planned conditions as observations. Legacy target-scoped plans remain supported; authorization, complete planning, distinct-entry budgeting, and original-scope verification gates remain in force.

The original r2 suite is identified by filename, revision, and SHA-256 in `references/sources.md`; active references replace the old bundled v3 instructions. The test catalog separates behavioral scenarios from recorded test executions. An installed test case is not proof that it passed.

The local planning-fix validation is recorded separately in `skills/mobile-web-ux-runner/tests/planning-validation.json`: 115 helper tests (86 retained and 29 new), 12 focused CLI checks, independent code/ledger review, and focused documentation scenarios. The historical 49-case behavior record was preserved and was not rerun as part of this change. Pattern's copied ledger is valid but incomplete with a proxy ceiling; physical-device verification remains unrun.

Impeccable remains a separately installed dependency. No MCP service, application deployment, or physical-device validation is bundled or implied.
