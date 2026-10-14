# Pattern mobile gestures and scroll-area audit

Date: 2026-10-14. Mode: **audit only**. Target: the main member journey and its adjacent scroll surfaces. Stack: React 19, TanStack Router, Tailwind 4, global CSS, existing Radix components. Priority browsers: current iOS Safari and Android Chrome. No application files changed; all fixes below are **Proposed**.

## 1. Summary

- **P2 G01:** A height-only resize returns the page to an old focused control, interrupting reading.
- **P2 G02:** Scrolling past the end of long reflection fields moves the underlying page.
- **P2 G03:** Off-screen placement columns and Timing filters lack direct tap controls to reveal them without changing the filter.
- The principal journey passes in both tested engines; native horizontal scrolling, existing menu/dialog containment and reduced motion pass the bounded render checks.
- Physical-phone edge navigation, toolbar changes, keyboard scrolling, pull-to-refresh and assistive technology remain **Not tested**; LCP, INP and CLS are **not measured**.

## 2. Area dispositions

**Principal journey: read today's guidance and save a reflection.** I walked this first at **360 × 800 CSS px**: Today → read guidance → select mood and enter reflection → save confirmation → open Journal → return to Today and reload. All five recorded checkpoints passed in Chromium and WebKit, including retained reflection. This uses synthetic services and does not establish live persistence or provider behavior. See [Chromium journey](journey-chromium.json) and [WebKit journey](journey-webkit.json).

**Evidence boundary:** Code inspection plus Playwright Chromium **155.0.8059.12** and WebKit **26.6**, all **Render** evidence. The initial journey used mobile emulation in both engines. WebKit's mobile context rejected wheel input, so its subsequent wheel/resize/motion probes used desktop WebKit at phone widths; the failed tooling attempt is retained in [the log](scroll-webkit-mobile-unsupported.log). Chromium CDP touch injection is also Render, never Device. Portrait sizes: 320 × 568, 360 × 800, 440 × 956. Landscape: 667 × 375, 844 × 390. Some targeted probes used the 360 × 800 size alone.

| Area | Disposition | Evidence and boundary |
| --- | --- | --- |
| Carousels and drag sliders | **Not applicable** | The generic carousel, slider, drawer, scroll-area and resizable files are not imported into the active member routes/components. Mood and energy are discrete tap controls. |
| Active horizontal filter/table regions | **Defect found** | G03. Both are native `overflow-x: auto`, with computed `touch-action: auto`; no `pan-y` mistake. Horizontal touch injection works and vertical panning can still move the document. These are filters/data, so mandatory carousel snapping is unnecessary. |
| Custom gestures and listener cancellation | **No defect found** in tested behavior | No author-written drag/swipe recognizer in the member journey. Shell's reading-progress listener is passive and frame-coalesced. The existing modal library has non-passive scroll-lock listeners; its details remained scrollable in the Chromium touch probe. Physical iOS behavior remains open. |
| OS edge-swipe collisions | **Not tested** | No physical iPhone/Android gesture navigation available. Render geometry places filter and table edges 15 px and 20 px inside the 320/360 px viewport. Those insets do not prove freedom from OS edge gestures. G03 adds a way to avoid horizontal panning. |
| Text-field scroll chaining | **Defect found** | G02 on Today, Journal compose and Journal edit. |
| Menu/dialog boundary containment | **No defect found** in tested states | At 667 × 375 the open mobile menu contained downward wheel scrolling. At 320 × 568 with enlarged text/long content, dialog details contained it too. Chromium touch probes passed interior and boundary cases. |
| Root pull-to-refresh policy | **No defect found** in code | The document is the scroller and root overscroll remains `auto`. There is no app-wide replacement for browser refresh and no full-screen canvas requiring suppression. Actual phone pull-to-refresh is **Not tested**. |
| Scroll hijacking and viewport-driven movement | **Defect found** | G01. No page snapping or scroll-speed remapping was found. Explicit Next/Previous actions reveal the selected content; their intent differs from the resize defect. |
| Reading motion and reduced motion | **No defect found** in tested states | At 360 × 800, both engines retained requested scroll positions of 200, 450 and 750 px. Reading content remained visible. Reduced motion produced zero running animations in those samples and `scroll-behavior: auto`. Content also remained available without IntersectionObserver. |
| Legacy momentum CSS and hidden scrollbars | **No defect found** | No `-webkit-overflow-scrolling` or author-hidden scrollbar rules in the active source. The filter rail uses `scrollbar-width: thin`, not `none`. Platform auto-hiding is not an author rule. |
| Maps, canvases, swipe-to-dismiss or custom pinch/zoom | **Not applicable** | None in the selected flow. |
| Real-device performance, VoiceOver/TalkBack, standalone mode | **Not tested** | Hardware/OS simulator and installed-app target were not supplied. Public landing/admin/payment/provider screens are outside this gesture audit. |

