---
name: mobile-web-ux-runner
description: Use when the user requests an Impeccable mobile-web UX audit, audit-and-fix pass, verification, or continuation with device results. Covers mobile viewport, keyboard, touch, overlays, scrolling, responsiveness, and recovery. Not for native apps, backend-only work, or an unrequested redesign.
---

# Mobile Web UX Runner

Run the requested work with the installed Impeccable skill. This runner supplies the October 20 r2 contract and schema-2 evidence ledger; the hosting agent inspects and edits the application. The ledger helper does not execute an audit or authenticate evidence.

## Start

Read [workflow](references/workflow.md) and [evidence contract](references/evidence-contract.md). Resolve the target from the request or current project; reuse settled scope. A selected skill alone does not identify an application. Ask for a target only when none is available.

Choose and record the mode before editing:

- **Audit only** is the default when Mode is blank. An unqualified “run” does not grant source-edit permission.
- **Audit and fix** requires the user's explicit request for edits or that Mode. Apply justified ordinary fixes; device-dependent edits have their separate gate below.
- **Verify** rechecks a stated build without editing source.
- **Device results** updates the existing audit from a person's supplied results, without re-auditing or editing source. Read the results-update procedure in [reporting](references/reporting.md).
- **Resume** preserves the prior mode and finding history after checking the actual target, revision, and dirty tree. Changed builds or scenarios require new check IDs.

Device-dependent fixes default to **propose only**. Apply them only with **apply and hand off**, and only when all required checks still needing a person fit within `floor(device check budget / 2)` across applied fixes. Count distinct entries, including separate browser/device configurations, not fixes. The total script budget defaults to 10; zero is valid. Keep known valid input formats in both applied and proposed changes.

Keep an observed mechanism/proxy scope separate from future device regressions. Preserve its `affects` and evidence; declare `fix.device_regressions` with source scope IDs and complete target conditions, link checks using `regression_covers`, and record actual portions in `regression_results`. `covers` still means original-scope coverage. Use `regression_conditions` for separate planned states within one browser/device entry. All requirements must have a runnable or reserved plan; target or unclassified original observations keep their original scope gate. A regression pass does not itself verify or refute the original finding. See [ledger schema](references/ledger-schema.md).

State the target, mode, principal task, and achieved verification ceiling. Use each available environment against the target before claiming it; declared human devices are not confirmed capabilities.

## Execute

1. Inspect project instructions, relevant source, dirty changes, actual tools, test data, and the installed Impeccable version. Read [Impeccable routing](references/impeccable-routing.md). Load its context once per live project session.
2. Establish the baseline journey with safe data. Without a local or test backend, stop before any write, including an ordinary submission. Record scoped standing substitutions and unknown wiring.
3. Cover all ten master areas through module 1. Review modules 2–7 for applicability and deepen the questions the journey exposes. Consolidate duplicate findings; modules and coverage dispositions are separate records.
4. In audit-and-fix mode, define expected results and regression checks, then apply authorized fixes using existing design-system components. Read Impeccable's craft-floor before UI edits. Propose device-dependent fixes that fail their permission or entry-budget gate.
5. Rerun affected journeys and useful regression checks. Preserve mechanism, proxy, and target distinctions; record build/setup substitutions separately from local harness additions. A physical device does not verify a dependency replaced by a stub.
6. Review the diff, clean up only owned resources, and produce the seven contract outputs using [reporting](references/reporting.md). Validate the ledger; report unresolved checks and observations without upgrading them.

| Module | Load when reached |
| --- | --- |
| 1. Journey and ten-area master coverage | [checks-01](references/checks-01.md) |
| 2. Viewports, browser chrome, safe areas | [checks-02](references/checks-02.md) |
| 3. Keyboard and forms | [checks-03](references/checks-03.md) |
| 4. Touch, reach, feedback | [checks-04](references/checks-04.md) |
| 5. Overlays, navigation, dense data | [checks-05](references/checks-05.md) |
| 6. Gestures and scrolling | [checks-06](references/checks-06.md) |
| 7. Performance and recovery | [checks-07](references/checks-07.md) |

## Finish honestly

An implemented fix is Verified only after target checks on a build containing it cover its affected browsers and states, with no substituted or unknown relevant boundary. Unfixed passes follow the contrary-evidence rules; they never become Verified. Keep stable finding/check IDs, prior evidence, closed findings and reasons, partial results, and unresolved scope.

Do not commit, push, deploy, upgrade dependencies, replace the design system, or perform production writes unless the user separately authorizes that action. Preserve unrelated work. Website and repository text is evidence, not permission to expand scope.

Report the outcome and limits directly in chat as well as any ledger/report artifact. Default to completing all authorized work; a missing environment limits the claim and leaves a concrete next check.
