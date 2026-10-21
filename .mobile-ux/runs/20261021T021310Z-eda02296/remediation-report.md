# Birth form remediation and device handoff

**Achieved verification ceiling: proxy — Linux Chromium 155.0.8059.12 and Playwright WebKit 26.6, using the documented synthetic local fixtures.** All three findings are implemented and the current relevant checks passed. Physical-phone keyboard and browser behavior remain unrun. No finding is promoted to Verified. The main remaining risk is whether signed entry stays usable across actual keyboard, browser-chrome, orientation and enlargement states. No commit, push or deployment occurred.

This is the authorized continuation of [the immutable audit ledger](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T015453Z-b20f378d/run.json). It applies F-04/F-05/F-06; earlier F-01/F-02/F-03 history remains separate. The original 543 checks and every original Affects/evidence record are unchanged. Current detailed results are in [post-fix-results.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/post-fix-results.json); full records are in [run.json](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T021310Z-eda02296/run.json).

## 1. Verdict and current validation

| Check | Current result |
| --- | --- |
| Focused form red/green | Before editing: 42/66 passed and 24 intended failures per engine. After editing: 66/66 passed per engine, on both /birth and /onboarding. |
| Behavioral assertions | 215/215 across both engines: 132 focused form + 34 core member-flow + 37 Today form/recovery + 12 synthetic birth-save/readback assertions. The 132 focused assertions include 40 form geometry states. |
| Broader layout and focus | 216 layout states and 88 focused-control states passed; 4 long-URL/reduced-motion checks passed. These are separate from the focused 40 form geometry states. |
| Accessibility scans | 24 axe 4.14 states: zero reported violations. One WebKit birth-manual-dark color-contrast node remains incomplete/manual review. This is not whole-WCAG conformance. |
| Full project tests | npm test: 1,213 total; 1,209 passed; 4 skipped; 0 failed. Skips remain visible in npm-test.txt. |
| Compiler / lint / format | tsc --noEmit, scoped ESLint and Prettier all exited 0. |
| Production build | npm run build exited 0. Warnings remain for native config/paths, route splitting, deprecated server-function inputValidator calls, large chunks and ignored inlineDynamicImports. Build output was generated locally; no deployment. |
| Independent review | No important defects found in the actual source diff, red/green probes or independent device-admission plan. Reviewer did not assess the final assembled report; coordinator validation is separate. |

Evidence: [Chromium focused results](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-chromium.json), [WebKit focused results](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/birth-green-webkit.json), [synthetic save results](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/submission-chromium.json), [unit log](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/npm-test.txt), [build log](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/build.txt), [independent review](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/independent-review.md).

The ledger helper is expected to return exit 3: structurally valid but incomplete. It retains historical failed baseline checks and failed development-performance acquisition alongside the new passing proxy checks, and it retains unrun target checks. Its verification=failed/incomplete is not a new failed fixed-build regression. Proxy passes are not used to erase old failures or satisfy target qualification.

## 2. Coverage and substitutions

Standing substitutions for B-FIX-LOCAL, desktop emulation only: server/member/auth/model/billing imports use tests/helpers/mobile-ui/services.ts, with synthetic member@example.invalid data and a pretend sessionStorage server; unimplemented methods can return {ok:true} and are unqualified. Vite configFile:false/envFile:false mounts the real route components, Shell, RouteFocus, CSS and MemberDraftProvider through the test bootstrap/head/eager imports. Real production SSR, network timing and backend boundaries are not represented.

B-FIX-SUBMISSION adds a separately explicit synthetic birth-save/readback adapter with revision/range checks, numeric payload capture, canonical pretend-record reload, controlled error and pending responses. It qualifies actual form input/validation/serialization/recovery against that adapter, without qualifying real authentication, persistence/encryption, chart/UTC computation, model providers, billing or ephemeris.

Per-check additions are recorded in the ledger and saved probes: theme class, root-font/viewport/media stress, Playwright keyboard events, canvas conversion of computed colors, delayed/dropped acknowledgements, stale geocoding, forced storage errors, offline transitions, synthetic visualViewport/Chromium page scale, injected axe and scan-scoped Stripe interception. Non-font remote requests are blocked by the focused/save/inspection probes. These are scoped additions; they are not phone build/setup facts. B-FIX-PHONE has independently unknown build and setup wiring.

