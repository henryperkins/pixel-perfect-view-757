# Pattern mobile web UX audit — 21 October 2026

**1. Verdict**

Ceiling: **proxy** — Linux Chromium 155.0.8059.12 and Playwright WebKit 26.6; no iPhone/Android device, OS simulator, real software keyboard or screen-reader execution.
Mode: **audit only**. Target: main member journey in `/home/ubuntu/pixel-perfect-view-757` at `c4c38208f5304cbf76e06606f24e82a50fae60e3`.
Principal task: read Today → optional reflection/check-in → save/recover → revisit Journal → explore a Pattern chapter, with birth/account navigation checked alongside it.
Three new **P2** findings remain open: selected birth-time help contrast, empty birth-field boundaries, and a code-supported signed-coordinate keypad risk. No P0/P1 was established within the checked scope.
Local interaction checks passed; target behavior and performance remain unqualified. No application source edits, commit, push, deployment or production write was performed.

**2. Coverage and standing substitutions**

`B-SOURCE` is the unchanged source revision, with exact hashes in [baseline-manifest.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/baseline-manifest.json). `B-PROXY` is a loopback Vite development fixture. Its compile-time service aliases replace auth, member/server mutations, model/ephemeris and billing functions with `mobile-audit-member` synthetic data. The pretend server persists selected records in sessionStorage, separately from the real client encrypted IndexedDB draft code. Unimplemented fixture methods return `{ok:true}` and remain unqualified. The fixture root/head/eager imports replace production bootstrap/SSR/chunking. Google Fonts is requested for representative typography.
Only the actual routes, Shell, controls, CSS, router, local draft controller and IndexedDB store establish UI evidence. The per-suite fault, storage, viewport, offline and Stripe differences are recorded in [substitution-index.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/substitution-index.json). Stripe is blocked in inspect/focused/chapter and route-focus contexts; that interception is not assumed in every suite or on a phone. Each ledger check records its build/setup/additional boundaries. Synthetic success never proves a real backend save, session revocation, chart source, model output or purchase.
Available capabilities were exercised against the target. Neither an OS simulator nor a physical-device interface was exposed, and no human results were supplied. No field origin or RUM/CrUX data was available. All phone entries name reserved `B-PHONE-C4C3820`, which has no reachable URL and unknown build/backend wiring.

| Area | Disposition | Environment / ceiling | Remaining evidence |
|---|---|---|---|
| Reach and placement | No defect found in checked scope | Source + both desktop engines / proxy | C-P01–04: actual grips, reach and missed taps. |
| Viewport and safe areas | No defect found in checked scope | Source + both desktop engines / proxy | C-P01–04: real chrome, insets, keyboard and orientation. |
| Touch targets | No defect found in checked scope | Source + both desktop engines / proxy | C-P01–04: actual touch feedback; R-01 is ergonomic advice. |
| Forms and keyboard | Defects found | Source + both desktop engines / proxy | C-P01–06: actual keyboard, autofill/IME scope and assistive use. |
| Gestures and scrolling | No defect found in checked scope | Source + both desktop engines / proxy | C-P01–04: native swipes/pinch/system edges. |
| Overlays, navigation and dense data | No defect found in checked scope | Source + both desktop engines / proxy | C-P04 native Android Back; C-P05/06 assistive navigation; populated dense table beyond budget. |
| Content priority | No defect found in checked scope | Source + both desktop engines / proxy | Actual generated reading quality and longer member records are outside synthetic qualification. |
| Performance | Not tested | Attempt failed; no usable metric result | C-P09/10 and a production field-data origin/window/access. |
| Errors and recovery | No defect found in checked scope | Source + both desktop engines / proxy | C-P07/08 plus real server/session behavior. |
| Accessibility on mobile | Defects found | Source + both desktop engines / proxy | C-P01–06 actual mobile zoom, keyboard, VoiceOver/TalkBack. |

