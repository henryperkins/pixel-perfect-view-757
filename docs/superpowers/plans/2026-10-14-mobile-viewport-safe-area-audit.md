# Pattern mobile viewport and safe-area audit

2026-10-14 · Main member flow · Current iOS Safari and Android Chrome are the target support matrix.

## 1. Summary

- **P1:** Save notifications covered primary navigation; the repaired notification clears it by 16 CSS px in both desktop engines.
- **P1:** Enlarged-text menus extended below the screen; their bounds now use the measured header and available fixed-navigation space.
- **P2:** Repaired standalone error-page overflow, full-page `100vh` minima, and three fluid-type expressions with viewport-only preferred terms.
- Both engines pass 72 normal route/viewport cases and 15 additional large-text cases; build, typecheck, changed-code lint and formatting pass.
- Real toolbar transitions, safe areas, keyboard, pinch zoom and standalone remain **Not tested**. LCP, INP and CLS are **not measured**.

### Scope, journey and evidence

**Principal journey: read Today and save a personal check-in/reflection.** This is inferred from the member interface, not traffic analytics.

1. Open Today and read the daily reflection.
2. Use the Check-in shortcut; choose a band and enter a note.
3. Save and observe the account-save confirmation.
4. Navigate to Journal for the separate journal-entry flow.
5. Return to Today and reload; confirm the check-in remains.

Walked at **360×800 before the detailed sweep**, using real components with synthetic authentication, chart/member records and server responses. The initial walk exposed the notification interception in V01; the completed baseline walk waited for its dismissal. The final walk completes without that wait in both engines. Check-in persistence was confirmed on returning to Today; this report does not claim that Journal displays check-ins.

**Target:** local working tree in `/home/ubuntu/pixel-perfect-view-757`, based on commit `e8eee400592848033df1e36d3fef6a123ad9b5c8`, including the preceding mobile remediation. React 19, TanStack Start/Router, Tailwind 4 and the existing global CSS/component system. This request's explicit delivery of changed CSS/HTML authorizes these focused local repairs.

**Inputs:** source plus `http://127.0.0.1:4199/`, the local synthetic-service fixture. No production/member/model calls. No physical phone or OS simulator was available. All browser evidence is **Render**, using desktop Chromium **155.0.8059.12** and desktop WebKit **26.6**, not iPhone Safari or Android Chrome device evidence.

Rendered routes: `/`, `/journal`, `/auth`, `/onboarding`, `/timing`, `/pattern`, `/privacy`, `/birth`, `/plans`, `/time-travel`, the real root not-found component, and the exact HTML returned by `renderErrorPage()`. The last two use fixture paths `/__audit/not-found` and `/__audit/server-error`; they are not added production routes. The React exception boundary was inspected in code; its error trigger was not separately rendered.

Normal viewports: **320×568, 360×800, 390×844, 440×956, 667×375, 844×390**. Additional cases increase the root font to 32 px; these stress text layout and are **not physical 200% pinch zoom**. A 1000×600 comparator isolates the fluid-type branch outside the principal phone-width matrix.

Evidence and exact source identities: [measurement index](../../../output/playwright/mobile-viewport-2026-10-14/README.md), [verification summary](../../../output/playwright/mobile-viewport-2026-10-14/verification-summary.json), [checksums](../../../output/playwright/mobile-viewport-2026-10-14/source-checksums.json). Baseline and final measurements are retained separately. Citations below use final source line numbers; the [incremental patch](../../../output/playwright/mobile-viewport-2026-10-14/viewport-fixes.patch) preserves the before/after source for this audit alone.

## 2. Area dispositions

A repaired issue remains **Defect found**. “No defect found” applies only to the stated evidence.