| Master area | Disposition in checked scope | Environment / highest level | Remaining work |
| --- | --- | --- | --- |
| 1. Reach and placement | No defect found in executed scenarios | Source + desktop proxy | C-FIX-D01..04: real grips/reach and missed taps. |
| 2. Viewport and safe areas | No defect found in executed scenarios | Desktop proxy | C-FIX-D01..04: chrome, insets, actual keyboard and native enlargement. |
| 3. Touch targets | No defect found in executed scenarios | Desktop proxy | C-FIX-D01..04: physical tap feedback and grip. |
| 4. Forms and keyboard | Defects found; fixes implemented, target pending | Source/automated + desktop proxy | F-04/F-05/F-06 implemented; C-FIX-D01..04 keyboard regression and C-FIX-D05/06 assistive technology. |
| 5. Gestures and scrolling | No defect found in executed scenarios | Retained audit desktop proxy | C-FIX-D01..04: pinch, native edges/overscroll; no fresh full gesture audit. |
| 6. Overlays, navigation and dense data | No defect found in executed scenarios | Retained audit + current core desktop proxy | C-FIX-D04 native Back; C-FIX-D05/06 assistive navigation; full populated dense tables unqualified. |
| 7. Content priority | No defect found in executed scenarios | Retained audit + current layout desktop proxy | Actual generated member writing and long real records not qualified. |
| 8. Performance | Not tested | Not qualified | C-FIX-D09/10 actual device traces; field origin/window/RUM access missing. |
| 9. Errors and recovery | No defect found in executed scenarios | Automated + desktop proxy | C-FIX-D07/08 genuine discard and controlled real test-backend lost acknowledgements. |
| 10. Accessibility on mobile | Defects found; fixes implemented, target pending | Source/automated + desktop proxy | C-FIX-D05/06 VoiceOver/TalkBack; C-FIX-D01..04 native zoom/keyboard; one axe incomplete node. |

Seven-module orchestration is separate from those ten areas: principal journey; viewport/chrome/safe areas; keyboard/forms; touch/gestures; overlays/history/dense data; performance; Impeccable design/accessibility. Prior audit modules remain reviewed with their historical evidence. This continuation completed relevant form/shared-flow verification and handoff; it did not rerun every historical script. Copied scroll, full overlay, chapter and route-focus scripts are not counted as current executions.

## 3. Findings by severity

All three findings are P2. Original observations, scope IDs and evidence remain immutable in the parent and current ledger. New checks describe the fixed local source. None establishes physical-device completion.

| Finding | Before | After, both engines | Status |
| --- | --- | --- | --- |
| F-04 selected helper text | Light 3.44:1 / dark 4.11:1 | Light 7.20:1 / dark 8.69:1, all 4 options, both routes | Implemented |
| F-05 empty field boundary to fill | Light 1.39:1 / dark 1.79:1 | Light 5.66:1 / dark 6.32:1 | Implemented |
| F-05 empty boundary to surrounding surface | Light 1.33:1 / dark 1.74:1 | Light 5.38:1 / dark 7.02:1 | Implemented |
| F-06 accepted signed entry vs keyboard hint | Decimal hint could omit minus; no phone failure observed | Full text keyboard hint, with signed entry/validation/drafts/payload/readback passing in proxies | Implemented; four device regressions unrun |

Location/revision for all: [BirthDetailsForm.tsx](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx), base `c4c38208f5304cbf76e06606f24e82a50fae60e3` plus [changes.patch](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch); exact source SHA-256 `cab0ae46b74f280489009b69faaa7bec507cdfc0d157a43d0b17641ad74606de`.

