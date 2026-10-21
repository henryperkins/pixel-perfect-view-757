Ceiling: proxy (automated_test, desktop_emulation, static_review); limits: field_data not_checked, os_simulator unavailable, physical_device not_checked, physical_device unavailable, no available simulator or physical device; assessment complete; verification failed.

# Mobile UX audit — 20261021T000416Z-f02-guard

## 1. Verdict

Mode: audit_and_fix. Principal task: Read Today, record a check-in with a reflection note, recover interrupted work, and revisit the saved state.
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
      "B-PILOT",
      "B-LOCAL-FIX",
      "B-RESUME-BASE"
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
| 1. Reach and placement | defects_found | desktop_emulation | proxy | C-GD01 through C-GD04: real grips and touch reach; exact 320px physical configuration beyond budget if unavailable |
| 2. Viewport and safe areas | no_defect_found | desktop_emulation | proxy | C-GD01 through C-GD04: actual browser chrome, insets, orientation and text settings |
| 3. Touch targets | defects_found | desktop_emulation | proxy | C-GD01 through C-GD04: physical activation/reach; 44px ergonomic guidance is separate from the 24px AA floor |
| 4. Forms and keyboard | defects_found | desktop_emulation | proxy | C-GD01 through C-GD04: real software keyboard and focus zoom; privacy prose has no saved-data autofill requirement |
| 5. Gestures and scrolling | defects_found | desktop_emulation | proxy | C-GD01 through C-GD04: real rubber-banding, pull-to-refresh, edge gestures and pinch |
| 6. Overlays, navigation and dense data | defects_found | desktop_emulation | proxy | C-GD04: actual Android Back; C-GD05/C-GD06: AT route context. Dense tables are outside Today/check-in scope. |
| 7. Content priority | no_defect_found | desktop_emulation | proxy | C-GD05/C-GD06: reading order with AT; synthetic text does not qualify live writing |
| 8. Performance | no_defect_found | static_review | mechanism | C-GD09: optimized Android trace. iPhone trace remains unrun and beyond budget after applied-guard pointer coverage received priority. Field/production performance not measured. |
| 9. Errors and recovery | no_defect_found | automated_test, desktop_emulation | proxy | C-GD07/C-GD08: real interruption. Real server persistence, encryption and outcome-unknown HTTP responses require an isolated real backend; unavailable here. |
| 10. Accessibility on mobile | defects_found | desktop_emulation | proxy | C-GD05/C-GD06: actual VoiceOver/TalkBack. Automated scan success is not WCAG conformance. |

## 3. Findings by severity

### F-01: Reflection textarea boundary contrast is too low in light and dark themes

P2 · observed · **implemented**

Where: src/components/pattern/TodayCheckIn.tsx:469. Expected: The enabled text-entry field is visually identifiable at >=3:1 against adjacent colors. Actual: Light border/outer 1.29:1; dark 1.88:1. Fill/outer is only 1.08:1 / 1.05:1. The low-contrast outline/fill is the field shape; disabled and unmodified native-control exceptions do not apply. Text and focus indicators remain usable..
Cause: Shared --input token and a near-background card fill provide insufficient resting-state field contrast.. Disposition reason: Prior local implementation retained byte-for-byte during the explicitly authorized F-02 guard continuation; target verification remains unrun.

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
    "applied": true,
    "device_dependent": false,
    "build_id": "B-LOCAL-FIX",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    ],
    "required_check_ids": [
      "C-L-CH-CONTRAST",
      "C-L-WK-CONTRAST"
    ],
    "proposal": "Proposed ordinary UI fix: strengthen the field boundary using an existing/adjusted semantic input token in each theme until boundary or fill reaches 3:1. Recheck every affected shared input before selecting a global token change. Preserve current text, dimensions and focus styles."
  },
  "contrary_evidence": [],
  "status_history": [
    {
      "at": "2026-10-20T23:56:55.611247+00:00",
      "previous_status": "open",
      "operation": "authorized local fixes and bounded investigation"
    }
  ]
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
  },
  {
    "id": "C-L-CH-CONTRAST",
    "module": 3,
    "required": true,
    "scenario": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "expected": "An enabled, author-styled text-entry boundary needed to identify the field has at least 3:1 contrast; sufficient fill contrast is an alternative",
    "actual": "Field border/outer: 5.217826 light, 6.645490 dark; both >3:1; no global token change",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/confirm-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/chromium-today-390.png"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "mechanism",
    "behavior": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
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
    ],
    "replaces_check_id": "C-CH-CONTRAST"
  },
  {
    "id": "C-L-WK-CONTRAST",
    "module": 3,
    "required": true,
    "scenario": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "expected": "An enabled, author-styled text-entry boundary needed to identify the field has at least 3:1 contrast; sufficient fill contrast is an alternative",
    "actual": "Field border/outer: 5.217826 light, 6.645490 dark; both >3:1; no global token change",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/confirm-webkit.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/webkit-today-390.png"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "mechanism",
    "behavior": "Measure reflection textarea boundary/fill against adjacent rendered colors",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
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
    ],
    "replaces_check_id": "C-WK-CONTRAST"
  }
]
```

### F-02: WebKit mouse activation can miss Energy after a scroll reset

P2 · observed · **implemented**

Where: src/components/pattern/Shell.tsx:94-101; TodayCheckIn native BandPicker activation. Expected: Selecting Mood 4 then Energy 3 retains both choices. Actual: Baseline submitted Mood 4 / Energy null after the Energy click. Bounded recorded follow-up: WebKit mouse 2/3 passed, synthetic touch 3/3, keyboard 3/3; Chromium 3/3 for each method. One failing trace moves scrollY 801 to 0 between down/up and retargets the release to reading prose..
Cause: On the pre-guard source, Shell.revealFocus treated main.contains(main) as a focused descendant and scrolled the entire main region while WebKit mouse activation was in progress. The guard now excludes main itself while retaining actual-control and visible-label geometry.. Disposition reason: Minimal guard remains implemented with retained local proxy confirmation. Five independent device regression entries are now explicitly planned under the local 2.0.1 model and fit the unchanged five-of-ten reservation. Original webkit-mouse-390 scope/evidence and all physical not_run statuses are preserved; no target Verified claim.

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
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-webkit-before.json",
      "level": "proxy",
      "observation": "Four failures across twenty before-fix diagnostic trials; immediate failing scroll stacks point to Shell.revealFocus, including when router settlement was awaited",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-main-focus-control.json",
      "level": "proxy",
      "observation": "Changed-build ordinary group failed once in six; active element MAIN, rect y=-718, scrollBy(-809). Disposable main-focus event suppression had zero misses in six and counted two suppressed events per trial. No exact guard patch applied.",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/shell-focus-webkit-red.json",
      "level": "proxy",
      "observation": "Main focus reproducibly resets scroll before guard; actual-control clearance passes.",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    },
    {
      "ref": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/selection-webkit.json",
      "level": "proxy",
      "observation": "On guard source, 12 mouse, 4 synthetic-touch and 4 keyboard band trials pass without main-triggered scrollBy; physical conditions unrun.",
      "scope_ids": [
        "webkit-mouse-390"
      ]
    }
  ],
  "fix": {
    "applied": true,
    "device_dependent": true,
    "build_id": "B-F02-GUARD",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/source-identity.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/target-plan.json"
    ],
    "required_check_ids": [
      "C-GD01",
      "C-GD02",
      "C-GD03",
      "C-GD04",
      "C-GD10"
    ],
    "proposal": "Applied only the main-landmark exclusion in revealFocus. All geometry, actual-control label targeting, native input, viewport and history behavior are retained.",
    "device_regression_check_ids": [
      "C-GD01",
      "C-GD02",
      "C-GD03",
      "C-GD04",
      "C-GD10"
    ],
    "scope_verification_plan": {
      "status": "separate_regression_plan",
      "scope_id": "webkit-mouse-390",
      "required_target_check_ids": [],
      "device_regression_check_ids": [
        "C-GD01",
        "C-GD02",
        "C-GD03",
        "C-GD04",
        "C-GD10"
      ],
      "reason": "Original desktop proxy scope and evidence are unchanged. The phone checks satisfy separate fix regression requirements under local runner 2.0.1; they do not verify/refute the original scope. No target observation has been established."
    },
    "device_regressions": [
      {
        "id": "DR-F02-SAFARI-COMPACT",
        "source_scope_ids": [
          "webkit-mouse-390"
        ],
        "environment": "physical_device",
        "behavior": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
        "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
        "conditions": {
          "build_id": "B-PHONE-GUARD",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Compact tabs",
          "account_data": "isolated synthetic test account",
          "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
            "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
            "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
            "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
            "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "timing": "record actual timing, connection and every tested state",
          "substitutions": "unknown until independently confirmed"
        },
        "depends_on": [
          "member APIs"
        ]
      },
      {
        "id": "DR-F02-SAFARI-BOTTOM",
        "source_scope_ids": [
          "webkit-mouse-390"
        ],
        "environment": "physical_device",
        "behavior": "Check Bottom-tab chrome, keyboard and orientation transitions",
        "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
        "conditions": {
          "build_id": "B-PHONE-GUARD",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Bottom tabs",
          "account_data": "isolated synthetic test account",
          "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
            "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
            "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "timing": "record actual timing, connection and every tested state",
          "substitutions": "unknown until independently confirmed"
        },
        "depends_on": []
      },
      {
        "id": "DR-F02-SAFARI-TOP",
        "source_scope_ids": [
          "webkit-mouse-390"
        ],
        "environment": "physical_device",
        "behavior": "Check Top-tab chrome, keyboard and orientation transitions",
        "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
        "conditions": {
          "build_id": "B-PHONE-GUARD",
          "browser": "Safari",
          "device": "iPhone",
          "state": "Top tabs",
          "account_data": "isolated synthetic test account",
          "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
            "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
            "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "timing": "record actual timing, connection and every tested state",
          "substitutions": "unknown until independently confirmed"
        },
        "depends_on": []
      },
      {
        "id": "DR-F02-ANDROID",
        "source_scope_ids": [
          "webkit-mouse-390"
        ],
        "environment": "physical_device",
        "behavior": "Exercise real Android keyboard, gesture bar and Back/Forward",
        "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
        "conditions": {
          "build_id": "B-PHONE-GUARD",
          "browser": "Chrome",
          "device": "Android phone",
          "state": "regular tabs / gesture navigation",
          "account_data": "isolated synthetic test account",
          "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
            "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
            "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
            "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "timing": "record actual timing, connection and every tested state",
          "substitutions": "unknown until independently confirmed"
        },
        "depends_on": [
          "member APIs"
        ]
      },
      {
        "id": "DR-F02-SAFARI-POINTER",
        "source_scope_ids": [
          "webkit-mouse-390"
        ],
        "environment": "physical_device",
        "behavior": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
        "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.",
        "conditions": {
          "build_id": "B-PHONE-GUARD",
          "browser": "Safari",
          "device": "iPhone with supported external pointer",
          "state": "Compact tabs; external pointer; original rapid native-anchor mouse-label activation",
          "account_data": "isolated synthetic test account",
          "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
          "steps": [
            "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
            "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
            "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
          ],
          "timing": "record actual timing, connection and every tested state",
          "substitutions": "unknown until independently confirmed"
        },
        "depends_on": [
          "member APIs"
        ]
      }
    ]
  },
  "contrary_evidence": [],
  "status_history": [
    {
      "at": "2026-10-20T23:56:55.611247+00:00",
      "previous_status": "open",
      "operation": "authorized local fixes and bounded investigation"
    },
    {
      "at": "2026-10-21T00:10:04.872234+00:00",
      "previous_status": "open",
      "previous_fix": {
        "applied": false,
        "device_dependent": true,
        "build_id": "",
        "evidence": [],
        "required_check_ids": [],
        "proposal": "Proposed only: exclude the main landmark itself from focus-clearance targeting while retaining real control/radio label clearance. Exact diff and device conditions are documented in f02-investigation.md; no Shell/viewport/gesture/history application edit."
      },
      "operation": "User authorized exact minimal guard; local focused confirmation only"
    }
  ]
}
```