| Requested area                                        | Disposition                                                           | Evidence and boundary                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Viewport units                                     | **Defect found** — V02, V04                                           | The Shell and root recovery wrappers used `min-h-screen`; standalone error HTML used `100vh`. In-flow minima now use `100vh` then `100svh`. The fixed deletion dialog already has `100vh` then `100dvh` maximum heights (`src/styles.css:3210`). No `-webkit-fill-available` hack was found.                                                                                                                        |
| 2. Document scrolling                                 | **No defect found** in the page scroller                              | All 72 normal cases per engine use `HTML` as `document.scrollingElement`; Shell overflow is visible. No full-height app wrapper captures vertical scrolling. The menu and dialog have intentionally bounded internal scrolling; the menu bound had V02. Hidden screen-reader text and collapsed chapter content are not page scrolling wrappers. iOS status-bar tap and toolbar collapse remain untested.           |
| 3. Viewport meta and zoom permission                  | **No defect found** in code                                           | `src/routes/__root.tsx:83` and `src/lib/error-page.ts:7` contain `width=device-width, initial-scale=1`. No `user-scalable=no`, scale cap, or `viewport-fit=cover`. Physical zoom remains untested.                                                                                                                                                                                                                  |
| 4. Safe areas and fixed/sticky edges                  | **Defect found** — V01; physical insets **Not tested**                | Notification overlap with the app's fixed bottom bar is reproduced and repaired. Safari's default viewport containment is retained. No missing-cover-padding defect is asserted for a page that does not opt into cover. Notch, island, home indicator, changing bottom insets and landscape cutouts require a device.                                                                                              |
| 5. Safari Compact/Bottom/Top layouts and bar colors   | **Not tested** — no iOS device/simulator                              | Apple documents all three layouts. WebKit's reported iOS 26.1 fixed-overlay color issue is marked as fixed upstream; neither its presence nor its shipped fix in a particular Safari build was established for Pattern. See the source note below.                                                                                                                                                                  |
| 6. Horizontal overflow, 320/360 px and landscape      | **Defect found** — V03; repaired                                      | Standalone recovery HTML overflowed by 8 px at each sampled portrait width. Final normal and text-stress cases have `scrollWidth === clientWidth`; a long URL/email fixture also fits at 320 px without dropping text. No global overflow-hiding patch was added.                                                                                                                                                   |
| 7. Fluid type                                         | **Defect found** — V05; repaired                                      | Three `clamp()` preferred values used `vw` alone. They now include `rem`, preserving the existing min/max sizes. This is not a WCAG zoom certification.                                                                                                                                                                                                                                                             |
| 8. Installed PWA / standalone                         | **Not tested** — device and product support decision missing          | No web-app manifest, service worker registration, Apple app/status-bar meta or standalone CSS branch was found in the source scan. That does **not** make iOS standalone inapplicable: Safari 26 permits any site to open as a Home Screen web app. The site has its own primary navigation, menu, home links and dialog Cancel; standalone status-bar clearance and complete return navigation still need testing. |
| Virtual-keyboard behavior within this viewport module | **Not applicable** to viewport-unit fixes; **Not tested** on hardware | `svh`/`dvh` do not normally track keyboard occlusion. Existing focus/VisualViewport behavior is unchanged. Follow up in Module 3.                                                                                                                                                                                                                                                                                   |

Apple's [Safari layout guide](https://support.apple.com/guide/iphone/change-the-layout-ipha9ffea1a3/26/ios/26) describes Compact, Bottom and Top. The [WebKit overlay-tint report](https://bugs.webkit.org/show_bug.cgi?id=302272) records the iOS 26.1 report and an upstream fix; it is a regression-test case, not evidence of a current Pattern defect. [WebKit's Safari 26 release notes](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) explain the expanded Home Screen behavior.

## 3. Findings, ranked by journey impact

### V01. Save notifications intercept primary navigation — P1 — Code + Render

