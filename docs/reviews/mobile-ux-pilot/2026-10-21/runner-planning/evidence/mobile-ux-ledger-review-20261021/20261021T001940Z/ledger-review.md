Verification ceiling: inherited local source and desktop-browser proxy evidence only. This review changed records only; it ran no application or physical-device tests. **All physical-device checks remain unrun.**

The ledger contained correctable record errors and a remaining planning gap. The corrected copy separates related phone regressions from direct verification of F-02's preserved desktop-WebKit scope. The installed helper still returns **exit 2**, because a complete target-check plan for that original scope cannot be represented truthfully by the existing phone entries. The original scope, evidence and earlier files are preserved.

# Ledger-planning investigation and record correction

## Findings

The [original guard ledger](../../mobile-ux-f02-guard-20261021/20261021T000416Z/run.json) defined F-02 scope `webkit-mouse-390` as **Playwright WebKit 26.6 on a Linux desktop host with mobile viewport/touch emulation**, using the original synthetic Today/check-in journey. It did not establish a physical iPhone or Android failure. Its conditions also specify Linux, the viewport/display mode, fixture setup, account data, mouse activation steps and timing.

The record I wrote mixed two different purposes:

- C-GD01–C-GD04 were related phone regression checks, with no direct `covers` link to that scope, but were listed in `fix.required_check_ids` as though they supplied original-scope verification.
- C-GD10 used Safari on an iPhone with an external pointer, yet its `covers` field linked directly to the Linux desktop-emulation scope. Similar mouse input does not establish the same browser, device, setup or reproduction conditions.

There were also planning metadata problems. The unrun phone entries used `level: unestablished`, while the helper's planning predicate expects a planned acquisition level of `target`. The phone build is correctly recorded as `B-PHONE-GUARD`, distinct from the tested local `B-F02-GUARD`; its bootstrap/backend wiring remains unknown. The prior script also placed the pointer regression after broader follow-ups rather than alongside the four other guard regressions.

The earlier report described the issue too broadly as a helper limitation. These record errors are part of the cause. [diagnosis.json](diagnosis.json) records each required entry's coverage link, planned level, build identity, browser/device comparison, condition mismatches and the unchanged helper's predicate result.

## What the helper actually requires

The installed helper's `planned_target_matches` requires all of the following:

1. A planned target level and physical-device/supported-simulator/field environment.
2. A check build ID equal to the finding's fix build ID.
3. Browser and device values equal to the original scope's browser/device values.
4. Matching original conditions, including literal state, setup, account, steps, timing and any additional recorded fields. For fixed-build comparison it excludes only build/substitution fields from this condition comparison.

Separately, `target_valid` excludes desktop emulation from achieved target verification. These rules were read from the installed helper; its source was not edited. The relevant functions are `match_conditions`, `target_valid`, `planned_target_matches` and the applied-device-plan gate in `assess`.

Consequently, changing only a link, level or build label cannot make a real phone check match this preserved desktop-emulation scope. Copying the desktop conditions into the phone records would misdescribe the future test. A five-entry count within a budget of ten establishes capacity only; it does not establish scope coverage or application-plan admission.

## Corrections made

The new [run.json](run.json) is a revised copy of the original application ledger, with its original run ID/mode/application facts preserved and a separate records-only review event. It is not a new application run or a new device-results submission. [record-changes.json](record-changes.json) contains the complete field diff.