Device regression requirements (independent of observed scope):
```json
{
  "requirements": [
    {
      "id": "DR-F02-SAFARI-COMPACT",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "environment": "physical_device",
      "behavior": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
      "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
      "conditions": {
        "build_id": "B-PHONE-GUARD",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Compact tabs",
        "account_data": "isolated synthetic test account",
        "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
        "steps": [
          "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
          "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
          "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
          "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
          "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
          "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
        ],
        "timing": "record actual timing, connection and every tested state",
        "substitutions": "unknown until independently confirmed"
      },
      "depends_on": [
        "member APIs"
      ]
    },
    {
      "id": "DR-F02-SAFARI-BOTTOM",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "environment": "physical_device",
      "behavior": "Check Bottom-tab chrome, keyboard and orientation transitions",
      "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
      "conditions": {
        "build_id": "B-PHONE-GUARD",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Bottom tabs",
        "account_data": "isolated synthetic test account",
        "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
        "steps": [
          "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
          "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
          "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
          "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
        ],
        "timing": "record actual timing, connection and every tested state",
        "substitutions": "unknown until independently confirmed"
      },
      "depends_on": []
    },
    {
      "id": "DR-F02-SAFARI-TOP",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "environment": "physical_device",
      "behavior": "Check Top-tab chrome, keyboard and orientation transitions",
      "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
      "conditions": {
        "build_id": "B-PHONE-GUARD",
        "browser": "Safari",
        "device": "iPhone",
        "state": "Top tabs",
        "account_data": "isolated synthetic test account",
        "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
        "steps": [
          "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
          "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
          "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
          "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
        ],
        "timing": "record actual timing, connection and every tested state",
        "substitutions": "unknown until independently confirmed"
      },
      "depends_on": []
    },
    {
      "id": "DR-F02-ANDROID",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "environment": "physical_device",
      "behavior": "Exercise real Android keyboard, gesture bar and Back/Forward",
      "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
      "conditions": {
        "build_id": "B-PHONE-GUARD",
        "browser": "Chrome",
        "device": "Android phone",
        "state": "regular tabs / gesture navigation",
        "account_data": "isolated synthetic test account",
        "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
        "steps": [
          "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
          "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
          "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
          "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
          "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
        ],
        "timing": "record actual timing, connection and every tested state",
        "substitutions": "unknown until independently confirmed"
      },
      "depends_on": [
        "member APIs"
      ]
    },
    {
      "id": "DR-F02-SAFARI-POINTER",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "environment": "physical_device",
      "behavior": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
      "expected": "Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.",
      "conditions": {
        "build_id": "B-PHONE-GUARD",
        "browser": "Safari",
        "device": "iPhone with supported external pointer",
        "state": "Compact tabs; external pointer; original rapid native-anchor mouse-label activation",
        "account_data": "isolated synthetic test account",
        "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
        "steps": [
          "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
          "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
          "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
        ],
        "timing": "record actual timing, connection and every tested state",
        "substitutions": "unknown until independently confirmed"
      },
      "depends_on": [
        "member APIs"
      ]
    }
  ],
  "qualification": [
    {
      "finding_id": "F-02",
      "regression_id": "DR-F02-SAFARI-COMPACT",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "check_ids": [
        "C-GD01"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-02",
      "regression_id": "DR-F02-SAFARI-BOTTOM",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "check_ids": [
        "C-GD02"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-02",
      "regression_id": "DR-F02-SAFARI-TOP",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "check_ids": [
        "C-GD03"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-02",
      "regression_id": "DR-F02-ANDROID",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "check_ids": [
        "C-GD04"
      ],
      "status": "not_run"
    },
    {
      "finding_id": "F-02",
      "regression_id": "DR-F02-SAFARI-POINTER",
      "source_scope_ids": [
        "webkit-mouse-390"
      ],
      "check_ids": [
        "C-GD10"
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
  },
  {
    "id": "C-L-F02-BASE",
    "module": 4,
    "required": true,
    "scenario": "Investigate F-02 with pass-through scroll/focus stacks and bounded disposable controls",
    "expected": "Both bands select without a scroll reset discarding activation",
    "actual": "Observed failures originate in unchanged Shell.revealFocus: transient MAIN focus results in scrollBy(-809) while pointer is down. Diagnostic substitutions and separate trial counts are retained in the referenced report",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-webkit-before.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-investigation.md"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Select Mood 4 and Energy 3 using mouse-label",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-RESUME-BASE",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-RESUME-BASE",
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
        "status": "known",
        "items": [
          {
            "boundary": "diagnostic browser instrumentation",
            "description": "Pass-through scroll/focus wrappers plus separately labeled disposable router/focus-event controls",
            "behavior": "replaced",
            "configured_response": "See each group in raw JSON: ordinary tracing, extra settling, router-managed hash, scroll restoration disabled, or main-focus event suppression; controls are not active in the application build",
            "real_components": "Real Shell, native radio labels/inputs, routes and ordinary RouteFocus where build includes it",
            "untested": "Physical Safari, exact proposed Shell guard, real keyboards and device regressions"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-webkit-before.json"
        ],
        "reason": "Every control is a separate group, never an application fix or a target pass"
      }
    },
    "covers": [
      {
        "finding_id": "F-02",
        "scope_id": "webkit-mouse-390"
      }
    ],
    "replaces_check_id": "C-WK-MOUSE"
  },
  {
    "id": "C-L-F02-LOCAL",
    "module": 4,
    "required": true,
    "scenario": "Investigate F-02 with pass-through scroll/focus stacks and bounded disposable controls",
    "expected": "Both bands select without a scroll reset discarding activation",
    "actual": "Observed failures originate in unchanged Shell.revealFocus: transient MAIN focus results in scrollBy(-809) while pointer is down. Diagnostic substitutions and separate trial counts are retained in the referenced report",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-main-focus-control.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-investigation.md"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Select Mood 4 and Energy 3 using mouse-label",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
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
        "status": "known",
        "items": [
          {
            "boundary": "diagnostic browser instrumentation",
            "description": "Pass-through scroll/focus wrappers plus separately labeled disposable router/focus-event controls",
            "behavior": "replaced",
            "configured_response": "See each group in raw JSON: ordinary tracing, extra settling, router-managed hash, scroll restoration disabled, or main-focus event suppression; controls are not active in the application build",
            "real_components": "Real Shell, native radio labels/inputs, routes and ordinary RouteFocus where build includes it",
            "untested": "Physical Safari, exact proposed Shell guard, real keyboards and device regressions"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-main-focus-control.json"
        ],
        "reason": "Every control is a separate group, never an application fix or a target pass"
      }
    },
    "covers": [
      {
        "finding_id": "F-02",
        "scope_id": "webkit-mouse-390"
      }
    ],
    "replaces_check_id": "C-WK-MOUSE"
  },
  {
    "id": "C-G-WK-SHELL",
    "module": 6,
    "required": true,
    "scenario": "F-02 guard: main focus preserves scroll while textarea/native-radio label focus still clears fixed chrome",
    "expected": "Main landmark produces no focus-reveal scroll; actual form controls retain clearance and native keyboard selection.",
    "actual": "3/3 passed: main scroll remained 600px with zero scrollBy calls; reflection and visible native-radio label clearance passed.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/shell-focus-webkit-final.json",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/shell-focus.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "F-02 guard: main focus preserves scroll while textarea/native-radio label focus still clears fixed chrome",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-F02-GUARD",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-F02-GUARD",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "F-02 guard: main focus preserves scroll while textarea/native-radio label focus still clears fixed chrome",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Fresh local synthetic member context; real components and current guard; Stripe resources blocked as in standing fixture.",
      "steps": [
        "Scroll to 600px, focus main with preventScroll, and assert scroll position is preserved.",
        "Focus an obscured textarea and native radio; assert their visible boxes clear the fixed header/navigation; select radio with Space."
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-F02-GUARD + standing Stripe block; pass-through scrollBy trace where declared"
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/f02-selection.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/shell-focus.cases.txt"
        ],
        "reason": "Inspected scripts: real focus/native events run. The scrollBy wrapper only records arguments and calls the original; no focus suppression or restoration alteration is installed."
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
    "id": "C-G-WK-SELECT",
    "module": 4,
    "required": true,
    "scenario": "Repeat original native-anchor band selection using mouse, synthetic touch and keyboard",
    "expected": "Mood 4 and Energy 3 remain selected; no focus-reveal scroll occurs with MAIN active; synthetic save/reload retains both bands and Unicode note.",
    "actual": "20/20 passed: 12 mouse, 4 synthetic touch, 4 keyboard; one synthetic save/reload per input method passed; no MAIN-triggered scrollBy or page errors.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/selection-webkit.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/f02-selection.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Repeat original native-anchor band selection using mouse, synthetic touch and keyboard",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-F02-GUARD",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-F02-GUARD",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Repeat original native-anchor band selection using mouse, synthetic touch and keyboard",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Fresh local synthetic member context; real components and current guard; Stripe resources blocked as in standing fixture.",
      "steps": [
        "Use the native Today Check-in anchor, immediately activate Mood 4 then Energy 3; keep each input method separate.",
        "Run 12 fresh mouse contexts, 4 synthetic touch contexts and 4 keyboard contexts.",
        "On the first trial per method, save one Unicode note against fixture services and reload; compare both bands and the complete note."
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-F02-GUARD + standing Stripe block; pass-through scrollBy trace where declared"
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/f02-selection.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/shell-focus.cases.txt"
        ],
        "reason": "Inspected scripts: real focus/native events run. The scrollBy wrapper only records arguments and calls the original; no focus suppression or restoration alteration is installed."
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
    "id": "C-GD01",
    "module": 3,
    "required": true,
    "scenario": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
    "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
    "actual": "",
    "evidence": [],
    "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
    "status": "not_run",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
    "capability_id": "CAP-HUMAN",
    "build_id": "B-PHONE-GUARD",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "os": "record actual version",
      "version": "record actual version",
      "display": "Compact tabs"
    },
    "conditions": {
      "build_id": "B-PHONE-GUARD",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Compact tabs",
      "account_data": "isolated synthetic test account",
      "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
      "steps": [
        "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
        "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
        "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
        "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
        "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
        "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
      ],
      "timing": "record actual timing, connection and every tested state",
      "substitutions": "unknown until independently confirmed"
    },
    "depends_on": [
      "member APIs"
    ],
    "substitutions": {
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
    },
    "covers": [],
    "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
    "steps": [
      "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
      "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
      "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
      "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
      "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
      "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
    ],
    "related_finding_ids": [
      "F-01",
      "F-02",
      "F-03"
    ],
    "replaces_check_id": "C-LD01",
    "planned_only": true,
    "achieved_level": "unestablished",
    "level_basis": "Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.",
    "planning_role": "independent_guard_regression",
    "planning_limit": "Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.",
    "regression_covers": [
      {
        "finding_id": "F-02",
        "regression_id": "DR-F02-SAFARI-COMPACT"
      }
    ]
  },
  {
    "id": "C-GD02",
    "module": 3,
    "required": true,
    "scenario": "Check Bottom-tab chrome, keyboard and orientation transitions",
    "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
    "actual": "",
    "evidence": [],
    "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
    "status": "not_run",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "Check Bottom-tab chrome, keyboard and orientation transitions",
    "capability_id": "CAP-HUMAN",
    "build_id": "B-PHONE-GUARD",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "os": "record actual version",
      "version": "record actual version",
      "display": "Bottom tabs"
    },
    "conditions": {
      "build_id": "B-PHONE-GUARD",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Bottom tabs",
      "account_data": "isolated synthetic test account",
      "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
      "steps": [
        "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
        "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
        "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
        "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
      ],
      "timing": "record actual timing, connection and every tested state",
      "substitutions": "unknown until independently confirmed"
    },
    "depends_on": [],
    "substitutions": {
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
    },
    "covers": [],
    "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
    "steps": [
      "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
      "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
      "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
      "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
    ],
    "replaces_check_id": "C-LD02",
    "related_finding_ids": [
      "F-02"
    ],
    "planned_only": true,
    "achieved_level": "unestablished",
    "level_basis": "Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.",
    "planning_role": "independent_guard_regression",
    "planning_limit": "Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.",
    "regression_covers": [
      {
        "finding_id": "F-02",
        "regression_id": "DR-F02-SAFARI-BOTTOM"
      }
    ]
  },
  {
    "id": "C-GD03",
    "module": 3,
    "required": true,
    "scenario": "Check Top-tab chrome, keyboard and orientation transitions",
    "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
    "actual": "",
    "evidence": [],
    "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
    "status": "not_run",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "Check Top-tab chrome, keyboard and orientation transitions",
    "capability_id": "CAP-HUMAN",
    "build_id": "B-PHONE-GUARD",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone",
      "os": "record actual version",
      "version": "record actual version",
      "display": "Top tabs"
    },
    "conditions": {
      "build_id": "B-PHONE-GUARD",
      "browser": "Safari",
      "device": "iPhone",
      "state": "Top tabs",
      "account_data": "isolated synthetic test account",
      "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
      "steps": [
        "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
        "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
        "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
        "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
      ],
      "timing": "record actual timing, connection and every tested state",
      "substitutions": "unknown until independently confirmed"
    },
    "depends_on": [],
    "substitutions": {
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
    },
    "covers": [],
    "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
    "steps": [
      "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
      "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
      "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
      "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
    ],
    "replaces_check_id": "C-LD03",
    "related_finding_ids": [
      "F-02"
    ],
    "planned_only": true,
    "achieved_level": "unestablished",
    "level_basis": "Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.",
    "planning_role": "independent_guard_regression",
    "planning_limit": "Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.",
    "regression_covers": [
      {
        "finding_id": "F-02",
        "regression_id": "DR-F02-SAFARI-TOP"
      }
    ]
  },
  {
    "id": "C-GD04",
    "module": 3,
    "required": true,
    "scenario": "Exercise real Android keyboard, gesture bar and Back/Forward",
    "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
    "actual": "",
    "evidence": [],
    "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
    "status": "not_run",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "Exercise real Android keyboard, gesture bar and Back/Forward",
    "capability_id": "CAP-HUMAN",
    "build_id": "B-PHONE-GUARD",
    "configuration": {
      "browser": "Chrome",
      "device": "Android phone",
      "os": "record actual version",
      "version": "record actual version",
      "display": "regular tabs / gesture navigation"
    },
    "conditions": {
      "build_id": "B-PHONE-GUARD",
      "browser": "Chrome",
      "device": "Android phone",
      "state": "regular tabs / gesture navigation",
      "account_data": "isolated synthetic test account",
      "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
      "steps": [
        "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
        "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
        "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
        "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
        "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
      ],
      "timing": "record actual timing, connection and every tested state",
      "substitutions": "unknown until independently confirmed"
    },
    "depends_on": [
      "member APIs"
    ],
    "substitutions": {
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
    },
    "covers": [],
    "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
    "steps": [
      "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
      "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
      "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
      "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
      "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
    ],
    "replaces_check_id": "C-LD04",
    "related_finding_ids": [
      "F-01",
      "F-02",
      "F-03"
    ],
    "planned_only": true,
    "achieved_level": "unestablished",
    "level_basis": "Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.",
    "planning_role": "independent_guard_regression",
    "planning_limit": "Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.",
    "regression_covers": [
      {
        "finding_id": "F-02",
        "regression_id": "DR-F02-ANDROID"
      }
    ]
  },
  {
    "id": "C-GD10",
    "module": 7,
    "required": true,
    "scenario": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
    "expected": "Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.",
    "actual": "",
    "evidence": [],
    "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
    "status": "not_run",
    "environment": "physical_device",
    "driver": "person",
    "evidence_type": "physical_device",
    "level": "target",
    "behavior": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
    "capability_id": "CAP-HUMAN",
    "build_id": "B-PHONE-GUARD",
    "configuration": {
      "browser": "Safari",
      "device": "iPhone with supported external pointer",
      "os": "record actual version",
      "version": "record actual version",
      "display": "Compact tabs; external mouse/pointer; record exact hardware and input mode"
    },
    "conditions": {
      "build_id": "B-PHONE-GUARD",
      "browser": "Safari",
      "device": "iPhone with supported external pointer",
      "state": "Compact tabs; external pointer; original rapid native-anchor mouse-label activation",
      "account_data": "isolated synthetic test account",
      "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
      "steps": [
        "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
        "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
        "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
      ],
      "timing": "record actual timing, connection and every tested state",
      "substitutions": "unknown until independently confirmed"
    },
    "depends_on": [
      "member APIs"
    ],
    "substitutions": {
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
    },
    "covers": [],
    "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
    "steps": [
      "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
      "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
      "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
    ],
    "replaces_check_id": "C-LD10",
    "related_finding_ids": [
      "F-02"
    ],
    "planned_only": true,
    "achieved_level": "unestablished",
    "level_basis": "Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.",
    "planning_role": "independent_guard_regression",
    "planning_limit": "Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.",
    "regression_covers": [
      {
        "finding_id": "F-02",
        "regression_id": "DR-F02-SAFARI-POINTER"
      }
    ]
  }
]
```