- **Where:** `src/components/ui/sonner.tsx:7` renders the default bottom-positioned Toaster; `src/components/pattern/TodayCheckIn.tsx` emits the save message. Fixed app navigation is `.mobile-journey`; repair at `src/styles.css:3221`.
- **Affects:** shared layout code in iOS Safari/WebKit and Android Chrome/Blink; reproduced in both named desktop engines, portrait 320/360 px and landscape 667/844 px. Physical touch interception is not independently reproduced.
- **Cause:** the notification used the library's viewport-bottom offset without accounting for the fixed app navigation. At 360×800 its rectangle was y=711–784 while navigation occupied y=727–800; hit testing found the notification over all four navigation-link centers. At both landscape widths it covered Timing and Journal.
- **Fix — Implemented and Verified in Render:** set the existing `.toaster` bottom position to the larger of the measured fixed-navigation height and bottom safe inset, plus 16 px, below the existing 1024 px navigation breakpoint. Five cases per engine now leave a 16 px gap and all 20 link-center hit tests per engine reach their intended link. No dependency or new positioning system.
- **States handled:** **toolbar expanded, toolbar collapsed, landscape** through viewport anchoring plus measured app-bar clearance. The same rule is available in **standalone**, but its physical insets are unverified. This does not claim keyboard clearance.
- **Verify on device:** save a check-in and immediately tap each primary tab while its notification is visible. Repeat with all Safari tab layouts, toolbar expanded/collapsed, large text and both orientations. Record actual taps, not just rectangles.

### V02. Enlarged header pushes the mobile menu below the viewport — P1 — Code + Render

- **Where:** `.mobile-menu`, `src/styles.css:407`; header measurement at `src/components/pattern/Shell.tsx:69` and `:336`.
- **Affects:** iOS Safari/WebKit and Android Chrome/Blink layout; reproduced in both desktop engines at 320×568 with a 32 px root font. Short landscape is an additional regression state.
- **Cause:** the menu's old `calc(100dvh - 160px)` budget assumed fixed surrounding heights. When the header grew to 224 px, its 408 px menu ended at y=632, 64 px below a 568 px viewport. Its last content could be below the visible bottom even after internal scrolling.
- **Fix — Implemented and Verified in Render:** the existing ResizeObserver also measures the header's top row, excluding the menu. The menu subtracts that row, any currently fixed bottom navigation, and 4 px for the progress/border area from `100svh`, with a `100vh` fallback. The viewport term stays stable during toolbar movement; measured control clearance can still adapt when the header/navigation changes. Final bottom: y=564 at 320×568; after scrolling to the end, Sign out is fully visible at y=452–540 and its center receives the hit. All three enlarged-text menu-end cases pass per engine.
- **States handled:** **toolbar expanded and collapsed** with a stable small-viewport budget; **landscape** and enlarged text with measured header space. **Standalone** uses the same budget; physical verification remains open.
- **Verify on device:** open the menu with large text, scroll to Sign out without activating it, then close the menu. Repeat after rotation and toolbar changes. Confirm the final row and Close are visible and reachable, and the document remains the main page scroller.

### V03. Server recovery HTML creates horizontal and unnecessary vertical scrolling — P2 — Code + Render

- **Where:** `src/lib/error-page.ts:9`; `.card` at `:11`. This HTML is returned by the server/start error handlers independently of the Tailwind stylesheet.
- **Affects:** iOS Safari/WebKit and Android Chrome/Blink box sizing; reproduced in both desktop engines at 320, 360, 390 and 440 px portrait widths. Extra vertical height was also measured in landscape.
- **Cause:** `width:100%` plus card padding used the default content box. The body's `min-height:100vh` also excluded its padding. At 320×568 the card was 336 px wide, from x=-8 to x=328; document width was 328 and height was 616. No loss of error-message text was established, so this is not presented as a proven WCAG reflow failure.
- **Fix — Implemented and Verified in Render:** give this independent HTML its own border-box reset and constrain/wrap the card. Its stable page minimum is covered by V04. Final 320×568 document: 320×568; card: 272 px wide, x=24–296. No clipping or overflow suppression. Narrow and enlarged-text recovery cases pass in both engines.
- **States handled:** **toolbar expanded, collapsed, landscape**, and the same error response if opened **standalone**. Actual browser-chrome/status-bar behavior remains untested.
- **Verify on device:** serve the real error response in a controlled test, try to pan horizontally at 320/360-equivalent layout width, rotate, enlarge text, and activate Try again/Go home. Confirm the full message and actions remain reachable.

