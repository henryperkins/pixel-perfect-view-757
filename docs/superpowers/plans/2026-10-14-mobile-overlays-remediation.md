# Mobile overlays, navigation, and dense data: remediation

Date: 2026-10-14. Mode: audit and fix, authorized by “address all findings comprehensively.” Target: Pattern's principal member journey, including Journal deletion, mobile navigation, desktop More, and natal placements. Stack: React 19, TanStack Router/Start, Tailwind 4, global CSS, existing Radix AlertDialog and Button components. Browser targets: current iOS Safari and Android Chrome.

## 1. Summary

- O01's offscreen confirmation actions are fixed; header, Close, and actions remain visible with long titles and enlarged text.
- All six P2 findings are implemented: landscape header, menu history, scroll containment, deletion recovery, touch targets, and table semantics.
- Both desktop engines pass 45 focused cases each and all five principal-journey checkpoints each.
- TypeScript, targeted ESLint, formatting, scoped diff checks, production build, and the existing test suite pass; 883 tests passed, four skipped.
- Evidence is Code and Render. Physical-device qualification remains open; LCP, INP, and CLS are not measured.

### Principal journey and evidence

**Read today's guidance and save a reflection:** open Today → read → enter check-in/reflection → save and see confirmation → visit Journal → return to Today and reload. The journey was walked before the detailed audit and repeated after the fixes at 360×800 in Chromium and WebKit. The saved synthetic reflection survived reload.

Render engines are desktop Chromium 155.0.8059.12 and WebKit 26.6, not physical Android Chrome or iOS Safari. Phone viewports: 320×568, 360×800, 440×956, 667×375, and 844×390. Desktop More and table coverage includes 1280×800. Text stress cases use a 32px root font, including 320×568 and 667×375; this is not a pinch-zoom measurement. Long journal titles contain 400 characters. Dense-data cases use twelve synthetic placements. Real routes/components run against the existing synthetic service fixture, which does not load `.env` or call member/model services.

The [original audit](../../../output/playwright/mobile-overlays-2026-10-14/audit-before.md) preserves the pre-fix findings. [Verification results](../../../output/playwright/mobile-overlays-2026-10-14/verification-summary.json), JSON measurements, screenshots, and repeatable browser probes are in `output/playwright/mobile-overlays-2026-10-14/`.

## 2. Area dispositions

“Defect found” records the audit outcome; the evidence column records its remediation. A passed desktop check does not establish a device pass.

| Area                                                                             | Disposition     | Result and boundary                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pattern fit                                                                      | No defect found | Short deletion confirmation stays centered. Journal editing and longer settings tasks stay in the document. The existing mobile disclosure and shallow More list fit navigation.                                                                                    |
| Platform primitives, focus, dismissal                                            | Defect found    | O03/O05 fixed. Existing Radix focus isolation is retained. Cancel receives initial focus; pending Close and failure focus remain inside; dismissal restores an enabled trigger or Entries heading.                                                                  |
| Sizing and reachable close                                                       | Defect found    | O01/O06 fixed. Header/Close/actions persist; only details scroll. All controls remain visible in the seven dialog geometry cases per engine.                                                                                                                        |
| Background scrolling                                                             | Defect found    | O04 fixed. Menu wheel boundary tests show no document movement. Modal backdrop wheel isolation and scroll restoration pass. Physical touch and the existing Radix body-lock implementation still require iOS verification.                                          |
| Swipe dismissal                                                                  | Not applicable  | No custom swipe-to-dismiss interaction. Visible tap controls remain available.                                                                                                                                                                                      |
| Back and history                                                                 | Defect found    | O03 fixed. Back, Escape, toggle, outside dismissal, current/new destinations, repeat Close, reload, Forward, and breakpoint changes pass. Modal history and direct-link replacement also pass. Android system Back and Safari edge navigation remain device checks. |
| Navigation                                                                       | Defect found    | O02/O03 fixed. Closed header scrolls away in short landscape; four primary tabs remain. No menu nesting beyond one level.                                                                                                                                           |
| Dense data                                                                       | Defect found    | O07 fixed. One native table at all widths, scoped headers, caption, local horizontal scroll, keyboard access, sticky body column. No document overflow in the seven populated cases per engine.                                                                     |
| Physical toolbar/safe-area behavior, touch, VoiceOver/TalkBack, actual 200% zoom | Not tested      | No physical phone or OS simulator available. Emulation cannot qualify these states.                                                                                                                                                                                 |
| Installed standalone/PWA presentation                                            | Not tested      | Product support and device configuration are unconfirmed.                                                                                                                                                                                                           |
| Admin `/content`, public calculator, third-party billing/auth UI                 | Not tested      | Outside the selected member-flow scope.                                                                                                                                                                                                                             |

