# Reporting, ledger, and device results

Use the seven outputs below for an audit. A results-only update must reissue at least the verdict, coverage, updated findings, and remaining device script. Keep recommendations, changes, and open questions where relevant. Read evidence-contract.md for the governing rules and ledger-schema.md when creating or updating machine records.

## Outputs

1. **Verdict:** first line names the achieved verification ceiling and its environment/limits. Then state the biggest risk to the principal task, in five lines at most. A target observation in one browser or one metric does not establish all-browser or whole-journey verification.
2. **Coverage:** list standing substitutions once with their environment/build scopes, then all ten master areas with disposition, environments used, highest level reached, and remaining work/environment. Use Defects found for Observed or Code-supported defects. Use No defect found only for checked scenarios; hypotheses and recommendations alone are not defects. Use Not tested where no relevant check completed, and Not applicable only with a reason. Keep seven-module orchestration separate.
3. **Findings by severity:** preserve stable F-IDs, title, impact severity, evidence class, status, location/revision, reproduction, expected/actual behavior, affected scope, cause or hypothesis, retained evidence and limits, minimal fix, and checks. Separate applied and proposed device-dependent fixes. Include check IDs for scheduled unrun checks and title-only references for checks beyond budget. Preserve closed findings and their reasons. A “not reproduced” note is not a new finding status.
4. **Recommendations:** keep Recommendation-class improvements separate from defects and tie them to observed task needs. An API's existence is not a product requirement.
5. **Changes made:** in audit-and-fix mode, name files, linked findings, and resulting behavior. Verify/device-results modes may describe the earlier fix they checked but must not claim new source edits.
6. **Device check script:** actionable target checks a person can run, within the entry budget and grouped by device/browser. Give correct expected behavior, exact needed build, build/setup substitutions, setup, steps and state transitions. Include a blank result and separate build/setup confirmation, notes and screenshot fields. A fix check needs a phone-reachable build containing the fix. Preserve unchanged C-IDs; new build or scenario requires a new ID referencing the earlier one. List unselected checks by title only.
7. **Open questions:** list the specific missing facts/access that block further conclusions. Missing field data belongs here, not in a pretend human-device task. A device performance check must name its measuring tool.

### Device-entry selection

The budget is a nonnegative integer, default 10. Zero means no entries. Select checks on applied device-dependent fixes first, capped at floor(budget / 2); then checks that could confirm/refute P0/P1, then other decision-relevant checks. Ordinary applied label, hint, image-dimension or font-size edits receive no reserved priority.

Before applying a device-dependent fix, identify its complete remaining human coverage. Count each distinct browser/device entry, including separate configurations needing separate results. Shared checks count once only when the same actual entry truly covers multiple findings. For budget 6, a two-entry fix consumes two of the three reserved slots; a second distinct two-entry fix must remain proposed. For budget 3, a two-entry fix cannot be applied under this gate. Do not omit a check, narrow Affects, round up, or merge independent outcomes to fit.

A check can contain explicit state transitions with expected results per step. Preserve each reported portion; a portrait pass does not imply landscape passed. Build and setup substitutions must be distinguishable. Do not copy a local Playwright stub into a phone script unless it actually exists in that phone build/setup. Write none (checked) only with evidence; otherwise name unknown wiring and its limit.

Separate original finding-scope coverage from independent device regression plans. List each `fix.device_regressions` requirement, its source scope IDs, linked checks, planned conditions and qualified result. Mark a `regression_covers` link as a device regression link, not original-scope `covers`. Use `regression_conditions` for independently planned states in a grouped entry and `regression_results` for reported portions. The script's target level describes intended acquisition; `not_run`, blank actual and empty evidence establish no target observation. A phone build can contain the fix without being the local proxy build; preserve both identities and unknown wiring. Regression passes never automatically verify/refute the original observation or retire its historical failure.

Phone reachability is an execution prerequisite. A complete reserved plan can name an unprovisioned future build, but must state that limitation and the missing build/setup/access under open questions. Do not present those entries as ready to run or as completed. This does not waive a missing result needed to establish the repair itself; that fix remains proposed. Target plan completeness and entry-budget admission alone do not establish access, safety of actual writes or qualification.