### V04. Short page states use the large viewport as their minimum height — P2 — Code; device effect Inferred

- **Where:** Shell root at `src/components/pattern/Shell.tsx:320`; root not-found/error wrappers at `src/routes/__root.tsx:21` and `:49`; independent recovery HTML at `src/lib/error-page.ts:10`. Shared replacement at `src/styles.css:222`.
- **Affects:** iOS Safari and Android Chrome with expanding browser UI, especially short/loading/recovery states. Long content already exceeding a viewport may not visibly change. No physical toolbar obstruction was measured.
- **Cause:** Tailwind `min-h-screen` and the independent `100vh` minimum use the large viewport, which can exceed the visible area while browser controls are expanded. A dynamic minimum on in-flow content could instead move layout during scrolling.
- **Fix — Implemented; source and desktop render checked:** use `min-height:100vh; min-height:100svh`, retain document scrolling, and change the root wrapper class to `.viewport-page`. Keep the deletion dialog's existing `100vh`/`100dvh` maximum-height pair because it is a fixed overlay. No fill-available workaround.
- **States handled:** **toolbar expanded** without the large-viewport minimum; **collapsed** with stable in-flow sizing; **landscape** on actual viewport resize. **Standalone** has no browser toolbar, but its status-bar treatment must still be checked. The fallback retains older browsers' previous sizing behavior.
- **Verify on device:** compare Today loading, not-found and server-error states with the toolbar shown/hidden in each Safari layout and Chrome. Confirm no height-driven jump or unreachable recovery control. Recheck orientation. Desktop `vh`, `svh` and `dvh` equality cannot validate this behavior.

### V05. Fluid headings ignore font preferences while the viewport term wins — P2 — Code + Render

- **Where:** `src/styles.css:1229` (`.travel-intro h1`), `:1271` (`.travel-date-display time`), `:1609` (`.timing-intro h1`, `.timing-loading h1`).
- **Affects:** shared CSS in iOS Safari and Android Chrome, primarily wider landscape layouts. The existing rem minimum already controls ordinary 320–440 px portrait headings; no portrait text-size failure is asserted.
- **Cause:** preferred values `4vw` and `3.2vw` depend only on width until a rem limit wins. In the 1000×600 comparator, increasing the root font from 16 to 20 px changed the date from 32 to only 32.5 px. This is a font-preference experiment, not a physical zoom measurement.
- **Fix — Implemented and Verified in Render:** use `1.25rem + 2vw` for headings and `1rem + 1.6vw` for the date, retaining their original bounds. At the comparator's default font both remain 40/32 px; at root 20 px the date becomes 36 px. The 360 px portrait sizes remain unchanged. The 844 px landscape type changes slightly, as recorded in both result files.
- **States handled:** **landscape** and orientation changes, including when browser UI is **expanded or collapsed**. **Standalone** uses the same text rules. This improves the fluid term; actual 200% text/zoom usability remains a device acceptance gate.
- **Verify on device:** use supported browser text-size settings and 200% pinch zoom in Timing/Time travel. Rotate with long dates/headings; check readable growth, wrapping and reachable date-navigation controls.

### Changed CSS and HTML

The [complete incremental patch](../../../output/playwright/mobile-viewport-2026-10-14/viewport-fixes.patch) contains all four production-file changes, including the existing Shell observer extension. The essential CSS is:

