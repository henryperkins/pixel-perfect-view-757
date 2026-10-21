# Independent planning-model review

**Final code disposition: ready for the remaining authorized documentation and copied-ledger work; no unresolved important code findings at the 115-test candidate identified below.** Initial findings and intermediate results are retained here as review history, with the final re-review at the end.

Reviewed the initial candidate containing 104 passing `test_run_state.py` tests against the sibling `before/` baseline. Review was read-only on source, tests, app files, Git state, and plugin caches. Temporary Python fixtures used `PYTHONDONTWRITEBYTECODE=1`. The implementer was notified promptly and began fixes while this report was being prepared; line references below describe the initial 104-test candidate.

Initial reviewed `scripts/run_state.py` SHA-256: `c62de2e30cff06ccc653df34b8fb45e4c25f7610b223febd8b70a2ab9fd2c0a6`. Baseline SHA-256: `8e1665420c2ca1bda910627cd9ec1e684b08999d9cf71fc9c46cf553b5863a33`. Initial complete probe output is saved in `independent-probes-initial.txt`.

## Strengths

- Original observed scope and independent device regression requirements have separate IDs and matching functions.
- Independent requirements require explicit mechanism/proxy provenance, complete conditions, a named build containing the fix, and an admissible physical-device or simulator behavior.
- Passing a regression alone does not feed `verification_ids`, contrary-evidence records, or original-scope disposition changes.
- The application-basis snapshot keeps failed or build-unconfirmed results recordable while retaining the original admission check.
- Tests cover permission, budget, priority, distinct entry counting, missing requirements, hardware/simulator distinctions, source preservation, and invalid admission laundering.

## Important issues

### 1. An agent check covering an original scope skips every independent regression on the same entry

File: `scripts/run_state.py:750-758`, particularly the `continue` at line 753.

When a required entry covers both an original target scope and an independent device regression, the runnable-agent branch for the original scope continues the outer required-check loop. It never evaluates `planned_regressions`. The final requirement-link check establishes only that a link exists.

Reproduction based on `proxy_device_fix()`:

1. Add an explicitly target-observed original scope with Safari/iPhone portrait conditions.
2. Make `C-01` an available agent-driven physical-device check covering that scope, with `B-2` and its matching portrait conditions.
3. Keep its link to `DR-1`, which requires `B-phone` and `phone-state-0`.
4. Clear the human script.

Observed: `planned_regression_matches(...) == False`, but `assess(...)["errors"] == []` and `applied_device_entries == []`. The fix is admitted without a runnable or reserved entry satisfying its independent requirement.

Minimal fix: let the runnable original-scope branch finish that portion without continuing past the independent regression loop. Add a mixed-origin finding test that rejects a mismatching linked agent check and accepts the fully matching counterpart.

### 2. Partial regression failures do not make overall verification failed

File: `scripts/run_state.py:832-839`.

The overall failure classification reads only `scope_results` or the aggregate check status. A regression-only check with one failed portion and one missing portion has aggregate status `partial`; the recorded regression failure is omitted from failure detection.

Reproduction: give one entry two device regression links, then apply a `partial` report containing only `DR-1: fail`. `apply_results` correctly retains `DR-1: fail` and creates `DR-2: not_run`. `assess` returns no errors, reports the requirement as failed, but returns overall `verification: incomplete` instead of `failed`.

Minimal fix: include both scope and regression portion statuses when identifying active failures and required incomplete checks. Add a regression-only mixed-result test and a mixed scope/regression failure test.

### 3. Malformed regression results are ignored and can fall back to an aggregate pass

File: `scripts/run_state.py:278-285` and `787-797`.

`assess` passes `regression_results` through `objects()` without validating its raw shape. Invalid values disappear. For one linked requirement, `regression_outcome_for` then falls back to the whole check, turning an invalid result record into a qualified pass.

Reproduction: create a valid single-regression result using `apply_results(proxy_device_fix(), result())`, then set `checks[1]["regression_results"] = ["not a result"]`. Observed: `errors == []` and `device_regressions[0]["status"] == "pass"`. A non-list value is also silently ignored.

Minimal fix: validate present result containers as lists containing only objects, and allow whole-check compatibility fallback only when the field is absent, not malformed or explicitly empty. Add tests for non-list, non-object member, and explicit empty values.

### 4. Scope and regression families independently inherit aggregate statuses, fabricating missing portions

File: `scripts/run_state.py:955-966` and `991-1007`.

Each family uses its own number of links to decide whether to spread the aggregate result. A check with one original scope and one independent regression has two independently reportable portions, yet both branches treat it as a single-portion check. An explicit report in one family does not prevent the other family from inheriting the whole-check status.

Confirmed cases on an initially valid mixed check:

- An aggregate `pass` with explicit `scope_results` only, whose reported conditions contain `state: other-state`, creates a `DR-1: pass` with the planned regression conditions. No regression result or `all_steps_confirmed` was supplied. The original scope result itself does not match the regression state.
- An explicit `regression_results: []` on a single-regression aggregate pass is treated exactly like an omitted field and creates a pass.
- A `partial` report with only an explicit regression pass creates an unreported original-scope portion with status `partial`, which `assess` rejects as an invalid portion status.
- The mirror `partial` report with only a scope pass creates an unreported regression portion with status `partial`, also rejected.