The normal layout sample covers twelve routes at 320×568, 360×800, 390×844, 430×956, 667×375 and 844×390, plus root font 32px at 320×568, 390×844 and 667×375. This is **216 layout states** across two engines, with no page overflow, nav-label overlap or editable field below16px. Another **88 focused-control observations** found no covering by the measured sticky header/bottom navigation. Root-font stress is not phone zoom; screenshots use host fonts and zero native safe-area insets.
There were **192/192 passing behavioral assertions**: 97 Chromium and 95 WebKit. They cover draft navigation/reload, slow saves retaining later edits, lost-ack reconciliation without duplicate Journal creation in the synthetic service, failed request/retry UI, menu/history/focus, Unicode form input and scrolling. Chromium scroll probes use compositor touch; WebKit uses desktop wheel at phone dimensions. Desktop Back/Escape does not establish Android system Back or iOS edge gestures. The additional **12/12 existing birth/place unit tests** passed.
The **24 axe 4.14.0 state runs** have 18 clean runs and six failing runs that all consolidate into F-04. A dark WebKit scan also retained one incomplete color-contrast node; manual color calculations qualify the specific helper and empty-field claims only. Independent empty-boundary measurements establish F-05 even though axe does not report it. The installed Impeccable source detector returned `[]`; that result does not refute either measured defect.
All seven runner modules were reviewed for applicability and deepened against the journey. Module completion does not imply all ten master areas or target states passed. Performance had an attempted acquisition but no usable result: CPU4×, 200000B/s download, 93750B/s upload and150ms latency on a fresh Chromium context with warm Vite cache timed out at45s waiting for networkidle. **LCP, INP, CLS, TBT and field percentiles are not measured.** This is not classified as a production speed failure.

**3. Findings by severity**

**F-04 · P2 · Selected birth-time accuracy helper fails minimum text contrast**

Evidence class: **observed**. Status: **open**. Where: `src/components/pattern/BirthDetailsForm.tsx:314; selected accuracy label .border-primary > span.text-xs.text-muted-foreground` at the stated revision.
Expected: Informative 12px helper text in an enabled selected accuracy option reaches at least 4.5:1 in each theme (WCAG 1.4.3).
Actual: Both engines: selected Exact and Within ~15 min helper text measures 3.4403:1 in light and 4.1137:1 in dark. Axe 4.14.0 also reports color-contrast. No large-text, inactive, decoration or logo exception applies.
Reproduction: Open /birth at 390x844 with the saved synthetic record. → Inspect Exact helper; activate the visible Within ~15 min label. → Measure inherited .text-muted-foreground on selected .bg-accent in light and explicit .dark.
Cause or causal limit: The helper retains text-muted-foreground when its parent switches to the selected accent surface.
Affects: observed in both desktop proxy engines at390×844, selected Exact/Within~15min, light and explicit dark styles. High confidence in the contrast measurement; no physical-phone result. [BirthDetailsForm.tsx](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx) uses the same helper class for all options. The12px informative helper is neither inactive, large text, decorative nor a logotype. [WCAG1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) requires4.5:1 for that condition.
Evidence: [focused-v2-chromium.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json), [focused-v2-webkit.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json), [inspect-chromium.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/inspect-chromium.json), [webkit-birth-accuracy-dark.png](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-accuracy-dark.png). Original scoped checks: C-CH-AXE-05/06/07 and C-WK-AXE-05/06/07 fail. No substituted boundary is needed for the scoped color measurement; dark activation itself is an explicit harness setup.
Fix: **proposed, not applied**. Use the existing accent foreground for the helper when its accuracy option is selected; retain muted foreground for unselected options. Recheck all four selections in both themes; preserve labels and native radios.
Checks still needing target evidence: C-P01, C-P02, C-P03 and C-P04. Those currently lack a reachable test build. Any actual patch needs new checks/build identity; unchanged-build phone passes do not silently verify an unapplied fix. Severity is runner task impactP2: supporting information or a manual fallback has substantial friction, while stronger labels/search/paste remain workarounds. The axe “serious” label and WCAG level are retained separately from this impact rating.

**F-05 · P2 · Empty birth inputs lack a sufficiently contrasting visual boundary**

