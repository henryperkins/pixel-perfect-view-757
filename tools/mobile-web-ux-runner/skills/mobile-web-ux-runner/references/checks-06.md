# Module 6 — Gestures, Scroll Boundaries & Pull-to-Refresh Collisions

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for code-supported interaction risks, adapt when ownership must change between native scrolling and custom gestures, and harden for cancellation and state recovery. Do not infer device behavior from an Impeccable example. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's gestures and scroll areas under the audit contract.

Check:
1. Carousels and sliders. Prefer native horizontal scrolling (`overflow-x: auto`) with scroll snap. Use `scroll-snap-type: x mandatory` only for deliberately paged content, after checking that every item stays reachable at supported widths and zoom. Otherwise use `proximity`, or no snapping. Leave `touch-action` alone on native scrollers; `pan-y` there disables their horizontal swipe.
2. Custom gestures. Use Pointer Events. On surfaces whose horizontal drag is handled in JavaScript, use `touch-action: pan-y pinch-zoom` (iOS Safari 13+). Plain `pan-y` also blocks pinch zoom on that surface. Drop `pinch-zoom` only when the component handles pinch itself, as maps and drawing canvases do. Ancestors can restrict `touch-action` further, so check the chain up to the nearest scroll container, and verify pinch zoom starting on the surface. Declare axes with `touch-action` instead of calling `preventDefault()` in non-passive `touchmove` listeners. Mark listeners `{ passive: true }` when they don't cancel.
3. Edge collisions. iOS Safari and Android gesture navigation claim swipes from the left and right screen edges for Back (and Forward in Safari). A page can't reliably override them. Flag drag surfaces whose drags start at the edge; inset their start zones or add buttons.
4. Scroll chaining. Inner scroll containers (sheets, chat logs, side panels, maps) get `overscroll-behavior: contain`, so reaching their end doesn't scroll the page or trigger pull-to-refresh. Disable page-level pull-to-refresh (`overscroll-behavior-y: contain` on the root) only when the app has its own refresh or the page is a full-screen canvas or map. Verify per browser.
5. Scroll hijacking. Flag scroll-jacking, handlers that change scroll speed or snap the page, and scroll-triggered animation that blocks reading. Respect `prefers-reduced-motion`.
6. Legacy cleanup. Since iOS 13, overflow scrolling is accelerated without `-webkit-overflow-scrolling: touch`. The declaration isn't inert, though: WebKit noted it still created a stacking context on iPhone. Remove obsolete uses only after checking the layering of overlays, sticky elements, and `z-index` on supported iPhones. Don't hide scrollbars on containers whose scrollability isn't otherwise obvious.

Verification note
- Agent: computed `touch-action` up each ancestor chain; listener options; snap reachability, stepping through items at each width; `overscroll-behavior` values; synthetic touch drags in Chromium, as a proxy.
- Simulator or device: edge-swipe collisions; pull-to-refresh; scroll chaining and rubber-banding in iOS Safari; pinch zoom started on a drag surface; layering after removing `-webkit-overflow-scrolling`.
- Person: how a gesture feels, including thresholds and accidental triggers.

Deliver findings, CSS, and any listener code per the contract. List each gesture's non-gesture alternative.