## 3. Findings by severity, with implemented fixes

### O01. Focused confirmation actions could be offscreen — P1 — Code + Render

- **Where:** [JournalDeleteDialog.tsx](../../../src/components/pattern/JournalDeleteDialog.tsx), header/body/actions at lines 45–92; `.journal-delete-dialog`, `.journal-delete-body`, `.journal-delete-actions` in `src/styles.css:3184` onward.
- **Affects:** shared iOS Safari and Android Chrome UI; reproduced and rechecked in both desktop engines, portrait and landscape, including enlarged text. Device behavior is unverified.
- **Cause:** description and actions previously shared one scrolling box. At 320×568 with a 32px root font, Cancel was focused at y=1417–1489 outside a 536px-high dialog.
- **Fix — Implemented; Verified in Render:** separate persistent header/labelled Close, a keyboard-focusable scrolling details region, and persistent actions. Preserve the vh fallback, dvh cap, safe-area clearance, existing type sizes, tokens, and focus rings. At the same stress viewport, the dialog remains 536px high and its 190px details region scrolls 1120px of text; every action is visible. Equal action columns and 12px inline padding keep enlarged labels readable.
- **State handled:** toolbar expanded/collapsed via the retained dvh cap; portrait/landscape and large text. Actual toolbar and safe-area movement remains a device gate.
- **Verify on device:** open short and 400-character titles; enlarge text and pinch zoom separately; scroll details to both ends; rotate. Close, Cancel, and the focused action must remain reachable.

### O02. Persistent navigation reduced landscape reading space — P2 — Code + Render

- **Where:** `src/components/pattern/Shell.tsx:303`, `.pattern-header:not([data-menu-open="true"])` at `src/styles.css:3250`.
- **Affects:** iOS Safari and Android Chrome in short landscape; desktop checks at 667×375 and 844×390 in both engines.
- **Cause:** an 83px sticky header plus approximately 73px fixed primary navigation occupied 156px of a 375px viewport before browser chrome.
- **Fix — Implemented; Verified in Render:** the closed-menu header scrolls with the document below the existing 1024px-width/500px-height thresholds. Opening the menu retains the header and Close control. Existing constrained-viewport handling and primary destinations remain intact.
- **State handled:** landscape and short visible viewports; expanded/collapsed browser UI needs device verification.
- **Verify on device:** read and compare chart rows in both landscape directions, with toolbars expanded and collapsed. Confirm the closed header scrolls away and opening navigation retains Close.

### O03. Menu Back and current-destination dismissal were incomplete — P2 — Code + Render; system Back Inferred

- **Where:** [useNavigationMenu.ts](../../../src/hooks/useNavigationMenu.ts), especially lines 24–144; Shell integration at `src/components/pattern/Shell.tsx:59`, `:298`.
- **Affects:** iOS Safari and Android Chrome menus in portrait/landscape, plus desktop More. Browser-history behavior is verified separately in both render engines; physical Back gestures are not.
- **Cause:** menu state previously closed only on pathname change or Escape. Back left the page, and selecting its current destination did not close the menu.
- **Fix — Implemented; Verified in Render:** one owned router-history entry represents an open menu. Toggle, Escape, outside dismissal, and current-page selection consume it once. A new destination replaces it, so the next Back returns to the source page. Forward/reload restore coherent state. Breakpoint changes consume hidden menus. History subscription makes dismissal immediate while route authentication is delayed; focus restoration respects outside interaction.
- **State handled:** portrait, landscape, breakpoint changes, reload, and browser Back/Forward. The explicit controls also serve standalone navigation, pending device qualification.
- **Verify on device:** Journal → Today → open menu → Back should stay on Today; another Back should reach Journal. Repeat all dismissal methods, current/new links, rapid repeated Close, reload and rotation. Test Android system Back and Safari back gestures separately.

