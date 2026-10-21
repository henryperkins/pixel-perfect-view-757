# Documentation application candidate

This is a documentation-only application of the supplied synthetic scenario. No browser, device, app edit, helper invocation, cache update, Git operation or release was performed. The JSON below consists of field/link excerpts, not a replacement full ledger. All planned checks retain blank actuals, empty evidence and `not_run`. The later partial-results example is explicitly hypothetical and must not be applied as a real report.

The source is the current `SKILL.md` and its `workflow.md`, `evidence-contract.md`, `ledger-schema.md` and `reporting.md` references. I did not read the previous version, scripts/tests, or another agent's output.

The admissible representation is an applied local fix with independent reserved phone regressions. Preserve F-01's existing `affects` and structured evidence exactly: scope ID `proxy-mouse`, original Playwright WebKit/Linux/mouse/390 CSS px conditions, `evidence_class: observed`, structured `level: proxy` provenance, and `determinism: intermittent`. Do not replace the original record with a Safari/iPhone record, copy its failure onto the phone, or manufacture missing original conditions. The original full conditions/evidence were not supplied here, so I do not reconstruct them.

The literal existing route, field identities, source evidence and original dependency list remain the audit's authorities. The phone setup below is a future test requirement rather than an assertion that an account, endpoint or supported phone has been provisioned. Its 390 CSS px portrait width is a planned narrow regression condition; it is not a claim that the desktop observation happened on a phone. If a supported actual iPhone cannot supply that condition, retain the portion as unrun rather than substituting a desktop resize. No model or version has been invented; the tester must report the actual configuration. See the documentation qualification concerning configuration specificity at the end.

The run already has the supplied `audit_and_fix` / `apply_and_hand_off` authorization and budget 6. Preserve the authoritative `buildB-local` build record with `contains_fixes` including F-01 and its existing substitutions; do not overwrite its wiring. Add the separately named planned phone build and declared capability as follows:

```json
{
  "mode": "audit_and_fix",
  "device_dependent_fixes": "apply_and_hand_off",
  "device_check_budget": 6,
  "builds": [
    {
      "id": "buildB-phone",
      "description": "Unprovisioned planned phone build declaring F-01; neither reachable nor executed yet",
      "contains_fixes": [
        "F-01"
      ],
      "substitutions": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "*"
        ],
        "evidence": [],
        "reason": "Phone build wiring has not been inspected"
      }
    }
  ],
  "capabilities": [
    {
      "id": "CAP-PHONE",
      "environment": "physical_device",
      "driver": "person",
      "status": "declared",
      "evidence": [],
      "reason": "Future human Safari/iPhone checks are planned; no reported execution or capability probe"
    }
  ],
  "device_script": [
    "C-PHONE-P",
    "C-PHONE-L"
  ]
}
```

The `builds` and `capabilities` arrays here are additions/excerpts, not instructions to delete existing records. A promised device is declared, not available. If actual lack of human access is known, record `CAP-PHONE.status: unavailable` with that reason instead of pretending availability.

Inside the existing F-01 record, the fix excerpt is:

```json
{
  "fix": {
    "applied": true,
    "device_dependent": true,
    "build_id": "buildB-local",
    "evidence": [],
    "required_check_ids": [
      "C-PHONE-P",
      "C-PHONE-L"
    ],
    "device_regressions": [
      {
        "id": "DR-KEYBOARD-PORTRAIT",
        "source_scope_ids": [
          "proxy-mouse"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "The actual focused field remains visible or reachable without losing focus; keyboard open/close preserves usable scrolling and access to the required adjacent action.",
        "conditions": {
          "build_id": "buildB-phone",
          "browser": "Safari",
          "device": "iPhone",
          "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
          "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
          "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
          "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
          "state": "portrait; first field then final field; software keyboard open, closed and reopened; default text size",
          "steps": [
            "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
            "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
            "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
            "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
          ],
          "viewport": "Required 390 CSS px portrait layout width on a supported iPhone; record actual layout and visual viewport, including keyboard-open height"
        },
        "depends_on": []
      },
      {
        "id": "DR-KEYBOARD-LANDSCAPE",
        "source_scope_ids": [
          "proxy-mouse"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "The actual focused field remains visible or reachable without losing focus; keyboard open/close preserves usable scrolling and access to the required adjacent action.",
        "conditions": {
          "build_id": "buildB-phone",
          "browser": "Safari",
          "device": "iPhone",
          "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
          "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
          "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
          "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
          "state": "landscape on the same supported iPhone configuration; first field then final field; software keyboard open, closed and reopened; default text size",
          "steps": [
            "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
            "Focus the first relevant form field and open the software keyboard.",
            "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
            "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
          ],
          "viewport": "Short landscape viewport of the same supported iPhone whose portrait layout width is 390 CSS px; record actual layout and visual viewport, including keyboard-open height"
        },
        "depends_on": []
      }
    ]
  }
}
```

