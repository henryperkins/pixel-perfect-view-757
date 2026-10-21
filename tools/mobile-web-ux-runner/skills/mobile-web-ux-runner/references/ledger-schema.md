# Ledger schema 2

`scripts/run_state.py` is a reporting consistency helper. It does not run a browser, authenticate evidence, infer omitted scenarios, or edit application source. Version 2 implements the October 20 r2 contract. Treat validation success as a statement about submitted records, never device certification.

## Commands

```sh
python scripts/run_state.py init --project /absolute/project --target /checkout --task 'Complete checkout' --output-dir /absolute/artifacts
python scripts/run_state.py init --project /absolute/project --target /checkout --task 'Complete checkout' --mode audit_and_fix --device-dependent-fixes apply_and_hand_off --device-check-budget 6
python scripts/run_state.py check /absolute/run.json
python scripts/run_state.py report /absolute/run.json
python scripts/run_state.py migrate --input /absolute/old-run.json --output /absolute/migrated-run.json
python scripts/run_state.py apply-results --input /absolute/run.json --results /absolute/results.json --output /absolute/updated-run.json
```

Defaults: `mode=audit_only`, `device_dependent_fixes=propose_only`, `device_check_budget=10`. Explicit old CLI aliases `audit` and `run` mean `audit_only` and `audit_and_fix`; an unqualified invocation still defaults to audit only. `verify` prohibits source edits. `migrate` does not grant new editing authorization. It saves the original ledger and marks unsupported legacy verification unestablished. Output paths for migration/results must be new, preserving the input.

`check` and `report` return 0 for complete submitted records, 3 for valid incomplete records, 2 for invalid records. `init`, `migrate`, and `apply-results` return 0 on successful output creation; inspect their returned assessment for gaps. `report` writes `report.md` and `summary.json` beside the ledger. No command edits application files.

## Top-level records

- `schema_version: 2`, `skill_version: "2.0.1"`, `contract_revision: "2026-10-20-r2"`, run ID, project, target, principal task, revisions, mode, device policy, budget. Version 2.0.1 adds optional independent regression records; existing target-scoped plans keep their legacy representation and validation behavior.
- `capabilities`: objects with `id`, `environment`, `driver` (`agent` or `person`), `status` (`available`, `unavailable`, `declared`, `not_checked`), `evidence`, `reason`. Available requires actual probe evidence; a person's promised device is declared until a reported execution. Environment is one of `static_review`, `automated_test`, `desktop_emulation`, `os_simulator`, `physical_device`, `field_data`.
- `builds`: objects with `id`, `description`, `contains_fixes` (finding IDs), and `substitutions`.
- `standing_substitutions`: objects with `id`, `environments` and `build_ids` (explicit scopes; `*` means all), plus substitution fields below. Never scope a local harness stub to the phone.
- `modules`: seven orchestration records (`id`, `name`, `status`, evidence/reason).
- `coverage`: ten master-area records (`id`, `name`, `disposition`, `check_ids`, `finding_ids`, `remaining`, `reason`). Dispositions: `defects_found`, `no_defect_found`, `not_applicable`, `not_tested`. Checked hypotheses or recommendations alone do not establish defects. `no_defect_found` requires an executed relevant check.
- `phases`, `impeccable`, `launch`, `cleanup`, `commands`, `changes`, `limitations`, `next_steps`, `history`: retain process provenance. Only current source edits enter `changes`; earlier applied fixes can still be checked in audit/verify modes.
- `device_script`: ordered check-ID list, at most the budget. `beyond_budget`: titles of unscheduled checks. Reserved priority and capacity apply only to applied device-dependent fixes.
- `application_basis`: the validated pre-results ledger, captured once by the updater when this run applied device-dependent fixes. It preserves the original authorization, complete entry plan and budget admission. Results may fail or lack build confirmation without retroactively invalidating that admission. The updater cannot change its source edits, applied-fix specification, original scope, policy or budget. Invalid original plans remain invalid; current failures and missing verification still remain gaps. This snapshot is not new implementation authorization.

## Substitutions

