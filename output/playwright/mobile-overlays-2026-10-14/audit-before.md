# Pattern mobile overlay, navigation, and dense-data audit

Date: 2026-10-14. Mode: audit only. Target: the main member flow in the current dirty checkout at `/home/ubuntu/pixel-perfect-view-757`. Stack: React 19, TanStack Router/Start, Tailwind 4 and global CSS; Radix AlertDialog for journal deletion. Prior approved changes are included in the audited source, not reapplied.

## 1. Summary

- One P1: enlarged-text deletion dialogs can open with their focused Cancel button outside the visible scroll area.
- Six P2 findings concern landscape reading space, menu dismissal and scroll chaining, deletion recovery, portal button sizing, and mobile table semantics.
- The principal journey passed in Chromium and WebKit at 360×800 using synthetic member services.
- This is Code and Render evidence; no physical-phone or OS-simulator evidence. LCP, INP and CLS: not measured.
- Audit only: all 1,540 pre-existing files retained their initial hashes. No source edits, dependencies, commit, push, or deployment.

### Principal journey

**Read today's guidance and save a reflection.** Steps walked first: open Today → read the guidance → enter a check-in and reflection → save and see confirmation → visit Journal → return to Today and reload. All five recorded checkpoints passed in both engines; the saved reflection remained after reload. Subsequent checks covered the Journal deletion branch, the mobile navigation menu, and chart-placement comparison.

### Evidence boundary

Render engines: Chromium 155.0.8059.12 and WebKit 26.6, both desktop engines. These are not Android Chrome or iOS Safari device runs. Menu cases: 320×568, 360×800, 440×956, 667×375 and 844×390. Dialog cases: 320×568 and 390×844 with ordinary text, 667×375 with a valid 400-character title, and 320×568 with that title and a 32px root font. The last is an enlarged-text stress test, not actual 200% pinch zoom. Populated dense-data cases use twelve explicitly synthetic placements because the default fixture has none. No live chart or member record was modified.

## 2. Area dispositions

| Area | Disposition | Evidence and scope |
| --- | --- | --- |
| Pattern fit | No defect found | Journal deletion is a short centered confirmation. Personalization reset uses a native confirm. Journal editing, account deletion, settings, chapters and evidence remain in document flow. No reason to convert these wholesale into sheets. |
| Platform, focus and dismissal | Defect found | O03 and O05. Idle Radix dialog naming, initial Cancel focus, Tab containment, accessible-tree isolation, and return focus passed. It is a managed div dialog, not a native dialog. |
| Overlay sizing and reachable close | Defect found | O01; O06 affects action comfort. Normal dialog and menu bounds passed; a long title plus enlarged text exposes the missing fixed close/action area. |
| Background scroll | Defect found | O04 for menu scroll chaining. The modal blocked backdrop wheel scrolling. Its library locks body, not the root, and uses non-passive wheel/touchmove listeners; actual iOS touch behavior is not established. |
| Swipe dismissal | Not applicable | No custom swipe-to-dismiss implementation in the member overlays. Keep visible buttons; adding a gesture is unnecessary. |
| Back and history | Defect found | O03. Journal Cancel, Escape, history Back, direct-link Cancel, and the next Back passed in both render engines. Android hardware/gesture Back remains untested. |
| Navigation | Defect found | O02/O03. Four primary destinations are already exposed in a tab bar; no menu nesting beyond one level was found. |
| Dense data | Defect found | O07. No page overflow in the five populated placement cases per engine. Native table roles exist in landscape but disappear in the narrow list variant. |
| Physical browser chrome, touch, VoiceOver and TalkBack | Not tested | No physical device or OS simulator available. Desktop wheel and accessibility snapshots do not qualify these behaviors. |
| Admin `/content`, public calculator, third-party billing/auth screens | Not tested | Outside the selected main-member journey. Their unused or separate overlays are not reported as member-flow defects. |

## 3. Findings, ranked within severity by journey impact

### O01. The dialog's focused close action can be offscreen — P1 — Code + Render

- **Where:** `src/components/pattern/JournalDeleteDialog.tsx:37`, `:53`; `src/styles.css:3195`, `.journal-delete-dialog`.
- **Affects:** shared iOS Safari/Android Chrome implementation; reproduced in both render engines at 320×568 with a 32px root font and a valid 400-character title. Real text-size/zoom settings remain a device check.
- **Cause:** title, explanation and actions occupy one scrolling box. That box was 536px high with 1,592px scroll height; Cancel had focus but sat at y=1,417–1,489 while scrollTop was zero. Reading from the top also leaves no visible close action.
- **Fix — Proposed:** retain a compact confirmation, with persistent header/close control, separately scrolling description, and persistent action row. Use the existing tokens and Button component. Cap the outer dialog with the current vh/dvh fallback and safe-area budget; apply `min-height:0; overflow-y:auto; overscroll-behavior:contain` only to the description region. Do not truncate the title or reduce text size to conceal the issue.
- **Verify:** on both phones, enlarge text, open a long-title confirmation, scroll its explanation in both directions, rotate, and verify that Close/Cancel and the focused control remain visible.