Evidence class: **observed**. Status: **open**. Where: `src/components/pattern/BirthDetailsForm.tsx:23 and :449; src/styles.css --input in light/dark themes` at the stated revision.
Expected: Enabled empty manual fields remain visually identifiable without relying on current value, focus, hover or placeholder text; required boundary/fill reaches 3:1 (WCAG 1.4.11).
Actual: After clearing manual Latitude and blurring it, border-to-fill is 1.3934:1 light and 1.7864:1 dark; border-to-surround is 1.3263:1 and 1.7439:1. Fill-to-surround is only 1.0506:1 and 1.1100:1. Empty Latitude/Longitude have no placeholder or icon that identifies their editable bounds. A focused Timezone ring passes, but does not identify the other unfocused empty fields.
Reproduction: Open /birth and Enter coordinates manually. → Clear Latitude, Longitude and Timezone; move focus away from the coordinate field being measured. → Inspect empty enabled controls in both themes.
Cause or causal limit: The shared birth inputClass uses low-contrast border-input and a card fill close to the surrounding surface.
Affects: enabled, empty, unfocused manual Latitude/Longitude in the current birth form; both desktop engines and themes. The measured empty Latitude reproduces the shared class. This is an authored control with no placeholder/icon inside the coordinate field; labels identify purpose but do not distinguish the editable bounds. Inactive and unmodified-UA exceptions do not apply. The low-contrast fill supplies no alternative visual boundary. A focused ring on a different field cannot identify this empty unfocused control. [WCAG1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) supplies the3:1 identification threshold.
Evidence: [focused-v2-chromium.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-chromium.json), [focused-v2-webkit.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json), [chromium-birth-empty-light.png](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/chromium-birth-empty-light.png), [webkit-birth-empty-dark.png](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/webkit-birth-empty-dark.png). Checks C-CH-EMPTY-LIGHT/DARK and C-WK-EMPTY-LIGHT/DARK fail. Similar border-input styling on blank auth fields is a related review lead; filled selectors, disabled location fields and decorative rules are not automatically included in this defect.
Fix: **proposed, not applied**. Give BirthDetailsForm inputClass a stronger existing semantic border token, as TodayCheckIn already does with border-muted-foreground. Verify unfocused/focused/error/disabled states in both themes and narrow/enlarged layouts. Review similar blank auth inputs as a related location; do not globally darken decorative rules or automatically classify filled selects as criterion failures.
Checks still needing target evidence: C-P01, C-P02, C-P03 and C-P04. Those currently lack a reachable test build. Any actual patch needs new checks/build identity; unchanged-build phone passes do not silently verify an unapplied fix. Severity is runner task impactP2: supporting information or a manual fallback has substantial friction, while stronger labels/search/paste remain workarounds. The axe “serious” label and WCAG level are retained separately from this impact rating.

**F-06 · P2 · Signed coordinate fields request a keypad that may omit minus**

Evidence class: **code-supported**. Status: **open**. Where: `src/components/pattern/BirthDetailsForm.tsx:451; src/lib/birth-form.ts:60 and :84` at the stated revision.
Expected: The manual path supports accepted negative coordinates without needing geocoding, a hardware keyboard or clipboard workaround.
Actual: Latitude and Longitude request inputMode=decimal while validation accepts negative decimal values. Current MDN documents that decimal keyboards may omit minus. Programmatic -33.8688/-151.2093 entry succeeds in both proxies; no physical-keyboard failure is claimed.
Reproduction: Read the manual coordinate input configuration and accepted-value validator. → On the target, focus the manual fields and try typing negative values with the software keyboard without pasting. → Record the actual OS, browser, keyboard, locale and available sign keys; leave untested configurations unresolved.
Cause or causal limit: Keyboard hint is narrower than the accepted signed input on some potential target keyboard configurations; exact affected device/keyboard versions need acquisition.
Affects: source mechanism for manual signed entry intended for iPhone Safari and Android Chrome. Exact OS/browser/keyboard/locale configurations lacking a minus key remain unknown; no physical failure is asserted. [MDN inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode), checked2026-10-21, says decimal keyboards may omit minus. The12 existing module tests and proxy input show accepted negatives; neither exercises an OS keyboard.
Evidence: [BirthDetailsForm.tsx](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/BirthDetailsForm.tsx) line451, [birth-form.ts](/home/ubuntu/pixel-perfect-view-757/src/lib/birth-form.ts), [birth-place-tests.txt](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/birth-place-tests.txt) and [focused-v2-webkit.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/focused-v2-webkit.json). C-SOURCE-SIGNED records the source mismatch; programmatic signed entry passes in both engines. C-P01–04 are new target-acquisition plans and will not automatically refute the independent source observation.
Fix: **proposed, not applied**. Proposed only: retain text inputs and use a full text keyboard hint for manual signed coordinates, or provide an explicit accessible sign control after target investigation. Preserve valid negatives, decimals, coordinate ranges and timezone strings; never replace with an unsigned numeric keypad. Run C-P01 through C-P04 before choosing a device-specific alternative.
Checks still needing target evidence: C-P01, C-P02, C-P03 and C-P04. Those currently lack a reachable test build. Any actual patch needs new checks/build identity; unchanged-build phone passes do not silently verify an unapplied fix. Severity is runner task impactP2: supporting information or a manual fallback has substantial friction, while stronger labels/search/paste remain workarounds. The axe “serious” label and WCAG level are retained separately from this impact rating.

