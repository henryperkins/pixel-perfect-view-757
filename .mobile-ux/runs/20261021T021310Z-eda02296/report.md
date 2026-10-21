Ceiling: proxy (automated_test, desktop_emulation, static_review); limits: field_data unavailable, os_simulator unavailable, physical_device unavailable, no available simulator or physical device; assessment incomplete; verification failed.

# Mobile UX audit — 20261021T021310Z-eda02296

## 1. Verdict

Mode: audit_and_fix. Principal task: Apply F-04, F-05 and F-06 from the mobile audit; rerun relevant checks and hand off remaining device checks without commit, push or deploy.
Open P0/P1: none recorded.
Evidence declarations are not independently authenticated by the helper.

## 2. Coverage

Standing substitutions (scoped to environment/build):
```json
[
  {
    "status": "known",
    "items": [
      {
        "boundary": "member/auth/model/billing server functions",
        "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
        "behavior": "replaced",
        "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
        "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
        "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
      },
      {
        "boundary": "application bootstrap/SSR",
        "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
        "behavior": "replaced",
        "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
        "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
        "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
      }
    ],
    "unknown_boundaries": [],
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
    ],
    "reason": "Scoped test substitution, not evidence for the real replaced boundary.",
    "id": "SS-MEMBER-FIXTURE",
    "environments": [
      "desktop_emulation"
    ],
    "build_ids": [
      "B-PROXY"
    ]
  },
  {
    "status": "known",
    "items": [
      {
        "boundary": "member/auth/model/billing server functions",
        "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
        "behavior": "replaced",
        "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
        "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
        "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
      },
      {
        "boundary": "application bootstrap/SSR",
        "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
        "behavior": "replaced",
        "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
        "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
        "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
      }
    ],
    "unknown_boundaries": [],
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs"
    ],
    "reason": "Scoped test substitution, not evidence for the real replaced boundary.",
    "id": "SS-MEMBER-FIXTURE-FIX",
    "environments": [
      "desktop_emulation"
    ],
    "build_ids": [
      "B-FIX-LOCAL"
    ]
  }
]
```

| Area | Disposition | Environments used | Highest level | What remains |
| --- | --- | --- | --- | --- |
| 1. Reach and placement | no_defect_found | desktop_emulation | proxy | C-FIX-D01 through C-FIX-D04: actual grip/reach/missed taps |
| 2. Viewport and safe areas | no_defect_found | desktop_emulation, static_review | proxy | C-FIX-D01 through C-FIX-D04: real chrome, notch/home/gesture insets and keyboard transitions |
| 3. Touch targets | no_defect_found | desktop_emulation | proxy | C-FIX-D01 through C-FIX-D04: physical tap feedback and grip; current measured primary controls meet the tested floor |
| 4. Forms and keyboard | defects_found | automated_test, desktop_emulation, static_review | proxy | C-FIX-D01 through C-FIX-D04: software keyboards, focus zoom and signed entry; C-FIX-D05/C-FIX-D06: actual assistive technology |
| 5. Gestures and scrolling | no_defect_found | desktop_emulation, static_review | proxy | C-FIX-D01 through C-FIX-D04: native swipes, pinch, system edges and real overscroll |
| 6. Overlays, navigation and dense data | no_defect_found | desktop_emulation | proxy | C-FIX-D04: Android system Back; C-FIX-D05/C-FIX-D06: assistive navigation; full populated dense tables beyond budget |
| 7. Content priority | no_defect_found | desktop_emulation | proxy | Actual generated/member content and longer records remain outside synthetic reading qualification |
| 8. Performance | not_tested |  | none | C-FIX-D09/C-FIX-D10: actual device traces on production-mode test builds; production RUM/CrUX origin/window/access missing |
| 9. Errors and recovery | no_defect_found | automated_test, desktop_emulation | proxy | C-FIX-D07/C-FIX-D08: genuine tab discard and test-backend lost acknowledgements; real backend/session behavior missing |
| 10. Accessibility on mobile | defects_found | desktop_emulation, static_review | proxy | C-FIX-D05/C-FIX-D06: VoiceOver/TalkBack; C-FIX-D01 through C-FIX-D04: native zoom/keyboard/insets |

## 3. Findings by severity

### F-04: Selected birth-time accuracy helper fails minimum text contrast

P2 · observed · **implemented**