### O02. Persistent navigation consumes 42% of short landscape height — P2 — Code + Render

- **Where:** `src/components/pattern/Shell.tsx:331`, `:337`, `:505`; `.mobile-journey` in `src/styles.css:419`.
- **Affects:** iOS Safari and Android Chrome, especially landscape; reproduced in both render engines at 667×375 and 844×390.
- **Cause:** the 83px sticky header and approximately 73px fixed bottom navigation do not collapse during reading. At 375px height they reserve approximately 156px, leaving 219px before browser chrome. The existing low-height rule releases timing filters, but not this header.
- **Fix — Proposed:** in the existing short-landscape breakpoint, let the closed-menu header scroll with the document. Retain the primary tab bar; keep a visible Close control when the navigation panel itself is open. No navigation destinations or branding need redesigning.
- **Verify:** read Today and compare chart rows in landscape with browser toolbars expanded/collapsed; ensure the top header scrolls away and navigation remains usable.

### O03. Menu dismissal does not cover Back or the current destination — P2 — Code + Render; physical Android outcome Inferred

- **Where:** `src/components/pattern/Shell.tsx:142`, `:216`, `:383`, `:431`, `:456`.
- **Affects:** shared Safari/Chrome menus in portrait and landscape. Browser-history behavior reproduced in both render engines; physical Android Back still needs confirmation.
- **Cause:** menu state closes on pathname change or Escape, with no owned history entry or native close request. Journal → Today → open menu → history Back returned to Journal. Selecting Today while already on Today left the menu open.
- **Fix — Proposed:** close on every destination activation, including the current destination. Use one menu close controller for toggle, Escape, outside dismissal and Back. For native `popover="auto"`, synchronize toggle events with that controller. If an owned history entry is used, remove it on every dismissal and replace it with the destination when navigating; do not leave a second-Back stop.
- **Verify:** on Android, Back first dismisses the menu and the next Back leaves the page. Repeat X/toggle, Escape, outside tap and current-page selection. On Safari explicitly test its navigation gestures instead of assuming Chromium close behavior.

### O04. Scrolling beyond the menu moves the underlying page — P2 — Code + Render; touch outcome Inferred

- **Where:** `src/styles.css:407`, `.mobile-menu`.
- **Affects:** Safari/Chrome menu boundary behavior; wheel proxy reproduced in both desktop engines at 667×375. Touch reproduction remains open.
- **Cause:** the internally scrolling menu has `overscroll-behavior:auto`. At its end, a 500px wheel movement changed document scroll by 500px in Chromium and 499px in WebKit, while menu scrollTop remained 174px.
- **Fix — Proposed:** add `overscroll-behavior-y:contain` to `.mobile-menu`. Keep the page interactive for this non-modal navigation surface. Do not add a document-wide touchmove preventDefault handler.
- **Verify:** flick the menu at both boundaries on real phones, then dismiss it and confirm the reading position has not moved. Scrolling outside a non-modal panel may still scroll the page intentionally.

### O05. Pending deletion removes in-app dismissal and error focus — P2 — Code + Render

- **Where:** `src/components/pattern/JournalDeleteDialog.tsx:40`, `:55`, `:59`; pending status support already exists at `src/routes/_authenticated/journal.tsx:303`.
- **Affects:** iOS Safari and Android Chrome in either orientation; reproduced at 360×800 in both engines using injected latency and failure.
- **Cause:** both buttons become disabled and Escape is prevented while the request is pending. After the injected failure, focus remained on BODY after an additional 600ms; the next Tab landed on Delete entry. The error and original entry were retained, but dismissal/recovery is unnecessarily awkward.
- **Fix — Proposed:** keep a Close action enabled during the request and allow Escape through the existing close controller. Label it Close while deletion is pending so it does not imply cancellation of a confirmed server request. Retain the existing background mutation/status handling. Keep focus on Close while pending; on error, announce the error and keep focus inside the dialog if it is still open. Disable only duplicate submission.
- **Verify:** delay, fail and interrupt the request; close during the delay; confirm no duplicate mutation, accurate completion/error status, and predictable focus. Closing the UI must not promise that deletion was cancelled.

### O06. Portal actions miss the app's mobile target sizing — P2 — Code + Render

