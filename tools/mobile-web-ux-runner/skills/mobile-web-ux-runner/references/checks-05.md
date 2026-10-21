# Module 5 — Overlays, Navigation & Dense Data

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for semantics and navigation, adapt for responsive presentation, and harden for focus, history, dismissal, scroll locking, and draft recovery. Preserve the router and proven primitives. If a material product decision needs a design brief, follow the installed shaping workflow and existing user authorization. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's overlays (modals, drawers, sheets, menus, popovers), navigation, and dense data under the audit contract.

Check:
1. Pattern fit. Bottom sheets suit action lists, pickers, filters, and short tasks. Short confirmations can stay as compact centered dialogs. Long or multi-step tasks may deserve a full-screen view or their own route. Recommend per overlay, not wholesale.
2. Platform first. Prefer `<dialog>` with `showModal()` (focus moves in, the background goes inert, Esc closes, top layer) over hand-rolled `div` overlays. Use the `popover` attribute for menus and other non-modal UI. Keep the browser's native focus restoration. In custom overlays, return focus to the trigger when the overlay closes with focus inside it. Don't pull focus back if the user dismissed it by moving to another control.
3. Sizing. Cap overlay height to the visible viewport (`max-height: 100dvh`, or about `90dvh` for a sheet) with its own scroll area, bottom safe-area padding, and a close control reachable without scrolling.
4. Background scroll. Contain scroll inside the overlay with `overscroll-behavior: contain`, and lock the page with `overflow: hidden` on the root. Verify on iOS Safari. If the page still scrolls there, fix the body in place and restore the scroll position on close. Avoid non-passive `touchmove` handlers that call `preventDefault()`; they can block scrolling inside the sheet.
5. Swipe to dismiss. Optional. If present, start the drag from the handle, or from content already scrolled to the top. Use a distance or velocity threshold. Keep a visible close button: dragging needs a single-pointer alternative (WCAG 2.5.7).
6. Back. On Android, Back should normally close the topmost dismissible overlay. Chromium integrates native close requests with modal `<dialog>` and `auto` and `hint` popovers. Check the actual configuration and handlers: `closedby="none"` and canceled close requests can change a dialog's behavior. Check `popover="manual"`, non-modal dialogs, and custom overlays explicitly; manual popovers don't light-dismiss. Test Back on each overlay and supported version instead of inferring behavior from the element, and don't assume other engines match.
   - Don't add a history entry solely to implement Back dismissal when native close requests already provide it. A real navigable overlay route may still need history coordinated with its router.
   - If a custom overlay needs history, closing by X, backdrop, or Esc should traverse back once only when its owned entry is still current and no traversal has already handled the dismissal. Closing in response to `popstate` must update the overlay without another `history.back()`. Back traverses an entry; it does not delete it from forward history. Check Forward, direct entry, and repeated dismissal as well.
7. Navigation. Inspect menus nested more than two levels deep, primary destinations hidden behind a menu when a short tab bar would fit, and headers that take a large share of the viewport. Report them when they slow the journey.
8. Dense data. Choose by task. Stacked cards suit scanning one record at a time. A horizontally scrolling table with a sticky first column suits comparing across rows. Keep table semantics for screen readers either way; changing a table's `display` can strip them in some browsers.

Verification note
- Agent: dialog and popover types; accessible names; focus entering, staying, and returning; inert backgrounds; Esc and close buttons; history entries per overlay; overlay heights at each viewport size; table semantics in the accessibility tree.
- In supported Chromium versions, desktop Esc and Android Back use the close-request path for eligible modal `<dialog>` and `auto` and `hint` popovers; configuration and handlers can affect dismissal. Treat Esc as a proxy for Android Back, not target evidence. Desktop Back, including `page.goBack()`, is history navigation, not a close request; use it only to test history entries.
- Simulator or device: background scroll leaking in iOS Safari; Android Back; swipe to dismiss; sheets with the keyboard open.

Deliver findings and the component spec or code per the contract: structure, open and close sequence, focus, scroll, and Back handling.
