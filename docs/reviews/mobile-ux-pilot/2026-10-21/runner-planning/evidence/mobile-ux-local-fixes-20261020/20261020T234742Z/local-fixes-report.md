Verification ceiling: local source/mechanism and desktop-browser proxy evidence, using Linux Chromium 149.0.7827.55 and Playwright WebKit 26.6 with isolated synthetic services. No physical-device target verification was performed.

F-01 and F-03 are implemented locally and pass their recorded checks. F-02 remains open: WebKit mouse activation can lose a band selection when the existing Shell focus-reveal callback scrolls the page between pointer-down and pointer-up. Its immediate proxy failure mechanism is isolated, and a conditional guard is documented without applying it.

# Pattern local fixes and F-02 investigation

This continues the existing pilot and preserves its F-IDs and historical observations. Authorization: fix F-01/F-03, investigate F-02 without device-dependent changes, and keep all work local. No commit, push, deployment, dependency update or plugin update occurred. HEAD remains `8e0e5c933ab8bad2b3e186e70501ef8e31d82570`; [source-identity.json](source-identity.json) identifies the uncommitted build by file hashes.

## 1. Verdict and limits

The requested local work is complete. The runner ledger deliberately records F-01/F-03 as **implemented**, rather than target Verified, and F-02 as **open**. Its ten physical-device entries remain unrun. Final [ledger validation](ledger-validation.json) returned no structural errors and exit 3 (valid but incomplete). A passing ordinary journey does not close the intermittent F-02 failure. A structurally valid but incomplete ledger is the expected handoff state.

## 2. Coverage and substitutions

The local build uses real routes, TodayCheckIn, Shell, styles, the new RouteFocus and the root-owned draft controller. Vite replaces member/server APIs with `tests/helpers/mobile-ui/services.ts`, supplying a synthetic member, deterministic reading and session-backed test responses. The client fixture replaces production bootstrap/SSR/hydration. Recorded contexts abort Stripe resources. These boundaries prevent claims about real authentication, transport, server persistence/encryption, models, charts, payment behavior, deployment or production performance.

Independent review additionally replaces the in-memory Journal component in two deliberate-focus probes and gates its in-memory `beforeLoad` in two navigation-race probes. F-02 controls change only disposable test contexts. Exact per-check substitutions are retained in [run.json](run.json). Historical pilot observations remain linked; only the confirmation checks listed here were repeated on the changed build.

| Master area | Disposition in retained audit | Highest evidence / environment | Remaining target work |
| --- | --- | --- | --- |
| Reach and placement | Defects found: F-02 | Proxy, desktop WebKit pointer traces | C-LD01–C-LD04: actual grips, reach and touch activation |
| Viewport and safe areas | No defect found in sampled layouts | Proxy, both engines; current 18 layout/text samples | C-LD01–C-LD04: browser chrome, actual insets, narrow phone, orientation/text settings |
| Touch targets | Defects found: F-02 | Proxy, retained layout/activation checks and current diagnosis | C-LD01–C-LD04: physical activation; 44px guidance is distinct from the 24px AA floor |
| Forms and keyboard | Defects found: F-01, now implemented | Mechanism/proxy, both engines and themes | C-LD01–C-LD04: software keyboard, focus zoom and submit clearance |
| Gestures and scrolling | Defects found: F-02, open | Proxy, retained synthetic checks and current failing scroll traces | C-LD01–C-LD04: real rubber-banding, pinch, edge navigation and long-note scrolling |
| Overlays/navigation/dense data | Defects found: F-03, now implemented | Proxy, 14 current regressions and 8 independent focus/race probes | C-LD04–C-LD06: actual Android Back and assistive route context; dense tables outside this journey |
| Content priority | No defect found in sampled synthetic reading | Proxy, retained pilot reading checks | C-LD05/C-LD06: assistive reading order; live writing remains outside this fixture |
| Performance | No defect found in inspected source only | Mechanism, retained source inspection; build warnings recorded | C-LD09/C-LD10: optimized-build phone traces; field performance unknown |
| Errors and recovery | No defect found in executed checks | Source tests plus retained synthetic recovery checks; current save/reload confirmations | C-LD07/C-LD08 and isolated real backend: actual interruptions and server outcomes |
| Accessibility on mobile | Defects found: F-01/F-03, implemented | Mechanism/proxy, contrast/focus and four current axe scans | C-LD05/C-LD06: real VoiceOver/TalkBack; scan success does not establish full conformance |

## 3. Findings and checks

All three findings remain P2 with stable IDs. The ledger retains original reproduction details, source revision, exact affected scopes and prior failures.

**F-01 — low resting reflection textarea boundary contrast. Implemented.** The enabled, unfocused note field used `border-input`, yielding approximately 1.29:1 against its surrounding light background and 1.88:1 in dark mode. Only this textarea now uses the existing `border-muted-foreground` token. In both engines the measured outer contrast is **5.22:1 light / 6.65:1 dark**, exceeding the 3:1 boundary criterion. Inner contrast is 5.66:1 / 6.32:1. Dimensions, focus styles, disabled styles and semantics are retained. Checks: C-L-CH-CONTRAST and C-L-WK-CONTRAST; [confirmation results](confirm-chromium.json), [WebKit results](confirm-webkit.json). Physical display and assistive journeys remain unrun.