### F-03: Route navigation restarts keyboard focus at document chrome

P2 · observed · **implemented**

Where: src/components/pattern/RouteFocus.tsx; src/routes/__root.tsx persistent root wiring. Expected: A completed route transition offers intentional destination focus without stealing focus on a refresh or history restoration. Actual: Both Chromium and WebKit ended with activeElement BODY after opening Journal; the next Tab reached Skip to content. Returning to Today retained the unsaved note..
Cause: The main element is remounted by pathname and supports tabIndex=-1, but destination focus is not placed after the outgoing navigation link unmounts.. Disposition reason: Prior local implementation retained byte-for-byte during the explicitly authorized F-02 guard continuation; target verification remains unrun.

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
    "applied": true,
    "device_dependent": false,
    "build_id": "B-LOCAL-FIX",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/changes.patch",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    ],
    "required_check_ids": [
      "C-L-CH-FOCUS",
      "C-L-WK-FOCUS"
    ],
    "proposal": "Proposed scoped fix: use the existing Shell main ref to place focus on the destination heading/main after a new route completes; preserve Back/Forward restoration, same-page anchors, refreshes and intentional user focus. Recheck keyboard and real screen-reader navigation before claiming target resolution."
  },
  "contrary_evidence": [],
  "status_history": [
    {
      "at": "2026-10-20T23:56:55.611247+00:00",
      "previous_status": "open",
      "operation": "authorized local fixes and bounded investigation"
    }
  ]
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
  },
  {
    "id": "C-L-CH-FOCUS",
    "module": 5,
    "required": true,
    "scenario": "Confirm F-03 destination focus and preservation of existing route/menu/history behavior",
    "expected": "Destination reading content has a clear, intentional focus entry",
    "actual": "Seven route-focus regression cases passed, including PUSH, REPLACE, field focus through same-page/refresh, initial/reload, menu, Back/Forward, and cross-route hash targets",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-chromium-final.json",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/route-focus.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
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
    ],
    "replaces_check_id": "C-CH-FOCUS"
  },
  {
    "id": "C-L-WK-FOCUS",
    "module": 5,
    "required": true,
    "scenario": "Confirm F-03 destination focus and preservation of existing route/menu/history behavior",
    "expected": "Destination reading content has a clear, intentional focus entry",
    "actual": "Seven route-focus regression cases passed, including PUSH, REPLACE, field focus through same-page/refresh, initial/reload, menu, Back/Forward, and cross-route hash targets",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-webkit-final.json",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/route-focus.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
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
    ],
    "replaces_check_id": "C-WK-FOCUS"
  },
  {
    "id": "C-L-FOCUS-RED",
    "module": 5,
    "required": false,
    "scenario": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "expected": "Destination reading content has a clear, intentional focus entry",
    "actual": "Before implementation the destination-focus browser case failed with activeElement BODY; five preservation cases passed",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-chromium-red.json"
    ],
    "status": "fail",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Navigate Today quick navigation to Journal, settle, then press Tab",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-RESUME-BASE",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-RESUME-BASE",
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
    ],
    "replaces_check_id": "C-CH-FOCUS"
  },
  {
    "id": "C-L-CH-REVIEW",
    "module": 5,
    "required": true,
    "scenario": "Independent review of destination focus and interrupted or overlapping route navigation",
    "expected": "Deliberate destination focus survives; a superseded/cancelled route cannot focus stale main or overwrite a later focus choice.",
    "actual": "4/4 independent browser probes passed: React autoFocus; layout-effect focus outside main; delayed Journal superseded by Timing; Back cancelling delayed Journal with draft retained.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review.md",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Independent review of destination focus and interrupted or overlapping route navigation",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
      "browser": "chromium 149.0.7827.55",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Independent review of destination focus and interrupted or overlapping route navigation",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Local fixture with actual RouteFocus mounted at root; per-probe in-memory Journal component or beforeLoad control as declared below.",
      "steps": [
        "Run each of the four independent-review probes in a fresh context; assert focus call counts, final route, latest deliberate focus and retained draft as applicable."
      ],
      "timing": "Two synchronous destination-focus probes; two deliberately delayed beforeLoad overlap/cancellation probes.",
      "substitutions": "B-LOCAL-FIX + SS-STRIPE + declared independent-review in-memory focus/loader controls"
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
        "status": "known",
        "items": [
          {
            "boundary": "Journal component in two focus probes",
            "description": "Replace only the in-memory Journal component with small React components using autoFocus or a layout-effect input outside main.",
            "behavior": "replaced",
            "configured_response": "A deliberate destination focus is established by React.",
            "real_components": "Actual RouteFocus, router coordinator, real Today and root/provider",
            "untested": "Real Journal production layout and backend in these two isolated probes"
          },
          {
            "boundary": "Journal beforeLoad in two navigation probes",
            "description": "Gate the in-memory beforeLoad with an explicitly released promise.",
            "behavior": "replaced",
            "configured_response": "Deterministic pending navigation for supersession or Back cancellation",
            "real_components": "Real routes/components/router and RouteFocus; normal route loader executes after release",
            "untested": "Real network/SSR latency and transport behavior"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review.md",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-chromium.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes.cases.txt"
        ],
        "reason": "Exact scripts and raw results retained; pass-through focus instrumentation records calls without replacing behavior."
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
    "id": "C-L-WK-REVIEW",
    "module": 5,
    "required": true,
    "scenario": "Independent review of destination focus and interrupted or overlapping route navigation",
    "expected": "Deliberate destination focus survives; a superseded/cancelled route cannot focus stale main or overwrite a later focus choice.",
    "actual": "4/4 independent browser probes passed: React autoFocus; layout-effect focus outside main; delayed Journal superseded by Timing; Back cancelling delayed Journal with draft retained.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review.md",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-webkit.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Independent review of destination focus and interrupted or overlapping route navigation",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-LOCAL-FIX",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-LOCAL-FIX",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Independent review of destination focus and interrupted or overlapping route navigation",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Local fixture with actual RouteFocus mounted at root; per-probe in-memory Journal component or beforeLoad control as declared below.",
      "steps": [
        "Run each of the four independent-review probes in a fresh context; assert focus call counts, final route, latest deliberate focus and retained draft as applicable."
      ],
      "timing": "Two synchronous destination-focus probes; two deliberately delayed beforeLoad overlap/cancellation probes.",
      "substitutions": "B-LOCAL-FIX + SS-STRIPE + declared independent-review in-memory focus/loader controls"
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
        "status": "known",
        "items": [
          {
            "boundary": "Journal component in two focus probes",
            "description": "Replace only the in-memory Journal component with small React components using autoFocus or a layout-effect input outside main.",
            "behavior": "replaced",
            "configured_response": "A deliberate destination focus is established by React.",
            "real_components": "Actual RouteFocus, router coordinator, real Today and root/provider",
            "untested": "Real Journal production layout and backend in these two isolated probes"
          },
          {
            "boundary": "Journal beforeLoad in two navigation probes",
            "description": "Gate the in-memory beforeLoad with an explicitly released promise.",
            "behavior": "replaced",
            "configured_response": "Deterministic pending navigation for supersession or Back cancellation",
            "real_components": "Real routes/components/router and RouteFocus; normal route loader executes after release",
            "untested": "Real network/SSR latency and transport behavior"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review.md",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-webkit.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes.cases.txt"
        ],
        "reason": "Exact scripts and raw results retained; pass-through focus instrumentation records calls without replacing behavior."
      }
    },
    "covers": [
      {
        "finding_id": "F-03",
        "scope_id": "webkit-journal-focus"
      }
    ]
  },
  {
    "id": "C-G-CH-ROUTE",
    "module": 5,
    "required": true,
    "scenario": "Rerun the existing seven route-focus regressions after the Shell guard",
    "expected": "Retain all seven established route-focus behaviors after the guard.",
    "actual": "7/7 passed; destination focus, REPLACE, initial/reload, same-page changes, refresh, Back/Forward drafts and menu/hash behavior retained.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/route-focus-chromium.json",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/route-focus.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Rerun the existing seven route-focus regressions after the Shell guard",
    "capability_id": "CAP-CHROMIUM",
    "build_id": "B-F02-GUARD",
    "configuration": {
      "browser": "chromium",
      "version": "149.0.7827.55",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-F02-GUARD",
      "browser": "chromium 149.0.7827.55",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Rerun the existing seven route-focus regressions after the Shell guard",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Fresh local synthetic member context; real components and current guard; Stripe resources blocked as in standing fixture.",
      "steps": [
        "Run the existing seven route-focus cases in fresh contexts."
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-F02-GUARD + standing Stripe block; pass-through scrollBy trace where declared"
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/f02-selection.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/shell-focus.cases.txt"
        ],
        "reason": "Inspected scripts: real focus/native events run. The scrollBy wrapper only records arguments and calls the original; no focus suppression or restoration alteration is installed."
      }
    },
    "covers": [
      {
        "finding_id": "F-03",
        "scope_id": "chromium-journal-focus"
      }
    ],
    "replaces_check_id": "C-L-CH-FOCUS"
  },
  {
    "id": "C-G-WK-ROUTE",
    "module": 5,
    "required": true,
    "scenario": "Rerun the existing seven route-focus regressions after the Shell guard",
    "expected": "Retain all seven established route-focus behaviors after the guard.",
    "actual": "7/7 passed; destination focus, REPLACE, initial/reload, same-page changes, refresh, Back/Forward drafts and menu/hash behavior retained.",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/route-focus-webkit.json",
      "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/route-focus.cases.txt"
    ],
    "status": "pass",
    "reason": "",
    "environment": "desktop_emulation",
    "driver": "agent",
    "evidence_type": "emulation",
    "level": "proxy",
    "behavior": "Rerun the existing seven route-focus regressions after the Shell guard",
    "capability_id": "CAP-WEBKIT",
    "build_id": "B-F02-GUARD",
    "configuration": {
      "browser": "webkit",
      "version": "26.6",
      "device": "Linux desktop",
      "os": "Linux-7.0.0-38-generic-x86_64-with-glibc2.43"
    },
    "conditions": {
      "build_id": "B-F02-GUARD",
      "browser": "webkit 26.6",
      "device": "Linux desktop host with mobile viewport/touch media emulation",
      "os": "Linux",
      "viewport": "390x844 unless stated in state",
      "display_mode": "regular browser tab",
      "state": "Rerun the existing seven route-focus regressions after the Shell guard",
      "account_data": "mobile-audit-member; synthetic Today/check-in data",
      "setup": "Fresh local synthetic member context; real components and current guard; Stripe resources blocked as in standing fixture.",
      "steps": [
        "Run the existing seven route-focus cases in fresh contexts."
      ],
      "timing": "normal synthetic response unless a check declares delay/failure",
      "substitutions": "B-F02-GUARD + standing Stripe block; pass-through scrollBy trace where declared"
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/f02-selection.cases.txt",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/shell-focus.cases.txt"
        ],
        "reason": "Inspected scripts: real focus/native events run. The scrollBy wrapper only records arguments and calls the original; no focus suppression or restoration alteration is installed."
      }
    },
    "covers": [
      {
        "finding_id": "F-03",
        "scope_id": "webkit-journal-focus"
      }
    ],
    "replaces_check_id": "C-L-WK-FOCUS"
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
    "path": "src/components/pattern/TodayCheckIn.tsx",
    "summary": "Use existing contrasting token for only the reflection textarea border",
    "finding_ids": [
      "F-01"
    ]
  },
  {
    "path": "src/components/pattern/RouteFocus.tsx",
    "summary": "Observe completed new route navigation and place destination main focus without taking over history/anchors or deliberate focus",
    "finding_ids": [
      "F-03"
    ]
  },
  {
    "path": "src/routes/__root.tsx",
    "summary": "Mount RouteFocus once in the persistent application root",
    "finding_ids": [
      "F-03"
    ]
  },
  {
    "path": "tests/helpers/mobile-ui/main.tsx",
    "summary": "Run the same real RouteFocus in the isolated fixture root",
    "finding_ids": [
      "F-03"
    ]
  },
  {
    "path": "tests/helpers/mobile-ui/route-focus.cases.txt",
    "summary": "Seven maintained real-browser focus/navigation regression cases",
    "finding_ids": [
      "F-03"
    ]
  },
  {
    "path": "src/components/pattern/Shell.tsx",
    "summary": "F-02: skip main itself when revealing focused descendants; retain existing control/label clearance",
    "finding_ids": [
      "F-02"
    ]
  },
  {
    "path": "tests/helpers/mobile-ui/shell-focus.cases.txt",
    "summary": "Three real-browser scroll/focus regressions covering main, textarea and native radio label",
    "finding_ids": [
      "F-02"
    ]
  }
]
```

## 6. Device check script

Budget: 10 entries. Applied device-fix reservation: 5/5.

### C-GD01 [F-02] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs'}

Build: B-PHONE-GUARD
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

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-02",
    "regression_id": "DR-F02-SAFARI-COMPACT"
  }
]
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.
2. At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.
3. Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.
4. With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.
5. Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.
6. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD02 [F-02] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Bottom tabs'}

Build: B-PHONE-GUARD
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

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-02",
    "regression_id": "DR-F02-SAFARI-BOTTOM"
  }
]
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.
2. Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.
3. Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.
4. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD03 [F-02] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Top tabs'}

Build: B-PHONE-GUARD
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

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-02",
    "regression_id": "DR-F02-SAFARI-TOP"
  }
]
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.
2. Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.
3. Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.
4. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD04 [F-02] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / gesture navigation'}

Build: B-PHONE-GUARD
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

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-02",
    "regression_id": "DR-F02-ANDROID"
  }
]
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.
2. Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.
3. Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.
4. Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.
5. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD10 [F-02] {'browser': 'Safari', 'device': 'iPhone with supported external pointer', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs; external mouse/pointer; record exact hardware and input mode'}

Build: B-PHONE-GUARD
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

Device regression links (not original-scope coverage):
```json
[
  {
    "finding_id": "F-02",
    "regression_id": "DR-F02-SAFARI-POINTER"
  }
]
```

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

Steps:
1. Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.
2. With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.
3. Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state.

Expected: Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD05 [] {'browser': 'Safari + VoiceOver', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs / VoiceOver enabled'}

Build: B-PHONE-GUARD
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
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.
2. Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.
3. Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD06 [] {'browser': 'Chrome + TalkBack', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / TalkBack enabled'}

Build: B-PHONE-GUARD
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
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.
2. Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.
3. Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD07 [] {'browser': 'Safari', 'device': 'iPhone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'Compact tabs / browser interruption'}

Build: B-PHONE-GUARD
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
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.
2. Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.
3. Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD08 [] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / browser interruption'}

Build: B-PHONE-GUARD
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
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.
2. Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.
3. Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

### C-GD09 [] {'browser': 'Chrome', 'device': 'Android phone', 'os': 'record actual version', 'version': 'record actual version', 'display': 'regular tabs / remote DevTools'}

Build: B-PHONE-GUARD
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
1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.
2. Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.
3. Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result: ___
Build and setup as tested (confirm each, or note differences): ___
Notes: ___
Screenshot: ___

Beyond budget (titles only):

- Exact 320-CSS-pixel physical-phone configuration if none of the scheduled devices can provide it
- Optimized reading performance trace on real iPhone hardware with Safari Web Inspector

## 7. Open questions

- Ceiling proxy: Linux Chromium 149.0.7827.55 and desktop Playwright WebKit 26.6; no physical-device, OS keyboard/chrome, VoiceOver/TalkBack or simulator verification.
- F-02 is implemented with passing local checks; all physical checks are not_run and no finding is promoted to target Verified.
- Member-service and client-bootstrap substitutions remain; six save/reload checks establish synthetic fixture behavior only, not real backend persistence.
- Original failures and prior-build passes remain historical. Only new checks ran for the guard; broader retained audit coverage was not rerun wholesale.
- Existing F-01/F-03 source and unrelated settings/editorial work are preserved. No commit, push, deployment, dependency or plugin update.
- The final formatter changed only whitespace after selection trials; shell-focus and route-focus checks were rerun on final bytes, with equivalence recorded in source-identity.json.
- No production build was rerun for this focused guard change.
- Record correction does not retroactively validate the original application plan. Physical-device checks are still unrun; planned target levels do not raise the achieved proxy ceiling.
- This continuation changes only local runner source/tests/docs and a copied ledger. The preceding no-plugin-update statement records the earlier app-fix boundary; no installed package, cloud plugin, application file or release was changed here.
- No additional action is authorized by this handoff. Retain the valid-incomplete ledger, proxy ceiling and original scope/evidence.
- All ten current physical checks and twenty earlier physical plans remain not_run. Any future execution requires separately authorized actual device/build/setup evidence; the phone build/backend is still unprovisioned.
- F-01: confirmed finding is implemented
- F-02: confirmed finding is implemented
- F-02/DR-F02-SAFARI-COMPACT: device regression target verification not_run
- F-02/DR-F02-SAFARI-BOTTOM: device regression target verification not_run
- F-02/DR-F02-SAFARI-TOP: device regression target verification not_run
- F-02/DR-F02-ANDROID: device regression target verification not_run
- F-02/DR-F02-SAFARI-POINTER: device regression target verification not_run
- F-03: confirmed finding is implemented
- C-CH-CONTRAST: current recorded failure
- C-CH-FOCUS: current recorded failure
- C-WK-JOURNEY: current recorded failure
- C-WK-CONTRAST: current recorded failure
- C-WK-FOCUS: current recorded failure
- C-WK-MOUSE: current recorded failure
- C-L-FOCUS-RED: current recorded failure
- C-L-F02-BASE: current recorded failure
- C-L-F02-LOCAL: current recorded failure
- C-G-CH-SHELL-RED: current recorded failure
- C-G-WK-SHELL-RED: current recorded failure
- C-CH-CONTRAST: required verification incomplete
- C-CH-FOCUS: required verification incomplete
- C-WK-JOURNEY: required verification incomplete
- C-WK-CONTRAST: required verification incomplete
- C-WK-FOCUS: required verification incomplete
- C-WK-MOUSE: required verification incomplete
- C-L-F02-BASE: required verification incomplete
- C-L-F02-LOCAL: required verification incomplete
- C-GD01: required verification incomplete
- C-GD02: required verification incomplete
- C-GD03: required verification incomplete
- C-GD04: required verification incomplete
- C-GD05: required verification incomplete
- C-GD06: required verification incomplete
- C-GD07: required verification incomplete
- C-GD08: required verification incomplete
- C-GD09: required verification incomplete
- C-GD10: required verification incomplete

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
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/provenance.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
      ],
      "reason": "Read current source and project instructions"
    },
    {
      "id": "CAP-NODE",
      "environment": "automated_test",
      "driver": "agent",
      "status": "available",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/npm-test.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/validation.json"
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
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/chromium-today-390.png",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/confirm-chromium.json"
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
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a/webkit-today-390.png",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/confirm-webkit.json"
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
    },
    {
      "id": "B-LOCAL-FIX",
      "description": "Uncommitted F-01/F-03 local build; see source-identity.json for HEAD plus exact dirty file hashes; Vite bootstrap and member APIs remain substituted",
      "contains_fixes": [
        "F-01",
        "F-03"
      ],
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
      },
      "source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    },
    {
      "id": "B-RESUME-BASE",
      "description": "Source before the authorized F-01/F-03 edits; same original application bytes, new isolated launcher/cache on port 4208",
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
      "id": "B-PHONE-LOCAL",
      "description": "Planned source-matched non-production phone build of the local F-01/F-03 changes; not provisioned/deployed; confirm actual source hashes and backend before writes",
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
      },
      "expected_source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    },
    {
      "id": "B-F02-GUARD",
      "description": "Current uncommitted F-01/F-03 plus exact minimal F-02 guard; final source hashes in source-identity.json",
      "contains_fixes": [
        "F-01",
        "F-02",
        "F-03"
      ],
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
      },
      "source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    },
    {
      "id": "B-F02-PRE",
      "description": "Resume baseline with F-01/F-03 already present; Shell.before.tsx lacks F-02 guard",
      "contains_fixes": [
        "F-01",
        "F-03"
      ],
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
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/fixture-server.mjs",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/services.ts",
          "/home/ubuntu/pixel-perfect-view-757/tests/helpers/mobile-ui/main.tsx"
        ],
        "reason": "Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification."
      },
      "source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    },
    {
      "id": "B-PHONE-GUARD",
      "description": "Planned phone-reachable non-production build matching current source-identity.json and containing F-01/F-02/F-03. Not provisioned or deployed.",
      "contains_fixes": [
        "F-01",
        "F-02",
        "F-03"
      ],
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
      },
      "expected_source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
    },
    {
      "id": "B-GUARD-SOURCE",
      "description": "Current source for full Node test command and static checks; no Vite bootstrap is executed by this test command",
      "contains_fixes": [
        "F-01",
        "F-02",
        "F-03"
      ],
      "substitutions": {
        "status": "known",
        "items": [
          {
            "boundary": "test-specific data and external-service fixtures",
            "description": "Existing Node suite uses its own synthetic data and dependency controls; the Vite UI aliases are not the test runner.",
            "behavior": "replaced",
            "configured_response": "Per-test controlled inputs and responses; full suite command is node --test tests/*.test.mjs",
            "real_components": "Actual modules exercised by the existing tests",
            "untested": "Real provider, authentication, payment and production backend behavior"
          }
        ],
        "unknown_boundaries": [],
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/package.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/npm-test.txt"
        ],
        "reason": "Unit/synthetic suite results are scoped to their existing test fixtures."
      },
      "source_identity": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/source-identity.json"
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
    },
    {
      "kind": "browser",
      "command": "Seven maintained route focus cases in Chromium and WebKit; before-fix red baseline retained",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-chromium-red.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-chromium-final.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/route-focus-webkit-final.json"
      ]
    },
    {
      "kind": "browser",
      "command": "F-02 before/after local-build diagnostic traces and disposable controls; no application handler change",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-webkit-before.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-main-focus-control.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/f02-investigation.md"
      ]
    },
    {
      "kind": "shell",
      "command": "Full npm test, local npm run build, typecheck, scoped ESLint, formatting, changed-file Impeccable detector",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/validation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/npm-test.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/build.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/impeccable-changed.json"
      ]
    },
    {
      "kind": "workflow",
      "command": "Independent read-only code review and four focus/navigation probes in each browser",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review.md",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-chromium.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/independent-review-probes-webkit.json"
      ]
    },
    {
      "kind": "shell",
      "command": "Baseline hash/source identity/dirty-state comparison, inspected tooling hashes, scoped diff check and owned-resource cleanup",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/preservation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/cleanup.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/final-status.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/diff-check.txt"
      ]
    },
    {
      "kind": "browser",
      "command": "Focused Chromium/WebKit red-to-green focus regression, 40 repeated input trials including 6 synthetic saves/reloads, 14 route-focus checks",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/validation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/shell-focus-chromium-red.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/shell-focus-webkit-red.json"
      ]
    },
    {
      "kind": "shell",
      "command": "npm test; TypeScript; scoped ESLint and Prettier; diff and preservation checks",
      "status": "completed",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/validation.json",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/npm-test.txt",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/preservation.json"
      ]
    }
  ],
  "cleanup": {
    "status": "done",
    "evidence": [
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/cleanup.json",
      "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/preservation.json"
    ],
    "reason": "Closed only owned browser sessions and verified fixture process; unrelated work retained."
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
    },
    {
      "at": "2026-10-20T23:56:55.611247+00:00",
      "event": "explicit_authorization",
      "evidence": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/authorization.json",
      "mode": "audit_and_fix",
      "device_dependent_fixes": "propose_only"
    },
    {
      "at": "2026-10-20T23:56:55.611247+00:00",
      "event": "local_ordinary_fixes",
      "detail": "F-01 and F-03 implemented on a new dirty-source identity; no target Verified claim; original evidence/check IDs retained; F-02 cause revised without closure."
    },
    {
      "at": "2026-10-21T00:10:04.872234+00:00",
      "event": "explicit_F02_guard_authorization",
      "evidence": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/authorization.json",
      "mode": "audit_and_fix",
      "device_dependent_fixes": "apply_and_hand_off"
    },
    {
      "at": "2026-10-21T00:10:04.872234+00:00",
      "event": "minimal_F02_guard_implemented",
      "evidence": [
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/changes.patch",
        "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/validation.json"
      ],
      "physical_device_verification": "not_run",
      "target_plan": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/target-plan.json"
    },
    {
      "event": "record_planning_correction",
      "at": "2026-10-21T00:20:40.265196+00:00",
      "source_ledger": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/run.json",
      "source_sha256": "d6fcd8f295b03af4be19f6a2515d8dd5f505196453df08d25c56af1a324b21b9",
      "prior_F02_fix": {
        "applied": true,
        "device_dependent": true,
        "build_id": "B-F02-GUARD",
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/changes.patch",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/source-identity.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/target-plan.json"
        ],
        "required_check_ids": [
          "C-GD01",
          "C-GD02",
          "C-GD03",
          "C-GD04",
          "C-GD10"
        ],
        "proposal": "Applied only the main-landmark exclusion in revealFocus. All geometry, actual-control label targeting, native input, viewport and history behavior are retained."
      },
      "prior_F02_verification_ids": [
        "C-WK-JOURNEY",
        "C-WK-MOUSE",
        "C-L-F02-BASE",
        "C-L-F02-LOCAL",
        "C-G-CH-SHELL",
        "C-G-WK-SHELL",
        "C-G-CH-SELECT",
        "C-G-WK-SELECT",
        "C-GD01",
        "C-GD02",
        "C-GD03",
        "C-GD04",
        "C-GD10"
      ],
      "prior_F02_reason": "Explicit new user authorization permits the formerly proposed guard; remaining five distinct guard target entries fit the reserved 5 of the unchanged 10-entry budget. Physical-device verification remains unrun.",
      "prior_device_checks": {
        "C-GD01": {
          "id": "C-GD01",
          "module": 3,
          "required": true,
          "scenario": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari",
            "device": "iPhone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Compact tabs"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari",
            "device": "iPhone",
            "state": "Compact tabs",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
              "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
              "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
              "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
              "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
              "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.",
            "At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.",
            "Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.",
            "With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.",
            "Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "related_finding_ids": [
            "F-01",
            "F-02",
            "F-03"
          ],
          "replaces_check_id": "C-LD01"
        },
        "C-GD02": {
          "id": "C-GD02",
          "module": 3,
          "required": true,
          "scenario": "Check Bottom-tab chrome, keyboard and orientation transitions",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Check Bottom-tab chrome, keyboard and orientation transitions",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari",
            "device": "iPhone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Bottom tabs"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari",
            "device": "iPhone",
            "state": "Bottom tabs",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
              "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
              "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
              "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.",
            "Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.",
            "Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "replaces_check_id": "C-LD02",
          "related_finding_ids": [
            "F-02"
          ]
        },
        "C-GD03": {
          "id": "C-GD03",
          "module": 3,
          "required": true,
          "scenario": "Check Top-tab chrome, keyboard and orientation transitions",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Check Top-tab chrome, keyboard and orientation transitions",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari",
            "device": "iPhone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Top tabs"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari",
            "device": "iPhone",
            "state": "Top tabs",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
              "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
              "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
              "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.",
            "Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.",
            "Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "replaces_check_id": "C-LD03",
          "related_finding_ids": [
            "F-02"
          ]
        },
        "C-GD04": {
          "id": "C-GD04",
          "module": 3,
          "required": true,
          "scenario": "Exercise real Android keyboard, gesture bar and Back/Forward",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Exercise real Android keyboard, gesture bar and Back/Forward",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Chrome",
            "device": "Android phone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "regular tabs / gesture navigation"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Chrome",
            "device": "Android phone",
            "state": "regular tabs / gesture navigation",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
              "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
              "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
              "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
              "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.",
            "Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.",
            "Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.",
            "Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.",
            "Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately."
          ],
          "replaces_check_id": "C-LD04",
          "related_finding_ids": [
            "F-01",
            "F-02",
            "F-03"
          ]
        },
        "C-GD05": {
          "id": "C-GD05",
          "module": 1,
          "required": true,
          "scenario": "Complete the reader/check-in journey with VoiceOver",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Complete the reader/check-in journey with VoiceOver",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari + VoiceOver",
            "device": "iPhone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Compact tabs / VoiceOver enabled"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari + VoiceOver",
            "device": "iPhone",
            "state": "Compact tabs / VoiceOver enabled",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.",
              "Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.",
              "Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.",
            "Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.",
            "Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03."
          ],
          "related_finding_ids": [
            "F-03"
          ],
          "replaces_check_id": "C-LD05"
        },
        "C-GD06": {
          "id": "C-GD06",
          "module": 1,
          "required": true,
          "scenario": "Complete the reader/check-in journey with TalkBack",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Complete the reader/check-in journey with TalkBack",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Chrome + TalkBack",
            "device": "Android phone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "regular tabs / TalkBack enabled"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Chrome + TalkBack",
            "device": "Android phone",
            "state": "regular tabs / TalkBack enabled",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.",
              "Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.",
              "Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.",
            "Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.",
            "Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout."
          ],
          "related_finding_ids": [
            "F-03"
          ],
          "replaces_check_id": "C-LD06"
        },
        "C-GD07": {
          "id": "C-GD07",
          "module": 7,
          "required": true,
          "scenario": "Test real browser interruption and draft recovery",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Test real browser interruption and draft recovery",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari",
            "device": "iPhone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Compact tabs / browser interruption"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari",
            "device": "iPhone",
            "state": "Compact tabs / browser interruption",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.",
              "Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.",
              "Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.",
            "Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.",
            "Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version."
          ],
          "replaces_check_id": "C-LD07",
          "related_finding_ids": []
        },
        "C-GD08": {
          "id": "C-GD08",
          "module": 7,
          "required": true,
          "scenario": "Test Android interruption and draft recovery",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Test Android interruption and draft recovery",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Chrome",
            "device": "Android phone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "regular tabs / browser interruption"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Chrome",
            "device": "Android phone",
            "state": "regular tabs / browser interruption",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.",
              "Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.",
              "Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.",
            "Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.",
            "Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately."
          ],
          "replaces_check_id": "C-LD08",
          "related_finding_ids": []
        },
        "C-GD09": {
          "id": "C-GD09",
          "module": 7,
          "required": true,
          "scenario": "Measure the optimized reading on real Android hardware",
          "expected": "Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Measure the optimized reading on real Android hardware",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Chrome",
            "device": "Android phone",
            "os": "record actual version",
            "version": "record actual version",
            "display": "regular tabs / remote DevTools"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Chrome",
            "device": "Android phone",
            "state": "regular tabs / remote DevTools",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.",
              "Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.",
              "Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.",
            "Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.",
            "Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP."
          ],
          "replaces_check_id": "C-LD09",
          "related_finding_ids": []
        },
        "C-GD10": {
          "id": "C-GD10",
          "module": 7,
          "required": true,
          "scenario": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
          "expected": "Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.",
          "actual": "",
          "evidence": [],
          "reason": "Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.",
          "status": "not_run",
          "environment": "physical_device",
          "driver": "person",
          "evidence_type": "physical_device",
          "level": "unestablished",
          "behavior": "Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari",
          "capability_id": "CAP-HUMAN",
          "build_id": "B-PHONE-GUARD",
          "configuration": {
            "browser": "Safari",
            "device": "iPhone with supported external pointer",
            "os": "record actual version",
            "version": "record actual version",
            "display": "Compact tabs; external mouse/pointer; record exact hardware and input mode"
          },
          "conditions": {
            "build_id": "B-PHONE-GUARD",
            "browser": "Safari",
            "device": "iPhone with supported external pointer",
            "state": "Compact tabs; external pointer; original rapid native-anchor mouse-label activation",
            "account_data": "isolated synthetic test account",
            "setup": "Confirm test-only backend and record all build/setup substitutions; local harness aliases are not assumed to run on the phone",
            "steps": [
              "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
              "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
              "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
            ],
            "timing": "record actual timing, connection and every tested state",
            "substitutions": "unknown until independently confirmed"
          },
          "depends_on": [
            "member APIs"
          ],
          "substitutions": {
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
          },
          "covers": [
            {
              "finding_id": "F-02",
              "scope_id": "webkit-mouse-390"
            }
          ],
          "setup": "Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.",
          "steps": [
            "Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.",
            "With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.",
            "Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state."
          ],
          "replaces_check_id": "C-LD10",
          "related_finding_ids": [
            "F-02"
          ]
        }
      },
      "prior_tooling_limitations": [
        "The installed helper cannot validate the applied guard physical regression plan against F-02 original proxy-only affected scope. That scope names Linux desktop Playwright WebKit, while the planned checks correctly name actual phone browsers/configurations and an unprovisioned phone build. Native-control regression entries are related coverage, not evidence that the original desktop-mouse condition affected those phones. Source/proxy checks remain separate from required target checks. No original scope, browser/device, build, or achieved verification level was relabelled to obtain helper approval."
      ],
      "detail": "Corrected false direct-coverage and required-target associations; preserved original scope/evidence and applied history. All device entries remain unrun. No applied_before_run flag, fabricated application basis, reclassification or source edit was used to bypass the original gate."
    },
    {
      "at": "2026-10-21T00:39:39.112902+00:00",
      "event": "independent_device_regression_plan_adaptation",
      "source_ledger": "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-ledger-review-20261021/20261021T001940Z/run.json",
      "source_sha256": "6925e35bd5c6fba815b0fbfdbfcd05648efcfad3a48f5b60b04126501ea23490",
      "prior_F02_fix": {
        "applied": true,
        "device_dependent": true,
        "build_id": "B-F02-GUARD",
        "evidence": [
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/changes.patch",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/source-identity.json",
          "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/target-plan.json"
        ],
        "required_check_ids": [],
        "proposal": "Applied only the main-landmark exclusion in revealFocus. All geometry, actual-control label targeting, native input, viewport and history behavior are retained.",
        "device_regression_check_ids": [
          "C-GD01",
          "C-GD02",
          "C-GD03",
          "C-GD04",
          "C-GD10"
        ],
        "scope_verification_plan": {
          "status": "unmapped",
          "scope_id": "webkit-mouse-390",
          "required_target_check_ids": [],
          "reason": "No existing physical-device entry matches the preserved Linux desktop Playwright WebKit scope. Phone follow-ups are related guard regressions, not direct scope verification. The original application-plan gate remains unsatisfied."
        }
      },
      "prior_F02_reason": "The guard remains implemented from the prior authorized application. The earlier record conflated related physical-device regressions with direct coverage of the original desktop-WebKit scope. Count fitting the budget did not establish application-plan admission. The corrected original-scope target plan remains incomplete; no device test or target verification is claimed.",
      "prior_tooling_limitations": [
        "Original record error: related phone regressions were listed as exact verification of a desktop-emulation scope; the pointer entry also had an unsupported direct covers link. Those associations are corrected.",
        "Remaining contract/model gap: the original scope names desktop emulation, which the helper cannot accept as target. The planned phone browser/device, future build, states, steps and setup legitimately differ. Preserving these facts prevents complete original-scope target-plan admission under the installed helper.",
        "An unrun phone check now has planned level target with achieved_level unestablished, unchanged not_run/empty result/evidence and unavailable or declared capability. This is a plan correction, not an observed device result."
      ],
      "prior_next_steps": [
        "Retain the original-scope planning gap explicitly. The existing phone entries can support future related guard regression checks only; they cannot close the preserved desktop-emulation scope under the current helper.",
        "Keep all physical-device checks unrun until separately executed with actual device/build/setup evidence; no such execution occurred in this records-only review."
      ],
      "prior_device_planning_metadata": {
        "C-GD01": {
          "planning_role": "related_guard_regression",
          "planning_limit": "This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit)."
        },
        "C-GD02": {
          "planning_role": "related_guard_regression",
          "planning_limit": "This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit)."
        },
        "C-GD03": {
          "planning_role": "related_guard_regression",
          "planning_limit": "This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit)."
        },
        "C-GD04": {
          "planning_role": "related_guard_regression",
          "planning_limit": "This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit)."
        },
        "C-GD10": {
          "planning_role": "related_guard_regression",
          "planning_limit": "This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit)."
        }
      },
      "detail": "Local runner candidate 2.0.1 introduces separate device regression requirements. Original admission was not valid under installed 2.0.0; this new representation is validated by the local candidate only. No original scope, observation, applied fact, runtime result or achieved level changed. Physical-device execution remains not_run."
    }
  ]
}
```
