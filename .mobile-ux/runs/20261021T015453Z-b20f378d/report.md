Ceiling: proxy (automated_test, desktop_emulation, static_review); limits: field_data unavailable, os_simulator unavailable, physical_device unavailable, no available simulator or physical device; assessment incomplete; verification failed.

# Mobile UX audit — 20261021T015453Z-b20f378d

## 1. Verdict

Mode: audit_only. Principal task: Read Today, record an optional check-in, review Journal, and navigate Pattern and account settings on mobile.
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
  }
]
```

| Area | Disposition | Environments used | Highest level | What remains |
| --- | --- | --- | --- | --- |
| 1. Reach and placement | no_defect_found | desktop_emulation | proxy | C-P01 through C-P04: actual grip/reach/missed taps |
| 2. Viewport and safe areas | no_defect_found | desktop_emulation, static_review | proxy | C-P01 through C-P04: real chrome, notch/home/gesture insets and keyboard transitions |
| 3. Touch targets | no_defect_found | desktop_emulation | proxy | C-P01 through C-P04: physical tap feedback and grip; current measured primary controls meet the tested floor |
| 4. Forms and keyboard | defects_found | automated_test, desktop_emulation, static_review | proxy | C-P01 through C-P04: software keyboards, focus zoom and signed entry; C-P05/C-P06: actual assistive technology |
| 5. Gestures and scrolling | no_defect_found | desktop_emulation, static_review | proxy | C-P01 through C-P04: native swipes, pinch, system edges and real overscroll |
| 6. Overlays, navigation and dense data | no_defect_found | desktop_emulation | proxy | C-P04: Android system Back; C-P05/C-P06: assistive navigation; full populated dense tables beyond budget |
| 7. Content priority | no_defect_found | desktop_emulation | proxy | Actual generated/member content and longer records remain outside synthetic reading qualification |
| 8. Performance | not_tested |  | none | C-P09/C-P10: actual device traces on production-mode test builds; production RUM/CrUX origin/window/access missing |
| 9. Errors and recovery | no_defect_found | automated_test, desktop_emulation | proxy | C-P07/C-P08: genuine tab discard and test-backend lost acknowledgements; real backend/session behavior missing |
| 10. Accessibility on mobile | defects_found | desktop_emulation, static_review | proxy | C-P05/C-P06: VoiceOver/TalkBack; C-P01 through C-P04: native zoom/keyboard/insets |

## 3. Findings by severity

### F-04: Selected birth-time accuracy helper fails minimum text contrast

P2 · observed · **open**

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
    "applied": false,
    "device_dependent": false,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Use the existing accent foreground for the helper when its accuracy option is selected; retain muted foreground for unselected options. Recheck all four selections in both themes; preserve labels and native radios."
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
  }
]
```

### F-05: Empty birth inputs lack a sufficiently contrasting visual boundary

P2 · observed · **open**

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
    "applied": false,
    "device_dependent": false,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Give BirthDetailsForm inputClass a stronger existing semantic border token, as TodayCheckIn already does with border-muted-foreground. Verify unfocused/focused/error/disabled states in both themes and narrow/enlarged layouts. Review similar blank auth inputs as a related location; do not globally darken decorative rules or automatically classify filled selects as criterion failures."
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
  }
]
```

### F-06: Signed coordinate fields request a keypad that may omit minus

P2 · code_supported · **open**

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
    "applied": false,
    "device_dependent": true,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Proposed only: retain text inputs and use a full text keyboard hint for manual signed coordinates, or provide an explicit accessible sign control after target investigation. Preserve valid negatives, decimals, coordinate ranges and timezone strings; never replace with an unsigned numeric keypad. Run C-P01 through C-P04 before choosing a device-specific alternative."
  },
  "contrary_evidence": null,
  "status_history": null
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
  }
]
```

## 4. Recommendations

```json
[]
```

## 5. Changes made

No source edits authorized in this mode.

## 6. Device check script

Budget: 10 entries. Applied device-fix reservation: 0/5.

