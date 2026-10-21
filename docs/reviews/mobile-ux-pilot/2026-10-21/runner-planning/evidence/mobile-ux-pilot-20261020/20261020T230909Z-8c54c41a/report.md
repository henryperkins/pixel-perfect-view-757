Ceiling: proxy (automated_test, desktop_emulation, static_review); limits: field_data not_checked, os_simulator unavailable, physical_device not_checked, physical_device unavailable, no available simulator or physical device; assessment complete; verification failed.

# Mobile UX audit — 20261020T230909Z-8c54c41a

## 1. Verdict

Mode: audit_only. Principal task: Read Today, record a check-in with a reflection note, recover interrupted work, and revisit the saved state.
Open P0/P1: none recorded.
Evidence declarations are not independently authenticated by the helper.

## 2. Coverage

Standing substitutions (scoped to environment/build):
```json
[
  {
    "id": "SS-STRIPE",
    "environments": [
      "desktop_emulation"
    ],
    "build_ids": [
      "B-PILOT"
    ],
    "status": "known",
    "items": [
      {
        "boundary": "Stripe external resources",
        "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
        "behavior": "replaced",
        "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
        "real_components": "All Today/check-in components and synthetic member services",
        "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
      }
    ],
    "unknown_boundaries": [],
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
    ],
    "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
  }
]
```

| Area | Disposition | Environments used | Highest level | What remains |
| --- | --- | --- | --- | --- |
| 1. Reach and placement | defects_found | desktop_emulation | proxy | C-D01 through C-D04: real grips and touch reach; exact 320px physical configuration beyond budget if unavailable |
| 2. Viewport and safe areas | no_defect_found | desktop_emulation | proxy | C-D01 through C-D04: actual browser chrome, insets, orientation and text settings |
| 3. Touch targets | defects_found | desktop_emulation | proxy | C-D01 through C-D04: physical activation/reach; 44px ergonomic guidance is separate from the 24px AA floor |
| 4. Forms and keyboard | defects_found | desktop_emulation | mechanism | C-D01 through C-D04: real software keyboard and focus zoom; privacy prose has no saved-data autofill requirement |
| 5. Gestures and scrolling | defects_found | desktop_emulation | proxy | C-D01 through C-D04: real rubber-banding, pull-to-refresh, edge gestures and pinch |
| 6. Overlays, navigation and dense data | defects_found | desktop_emulation | proxy | C-D04: actual Android Back; C-D05/C-D06: AT route context. Dense tables are outside Today/check-in scope. |
| 7. Content priority | no_defect_found | desktop_emulation | proxy | C-D05/C-D06: reading order with AT; synthetic text does not qualify live writing |
| 8. Performance | no_defect_found | static_review | mechanism | C-D09/C-D10: real-device optimized-build traces. Field LCP/INP/CLS and production latency not tested. |
| 9. Errors and recovery | no_defect_found | automated_test, desktop_emulation | proxy | C-D07/C-D08: real interruption. Real server persistence, encryption and outcome-unknown HTTP responses require an isolated real backend; unavailable here. |
| 10. Accessibility on mobile | defects_found | desktop_emulation | proxy | C-D05/C-D06: actual VoiceOver/TalkBack. Automated scan success is not WCAG conformance. |

## 3. Findings by severity

### F-01: Reflection textarea boundary contrast is too low in light and dark themes

P2 · observed · **open**

