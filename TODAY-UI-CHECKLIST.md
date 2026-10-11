# Today UI improvement checklist

Each item records the problem, the concrete solution, and its acceptance check.
Checked items have been implemented and verified. Publication and the live commit
are recorded in the release handoff after deployment.

- [x] **Match keyboard order to the phone layout.** Put the reading before supporting details in the document, and use one following sidebar for metadata and feedback. Verify that Tab follows the visible page without jumping to the bottom and back.
- [x] **Keep desktop sidebar controls together.** Replace the two automatic grid rows with one reading column and one naturally stacked sidebar. Verify a small, consistent gap between Reading details and feedback at desktop widths, regardless of article length.
- [x] **Provide recovery for every failed load.** Add friendly initial-error cards and Retry for Today and Journal. Keep cached content visible after a background failure with a clear retained-data notice. Disable the previous day's check-in while a new-day refresh is unresolved. Verify failure, retry, successful recovery, and calendar rollover.
- [x] **Shorten the daily loop.** Place Reflection & check-in after the reading, label its shortcut Check-in, and present timing windows as compact expandable rows. Hide secondary rows behind More windows. Verify that check-in precedes the timing/journal stack and jump links clear the sticky header.
- [x] **Give timing cards a real action.** Use accessible disclosure controls that reveal the cycle's phase, domain, orb, and closest-pass date. Verify pointer and keyboard opening, collapsed content accessibility, and reduced motion.
- [x] **Make check-in controls clear and comfortable.** Use descriptive, keyboard-navigable band choices with 44px targets, explicit clearing, a visible optional note label, readable input text, and a prominent Save action. Move detailed privacy/retention explanations into a disclosure. Preserve consent gating, saved state, retry, and edits made during requests. Verify 320px/390px layouts and the full save/reload/error flow.
- [x] **Make evidence traceable and accurately labelled.** Replace the headerless table with labelled calculated values. Link citations to their exact paragraphs and saved source facts. Distinguish calculations, cycles, published references, language wording, personal context, and reflection. Preserve exact paragraph boundaries across encrypted cache storage; legacy readings must disclose unavailable paragraph links. Verify source/paragraph focus, embedded blank lines, cache reopen, and legacy readings.
- [x] **Keep the saved rating visible.** Load the account's saved response for the current reading, return a canonical save receipt, highlight the selected option, and show persistent saved/failure feedback. Verify change, retry, reload, and account/reading isolation.
- [x] **Include entries for every active window.** Filter Today Journal against all current cycle keys, independently of the timing display limit. Show concise entry previews with access to the full journal. Verify an older entry attached to the sixth active window and a genuine empty state.
- [x] **Use honest loading copy.** Remove the promise that all first readings take only a few seconds. Provide a calm progress state without an unsupported time guarantee. Verify delayed loading and reduced-motion visibility.

## Release acceptance

- [x] TypeScript, scoped ESLint, whitespace checks, focused regressions and the complete test suite pass.
- [x] Production build passes.
- [x] Actual components pass desktop and phone browser checks, including keyboard order, error recovery, normal/reduced motion, overflow, and console health.
- [x] An independent code review has no unresolved blockers.

Release procedure: update GitHub main with the real remote parent and a checked
branch lease, publish the synchronized project through Lovable, then verify the
served commit and desktop/phone public-page smoke checks. Record the deployed
commit in the release handoff.

Authenticated browser checks use synthetic local data. Local database regressions exercise real SQL and encryption; live-account acceptance is recorded separately from those checks.

Verified locally on October 11, 2026: 234 tests pass, including real SQL and
encrypted-cache regressions. TypeScript, scoped ESLint, whitespace checks and the
production build pass. All ten browser acceptance groups pass at 320px, 390px and
desktop widths with normal and reduced motion; no runtime errors or horizontal
overflow were found. The 390px fixture places Reflection & check-in at y=1124px
(previously y=2517px); the desktop sidebar gap is 24px. The independent code
review has no unresolved blockers.