| Record | Correction |
| --- | --- |
| F-02 `fix.required_check_ids` | Removed the unsupported claim that the five phone regressions provide exact original-scope target coverage. The list is explicitly empty, with `scope_verification_plan.status: unmapped`; this intentionally leaves the original admission gap visible. |
| F-02 related follow-ups | Preserved all five IDs in `fix.device_regression_check_ids` and `related_regression_check_ids`. Every check itself remains present and required. |
| F-02 `verification_ids` | Kept the existing source/proxy verification checks and separated the five phone follow-ups into the related-regression list. No executed check or outcome was removed. |
| C-GD10 `covers` | Removed the unsupported direct link to the desktop scope. Its relation to F-02 remains explicit as a guard regression. |
| C-GD01–C-GD10 planned level | Recorded planned acquisition as `target`, with `planned_only: true` and `achieved_level: unestablished`. Every status remains `not_run`; actual results/evidence remain empty. No device capability was made available. |
| Script ordering | Grouped the five guard regressions first: C-GD01, C-GD02, C-GD03, C-GD04, C-GD10. All ten entries, their scenarios, steps, builds and setup remain present; the budget stays ten. |
| Reason/plan text | Replaced the earlier implication that fitting five slots admitted the application plan with an explicit missing-original-scope mapping. |
| History | Retained the previous fix plan, verification IDs, phone records, script order and explanation in an immutable-source-linked correction event. |

The [corrected target plan](target-plan.json) distinguishes the five related guard regressions from the empty original-scope target mapping and explicitly records `application_plan_admitted: false`.

## Validation outcome

The unchanged helper reproduced six errors on the original records. On the corrected records, both `check` and `report` return the same two remaining errors:

```text
F-02: applied device fix requires its complete target-check plan
F-02/webkit-mouse-390: applied device fix omits affected scope
```

This is **invalid/incomplete planning (exit 2)**, not a valid incomplete ledger (exit 3), and not a successful application-plan gate. The corrected records now state the actual missing plan instead of attributing false direct coverage to phone checks. [original-cli-check.json](original-cli-check.json), [corrected-cli-check.json](corrected-cli-check.json) and [corrected-cli-report.json](corrected-cli-report.json) retain the actual outputs.

No flags or alternate modes were used to bypass the gate. In particular, the original application run's mode/operation, applied/device-dependent fix classification and policy were preserved; no `applied_before_run` exemption or fabricated `application_basis` was added. The schema explicitly requires an application basis to have been valid before results, so wrapping this invalid plan in one would not repair it.

F-01, F-02 and F-03 remain **implemented**. None is promoted to target Verified, refuted, narrowed or removed. The achieved ceiling remains **proxy**, because a planned target level on an unrun entry does not count as an executed target observation. The previous 60 passing browser cases and application test results remain prior evidence; no tests were rerun in this records-only review.

## Preserved scope, evidence and working tree

[preservation.json](preservation.json) verifies:

- All original finding `affects` objects, the top-level scope and all finding evidence are identical.
- Every executed check record is identical. Every check's status, actual result, evidence, configuration, conditions and build ID is identical.
- All 30 physical-device records across the historical build versions remain `not_run`, with empty results/evidence. The current script retains all ten entries.
- All **360 prior artifact files** are byte-identical, including the original guard ledger, prior reports, scripts and raw evidence. The original artifact directories were not rewritten.
- All **2,266 repository files** in the non-secret baseline are unchanged; Git status, HEAD and staged index are identical.
- All **29 inspected plugin/instruction files** are unchanged, with no new plugin files.

Only new review artifacts in this directory were created. There were no application or plugin edits, commits, pushes, deployments or new runtime/device checks.

## Remaining physical-device script

[device-script.md](device-script.md) reissues all ten entries with blank result, separate build/setup confirmation, notes and screenshot/trace fields. These are related regression plans on an unprovisioned phone build. Unknown build/setup substitutions remain unknown; no local Vite alias is assumed to exist on a phone.

The Safari Compact/Bottom/Top, Android Chrome and Safari external-pointer guard checks receive practical priority. VoiceOver, TalkBack, actual Safari/Android interruption and an Android performance trace remain separate unrun entries. Existing beyond-budget titles are retained.

## Remaining question

The installed schema/helper does not separate the preserved observed proxy scope from a different future target qualification scope in this application gate. The current records contain no truthful target entry matching the original Linux desktop-emulation conditions. This review cannot clear that structural gap while preserving those facts and leaving the plugin unchanged. Further phone testing alone would not make a phone configuration equal that original desktop configuration.

The corrected records are usable as an honest handoff with this explicit validation limitation. They are not a fully validated ledger, device certification, or retroactive proof that the original application plan was admitted.
