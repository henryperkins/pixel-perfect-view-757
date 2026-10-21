# Pattern ledger revalidation

The new ledger is valid but incomplete under the local, unpublished runner 2.0.1 candidate. `report` returns exit **3**, with **zero validation errors** and a **proxy** verification ceiling. The installed 2.0.0 runner is unchanged.

F-02's observed scope remains `webkit-mouse-390`: Playwright WebKit 26.6 on a Linux desktop host with mobile viewport/touch media emulation. Its original conditions and evidence have not been changed. The local fix build remains `B-F02-GUARD`. The independent phone regression build remains the unprovisioned `B-PHONE-GUARD`, with unknown wiring.

The fix now declares five independent requirements, linked through `regression_covers` rather than original-scope `covers`:

| Requirement | Existing check | Planned configuration | Actual outcome |
| --- | --- | --- | --- |
| DR-F02-SAFARI-COMPACT | C-GD01 | Safari / iPhone / Compact tabs | not_run |
| DR-F02-SAFARI-BOTTOM | C-GD02 | Safari / iPhone / Bottom tabs | not_run |
| DR-F02-SAFARI-TOP | C-GD03 | Safari / iPhone / Top tabs | not_run |
| DR-F02-ANDROID | C-GD04 | Chrome / Android phone / gesture navigation | not_run |
| DR-F02-SAFARI-POINTER | C-GD10 | Safari / iPhone with external pointer | not_run |

These five distinct entries occupy the unchanged reservation of `floor(10 / 2) = 5`. The existing ten-entry script retains its corrected order; the other five entries remain broader audit follow-ups. No browser, device, state, step, setup, substitution, build identity or requested scenario was removed to fit the gate.

All **10 current physical checks** and **20 earlier physical plans** remain `not_run`, with empty actual results and evidence. Target level in those entries describes planned acquisition only. It does not establish hardware, Safari, keyboard, browser chrome, safe-area, gesture or assistive-technology verification. There was no new runtime or physical-device execution in this continuation.

F-01, F-02 and F-03 remain **implemented**, with no promotion to Verified. The summary still reports `verification: failed` because the original failed checks are retained and have no qualifying target supersession. This is preserved historical evidence, not a newly observed app regression. The original installed-helper planning failure is also preserved in the unchanged earlier artifacts and the new ledger's history; the new model does not retroactively make that earlier validation pass.

Preservation assertions compare all finding Affects/evidence/status/verification IDs, all executed check records, every check's status/actual/evidence, original scope, policy, budget, builds, capabilities, substitutions, command records and source-change records with the previous corrected ledger. F-01 and F-03 are identical in full. The five planned checks gain regression links and planning annotations only. No `applied_before_run` escape or fabricated `application_basis` was added.

Use [run.json](run.json) as the copied machine record, [summary.json](summary.json) for the actual assessment and [report.md](report.md) for the generated full report. [adapt-pattern-ledger.py](../adapt-pattern-ledger.py) contains the transformation and preservation assertions. Original records remain under `output/playwright/mobile-ux-ledger-review-20261021/20261021T001940Z/` in the unchanged app checkout.

The only source edits in this continuation are in the separate local runner authoring copy. No application file, installed plugin, commit, push, deployment or release was changed.
