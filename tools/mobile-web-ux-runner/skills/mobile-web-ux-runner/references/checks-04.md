# Module 4 — Touch Targets, Thumb Zones & Interaction Physics

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for hit areas, semantics, and focus; adapt for input method and reach; layout only for established spacing or hierarchy problems. Impeccable touch-size heuristics are ergonomic guidance, separate from the WCAG criterion. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's interactive controls for touch under the audit contract.

Check:
1. Target size. Measure rendered hit areas, not visual size.
   - Floor: WCAG 2.2 AA (2.5.8). Targets are at least 24×24 CSS px, or spaced so 24 px circles centered on undersized targets don't intersect other targets or each other. Before reporting a failure, rule out the other exceptions: an equivalent control, targets within a sentence or constrained by surrounding non-target text's line-height, unmodified browser controls, and essential presentation. The inline exception can include a button within prose; CSS `display: inline` alone does not qualify, and standalone links in lists, navigation, and footers still need size or spacing assessment.
   - Recommended for primary and frequent controls: 44×44 (Apple HIG) to 48×48 (Material), with about 8 px between targets. Missing this is a recommendation, not an AA failure.
   - To enlarge a hit area without changing the look: `position: relative` on the control and an `::after` with a negative `inset` (e.g. `inset: -10px`). Enlarged areas must not overlap neighbors.
2. Hover. Scope hover-only styling to `@media (hover: hover) and (pointer: fine)`. More important: anything revealed only on hover (tooltips, menus, card actions) needs a tap and focus path.
3. Pressed feedback. Every control needs a visible `:active` state that appears on touch. Confirm it fires in iOS Safari; if it doesn't, a no-op `touchstart` listener on the document is the known workaround. Keep motion small and honor `prefers-reduced-motion`. If you restyle `-webkit-tap-highlight-color`, keep a visible pressed state and keep `:focus-visible` outlines for keyboard and switch users.
4. Tap delay. With `width=device-width` in the viewport meta, current browsers have no 300 ms tap delay. Don't add `touch-action: manipulation` site-wide for that reason. Use it on controls people tap in quick succession (steppers, quantity buttons, game controls) so a double tap doesn't zoom.
5. Reach. Map where the primary action sits at each step of the principal journey. A frequent action in a top corner of a large phone is worth checking, not automatically a finding. Report it when it causes regrips or missed taps. A sticky bottom action bar is one option. Before recommending one, check it against the browser's bottom toolbar, the home indicator, the keyboard, cookie banners, and chat widgets. Explain why this flow benefits; don't move actions by rule.

Verification note
- Agent: rendered hit areas, including enlarged ones (probe points with `document.elementFromPoint`); spacing against the 24 px circles; overlap between neighbors; tap and keyboard paths to hover-only content; pressed and focus styles; reduced-motion handling, through emulated media.
- Simulator or device: `:active` firing in iOS Safari; double-tap zoom on rapid-tap controls; sticky bars against real toolbars and the home indicator.
- Person: reach and grip on large phones, and how often taps miss.

Deliver findings and before/after CSS and markup per the contract, written in the project's styling approach.