Before handing off, map every required target condition to an entry and an explicit setup or step. For layout/content-growth findings, carry the relevant narrow width, orientation, content length, and text enlargement into the target script; listing them only in a desktop plan leaves target coverage missing. “Phone portrait” alone does not specify a narrow viewport. Name the required CSS width or supported narrow configuration and have the tester record the actual width. Do not invent compatible hardware or treat a resized desktop viewport as the target. If a required target configuration is unavailable, keep that portion unrun and visible; if it needs a separate entry, count it against the budget. The helper can check only scopes that were recorded, so review this mapping against the original finding before trusting the ledger.

Example entry structure (illustrative, not executed):

```text
C-01 [F-03] iPhone / stated iOS version / Safari / stated tab layout.
Build: preview containing the F-03 patch.
Substitutions active in this check: build: test API (details); setup: unknown (share flag not inspected).
Setup: test account, named route, orientation, tab layout.
Steps: 1. ... 2. ...; record each requested state separately.
Expected: correct visible behavior at each step.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot: ___
```

## Files and helper commands

Default artifacts are `<project>/.mobile-ux/runs/<run-id>/run.json`, `report.md`, `summary.json`, and sanitized evidence. Use an allowed artifact directory when project writes are prohibited. Artifact creation is not application source editing; do not commit artifacts automatically. Exclude credentials, tokens, personal records, and production payloads.

Resolve the installed skill directory and actual Python launcher. The helper uses Python 3.9+ standard library only. Substitute real absolute paths:

```text
python <skill-dir>/scripts/run_state.py init --project <project> --target <route-or-source> --task <principal-task> --output-dir <runs-parent-dir>
python <skill-dir>/scripts/run_state.py check <run-dir>/run.json
python <skill-dir>/scripts/run_state.py report <run-dir>/run.json
```

The init command creates a new `<run-id>` subdirectory under the output parent and returns the exact `run_file` path; use that path for check/report. Omitting mode initializes audit_only, device-dependent policy propose_only, and budget 10. Explicit implementation uses `--mode audit_and_fix`; the separate opt-in is `--device-dependent-fixes apply_and_hand_off`. Set a different budget with `--device-check-budget N`. Explicit old CLI aliases `audit` and `run` map to audit_only and audit_and_fix for compatibility; they do not change the natural-language default or authorize old-run edits on resume.

The helper initializes/validates records, renders reports, migrates legacy ledgers, and consumes reported results. It does not call Impeccable, launch the app, inspect a page, edit source, run application tests, or authenticate evidence. Without Python, maintain equivalent structured records and report artifact/tool limits instead of abandoning supported work.

For check/report, exit 0 means submitted records satisfy the completion gates; 3 means valid but incomplete; 2 means invalid data or an execution error. Do not equate a valid incomplete handoff with a crash. Init/migrate/apply-results return 0 when they create their output; inspect the returned assessment before making completion claims. Correct invalid records rather than deleting necessary checks or evidence.

### Migrating an existing ledger

```text
python <skill-dir>/scripts/run_state.py migrate --input <old-run.json> --output <new-schema-2-run.json>
```

The output must be a new file. Migration preserves the complete original record and its history. Old verification lacks r2's explicit scope/build/substitution guarantees; it is retained as historical evidence and requires revalidation. Never infer real devices, an unsubstituted backend, a fixed build, or renewed editing authorization from a legacy passing check. Fill missing fields from evidence, keeping unknowns unknown.

The exact schema, environment/acquisition mapping, substitution records, covered scope relationships, and results input live in ledger-schema.md. Record evidence class, acquisition method, and verification level separately. Do not encode all three as an ambiguous evidence-type string.

## Results-only procedure

Use this when a person returns the script or the user requests Prompt 8. Read the earlier audit and results. Do not re-audit or edit application source. Normalize only information the tester actually supplied; retained planned details are not newly observed facts.