### O04. Menu boundary scrolling moved the reading behind it — P2 — Code + Render; touch Inferred

- **Where:** `.mobile-menu`, `src/styles.css:407`.
- **Affects:** Safari and Chrome menu scrolling, especially landscape. Both desktop engines supplied wheel proxy evidence.
- **Cause:** the scrolling menu used default scroll chaining. The original landscape wheel test moved the document 500px in Chromium and 499px in WebKit.
- **Fix — Implemented; Verified in Render:** `overscroll-behavior-y: contain` on the menu's existing scroller. Repeated 500px boundary-wheel tests now leave document scroll unchanged. The non-modal page remains interactive outside the menu; no touchmove cancellation handler was added.
- **State handled:** portrait and landscape menus, including short viewports with expanded toolbar budgets.
- **Verify on device:** flick repeatedly at both menu boundaries and compare the reading position after dismissal. Also verify intentional scrolling outside the non-modal panel.

### O05. Pending deletion blocked dismissal and failure lost focus — P2 — Code + Render

- **Where:** `src/components/pattern/JournalDeleteDialog.tsx:30`, `:65`, `:77`; `src/routes/_authenticated/journal.tsx:79`, `:302`, `:319`, `:330`.
- **Affects:** iOS Safari and Android Chrome, both orientations; delayed/failing synthetic requests checked in both desktop engines at 360×800.
- **Cause:** pending state disabled both actions and suppressed Escape; after failure, focus could be on BODY. A slow route authentication check also delayed visible dismissal even after history changed.
- **Fix — Implemented; Verified in Render:** only duplicate Delete is disabled. Close stays enabled, Escape works, and the copy explains that closing does not cancel a confirmed deletion. Focus moves to Close while pending and Cancel after failure. Dismissal hides the confirmation immediately while history resolves; the enabled trigger or Entries heading receives focus. Pending and unconfirmed-failure messages survive dismissal. Closing is idempotent, opening preserves scroll, and success only closes the matching deletion so it cannot dismiss a later menu.
- **State handled:** portrait/landscape, slow requests, failed requests, Back, repeated Close, and completion after dismissal.
- **Verify on device:** delay/fail deletion, dismiss by Close and Escape, and then permit success. Confirm one request, truthful status, focus recovery, and no dismissal of a newly opened menu. Check entries after an ambiguous network failure before retrying.

### O06. Portal actions missed comfortable mobile sizing — P2 — Code + Render

- **Where:** `src/components/pattern/JournalDeleteDialog.tsx:48`, `:79`, `:83`; `.journal-delete-actions button` at `src/styles.css:3231`.
- **Affects:** Safari and Chrome portal buttons, portrait and landscape.
- **Cause:** the existing minimum height was scoped beneath `.pattern-shell`; the portalled dialog fell outside it and rendered 36px buttons. This passed the 24px WCAG size floor but missed the requested comfort range.
- **Fix — Implemented; Verified in Render:** existing Button classes establish 44px minimum Close/Cancel and 48px minimum Delete. At 360×800, measured heights are 44px for header Close and Cancel, and 52px for Delete in both engines. Text enlargement scales controls without hiding them.
- **State handled:** portrait/landscape and enlarged text; no zoom restrictions introduced.
- **Verify on device:** test left/right thumb, two-thumb, and cradled use. Confirm focus rings and separation make destructive selection deliberate.

