# Module 1 — The Master Mobile Web App UX Audit Prompt

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use the installed Impeccable audit workflow for source, accessibility, responsive, and performance evidence. Use critique only when hierarchy or task design needs assessment; read the installed workflow and deduplicate its findings. Scores do not establish browser defects. Preserve the surface and design system. Follow the actually installed skill for invocation and prerequisites.

## Checks

Run a full mobile audit of the target under the audit contract.

Start with the contract's capability check, and state the verification ceiling. Then take the principal journey: the one task most mobile visitors come to complete. Use the contract's principal task, or name it. List its steps, and walk it at phone width before auditing details. Rank findings by how much they hurt that journey.

Then check each area and record its coverage, even when nothing is wrong. Each item is an investigation lead, not a verdict.
1. Reach and placement: Can frequent and primary actions be reached without regripping? Top-corner actions on large phones and fixed bottom bars are worth checking. Report them when they cause regrips or missed taps, or collide with the browser toolbar, home indicator, or keyboard.
2. Viewport and safe areas: Does the layout survive toolbar expansion and collapse, the notch, the home indicator, landscape, and a 320 px width without page-level horizontal scrolling? Maps, data tables, and other two-dimensional content may scroll inside their own containers.
3. Touch targets: Do controls meet WCAG 2.2 AA (24×24 CSS px, or one of the criterion's exceptions)? Do primary controls reach the recommended 44×44 (Apple) to 48×48 (Material)? The inline exception covers targets within a sentence or constrained by the line-height of surrounding non-target text. CSS `display: inline` alone does not qualify; assess standalone links in lists, navigation, and footers for size or spacing.
4. Forms and keyboard: Zoom on focus; correct `type`, `inputmode`, `autocomplete`, and `enterkeyhint`; fields or submit buttons hidden by the keyboard; input lost when the tab reloads.
5. Gestures and scrolling: Hover-only content, scroll hijacking, horizontal drags that collide with edge-swipe navigation, nested scroll traps, accidental pull-to-refresh, pinch zoom blocked on custom surfaces.
6. Overlays, navigation, and dense data: Desktop modals on small screens, the page scrolling behind overlays, focus lost or stolen on close, Back leaving the page instead of closing the overlay, wide tables.
7. Content priority: Is the mobile view reprioritized for the journey, or a desktop layout stacked into one long column?
8. Performance: Field LCP, INP, and CLS where available. In the lab, LCP, CLS, and TBT, plus INP for scripted interactions. Heavy images, long tasks after taps, layout shift from late content.
9. Errors and recovery: Failed requests, offline, form errors, duplicate submissions after a lost response, and what survives when the browser discards a background tab or the user goes Back.
10. Accessibility on mobile: Screen reader order and labels (VoiceOver, TalkBack), zoom to 200%, orientation lock, focus hidden under sticky bars, reduced motion.

Verification note
- Agent, in desktop emulation: layout and overflow at each width; computed styles; field attributes; hit areas; focus order; names and roles in the accessibility tree; dialog semantics and history entries; lab performance; failure handling with intercepted requests to a test backend.
- Simulator or device: browser UI movement, real safe-area insets, the virtual keyboard, focus zoom, system gestures, pull-to-refresh, iOS scroll locking, Android Back, larger text settings, tab discards, and the share sheet.
- Person: reach and grip, autofill with saved data, passkeys, VoiceOver and TalkBack journeys, and how gestures feel. Automated scans don't establish a screen-reader journey.
- Field data: real-user LCP, INP, and CLS.

Follow the contract's output format. After the open questions, name the deep-dive modules (2–7) worth running next, and why.