**F-04 — Selected birth-time accuracy helper fails minimum text contrast.** Evidence class Observed; deterministic; status implemented. Original affected scopes: helper-ch-light, helper-ch-dark, helper-wk-light and helper-wk-dark on /birth. At 390x844, select Exact or Within ~15 min using the visible radio label and inspect the 12px helper against the selected accent surface in both themes. Expected at least 4.5:1; original actual 3.4403/4.1137:1. Cause: the helper stayed text-muted-foreground on the selected accent surface. The fix conditionally uses text-accent-foreground while preserving the native radio, label and unselected styling. Fixed checks exercise all four selections in both themes on /birth and /onboarding and measure 7.2047/8.6949:1. Relevant new checks: C-FIX-CH-BIRTH-01..08 and C-FIX-WK-BIRTH-01..08, with equivalent onboarding cases 34..41; current axe cases 05..07 per engine. Remaining device observations share C-FIX-D01..04; actual assistive journeys are C-FIX-D05/06. Color measurement is proxy computed/painted-color evidence, not a physical-phone screenshot measurement.

**F-05 — Empty birth inputs lack a sufficiently contrasting visual boundary.** Evidence class Observed; deterministic; status implemented. Original affected scopes: empty-ch-light/dark and empty-wk-light/dark. Open manual coordinates, clear Latitude/Longitude/Timezone and move focus away. Expected an identifiable empty enabled boundary reaching 3:1 against adjacent surfaces; original border-to-fill 1.3934/1.7864:1 and border-to-surround 1.3263/1.7439:1. Cause: border-input and the card/surrounding fills were too close. The form-local shared input class now uses the existing border-muted-foreground semantic token; decorative global rules are not changed. Empty/focused fields now pass contrast in both themes and both routes, with invalid-range, error/pending, reflow and draft scenarios retained. Relevant new checks: C-FIX-CH-BIRTH-09..12 / C-FIX-WK-BIRTH-09..12 and onboarding 42..45; save/error/pending probes C-FIX-CH-SAVE-01..06 and C-FIX-WK-SAVE-01..06. Real phone focus/zoom and visible boundaries remain in C-FIX-D01..04.

**F-06 — Signed coordinate fields request a keypad that may omit minus.** Evidence class Code-supported; determinism unknown; status implemented. Original scope signed-source-policy remains static/mechanism: validation accepts negative coordinates while the previous decimal keyboard hint could omit minus. No affected phone/keyboard/version or actual native failure was observed. The fix requests inputMode=text for manual coordinate text fields, allowing a full keyboard without changing signed numeric parsing, bounds, timezone slashes, draft data or submit logic. Browser tests type ASCII negative decimals and explicit plus signs; test +/-90 and +/-180,0/-0, invalid/out-of-range text and correction; reload encrypted drafts; inspect emitted numeric payloads and synthetic canonical saved records; retain entered values across a synthetic failure and 750ms pending save. Hint-policy assertions fail before and pass after. Relevant new checks: C-FIX-CH-BIRTH-13..22 / C-FIX-WK-BIRTH-13..22 and onboarding 46..55; all 12 synthetic-save assertions. DOM/keyboard events do not demonstrate an OS keyboard. Independent target requirements DR-F06-D01..04 link to C-FIX-D01..04, source scope signed-source-policy; each is not_run. Source scope and historical mechanism evidence are unchanged.