The earlier [run.json](/home/ubuntu/pixel-perfect-view-757/docs/reviews/mobile-ux-pilot/2026-10-21/runner-planning/run.json) and its full evidence/history remain unchanged. F-01 (Today reflection boundary), F-02 (WebKit mouse activation/scroll reset) and F-03 (route focus) remain **implemented** there, with their original pending target plans. Current proxy runs show Today border-to-fill5.655:1 light and6.324:1 dark; exercised check-in selections pass; all seven route-focus cases per engine pass. These are observations on this new build/environment, not target verification, closure of the intermittent original F-02 scope or supersession of old failed checks.

**4. Recommendations and Impeccable assessment**

R-01: The home brand link measures40px tall. Consider a44px hit area when next editing Shell. It already exceeds the24px minimum, so this is ergonomic/project consistency guidance, not an AA target-size failure. The inline permission link is within prose and is not treated as a standalone target failure. [WCAG2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) distinguishes size, spacing and exceptions.
R-02: Consider in-page jump links to the account sections of Context & privacy. The sampled phone route puts recurring membership/security tasks after a long source/consent list. Jump links can shorten repeat access while retaining the existing content and layout. No new platform API or redesign is justified by this audit.
Implementation integrity: coherent product-specific evidence disclosures, retained chapters, scoped drafts, semantic controls and shared tokens. The detector reports no primary hits. The chapter interaction check confirms closed visited content stays mounted/inert and reopening does not issue another synthetic narrative request. No real writer/provider quality or membership entitlement claim follows from that test.
| Impeccable dimension | Provisional assessment | Evidence limit |
|---|---|---|
| Accessibility | 2/4 | Good semantics/focus but two measured contrast defects; screen readers untested. |
| Performance | Unscored | Throttled development acquisition timed out; no representative performance values. Unscored to avoid inventing a result. |
| Theming | 3/4 | Consistent tokens, both themes rendered; selected helper and input border contrast need repair. |
| Responsive | 3/4 | 216 geometry states and native-like proxy interactions pass; hardware keyboard/chrome/gesture qualification absent. |
| Implementation integrity | 4/4 | Source detector empty; product-specific chapter/evidence/draft structure, shared tokens and controls retained. |
Assessed subtotal:12/16 across four dimensions. No /20 total or rating band is assigned while performance is unscored. The installed technical audit workflow was executed; no independent design critique or critique closure is claimed. If fixes are later requested, use the scoped adapt/clarify/harden recommendations above, finish with scoped Impeccable polish, and rerun the affected checks.

**5. Changes made**

Audit mode permits report/evidence artifacts only. No application source was edited. The fixture-server copy, CLI probes and configurations live under [mobile-ux-audit-20261021](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021). The schema2 ledger, generated report and summary live under [20261021T015453Z-b20f378d](/home/ubuntu/pixel-perfect-view-757/.mobile-ux/runs/20261021T015453Z-b20f378d). No dependency installation/upgrade, context rewrite, Git mutation, deployment or production write was performed.
Two original focused probes failed because Playwright check() targeted an sr-only radio directly. The visible label was the intended target. Both original error logs and the initial script are retained; corrected v2 uses native label activation and then completes all three behavioral checks in both engines. The failed throttled performance acquisition is retained as an unqualified gap. None of these records was deleted to produce a green outcome.
Final preservation/resource check: pending cleanup.json. It compares all2550 pre-existing tracked/untracked file hashes (the initial snapshot also included this run’s newly initialized ledger, which is excluded from preservation expectations) and the earlier ledger hash, closes only the two named audit browser sessions, and stops only the verified owned Vite node process.