Where: src/components/pattern/BirthDetailsForm.tsx:314; selected accuracy label .border-primary > span.text-xs.text-muted-foreground. Expected: Informative 12px helper text in an enabled selected accuracy option reaches at least 4.5:1 in each theme (WCAG 1.4.3).. Actual: Both engines: selected Exact and Within ~15 min helper text measures 3.4403:1 in light and 4.1137:1 in dark. Axe 4.14.0 also reports color-contrast. No large-text, inactive, decoration or logo exception applies..
Cause: The helper retains text-muted-foreground when its parent switches to the selected accent surface.. Disposition reason: 

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "helper-ch-light",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Chromium 155.0.8059.12",
        "device": "Linux desktop host with viewport and touch media emulation",
        "os": "Linux",
        "state": "Axe: /birth-light",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Axe: /birth-light"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "helper-ch-dark",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Chromium 155.0.8059.12",
        "device": "Linux desktop host with viewport and touch media emulation",
        "os": "Linux",
        "state": "Axe: birth-manual-dark",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Axe: birth-manual-dark"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "helper-wk-light",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Playwright WebKit 26.6",
        "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
        "os": "Linux",
        "state": "Axe: /birth-light",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Axe: /birth-light"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "helper-wk-dark",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Playwright WebKit 26.6",
        "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
        "os": "Linux",
        "state": "Axe: birth-manual-dark",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Axe: birth-manual-dark"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    }
  ],
  "refuted_scopes": null,
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/4/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
      "scope_ids": [
        "helper-ch-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/5/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
      "scope_ids": [
        "helper-ch-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/6/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .block.text-xs.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 4.11 (foreground color: #a7a09a, background color: #2c4431, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
      "scope_ids": [
        "helper-ch-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/4/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
      "scope_ids": [
        "helper-wk-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/5/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
      "scope_ids": [
        "helper-wk-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/6/scan",
      "level": "proxy",
      "observation": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .block.text-xs.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 4.11 (foreground color: #a7a09a, background color: #2c4431, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [{\"id\": \"color-contrast\", \"nodeCount\": 1}], \"passes\": 26}",
      "scope_ids": [
        "helper-wk-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json",
      "level": "proxy",
      "observation": "Exact and Within ~15 min selected helper measurements; 12px text, light3.4402854858:1/dark4.1136659365:1. Visible label activation retained native selection.",
      "scope_ids": [
        "helper-ch-light",
        "helper-ch-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json",
      "level": "proxy",
      "observation": "Exact and Within ~15 min selected helper measurements; 12px text, light3.4402854858:1/dark4.1136659365:1. Visible label activation retained native selection.",
      "scope_ids": [
        "helper-wk-light",
        "helper-wk-dark"
      ]
    }
  ],
  "fix": {
    "applied": true,
    "device_dependent": false,
    "build_id": "B-FIX-LOCAL",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json"
    ],
    "required_check_ids": [],
    "proposal": "Applied: Conditional text-accent-foreground on selected accuracy helper; unselected text-muted-foreground retained. Target qualification remains pending.",
    "application_plan": {
      "file": "src/components/pattern/BirthDetailsForm.tsx",
      "expected_result": "Informative 12px helper text in an enabled selected accuracy option reaches at least 4.5:1 in each theme (WCAG 1.4.3).",
      "planned_build": "B-FIX-LOCAL",
      "status": "applied after red probes and plan admission"
    },
    "implementation": "Conditional text-accent-foreground on selected accuracy helper; unselected text-muted-foreground retained.",
    "proposal_before_application": "Use the existing accent foreground for the helper when its accuracy option is selected; retain muted foreground for unselected options. Recheck all four selections in both themes; preserve labels and native radios."
  },
  "contrary_evidence": null,
  "status_history": null
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-CH-AXE-05",
    "module": 1,
    "required": true,
    "scenario": "Axe: /birth-light",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/4/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: /birth-light",
    "capability_id": "CAP-CH",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux",
      "state": "Axe: /birth-light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: /birth-light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-CH-AXE-06",
    "module": 1,
    "required": true,
    "scenario": "Axe: birth-manual-light",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/5/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: birth-manual-light",
    "capability_id": "CAP-CH",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux",
      "state": "Axe: birth-manual-light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: birth-manual-light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-CH-AXE-07",
    "module": 1,
    "required": true,
    "scenario": "Axe: birth-manual-dark",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .block.text-xs.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 4.11 (foreground color: #a7a09a, background color: #2c4431, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json#states/6/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: birth-manual-dark",
    "capability_id": "CAP-CH",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux",
      "state": "Axe: birth-manual-dark",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: birth-manual-dark"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-dark"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-WK-AXE-05",
    "module": 1,
    "required": true,
    "scenario": "Axe: /birth-light",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/4/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: /birth-light",
    "capability_id": "CAP-WK",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux",
      "state": "Axe: /birth-light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: /birth-light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-WK-AXE-06",
    "module": 1,
    "required": true,
    "scenario": "Axe: birth-manual-light",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .text-xs.block.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 3.44 (foreground color: #6b655e, background color: #b4d0ab, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/5/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: birth-manual-light",
    "capability_id": "CAP-WK",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux",
      "state": "Axe: birth-manual-light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: birth-manual-light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-WK-AXE-07",
    "module": 1,
    "required": true,
    "scenario": "Axe: birth-manual-dark",
    "expected": "No violations of the executed WCAG A/AA rules in this exact rendered state.",
    "actual": "{\"version\": \"4.14.0\", \"violations\": [{\"id\": \"color-contrast\", \"impact\": \"serious\", \"description\": \"Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds\", \"help\": \"Elements must meet minimum color contrast ratio thresholds\", \"helpUrl\": \"https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=axeAPI\", \"nodes\": [{\"html\": \"<span class=\\\"block text-xs text-muted-foreground\\\">From a record, to the minute.</span>\", \"target\": [\".border-primary > .block.text-xs.text-muted-foreground\"], \"failureSummary\": \"Fix any of the following:\\n  Element has insufficient color contrast of 4.11 (foreground color: #a7a09a, background color: #2c4431, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1\"}]}], \"incomplete\": [{\"id\": \"color-contrast\", \"nodeCount\": 1}], \"passes\": 26}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json#states/6/scan"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Axe: birth-manual-dark",
    "capability_id": "CAP-WK",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux",
      "state": "Axe: birth-manual-dark",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Axe: birth-manual-dark"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "audit runtime/remote network",
            "description": "axe-core 4.14.0 injected into this temporary context; all nonlocal/nonfont requests blocked. Dark and root-font states are explicit class/style stress settings.",
            "behavior": "replaced",
            "configured_response": "Only localhost and Google Fonts may pass through. Stripe aborted; axe runs WCAG A/AA tagged rules, dark=.dark, root stress=32px where named.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real Stripe UI, all unmounted states, screen-reader use, production theme bootstrap and native text zoom."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-dark"
      }
    ],
    "area_ids": [
      3,
      4,
      6,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-01",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Exact selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Exact selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"From a record, to the minute.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/0",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Exact selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Exact selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/0",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-02",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Within ~15 min selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Within ~15 min selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Remembered closely.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/1",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Within ~15 min selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Within ~15 min selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/1",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-03",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Within an hour selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Within an hour selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Rough recollection.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/2",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Within an hour selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Within an hour selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/2",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-04",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Unknown selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Unknown selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Houses and angles get suppressed.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/3",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Unknown selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Unknown selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/3",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-05",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Exact selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Exact selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"From a record, to the minute.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/4",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Exact selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Exact selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/4",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-06",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Within ~15 min selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Within ~15 min selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Remembered closely.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/5",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Within ~15 min selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Within ~15 min selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/5",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-07",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Within an hour selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Within an hour selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Rough recollection.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/6",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Within an hour selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Within an hour selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/6",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-08",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Unknown selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Unknown selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Houses and angles get suppressed.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/7",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Unknown selected help meets 4.5:1",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Unknown selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/7",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-ch-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-01",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Exact selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Exact selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"From a record, to the minute.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/0",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Exact selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Exact selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/0",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-02",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Within ~15 min selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Within ~15 min selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Remembered closely.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/1",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Within ~15 min selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Within ~15 min selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/1",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-03",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Within an hour selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Within an hour selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Rough recollection.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/2",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Within an hour selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Within an hour selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/2",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-04",
    "module": 3,
    "required": true,
    "scenario": "/birth light: Unknown selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: Unknown selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Houses and angles get suppressed.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 7.204725571808482, \"borderInside\": 1.1797876018119968, \"borderOutside\": 1.1797876018119968, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/3",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: Unknown selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: Unknown selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/3",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-05",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Exact selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Exact selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"From a record, to the minute.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/4",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Exact selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Exact selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/4",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-06",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Within ~15 min selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Within ~15 min selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Remembered closely.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/5",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Within ~15 min selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Within ~15 min selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/5",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-07",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Within an hour selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Within an hour selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Rough recollection.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/6",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Within an hour selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Within an hour selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/6",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-08",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: Unknown selected help meets 4.5:1",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: Unknown selected help meets 4.5:1\", \"passed\": true, \"details\": [{\"text\": \"Houses and angles get suppressed.\", \"inputmode\": null, \"focused\": false, \"disabled\": false, \"font\": \"12px\", \"border\": \"oklch(1 0 0 / 0.14)\", \"fill\": \"rgba(0, 0, 0, 0)\", \"textContrast\": 8.694918217222677, \"borderInside\": 1.5240841154471858, \"borderOutside\": 1.5240841154471858, \"fillOutside\": 1}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/7",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: Unknown selected help meets 4.5:1",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: Unknown selected help meets 4.5:1",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/7",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-04",
        "scope_id": "helper-wk-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  }
]
```

### F-05: Empty birth inputs lack a sufficiently contrasting visual boundary

P2 · observed · **implemented**

Where: src/components/pattern/BirthDetailsForm.tsx:23 and :449; src/styles.css --input in light/dark themes. Expected: Enabled empty manual fields remain visually identifiable without relying on current value, focus, hover or placeholder text; required boundary/fill reaches 3:1 (WCAG 1.4.11).. Actual: After clearing manual Latitude and blurring it, border-to-fill is 1.3934:1 light and 1.7864:1 dark; border-to-surround is 1.3263:1 and 1.7439:1. Fill-to-surround is only 1.0506:1 and 1.1100:1. Empty Latitude/Longitude have no placeholder or icon that identifies their editable bounds. A focused Timezone ring passes, but does not identify the other unfocused empty fields..
Cause: The shared birth inputClass uses low-contrast border-input and a card fill close to the surrounding surface.. Disposition reason: 

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "empty-ch-light",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Chromium 155.0.8059.12",
        "device": "Linux desktop host with viewport and touch media emulation",
        "os": "Linux",
        "state": "Empty birth manual Latitude boundary, light",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Empty birth manual Latitude boundary, light"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "empty-ch-dark",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Chromium 155.0.8059.12",
        "device": "Linux desktop host with viewport and touch media emulation",
        "os": "Linux",
        "state": "Empty birth manual Latitude boundary, dark",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Empty birth manual Latitude boundary, dark"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "empty-wk-light",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Playwright WebKit 26.6",
        "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
        "os": "Linux",
        "state": "Empty birth manual Latitude boundary, light",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Empty birth manual Latitude boundary, light"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    },
    {
      "id": "empty-wk-dark",
      "conditions": {
        "build_id": "B-PROXY",
        "browser": "Playwright WebKit 26.6",
        "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
        "os": "Linux",
        "state": "Empty birth manual Latitude boundary, dark",
        "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
        "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
        "steps": [
          "Empty birth manual Latitude boundary, dark"
        ],
        "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
        "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
      }
    }
  ],
  "refuted_scopes": null,
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json#birth-empty-light",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
      "scope_ids": [
        "empty-ch-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-birth-empty-light.png",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
      "scope_ids": [
        "empty-ch-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json#birth-empty-dark",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
      "scope_ids": [
        "empty-ch-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-birth-empty-dark.png",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
      "scope_ids": [
        "empty-ch-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json#birth-empty-light",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
      "scope_ids": [
        "empty-wk-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-empty-light.png",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
      "scope_ids": [
        "empty-wk-light"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json#birth-empty-dark",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
      "scope_ids": [
        "empty-wk-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-empty-dark.png",
      "level": "proxy",
      "observation": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
      "scope_ids": [
        "empty-wk-dark"
      ]
    }
  ],
  "fix": {
    "applied": true,
    "device_dependent": false,
    "build_id": "B-FIX-LOCAL",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json"
    ],
    "required_check_ids": [],
    "proposal": "Applied: BirthDetailsForm inputClass now uses existing border-muted-foreground token for enabled empty/focused/error states. Target qualification remains pending.",
    "application_plan": {
      "file": "src/components/pattern/BirthDetailsForm.tsx",
      "expected_result": "Enabled empty manual fields remain visually identifiable without relying on current value, focus, hover or placeholder text; required boundary/fill reaches 3:1 (WCAG 1.4.11).",
      "planned_build": "B-FIX-LOCAL",
      "status": "applied after red probes and plan admission"
    },
    "implementation": "BirthDetailsForm inputClass now uses existing border-muted-foreground token for enabled empty/focused/error states.",
    "proposal_before_application": "Give BirthDetailsForm inputClass a stronger existing semantic border token, as TodayCheckIn already does with border-muted-foreground. Verify unfocused/focused/error/disabled states in both themes and narrow/enlarged layouts. Review similar blank auth inputs as a related location; do not globally darken decorative rules or automatically classify filled selects as criterion failures."
  },
  "contrary_evidence": null,
  "status_history": null
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-CH-EMPTY-LIGHT",
    "module": 3,
    "required": true,
    "scenario": "Empty birth manual Latitude boundary, light",
    "expected": "An enabled empty field without a placeholder has a distinguishing boundary or fill at least 3:1 against its adjacent surface.",
    "actual": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json#birth-empty-light",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-birth-empty-light.png"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Empty birth manual Latitude boundary, light",
    "capability_id": "CAP-CH",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux",
      "state": "Empty birth manual Latitude boundary, light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Empty birth manual Latitude boundary, light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "No additions to applicable named build and standing substitutions."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-ch-light"
      }
    ],
    "area_ids": [
      4,
      10
    ]
  },
  {
    "id": "C-CH-EMPTY-DARK",
    "module": 3,
    "required": true,
    "scenario": "Empty birth manual Latitude boundary, dark",
    "expected": "An enabled empty field without a placeholder has a distinguishing boundary or fill at least 3:1 against its adjacent surface.",
    "actual": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json#birth-empty-dark",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-birth-empty-dark.png"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Empty birth manual Latitude boundary, dark",
    "capability_id": "CAP-CH",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport and touch media emulation",
      "os": "Linux",
      "state": "Empty birth manual Latitude boundary, dark",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Empty birth manual Latitude boundary, dark"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "No additions to applicable named build and standing substitutions."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-ch-dark"
      }
    ],
    "area_ids": [
      4,
      10
    ]
  },
  {
    "id": "C-WK-EMPTY-LIGHT",
    "module": 3,
    "required": true,
    "scenario": "Empty birth manual Latitude boundary, light",
    "expected": "An enabled empty field without a placeholder has a distinguishing boundary or fill at least 3:1 against its adjacent surface.",
    "actual": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(0.883 0.012 79)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"fillOutside\": 1.0505573276217375, \"borderInside\": 1.393352195715389, \"borderOutside\": 1.3262981077574072, \"focused\": false}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json#birth-empty-light",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-empty-light.png"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Empty birth manual Latitude boundary, light",
    "capability_id": "CAP-WK",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux",
      "state": "Empty birth manual Latitude boundary, light",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Empty birth manual Latitude boundary, light"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "No additions to applicable named build and standing substitutions."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-wk-light"
      }
    ],
    "area_ids": [
      4,
      10
    ]
  },
  {
    "id": "C-WK-EMPTY-DARK",
    "module": 3,
    "required": true,
    "scenario": "Empty birth manual Latitude boundary, dark",
    "expected": "An enabled empty field without a placeholder has a distinguishing boundary or fill at least 3:1 against its adjacent surface.",
    "actual": "{\"label\": \"Latitude\", \"value\": \"\", \"type\": \"text\", \"inputmode\": \"decimal\", \"border\": \"oklch(1 0 0 / 0.18)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"fillOutside\": 1.1100264927203913, \"borderInside\": 1.7863686603714033, \"borderOutside\": 1.7438932624490193, \"focused\": false}",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json#birth-empty-dark",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-empty-dark.png"
    ],
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Empty birth manual Latitude boundary, dark",
    "capability_id": "CAP-WK",
    "build_id": "B-PROXY",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-PROXY",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with phone viewport; wheel tests use desktop context",
      "os": "Linux",
      "state": "Empty birth manual Latitude boundary, dark",
      "account_data": "mobile-audit-member, member@example.invalid, synthetic services",
      "setup": "B-PROXY fixture. Per-case fresh contexts where named by the saved script; see substitution-index.json.",
      "steps": [
        "Empty birth manual Latitude boundary, dark"
      ],
      "timing": "As specified by the saved script and actual returned result; normal synthetic response unless a delay/failure is named.",
      "substitutions": "B-PROXY / SS-MEMBER-FIXTURE plus saved per-suite additions."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "No additions to applicable named build and standing substitutions."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-wk-dark"
      }
    ],
    "area_ids": [
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-09",
    "module": 3,
    "required": true,
    "scenario": "/birth light: empty manual fields meet 3:1 inside and outside",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: empty manual fields meet 3:1 inside and outside\", \"passed\": true, \"details\": [{\"text\": \"\", \"label\": \"Latitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}, {\"text\": \"\", \"label\": \"Longitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}, {\"text\": \"\", \"label\": \"Timezone\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.6)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/8",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: empty manual fields meet 3:1 inside and outside",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: empty manual fields meet 3:1 inside and outside",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/8",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-ch-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-11",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: empty manual fields meet 3:1 inside and outside",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: empty manual fields meet 3:1 inside and outside\", \"passed\": true, \"details\": [{\"text\": \"\", \"label\": \"Latitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}, {\"text\": \"\", \"label\": \"Longitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}, {\"text\": \"\", \"label\": \"Timezone\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.2)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/10",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: empty manual fields meet 3:1 inside and outside",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: empty manual fields meet 3:1 inside and outside",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/10",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-ch-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-09",
    "module": 3,
    "required": true,
    "scenario": "/birth light: empty manual fields meet 3:1 inside and outside",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth light: empty manual fields meet 3:1 inside and outside\", \"passed\": true, \"details\": [{\"text\": \"\", \"label\": \"Latitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}, {\"text\": \"\", \"label\": \"Longitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}, {\"text\": \"\", \"label\": \"Timezone\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.51 0.013 66)\", \"fill\": \"oklch(0.993 0.005 84.599998)\", \"textContrast\": 16.9449012475542, \"borderInside\": 5.655346478931521, \"borderOutside\": 5.383186933486202, \"fillOutside\": 1.0505573276217375}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/8",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth light: empty manual fields meet 3:1 inside and outside",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth light: empty manual fields meet 3:1 inside and outside",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/8",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-wk-light"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-11",
    "module": 3,
    "required": true,
    "scenario": "/birth dark: empty manual fields meet 3:1 inside and outside",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth dark: empty manual fields meet 3:1 inside and outside\", \"passed\": true, \"details\": [{\"text\": \"\", \"label\": \"Latitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}, {\"text\": \"\", \"label\": \"Longitude\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}, {\"text\": \"\", \"label\": \"Timezone\", \"type\": \"text\", \"inputmode\": \"text\", \"value\": \"\", \"focused\": false, \"disabled\": false, \"font\": \"16px\", \"border\": \"oklch(0.71 0.012 66)\", \"fill\": \"oklch(0.245 0.011 61.200001)\", \"textContrast\": 13.849666782047674, \"borderInside\": 6.324075595352717, \"borderOutside\": 7.019891452807998, \"fillOutside\": 1.1100264927203913}]}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/10",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth dark: empty manual fields meet 3:1 inside and outside",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth dark: empty manual fields meet 3:1 inside and outside",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/10",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-05",
        "scope_id": "empty-wk-dark"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  }
]
```

### F-06: Signed coordinate fields request a keypad that may omit minus

P2 · code_supported · **implemented**

Where: src/components/pattern/BirthDetailsForm.tsx:451; src/lib/birth-form.ts:60 and :84. Expected: The manual path supports accepted negative coordinates without needing geocoding, a hardware keyboard or clipboard workaround.. Actual: Latitude and Longitude request inputMode=decimal while validation accepts negative decimal values. Current MDN documents that decimal keyboards may omit minus. Programmatic -33.8688/-151.2093 entry succeeds in both proxies; no physical-keyboard failure is claimed..
Cause: Keyboard hint is narrower than the accepted signed input on some potential target keyboard configurations; exact affected device/keyboard versions need acquisition.. Disposition reason: 

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "signed-source-policy",
      "conditions": {
        "build_id": "B-SOURCE",
        "browser": "source / Node 24",
        "device": "Linux host",
        "state": "Compare accepted signed coordinate formats with keyboard hint",
        "account_data": "synthetic values only",
        "setup": "Current source files, unchanged",
        "steps": [
          "Compare accepted signed coordinate formats with keyboard hint"
        ],
        "timing": "Static inspection or pure module execution",
        "substitutions": "none (checked)"
      }
    }
  ],
  "refuted_scopes": null,
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx:451",
      "level": "mechanism",
      "observation": "birthFormIssues accepts negative coordinates and birthSaveData uses Number; BirthDetailsForm requests inputMode=decimal for latitude/longitude. Current browser documentation says that keypad may omit minus. Actual physical key availability is not observed.",
      "scope_ids": [
        "signed-source-policy"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/src/lib/birth-form.ts:62",
      "level": "mechanism",
      "observation": "birthFormIssues accepts negative coordinates and birthSaveData uses Number; BirthDetailsForm requests inputMode=decimal for latitude/longitude. Current browser documentation says that keypad may omit minus. Actual physical key availability is not observed.",
      "scope_ids": [
        "signed-source-policy"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
      "level": "mechanism",
      "observation": "birthFormIssues accepts negative coordinates and birthSaveData uses Number; BirthDetailsForm requests inputMode=decimal for latitude/longitude. Current browser documentation says that keypad may omit minus. Actual physical key availability is not observed.",
      "scope_ids": [
        "signed-source-policy"
      ]
    },
    {
      "ref": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode",
      "level": "mechanism",
      "observation": "Decimal keyboards may or may not expose a minus key. Current documentation checked 2026-10-21.",
      "scope_ids": [
        "signed-source-policy"
      ]
    }
  ],
  "fix": {
    "applied": true,
    "device_dependent": true,
    "build_id": "B-FIX-LOCAL",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json"
    ],
    "required_check_ids": [
      "C-FIX-D01",
      "C-FIX-D02",
      "C-FIX-D03",
      "C-FIX-D04"
    ],
    "proposal": "Applied: Manual coordinate text inputs request inputMode=text; existing signed parsing, numeric range validation, payload, drafts and timezone handling retained. Target qualification remains pending.",
    "device_regressions": [
      {
        "id": "DR-F06-D01",
        "source_scope_ids": [
          "signed-source-policy"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
        "conditions": {
          "build_id": "B-FIX-PHONE",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Compact tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
          "account_data": "isolated non-production test account, not provisioned yet",
          "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
          "steps": [
            "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
            "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
            "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
            "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
            "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
            "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
            "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
          ],
          "timing": "Record actual connection, load state and timing for each requested portion.",
          "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
        },
        "depends_on": [
          "physical software keyboard"
        ]
      },
      {
        "id": "DR-F06-D02",
        "source_scope_ids": [
          "signed-source-policy"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
        "conditions": {
          "build_id": "B-FIX-PHONE",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Bottom tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
          "account_data": "isolated non-production test account, not provisioned yet",
          "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
          "steps": [
            "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
            "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
            "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
            "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
            "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
            "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
            "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
          ],
          "timing": "Record actual connection, load state and timing for each requested portion.",
          "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
        },
        "depends_on": [
          "physical software keyboard"
        ]
      },
      {
        "id": "DR-F06-D03",
        "source_scope_ids": [
          "signed-source-policy"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
        "conditions": {
          "build_id": "B-FIX-PHONE",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Top tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
          "account_data": "isolated non-production test account, not provisioned yet",
          "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
          "steps": [
            "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
            "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
            "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
            "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
            "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
            "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
            "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
          ],
          "timing": "Record actual connection, load state and timing for each requested portion.",
          "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
        },
        "depends_on": [
          "physical software keyboard"
        ]
      },
      {
        "id": "DR-F06-D04",
        "source_scope_ids": [
          "signed-source-policy"
        ],
        "environment": "physical_device",
        "behavior": "software_keyboard",
        "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
        "conditions": {
          "build_id": "B-FIX-PHONE",
          "browser": "Chrome",
          "device": "Android phone",
          "state": "regular tab / gesture navigation; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
          "account_data": "isolated non-production test account, not provisioned yet",
          "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
          "steps": [
            "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
            "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
            "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
            "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
            "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
            "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
            "With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.",
            "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
          ],
          "timing": "Record actual connection, load state and timing for each requested portion.",
          "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
        },
        "depends_on": [
          "physical software keyboard"
        ]
      }
    ],
    "application_plan": {
      "file": "src/components/pattern/BirthDetailsForm.tsx",
      "expected_result": "The manual path supports accepted negative coordinates without needing geocoding, a hardware keyboard or clipboard workaround.",
      "planned_build": "B-FIX-LOCAL",
      "status": "applied after red probes and plan admission"
    },
    "implementation": "Manual coordinate text inputs request inputMode=text; existing signed parsing, numeric range validation, payload, drafts and timezone handling retained.",
    "proposal_before_application": "Proposed only: retain text inputs and use a full text keyboard hint for manual signed coordinates, or provide an explicit accessible sign control after target investigation. Preserve valid negatives, decimals, coordinate ranges and timezone strings; never replace with an unsigned numeric keypad. Run C-P01 through C-P04 before choosing a device-specific alternative."
  },
  "contrary_evidence": null,
  "status_history": null
}
```

Device regression requirements (independent of observed scope):
```json
{
  "requirements": [
    {
      "id": "DR-F06-D01",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "environment": "physical_device",
      "behavior": "software_keyboard",
      "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
      "conditions": {
        "build_id": "B-FIX-PHONE",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Compact tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
        "account_data": "isolated non-production test account, not provisioned yet",
        "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
        "steps": [
          "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
          "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
          "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
          "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
          "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
          "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
          "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
        ],
        "timing": "Record actual connection, load state and timing for each requested portion.",
        "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
      },
      "depends_on": [
        "physical software keyboard"
      ]
    },
    {
      "id": "DR-F06-D02",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "environment": "physical_device",
      "behavior": "software_keyboard",
      "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
      "conditions": {
        "build_id": "B-FIX-PHONE",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Bottom tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
        "account_data": "isolated non-production test account, not provisioned yet",
        "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
        "steps": [
          "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
          "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
          "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
          "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
          "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
          "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
          "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
        ],
        "timing": "Record actual connection, load state and timing for each requested portion.",
        "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
      },
      "depends_on": [
        "physical software keyboard"
      ]
    },
    {
      "id": "DR-F06-D03",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "environment": "physical_device",
      "behavior": "software_keyboard",
      "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
      "conditions": {
        "build_id": "B-FIX-PHONE",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Top tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
        "account_data": "isolated non-production test account, not provisioned yet",
        "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
        "steps": [
          "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
          "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
          "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
          "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
          "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
          "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
          "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
        ],
        "timing": "Record actual connection, load state and timing for each requested portion.",
        "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
      },
      "depends_on": [
        "physical software keyboard"
      ]
    },
    {
      "id": "DR-F06-D04",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "environment": "physical_device",
      "behavior": "software_keyboard",
      "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
      "conditions": {
        "build_id": "B-FIX-PHONE",
        "browser": "Chrome",
        "device": "Android phone",
        "state": "regular tab / gesture navigation; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
        "account_data": "isolated non-production test account, not provisioned yet",
        "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
        "steps": [
          "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
          "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
          "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
          "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
          "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
          "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
          "With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.",
          "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
        ],
        "timing": "Record actual connection, load state and timing for each requested portion.",
        "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
      },
      "depends_on": [
        "physical software keyboard"
      ]
    }
  ],
  "qualification": [
    {
      "finding_id": "F-06",
      "regression_id": "DR-F06-D01",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "check_ids": [
        "C-FIX-D01"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-06",
      "regression_id": "DR-F06-D02",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "check_ids": [
        "C-FIX-D02"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-06",
      "regression_id": "DR-F06-D03",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "check_ids": [
        "C-FIX-D03"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-06",
      "regression_id": "DR-F06-D04",
      "source_scope_ids": [
        "signed-source-policy"
      ],
      "check_ids": [
        "C-FIX-D04"
      ],
      "status": "not_run"
    }
  ],
  "note": "Regression results do not verify or refute the original observed scopes."
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-SOURCE-SIGNED",
    "module": 3,
    "required": true,
    "scenario": "Compare accepted signed coordinate formats with keyboard hint",
    "expected": "Manual coordinate entry retains a reliable way to enter every accepted sign and decimal character.",
    "actual": "birthFormIssues accepts negative coordinates and birthSaveData uses Number; BirthDetailsForm requests inputMode=decimal for latitude/longitude. Current browser documentation says that keypad may omit minus. Actual physical key availability is not observed.",
    "status": "fail",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx:451",
      "/home/ubuntu/pixel-perfect-view-757/src/lib/birth-form.ts:62",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
    ],
    "reason": "",
    "environment": "static_review",
    "driver": "agent",
    "evidence_type": "static",
    "level": "mechanism",
    "behavior": "Compare accepted signed coordinate formats with keyboard hint",
    "capability_id": "CAP-SOURCE",
    "build_id": "B-SOURCE",
    "configuration": {
      "browser": "source / Node 24",
      "device": "Linux host",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-SOURCE",
      "browser": "source / Node 24",
      "device": "Linux host",
      "state": "Compare accepted signed coordinate formats with keyboard hint",
      "account_data": "synthetic values only",
      "setup": "Current source files, unchanged",
      "steps": [
        "Compare accepted signed coordinate formats with keyboard hint"
      ],
      "timing": "Static inspection or pure module execution",
      "substitutions": "none (checked)"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/birth-place-tests.txt"
        ],
        "reason": "Source inspection and Node pure-module tests use current files with no patched application module."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "Known synthetic account/data or pure module test values, as applicable."
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
        ],
        "reason": "No additions to applicable named build and standing substitutions."
      }
    },
    "covers": [
      {
        "finding_id": "F-06",
        "scope_id": "signed-source-policy"
      }
    ],
    "area_ids": [
      4
    ]
  },
  {
    "id": "C-FIX-D01",
    "module": 3,
    "required": true,
    "scenario": "Fixed build: Primary journey, keyboard, insets and manual signed coordinates",
    "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
    "actual": "",
    "status": "not_run",
    "evidence": [],
    "reason": "Reserved target check on an unprovisioned fixed build; device, build URL and safe backend unavailable. Actual result/evidence remain empty.",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "software_keyboard",
    "capability_id": "CAP-PHONE",
    "build_id": "B-FIX-PHONE",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "version": "tester must report",
      "os": "tester must report",
      "tab_layout": "Compact tabs"
    },
    "conditions": {
      "build_id": "B-FIX-PHONE",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Compact tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
      "account_data": "isolated non-production test account, not provisioned yet",
      "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
      "steps": [
        "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
        "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
        "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
        "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
        "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
        "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
        "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
      ],
      "timing": "Record actual connection, load state and timing for each requested portion.",
      "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
    },
    "depends_on": [
      "physical software keyboard"
    ],
    "substitutions": {
      "build": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      },
      "setup": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "member APIs",
          "test account/data",
          "keyboard/locale",
          "failure controls"
        ],
        "evidence": [],
        "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
      },
      "additional": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "*"
        ],
        "evidence": [],
        "reason": "Tester must record actual additions; none can be established before the device execution."
      }
    },
    "covers": [],
    "finding_ids": [
      "F-04",
      "F-05",
      "F-06"
    ],
    "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
    "steps": [
      "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
      "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
      "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
      "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
      "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
      "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
      "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
    ],
    "result_template": "Result: ___ Build as tested (confirm or note difference): ___ Setup as tested (confirm or note difference): ___ Notes: ___ Screenshot/trace: ___",
    "scope_note": "New fixed-build target acquisition, replacing the earlier unrun plan. Original source/proxy Affects and evidence remain unchanged. Only explicit regression links cover the independent F-06 fix plan.",
    "replaces_check_id": "C-P01",
    "regression_covers": [
      {
        "finding_id": "F-06",
        "regression_id": "DR-F06-D01"
      }
    ],
    "regression_results": []
  },
  {
    "id": "C-FIX-D02",
    "module": 3,
    "required": true,
    "scenario": "Fixed build: Bottom-tab chrome/keyboard and manual signed coordinates",
    "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
    "actual": "",
    "status": "not_run",
    "evidence": [],
    "reason": "Reserved target check on an unprovisioned fixed build; device, build URL and safe backend unavailable. Actual result/evidence remain empty.",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "software_keyboard",
    "capability_id": "CAP-PHONE",
    "build_id": "B-FIX-PHONE",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "version": "tester must report",
      "os": "tester must report",
      "tab_layout": "Bottom tabs"
    },
    "conditions": {
      "build_id": "B-FIX-PHONE",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Bottom tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
      "account_data": "isolated non-production test account, not provisioned yet",
      "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
      "steps": [
        "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
        "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
        "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
        "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
        "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
        "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
        "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
      ],
      "timing": "Record actual connection, load state and timing for each requested portion.",
      "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
    },
    "depends_on": [
      "physical software keyboard"
    ],
    "substitutions": {
      "build": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      },
      "setup": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "member APIs",
          "test account/data",
          "keyboard/locale",
          "failure controls"
        ],
        "evidence": [],
        "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
      },
      "additional": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "*"
        ],
        "evidence": [],
        "reason": "Tester must record actual additions; none can be established before the device execution."
      }
    },
    "covers": [],
    "finding_ids": [
      "F-04",
      "F-05",
      "F-06"
    ],
    "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
    "steps": [
      "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
      "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
      "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
      "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
      "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
      "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
      "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
    ],
    "result_template": "Result: ___ Build as tested (confirm or note difference): ___ Setup as tested (confirm or note difference): ___ Notes: ___ Screenshot/trace: ___",
    "scope_note": "New fixed-build target acquisition, replacing the earlier unrun plan. Original source/proxy Affects and evidence remain unchanged. Only explicit regression links cover the independent F-06 fix plan.",
    "replaces_check_id": "C-P02",
    "regression_covers": [
      {
        "finding_id": "F-06",
        "regression_id": "DR-F06-D02"
      }
    ],
    "regression_results": []
  },
  {
    "id": "C-FIX-D03",
    "module": 3,
    "required": true,
    "scenario": "Fixed build: Top-tab chrome/keyboard and manual signed coordinates",
    "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
    "actual": "",
    "status": "not_run",
    "evidence": [],
    "reason": "Reserved target check on an unprovisioned fixed build; device, build URL and safe backend unavailable. Actual result/evidence remain empty.",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "software_keyboard",
    "capability_id": "CAP-PHONE",
    "build_id": "B-FIX-PHONE",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "version": "tester must report",
      "os": "tester must report",
      "tab_layout": "Top tabs"
    },
    "conditions": {
      "build_id": "B-FIX-PHONE",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Top tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
      "account_data": "isolated non-production test account, not provisioned yet",
      "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
      "steps": [
        "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
        "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
        "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
        "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
        "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
        "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
        "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
      ],
      "timing": "Record actual connection, load state and timing for each requested portion.",
      "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
    },
    "depends_on": [
      "physical software keyboard"
    ],
    "substitutions": {
      "build": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      },
      "setup": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "member APIs",
          "test account/data",
          "keyboard/locale",
          "failure controls"
        ],
        "evidence": [],
        "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
      },
      "additional": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "*"
        ],
        "evidence": [],
        "reason": "Tester must record actual additions; none can be established before the device execution."
      }
    },
    "covers": [],
    "finding_ids": [
      "F-04",
      "F-05",
      "F-06"
    ],
    "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
    "steps": [
      "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
      "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
      "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
      "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
      "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
      "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
      "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
    ],
    "result_template": "Result: ___ Build as tested (confirm or note difference): ___ Setup as tested (confirm or note difference): ___ Notes: ___ Screenshot/trace: ___",
    "scope_note": "New fixed-build target acquisition, replacing the earlier unrun plan. Original source/proxy Affects and evidence remain unchanged. Only explicit regression links cover the independent F-06 fix plan.",
    "replaces_check_id": "C-P03",
    "regression_covers": [
      {
        "finding_id": "F-06",
        "regression_id": "DR-F06-D03"
      }
    ],
    "regression_results": []
  },
  {
    "id": "C-FIX-D04",
    "module": 3,
    "required": true,
    "scenario": "Fixed build: Primary journey, real Android Back and signed coordinates",
    "expected": "Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.",
    "actual": "",
    "status": "not_run",
    "evidence": [],
    "reason": "Reserved target check on an unprovisioned fixed build; device, build URL and safe backend unavailable. Actual result/evidence remain empty.",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "software_keyboard",
    "capability_id": "CAP-PHONE",
    "build_id": "B-FIX-PHONE",
    "configuration": {
      "browser": "Chrome",
      "device": "Android phone",
      "version": "tester must report",
      "os": "tester must report",
      "tab_layout": "regular tab / gesture navigation"
    },
    "conditions": {
      "build_id": "B-FIX-PHONE",
      "browser": "Chrome",
      "device": "Android phone",
      "state": "regular tab / gesture navigation; narrowest supported available CSS width and 200% enlargement where primary journey specifies",
      "account_data": "isolated non-production test account, not provisioned yet",
      "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
      "steps": [
        "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
        "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
        "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
        "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
        "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
        "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
        "With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.",
        "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
      ],
      "timing": "Record actual connection, load state and timing for each requested portion.",
      "substitutions": "B-FIX-PHONE build: unknown until inspected; setup: independently unknown until confirmed. Local Vite aliases and network interceptions are not inherited."
    },
    "depends_on": [
      "physical software keyboard"
    ],
    "substitutions": {
      "build": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      },
      "setup": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "member APIs",
          "test account/data",
          "keyboard/locale",
          "failure controls"
        ],
        "evidence": [],
        "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
      },
      "additional": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "*"
        ],
        "evidence": [],
        "reason": "Tester must record actual additions; none can be established before the device execution."
      }
    },
    "covers": [],
    "finding_ids": [
      "F-04",
      "F-05",
      "F-06"
    ],
    "setup": "Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.",
    "steps": [
      "Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.",
      "At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.",
      "Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.",
      "Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.",
      "On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.",
      "Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.",
      "With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.",
      "For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone."
    ],
    "result_template": "Result: ___ Build as tested (confirm or note difference): ___ Setup as tested (confirm or note difference): ___ Notes: ___ Screenshot/trace: ___",
    "scope_note": "New fixed-build target acquisition, replacing the earlier unrun plan. Original source/proxy Affects and evidence remain unchanged. Only explicit regression links cover the independent F-06 fix plan.",
    "replaces_check_id": "C-P04",
    "regression_covers": [
      {
        "finding_id": "F-06",
        "regression_id": "DR-F06-D04"
      }
    ],
    "regression_results": []
  },
  {
    "id": "C-FIX-CH-BIRTH-13",
    "module": 3,
    "required": true,
    "scenario": "/birth: Latitude does not request a sign-restricted keypad",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth: Latitude does not request a sign-restricted keypad\", \"passed\": true, \"details\": {\"inputmode\": \"text\", \"limit\": \"OS keyboard not executed; physical entry is handed off.\"}}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/12",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth: Latitude does not request a sign-restricted keypad",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth: Latitude does not request a sign-restricted keypad",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/12",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-06",
        "scope_id": "signed-source-policy"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-CH-BIRTH-14",
    "module": 3,
    "required": true,
    "scenario": "/birth: Longitude does not request a sign-restricted keypad",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth: Longitude does not request a sign-restricted keypad\", \"passed\": true, \"details\": {\"inputmode\": \"text\", \"limit\": \"OS keyboard not executed; physical entry is handed off.\"}}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/13",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth: Longitude does not request a sign-restricted keypad",
    "capability_id": "CAP-FIX-CH",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Chromium",
      "version": "155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Chromium 155.0.8059.12",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth: Longitude does not request a sign-restricted keypad",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json#checks/13",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-06",
        "scope_id": "signed-source-policy"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-13",
    "module": 3,
    "required": true,
    "scenario": "/birth: Latitude does not request a sign-restricted keypad",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth: Latitude does not request a sign-restricted keypad\", \"passed\": true, \"details\": {\"inputmode\": \"text\", \"limit\": \"OS keyboard not executed; physical entry is handed off.\"}}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/12",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth: Latitude does not request a sign-restricted keypad",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth: Latitude does not request a sign-restricted keypad",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/12",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-06",
        "scope_id": "signed-source-policy"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  },
  {
    "id": "C-FIX-WK-BIRTH-14",
    "module": 3,
    "required": true,
    "scenario": "/birth: Longitude does not request a sign-restricted keypad",
    "expected": "Pass the explicit assertions for this saved case at the stated proxy conditions.",
    "actual": "{\"name\": \"/birth: Longitude does not request a sign-restricted keypad\", \"passed\": true, \"details\": {\"inputmode\": \"text\", \"limit\": \"OS keyboard not executed; physical entry is handed off.\"}}",
    "status": "pass",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/13",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
    ],
    "reason": "Local fixed-build proxy only; no native software keyboard, mobile browser UI, physical gesture or assistive-technology claim.",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "/birth: Longitude does not request a sign-restricted keypad",
    "capability_id": "CAP-FIX-WK",
    "build_id": "B-FIX-LOCAL",
    "configuration": {
      "browser": "Playwright WebKit",
      "version": "26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux"
    },
    "conditions": {
      "build_id": "B-FIX-LOCAL",
      "browser": "Playwright WebKit 26.6",
      "device": "Linux desktop host with viewport/media emulation",
      "os": "Linux",
      "state": "/birth: Longitude does not request a sign-restricted keypad",
      "account_data": "Isolated synthetic member@example.invalid fixture state; no real member records.",
      "setup": "Actual saved browser probe and server fixture; per-case viewport, data and mutations are retained in the linked script/output.",
      "steps": [
        "Execute the named saved case against the fixed local fixture; inspect its assertions and result details."
      ],
      "timing": "Case-specific waits/delays in the saved probe; not representative performance measurements.",
      "substitutions": "Named build plus explicit per-check harness additions; no physical keyboard/chrome."
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      },
      "setup": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json#checks/13",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Known isolated synthetic account/data established in the saved probe."
      },
      "additional": {
        "status": "known",
        "items": [
          {
            "boundary": "theme/layout and keyboard-event harness",
            "description": "Explicit .dark class, root font16/32px and viewport stress, canvas conversion of computed colors, Playwright keyboard events and reload; non-font remote requests blocked.",
            "behavior": "replaced",
            "configured_response": "Both themes and declared viewports, literal coordinate strings and real encrypted draft recovery on the client.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "OS software-keyboard keys, native zoom, real phone browser chrome/safe areas, actual server persistence and physical touch."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt"
        ],
        "reason": "Scoped test substitution; it does not qualify the replaced boundary."
      }
    },
    "covers": [
      {
        "finding_id": "F-06",
        "scope_id": "signed-source-policy"
      }
    ],
    "area_ids": [
      1,
      2,
      4,
      10
    ]
  }
]
```

## 4. Recommendations

```json
[]
```

## 5. Changes made

```json
[
  {
    "path": "src/components/pattern/BirthDetailsForm.tsx",
    "finding_ids": [
      "F-04",
      "F-05",
      "F-06"
    ],
    "summary": "Use selected accent foreground for accuracy help, stronger semantic input borders and a full text keyboard hint for signed manual coordinates. Preserve validation, ranges, fields, drafts and submit behavior."
  }
]
```

## 6. Device check script

Budget: 10 entries. Applied device-fix reservation: 4/5.

### C-FIX-D01 [F-06] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-06",
    "regression_id": "DR-F06-D01"
  }
]
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D02 [F-06] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Bottom tabs'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-06",
    "regression_id": "DR-F06-D02"
  }
]
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D03 [F-06] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Top tabs'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-06",
    "regression_id": "DR-F06-D03"
  }
]
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D04 [F-06] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / gesture navigation'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-06",
    "regression_id": "DR-F06-D04"
  }
]
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.
8. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D05 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / VoiceOver'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn VoiceOver on. Read the headline and content in order, use Today section links and check-in radios; report names, group/value announcements and focus after selection.
3. Type a test reflection, submit once to the confirmed backend and inspect pending/error/confirmed announcements. Navigate to Journal and back, open/close the navigation disclosure, inspect chapter collapse/inert content and field/helper descriptions.
4. Record rotor destinations, reading order, focus destination/return, keyboard focus visibility, and any silent errors. Do not infer TalkBack behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D06 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / TalkBack'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn TalkBack on. Read Today in order, use section shortcuts and each radio group; record names, values and selected state.
3. Enter and save one test note only after test-backend confirmation; record pending/error/confirmed announcements and navigation to Journal and back.
4. Test the menu with Android Back, chapter collapse, error/helper descriptions, and focus restoration. Record failures separately; do not infer VoiceOver behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D07 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / recovery'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type a unique test reflection and a separate Journal draft. Wait for the device-draft confirmation; background the tab, trigger a genuine tab discard/reload if available, then return and compare every field. State explicitly if you only reloaded.
3. With a confirmed test backend supporting a controlled lost-ack scenario, save once while the backend applies the mutation but the acknowledgement is withheld. If this setup is unavailable, leave this portion not run.
4. Use Check save/reconciliation and compare canonical saved test records; ensure no duplicate entry and preserve any newer typing. Restore connectivity and inspect draft state; report each portion independently.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D08 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / recovery'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type unique test Today and Journal drafts. Wait for local-draft status, background and genuinely discard the tab if available, reopen and compare fields; distinguish reload from discard.
3. Use the isolated backend controlled lost-ack setup to apply one mutation then withhold its response; if not provisioned, leave this portion not run.
4. Run Check save and compare canonical test records and duplicate counts. Confirm newer text remains; restore connectivity and record each result separately.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D09 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / measured performance'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Safari Web Inspector to this actual device; record hardware, OS/browser, connection, cache and CPU conditions. Use a production-mode test build with this exact source and record all service/build differences.
3. Record comparable navigation and principal interactions with Web Inspector timelines. Report available LCP, layout-shift and interaction/long-task measurements with traces and tool support limits; write not measured for unsupported metrics.
4. Record loading, tap feedback, keyboard and navigation delays on the actual device. Do not label a single lab trace field performance or call an arbitrary tap duration INP.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-FIX-D10 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / measured performance'}

Build: B-FIX-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "app bootstrap/build",
      "member APIs",
      "authentication",
      "model provider",
      "billing APIs"
    ],
    "evidence": [],
    "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "member APIs",
      "test account/data",
      "keyboard/locale",
      "failure controls"
    ],
    "evidence": [],
    "reason": "Test backend, account/data, keyboard, locale and any failure controls have not been provisioned or inspected."
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "*"
    ],
    "evidence": [],
    "reason": "Tester must record actual additions; none can be established before the device execution."
  }
}
```

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Chrome remote debugging to the actual phone; record hardware, OS/browser, network, cache and throttle conditions. Use a production-mode test build with this exact source, documenting service/build differences.
3. Collect a Performance panel navigation and scripted/manual principal-interaction trace. Report measured lab LCP/CLS and event/INP diagnostics where available; attach trace and collection conditions.
4. Record representative mid-range hardware behavior, loading/tap feedback and long tasks. Separate these lab observations from field percentiles and do not infer Safari behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

