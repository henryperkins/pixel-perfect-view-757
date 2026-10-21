# Pattern mobile pilot and runner planning handoff

The runner planning fix and copied Pattern ledger are stored in this private repository under the user's later authorization to commit and push both the app fixes and runner work. The runner remains an uninstalled, unpublished 2.0.1 candidate. The source is in [tools/mobile-web-ux-runner](../../../../../tools/mobile-web-ux-runner/); no installed plugin or plugin release was changed.

The runner now separates the original proxy observation from a fix's independent device regression requirements. `fix.device_regressions` defines those requirements; `regression_covers` links them to checks; `regression_conditions` stores planned states; `regression_results` records actual outcomes. Original finding `affects`, evidence and `covers` retain their meaning. Phone regression passes do not automatically verify or refute the original desktop observation. Legacy target-scoped plans, authorization, complete planning, dependency limits and entry-budget safeguards are retained.

## Ledger and evidence

[run.json](run.json), [summary.json](summary.json) and [report.md](report.md) are exact copies of the reviewed records. The ledger is valid but incomplete: validation exits **3**, errors are empty, the achieved ceiling is **proxy**, and `claimable_complete` is false. All three findings remain **implemented**. Recorded verification remains failed because historical failed checks have not been superseded by qualifying target evidence; it does not describe a newly observed app regression.

The five F-02 device regression requirements use C-GD01, C-GD02, C-GD03, C-GD04 and C-GD10. They occupy the first five entries of the unchanged ten-entry script and all five reserved slots. All **10 current physical checks** and **20 earlier physical plans** remain **not_run**, with blank actuals and empty evidence. The phone build and backend remain unprovisioned with unknown wiring. Planned target acquisition is separate from achieved evidence.

All **69 executed checks**, all **99 check IDs**, and the original scope/evidence of all three findings are preserved. The original F-02 scope remains Playwright WebKit on a Linux desktop with mobile viewport emulation; it has not been renamed Safari or made into a physical-device observation. The [independent ledger review](validation/pattern-ledger-review.md) verifies those invariants.

The raw records intentionally retain their original absolute paths and historical statements about the earlier local-only/no-commit stages. This commit is a later preservation step; it does not rewrite those records. [evidence-manifest.json](evidence-manifest.json) maps original paths to the 225 exact copied evidence files under [evidence/](evidence/), with SHA-256 hashes. Generated Vite dependency caches are omitted from Git and listed in the manifest; their original local copies are preserved. [publication-provenance.json](publication-provenance.json) maps the authoring source and copied ledger to this repository.

## Validation

The helper suite passes **115 tests**, including the original 86 and 29 new regression tests. Twelve focused CLI checks cover default initialization, valid incomplete and complete records, partial reports, malformed/out-of-plan input, overwrite refusal and input preservation. The [independent code review](validation/independent-review.md) records the initial findings and their corrections. The historical 49-case agent suite was not rerun; its execution record is preserved without claiming new coverage. Focused documentation control/candidate scenarios are saved separately.

Fresh app and runner checks performed on the current remote base before publication are saved under [publication-validation/](publication-validation/). They use synthetic services for browser behavior. They do not establish real backend persistence, production behavior or physical-device verification. The original ledger is not promoted using these checks.

From the repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tools/mobile-web-ux-runner/skills/mobile-web-ux-runner/tests -p test_run_state.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/mobile-web-ux-runner/skills/mobile-web-ux-runner/scripts/run_state.py check docs/reviews/mobile-ux-pilot/2026-10-21/runner-planning/run.json
```

The second command should return **3** for this intentionally incomplete ledger. A passing helper check only validates submitted records; it does not authenticate evidence, execute the app or supply a device.
