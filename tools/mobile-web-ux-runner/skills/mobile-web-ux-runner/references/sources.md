# Source provenance

## Contract revision and limits

The active [evidence contract](evidence-contract.md) and seven `checks-*.md` references implement **Mobile Web UX Audit Prompts, October 20, 2026, revision r2**. The original supplied deliverable is `mobile-web-ux-audit-prompts-2026-10-20-r2.md`; it remains unchanged outside this installed skill. The active references contain the executable contract and module guidance, so the package does not carry a second full-suite archive. The prior integrated v3 contract is superseded.

Source SHA-256: `40da748ef3947c45f82eecc2624c5f7213d91898c65f0afd6438934a30efb8d3`.

The standalone source records 49 behavioral cases as **Not run**. That historical artifact is not rewritten to imply validation. The integrated runner's test evidence must identify the runner revision, model/agent, tools, fixtures, results and limitations separately. Migrating text, passing helper tests, and executing agent behavioral cases are different forms of evidence; none establishes an application audit or physical-device behavior.

The r2 author records earlier browser-support checks on October 13, 17 and 18, 2026 and targeted primary-documentation checks on October 20 for close requests/history, target-size exceptions, text resizing, viewport sizing and input modes. This migration carries those notes forward; it is not a fresh browser-support survey or device test. At audit time, recheck current primary documentation against the actual support matrix. Documentation establishes a mechanism, not a passing target observation.

## Impeccable integration

The old runner was authored against installed Impeccable 4.3.1. The integration review inspected upstream Impeccable **4.7.0**, pinned at commit `dad8dbb3aac21ad1fa236c110315ef4abece23e8`:

- [Pinned Impeccable skill](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/plugin/skills/impeccable/SKILL.md)
- [Pinned workflow routing](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/skill/reference/routing.md)

Neither version describes an uninspected application's installation. Resolve the actually installed version and workflow names once per run, follow its prerequisites, and retain the existing project context, design system and task. Impeccable remains a separate dependency; do not install or upgrade it merely because a newer upstream version exists. The runner's mode, device-fix authorization, evidence and human-check budgets remain explicit.

## Primary references for runtime checks

These links document the mechanisms used by the suite. Their inclusion does not claim that this migration newly fetched every page or verified a target browser.

| Topic | Primary reference | Interpretation boundary |
| --- | --- | --- |
| Viewport lengths | [CSS Values and Units Level 4](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths) | Small, large and dynamic units do not by themselves establish keyboard occlusion behavior. |
| Growable sections | [CSS Sizing Level 3](https://www.w3.org/TR/css-sizing-3/#min-size-properties) | A minimum size allows growth only after conflicting fixed sizing/clipping is addressed. |
| Android edge-to-edge | [Chrome edge-to-edge guide](https://developer.chrome.com/docs/css-ui/edge-to-edge) | Verify chin movement and bottom-bar strategy on target Chrome; nonzero inset emulation is a proxy. |
| Keyboard and layout viewport | [Chrome viewport resizing](https://developer.chrome.com/blog/viewport-resize-behavior/) | Historical browser tables do not substitute for the run's support matrix. |
| WebKit keyboard support | [WebKit standards position 65](https://github.com/WebKit/standards-positions/issues/65) and [Safari 27 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes) | Implementation status and shipping-version support are different claims. |
| Emulation overrides | [Chrome DevTools Protocol: Emulation](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) | Overrides are experimental proxies. Keyboard geometry does not cover the page with a real keyboard. |
| Playwright engines | [Playwright browser documentation](https://playwright.dev/docs/browsers) | Playwright WebKit is not Safari. |
| Target size | [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Measure hit areas and rule out exceptions; display:inline alone is not the inline exception. |
| Text resizing | [WCAG 2.2 SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [ACT viewport rule](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/) | A restrictive declaration is a flag; criterion conclusions depend on effective text resizing and supported-browser behavior. |
| Reflow | [WCAG 2.2 SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Check 320 CSS px; preserve legitimate two-dimensional content. |
| Drag alternatives | [WCAG 2.2 SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Required dragging needs an appropriate non-drag alternative. |
| Keyboard hints | [HTML inputmode](https://html.spec.whatwg.org/multipage/interaction.html#attr-inputmode) | A hint is not validation or a guarantee of a minus key. |
| Autofill purpose | [HTML autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill) | Correct tokens support purpose; actual saved-data autofill needs appropriate human or target checks. |
| Native dismissal | [HTML close requests and close watchers](https://html.spec.whatwg.org/multipage/interaction.html#close-requests-and-close-watchers), [dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element), [popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute) | Configuration, canceled requests and browser/version affect behavior. Do not add redundant history solely for native dismissal. |
| Touch ownership | [Pointer Events touch-action](https://www.w3.org/TR/pointerevents3/#the-touch-action-css-property) | Browser panning, custom dragging and pinch zoom are distinct; ancestor restrictions matter. |
| Scroll snap | [CSS Scroll Snap Level 1](https://www.w3.org/TR/css-scroll-snap-1/) | Mandatory snapping requires reachable content at all supported widths and zoom. |
| Legacy overflow scrolling | [WebKit Safari 13 features](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/) | Automatic acceleration does not establish that the old declaration has no stacking effect. |
| Performance metrics | [Web Vitals](https://web.dev/articles/vitals) and [CrUX methodology](https://developer.chrome.com/docs/crux/methodology) | Field metrics are scoped to their collection window and populations; TBT is not INP. |
| bfcache | [Chrome no-store eligibility](https://developer.chrome.com/docs/web-platform/bfcache-ccns) | Preserve needed cache headers; record the actual miss reason and supported browser. |
| Connectivity | [HTML navigator.onLine](https://html.spec.whatwg.org/multipage/system-state.html#navigator.online) | A connectivity hint does not establish service reachability or the outcome of a write. |
| Replay safety | [RFC 9110 section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) | Unknown write outcomes require status/reconciliation, not an assumed safe retry. |
| Sharing | [Web Share API](https://www.w3.org/TR/web-share/) | A resolved handoff does not prove publication; a stub cannot verify the real OS boundary. |
| Vibration | [Vibration API](https://www.w3.org/TR/vibration/) | Optional limited-support feedback; preserve visible feedback. |

The suite additionally cites [Apple's developer forum report on Safari tab layouts](https://developer.apple.com/forums/thread/799143) and [MDN popstate documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event). Treat reported Safari layout/tinting symptoms as leads to test, and distinguish a history traversal from deleting an entry or triggering a native close request.
