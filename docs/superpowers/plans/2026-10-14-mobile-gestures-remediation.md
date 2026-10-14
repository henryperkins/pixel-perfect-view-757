# Mobile gestures and scroll areas: implementation and verification

Date: 2026-10-14. Mode: **audit and fix**, authorized by “address all findings comprehensively.” Target: Pattern's main member journey; current iOS Safari and Android Chrome. React/TanStack/Tailwind/global CSS and the existing Button system. No new dependency.

## 1. Summary

- **G01 implemented:** browser resize measures layout without scrolling back to stale focus.
- **G02 implemented:** the three long-note fields contain vertical boundary scrolling.
- **G03 implemented:** Timing choices wrap; native placement tables have Previous/More column buttons.
- Enlarged-text fixes keep filters in document flow, stack column controls when needed, and preserve room beside sticky labels.
- Code and desktop-render verification are complete below; physical phone/browser-chrome/keyboard/AT qualification remains open.

**Principal journey:** Today → read guidance → choose mood and write reflection → save → Journal → Today and reload. Five checkpoints per engine passed at **360 × 800**, including retained reflection. The fixture uses the real routes with synthetic services and does not contact member/model services. This proves local UI behavior, not production persistence.

Evidence: [original audit](../../../output/playwright/mobile-gestures-2026-10-14/audit-before/report.md), [verification ledger](../../../output/playwright/mobile-gestures-2026-10-14/verification-summary.json), [Chromium journey](../../../output/playwright/mobile-gestures-2026-10-14/journey-chromium.json), [WebKit journey](../../../output/playwright/mobile-gestures-2026-10-14/journey-webkit-final.json). Chromium **155.0.8059.12** used mobile emulation; WebKit **26.6** used desktop mode with touch support at phone widths because mobile WebKit cannot provide the wheel probe. Every browser result is **Render**, including CDP touch injection. No Device evidence is claimed.

## 2. Area dispositions

| Area                                                       | Disposition after implementation          | Evidence / limits                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carousels and drag sliders                                 | **Not applicable**                        | None imported into active member screens. Mood/energy are tap controls.                                                                                                       |
| Horizontal scroll areas and tap alternatives               | **Defect found — fixed, Render verified** | G03. Every Timing choice is directly tappable. Placement columns can be paged by buttons, keyboard or native horizontal pan.                                                  |
| Custom gestures and listeners                              | **No defect found** in tested behavior    | No new gesture recognizer or cancelling touch listener. Column-boundary observation uses a passive scroll listener with cleanup. Existing modal library behavior is retained. |
| OS edge collisions                                         | **Not tested**                            | Real iOS/Android edge navigation is unavailable. New table buttons and exposed filters avoid depending on edge gestures.                                                      |
| Textarea scroll chaining                                   | **Defect found — fixed, Render verified** | G02. All three fields contain both boundaries; interior and outside scrolling remain available.                                                                               |
| Menu/dialog scroll areas                                   | **No defect found** in tested states      | Existing containment/locking retained; native touch probes cover interior, boundary and backdrop behavior. Physical iOS qualification remains open.                           |
| Root refresh policy                                        | **No defect found** in code               | Document remains the scroller; root overscroll stays `auto`. OS pull-to-refresh is **Not tested**.                                                                            |
| Scroll hijacking / resize movement                         | **Defect found — fixed, Render verified** | G01. Height/VisualViewport resize no longer follows old radio/textarea focus. New focus still clears sticky navigation.                                                       |
| Reduced motion                                             | **No defect found** in tested states      | Column buttons use immediate scrolling for reduced motion; normal scrolling remains confined to the table. Existing reading-motion overrides are retained.                    |
| Legacy momentum CSS / hidden scrollbars                    | **No defect found**                       | No obsolete `-webkit-overflow-scrolling` or author-hidden scrollbar rule added. Native touch action remains unrestricted.                                                     |
| Maps / canvases / swipe-only dismissal                     | **Not applicable**                        | Absent from the selected member flow.                                                                                                                                         |
| Physical devices, keyboard, VoiceOver/TalkBack, standalone | **Not tested**                            | Require an actual supported device/OS/browser. LCP, INP and CLS are **not measured**.                                                                                         |