A substitution record has `status` (`none_checked`, `known`, `unknown`, `not_reported`), `items`, `unknown_boundaries`, `evidence`, and `reason`. `none_checked` requires evidence establishing absence. Each known item has `boundary`, `description`, `behavior` (`replaced` or `passthrough`), `configured_response`, `real_components`, and `untested`. Unknown boundaries name what is unknown; `*` means unspecified wiring. Actual offline state belongs in conditions, not a replacement item.

Checks store `substitutions: {build: {...}, setup: {...}, additional: {...}}`. Device results use only those declared build/setup records and explicit additions. All checks inherit the named build’s authoritative substitutions; agent checks also inherit applicable standing records. A per-check `none_checked` cannot erase unknown or substituted named-build wiring. Only a `build_substitution_override: {reason, evidence}` recording a newly established wiring difference can replace that baseline; the updater accepts this field only as an explicit reported fact. Build/setup confirmations remain separate: confirming an unknown retains unknown; an unconfirmed portion becomes `not_reported`. `depends_on` on a finding lists real boundaries its claim requires. Unknown/replaced matching boundaries block verification; unrelated geometry with an empty dependency list can retain target evidence.

## Findings and checks

A finding has stable `id` (`F-01`; preserve existing alphanumeric IDs such as `F-05A`), module, area IDs, title, location, severity, `evidence_class`, `status`, expected/actual, reproduction, cause, evidence, and `determinism` (`deterministic`, `intermittent`, `unknown`). Evidence classes: `observed`, `code_supported`, `recommendation`, `hypothesis`. Statuses: `open`, `implemented`, `verified`, `deferred`, `blocked`, `not_an_issue`. Deferred/blocked require `status_assigned_by: "user"` or `"supplied_audit"` and reason.

`affects` holds the original scope objects: `{id, conditions}`. Conditions name `build_id`, `browser`, `device`, `state`, `account_data`, `setup`, `steps` (list), `timing`, and `substitutions` (a comparable description/fingerprint). Add OS/version/viewport/display mode where relevant. `refuted_scopes` records only qualifying contrary-evidence scope IDs; original affected scope and evidence remain traceable. `depends_on` lists real boundaries; `independent_requirement` flags a separately established source/accessibility requirement.

`fix` contains `applied` (boolean), `device_dependent` (boolean), `build_id`, `evidence`, `required_check_ids`, and `applied_before_run` when appropriate. `verification_ids` link checks. `contrary_evidence` stores scope IDs, check IDs, immutable qualifying `check_snapshot` records, evidence-based explanations and the reported refutation facts. Observed evidence needs structured provenance (`ref`, `level`, `observation`, `scope_ids`); unclassified Observed evidence is conservatively treated as possibly target-level when considering closure. An edit alone is implemented. Verified requires an applied fix, its build containing that fix, and target passes covering every unresolved scope without a relevant substituted/unknown dependency.

A check has stable `id` (`C-01`; existing alphanumeric IDs are valid), module, `required`, scenario, expected, actual, evidence, reason, status (`pass`, `fail`, `not_run`, `partial`, `not_applicable`), environment, driver, `evidence_type`, level, behavior, capability ID, build ID, one `configuration` object (browser/device/OS/version), `conditions`, `depends_on`, substitutions, `covers: [{finding_id, scope_id}]`, and optional `scope_results` with the same IDs plus status/actual/evidence. A script entry also has setup and ordered steps. Different scenario or build needs a new ID with `replaces_check_id`; history keeps the old entry. `superseded_by` can retire a failed baseline only when the replacement is a valid passing fix check for the same covered finding/scope/configuration.

Acquisition mapping: static review → `static`; automated test → `automated`; desktop emulation and OS simulator → `emulation`; physical device → `physical_device`; field data → `automated` (API) or `manual` (dashboard/export). Field checks retain `field_data: {source, collection_window, scope, populations, metrics}`. A finding verified by field data also needs `metric_claim: {scope, populations, metrics}`; the check must cover that URL/origin scope, every claimed metric and the claimed browser populations. Level remains separate. Simulator target is allowed for browser UI, rendering, safe areas, software keyboard and focus zoom; performance, touch feel and hardware remain proxy. Desktop emulation cannot be target.

## Independent device regression plans