- **Where:** `src/styles.css:232`, `.pattern-shell :where(button,input,select)`; `src/components/pattern/JournalDeleteDialog.tsx:35`, `:55`, `:59`.
- **Affects:** Safari/Chrome confirmation controls, portrait and landscape; 36px height measured in both render engines at ordinary text size.
- **Cause:** the 44px minimum is scoped under `.pattern-shell`; Radix portals the confirmation outside it. The default Button height is 36px. This clears WCAG's 24px size floor but misses the requested 44–48px comfort target.
- **Fix — Proposed:** add existing `min-h-11` sizing to Cancel/Close and `min-h-12` to the primary confirmation Button, or apply an equivalently narrow dialog rule. Preserve focus rings.
- **Verify:** measure computed boxes, then test left-thumb, right-thumb and two-thumb use on both phones without accidental destructive taps.

### O07. Phone placements lose their table semantics — P2 — Code + Render

- **Where:** `src/components/pattern/PatternChartDetails.tsx:202`, `:212`.
- **Affects:** Safari/Chrome below the `sm` breakpoint; verified at 320, 360 and 440px in both render accessibility snapshots. VoiceOver/TalkBack impact requires physical testing.
- **Cause:** narrow layouts hide the native table and render an unlabelled ul/li/span variant. The snapshot exposes list items, not a named table with row/column headers. At 667px the same data regains table/rowheader/columnheader/cell roles. This violates the requested semantic-preservation requirement; this audit does not claim a screen-reader-certified WCAG failure.
- **Fix — Proposed:** for comparing placements across bodies, reuse one native table at all widths. Keep caption, row headers and column headers; add a local horizontal scroller and sticky first column if the table needs more width. Retain native table display. Journal entries and timing windows can remain records/cards because their task is reading one record at a time.
- **Verify:** VoiceOver/TalkBack should expose a named table and announce body plus column context. Scroll horizontally with the first column retained; document width must remain 320/360px.

## 4. Proposed component specs and opportunities

### Journal confirmation — proposed, not implemented

**Pattern:** compact centered confirmation; no swipe dismissal and no bottom-sheet conversion. Smallest repair: retain the existing Radix primitive while fixing O01/O05/O06. If replacing this component, prefer native `<dialog>` + `showModal()` over another custom div overlay. Radix's managed focus and background isolation passed, so changing tags alone is not a reported defect.

**Structure:** titled modal → persistent header with labelled Close → scrolling description/error region → persistent Cancel/Close and Delete action row. Use Button and existing `--background`, `--rule`, `--radius` and focus tokens. Give only the middle region `min-height:0` and overflow. Retain a vh fallback, dvh cap, and safe-area clearance on every edge; ensure footer base padding plus bottom inset when using edge-to-edge viewport coverage. Keep pinch zoom enabled.

**Open sequence:** save trigger and document position → create one owned overlay history entry, preserving scroll → open modal → focus visible Cancel. Direct URLs containing `deleteEntry` do not imply that this session created a history entry.

**Close sequence:** Cancel, Close, Escape, native close request and successful deletion enter one idempotent controller. Pop an entry only if this instance owns the current entry; otherwise remove the query with replace. A history-driven close must not invoke Back again. Preserve the existing choice to ignore backdrop taps for a destructive confirmation. Restore the trigger, or Entries heading after deletion, and the original page position. A native dialog's cancel event should route through the controller; programmatic close from a history change must not recurse.

**Scroll:** the existing implementation blocked backdrop wheel scrolling and restored the original position on Cancel (Chromium 993→993; WebKit 1011→1011). Actual touch is unverified. Its Radix dependency uses body overflow and non-passive touchmove/wheel interception, with inner-content exemptions and pinch zoom allowed. Do not infer an iOS failure from that source alone. For a native implementation, lock root overflow while open and restore its previous value; use body-fixed offset capture/restoration only if physical Safari still scrolls. Avoid adding blanket touch cancellation. Keep scroll containment on the inner region.

**Pending state:** Close remains enabled and does not cancel the already-confirmed operation. Duplicate Delete is disabled. Existing inline pending status remains after dismissal. Error focus stays in the still-open modal; success falls back to Entries if the trigger has gone.

### Menus — proposed, not implemented

**Pattern/structure:** keep a shallow navigation list with ordinary links and the four visible primary tabs. Use a non-modal auto popover for the floating desktop More surface; the current mobile disclosure can retain its in-flow structure for the smallest repair. It should not become a modal sheet solely to imitate native apps.

**Open/focus:** keep a button with expanded state and controlled panel; keyboard users enter links in document order. No modal focus trap or page lock for a non-modal menu. Every menu has a visible toggle/Close control. Preserve focus when clicking another control; Escape/explicit close returns to the trigger. Destination navigation should focus the destination content appropriately.

**Scroll/sizing:** keep the current stable svh budget for the in-flow mobile disclosure. A fixed/top-layer popover instead needs a dvh bound relative to its trigger/edge clearance and its own contained scroll area. Close stays outside that scroller. The small-viewport menu bound itself passed.