### O07. Phone placements lost table semantics — P2 — Code + Render

- **Where:** `src/components/pattern/PatternChartDetails.tsx:202`; `.pattern-placement-table` at `src/styles.css:921`.
- **Affects:** Safari and Chrome below the previous `sm` breakpoint, especially screen-reader and comparison tasks. Render accessibility trees checked in both engines; actual VoiceOver/TalkBack remains untested.
- **Cause:** the narrow ul/li/span variant replaced the captioned native table, losing column and row associations.
- **Fix — Implemented; Verified in Render:** render one native table everywhere, with caption, scoped column/row headers, a named focusable horizontal scroller, and sticky first column. Native table/row display remains intact. Separate borders prevent content leaking through sticky-column row seams. All seven populated viewport/text cases per engine expose table/header roles, permit ArrowRight scrolling when needed, retain the first column, and avoid document overflow.
- **State handled:** 320–440px portrait, landscape, enlarged text, and desktop comparison. Existing record cards remain appropriate for Journal's one-record-at-a-time task.
- **Verify on device:** use VoiceOver/TalkBack table navigation and compare body/sign/house/motion across rows. Scroll horizontally and rotate; retain header context and page width.

## 4. Component contract and opportunities

### Implemented confirmation contract

Structure: existing Radix AlertDialog portal → overlay → titled content → persistent header with labelled Close → separately scrolling description/error region → persistent Cancel/Close and Delete controls. It stays a compact centered confirmation. Radix's existing focus isolation and background accessibility isolation passed; retaining that primitive was the smallest repair.

Open: capture the initiating button, clear previous request errors, create the existing `deleteEntry` history state with `resetScroll: false`, then focus Cancel. Close: Cancel, labelled Close, Escape, Back, and matching success share guarded dismissal; a direct-link query is removed with replace. Back-driven dismissal does not cause another Back. Backdrop taps remain intentionally non-dismissable. Restore an enabled connected trigger, otherwise Entries. Only the details region scrolls; Radix retains its existing body lock. No new blanket touch interception or dependency was introduced.

### Implemented navigation and data contract

Menus remain non-modal navigation with ordinary links and visible toggles. Keyboard users enter links in document order. One owned history entry coordinates mobile/More, explicit dismissal, Back/Forward, reload, current-page links, new destinations and responsive changes. Explicit close/Escape restores trigger focus; outside interaction keeps focus with the user's target. The mobile disclosure retains its stable svh budget and contained vertical scrolling. The placement table uses its own horizontal region while document scrolling remains vertical.

### Opportunities and current support

- **O01/O05:** a future shared overlay replacement could use native `dialog.showModal()` to simplify focus/inert/top-layer handling. MDN currently marks it Baseline widely available. Keep the working primitive as a fallback where unavailable, and preserve the proven history/scroll/recovery contract. This is an optional maintenance opportunity, not an unresolved defect. [MDN showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal).
- **O03:** desktop More is a candidate for `popover="auto"` if the navigation surface is later replaced. MDN currently labels popover Baseline newly available, with support varying for some parts; feature-detect `showPopover` and retain the working disclosure/history behavior as fallback. A native close request still needs engine-specific device testing. [MDN popover](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover).
- **O07, implemented:** the observed comparison step now has a short sideways-scroll instruction on phones, keyboard access, and stable body labels. It adds discoverability without changing the chart data or product hierarchy.

The shipped scroll containment uses established CSS; if ignored by an older browser, ordinary scrolling remains available, while modal isolation remains handled separately. [MDN overscroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior). No new package or polyfill was added.

## 5. Device test plan

Record exact hardware, OS, browser version, text settings, and toolbar configuration. Use a notched iPhone on current Safari and a mid-range Android phone on current Chrome. Other WebKit-based iPhone browsers do not provide independent Chromium evidence.