The decorative public landing scene uses Pointer Events and skips touch/coarse-pointer motion; it is not a member gesture or a task control. The read-only Impeccable detector returned no findings in this pass: [detector output](detector.json). No suppressions were added.

## 3. Findings by severity

No P0 or P1 was established. All three findings are P2, ranked by their effect on the principal journey.

### G01. Resizing the viewport pulls the reader back to stale focus — P2 — Code + Render

**Where:** [Shell.tsx:82](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/Shell.tsx:82), especially the resize handler at [line 113](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/Shell.tsx:113) and window/VisualViewport listeners at line 127.

**Affects:** Reproduced in Chromium mobile emulation and desktop WebKit, portrait **360 × 800 → 360 × 740**. Current Android Chrome and iOS Safari use the same source path, but an actual browser-toolbar-triggered instance is **Inferred**, not reproduced on hardware. Landscape rotation is another candidate trigger, not measured as this finding's reproduction.

**Cause:** Every resize both measures chrome clearance and schedules `revealFocus()`. A mood radio retains focus after the person scrolls elsewhere, so a later viewport change scrolls the document to that old control without new user intent.

**Measured evidence:** Select “Mood: 3 of 5, Steady”, scroll to the top, then reduce viewport height by 60 px. Document scroll changed **0 → 471 px in Chromium** and **0 → 470 px in WebKit**. Chromium used a tap; WebKit used a click. See `resize[0]` in [Chromium](scroll-chromium.json) and [WebKit](scroll-webkit.json). The separate “focus Save” exploratory case did not focus the disabled button and is not positive evidence.

**Fix — Proposed:** Resize should update geometry only. Retain the existing explicit `focusin` reveal and cleanup. Keep any later keyboard-specific assistance tied to a new editing/focus transition, rather than continuously following whichever control retains focus.

```diff
 const resize = () => {
   measure();
-  focus();
 };
```

State handled: viewport-height change after the person has intentionally moved away from the focused control, including the **inferred toolbar expansion/collapse case**. This removes the demonstrated source trigger; it is not a claim that keyboard behavior has been qualified.

**Verify on a device:** On real iOS Safari and Android Chrome, select a mood, scroll back to the reading, then expand/collapse browser chrome. The reading position should remain under the person's control. Repeat after focusing a textarea, opening/dismissing its keyboard, and rotating: new focus must still be visible above the navigation. Include external-keyboard Tab and 200% zoom to guard the original focus-clearance purpose.

### G02. Long reflection fields pass boundary scrolling to the page — P2 — Code + Render

**Where:** [TodayCheckIn.tsx:448](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/TodayCheckIn.tsx:448), [journal.tsx:437](/home/ubuntu/pixel-perfect-view-757/src/routes/_authenticated/journal.tsx:437), [JournalEntryEditor.tsx:199](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/JournalEntryEditor.tsx:199). Selectors are shown in the proposed CSS below.

**Affects:** Reproduced at **360 × 800**, Chromium mobile emulation and desktop WebKit. Android Chrome and iOS Safari are target browsers requiring physical touch/keyboard confirmation. The same source applies in landscape; that field interaction was not measured in landscape.

**Cause:** Valid long notes exceed the fixed row count, creating native inner scroll areas. Each textarea computes `overscroll-behavior-y: auto`, allowing scrolling to continue on the document at its boundary.