**6. Device check script — ten entries, all not run**

Budget10, no applied fixes and no reserved applied-device-fix entries. These entries are plans pending an exact-source phone-reachable **non-production** build and independently confirmed test backend. They are not ready for writes. The tester must report actual OS/browser/device versions and actual CSS width; a desktop resize is not a narrow physical-device configuration. Each orientation, keyboard and enlarged state is independently reportable. A partial report leaves omitted portions unrun. Local harness aliases and Stripe blocking do not transfer onto a phone.
The build is `B-PHONE-C4C3820`, an unprovisioned build of unchanged `c4c38208f5304cbf76e06606f24e82a50fae60e3`. Substitutions active in every entry: **build: unknown** until inspected; **setup: unknown** until test-backend/account/fault-control/keyboard wiring is confirmed. Confirming the source/build does not confirm backend/setup or resolve an unknown. If the build or scenario changes, issue a new check ID referencing the prior entry. Contrast fixes have not been applied, so an observed contrast defect remains a legitimate outcome on this build.

**C-P01 [F-04, F-05, F-06] · iPhone / Safari / Compact tabs**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P02 [F-04, F-05, F-06] · iPhone / Safari / Bottom tabs**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P03 [F-04, F-05, F-06] · iPhone / Safari / Top tabs**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P04 [F-04, F-05, F-06] · Android phone / Chrome / regular tab / gesture navigation**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. Open Birth record/manual coordinates; inspect empty/unfocused fields and selected accuracy help. Type -33.8688 and -151.2093 using the software keyboard without paste; record sign-key availability, keyboard/locale and any workaround. Check date, time and timezone input. Do not infer this passes on another keyboard or locale.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P05 · iPhone / Safari / Compact tabs / VoiceOver**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn VoiceOver on. Read the headline and content in order, use Today section links and check-in radios; report names, group/value announcements and focus after selection.
3. Type a test reflection, submit once to the confirmed backend and inspect pending/error/confirmed announcements. Navigate to Journal and back, open/close the navigation disclosure, inspect chapter collapse/inert content and field/helper descriptions.
4. Record rotor destinations, reading order, focus destination/return, keyboard focus visibility, and any silent errors. Do not infer TalkBack behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P06 · Android phone / Chrome / regular tab / TalkBack**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn TalkBack on. Read Today in order, use section shortcuts and each radio group; record names, values and selected state.
3. Enter and save one test note only after test-backend confirmation; record pending/error/confirmed announcements and navigation to Journal and back.
4. Test the menu with Android Back, chapter collapse, error/helper descriptions, and focus restoration. Record failures separately; do not infer VoiceOver behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P07 · iPhone / Safari / Compact tabs / recovery**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type a unique test reflection and a separate Journal draft. Wait for the device-draft confirmation; background the tab, trigger a genuine tab discard/reload if available, then return and compare every field. State explicitly if you only reloaded.
3. With a confirmed test backend supporting a controlled lost-ack scenario, save once while the backend applies the mutation but the acknowledgement is withheld. If this setup is unavailable, leave this portion not run.
4. Use Check save/reconciliation and compare canonical saved test records; ensure no duplicate entry and preserve any newer typing. Restore connectivity and inspect draft state; report each portion independently.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P08 · Android phone / Chrome / regular tab / recovery**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type unique test Today and Journal drafts. Wait for local-draft status, background and genuinely discard the tab if available, reopen and compare fields; distinguish reload from discard.
3. Use the isolated backend controlled lost-ack setup to apply one mutation then withhold its response; if not provisioned, leave this portion not run.
4. Run Check save and compare canonical test records and duplicate counts. Confirm newer text remains; restore connectivity and record each result separately.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P09 · iPhone / Safari / Compact tabs / measured performance**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Safari Web Inspector to this actual device; record hardware, OS/browser, connection, cache and CPU conditions. Use a production-mode test build with this exact source and record all service/build differences.
3. Record comparable navigation and principal interactions with Web Inspector timelines. Report available LCP, layout-shift and interaction/long-task measurements with traces and tool support limits; write not measured for unsupported metrics.
4. Record loading, tap feedback, keyboard and navigation delays on the actual device. Do not label a single lab trace field performance or call an arbitrary tap duration INP.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

**C-P10 · Android phone / Chrome / regular tab / measured performance**