1. Repeat Today → reflection → save → Journal → return/reload in portrait and both landscape directions. Try one-thumb, two-thumb, and cradled grips. Confirm the landscape header scrolls away.
2. Test short/400-character deletion titles with enlarged OS/browser text and actual 200% pinch zoom. Scroll the details, rotate, and verify visible Close/actions and safe-area clearance. Exercise each available Safari Compact/Bottom/Top layout with toolbar expanded/collapsed, including overlay background/bar colors.
3. Swipe at menu and modal scroll boundaries. Confirm the modal background stays still and that menu boundary gestures preserve the reading position. Verify scroll restoration after close. If real Safari leaks modal scrolling, reproduce it before adding a root/body lock fallback; capture/restore the prior scroll position.
4. Test Android system/gesture Back and Safari edge/back navigation separately. Cover Back, X/toggle, Cancel, Escape, outside tap for menus, current/new destinations, repeated Close, reload, Forward and direct deletion URLs. A second Back must reach the previous page.
5. Delay and fail deletion. Confirm Close/Escape remain responsive during a slow authentication check, no duplicate request occurs, status/error survives dismissal, and successful completion cannot close a different menu. Repeat after the page was scrolled near its bottom.
6. Use VoiceOver and TalkBack for dialog naming, initial/failure/return focus, background isolation, and the twelve-row table's caption and row/column context. Compare columns horizontally and rotate. Check focus under sticky navigation and reduced-motion behavior.
7. If installed/Home Screen use is supported, repeat navigation without browser Back, safe-area checks, rotation, and delayed deletion in standalone mode. Measure LCP, INP and CLS on the actual mid-range phone/network before making performance claims.

**Deep-dive modules 2–7 worth running next:** prioritize **2 — viewport/safe areas** for physical toolbar/notch behavior and **3 — forms/keyboard** as named in the user's viewport brief. For modules 4–7, the canonical titles were not supplied: the remaining priority topics are touch/scroll, mobile accessibility, errors/recovery and mid-range performance. Run them to close the explicit device gaps above; avoid inventing module labels from conflicting area numbering.

## 6. Open questions and completion evidence

The remaining questions are which iPhone/Android devices are available and whether installed standalone use is a supported target; the canonical names of modules 4–7 would also make the next checklist precise. None blocks the implemented source fixes.

Implementation sequence is complete: preserve dirty checkout → repair dialog sizing/targets/recovery → centralize menu history and landscape behavior → restore native table semantics → run both-engine checks → correct observed recovery/label/sticky-border issues → confirm once → record evidence. Initial probe results are retained as `*-initial.json`. The initial desktop Plans check used an over-specific URL expectation; it was corrected to allow the route's existing `?canceled=false` query. Initial delayed-close failures led to immediate dismissal and enabled-focus fallback fixes.

Final verification: 21 menu cases, 17 dialog cases, and seven dense-data cases per engine, all passing with no captured page errors; five principal-journey checkpoints per engine, including retained reflection after reload. TypeScript, targeted ESLint, formatting, scoped diff checks and the final production build pass. Existing test suite: 887 total, 883 passed, four skipped, zero failed. Build retains existing third-party module-directive warnings.

Preservation: a verified source archive and hashes were saved before edits under `/tmp/pattern-overlay-fixes-20261014/`. Of 1544 existing files hashed, only the five intended source files changed; unrelated work and `.env` retain their hashes. The new `useNavigationMenu.ts` helper and this report/evidence are additive. No dependency, commit, push, or deployment occurred. Design-hook suppressions: none; the earlier approved accent-border changes remain intact.

The final design detector reports zero findings; no ignores or suppressions were added. The dedicated browser sessions and synthetic fixture were stopped after verification.

See the local [verification summary](../../../output/playwright/mobile-overlays-2026-10-14/verification-summary.json), [test log](../../../output/playwright/mobile-overlays-2026-10-14/tests.log), [build log](../../../output/playwright/mobile-overlays-2026-10-14/build.log), and [change-only patch](../../../output/playwright/mobile-overlays-2026-10-14/implementation.patch), which excludes pre-existing dirty edits. Physical-phone qualification is still open, so “Verified” above always means the stated Code/Render checks.