Original `affects` and `covers` describe the observed or claimed finding scope. A mechanism/proxy observation on a desktop is not a phone observation. For a device-dependent fix, `fix.device_regressions` can declare the separate target regressions that protect that fix without changing the original scope or evidence. This is an optional schema-2 extension; do not add it to bypass a genuinely target-observed or unclassified original scope.

Each requirement has a stable `id`, nonempty `source_scope_ids` referring to original Affects, `environment` (`physical_device` or a supported `os_simulator` behavior), `behavior`, `expected`, complete `conditions`, and `depends_on`. Every referenced source scope must have explicit structured evidence whose relevant levels are mechanism/proxy and whose observations are recorded. Target or unclassified origin evidence retains the original scope gate. Each active non-target origin needs a requirement, and every requirement needs a linked required check. The helper cannot infer omitted regressions; compare the complete plan with the actual fix before admission.

The following fields are excerpts of a finding's fix and its matching check, not a complete ledger. Keep the original desktop `affects` and evidence unchanged.

```json
{
  "fix": {
    "applied": true,
    "device_dependent": true,
    "build_id": "B-local-fixed",
    "evidence": ["local diff and proxy trace"],
    "required_check_ids": ["C-PHONE"],
    "device_regressions": [{
      "id": "DR-KEYBOARD",
      "source_scope_ids": ["desktop-proxy"],
      "environment": "physical_device",
      "behavior": "software_keyboard",
      "expected": "Main focus preserves reading scroll; actual fields remain reachable",
      "conditions": {
        "build_id": "B-phone-fixed",
        "browser": "Safari",
        "device": "iPhone",
        "state": "portrait; keyboard open then closed",
        "account_data": "isolated test account A",
        "setup": "confirm the isolated backend and record build/setup wiring",
        "steps": ["Scroll Today", "Focus main", "Focus the final field", "Close the keyboard"],
        "timing": "after each focus and viewport transition settles",
        "substitutions": "unknown until independently inspected"
      },
      "depends_on": []
    }]
  },
  "check_links": {
    "covers": [],
    "regression_covers": [{"finding_id": "F-02", "regression_id": "DR-KEYBOARD"}]
  }
}
```

`B-phone-fixed` must be a named build whose `contains_fixes` includes F-02. It may differ from `fix.build_id`; this does not prove it was provisioned or executed. Its actual wiring may remain unknown. The linked check must match the requirement's environment, behavior, build, browser/device configuration, and every condition. A runnable available agent target needs no human slot; otherwise the matching person entry must be in the script. Applied entries retain their original authorization, complete union, reserved priority and `floor(budget / 2)` cap. Shared entries count once, with independently reportable portions. A missing, wrong-configuration or over-budget plan remains invalid.

`check.regression_covers` is independent of `covers`. Never place a phone regression in original desktop scope coverage. One entry can cover several requirements in one browser/device configuration. If their states or steps differ, add `regression_conditions: [{finding_id, regression_id, conditions}]` planned snapshots. Each snapshot must match its requirement, with unique in-plan IDs; otherwise the check's common `conditions` supplies the planned set. These snapshots support planning only. They cannot override actual reported conditions or qualify a result.

Browser/device families such as Safari/iPhone can describe a future configuration when that is the intended support scope; require the tester to report the actual model, OS/browser versions and viewport. If a particular version/model/width/display is needed to exercise the regression or the support matrix, include it in the requirement's conditions and steps before admission; do not invent it or drop it because it is unavailable. Unprovisioned builds and declared/unavailable human capabilities may have reserved entries, but remain explicit execution prerequisites and unrun limitations. Missing evidence needed to establish the repair itself still requires a proposal. A locally applied fix also always needs its genuine edit evidence; excerpts do not excuse an empty `fix.evidence` in a submitted ledger.