`applied: true` models the supplied synthetic local-fix state; this exercise applied nothing. Empty fix evidence means this response supplies no inspected diff evidence. Retain any existing genuine fix evidence in the actual ledger instead of clearing it. Do not set `applied_before_run` to escape admission.

Each requirement includes all nine named condition fields: `build_id`, `browser`, `device`, `state`, `account_data`, `setup`, `steps`, `timing` and `substitutions`. The relevant narrow viewport is also explicit. Requirements use the example-documented `software_keyboard` behavior, physical-device acquisition, and source scope `proxy-mouse`. Their target builds differ from the local fix build by design. For these narrowly defined browser keyboard/focus requirements, `depends_on: []` expresses no claim about real service persistence, payment, submission or delivery. Preserve the original finding's actual `depends_on` list; if inspection reveals a relevant real boundary, declare it rather than deleting it to qualify a pass.

The two check excerpts carry exact copies of their requirement conditions and have independent regression links:

```json
{
  "id": "C-PHONE-P",
  "module": 3,
  "required": true,
  "scenario": "Independent F-01 keyboard/focus regression: portrait",
  "expected": "The actual focused field remains visible or reachable without losing focus; keyboard open/close preserves usable scrolling and access to the required adjacent action.",
  "actual": "",
  "evidence": [],
  "reason": "Reserved future human regression; build is unprovisioned and no phone execution has been reported",
  "status": "not_run",
  "environment": "physical_device",
  "driver": "person",
  "evidence_type": "physical_device",
  "level": "target",
  "behavior": "software_keyboard",
  "capability_id": "CAP-PHONE",
  "build_id": "buildB-phone",
  "configuration": {
    "browser": "Safari",
    "device": "iPhone"
  },
  "conditions": {
    "build_id": "buildB-phone",
    "browser": "Safari",
    "device": "iPhone",
    "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
    "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
    "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
    "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
    "state": "portrait; first field then final field; software keyboard open, closed and reopened; default text size",
    "steps": [
      "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
      "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
      "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
      "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
    ],
    "viewport": "Required 390 CSS px portrait layout width on a supported iPhone; record actual layout and visual viewport, including keyboard-open height"
  },
  "depends_on": [],
  "substitutions": {
    "build": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "buildB-phone is a declared future build; its wiring has not been inspected"
    },
    "setup": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "Future human setup has not been inspected"
    },
    "additional": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "No executed check or report establishes its actual additional substitutions"
    }
  },
  "covers": [],
  "regression_covers": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-PORTRAIT"
    }
  ],
  "regression_results": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-PORTRAIT",
      "status": "not_run",
      "actual": "",
      "evidence": []
    }
  ],
  "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
  "steps": [
    "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
    "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
    "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
    "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
  ]
}
```