Minimal fix: evaluate the complete number of independently reportable scope plus regression portions together; distinguish field omission from explicit empty reports; use `not_run` for omitted portions unless a clear all-steps confirmation authorizes a whole-check result. Keep valid single-family/single-link compatibility. Add both directions of mixed partial reporting and an aggregate pass with explicit mismatching scope-only results.

## Recommendations requiring an explicit model decision

A shared entry cannot currently plan independent regressions with different states/steps: `planned_regression_matches` compares every requirement to the one `check.conditions`, ignoring per-regression planned conditions. A portrait-plus-landscape entry is rejected even if `regression_results` contains explicit `not_run` rows with each requirement's complete conditions. The active contract permits state transitions within a script entry (`references/evidence-contract.md:95`), and separate condition states have existing scoped-result precedent.

Either support separately planned portions on a shared browser/device entry or document a deliberate one-condition-set-per-entry limit. A useful test is a portrait/landscape shared entry where only portrait is later reported; landscape must remain unrun, with its own conditions and original admission intact. Separate-entry requirements with distinct conditions were also probed and do not exhibit this shared-entry admission problem.

## Declined to judge

- Application UI, mobile runtime behavior, real-device behavior, production wiring, deployment, and publication: expressly outside this review's authorized scope.
- Pending schema/workflow/reporting prose and Pattern ledger adaptation: the implementer identified these as not yet finished when review began.
- Authenticity of evidence references or arbitrary synchronized edits to both a ledger and its historical snapshot: the helper explicitly validates declarations rather than authenticating evidence.
- Whether every condition set should require its own entry: recorded above as a model decision; the current shared-entry limitation was not silently classified as an admission bypass.

## Validation and assessment

`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_run_state.py'` passed: 104 tests, 0 failures. Independent fixture probes confirmed all four issue categories above despite that green suite. Reproduction code is in `review-probes.py` beside this report.

Ready to integrate: **with fixes**. The separate scope/regression design is sound, but the mixed-entry admission bypass and status fallbacks allow records to claim coverage that their supplied portions do not establish. Re-review the updated candidate after the added regression tests pass.

## Re-review of the 114-test candidate

Helper SHA-256: `02022f3f37a0ef6fb2c4388090049233850b69cbafa3a20039dd8a122c1099e1`.
Tests SHA-256: `06623c1d1d6008254429e6a544d1688f1bce0f9c86b42085bc3451fef8d4b901`.

The full 114-test suite passed independently. Re-running the initial probes confirmed fixes for all four initial issue categories. Grouped state transitions are now supported through `check.regression_conditions` plan snapshots, while `pass_for_regression` compares actual reported conditions directly. Extra probes established:

- A mixed raw aggregate without portion records qualifies neither family; an explicit record in one family qualifies only that family.
- Portrait-only results qualify portrait and retain landscape as unrun and scripted. A later landscape result preserves the clear portrait pass, original source evidence, and the exact application basis; the script clears only after both qualify.
- Explicit wrong-state results and omitted condition confirmations stay unestablished even when the planned snapshots are correct.
- Explicit empty regression reports create unrun portions rather than inheriting aggregate passes, and malformed regression result containers are rejected.

Evidence: `independent-probes-rereview.txt` and `independent-fixed-extra-probes.txt`.

One remaining compatibility issue was reported to the implementer: pure legacy checks without regression links now interpret `scope_results: []` differently from the baseline (`outcome_for`, helper lines 130-137; whole-pass validation near line 594). A baseline-valid verified fixture with that empty array previously has no errors and is complete; the 114-test candidate rejects both the aggregate pass and verified finding. A pure legacy single-scope `apply_results` payload containing `scope_results: []` likewise changes from aggregate pass to unrun. The requested legacy target-scoped behavior should be preserved unless this format change is explicitly intended. Minimal regression tests should compare both an existing aggregate legacy record and the corresponding empty-array results payload against baseline semantics, while retaining strict empty-array handling on mixed/new-regression checks.

Re-review disposition at this candidate: **four original categories resolved; legacy compatibility clarification/fix outstanding**.

## Final code re-review

Helper SHA-256: `98c4001bc9af594662dad09cbfcade491b8d0e35dac704fb1035d8eb53149696`.
Tests SHA-256: `f0fbd9eb8f93e0db7f2bb664d8eac29c67fc6e0fcf46941f97818ef6136390a2`.

Independently ran the full suite: **115 tests passed**. Inspected the compatibility fix and used direct assertions comparing the baseline helper against the final helper. A pure legacy verified record containing `scope_results: []` remains valid and complete. A pure legacy single-scope empty-array result payload still produces the prior aggregate pass and warranted original-finding disposition. Explicit empty regression results remain unrun, and explicit empty original-scope results on a mixed check remain unrun. These comparisons passed and are recorded in `independent-final-compatibility.txt`.

All four initial finding categories are resolved. The shared-state model limitation is resolved through distinct planned regression snapshots, with actual results qualified separately. The pure-legacy empty-array compatibility issue is also resolved. No remaining Critical or Important code finding was identified within the reviewed helper/tests scope.

**Ready to integrate the reviewed code: yes.** This conclusion covers the exact helper/tests hashes above and the supplied declarative-ledger behavior. It does not establish completion of the separately pending documentation, Pattern ledger adaptation, application behavior, device qualification, or any release/publication stage.