Where: src/styles.css:89 and :127; src/components/pattern/TodayCheckIn.tsx:455. Expected: The enabled text-entry field is visually identifiable at >=3:1 against adjacent colors. Actual: Light border/outer 1.29:1; dark 1.88:1. Fill/outer is only 1.08:1 / 1.05:1. The low-contrast outline/fill is the field shape; disabled and unmodified native-control exceptions do not apply. Text and focus indicators remain usable..
Cause: Shared --input token and a near-background card fill provide insufficient resting-state field contrast.. Disposition reason: Audit only; no implementation authorized. R2 P2 means substantial friction with a usable workaround. No physical-device scope is claimed.

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "chromium-light",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "chromium 149.0.7827.55",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "Enabled, unfocused reflection note; light theme",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Load Today with synthetic test member",
          "Find Reflection note",
          "Leave the field unfocused and measure boundary/fill against surrounding form background"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    },
    {
      "id": "chromium-dark",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "chromium 149.0.7827.55",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "Enabled, unfocused reflection note; dark theme",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Load Today with synthetic test member",
          "Find Reflection note",
          "Leave the field unfocused and measure boundary/fill against surrounding form background"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    },
    {
      "id": "webkit-light",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "webkit 26.6",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "Enabled, unfocused reflection note; light theme",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Load Today with synthetic test member",
          "Find Reflection note",
          "Leave the field unfocused and measure boundary/fill against surrounding form background"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    },
    {
      "id": "webkit-dark",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "webkit 26.6",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "Enabled, unfocused reflection note; dark theme",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Load Today with synthetic test member",
          "Find Reflection note",
          "Leave the field unfocused and measure boundary/fill against surrounding form background"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    }
  ],
  "refuted_scopes": [],
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-baseline.json",
      "level": "mechanism",
      "observation": "Rendered computed colors converted to sRGB with alpha composition and contrast formula; screenshot inspected",
      "scope_ids": [
        "chromium-light",
        "chromium-dark"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
      "level": "mechanism",
      "observation": "Rendered computed colors converted to sRGB with alpha composition and contrast formula; screenshot inspected",
      "scope_ids": [
        "webkit-light",
        "webkit-dark"
      ]
    }
  ],
  "fix": {
    "applied": false,
    "device_dependent": false,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Proposed ordinary UI fix: strengthen the field boundary using an existing/adjusted semantic input token in each theme until boundary or fill reaches 3:1. Recheck every affected shared input before selecting a global token change. Preserve current text, dimensions and focus styles."
  },
  "contrary_evidence": [],
  "status_history": null
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-CH-CONTRAST",
    "module": 3,
    "required": true,
    "scenario": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "expected": "An enabled, author-styled text-entry boundary needed to identify the field has at least 3:1 contrast; sufficient fill contrast is an alternative",
    "actual": "Light border/outer 1.28556:1, border/inner 1.39335:1, fill/outer 1.08385:1; dark border/outer 1.87716:1, border/inner 1.78637:1, fill/outer 1.05082:1. Both themes below 3:1; text itself has high contrast.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-baseline.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-390.png",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-dark-390.png"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "mechanism",
    "behavior": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "chromium 149.0.7827.55",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Measure reflection textarea boundary/fill against adjacent rendered colors",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Measure reflection textarea boundary/fill against adjacent rendered colors"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-baseline.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-390.png",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-dark-390.png"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-01",
        "scope_id": "chromium-light"
      },
      {
        "finding_id": "F-01",
        "scope_id": "chromium-dark"
      }
    ]
  },
  {
    "id": "C-WK-CONTRAST",
    "module": 3,
    "required": true,
    "scenario": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "expected": "An enabled, author-styled text-entry boundary needed to identify the field has at least 3:1 contrast; sufficient fill contrast is an alternative",
    "actual": "Light border/outer 1.28556:1, border/inner 1.39335:1, fill/outer 1.08385:1; dark border/outer 1.87716:1, border/inner 1.78637:1, fill/outer 1.05082:1. Both themes below 3:1; text itself has high contrast.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-390.png",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-dark-390.png"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "mechanism",
    "behavior": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Measure reflection textarea boundary/fill against adjacent rendered colors",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Measure reflection textarea boundary/fill against adjacent rendered colors"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-390.png",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-dark-390.png"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-01",
        "scope_id": "webkit-light"
      },
      {
        "finding_id": "F-01",
        "scope_id": "webkit-dark"
      }
    ]
  }
]
```

### F-02: WebKit mouse activation can miss Energy after a scroll reset

P2 · observed · **open**

Where: TodayCheckIn BandPicker label/input; src/components/pattern/Shell.tsx:95 focus reveal is a causal lead, not an established cause. Expected: Selecting Mood 4 then Energy 3 retains both choices. Actual: Baseline submitted Mood 4 / Energy null after the Energy click. Bounded recorded follow-up: WebKit mouse 2/3 passed, synthetic touch 3/3, keyboard 3/3; Chromium 3/3 for each method. One failing trace moves scrollY 801 to 0 between down/up and retargets the release to reading prose..
Cause: Observed mechanism is a scroll jump during activation. Root cause among focus, router restoration, browser behavior or harness interaction is not isolated. No Safari touch failure has been established.. Disposition reason: Audit only; no implementation authorized. R2 P2 means substantial friction with a usable workaround. No physical-device scope is claimed.

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "webkit-mouse-390",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "Playwright WebKit 26.6",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "390x844; ordinary synthetic responses; pointer=mouse; no consent bands",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Load a fresh Today fixture",
          "Click Today sections / Check-in",
          "Click the Mood 4 label",
          "Immediately click the Energy 3 label",
          "Observe selection and submit once if continuing the journey"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    }
  ],
  "refuted_scopes": [],
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
      "level": "proxy",
      "observation": "One original journey saved Energy null",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-followup.json",
      "level": "proxy",
      "observation": "One failure in three recorded mouse trials; down/up trace identifies the scroll reset. Passing touch/keyboard observations retained without closing the intermittent mouse finding.",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    }
  ],
  "fix": {
    "applied": false,
    "device_dependent": true,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Propose only: capture focus/scroll traces on supported Safari with both finger taps and an external pointer if supported. If app focus/restore work causes the jump, limit the identified scroll action to the intended route/input transition. No blanket blur, touch-action, history or scroll rewrite is justified by this pilot."
  },
  "contrary_evidence": [],
  "status_history": null
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-WK-JOURNEY",
    "module": 1,
    "required": true,
    "scenario": "Read Today, use Check-in anchor, select Mood/Energy, save Unicode note and reload",
    "expected": "The selected two bands and note are reflected in the submitted fixture payload and reload state",
    "actual": "{\"mood\": 4, \"energy\": null, \"sleep\": null, \"stress\": null, \"note\": \"Pilot: a short pause helped. Café — 日本語 🙂\", \"savedAt\": \"2026-10-20T23:12:12.560Z\", \"sleepEnabled\": false, \"stressEnabled\": false, \"retentionDays\": 90, \"day\": \"2026-10-20\", \"timezone\": \"UTC\"}; reload {\"value\": \"Pilot: a short pause helped. Café — 日本語 🙂\", \"status\": \"Saved 11:12 PM\", \"checked\": [\"Mood: 4 of 5, Good\"]}",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-check-in-saved.png"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Read Today, use Check-in anchor, select Mood/Energy, save Unicode note and reload",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Read Today, use Check-in anchor, select Mood/Energy, save Unicode note and reload",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Read Today, use Check-in anchor, select Mood/Energy, save Unicode note and reload"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-check-in-saved.png"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-02",
        "scope_id": "webkit-mouse-390"
      }
    ]
  },
  {
    "id": "C-WK-MOUSE",
    "module": 4,
    "required": true,
    "scenario": "Select Mood 4 and Energy 3 using mouse-label",
    "expected": "Both bands select without a scroll reset discarding activation",
    "actual": "2/3 recorded trials passed. A failed WebKit mouse trial has pointerdown on Energy 3 at scrollY=801, then pointerup on prose at scrollY=0; Energy stays unselected. Touch/keyboard passes do not refute this intermittent mouse result.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-followup.json"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Select Mood 4 and Energy 3 using mouse-label",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Select Mood 4 and Energy 3 using mouse-label",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Select Mood 4 and Energy 3 using mouse-label"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-followup.json"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-02",
        "scope_id": "webkit-mouse-390"
      }
    ]
  }
]
```