**F-02 — intermittent WebKit mouse band activation misses after a scroll reset. Open, investigated only.** Reproduction: fresh Today state, use Check-in anchor, click Mood 4 and then Energy 3. Expected: both choices remain selected; observed failures retain only one band. Pass-through tracing isolates unchanged `Shell.revealFocus` while `MAIN#main-content` is transiently active. Main contains itself, so the helper measures the whole landmark; one captured call scrolls by -809px while the pointer is down, moving the intended label before release. Before-fix diagnostics had 4 misses in 20 trials across four explicitly different setups. On the ordinary changed build, native activation had 1 miss in 6; suppressing only main-targeted focus events in a disposable control had 0 misses in 6. These counts support the mechanism but do not qualify physical Safari or prove a future exact patch. C-L-F02-BASE and C-L-F02-LOCAL intentionally retain failures. [Full investigation and conditional diff](f02-investigation.md). **No Shell, viewport, gesture or history change was applied.**

**F-03 — route completion left focus on BODY. Implemented.** Previously, Today → Journal completed visually but left the next Tab at Skip to content. A root-mounted RouteFocus observer records PUSH/REPLACE and waits for the matching rendered destination before focusing `#main-content` with `preventScroll`. It preserves initial loads, same-page query/hash changes, cross-route hash targets, Back/Forward, deliberate destination focus and menu focus return. Matching the rendered history key prevents a superseded route from stealing focus. The real app root and the isolated fixture mount the same component. C-L-FOCUS-RED records the pre-fix failure; C-L-CH-FOCUS and C-L-WK-FOCUS each pass seven cases, and C-L-CH-REVIEW / C-L-WK-REVIEW each pass four additional independent probes. [Independent review](independent-review.md) found no actionable issue. Actual screen-reader navigation and production hydration remain unqualified.

## 4. Recommendations

Keep F-02's candidate guard proposed until separately authorized and checked under the relevant actual input/browser conditions. Its exact diff has not been applied or verified. If target qualification is pursued, use the existing ten-entry script with the current source identity and confirmed isolated backend. R-01 remains a recommendation to measure optimized phone performance with the named tools before making performance claims; bundle size alone is not runtime evidence.

## 5. Changes and validation

| File | Finding / purpose |
| --- | --- |
| `src/components/pattern/TodayCheckIn.tsx` | F-01: strengthen only the note's resting border using an existing token |
| `src/components/pattern/RouteFocus.tsx` (new) | F-03: persistent route completion focus observer |
| `src/routes/__root.tsx` | F-03: mount observer above route-local Shell instances |
| `tests/helpers/mobile-ui/main.tsx` | Mount the same observer in the isolated test root |
| `tests/helpers/mobile-ui/route-focus.cases.txt` (new) | Seven executable browser regression cases |

The scoped patch is saved as [changes.patch](changes.patch). No other baseline source/configuration file changed. [Preservation evidence](preservation.json) confirms 1,982 of 1,985 baseline hashes unchanged, with only the three authorized existing files changed; the two additions are listed above. Existing `.claude/settings.local.json` and editorial documents are preserved, the index remains empty, inspected runner/Impeccable files match their pilot hashes, and HEAD is unchanged. [Cleanup](cleanup.json) confirms the owned browser sessions and verified loopback server are closed.

Validation ([machine record](validation.json)):

- Full `npm test`: **1,211 tests; 1,207 passed, 0 failed, 4 skipped**. The skipped Swiss Ephemeris and Node/workerd parity/archive replay checks remain explicitly listed in the record and log.
- `npm run build`, TypeScript, scoped ESLint, Prettier and `git diff --check` passed. The build reports chunk-size, ineffective dynamic-import and dependency module-directive warnings; it is not warning-free.
- **14/14** main browser regressions: seven per engine, covering new navigation, REPLACE, initial/reload, hash/query, router refresh, Back/Forward/draft retention and menu/hash focus behavior.
- **8/8** independent review probes: four per engine, covering React autoFocus, layout-effect focus outside main, overlapping navigations and cancellation by Back. Initial reviewer harness assertion failures remain retained with their correction explained in the review.
- **18** layout/text samples: no recorded horizontal overflow. **4** axe scans: no reported violations. Changed-file Impeccable detector: `[]`.
- Both engines passed an ordinary synthetic Today/check-in save and reload, preserving both selected bands and a Unicode note, with no page errors. F-02's separately reproduced intermittent failure remains open.

## 6. Remaining device script

[device-script.md](device-script.md) contains the actionable current-build entries C-LD01–C-LD10, under the unchanged ten-entry budget. They replace historical C-D01–C-D10 because the required source changed. No device-dependent fix consumed a reserved slot.

The entries separately cover Safari Compact/Bottom/Top tab configurations, Android keyboard/Back, VoiceOver, TalkBack, real Safari/Android interruption, and optimized phone traces via Chrome remote DevTools and Safari Web Inspector. Each includes the required build, unknown build/setup wiring, explicit steps/state transitions, expected results and blank results/build/setup/notes/evidence fields. No phone-accessible build or backend has been provisioned. Missing states stay unrun; a pass in one state cannot qualify another. Beyond-budget configurations remain title-only references in that script and the ledger.

## 7. Open questions

- Does the same main-focus/scroll sequence occur with physical Safari finger input or supported external-pointer input, and under which browser/OS/chrome/keyboard states?
- Do F-01/F-03 behave correctly on actual displays and VoiceOver/TalkBack while preserving destination focus, keyboard clearance and history behavior?
- Which phone-reachable non-production build/backend will supply the exact current source and isolated account, and what substitutions will it actually contain?
- What do real interruption, server persistence, production hydration and measured optimized phone performance show? Those facts cannot be inferred from this client fixture or successful build.

These questions limit target claims; no additional implementation, release or plugin update is authorized or needed to complete the requested local work.