### C-P01 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P02 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Bottom tabs'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P03 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Top tabs'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P04 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / gesture navigation'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P05 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / VoiceOver'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn VoiceOver on. Read the headline and content in order, use Today section links and check-in radios; report names, group/value announcements and focus after selection.
3. Type a test reflection, submit once to the confirmed backend and inspect pending/error/confirmed announcements. Navigate to Journal and back, open/close the navigation disclosure, inspect chapter collapse/inert content and field/helper descriptions.
4. Record rotor destinations, reading order, focus destination/return, keyboard focus visibility, and any silent errors. Do not infer TalkBack behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P06 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / TalkBack'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn TalkBack on. Read Today in order, use section shortcuts and each radio group; record names, values and selected state.
3. Enter and save one test note only after test-backend confirmation; record pending/error/confirmed announcements and navigation to Journal and back.
4. Test the menu with Android Back, chapter collapse, error/helper descriptions, and focus restoration. Record failures separately; do not infer VoiceOver behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P07 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / recovery'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type a unique test reflection and a separate Journal draft. Wait for the device-draft confirmation; background the tab, trigger a genuine tab discard/reload if available, then return and compare every field. State explicitly if you only reloaded.
3. With a confirmed test backend supporting a controlled lost-ack scenario, save once while the backend applies the mutation but the acknowledgement is withheld. If this setup is unavailable, leave this portion not run.
4. Use Check save/reconciliation and compare canonical saved test records; ensure no duplicate entry and preserve any newer typing. Restore connectivity and inspect draft state; report each portion independently.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P08 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / recovery'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type unique test Today and Journal drafts. Wait for local-draft status, background and genuinely discard the tab if available, reopen and compare fields; distinguish reload from discard.
3. Use the isolated backend controlled lost-ack setup to apply one mutation then withhold its response; if not provisioned, leave this portion not run.
4. Run Check save and compare canonical test records and duplicate counts. Confirm newer text remains; restore connectivity and record each result separately.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P09 [] {'browser': 'Safari', 'device': 'iPhone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'Compact tabs / measured performance'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Safari Web Inspector to this actual device; record hardware, OS/browser, connection, cache and CPU conditions. Use a production-mode test build with this exact source and record all service/build differences.
3. Record comparable navigation and principal interactions with Web Inspector timelines. Report available LCP, layout-shift and interaction/long-task measurements with traces and tool support limits; write not measured for unsupported metrics.
4. Record loading, tap feedback, keyboard and navigation delays on the actual device. Do not label a single lab trace field performance or call an arbitrary tap duration INP.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-P10 [] {'browser': 'Chrome', 'device': 'Android phone', 'version': 'tester must report', 'os': 'tester must report', 'tab_layout': 'regular tab / measured performance'}

Build: B-PHONE-C4C3820
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

Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Steps:
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Chrome remote debugging to the actual phone; record hardware, OS/browser, network, cache and throttle conditions. Use a production-mode test build with this exact source, documenting service/build differences.
3. Collect a Performance panel navigation and scripted/manual principal-interaction trace. Report measured lab LCP/CLS and event/INP diagnostics where available; attach trace and collection conditions.
4. Record representative mid-range hardware behavior, loading/tap feedback and long tasks. Separate these lab observations from field percentiles and do not infer Safari behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.

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

- Ceiling proxy: Linux Chromium 155.0.8059.12 and Playwright WebKit 26.6. WebKit is not Safari. No native keyboard, mobile chrome, real insets, system gestures, physical touch feel or screen-reader execution.
- All server/member/auth/model/billing/ephemeris services are synthetic. Some fixture service defaults return {ok:true}; unimplemented methods are unqualified. No production writes performed.
- Fixture bootstrap/head/eager imports replace production SSR and chunking. Performance acquisition timed out; LCP, INP, CLS, TBT and field percentiles are not measured.
- 200% root-font stress is not native page/text enlargement; desktop Back and Escape are not Android system Back.
- Original F-01/F-02/F-03 ledger, statuses, failures and device plans remain unchanged. Current proxy passes neither verify those fixes nor refute prior intermittent observations.
- Phone build and safe test backend are not provisioned; all 10 device entries remain not_run with blank actuals and no evidence.
- No full populated natal placement/aspect table, connected-assistant, admin-content, live checkout or actual generated-reading quality qualification.
- Review/apply the two ordinary scoped color proposals only if source edits are requested.
- Acquire C-P01 through C-P04 software-keyboard evidence before narrowing F-06 scope or selecting a device-specific alternative.
- Provision the named safe phone build/backend and run the ten planned entries, recording actual versions, widths, build and setup separately.
- Supply a production origin, collection window and RUM/CrUX access for field performance; failed development acquisition cannot replace it.
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
    }
  ],
  "cleanup": {
    "status": "done",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/cleanup.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/close-chromium.txt",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/close-webkit.txt"
    ],
    "reason": "Owned server stopped after PID command/cwd verification; both named audit browsers closed. All 2550 pre-existing file hashes, non-owned Git status, HEAD and prior ledger unchanged. Owned run/report artifacts retained."
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
    }
  ]
}
```
