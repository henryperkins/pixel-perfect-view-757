# Module 3 — Virtual Keyboard & Form Ergonomics

Apply the [evidence contract](evidence-contract.md) and resolved runner mode. Audit and results-only verification do not edit source. Queue justified fixes for consolidated remediation; device-dependent changes follow the explicit apply-and-hand-off gate and entry budget. Platform notes come from r2; see [source provenance](sources.md).

## Impeccable route

Use audit for semantics; harden for validation, failures, preservation, and interruption; adapt for keyboard layout; clarify for a confirmed label, instruction, or error-copy issue. Preserve accepted formats and native form behavior. Follow the actually installed skill for invocation and prerequisites.

## Checks

Audit the target's forms and keyboard behavior under the audit contract. Walk each form end to end: focus, type, make an error, correct it, submit. Repeat in landscape.

Check:
1. Zoom on focus. iOS Safari zooms when a focused field's computed font-size is under 16px. Fix with font-size ≥ 16px on `input`, `select`, and `textarea` at mobile widths. Don't fix it with `maximum-scale=1`; that blocks pinch zoom on Android.
2. Keyboard per field. `inputmode` is a keyboard hint, not validation.
   - Use `type="email"`, `"tel"`, `"url"`, and `"search"` where they apply.
   - Codes, IDs, card numbers, and postal codes: keep `type="text"`. Add `inputmode="numeric"` only when every valid value is digits. Keep the text keyboard when letters or other characters are valid, as in UK and Canadian postcodes and many booking codes. Decide postal codes from the countries the product supports.
   - Keep `type="number"` for quantities; it adds stepping, accepts `e`, and invites parsing that drops leading zeros.
   - Amounts: consider `inputmode="decimal"` only when it permits every accepted character on the supported targets. Numeric and decimal keyboards may omit the minus key. For signed values, keep an input method that permits the sign; do not propose or apply a keypad known to omit it. If accepted formats or target keyboard behavior are unknown, keep the current input method, record the uncertainty, and script the needed check before proposing a restrictive change.
   - Add `enterkeyhint` (`next`, `go`, `search`, `send`, `done`) so the Enter key says what it does.
   - Usernames and codes: `autocapitalize="none"` and `spellcheck="false"`.
3. Autofill. Give every field its most specific `autocomplete` token: `name`, `email`, `tel`, `street-address` or `address-line1`, `postal-code`, `username`, `current-password`, `new-password`, `one-time-code`, `cc-number`, `cc-exp`, `cc-csc`. Flag `autocomplete="off"` on fields people want filled. Use real `<label>` elements, not placeholders.
4. Sign-in opportunities. If the product supports passkeys, `autocomplete="username webauthn"` plus a conditional `navigator.credentials.get()` call enables passkey autofill. For SMS codes, `one-time-code` lets the keyboard suggest the incoming code (iOS; on Android it depends on the keyboard and browser). If you control the message, end it with the origin-bound line (`@example.com #123456`).
5. Keyboard occlusion. Start from native behavior: browsers scroll a focused field into view on their own. Flag real failures only. The usual ones:
   - fixed bottom bars and submit buttons behind the keyboard,
   - fields inside fixed overlays or nested scroll containers,
   - landscape, where a sticky header, sticky footer, and keyboard leave almost no room.
   Fix per engine:
   - Chrome, Firefox, and Samsung Internet on Android: `interactive-widget=resizes-content` in the viewport meta. The keyboard then shrinks the layout viewport, so fixed bottom bars sit above it.
   - iOS Safari, and other iPhone browsers on WebKit: WebKit reports implementing `interactive-widget`, but Safari 27.0's release notes (September 14, 2026) don't list it. Check the versions in your support matrix. Where it's missing, use `window.visualViewport` `resize` and `scroll` events to offset or hide fixed bars.
   - `visualViewport` reports geometry, not keyboard state. Pinch zoom shrinks it too. Act only while an editable field has focus, account for `scale`, `offsetTop`, and orientation, and verify that zooming doesn't hide or displace essential controls.
   - Don't call `scrollIntoView` on every focus; it fights the browser's own scrolling. Use it only where native scrolling fails.
   - Set `scroll-padding-bottom` to a sticky footer's height so focused fields clear it (WCAG 2.4.11); verify per browser.
6. Errors. Validate on blur or submit, not on every keystroke. Put each error next to its field and link it with `aria-describedby`. On submit, move focus to the first invalid field. Keep what the user typed.
7. Keyboard dismissal. Don't add custom blur-on-scroll or swipe handlers; they break scrolling through long forms. Rely on the platform's dismissal, and make Enter advance or submit through a real `<form>`.
8. Input survival. Mobile browsers discard background tabs. If someone leaves mid-form to fetch a code or copy an address, does their input survive the reload? Persist drafts of long or multi-step forms (e.g. `sessionStorage`), excluding passwords and payment fields, and confirm they survive a discard on each browser.

Verification note
- Agent: computed font-size on fields; the field table's attributes; labels and error wiring; validation timing and focus movement; `scroll-padding` values; drafts saved and restored across a reload.
- Chromium's `Emulation.setVirtualKeyboardGeometryOverride` (experimental) feeds only the VirtualKeyboard API and `env(keyboard-inset-*)`. Nothing covers the page, so it can't show occlusion.
- Simulator or device: focus zoom; the keyboard covering fields or buttons; Enter key labels; `interactive-widget` and `visualViewport` handling with a software keyboard open; landscape with the keyboard open; drafts surviving a tab discard.
- Person: autofill with saved data, password managers, passkeys, SMS codes, and IME input. Keep real personal data out of automation.

Deliver findings and updated markup and JS per the contract, plus a field table: field | accepted characters | type | inputmode | autocomplete | enterkeyhint | autocapitalize | spellcheck.