```json
{
  "id": "C-PHONE-L",
  "module": 3,
  "required": true,
  "scenario": "Independent F-01 keyboard/focus regression: landscape",
  "expected": "The actual focused field remains visible or reachable without losing focus; keyboard open/close preserves usable scrolling and access to the required adjacent action.",
  "actual": "",
  "evidence": [],
  "reason": "Reserved future human regression; build is unprovisioned and no phone execution has been reported",
  "status": "not_run",
  "environment": "physical_device",
  "driver": "person",
  "evidence_type": "physical_device",
  "level": "target",
  "behavior": "software_keyboard",
  "capability_id": "CAP-PHONE",
  "build_id": "buildB-phone",
  "configuration": {
    "browser": "Safari",
    "device": "iPhone"
  },
  "conditions": {
    "build_id": "buildB-phone",
    "browser": "Safari",
    "device": "iPhone",
    "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
    "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
    "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
    "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
    "state": "landscape on the same supported iPhone configuration; first field then final field; software keyboard open, closed and reopened; default text size",
    "steps": [
      "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
      "Focus the first relevant form field and open the software keyboard.",
      "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
      "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
    ],
    "viewport": "Short landscape viewport of the same supported iPhone whose portrait layout width is 390 CSS px; record actual layout and visual viewport, including keyboard-open height"
  },
  "depends_on": [],
  "substitutions": {
    "build": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "buildB-phone is a declared future build; its wiring has not been inspected"
    },
    "setup": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "Future human setup has not been inspected"
    },
    "additional": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "No executed check or report establishes its actual additional substitutions"
    }
  },
  "covers": [],
  "regression_covers": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-LANDSCAPE"
    }
  ],
  "regression_results": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-LANDSCAPE",
      "status": "not_run",
      "actual": "",
      "evidence": []
    }
  ],
  "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
  "steps": [
    "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
    "Focus the first relevant form field and open the software keyboard.",
    "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
    "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
  ]
}
```

No `covers` link points at `proxy-mouse` from either phone check. The relevant links are `regression_covers: [{finding_id: "F-01", regression_id: ...}]`. Existing local checks may retain original-scope `covers` links and their truthful proxy level. The phone checks do not become original-scope `verification_ids`, `refuted_scopes` or `superseded_by` evidence just because their requirements refer back to that source scope.

For handoff, render each check with the build/setup/additional substitution records above, the setup and ordered steps, its expected behavior, and these blank human result prompts:

```text
Result: ___
Build as tested (confirm buildB-phone or identify the difference): ___
Setup as tested (confirm separately or identify the difference): ___
Actual device/model, iOS/Safari versions, viewport, orientation and display mode: ___
Each planned condition/step/timing/account-data confirmed, or actual differences: ___
Notes: ___
Screenshot/recording: ___
```

These are script prose prompts, not new JSON field names. Local harness stubs do not transfer to the phone. A confirmed unknown build/setup record stays unknown; it does not become `none_checked`. Do not perform a write unless the test backend is established.

Budget and the optional shared entry:

- The reserved cap is `floor(6 / 2) = 3` human entries across all applied device-dependent fixes.
- As shown, C-PHONE-P and C-PHONE-L consume two reserved entries, leaving one reserved entry for other applied device-dependent coverage. They also occupy two of the six total script entries.
- Count the complete union across applied fixes before applying another one. A missing check, different configuration, or over-cap union cannot be fixed by narrowing original Affects, dropping a state, or merging independent outcomes.
- If portrait and landscape are genuinely successive states of one actual Safari/browser/device/build/setup configuration, one entry may cover both and consume one reserved slot. It still has two independently reportable requirements. Different actual devices, browser versions, configurations or builds requiring independent executions remain separate entries.

For that last alternative, replace the two entry IDs in `fix.required_check_ids` and `device_script` with only `C-PHONE-PL`, retain both requirements unchanged, and use the following single check instead. Do not schedule both representations and double-count them.