Beyond budget (titles only):

- Safari external-pointer reproduction of historical F-02 under all original timing conditions
- Complete populated placements/aspects comparison with screen reader
- Saved-data autofill/password-manager and IME combinations beyond the primary device entries
- Independent installed/PWA-mode audit if that display mode becomes supported

## 7. Open questions

- Ceiling proxy: Linux Chromium155.0.8059.12 and Playwright WebKit26.6. WebKit is not Safari. No real software keyboard, browser chrome, safe-area/system gestures, touch feel or screen-reader execution.
- Services/bootstrap are synthetic and replaced at the documented boundaries. Some main fixture defaults return {ok:true}; only the separately explicit birth adapter qualifies synthetic save/readback UI behavior. No real backend, payment, authentication, model, ephemeris or production persistence qualification.
- Production build passed, but browser checks used a development fixture with eager imports and replaced bootstrap/head. No new performance measurements; earlier development acquisition timed out. No LCP/INP/CLS/TBT or field percentile claim.
- Root-font32px/desktop page-scale and synthetic visualViewport are stress proxies, not physical phone text/page zoom or actual OS keyboard.
- All24 current axe states report zero violations; one WebKit birth-manual-dark color-contrast node remains incomplete/manual review. Specific helper/boundary calculations pass; this does not establish whole WCAG conformance.
- F-04/F-05/F-06 remain implemented. Original543 checks, finding scopes/evidence, historical failures and earlier F-01/F-02/F-03 history are preserved. Proxy passes do not supersede target gates.
- B-FIX-PHONE and safe backend are unprovisioned. All10 device entries remain not_run, actual/evidence blank. No commit, push or deploy performed.
- Full generated reading/content quality, populated dense natal tables, assistants/admin-content and live checkout remain excluded.
- Provision a phone-reachable non-production B-FIX-PHONE containing the exact source/patch identity, with independently confirmed safe backend and account. No deployment is authorized in this turn.
- Run C-FIX-D01 through C-FIX-D04 first; record each signed-entry/device regression portion separately. Do not promote desktop mechanism observations into phone defects/results.
- Run C-FIX-D05 through C-FIX-D10 as available; return actual model/OS/browser/build/setup, notes and screenshots/traces. Leave unavailable portions explicitly unrun.
- For field performance, supply origin, collection window and RUM/CrUX access; device lab traces are not field percentiles.
- F-04: confirmed finding is implemented
- F-05: confirmed finding is implemented
- F-06: confirmed finding is implemented
- F-06/DR-F06-D01: device regression target verification not_run
- F-06/DR-F06-D02: device regression target verification not_run
- F-06/DR-F06-D03: device regression target verification not_run
- F-06/DR-F06-D04: device regression target verification not_run
- area 8: not tested
- C-CH-AXE-05: current recorded failure
- C-CH-AXE-06: current recorded failure
- C-CH-AXE-07: current recorded failure
- C-CH-EMPTY-LIGHT: current recorded failure
- C-CH-EMPTY-DARK: current recorded failure
- C-WK-AXE-05: current recorded failure
- C-WK-AXE-06: current recorded failure
- C-WK-AXE-07: current recorded failure
- C-WK-EMPTY-LIGHT: current recorded failure
- C-WK-EMPTY-DARK: current recorded failure
- C-SOURCE-SIGNED: current recorded failure
- C-CH-AXE-05: required verification incomplete
- C-CH-AXE-06: required verification incomplete
- C-CH-AXE-07: required verification incomplete
- C-CH-EMPTY-LIGHT: required verification incomplete
- C-CH-EMPTY-DARK: required verification incomplete
- C-WK-AXE-05: required verification incomplete
- C-WK-AXE-06: required verification incomplete
- C-WK-AXE-07: required verification incomplete
- C-WK-EMPTY-LIGHT: required verification incomplete
- C-WK-EMPTY-DARK: required verification incomplete
- C-SOURCE-SIGNED: required verification incomplete
- C-LAB-ACQUISITION: required verification incomplete
- C-P01: required verification incomplete
- C-P02: required verification incomplete
- C-P03: required verification incomplete
- C-P04: required verification incomplete
- C-P05: required verification incomplete
- C-P06: required verification incomplete
- C-P07: required verification incomplete
- C-P08: required verification incomplete
- C-P09: required verification incomplete
- C-P10: required verification incomplete
- C-FIX-D01: required verification incomplete
- C-FIX-D02: required verification incomplete
- C-FIX-D03: required verification incomplete
- C-FIX-D04: required verification incomplete
- C-FIX-D05: required verification incomplete
- C-FIX-D06: required verification incomplete
- C-FIX-D07: required verification incomplete
- C-FIX-D08: required verification incomplete
- C-FIX-D09: required verification incomplete
- C-FIX-D10: required verification incomplete
- Unresolved failed command: Throttled Chromium development-harness lab navigation, CPU4x/network200000Bps/150ms

