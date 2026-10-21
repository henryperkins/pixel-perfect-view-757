# Module 2 — Viewport, Browser Chrome & Safe Areas

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for source and measured geometry; adapt for justified responsive or safe-area changes. Use layout only for an established spacing or hierarchy issue. Viewport mechanics still need the target checks below. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's viewport sizing, safe areas, and horizontal overflow under the audit contract.

Check:
1. Viewport units. Find each `100vh` on a full-height element and what it's for. On mobile, `vh` matches the viewport with browser UI retracted, so a `100vh` element is too tall while that UI shows. Report it when content or a key action is hidden as a result; a deliberate large-viewport layout isn't a defect. When a change is warranted, choose the unit by job:
   - `svh` for in-flow full-height sections. It is stable and sized for expanded browser UI. Prefer `min-height: 100vh; min-height: 100svh;` so content can grow. Remove conflicting fixed heights or clipping; check 320 px, landscape, and 200% text enlargement. Use fixed sizing only where a deliberate, accessible inner scroll area handles overflow.
   - `dvh` for fixed overlays that must match the visible area. It updates (throttled) as browser UI moves, so in-flow layout built on it can jump during scroll.
   - Put the fallback before the supported unit on the same property. Remove a legacy `-webkit-fill-available` workaround only after checking the supported browsers no longer need it, under the device-dependent fix rules.
   - None of these units track the virtual keyboard by default. Keyboard handling is Module 3.
2. Document scrolling. Prefer scrolling the document. A full-height wrapper with its own `overflow: auto` can stop browser UI from collapsing and break iOS tap-status-bar-to-top.
3. Viewport meta. Expect `width=device-width, initial-scale=1`. Flag `user-scalable=no` and effective `maximum-scale` caps below 2. Check whether the supported browser enforces the restriction and whether text can reach 200% without loss of content or functionality (WCAG 1.4.4). Distinguish a restrictive declaration from a demonstrated criterion failure; another supported text-resizing mechanism can affect the conclusion. A cap of 2 meets the minimum scale threshold alone, not the whole criterion. Preserve the contract's stronger rule against adding zoom restrictions. Add `viewport-fit=cover` only when the layout handles insets deliberately. Without that, content can slip under the notch in landscape.
4. Safe areas. Check inset exposure with and without `viewport-fit=cover`; don't assume insets are 0 without it. Since Chrome 135, Chrome on Android phones draws pages behind the gesture navigation bar once its bottom "chin" slides away on scroll, and `safe-area-inset-bottom` changes as the chin moves. Insets can change while browser UI moves, so check both toolbar states.
   - Give each edge's inset one owner, so parent and child don't both add it. Use `max(16px, env(safe-area-inset-bottom, 0px))` for a minimum total clearance, or `calc(12px + env(safe-area-inset-bottom, 0px))` for spacing beyond the inset.
   - Fixed bottom bars: padding tied to the dynamic inset makes Chrome on Android relayout as the chin moves, and Chrome stops retracting the chin when it detects that pattern. Check Chrome's edge-to-edge guide before choosing padding, positioning (`bottom: env(safe-area-inset-bottom, 0px)`), or its `safe-area-max-inset-bottom` pattern. Verify on both engines.
   - Verify toolbar expanded and collapsed, landscape, and installed mode where supported.
5. Safari on iPhone. Since iOS 26, users pick a Compact, Bottom, or Top tab layout. Developers have reported fixed headers and footers shifting or leaving gaps between layouts. Test each layout with the toolbar expanded and collapsed. A report from iOS 26.1 also shows the bar areas taking on a fixed overlay's background color, with `theme-color` no longer controlling them. Check bar color with overlays open.
6. Horizontal overflow at 320 and 360 px. Find the element causing it; don't mask it. Usual causes: fixed widths; `100vw` inside padded containers; images, video, iframes, `pre`, or tables without `max-width: 100%` or their own scroll; long URLs and emails (`overflow-wrap: anywhere`); flex children stuck at `min-width: auto` (`min-width: 0`); grid tracks that need `minmax(0, 1fr)`. Two-dimensional content (maps, data tables, diagrams) may scroll inside its own container; WCAG 1.4.10 allows it. If clipping is truly needed, prefer `overflow-x: clip`. `overflow-x: hidden` creates a scroll container and can break `position: sticky`.
7. Fluid type. A `clamp()` preferred value needs a `rem` term, e.g. `clamp(1rem, 0.9rem + 0.6vw, 1.25rem)`. Type sized in `vw` alone doesn't grow with browser zoom.
8. Installed PWA, if in the display modes. In `display-mode: standalone` there's no browser UI. Depending on status-bar settings, content can run under the status bar. On iOS there's no browser Back button, so the app needs its own.

Verification note
- Agent: page-level overflow at each width and landscape size; computed heights and the units behind them; the viewport meta; which element owns each inset; inset handling with non-zero values, using Chromium's `Emulation.setSafeAreaInsetsOverride` (experimental; it also sets the max-inset values).
- Agent, at proxy level: the band an expanded toolbar would cover. `Emulation.setSmallViewportHeightDifferenceOverride` (experimental) makes `svh` shorter than `lvh`. Confirm what `vh` resolves to under it, then check what a full-height element puts below the `100svh` line.
- Simulator or device: browser UI moving, and `dvh` tracking it; real insets at the notch, home indicator, and Android navigation bar; iOS tab layouts and bar tinting; Chrome's chin; installed-mode status bars.

Deliver findings and the changed CSS and HTML per the contract. For each fix, name the states it handles: toolbar expanded, collapsed, landscape, or installed.