**Back:** one owned router-history entry for an open custom menu supplies a fallback where native close behavior is absent. Synchronize native popover toggles when used. On dismissal, consume only that owned entry; on destination selection replace it with the destination; on history-driven dismissal hide without another Back. No history entry is needed for inline chapter/evidence disclosures.

### Dense data — proposed, not implemented

Use the existing table with caption, `th scope="row"`, and `th scope="col"`; do not set table/tr display to block or grid. Wrap it in a named, keyboard-focusable horizontal scroll region if needed, with max-width 100%. Pin row headers to the inline start using the existing background token. Keep vertical scrolling on the document. Never hide an overflowing column or convert it to an unlabeled list merely to fit the width.

### Platform opportunities and support

- O01/O05 expose an opportunity to simplify this one modal's focus/scroll lifecycle with native dialog; there is no reason to rewrite all Radix components. `showModal()` is Baseline widely available according to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal). Retain the working primitive as the fallback if supporting a browser without it.
- O03 exposes a concrete opportunity to use native non-modal popover dismissal for More. MDN labels the [`popover` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover) Baseline newly available. Feature-detect `showPopover`; retain the existing disclosure plus explicit close/history behavior where absent. Do not introduce anchor positioning or newer popover values to solve this task.
- [`CloseWatcher`](https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher) is not Baseline and is not a required dependency of the proposal. Android native close behavior still needs a device test; Safari behavior must be tested independently.
- [Caniuse](https://caniuse.com/css-overscroll-behavior) reports the needed overscroll containment in current target browsers, including Safari/iOS 16+ and modern Chromium. If the declaration is ignored, ordinary scrolling remains; modal page locking remains independent of containment.

No new dependency is proposed. None of these specs has been implemented or qualified on a physical phone.

## 5. Device test plan

Use a notched iPhone on current iOS Safari and a mid-range Android phone on current Chrome; record exact hardware, OS and browser versions. Other iPhone browsers using WebKit are not independent Blink validation.

1. Walk Today → check-in → save → Journal → return/reload at normal text; repeat with browser UI expanded/collapsed and both landscape directions. Check the 320px rendered reflow case separately from actual phone size.
2. Open a short and a valid 400-character journal-title confirmation. Test large OS/browser text and 200% pinch zoom separately. Verify visible Close/Cancel, focus indicators, VoiceOver/TalkBack order, internal scrolling and safe-area clearance. Exercise all offered Safari tab layouts with the overlay open.
3. Swipe at modal and menu scroll boundaries; confirm modal background stays still and menu boundary scrolling does not move the reading. After closing, compare page position. No non-passive blanket touchmove workaround without a reproduced need.
4. Test Android system Back/gesture and Safari back navigation separately. For each menu/dialog, test open→Back, open→Cancel/X→Back, open→Escape→Back, current-destination selection, repeated opens and direct-link/reloaded deletion URLs. Keep the intentional non-dismissable destructive backdrop.
5. Delay and fail deletion, dismiss during the delay, then allow completion. Verify one mutation, truthful progress, retained entry on failure, announced error, and focus on a visible control.
6. Use VoiceOver/TalkBack table navigation on twelve populated placements. Compare columns, rotate, and return to reading. Test Journal editor/account forms as in-flow tasks; native pickers and reset confirmation require their own OS presentation checks. Test standalone only if it is a supported product target.

**Deep-dive modules 2–7 worth running next:** prioritize **2 — viewport/safe areas** for real toolbar/notch/landscape behavior, then **3 — forms/keyboard** as designated in the user's viewport brief. For the remaining module numbers, the separate catalog has not been provided: prioritize gesture/scroll testing for O04, mobile accessibility for O01/O07, and errors/recovery for O05, followed by mid-range performance qualification. These are recommended topics, not invented labels for modules 4–7. This module's overlay/history corrections need a focused regression pass after implementation.

## 6. Open questions

- Which physical iPhone and Android devices are available for qualification, and is standalone/Home Screen use supported?
- What are the canonical titles for modules 4–7? The earlier area-number mapping conflicts with the later explicit designation of Module 3 as keyboard handling.

These questions do not block the proposed source-level fixes. No implementation approval was inferred from this audit request.

## Evidence files

`journey-{chromium,webkit}.json`, `overlays-{chromium,webkit}.json`, `dense-{chromium,webkit}.json`, `isolation-{chromium,webkit}.json`, screenshots, `source-checksums.json`, and `preservation.json` are alongside this report. The detector returned an empty findings list; it did not detect the behavioral defects above. The initial dense-data capture reached a native confirm and its CLI result was interrupted; only the separate completed dense-final results supply the reported measurements.