```css
/* V04: stable in-flow pages, expanded/collapsed toolbars and rotation. */
.pattern-shell,
.viewport-page {
  min-height: 100vh;
  min-height: 100svh;
}

/* V02: menu stays inside the stable viewport after header text wraps. */
.mobile-menu {
  max-height: calc(
    100vh - var(--pattern-header-bar-height, 80px) - var(--pattern-bottom-nav-height, 80px) - 4px
  );
  max-height: calc(
    100svh - var(--pattern-header-bar-height, 80px) - var(--pattern-bottom-nav-height, 80px) - 4px
  );
  overflow-y: auto;
}

/* V01: portrait/landscape bottom navigation stays tappable after Save. */
@media (max-width: 1023px) {
  .toaster[data-sonner-toaster][data-y-position="bottom"] {
    bottom: calc(
      max(var(--pattern-bottom-nav-height, 0px), env(safe-area-inset-bottom, 0px)) + 16px
    );
  }
}

/* V05: keep the original font-size bounds with a font-relative term. */
.travel-intro h1,
.timing-intro h1,
.timing-loading h1 {
  font-size: clamp(2.25rem, 1.25rem + 2vw, 3.25rem);
}
.travel-date-display time {
  font-size: clamp(1.625rem, 1rem + 1.6vw, 2.375rem);
}
```

Generated markup changes remove `min-h-screen` from the Shell and use `viewport-page` on both recovery wrappers:

```html
<div class="pattern-shell bg-background text-foreground has-journey">…</div>
<div class="viewport-page flex items-center justify-center bg-background px-4">…</div>
```

The independent server-error HTML adds the following rules to its own `<style>` block. It cannot rely on the app stylesheet being available:

```css
/* V03/V04: all narrow and landscape recovery states. */
*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  min-height: 100vh;
  min-height: 100svh;
}
.card {
  min-width: 0;
  overflow-wrap: anywhere;
}
```

Both viewport meta declarations are intentionally retained as:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

The default Safari insetting model is suitable for the current design; enabling cover is not necessary to fix these defects. If cover is introduced later, coordinate top padding for the header/skip link, bottom padding for navigation/notifications/sheets, and both horizontal insets for all edge surfaces and content in landscape. [WebKit explains the default containment and cover tradeoff](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).