```json
{
  "id": "C-PHONE-PL",
  "module": 3,
  "required": true,
  "scenario": "One Safari/iPhone entry with independently reportable portrait and landscape keyboard/focus transitions",
  "expected": "Meet the portrait requirement, then meet the landscape requirement; report the two portions separately",
  "actual": "",
  "evidence": [],
  "reason": "Reserved future human regression; build is unprovisioned and no phone execution has been reported",
  "status": "not_run",
  "environment": "physical_device",
  "driver": "person",
  "evidence_type": "physical_device",
  "level": "target",
  "behavior": "software_keyboard",
  "capability_id": "CAP-PHONE",
  "build_id": "buildB-phone",
  "configuration": {
    "browser": "Safari",
    "device": "iPhone"
  },
  "conditions": {
    "build_id": "buildB-phone",
    "browser": "Safari",
    "device": "iPhone",
    "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
    "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
    "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
    "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
    "state": "portrait sequence followed by a rotation to landscape sequence; default text size",
    "steps": [
      "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
      "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
      "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
      "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend.",
      "Rotate the same phone to landscape; retain the same build/account/setup.",
      "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
      "Focus the first relevant form field and open the software keyboard.",
      "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
      "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
    ],
    "viewport": "Required 390 CSS px portrait layout width, then the same supported phone's short landscape viewport; record actual layout and visual viewport for both"
  },
  "depends_on": [],
  "substitutions": {
    "build": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "buildB-phone is a declared future build; its wiring has not been inspected"
    },
    "setup": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "Future human setup has not been inspected"
    },
    "additional": {
      "status": "unknown",
      "items": [],
      "unknown_boundaries": [
        "*"
      ],
      "evidence": [],
      "reason": "No executed check or report establishes its actual additional substitutions"
    }
  },
  "covers": [],
  "regression_covers": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-PORTRAIT"
    },
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-LANDSCAPE"
    }
  ],
  "regression_results": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-PORTRAIT",
      "status": "not_run",
      "actual": "",
      "evidence": []
    },
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-LANDSCAPE",
      "status": "not_run",
      "actual": "",
      "evidence": []
    }
  ],
  "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
  "steps": [
    "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
    "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
    "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
    "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend.",
    "Rotate the same phone to landscape; retain the same build/account/setup.",
    "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
    "Focus the first relevant form field and open the software keyboard.",
    "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
    "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
  ],
  "regression_conditions": [
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-PORTRAIT",
      "conditions": {
        "build_id": "buildB-phone",
        "browser": "Safari",
        "device": "iPhone",
        "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
        "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
        "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
        "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
        "state": "portrait; first field then final field; software keyboard open, closed and reopened; default text size",
        "steps": [
          "Open the existing F-01 route using the isolated test fixture in portrait; record actual CSS viewport width and initial focus/scroll.",
          "At a required 390 CSS px portrait layout width on a supported iPhone configuration, focus the first relevant form field and open the software keyboard.",
          "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable.",
          "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
        ],
        "viewport": "Required 390 CSS px portrait layout width on a supported iPhone; record actual layout and visual viewport, including keyboard-open height"
      }
    },
    {
      "finding_id": "F-01",
      "regression_id": "DR-KEYBOARD-LANDSCAPE",
      "conditions": {
        "build_id": "buildB-phone",
        "browser": "Safari",
        "device": "iPhone",
        "account_data": "Planned isolated F-01 test fixture; non-sensitive data only; provision and identify the fixture before execution",
        "setup": "Use the existing F-01 route in buildB-phone after it becomes phone-reachable. Confirm build identity and setup separately. Record actual iPhone model, iOS/Safari versions, display mode, tab layout, text size and CSS viewport. Establish a safe test backend before any step that could write; otherwise stop before that step.",
        "timing": "Check after each focus, keyboard and orientation transition settles; preserve and record any transient loss of focus or visibility",
        "substitutions": "build: unknown wiring; setup: unknown wiring; additional: uninspected; do not inherit local-only harness substitutions",
        "state": "landscape on the same supported iPhone configuration; first field then final field; software keyboard open, closed and reopened; default text size",
        "steps": [
          "Using the same build, isolated fixture and Safari configuration, put the phone in landscape and record actual layout/visual viewport and initial focus/scroll.",
          "Focus the first relevant form field and open the software keyboard.",
          "Move focus to the final relevant field, scroll it into view if needed, and check the focused control and required adjacent action remain reachable in the short viewport.",
          "Close and reopen the software keyboard; record focus, visible field and scroll at every transition. Do not submit or trigger a write without the confirmed test backend."
        ],
        "viewport": "Short landscape viewport of the same supported iPhone whose portrait layout width is 390 CSS px; record actual layout and visual viewport, including keyboard-open height"
      }
    }
  ]
}
```

Here `regression_conditions` contains planned snapshots that match each requirement exactly. It solves the differing state/step plan within one entry. It is not a report of actual portrait or landscape conditions and cannot override the tester's actual conditions.

An example of a future portrait-only partial result for that shared alternative follows. It is illustrative: none of its success, evidence references or confirmation flags was observed or supplied in this task. Submit it only if a real tester explicitly supplies those facts. In particular, a reported execution must establish an available target capability and report the actual device/configuration; the initial declared/unavailable capability does not establish it.