**Measured evidence:** A 400 px wheel input at the bottom of each textarea moved the document by **400 px** while the field stayed at its bottom, in both engines. Chromium CDP touch injection at the Today field's bottom moved the document **924 → 1109 px** while field scrollTop remained **888 px**. No loss of input or OS pull-to-refresh was observed. See [wheel results](scroll-chromium.json), [WebKit results](scroll-webkit.json) and [touch results](touch-chromium.json).

**Fix — Proposed:** Contain only vertical overscroll on these three existing fields. Retain native editing and document scrolling outside the field.

```css
.today-check-in-note textarea,
.journal-compose textarea,
.journal-entry-editor textarea {
  overscroll-behavior-y: contain;
}
```

**Proposal validation:** Temporarily injecting this CSS into each browser stopped document movement at all three field boundaries. Interior field scrolling still advanced 200 px, and a wheel input outside the field still advanced the page 200 px. Six cases passed; source remains unchanged. [Chromium proposal checks](proposal-fields-chromium.json), [WebKit proposal checks](proposal-fields-webkit.json).

**Support and fallback:** Checked 2026-10-14. MDN currently labels the overall property **not Baseline / limited availability**; its compatibility data lists `contain` in Safari/iOS 16+ and Chromium, with a Safari caveat for containers **without scrollable overflow**. These reproduced textareas do have overflow. Keep native scrolling as the fallback if unsupported; do not polyfill by cancelling `touchmove` or disabling root refresh. The fallback preserves editing but does not promise boundary containment. If target-device testing still shows chaining in an overflowing field, offer a small “Expand note” control that grows that field into document flow. [MDN property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior-y), [MDN compatibility data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/overscroll-behavior-y.json).

**Verify on a device:** Fill each field with a valid long note, then pan at its top and bottom with keyboard open and closed. Text should scroll inside; the underlying page should stay put at the boundary; touching outside should scroll the page. Confirm the caret, selection, keyboard dismissal and saved/draft content still work. Test actual pull-to-refresh separately.

### G03. Off-screen filters and comparison columns lack direct tap access — P2 — Code + Render

**Where:** [timing.tsx:207](/home/ubuntu/pixel-perfect-view-757/src/routes/_authenticated/timing.tsx:207), [styles.css:1610](/home/ubuntu/pixel-perfect-view-757/src/styles.css:1610), [PatternChartDetails.tsx:202](/home/ubuntu/pixel-perfect-view-757/src/components/pattern/PatternChartDetails.tsx:202), [styles.css:921](/home/ubuntu/pixel-perfect-view-757/src/styles.css:921).

**Affects:** Reproduced in Chromium and WebKit at **320 × 568, 360 × 800 and 440 × 956 portrait**. Relevant to iOS Safari/Android Chrome at those CSS widths. Neither region overflowed horizontally in the tested 667 × 375 or 844 × 390 landscapes at normal text size. Larger text may change that; it is not included in those landscape measurements.

**Cause:** Filters are a single non-wrapping row. Selecting a partly visible chip reveals later chips but also changes the selected filter; there is no independent tap to reveal more. The placement table retains proper semantics and a sideways-scroll instruction, but provides no Previous/More controls for hidden columns.

**Measured evidence:** At 320 px, filter content is **581 px inside 290 px** and the table is **480 px inside 280 px**. At 360 px these are **581/330 px** and **480/320 px**. At 440 px they are **581/410 px** and **480/400 px**. Document width stays within the viewport. See the `rails` records in both [engine results](scroll-chromium.json), [WebKit results](scroll-webkit.json), and the end-of-scroll [filter screenshot](chromium-filters-320.png) / [table screenshot](webkit-table-320.png).