Build: B-PHONE-C4C3820, exact source above; unprovisioned. Substitutions active in this check: build: unknown; setup: unknown. Setup: Provision a phone-reachable non-production build at c4c38208f5304cbf76e06606f24e82a50fae60e3. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.
1. Confirm source identity and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Chrome remote debugging to the actual phone; record hardware, OS/browser, network, cache and throttle conditions. Use a production-mode test build with this exact source, documenting service/build differences.
3. Collect a Performance panel navigation and scripted/manual principal-interaction trace. Report measured lab LCP/CLS and event/INP diagnostics where available; attach trace and collection conditions.
4. Record representative mid-range hardware behavior, loading/tap feedback and long tasks. Separate these lab observations from field percentiles and do not infer Safari behavior.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open on this unchanged build until contrary evidence qualifies or fixes are applied.
Result: ___
Build as tested (confirm or note difference): ___
Setup as tested (confirm or note difference): ___
Notes: ___ Screenshot/trace: ___

Beyond-budget titles: Safari external-pointer reproduction of historical F-02 under all original timing conditions; Complete populated placements/aspects comparison with screen reader; Saved-data autofill/password-manager and IME combinations beyond the primary device entries; Independent installed/PWA-mode audit if that display mode becomes supported. These are unrun; no hardware coverage is silently discarded.

**7. Open questions and next acquisition**

- A phone-reachable non-production build of the named source and a verified isolated test backend/account are needed before device writes. No phone build or URL was provisioned in this audit.
- Actual device/OS/browser versions, Safari tab layouts, keyboard/locale, narrow available CSS width, screen-reader access and network conditions remain unreported.
- A backend-controlled lost-ack test facility is needed for the specific C-P07/C-P08 reconciliation scenarios; without it those portions remain not run.
- A production origin, collection window and RUM/CrUX access are needed for field metrics; current LCP/INP/CLS/TBT claims remain not measured. A production-mode test build is needed for useful device lab traces.
- Actual generated reading quality, provider/model identity in live use, full populated chart tables, checkout, connected assistants and admin content were not qualified. Those are separate scopes.
- Source edits remain unrequested. The two color repairs and signed-input proposal are concrete review items, not implemented fixes.

The next deep dives are module3 on actual software keyboards (F-06), module2 on real browser chrome/insets, module5 on native Android Back/iOS dismissal, and module7 on real-device recovery/performance. VoiceOver/TalkBack remain explicit work under module1. These needs are mapped to the ten script entries above, not implied to have passed.

The ledger validator reports structural validity, not authentic evidence or product readiness. Its expected exit3 preserves current defect failures, unrun target checks and missing performance coverage. A completed available-environment audit is not a claim that mobile target verification is complete.

**Measured field attributes**

The table below retains inspected purposes and attributes; “default” means no explicit attribute. Reflection autocomplete=off is intentional because this is private prose. Signed coordinate formats remain supported in the proposals. Full collected metadata is in [field-table.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-audit-20261021/field-table.json).
| Field | Accepted input/purpose | type | inputmode | autocomplete | enterkeyhint | autocapitalize | spellcheck |
|---|---|---|---|---|---|---|---|
| Reflection note · optional | Unicode/multiline prose, up to2000 chars | textarea | text | off | enter | sentences | default |
| Birth date | Valid calendar date | date | default | bday | next | default | default |
| Birth time (local)Use the local time at your birth place. | Local HH:mm; optional only for Unknown time | time | default | default | next | default | default |
| Birth place | Place name with Unicode/punctuation, up to160 chars | text | default | off | search | default | default |
| Latitude | Signed numeric coordinates within -90..90; decimal negatives confirmed | text | decimal | default | next | none | false |
| Longitude | Signed numeric coordinates within -180..180; decimal negatives confirmed | text | decimal | default | next | none | false |
| Timezone | IANA timezone string | text | text | default | done | none | false |
| Email | Browser-valid email; max200 chars | email | email | email | next | default | default |
| Password | 8..200 chars, password not captured | password | default | current-password | done | default | default |
| Title | Journal text up to400 chars | text | default | default | default | default | default |
| Entry | Unicode/multiline Journal text up to4000 chars | textarea | default | default | default | default | default |
| Date | Journal calendar date | date | default | default | default | default | default |