## 3. Findings and implemented fixes

All original findings were **P2**. No P0/P1 was established in the audit. Order reflects impact on the principal journey.

### G01. Viewport resize pulls the reader back to old focus — P2 — Code + Render

**Where:** [Shell.tsx:113](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/Shell.tsx:113).

**Affects:** Reproduced in Chromium mobile emulation and desktop WebKit, **360 × 800 → 360 × 740 → 360 × 800 portrait**. Actual current iOS Safari/Android Chrome toolbar expansion/collapse is **Inferred** from the shared resize path and remains a device check.

**Cause:** Resize scheduled focus reveal even when the person had deliberately scrolled away from a still-focused mood radio or note field.

**Fix — Implemented; Verified in Render:** Resize now only measures layout. The explicit `focusin` reveal and listener/observer cleanup remain. In both engines, the old-focus test stays at **scrollY 0** through shrinking, expansion and a VisualViewport resize event; before the fix it jumped to **471 px / 470 px**. A separate test confirms newly focused text remains above the bottom navigation.

```ts
const resize = () => {
  // Browser chrome can resize after the reader scrolls away from a focused control.
  // Only a new focus action should reveal it again.
  measure();
};
```

**Verify on device:** Select mood, scroll back to the reading, then expand/collapse browser UI. Repeat with a focused note, keyboard opening/dismissal, orientation change, external-keyboard focus and 200% zoom. Reading position should remain user-controlled; newly focused fields must still be visible. Keyboard-specific behavior is not established by the height-only desktop probe.

### G02. Long notes pass boundary scrolling to the page — P2 — Code + Render

**Where:** [styles.css](/home/ubuntu/pixel-perfect-view-757/src/styles.css), scoped to `.today-check-in-note textarea`, `.journal-compose textarea`, `.journal-entry-editor textarea`.

**Affects:** Reproduced and repaired in Chromium mobile emulation and desktop WebKit. Field checks cover **360 × 800 portrait** and **667 × 375 landscape**. Current Android Chrome and iOS Safari require physical keyboard/touch confirmation.

**Cause:** Valid long notes exceed the native textarea's row count; default overscroll lets a boundary gesture continue on the document.

**Fix — Implemented; Verified in Render:** Scoped vertical containment, preserving native editing. Both engines pass interior, top-boundary, bottom-boundary, outside-field scrolling and input-retention checks for all three fields in both orientations. Before the fix a 400 px wheel input at the field boundary moved the page 400 px; it now moves the page **0 px**.

```css
.today-check-in-note textarea,
.journal-compose textarea,
.journal-entry-editor textarea {
  overscroll-behavior-y: contain;
}
```

**Support/fallback:** Checked against MDN on 2026-10-14. The property currently has a limited-availability label; compatibility data lists `contain` in Chromium and Safari/iOS 16+, with a Safari limitation for containers without scrollable overflow. The tested long fields have overflow. Unsupported browsers retain native field/page scrolling. No touch-cancellation polyfill or page-wide refresh suppression was introduced. [MDN property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior-y), [compatibility data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/overscroll-behavior-y.json).

**Verify on device:** Pan at both ends with keyboard open/closed; check inertial scrolling, text selection, caret navigation, saved/draft text and outside-field page scrolling. Confirm actual pull-to-refresh separately.

### G03. Hidden filters and table columns lack direct tap access — P2 — Code + Render

**Where:** [timing.tsx:219](/home/ubuntu/pixel-perfect-view-757/src/routes/_authenticated/timing.tsx:219), [PatternChartDetails.tsx:138](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/PatternChartDetails.tsx:138), selectors `.timing-area-options`, `.timing-explorer-filters`, `.pattern-placement-controls`, `.pattern-placement-table` in [styles.css](/home/ubuntu/pixel-perfect-view-757/src/styles.css).