## Run provenance

```json
{
  "capabilities": [
    {
      "id": "CAP-SOURCE",
      "environment": "static_review",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
      ],
      "reason": "Read actual project instructions, context, source, fixtures and dirty state."
    },
    {
      "id": "CAP-NODE",
      "environment": "automated_test",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/birth-place-tests.txt"
      ],
      "reason": "12 existing birth/place tests executed and passed on current files."
    },
    {
      "id": "CAP-CH",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-today-390.png"
      ],
      "reason": "Actual target fixture rendered in Linux Chromium 155.0.8059.12, mobile media/viewport."
    },
    {
      "id": "CAP-WK",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-today-390.png"
      ],
      "reason": "Actual target fixture rendered in Playwright WebKit 26.6 on Linux; not Safari."
    },
    {
      "id": "CAP-SIM",
      "environment": "os_simulator",
      "driver": "agent",
      "status": "unavailable",
      "evidence": [],
      "reason": "No iOS or Android OS runtime or simulator interface is exposed."
    },
    {
      "id": "CAP-PHONE",
      "environment": "physical_device",
      "driver": "person",
      "status": "unavailable",
      "evidence": [],
      "reason": "No physical-device connector, reported execution or human device results were supplied."
    },
    {
      "id": "CAP-FIELD",
      "environment": "field_data",
      "driver": "agent",
      "status": "unavailable",
      "evidence": [],
      "reason": "No production origin, RUM/CrUX access or field metrics supplied; no field acquisition tool available for this target."
    },
    {
      "id": "CAP-FIX-CH",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/inspect-chromium.json"
      ],
      "reason": "Actual fixed fixture executed in Linux Chromium 155.0.8059.12; viewport/media/keyboard-event proxy, no physical phone or Safari claim."
    },
    {
      "id": "CAP-FIX-WK",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/inspect-webkit.json"
      ],
      "reason": "Actual fixed fixture executed in Linux Playwright WebKit 26.6; viewport/media/keyboard-event proxy, no physical phone or Safari claim."
    },
    {
      "id": "CAP-FIX-NODE",
      "environment": "automated_test",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/npm-test.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/build.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/typecheck.txt"
      ],
      "reason": "Commands completed with exit0; full test summary1209pass/4skip/0fail, production build and compiler passed."
    }
  ],
  "builds": [
    {
      "id": "B-SOURCE",
      "description": "Current app source at c4c38208f5304cbf76e06606f24e82a50fae60e3; exact baseline hashes retained.",
      "contains_fixes": [],
      "substitutions": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/birth-place-tests.txt"
        ],
        "reason": "Source inspection and Node pure-module tests use current files with no patched application module."
      }
    },
    {
      "id": "B-PROXY",
      "description": "Loopback Vite development fixture compiled from the unchanged current app source; not a production build.",
      "contains_fixes": [],
      "substitutions": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    {
      "id": "B-PHONE-C4C3820",
      "description": "Reserved, unprovisioned non-production phone build of this exact source revision; current open findings remain present. No URL, source confirmation or backend confirmation yet.",
      "contains_fixes": [],
      "substitutions": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      }
    },
    {
      "id": "B-FIX-LOCAL",
      "description": "Current local app source at base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the recorded BirthDetailsForm patch; source SHA256 cab0ae46b74f280489009b69faaa7bec507cdfc0d157a43d0b17641ad74606de. Vite development fixture, not a deployed build.",
      "contains_fixes": [
        "F-04",
        "F-05",
        "F-06"
      ],
      "substitutions": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    {
      "id": "B-FIX-PHONE",
      "description": "Reserved unprovisioned phone-reachable non-production build containing the exact F-04/F-05/F-06 final source patch. No deployment or phone URL exists. Confirm source/diff manifest and setup before writes.",
      "contains_fixes": [
        "F-04",
        "F-05",
        "F-06"
      ],
      "substitutions": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "app bootstrap/build",
          "member APIs",
          "authentication",
          "model provider",
          "billing APIs"
        ],
        "evidence": [],
        "reason": "No phone-reachable build has been provisioned. Confirm an isolated backend, source identity and exact build wiring before any writes."
      }
    },
    {
      "id": "B-FIX-SUBMISSION",
      "description": "Same fixed real client source with an additional explicit synthetic birth-save/readback service at loopback port4225; no real backend persistence or chart computation qualified.",
      "contains_fixes": [
        "F-04",
        "F-05",
        "F-06"
      ],
      "substitutions": {
        "status": "known",
        "items": [
          {
            "boundary": "member/auth/model/billing server functions",
            "description": "Compile-time imports redirected to tests/helpers/mobile-ui/services.ts; member@example.invalid and mobile-audit-member only. The default switch returns {ok:true} for otherwise unimplemented service methods.",
            "behavior": "replaced",
            "configured_response": "Synthetic Today reading, two natal chapters, one Journal entry, membership flag, fixed Paris birth record, sessionStorage-backed pretend server, no live server/model/ephemeris/payment calls.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Real auth/session revocation, billing/checkout, model output, Swiss data and backend persistence. A default {ok:true} does not qualify an unimplemented service."
          },
          {
            "boundary": "application bootstrap/SSR",
            "description": "Audit Vite configFile:false/envFile:false mounts tests/helpers/mobile-ui/main.tsx; fixture root/head and eager route imports replace the deployed TanStack bootstrap.",
            "behavior": "replaced",
            "configured_response": "Same route components, RouteFocus, Shell, styles, MemberDraftProvider and Toaster; fixture HTML viewport matches the inspected source declaration.",
            "real_components": "Current application routes, controls, CSS, router, draft controller and encrypted IndexedDB client unless explicitly listed otherwise.",
            "untested": "Production SSR/hydration, route chunking, deployed environment, CSP, production font/network timing."
          },
          {
            "boundary": "birth save/readback server functions",
            "description": "submission-services.ts replaces saveBirthProfile and fetchBirthRecord with a revisioned synthetic sessionStorage record and complete changeSummary.",
            "behavior": "replaced",
            "configured_response": "Valid numeric coordinates and accepted accuracy/date/time saved in a synthetic record; range/revision rejection and controlled failure/750ms pending responses.",
            "real_components": "Current routes, real form/draft/router client and CSS.",
            "untested": "Real authentication, persistence/encryption, concurrent server writes, ephemeris, UTC/chart correctness and production save behavior."
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/submission-services.ts",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/submission-server.mjs"
        ],
        "reason": "Scoped test substitution, not evidence for the real replaced boundary."
      }
    },
    {
      "id": "B-FIX-SOURCE",
      "description": "Unsubstituted current files for local source, compiler, lint, unit and production-build commands; exact BirthDetailsForm hash in source-identity.json.",
      "contains_fixes": [
        "F-04",
        "F-05",
        "F-06"
      ],
      "substitutions": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json"
        ],
        "reason": "No application file patching for these commands. Individual unit-test stubs remain declared by their own test cases."
      }
    }
  ],
  "modules": [
    {
      "id": 1,
      "name": "Principal journey and mobile UX",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 2,
      "name": "Viewport, browser chrome and safe areas",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 3,
      "name": "Virtual keyboard and forms",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 4,
      "name": "Touch targets, reach and feedback",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 5,
      "name": "Overlays, navigation and data",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 6,
      "name": "Gestures and scrolling",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Applicable source/proxy checks executed; target platform behavior remains unrun where listed."
    },
    {
      "id": 7,
      "name": "Performance, pending states and recovery",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-webkit.json"
      ],
      "reason": "Reviewed for applicability and deepened against actual source and synthetic member journey. Module 7 performance acquisition failed; device/field gaps remain explicit."
    }
  ],
  "commands": [
    {
      "kind": "workflow",
      "command": "/home/ubuntu/.agents/skills/impeccable/scripts/impeccable context --target src/routes/index.tsx",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
      ],
      "reason": "Loaded once in this live project session."
    },
    {
      "kind": "shell",
      "command": "/home/ubuntu/.agents/skills/impeccable/scripts/impeccable detect src --json",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/impeccable-detect.json"
      ],
      "reason": "Exit 0, no primary source detector hits."
    },
    {
      "kind": "shell",
      "command": "node output/playwright/mobile-ux-audit-20261021/fixture-server.mjs",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/server.log",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/preflight.json"
      ],
      "reason": "Loopback-only owned Vite fixture launched and rendered."
    },
    {
      "kind": "shell",
      "command": "node --test tests/birth-form.test.mjs tests/place-lookup.test.mjs",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/birth-place-tests.txt"
      ],
      "reason": "12/12 existing tests passed."
    },
    {
      "kind": "browser",
      "command": "Playwright CLI named Chromium and WebKit sessions: core, layout, inspect, forms, overlays, route-focus, scroll, focused-v2 and chapters",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/core-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/core-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/layout-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/layout-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json"
      ],
      "reason": "Every result inspected; passing interaction/layout checks do not erase the measured contrast failures."
    },
    {
      "kind": "browser",
      "command": "focused-v1: Playwright check() on sr-only birth accuracy input, both engines",
      "status": "failed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-chromium.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-webkit.txt"
      ],
      "reason": "Harness directly targeted a hidden input rather than its visible label; no application activation failure established. Original errors retained.",
      "resolved_by": "focused-v2 uses native visible label activation; both engines completed all three behavioral assertions."
    },
    {
      "kind": "browser",
      "command": "Throttled Chromium development-harness lab navigation, CPU4x/network200000Bps/150ms",
      "status": "failed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/lab-chromium.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/lab.cases.txt"
      ],
      "reason": "45s networkidle timeout. No usable metric payload and no production defect claim. Performance acquisition remains unresolved."
    },
    {
      "kind": "shell",
      "command": "python3 installed mobile-web-ux-runner 2.0.1 scripts/run_state.py check run.json",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/ledger-validation-initial.json"
      ],
      "reason": "Initial exit3 is structurally valid but incomplete; no schema errors. Current defects, unrun phone checks and performance limit intentionally remain."
    },
    {
      "kind": "shell",
      "command": "Close named Playwright audit sessions; verify/stop owned Vite process; compare baseline file hashes and Git status excluding owned audit artifacts",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/cleanup.json"
      ],
      "reason": "Owned server stopped after PID command/cwd verification; both named audit browsers closed. All 2550 pre-existing file hashes, non-owned Git status, HEAD and prior ledger unchanged. Owned run/report artifacts retained."
    },
    {
      "kind": "shell",
      "command": "npm test",
      "status": "completed",
      "exit_code": 0,
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/npm-test.txt"
      ],
      "reason": "1213 total:1209 passed,4 skipped,0 failed. Existing opt-in workerd/parity replay skips retained."
    },
    {
      "kind": "shell",
      "command": "npx tsc --noEmit",
      "status": "completed",
      "exit_code": 0,
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/typecheck.txt"
      ],
      "reason": "Exit0."
    },
    {
      "kind": "shell",
      "command": "npx eslint src/components/pattern/BirthDetailsForm.tsx",
      "status": "completed",
      "exit_code": 0,
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/eslint.txt"
      ],
      "reason": "Exit0."
    },
    {
      "kind": "shell",
      "command": "npx prettier --check src/components/pattern/BirthDetailsForm.tsx",
      "status": "completed",
      "exit_code": 0,
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/prettier.txt"
      ],
      "reason": "Exit0."
    },
    {
      "kind": "shell",
      "command": "npm run build",
      "status": "completed",
      "exit_code": 0,
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/build.txt"
      ],
      "reason": "Exit0; native config/path/deprecation, route splitting, chunk size and inlineDynamicImports warnings retained; build only, no deployment."
    },
    {
      "kind": "browser",
      "command": "Playwright CLI named sessions pattern-mobile-fixes-ch and pattern-mobile-fixes-wk; focused red/green, core, today-forms, layout, inspect and synthetic birth submission probes",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/run-browser.py",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/run-regressions.py",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-remediation-v2.cases.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-submission.cases.txt"
      ],
      "reason": "Current counts above; copied but unexecuted scroll/overlay/chapter/route-focus scripts do not represent new checks."
    }
  ],
  "cleanup": {
    "status": "done",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/cleanup.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/fixture-stop.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/browser-close.json"
    ],
    "reason": "Stopped only verified owned fixture processes and named browser sessions. All2553 unrelated baseline files/status and original audit preserved; HEAD unchanged. Recovery/evidence retained. No commit/push/deploy."
  },
  "history": [
    {
      "at": "2026-10-21T02:06:19.975400+00:00",
      "event": "fresh_audit",
      "reason": "Default audit_only mode; current source rechecked. Prior immutable run retained separately; no status/history mutation."
    },
    {
      "at": "2026-10-21T02:06:19.975427+00:00",
      "event": "harness_correction",
      "reason": "focused-v1 hidden-radio targeting failed; original scripts/errors retained. focused-v2 uses the visible label, not forced input activation."
    },
    {
      "at": "2026-10-21T02:09:25.467082+00:00",
      "event": "owned_artifact_inventory_correction",
      "reason": "Initial inventory was captured after ledger init, so it included this run owned run.json. Growth of that owned ledger and new report artifacts are expected; preservation checks compare all pre-existing files and all non-owned Git entries.",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/cleanup-initial.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/cleanup.json"
      ]
    },
    {
      "at": "2026-10-21T02:16:08.485850+00:00",
      "event": "authorized_remediation_continuation",
      "parent_run": {
        "path": "/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T015453Z-b20f378d/run.json",
        "run_id": "20261021T015453Z-b20f378d",
        "sha256": "607707742a0437fe370dba6bef9c1053a1a213598aaebcb061b77ca4c7f05536"
      },
      "prior_mode": "audit_only",
      "current_mode": "audit_and_fix",
      "reason": "User explicitly requested all three fixes and signed-coordinate application with device handoff. Old ledger/checks/scopes/evidence remain immutable."
    },
    {
      "at": "2026-10-21T02:16:32.408218+00:00",
      "event": "fixes_applied",
      "finding_ids": [
        "F-04",
        "F-05",
        "F-06"
      ],
      "source_identity": {
        "base_commit": "c4c38208f5304cbf76e06606f24e82a50fae60e3",
        "source_file": "/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx",
        "source_sha256": "cab0ae46b74f280489009b69faaa7bec507cdfc0d157a43d0b17641ad74606de",
        "patch_sha256": "ee96f1f99bb7b16f3a8bf0e4155d23d593a73c6bc770394e649fa96d2a0112d0",
        "contains_fixes": [
          "F-04",
          "F-05",
          "F-06"
        ],
        "build": "B-FIX-LOCAL",
        "phone_build": "B-FIX-PHONE unprovisioned"
      },
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch"
      ]
    },
    {
      "at": "2026-10-21T02:24:52.974970+00:00",
      "event": "post_fix_verification",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-red-v2-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-red-v2-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/npm-test.txt"
      ],
      "results": {
        "behavioral_assertions": 215,
        "layout_states": 216,
        "focus_states": 88,
        "axe_states": 24,
        "axe_violations": 0,
        "axe_incomplete_nodes": 1,
        "long_url_and_reduced_motion": 4,
        "focused_birth_geometry_states": 40,
        "unit_tests": {
          "total": 1213,
          "pass": 1209,
          "skip": 4,
          "fail": 0
        },
        "compiler_lint_format_build": "pass",
        "red_green": {
          "per_engine": {
            "red_total": 66,
            "red_pass": 42,
            "red_expected_fail": 24,
            "green_pass": 66
          },
          "failures": "16 selected helper +4 empty boundary +4 sign-restricted keyboard-hint assertions perengine, across bothroutes."
        },
        "scope": "215 assertions includes40 focused birth geometry assertions; broad216 layout and88 focus states are separate.",
        "automated_accessibility_limit": "One incomplete/manual color-contrast node in WebKit; zero reported violations.",
        "independent_review": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/independent-review.md"
      },
      "reason": "Source remained unchanged during red probes; corrected mobile16px/desktop14px harness expectation before source application. v1 erroneous desktop font expectation and all original output retained. No source-string assertion or forced hidden-radio activation used by current tests."
    }
  ]
}
```