**Support checked:** small/dynamic viewport variants are Baseline widely available; support begins at Safari/iOS 15.4 and Chrome/Chrome Android 108. `100vh` is retained first for older engines. No non-Baseline API or dependency was introduced. The existing `ResizeObserver`, `env()` and `clamp()` approaches are retained. [Support history and Baseline status](https://web-platform-dx.github.io/web-features-explorer/features/viewport-unit-variants/), [MDN viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length). Dynamic units can update with throttling, and the virtual keyboard normally does not resize them; keyboard handling is a separate test. [Viewport-unit caveats](https://web.dev/blog/viewport-units).

## 4. Opportunities

**Home Screen return to Today — Proposed, contingent on standalone qualification.** The observed daily check-in and return-to-Today step could benefit from a Home Screen entry point. Safari 26 can already provide that without an app manifest. Validate the existing flow's status-bar clearance and in-app return navigation before promoting it. No install prompt, manifest, offline promise or dependency was added.

## 5. Device test plan and completion gates

**Completed locally:** the principal journey in both engines; 72 normal route/viewport cases per engine; 15 root-font stress cases; six open-menu cases plus three last-row hit tests; four bounded deletion-dialog cases; five toast cases/20 navigation hit targets; nine font samples; and one long-URL/email case at 320 px. Build, typecheck, changed-code ESLint and Prettier pass. No new unit tests were added for CSS strings. Existing unrelated files were preserved: 1,413 baseline files unchanged, six intended source/fixture files changed, zero unexpected changes. No dependency, commit, push or deployment.

**Still required:** the following physical-device work is the remaining completion plan. Record device model, exact OS/browser build, viewport dimensions, orientation, toolbar layout/state and an annotated screenshot or recording for each failure. Measured values must retain their source.

| Step                       | Real iOS Safari                                                                                                           | Real Android Chrome                                                                                                   | Acceptance                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Principal journey          | Small supported iPhone plus a large notched/island iPhone; current Safari                                                 | Mid-range phone at approximately 360 CSS px; current Chrome                                                           | Complete the five journey steps with one thumb, two thumbs and cradled grips; save feedback must not intercept navigation.               |
| Browser UI                 | Compact, Bottom and Top; each expanded and collapsed; repeat after rotation                                               | Address bar expanded/collapsed in portrait and landscape                                                              | Header/navigation remain attached correctly; no gaps, hidden end controls or in-flow jumps. Capture the actual browser chrome.           |
| Narrow/text layout         | Normal font, enlarged browser text and 200% pinch zoom; pair with the recorded 320 px reflow render                       | Same; inspect larger Android font/display settings separately                                                         | Read all text; scroll the menu to its last action; no unintended horizontal page pan. Do not equate pinch zoom with root-font emulation. |
| Cutouts and home indicator | Rotate both directions; inspect header, bottom navigation, notification and dialog around notch/island/home indicator     | Test any cutout and gesture-navigation inset                                                                          | All important content and actions remain inside usable bounds. Default viewport containment remains enabled.                             |
| Scroll and overlays        | Swipe the document, tap the status bar to return to top, open menu/delete dialog before and after toolbar collapse        | Swipe document/panel boundaries; use system Back with dialog open                                                     | Page scroll remains native; bounded menu/dialog content can reach its end; Cancel/Back close the dialog and return focus.                |
| Bar color                  | Record both bar regions with deletion overlay open/closed in all three layouts; inspect the sticky translucent header too | Compare overlay backdrop and browser-chrome contrast                                                                  | Record any current-build mismatch. Do not infer failure from the historical 26.1 report or assume `theme-color` fixes it.                |
| Keyboard handoff           | Focus the check-in field near the bottom, rotate, dismiss/reopen the keyboard                                             | Repeat with Chrome's virtual keyboard                                                                                 | Field and Save stay usable; input remains. Any failure belongs to Module 3; do not change units to guess at keyboard height.             |
| Recovery                   | Trigger controlled not-found/server-error responses while preserving the test account's draft                             | Same                                                                                                                  | Message and recovery buttons remain reachable; reload/back does not silently lose entered work.                                          |
| Standalone                 | Add to Home Screen with Open as Web App, then cold-launch and resume from background                                      | If standalone is intended, qualify an installed build; otherwise record Not applicable for that Android configuration | Status bar/home indicator do not cover content; every tested route/dialog has an in-app way to return or cancel without browser Back.    |

Finish this work in order: (1) save navigation and menu reachability, (2) toolbar/safe-area/standalone matrix, (3) keyboard and actual zoom, (4) record any additional defects with the same evidence rules and apply only the smallest confirmed repair. A deploy and authenticated production walkthrough are separate, subsequently authorized checks.

**Deep-dive modules 2–7 next:** prioritize **3 — forms/keyboard**, explicitly named in this request, because viewport units do not cover keyboard occlusion; then **2 — viewport/safe areas** for the physical gaps above. For **4–7**, the separate module catalog was not supplied: prioritize touch/gesture and overlay/navigation checks around V01/V02, followed by accessibility and performance/recovery qualification. These labels are topics to map to that catalog, not invented canonical module names. The long synthetic render sweep is not a measurement of mid-range-device performance.

## 6. Open questions

- Which physical iPhones and Android phones/browser builds can be used for the remaining acceptance run, and what non-production authenticated URL/account should that run target?
- Is standalone/Home Screen use a supported product mode? iOS 26 can expose it even without a manifest, so the source scan alone cannot answer this.
- What are the exact titles of deep-dive modules 4–7? Module 3 follows the forms/keyboard designation in the latest request.

No answer is needed to retain the completed local fixes. Physical-device evidence and a deployment are not implied by the passing desktop checks.