### F-03: Route navigation restarts keyboard focus at document chrome

P2 · observed · **open**

Where: src/components/pattern/Shell.tsx:478 main; Today quick navigation -> /journal. Expected: A completed route transition offers intentional destination focus without stealing focus on a refresh or history restoration. Actual: Both Chromium and WebKit ended with activeElement BODY after opening Journal; the next Tab reached Skip to content. Returning to Today retained the unsaved note..
Cause: The main element is remounted by pathname and supports tabIndex=-1, but destination focus is not placed after the outgoing navigation link unmounts.. Disposition reason: Audit only; no implementation authorized. R2 P2 means substantial friction with a usable workaround. No physical-device scope is claimed.

Affected scope, retained evidence, fix and history:
```json
{
  "affects": [
    {
      "id": "chromium-journal-focus",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "chromium 149.0.7827.55",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "390x844; reduced motion; completed Today -> Journal route",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Enter an unsaved reflection on Today",
          "Activate Quick navigation / Journal",
          "Wait for Journal heading and two animation frames",
          "Record activeElement",
          "Press Tab once"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    },
    {
      "id": "webkit-journal-focus",
      "conditions": {
        "build_id": "B-PILOT",
        "browser": "webkit 26.6",
        "device": "Linux desktop host with mobile viewport/touch media emulation",
        "os": "Linux",
        "viewport": "390x844 unless stated in state",
        "display_mode": "regular browser tab",
        "state": "390x844; reduced motion; completed Today -> Journal route",
        "account_data": "mobile-audit-member; synthetic Today/check-in data",
        "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
        "steps": [
          "Enter an unsaved reflection on Today",
          "Activate Quick navigation / Journal",
          "Wait for Journal heading and two animation frames",
          "Record activeElement",
          "Press Tab once"
        ],
        "timing": "normal synthetic response unless a check declares delay/failure",
        "substitutions": "B-PILOT + SS-STRIPE"
      }
    }
  ],
  "refuted_scopes": [],
  "evidence": [
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-navigation.json",
      "level": "proxy",
      "observation": "BODY after completed navigation; next Tab Skip to content",
      "scope_ids": [
        "chromium-journal-focus"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-navigation.json",
      "level": "proxy",
      "observation": "BODY after completed navigation; next Tab Skip to content",
      "scope_ids": [
        "webkit-journal-focus"
      ]
    }
  ],
  "fix": {
    "applied": false,
    "device_dependent": false,
    "build_id": "",
    "evidence": [],
    "required_check_ids": [],
    "proposal": "Proposed scoped fix: use the existing Shell main ref to place focus on the destination heading/main after a new route completes; preserve Back/Forward restoration, same-page anchors, refreshes and intentional user focus. Recheck keyboard and real screen-reader navigation before claiming target resolution."
  },
  "contrary_evidence": [],
  "status_history": null
}
```