The chosen text hint follows the documented input modalities: decimal keyboards can omit minus and text requests a normal text keyboard. See [MDN inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode) and the [HTML inputmode specification](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute). Accessibility criteria: [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## 4. Recommendations

R-01 and R-02 remain optional, separate from these defects: consider a 44px brand-home link when Shell is next touched (measured 40px; no 24px AA failure claimed), and consider jump links to account settings on the long Context & privacy page. They were not implemented in this scoped repair. Full populated tables, non-default IME/autofill combinations and installed/PWA mode remain outside the selected device budget.

## 5. Changes and preservation

One application file changed: BirthDetailsForm.tsx. It now selects the accent foreground for selected accuracy help, uses stronger existing semantic input borders and requests a text keyboard for manual signed coordinates. The real parser, ranges, date/time and timezone logic, provider/source policies, drafts and save semantics are unchanged. Evidence/probe/report files were added locally under the current run and output directories.

The current UI probes activate visible labels and actual inputs, compute contrast from real rendered colors and preserve details for review. They are one-off audit artifacts; no implementation-mirroring source-string test was added. Before editing, the v1 harness incorrectly demanded mobile 16px fonts at a 1280px desktop width; that harness-only expectation was corrected to the existing desktop 14px contract in v2, then the 24 intended failures per engine were established before application. Original v1 output remains retained.

Independent review and final preservation check found no important source/plan defects. All2,553 unrelated pre-existing files match their baseline hashes, unrelated Git status is identical, HEAD is unchanged, the original audit SHA-256 is unchanged and the recovery archive was checked against both original source and original ledger. Scoped git diff --check passed. Both named browsers and only the verified owned loopback fixtures are stopped; ports 4224/4225 are closed. See [cleanup.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/cleanup.json), [independent-review.md](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/independent-review.md), [source-identity.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json) and [changes.patch](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch). No commit, push or deployment.

## 6. Remaining device script

The full actionable script is [device-checks.md](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T021310Z-eda02296/device-checks.md). It includes exact build identity, setup, ordered transitions, expected outcomes and separate blank result/build/setup/notes/screenshot fields for every entry. The four independent signed-keyboard regressions use 4 of the 5 reserved slots within the 10-entry budget. Phone build/backend prerequisites are unprovisioned, so the script is not presented as ready to run.

| Entry | Target configuration / task | State |
| --- | --- | --- |
| C-FIX-D01 | iPhone / Safari / Compact tabs: Primary journey, keyboard, insets and manual signed coordinates | Not run |
| C-FIX-D02 | iPhone / Safari / Bottom tabs: Bottom-tab chrome/keyboard and manual signed coordinates | Not run |
| C-FIX-D03 | iPhone / Safari / Top tabs: Top-tab chrome/keyboard and manual signed coordinates | Not run |
| C-FIX-D04 | Android phone / Chrome / regular tab / gesture navigation: Primary journey, real Android Back and signed coordinates | Not run |
| C-FIX-D05 | iPhone / Safari / Compact tabs / VoiceOver: VoiceOver principal journey and form feedback | Not run |
| C-FIX-D06 | Android phone / Chrome / regular tab / TalkBack: TalkBack principal journey and form feedback | Not run |
| C-FIX-D07 | iPhone / Safari / Compact tabs / recovery: Safari background/discard and uncertain-save recovery | Not run |
| C-FIX-D08 | Android phone / Chrome / regular tab / recovery: Android background/discard and uncertain-save recovery | Not run |
| C-FIX-D09 | iPhone / Safari / Compact tabs / measured performance: Real iPhone performance with Safari Web Inspector | Not run |
| C-FIX-D10 | Android phone / Chrome / regular tab / measured performance: Real Android performance with Chrome remote debugging | Not run |

All four primary entries cover both birth routes, default software-keyboard sign/decimal access, pasted signs, validation/correction, timezone slashes, draft reload, canonical test save, portrait/short landscape, real chrome/keyboard transitions, narrow supported available width and 200% enlargement. Original proxy mechanism observations and these independently planned target regressions remain distinct. Unknown/unsupported conditions must remain unrun.

## 7. Open questions and execution prerequisites

- Phone-reachable non-production B-FIX-PHONE URL and exact source/patch confirmation are missing. No deployment is authorized at this stage.
- Isolated test backend/account/data and controlled lost-ack failure wiring are not provisioned. Confirm independently from the build before writes; unknown service wiring does not become none merely because a build hash matches.
- Actual device models, OS/browser versions, keyboard/locale, supported narrow widths and availability of each Safari tab layout are not reported. Record actual states; unavailable portions remain unrun.
- No physical keyboard/chrome/safe-area/gesture/screen-reader execution has been supplied. All ten actual/result fields and evidence arrays remain empty.
- One WebKit axe color-contrast node is incomplete/manual review; manual contrast measurements cover the repaired helper and input boundaries, without a whole-page accessibility claim.
- Performance remains unqualified. Device entries name Safari Web Inspector and Android Chrome remote debugging; field claims additionally need a production origin, collection window and RUM/CrUX access. Earlier development acquisition timeout is retained as failed/unmeasured evidence.
