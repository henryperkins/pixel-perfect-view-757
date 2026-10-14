# Approved side-accent cleanup — 2026-10-14

The user approved this narrow visual cleanup after the three pre-existing Impeccable findings were triaged separately from the mobile viewport audit. All three are fixed. No detector suppressions were added; none of these three findings remain standing.

## Changes

| Target                                               | Evidence      | Implemented fix                                                                           | Verification                                                                                |
| ---------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/styles.css:1187` `.window-card`                 | Code          | Removed its 3px accent border, border-color transition, and accent hover rule.            | Source inspection; no consuming component was found, so no rendered window-card is claimed. |
| `src/styles.css:2183` `.journal-entry`               | Code + Render | Replaced the 2px left accent with a symmetric 1px `--rule` border and `--radius` corners. | Journal at the viewports below, in Chromium and WebKit.                                     |
| `src/styles.css:2330` `.today-journal-previews > li` | Code + Render | Applied the same neutral border and corner tokens.                                        | Today journal preview at the viewports below, in Chromium and WebKit.                       |

The neutral border follows `DESIGN.md`'s existing hairline rule. Copy, card backgrounds, padding, controls, and behavior retain their existing implementation. No HTML, component, dependency, or viewport-handling changes were needed for this cleanup. The styling applies in portrait, landscape, and standalone; physical toolbar and standalone behavior were not tested here.

## Verification

The local fixture renders real routes and styles with synthetic member services. It does not load `.env` or call member/model services. Evidence is **Render**, not physical-device evidence.

| Engine                 | Viewports and themes                                                                        | Result                                    |
| ---------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Chromium 155.0.8059.12 | 320×568, 390×844, 667×375 landscape, 1280×900 desktop in light theme; 390×844 in dark theme | 10 cases passed across Today and Journal. |
| WebKit 26.6            | Same matrix                                                                                 | 10 cases passed across Today and Journal. |

- Both journal surfaces have symmetric 1px borders and 4px corners in all 20 cases.
- No document or card horizontal overflow in those cases.
- Journal Edit and Delete controls remain at least 44 CSS px high.
- Matching Chromium before/after cases retain identical text, padding, background, control dimensions, and card width.
- No browser page errors were recorded during the captures.
- Screenshots reviewed at phone, landscape, desktop, and dark-theme sizes.
- `prettier --check src/styles.css` and the scoped `git diff --check` passed.
- Impeccable's explicit source scan returned `[]`; the automatic hooks also reported no deterministic issues.
- Only `src/styles.css` changed among the 1,504 pre-existing files hashed at the start of this cleanup. Other work was preserved.

Physical iOS Safari and Android Chrome, toolbar expansion/collapse, safe-area behavior, virtual keyboards, and installed standalone mode remain outside this decorative-change verification. LCP, INP, and CLS: **not measured**. No commit, push, or deployment was performed.

## Artifacts

- [Incremental CSS patch](accent-cleanup.patch) starts from the already-dirty CSS immediately before this approved cleanup.
- [Verification summary](verification-summary.json), [Chromium before](before-chromium.json), [Chromium after](after-chromium.json), and [WebKit after](after-webkit.json) contain the measurements and screenshot filenames.
- [Source checksums](source-checksums.json) bind this follow-up to its source files; [preservation check](preservation-check.json) records the unchanged prior work.
- [Capture script](capture.cases.txt) is a Playwright CLI `run-code` function; it expects the local fixture on port 4199.
- [Detector result](impeccable-detect.json) records the source scan.

The [preceding viewport audit](../../../docs/superpowers/plans/2026-10-14-mobile-viewport-safe-area-audit.md) and its artifacts retain their original source identity and line references. This addendum records the subsequent approved CSS cleanup; it does not claim that the larger viewport or member-flow test suites were rerun.