Checks (environment, level, substitutions, expected and actual):
```json
[
  {
    "id": "C-CH-FOCUS",
    "module": 5,
    "required": true,
    "scenario": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "expected": "Destination reading content has a clear, intentional focus entry",
    "actual": "After route completion active element BODY; first Tab focuses Skip to content, restarting at document chrome",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-navigation.json"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "chromium 149.0.7827.55",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Navigate Today quick navigation to Journal, settle, then press Tab",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Navigate Today quick navigation to Journal, settle, then press Tab"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-navigation.json"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-03",
        "scope_id": "chromium-journal-focus"
      }
    ]
  },
  {
    "id": "C-WK-FOCUS",
    "module": 5,
    "required": true,
    "scenario": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "expected": "Destination reading content has a clear, intentional focus entry",
    "actual": "After route completion active element BODY; first Tab focuses Skip to content, restarting at document chrome",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-navigation.json"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-PILOT",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-PILOT",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Navigate Today quick navigation to Journal, settle, then press Tab",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "B-PILOT compile-time service/bootstrap replacements plus SS-STRIPE; fresh context per recovery or selection trial",
      "steps": [
        "Navigate Today quick navigation to Journal, settle, then press Tab"
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-PILOT + SS-STRIPE"
    },
    "depends_on": [],
    "substitutions": {
      "build": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      },
      "setup": {
        "status": "known",
        "items": [
          {
            "boundary": "Stripe external resources",
            "description": "New recorded browser contexts abort Stripe domains to keep an unrelated eagerly imported provider outside this Today pilot",
            "behavior": "replaced",
            "configured_response": "requests to stripe.com / stripe.network hosts abort blockedbyclient; no checkout action is exercised",
            "real_components": "All Today/check-in components and synthetic member services",
            "untested": "Stripe SDK, telemetry, payments, checkout, provider network availability"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js"
        ],
        "reason": "Scoped setup interception for the recorded browser contexts only; the earliest exploratory contexts allowed Stripe resources and produced third-party console noise"
      },
      "additional": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-navigation.json"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    "covers": [
      {
        "finding_id": "F-03",
        "scope_id": "webkit-journal-focus"
      }
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

### C-D01 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.
2. At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.
3. Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.
4. With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.
5. Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D02 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Bottom tabs'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.
2. Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.
3. Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D03 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Top tabs'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.
2. Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.
3. Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D04 [] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / gesture navigation'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.
2. Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.
3. Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.
4. Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D05 [] {'browser': 'Safari + VoiceOver', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs / VoiceOver enabled'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.
2. Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.
3. Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D06 [] {'browser': 'Chrome + TalkBack', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / TalkBack enabled'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.
2. Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.
3. Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D07 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs / browser interruption'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.
2. Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.
3. Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D08 [] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / browser interruption'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.
2. Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.
3. Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D09 [] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / remote DevTools'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.
2. Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.
3. Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-D10 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs / Safari Web Inspector'}

Build: B-PHONE
Substitutions active in this check (build/setup/additional):
```json
{
  "build": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test backend routing",
      "production bootstrap",
      "member APIs"
    ],
    "evidence": [],
    "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
  },
  "setup": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "test account/backend routing",
      "device settings"
    ],
    "evidence": [],
    "reason": "Tester must confirm the test account, endpoint routing, display/browser settings and any fault controls"
  },
  "additional": {
    "status": "unknown",
    "items": [],
    "unknown_boundaries": [
      "per-device additions"
    ],
    "evidence": [],
    "reason": "Record any actual on-device interception or fault injection; no local-only stub is inherited"
  }
}
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm optimized test-only build/backend; record iPhone, iOS/Safari, network conditions, CSS width, and Inspector version.
2. Connect Safari Web Inspector Timelines; record reading navigation and selection/type/save interactions using synthetic data.
3. Export the trace and report supported measured timings and layout shifts with the tool limitations. Record visible stalls and data preservation; no all-browser field-performance claim follows.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