This is a tap-alternative gap under the audit contract, **not an asserted WCAG 2.5.7 failure**: the criterion exempts browser-owned scrolling, including CSS overflow. [W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

**Fix — Proposed, per region:**

- **Timing:** Let the six existing filter buttons wrap at the project's existing 639 px breakpoint. This exposes every choice for a direct tap, using the current Button and MotionSelection components.
- **Placement table:** Keep the native horizontal table, sticky first column, caption, row/column headers and focusable region. Add **Previous columns / More columns** buttons outside that scroller. Show the controls only while overflowing; disable the relevant control at each end. Use the existing Button component, visible focus styles, at least 44 × 44 px targets (48 px preferred), and `aria-controls` referencing the scroll region. Buttons must reveal columns without changing data or moving page focus. No carousel library or snap behavior is needed.

```css
@media (max-width: 639px) {
  .timing-area-options {
    flex-wrap: wrap;
  }
}
```

**Proposal validation:** In-page CSS wrapping at 320/360/440 px removed filter overflow in both engines; “Structure” could be selected directly. The rail grew to **154 px** at 320 and **104 px** at 360/440, a concrete vertical-space tradeoff. Source is unchanged. [Chromium](proposal-filter-wrap-chromium.json), [WebKit](proposal-filter-wrap-webkit.json). If retaining the one-row filter layout is essential, the same Previous/More controls proposed for the table are the alternative; do not implement both designs.

**Proposed button/listener code:** Wire these helpers to the existing table region/ref and React state; call the returned cleanup when that region unmounts. Reconnect when the conditional table mounts. `update` sets control visibility and disabled state. This is a component integration spec, not an applied patch.

```ts
function scrollColumns(region: HTMLElement, direction: -1 | 1) {
  const left = direction * Math.max(44, region.clientWidth * 0.8);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  region.scrollBy({ left, behavior: reduce ? "instant" : "smooth" });
}

function observeColumns(
  region: HTMLElement,
  update: (state: { overflowing: boolean; previous: boolean; more: boolean }) => void,
) {
  // Pattern's current table is LTR. Retain native browser scrolling on both axes.
  const measure = () => {
    const end = Math.max(0, region.scrollWidth - region.clientWidth);
    update({
      overflowing: end > 1,
      previous: region.scrollLeft > 1,
      more: region.scrollLeft < end - 1,
    });
  };
  const observer = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(measure);
  observer?.observe(region);
  const table = region.querySelector("table");
  if (table) observer?.observe(table);
  region.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  measure();
  return () => {
    observer?.disconnect();
    region.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  };
}
```

`Element.scrollBy()` is Baseline widely available; reduced motion uses its immediate behavior. ResizeObserver absence falls back to the initial measurement, native scroll and window resize. No new dependency or custom touch listener is proposed. [MDN scrollBy support and options](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollBy).

**Verify on a device:** At 320–440 px, select every filter and reveal every table column using only taps. Confirm touch scrolling still works from the interior, vertical panning over the table still scrolls the page, focus remains visible, and reduced motion disables animated paging. Repeat with VoiceOver/TalkBack and large text. Check that Previous/More controls disappear when landscape has enough room, and reappear if text scaling causes overflow.

## 4. Opportunities and gesture alternatives

**Opportunity — optional expanded note, tied to G02.** Long valid drafts already create nested scroll areas. A small “Expand note” toggle could expose the full text in document flow for reviewing/editing, and provide a fallback where field containment is unreliable. This is secondary to the small CSS fix, not a new editing route or dependency.

**Opportunity — restore immediate filter access, tied to G03.** Wrapping the existing six buttons avoids hidden choices; the measured height tradeoff above makes that decision reviewable. The table buttons preserve comparison across rows. Neither change depends on controlling OS edge navigation.

| Gesture or movement | Existing non-gesture alternative | Gap / proposed alternative |
| --- | --- | --- |
| Vertical document reading | Existing section links and persistent main destinations; browser keyboard/AT scrolling | No app-defined drag command. Ordinary document scrolling is browser-owned. |
| Horizontal Timing filter pan | Tap visible filter buttons; keyboard focus can reach later buttons | Tapping intermediate choices changes selection. Proposed wrapping exposes all six for direct taps. |
| Horizontal placement table pan | Focusable region and keyboard scrolling; semantic table navigation for AT | No app tap control today. Proposed Previous/More columns buttons. |
| Vertical scrolling inside long note fields | Browser editing/caret navigation and selection | No custom swipe command; no app tap scrolling control. Optional Expand note exposes text in document flow. G02 contains boundaries. |
| Mobile menu scrolling | Tap navigation links; visible Close menu control, Back/Escape | All navigation and dismiss actions have tap controls; scrolling is browser-owned. |
| Deletion detail scrolling | Persistent Close, Cancel and Delete controls; focusable details | No swipe-to-dismiss required. Native scrolling only for the long explanatory text. |
| Moving between chapters/windows | Existing Previous/Next buttons | No swipe-only navigation was found. |
| Mood/energy selection | Labelled radio controls | Direct taps; no draggable slider. |
| Browser pull-to-refresh | Browser reload command | Browser-owned behavior retained. Phone behavior not tested. |
| OS edge Back/Forward | App's visible main navigation for destinations; browser Back/Forward when available | OS behavior is not page-controlled; real-phone tests remain required. |

**Existing modal listener exception:** `react-remove-scroll` installs non-passive wheel/touch listeners in [SideEffect.js:139](/home/ubuntu/pixel-perfect-view-757/node_modules/react-remove-scroll/dist/es2015/SideEffect.js:139). In the Chromium touch probe, interior dialog scrolling advanced **85 px** without cancellation; boundary/backdrop motion was cancelled while the document stayed fixed. That is evidence of selective scroll locking, not a reproduced blocked-sheet defect. Leave the existing library intact unless real-device testing demonstrates a failure. The extra window pointer/touch interception seen in instrumentation belongs to Playwright, not application gesture code. No new `preventDefault()` listener is proposed.

## 5. Device test plan

Run on a real **current iPhone/iOS Safari** and a real **mid-range Android/current Chrome**; record exact device, OS and browser versions, CSS viewport, keyboard and navigation settings. Desktop WebKit/Chromium cannot qualify these results.

1. **Principal task:** Read Today, select mood, enter a multi-line reflection, save, check Journal, return and reload. Repeat with one thumb, two thumbs and cradled use. Keep network slow/variable; measure performance only with an actual trace.
2. **G01 / browser chrome:** After selecting mood, scroll away, then expand/collapse the toolbar. On iPhone include available Compact, Bottom and Top layouts; repeat in landscape. The page must not return to stale focus. Test new focus with keyboard open/closed and 200% zoom after any change.
3. **G02 / nested fields:** Pan from the middle and both ends of each long textarea. Use normal, diagonal and inertial gestures. Outside the field, document scrolling must still work. Verify caret selection, input retention, keyboard dismissal and save access. Test root pull-to-refresh separately from field boundaries.
4. **G03 / horizontal regions:** Pan from an interior start, then near each physical edge; OS navigation may claim an edge gesture. Independently complete all filters and column comparisons by taps. Check slow/fast pans, 320–440 px portrait, landscape and large text. Keep table semantics available to VoiceOver/TalkBack.
5. **Menu and confirmation:** Open the menu in short landscape and a long deletion confirmation. Scroll inside, reach both ends, then pan the backdrop. Interior content must remain scrollable and the page must remain stationary where locked. Close by visible controls and Android Back; verify original document position. Verify pinch zoom is still available.
6. **Motion and recovery:** Enable Reduce Motion / Remove animations. Scroll long readings, use chapter/window buttons, and resume a backgrounded/discarded tab. Confirm reading remains visible, scroll ownership is natural, and drafts survive. Capture LCP/INP/CLS only if measuring on the actual phone; all three remain **not measured** in this audit.

**Deep-dive modules 2–7 worth running next:** Prioritize **Module 2 — viewport/safe areas** for G01's real toolbar trigger and **Module 3 — forms/keyboard**, explicitly named in the viewport brief, for G01/G02 with a real IME. For **Modules 4–7**, the canonical titles were not supplied: map the remaining priorities to physical gesture/scroll testing (edge Back and PTR), overlays/navigation (Radix lock and Back), mobile accessibility (tap alternatives and AT), and performance/recovery (slow phone and discarded-tab state). These are bounded follow-ups, not reasons to redesign the product.

## 6. Open questions

No answer is needed to use the proposed fixes. To finish **Device** qualification: which iPhone and Android devices are available, and is installed standalone use a supported target? If “modules 4–7” refers to an external catalog, its exact names would make the next checklist precise.

**Delivery and preservation:** This audit changed no application source or repository documentation. Evidence and proposals are stored only in this temporary audit directory; Playwright/Vite may update their existing ignored cache. Existing overlay fixes were preserved. No new dependency, deployment, commit, source test or build was needed for this read-only pass. Proposal injections were ephemeral browser styles. See [preservation verification](preservation.json).