`check.regression_results: [{finding_id, regression_id, status, actual, evidence, conditions}]` holds actual independent outcomes. Status per portion is `pass`, `fail` or `not_run`; the containing check can be `partial`. A qualified regression pass needs actual/evidence, an available target capability, matching actual conditions and configuration, a confirmed fixed build for a person, and no relevant unknown/replaced finding or requirement dependency. Requirements and results remain in the report even when unrun. The summary's `device_regressions` lists each requirement's qualified state: `pass`, `fail`, `not_run` or `unestablished`. A supplied but unqualified pass is unestablished. Regression results do not automatically change original evidence, `verification_ids`, refutations, finding status or baseline supersession. Original-scope verification still uses its original gate.

`application_basis` freezes the complete independent fix specification and original admission when results are first applied. Results cannot repair an invalid admission, rewrite requirements, or authorize a new fix. Do not fabricate this snapshot or use `applied_before_run` to erase a planning error.

## Results-only input

```json
{
  "results": [{
    "check_id": "C-01",
    "status": "pass",
    "actual": "CTA stayed visible in portrait",
    "evidence": ["tester: screenshot-01"],
    "build_id": "preview-fixed",
    "build_confirmed": true,
    "setup_confirmed": true,
    "conditions_confirmed": true,
    "scope_results": [{"finding_id": "F-01", "scope_id": "portrait", "status": "pass", "actual": "CTA visible", "evidence": ["tester: screenshot-01"]}],
    "notes": "Landscape was not tested"
  }]
}
```

Only use `conditions_confirmed: true` when the tester explicitly confirmed all planned reproduction conditions (including steps, timing and account/data). Build/setup confirmation alone does not establish this. Supply actual `conditions` instead when different. A per-portion confirmation can confirm that requirement's planned conditions. Planned snapshots alone do not confirm anything.

Per-portion `conditions` and `conditions_confirmed` are alternative input forms: give the actual condition object, or confirm that portion's entire planned condition set. `apply-results` normalizes a genuine confirmation to stored `conditions`. If actual conditions differ, report those actual conditions; confirmation cannot overwrite them. Stored planned `regression_conditions` is separate from both forms.

For a check with one total scope/regression portion, the overall pass/fail can supply the omitted portion. Count original scopes and independent regressions together. With multiple total portions give explicit `scope_results` and/or `regression_results`, or a whole pass/fail with `all_steps_confirmed: true`. A whole `partial` result never becomes an individual portion status. An explicit empty regression-results array reports no portions; it does not inherit an aggregate pass. Empty scope-results arrays follow that rule on checks with independent regression links; pure legacy checks retain their older fallback for compatibility. Malformed, duplicate and out-of-plan regression results are invalid. Never-reported portions remain not run. Complementary updates retain earlier clear portions only when build, configuration, conditions and substitutions are unchanged and confirmed; explicit partial results take precedence over a generic all-steps flag. A differing build requires a new check ID through `new_check_id`, retaining the old entry.

For an independent result use, for example, `regression_results: [{"finding_id": "F-02", "regression_id": "DR-KEYBOARD", "status": "pass", "actual": "Field stayed visible in the reported portrait state", "evidence": ["tester: portrait screenshot"], "conditions_confirmed": true}]` with top-level status `partial` when another portion is missing. Leave each missing state unrun. A recorded failed portion makes verification failed even when the containing check is partial.

Results may name `relation`: `defect_reproduced`, `prediction_contradicted`, `cause_only`, or `unrelated`; do not infer that every failure reproduces the finding. `cause_only` may supply `cause` but cannot change disposition. Refutation of an earlier target-observed failure needs `contrary_explanation` and `explains_prior_observation: true` supported by reported evidence. Intermittent/unknown claims additionally need `pass_count`, `causal_explanation`, and `mechanism_ruled_out: true`. An independent requirement needs its own `requirement_refutation`. Passing observations alone do not invent any of these facts.

Valid existing F/C IDs survive migration; collision-safe mappings for older IDs are recorded in `migration_ids`. The original project identity survives even if its directory is unavailable. The updater retains raw reported results in history, preserves finding IDs/evidence, applies only justified transitions, refreshes coverage and the remaining script, and leaves missing conditions/questions explicit. It never re-audits source or converts an unfixed pass into Verified.

## Mechanical verification

Run `python -m unittest discover -s tests -p test_run_state.py -v` from this skill directory. The tests use synthetic evidence and CLI fixtures; they do not establish agent, application, field, or physical-device behavior.