1. Match the existing C-ID and F-IDs. Preserve raw results and prior evidence in history. A changed scenario/build gets a new C-ID linked to the earlier entry; unchanged checks retain their IDs.
2. Record reported device, OS, browser, build, setup, state, actual behavior and evidence. Confirm build and setup independently. Confirmed portions inherit their listed substitutions, including unknown. Unconfirmed portions become not reported. Build confirmation alone does not establish setup, account/data, timing, all steps, or missing boundaries.
3. Preserve clear passes/failures at their reported scope or independent regression. Mark missing or ambiguous portions not run. For multi-state or mixed scope/regression checks, use explicit `scope_results` and `regression_results`; count both families before considering any aggregate result. Explicit empty regression results never inherit a pass. Do not promote one reported step to all steps, copy `partial` into a portion, or use planned snapshots as actual evidence. Keep partial failures visible in the overall verdict.
4. Evaluate behavior and cause separately. A failure that reproduces the defect confirms it within the tested conditions and dependencies. An unrelated failure does not. A recurrence after a fix reopens the affected scope. Cause-only evidence revises the causal explanation without automatically reopening or closing the defect.
5. Implemented fixes need target passes on a build containing the fix across every unresolved affected scope, with no relevant unknown/replaced dependency. A layout observation can remain target when an unrelated backend is unknown; that does not verify persistence or identify an unconfirmed fix build.
6. An unfixed pass is normally not reproduced in this run. Apply the contract's contrary-evidence rules to the finding's claimed target conditions, not the earlier static/proxy environment. Deterministic source/proxy predictions can be refuted by a matching target result contradicting the prediction. A prior target-observed failure needs reported explanation of the discrepancy. Intermittent/unknown determinism needs pass count and causal exclusion; passes alone do not close, narrow, or downgrade it. Independently established source/accessibility requirements need their own refutation. Whole-scope qualifying contrary evidence permits not an issue, never Verified for an unfixed finding.
7. Recompute coverage and unresolved scope, retaining closed findings and reasons. Reissue the required sections and a remaining script within the original budget. Do not repeat completed portions as if they never ran.

To use the helper, encode the reported results according to ledger-schema.md and write a new ledger:

```text
python <skill-dir>/scripts/run_state.py apply-results --input <run.json> --results <reported-results.json> --output <updated-run.json>
python <skill-dir>/scripts/run_state.py report <updated-run.json>
```

Flags such as conditions_confirmed, all_steps_confirmed, explains_prior_observation, and mechanism_ruled_out are assertions backed by the tester's report; they are not shortcuts to obtain a desired status. Do not invent them from a bare Pass. The updater's consistency checks cannot determine whether a human report or evidence reference is truthful.

## Verification planning

| Category | Relevant scenarios |
| --- | --- |
| Principal journey | Entry, action, completion, recovery, return navigation |
| Reflow and desktop | 320 CSS px, useful phone widths, short landscape, larger text/zoom, desktop and intermediate layouts |
| Browser chrome/insets | Supported Safari layouts and Android Chrome, expanded/collapsed chrome, orientation, home/gesture areas |
| Forms | First/last field, focus visibility, valid characters, paste/autofill, keyboard open/close, validation, reachable submit |
| Touch/gestures | Hit areas, tap cancellation, native scrolling, pinch, edge navigation, tap alternatives |
| Overlays/history | Focus entry/return, semantics, scroll lock, close paths, native Back, Forward, direct entry, unsaved state |
| Accessibility | Names/roles, keyboard, focus, contrast, zoom/reflow, actual screen-reader journeys, reduced motion |
| Recovery | Slow/failing requests, duplicate activation, lost response/outcome unknown, interruption with test data |
| Performance | Comparable measured baseline/confirmation, field versus lab, real device measurement tools |

A screenshot cannot establish autofill, pointer cancellation, or focus trapping. A scan cannot establish a full VoiceOver/TalkBack journey. Keep missing checks visible. A valid ledger says only that its submitted records satisfy structural gates; the agent must still check omitted scenarios, evidence quality, and actual scope before stating an outcome.