**Affects:** Chromium/WebKit render checks at **320, 360 and 440 px portrait**, **667 and 844 px landscape**, **1280 px desktop**, plus **320/844 px with a 32 px root font** (200% text-size proxy). Current iOS Safari/Android Chrome remain the physical qualification targets.

**Cause:** A single filter row hides later choices, and native table scrolling had no tap paging controls. With enlarged text, a tall sticky filter region can cover subsequent choices and the table's proportional sticky column can occupy almost the entire visible width.

**Fix — Implemented; Verified in Render:**

- Timing buttons wrap when needed, including enlarged text at wider widths. The obsolete click-to-scroll filter handler was removed. On phone widths, this taller filter group scrolls with the document.
- The table keeps native semantics, a sticky row-label column and native `overflow-x: auto`. Existing-system Previous columns / More columns buttons appear only when it overflows, reference the region with `aria-controls`, and disable at the relevant boundary.
- Controls are at least 48 px high and stack when enlarged text needs more room. Focus styles remain. Paging uses 80% of the visible space **beside** the sticky label column, retaining overlap so no data is skipped.
- When the table overflows, sticky labels use at most 40% of the scroll region. At **320 px with a 32 px root font**, the measured region is **240 px**, labels are **96 px**, and seven More taps cover the full **720 px** scroll range without gaps. Fixed table layout needs a length here; a mixed percentage expression did not preserve the intended cap.
- ResizeObserver watches the region and table; passive scrolling updates button state. Native `details` toggle and window resize provide a fallback. All listeners/observers are removed on cleanup. Empty → populated → empty → populated data and closing/reopening the foldout pass.

```css
.timing-area-options {
  flex-wrap: wrap;
}
@media (max-width: 639px) {
  .timing-explorer-filters {
    position: static;
    top: auto;
  }
}
.pattern-placement-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
  gap: 8px;
  margin-top: 12px;
}
.pattern-placement-controls button {
  height: auto;
  min-height: 48px;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
.pattern-placement-table {
  container-type: inline-size;
}
@container (width < 30rem) {
  .pattern-placement-table th:nth-child(1) {
    width: min(7.2rem, 40cqi);
  }
}
@supports not (width: 1cqi) {
  .pattern-placement-table th:nth-child(1) {
    position: static;
  }
}
```

The implemented listener/open/close sequence is in [PatternChartDetails.tsx:143](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/PatternChartDetails.tsx:143). Opening the existing foldout measures the region; paging changes only horizontal position; closing retains the native foldout/data behavior. No overlay, history entry or gesture recognizer was added. Normal scrolling is smooth; `prefers-reduced-motion` uses `instant`.