```json
{
  "results": [
    {
      "check_id": "C-PHONE-PL",
      "status": "partial",
      "actual": "Portrait keyboard/focus sequence completed; landscape was not run",
      "evidence": [
        "hypothetical tester report and portrait keyboard/focus recording"
      ],
      "build_id": "buildB-phone",
      "build_confirmed": true,
      "setup_confirmed": true,
      "regression_results": [
        {
          "finding_id": "F-01",
          "regression_id": "DR-KEYBOARD-PORTRAIT",
          "status": "pass",
          "actual": "The focused first and final fields remained reachable through the reported portrait keyboard-open/close/reopen sequence",
          "evidence": [
            "hypothetical tester portrait recording with device/build/setup identification"
          ],
          "conditions_confirmed": true
        }
      ],
      "notes": "Only the portrait planned conditions were explicitly confirmed. Landscape was not run. Unknown build/setup wiring remains unknown."
    }
  ]
}
```

There is no top-level all-conditions or all-steps assertion because landscape was not run. The per-portion `conditions_confirmed: true` asserts only a tester's explicit confirmation of the portrait requirement's entire planned condition set. No landscape result is supplied, so landscape remains `not_run`; its original empty actual/evidence remain empty. An explicit landscape portion with `status: not_run`, blank actual and empty evidence would also make that absence explicit.

For the two-entry representation, the same portrait observation belongs to C-PHONE-P (a one-portion entry, normally `status: pass` if that portion passes), while C-PHONE-L remains `not_run`. The plan as a whole remains incomplete. Do not call a single one-portion entry partial merely to copy a grouped-entry example.

Qualification and the original finding:

- A reported portrait pass qualifies only with actual behavior and evidence, an available executed target capability, matching actual configuration and all relevant conditions, a confirmed fix-containing phone build, and no relevant unknown/replaced dependency of either the finding or requirement. The setup must also be established as reported. Confirming planned unknown wiring retains the unknown; it does not inspect it.
- A missing build confirmation, missing setup/condition report, or unresolved relevant boundary preserves the observation but makes a supplied passing regression `unestablished`, rather than a qualified target pass. Build confirmation alone does not confirm account/data, steps, timing, setup or a second state.
- A portrait result with different actual state/width/steps/timing/setup cannot borrow the planned `regression_conditions` to qualify the intended portion. Preserve the actual report and its narrower/different-state observation; leave intended coverage unestablished or unrun as appropriate. A changed scenario gets a new check ID linked with `replaces_check_id`; a changed build in results uses `new_check_id` and preserves the old entry.
- With multiple total portions, count both `scope_results` and `regression_results`. Use explicit per-portion results or, only for a truthful whole pass/fail, `all_steps_confirmed: true`. A whole `partial` never becomes a portion's status. An explicit empty regression-results array reports no portions and cannot inherit an aggregate pass. Never-reported portions stay not run. An explicitly failed portion remains a failure even when its parent check is partial.
- Even two qualified Safari/iPhone regression passes establish only those protected phone behaviors. Neither the portrait-only report nor the complete phone pair verifies/refutes F-01's original intermittent Linux/Playwright-WebKit/mouse scope. Preserve original evidence, Affects, verification links, refutations and baseline history. The supplied local edit warrants `implemented`, not `verified`, until the original verification gate is met.
- The original is intermittent. A passing local recheck alone also does not erase the observed failure. A claimed refutation needs matching claimed reproduction conditions, pass count, an evidence-backed causal explanation and `mechanism_ruled_out: true`; any independent established requirement needs its own `requirement_refutation`. Safari regression passes do not supply these facts. Do not invent a causal exclusion.
- `level: target` in either planned check denotes intended acquisition. With `status: not_run`, blank actual and empty evidence, it achieves no target observation. The achieved evidence ceiling in this scenario remains the supplied proxy observation; it does not rise because a phone entry or a `contains_fixes` declaration exists.

Admission versus unavailable human access is important here. Under ledger-schema.md's independent-plan rule, an available runnable agent target needs no human slot; otherwise a matching person entry must be reserved in the script. Thus no present human access, an unavailable/declared capability, an unprovisioned phone build or unknown wiring prevents a truthful claim of execution or qualification, but it does not by itself replace the reserved-plan gate with an execution requirement. On that reading, this authorized two-entry plan fits the three-entry cap. Keep the build reachability, supported actual configuration, safe test fixture/backend and human access in open questions/next steps; leave all checks not run. If the needed result is a prerequisite to deciding that the edit itself is safe, rather than a pending regression, the separate rule to propose the conditional diff still applies.