Beyond budget (titles only):

- Exact 320-CSS-pixel physical-phone configuration if none of the scheduled devices can provide it
- Safari WebKit missed-selection behavior with an external pointer on a separately configured target if C-D01 cannot cover it

## 7. Open questions

- Ceiling is proxy: Linux Chromium 149.0.7827.55 and Playwright WebKit 26.6; no iOS Safari, Android Chrome, simulator, physical device, saved autofill, IME or screen-reader journey was executed.
- Real auth/API/database persistence/encryption/chart/provider/payment/production bootstrap boundaries were replaced, so local saved-state observations cannot qualify those boundaries.
- The loopback fixture is not a phone-accessible preview. A separately verified non-production backend and test account are needed before any device write.
- No production build, deployment, whole-app audit, live editorial assessment, field metrics or mobile Core Web Vitals qualification is claimed.
- F-02 is a retained intermittent WebKit desktop mouse observation. Passing synthetic touch/keyboard trials neither establish Safari behavior nor causally refute the observed mouse failure.
- The first WebKit IndexedDB simulation was inconclusive: the instance override was not established. A prototype override with an invocation count exercised the real fallback. Raw first-attempt evidence remains retained.
- Initial dependency 504s and a follow-up selector timeout were harness/setup failures, preserved separately from application findings; the working launcher and stable menu selector were confirmed.
- Impeccable context reported config-build-path-unset. That visual-direction preference is unrelated to this audit; no config, skill, plugin or dependency was repaired or upgraded.
- Which non-production source-matched build/backend and synthetic account should be used for device checks?
- Which actual phone/browser/OS versions and Safari tab layouts can be tested?
- Return C-D01 through C-D10 with build/setup confirmation and each tested state; unresolved entries stay unrun.
- If implementation is subsequently authorized: ordinary contrast/focus changes use existing components; F-02 remains a conditional device-dependent proposal until its cause/scope is established.
- C-CH-CONTRAST: current recorded failure
- C-CH-FOCUS: current recorded failure
- C-WK-JOURNEY: current recorded failure
- C-WK-CONTRAST: current recorded failure
- C-WK-FOCUS: current recorded failure
- C-WK-MOUSE: current recorded failure
- C-CH-CONTRAST: required verification incomplete
- C-CH-FOCUS: required verification incomplete
- C-WK-JOURNEY: required verification incomplete
- C-WK-CONTRAST: required verification incomplete
- C-WK-FOCUS: required verification incomplete
- C-WK-MOUSE: required verification incomplete
- C-D01: required verification incomplete
- C-D02: required verification incomplete
- C-D03: required verification incomplete
- C-D04: required verification incomplete
- C-D05: required verification incomplete
- C-D06: required verification incomplete
- C-D07: required verification incomplete
- C-D08: required verification incomplete
- C-D09: required verification incomplete
- C-D10: required verification incomplete

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
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-manifest.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/provenance.json"
      ],
      "reason": "Read current source and project instructions"
    },
    {
      "id": "CAP-NODE",
      "environment": "automated_test",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/focused-tests.txt"
      ],
      "reason": "37 focused tests executed on this source"
    },
    {
      "id": "CAP-CHROMIUM",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-baseline.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-390.png"
      ],
      "reason": "Loaded the real Today route through the isolated fixture"
    },
    {
      "id": "CAP-WEBKIT",
      "environment": "desktop_emulation",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-390.png"
      ],
      "reason": "Loaded the real Today route through the isolated fixture"
    },
    {
      "id": "CAP-SIMULATOR",
      "environment": "os_simulator",
      "driver": "agent",
      "status": "unavailable",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/provenance.json"
      ],
      "reason": "Linux host; xcrun and adb not present on PATH; no OS simulator tool exposed"
    },
    {
      "id": "CAP-PHONE",
      "environment": "physical_device",
      "driver": "agent",
      "status": "unavailable",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/provenance.json"
      ],
      "reason": "No connected physical-device automation capability exposed"
    },
    {
      "id": "CAP-HUMAN",
      "environment": "physical_device",
      "driver": "person",
      "status": "not_checked",
      "evidence": [],
      "reason": "No named tester/device or completed device report supplied"
    },
    {
      "id": "CAP-FIELD",
      "environment": "field_data",
      "driver": "agent",
      "status": "not_checked",
      "evidence": [],
      "reason": "No applicable CrUX/RUM evidence for this member journey was supplied or queried; dev-fixture measurements are not field data"
    }
  ],
  "builds": [
    {
      "id": "B-PILOT",
      "description": "Current real application UI at 8e0e5c933ab8bad2b3e186e70501ef8e31d82570, unchanged app source, isolated Vite fixture and fresh per-case browser storage",
      "contains_fixes": [],
      "substitutions": {
        "status": "known",
        "items": [
          {
            "boundary": "member APIs",
            "description": "Vite build aliases auth.shared, pattern.functions, account-security.functions, billing.functions, assistant.functions, and react-start to tests/helpers/mobile-ui/services.ts",
            "behavior": "replaced",
            "configured_response": "Synthetic member mobile-audit-member; UTC current date; deterministic Today reading; no initial check-in; optional sleep/stress consent off; function responses and sessionStorage replace server persistence",
            "real_components": "Current real Today route, TodayCheckIn, MemberDraftProvider, encrypted IndexedDB draft controller, Shell, navigation hooks, components and CSS",
            "untested": "Real authentication, HTTP/server function transport, D1/account persistence, server encryption, real language providers, chart calculations, billing, and concurrency across real server requests"
          },
          {
            "boundary": "application bootstrap",
            "description": "tests/helpers/mobile-ui/main.tsx creates the QueryClient and test router, importing real routes; Vite middleware supplies fixture HTML with the same viewport meta",
            "behavior": "replaced",
            "configured_response": "Client-rendered fixture; no production SSR/hydration; envFile:false; explicit dependency entry for a fresh Vite cache",
            "real_components": "Real routes/components/styles; test root includes MemberDraftProvider and real Toaster",
            "untested": "Production bootstrap, SSR/hydration, deployment, route code-splitting and production performance"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/fixture-server-explicit-entry.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "B-PILOT is the application UI with explicitly substituted service and bootstrap boundaries"
      }
    },
    {
      "id": "B-SOURCE",
      "description": "Unmodified application source at 8e0e5c933ab8bad2b3e186e70501ef8e31d82570; Node pure-function/controller tests",
      "contains_fixes": [],
      "substitutions": {
        "status": "none_checked",
        "items": [],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-manifest.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/focused-tests.txt"
        ],
        "reason": "No additional replacement; inspected the executed harness and source"
      }
    },
    {
      "id": "B-PHONE",
      "description": "Planned non-production phone-accessible build of 8e0e5c933ab8bad2b3e186e70501ef8e31d82570; not built/deployed by this audit; no fix is claimed",
      "contains_fixes": [],
      "substitutions": {
        "status": "unknown",
        "items": [],
        "unknown_boundaries": [
          "test backend routing",
          "production bootstrap",
          "member APIs"
        ],
        "evidence": [],
        "reason": "No phone-accessible test build/backend has been provisioned or inspected; confirm build and all wiring before a human writes test data"
      }
    }
  ],
  "modules": [
    {
      "id": 1,
      "name": "Principal journey and mobile UX",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 2,
      "name": "Viewport, browser chrome and safe areas",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 3,
      "name": "Virtual keyboard and forms",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 4,
      "name": "Touch targets, reach and feedback",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 5,
      "name": "Overlays, navigation and data",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 6,
      "name": "Gestures and scrolling",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    },
    {
      "id": 7,
      "name": "Performance, pending states and recovery",
      "status": "reviewed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/baseline-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/recovery-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/followup-recorded.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/navigation-browser.js",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/pilot-report.md"
      ],
      "reason": "Applied to the bounded Today/check-in journey; reviewed source/proxy questions and retained unavailable target conditions. Module 7 performance is mechanism-only."
    }
  ],
  "commands": [
    {
      "kind": "workflow",
      "command": "Pattern .agents Impeccable context --target src/routes/index.tsx (once)",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/provenance.json"
      ],
      "reason": "Product/design loaded; versions and context notice retained"
    },
    {
      "kind": "shell",
      "command": "Pattern .agents Impeccable detect --json src",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/detector.json"
      ],
      "reason": "[]"
    },
    {
      "kind": "browser",
      "command": "Initial fixture cold start in Chromium and WebKit",
      "status": "failed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/initial-server.log",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/initial-console-2026-10-20T23-09-46-010Z.log",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/initial-console-2026-10-20T23-09-45-985Z.log"
      ],
      "reason": "Outdated Optimize Dep 504 before render",
      "resolved_by": "Explicit Vite normal-import entry and fresh cache; baseline route rendered in both engines"
    },
    {
      "kind": "browser",
      "command": "Baseline browser collection, recorded fresh contexts",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-baseline.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-baseline.json"
      ],
      "reason": "Raw initial exploratory run did not return its result object; recorded run uses returned JSON and fresh storage"
    },
    {
      "kind": "browser",
      "command": "Seven recovery cases plus initial storage injection per engine",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-recovery.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-recovery.json"
      ],
      "reason": "Initial WebKit storage expectation was inconclusive; the confirmed replacement was checked separately"
    },
    {
      "kind": "browser",
      "command": "First bounded follow-up including menu Forward",
      "status": "failed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-followup-output.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-followup-output.txt"
      ],
      "reason": "Harness looked for Open menu after Forward had correctly changed its accessible name to Close menu",
      "resolved_by": "Stable aria-controls selector in navigation-browser.js; recording split into selection and navigation files"
    },
    {
      "kind": "browser",
      "command": "Confirmed storage failure; three mouse, touch and keyboard selection trials; route/menu history checks per engine",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-followup.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-followup.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-navigation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-navigation.json"
      ],
      "reason": "Retained successes, failures and event traces without treating proxy passes as contrary target evidence"
    },
    {
      "kind": "shell",
      "command": "node --test tests/check-in.test.mjs tests/member-draft-controller.test.mjs tests/member-drafts.test.mjs tests/today-evidence.test.mjs",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/focused-tests.txt"
      ],
      "reason": "37/37 passed"
    },
    {
      "kind": "shell",
      "command": "Compare 1,985 baseline hashes, Git status and tooling hashes; close owned runtime resources",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/preservation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/cleanup.json"
      ],
      "reason": "No baseline file/tooling changes; Git status identical; owned port closed"
    }
  ],
  "cleanup": {
    "status": "done",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/cleanup.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/preservation.json"
    ],
    "reason": "Closed only the two named pilot browser sessions and stopped the verified owned loopback fixture. Sanitized evidence retained; no other service was stopped."
  },
  "history": [
    {
      "event": "audit_initialized",
      "at": "2026-10-20T23:09:09.107589+00:00",
      "revision": "8e0e5c933ab8bad2b3e186e70501ef8e31d82570",
      "mode": "audit_only"
    },
    {
      "event": "prior_audit_used_as_lead",
      "detail": "October 18 findings were not transferred to this different build; current Sources expansion, band descriptors and sign-out error handling have updated source."
    },
    {
      "event": "setup_and_probe_corrections",
      "detail": "Retained initial Vite 504s, an unreturned exploratory result, the ineffective first WebKit IndexedDB override, and the menu label selector timeout. None is hidden as an app pass or defect."
    },
    {
      "event": "evidence_consolidated",
      "detail": "Seven main recovery cases passed in each engine; confirmed storage failure passed separately in each. WebKit mouse failure, contrast failure and route focus friction remain open; no applied fixes."
    }
  ]
}
```