**Support/fallback:** MDN lists `container-type` as Baseline widely available. Its container-query length data lists Chromium 105+, Firefox 110+ and Safari/iOS 16+. Unsupported browsers retain native tables and buttons, with the first column unpinned so it cannot obscure the rest. `scrollBy()` is widely available. [MDN container type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type), [length compatibility](https://github.com/mdn/browser-compat-data/blob/main/css/types/length.json), [scrollBy](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollBy).

**Verify on device:** Select every filter and reveal every column using taps alone, then repeat with native horizontal pans and keyboard/AT navigation. Check enlarged text, orientation changes, button states, table semantics and reduced motion. Verify vertical gestures over the table still scroll the document. Native overflow is exempt from WCAG 2.5.7; this repair satisfies the contract's tap-alternative requirement rather than asserting a WCAG dragging failure. [W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

## 4. Opportunities and non-gesture alternatives

| Interaction             | Non-gesture alternative / status                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Timing filter pan       | **Implemented:** every filter exposed as a tap control; horizontal pan is no longer required.        |
| Placement table pan     | **Implemented:** Previous/More columns; keyboard scrolling and semantic table navigation retained.   |
| Chapter/window movement | Existing Previous/Next buttons.                                                                      |
| Menu/dialog dismissal   | Existing visible Close/Cancel controls; no swipe-only dismissal.                                     |
| Mood/energy selection   | Existing labelled radio controls.                                                                    |
| Document scrolling      | Browser-owned scrolling; existing section links and main navigation aid access.                      |
| Long note scrolling     | Native caret/selection/keyboard mechanisms; G02 contains its boundaries.                             |
| Browser reload and Back | Existing browser commands and visible application navigation; OS gestures remain browser-controlled. |

**Optional opportunity, not an unresolved defect:** “Expand note” could expose a long draft in document flow if real-device testing reveals a target-browser containment limitation or users need a larger editing area. No additional editing UI or dependency was necessary to resolve the three observed findings.

Existing modal scroll-lock listeners remain unchanged. Their interior/boundary/backdrop probes and all OS caveats are recorded in the evidence directory. No design ignore or suppression was added; the scoped Impeccable detector returns no findings.

## 5. Verification and device test plan

The [verification ledger](../../../output/playwright/mobile-gestures-2026-10-14/verification-summary.json) records each evidence file and final result. Verification is a **qualified set of runs**, not one uninterrupted all-green sweep: the first implementation exposed enlarged-text filter/table issues; those were fixed, and affected checks were rerun. Chromium's enlarged-text filter check needed touch coordinates adjusted for VisualViewport offsets; the original failed probe is preserved alongside the corrected six-choice tap proof. Its normal-motion check waits for the existing entrance animation before measuring page position.

Render verification qualifies **54 distinct gesture cases** (27 per engine), **ten Chromium touch probes** and **ten principal-journey checkpoints**. The original failures and affected follow-up runs remain in the ledger; these counts do not imply one uninterrupted run.

Source validation: **883 tests passed, four skipped, zero failed**; TypeScript, targeted ESLint, formatting and the production build pass. Build warnings remain the existing third-party module-directive warnings. There are no captured page errors in the qualifying gesture results. No measured performance or physical-device claim follows from these results.

On a real current **iPhone/iOS Safari** and a real **mid-range Android/current Chrome**, record device, OS/browser version, viewport, keyboard, browser-tab layout and navigation settings:

1. Complete Today → saved reflection → Journal → Today/reload with mixed grips and a slow/variable connection.
2. After choosing mood, scroll away and expand/collapse browser UI. On iPhone include available Compact, Bottom and Top layouts. Repeat in landscape, after editing text and at 200% zoom. No stale-focus jump; new focus remains reachable.
3. Exercise all three long fields at top/bottom/interior with keyboard open/closed. Check selection, caret movement, outside-field scrolling, draft recovery and actual pull-to-refresh.
4. Select every filter and page through all columns by tap. Repeat with interior/edge pans, enlarged text, orientation changes, VoiceOver/TalkBack and external-keyboard arrows. The OS may claim an edge gesture; tap alternatives must remain available.
5. Scroll a short-landscape menu and long deletion confirmation to both ends, then pan the backdrop. Verify interior scrolling, background lock, pinch zoom, visible Close/Cancel, Android Back and restored document position.
6. Enable reduced motion and resume a backgrounded/discarded tab. Confirm reading and drafts remain available. Measure LCP/INP/CLS only with an actual trace; this work reports them as **not measured**.

**Deep-dive modules 2–7 next:** prioritize **2 — viewport/safe areas** for actual toolbar/notch behavior and **3 — forms/keyboard** (as named in the viewport brief) for G01/G02 with a real IME. Canonical names for 4–7 were not supplied; the remaining priorities are physical gesture/scroll behavior, overlay/Back handling, mobile accessibility and performance/recovery. These close device evidence gaps; they do not require a product redesign.

## 6. Open questions and preservation

No further input is required for the implemented source fixes. Device qualification needs the available iPhone/Android models and whether installed standalone use is supported.

Only the four owned source files listed above changed, plus this implementation record and its evidence. Their original bytes were archived and verified before editing; every other baseline file was checked for preservation, including the existing dirty mobile/content work. [Preservation result](../../../output/playwright/mobile-gestures-2026-10-14/preservation.json). No dependency, commit, push or deployment was added.