When real results are first applied, the documented updater captures `application_basis` to preserve original authorization, complete requirements, scope and reserved admission. Do not manufacture that snapshot here. A later failed/unconfirmed report can leave verification incomplete without retroactively making a valid admission invalid. It also cannot repair an originally incomplete or over-budget plan.

Documentation ambiguities/conflicts identified from this reading:

1. **Future build versus runnable script.** ledger-schema.md explicitly permits a separate named phone build whose presence “does not prove it was provisioned or executed” and allows reserved person entries (lines 93–99). reporting.md says a fix check “needs a phone-reachable build containing the fix,” while evidence-contract.md requires naming unreachable builds under open questions. The consistent planning interpretation above is “required future build, blocked from execution until reachable,” but the wording could be read as rejecting this unprovisioned script outright. The docs should say explicitly whether reachability is a pre-admission gate or an execution/claim gate.
2. **Unavailable needed result versus handoff.** evidence-contract.md says to propose a fix when it depends on a result one cannot get. The specific independent-regression and apply-and-hand-off rules allow reserved human results. The distinction between a missing result needed to select/safely design a fix and an unexecuted post-fix regression is sensible but not stated in that sentence. I have not silently treated every unavailable regression as a proposal-only condition.
3. **Configuration specificity.** The schema says configuration contains browser/device/OS/version and asks for complete conditions, but its own independent-regression example names only Safari/iPhone. It does not specify whether exact versions/models must be fixed before admission for a future unprovisioned human entry. I have retained the supplied Safari/iPhone family, required actual configuration to be reported, and not invented supported hardware/version access. If exact versions are mandatory for admission, the scenario lacks that information and no fully concrete admissible plan can be asserted until the support matrix is supplied.
4. **Result schema detail.** The `regression_results` shape first lists `conditions`, while the results-only example explicitly uses per-portion `conditions_confirmed`. I used the latter exactly as documented and did not invent a condition-inheritance field. `replaces_check_id` describes stored checks; `new_check_id` describes a changed-build result request. Those contexts should remain distinct.

No helper validation was run: this exercise authorizes only this Markdown file and the documented helper writes additional artifacts. These are documentation conclusions and truthful planning excerpts, not evidence that a device, app or complete ledger passed.

## Recheck after the documentation clarification

I read only the newly added clarification paragraphs in evidence-contract.md, reporting.md and ledger-schema.md. They resolve the four wording tensions identified above; this recheck supersedes those earlier ambiguity bullets.

- A complete reserved plan may name an unprovisioned future build and a declared or unavailable human capability. Phone reachability, safe setup and actual access are execution prerequisites. Their absence leaves the checks unrun; it does not itself defeat otherwise complete, authorized, within-budget reservation. The entries must not be called ready to execute.
- A missing result needed to establish the repair or select a safe change still requires a proposal. That rule is now explicitly distinguished from pending post-fix regressions reserved under apply-and-hand-off.
- Safari/iPhone family configuration is permitted when it describes the intended support scope. Actual model, versions and viewport must be reported. Any version, model, width or display condition required by the support matrix or regression must be included before admission and cannot be invented or omitted. The illustrative 390 CSS px phone requirement in this candidate therefore remains a real planned condition of that example; its availability has not been established.
- Per-portion actual `conditions` and `conditions_confirmed` are alternative result inputs. A genuine confirmation is normalized to stored actual conditions; a different reported actual state takes precedence. Planned `regression_conditions` remains separate and supplies no observation.

**The earlier `fix.evidence: []` is a non-submittable excerpt.** A submitted applied-fix ledger must retain the prior genuine edit evidence proving the local F-01 change. This exercise did not inspect or supply that evidence. The empty array must never be submitted, used to clear existing evidence, or described as satisfying complete-ledger admission. The plan examples illustrate the field/link and budget arrangement, conditional on that genuine evidence and the other unchanged original records being present.

I found no remaining wording ambiguity in these clarified points. Actual source/fix evidence, required support conditions, build provisioning, safe setup and device access remain factual prerequisites or open work, rather than documentation conflicts. No helper, app, browser/device, cache, Git or other-file action was performed during this recheck.

