Verification ceiling: local mechanism and desktop-browser proxy evidence in Linux Chromium 149.0.7827.55 and Playwright WebKit 26.6 with isolated synthetic services. **Physical-device verification is explicitly unrun.**

F-02's minimal guard is implemented locally and passes the focused checks. No lost band selection occurred in the 40 recorded post-guard input trials. The deterministic regression also confirms that main focus no longer triggers the unwanted scroll, while real fields and radio labels retain focus clearance. This does not establish physical Safari/Android behavior.

# F-02 local guard continuation

## 1. Verdict

The requested implementation and local checks are complete. F-02 is **implemented**, not target Verified. The existing F-01/F-03 edits remain intact. No commit, push, deployment, plugin update or dependency update occurred. HEAD remains `8e0e5c933ab8bad2b3e186e70501ef8e31d82570`; [source-identity.json](source-identity.json) records the exact dirty-source identity.

## 2. Coverage and substitutions

The tests execute real TodayCheckIn, Shell, RouteFocus, navigation, draft state and styles. The existing Vite fixture substitutes member/server APIs with synthetic services and client bootstrap for production SSR/hydration; contexts block Stripe resources. The only added browser instrumentation records `scrollBy` while calling the original. No focus-event suppression, router-restoration override or component replacement is installed in these focused checks. Synthetic saves/reloads establish fixture behavior, not real backend persistence.

The table retains the original ten-area audit rather than implying a fresh whole-application audit. [The preceding report](../../mobile-ux-local-fixes-20261020/20261020T234742Z/local-fixes-report.md) and [run.json](run.json) preserve prior evidence and failures.

| Area | Retained disposition | Current continuation / highest level | Remaining environment |
| --- | --- | --- | --- |
| Reach and placement | Defects found: F-02, implemented | Proxy: repeated native band activation | Physical grips/reach and actual input |
| Viewport and safe areas | No defect found in earlier sampled layouts | Prior proxy layouts retained; no new layout sweep | Actual insets, browser chrome, text settings and orientation |
| Touch targets | Defects found: F-02, implemented | Proxy: mouse/synthetic touch activation | Physical touch and supported external pointer |
| Forms and keyboard | Defects found: F-01, implemented | Proxy: real textarea/radio focus clearance and keyboard selection | Actual software keyboard/focus zoom |
| Gestures and scrolling | Defects found: F-02, implemented | Proxy: main no longer scrolls; descendants still reveal | Safari/Android native chrome, zoom and gesture transitions |
| Overlays/navigation/dense data | Defects found: F-03, implemented | Proxy: 14 current route-focus regressions | Android Back and assistive route context; dense tables outside this journey |
| Content priority | No defect found in earlier synthetic reading | Prior proxy evidence retained; not re-audited | Assistive reading order and live writing |
| Performance | No defect found in earlier source inspection | Mechanism only; not measured anew | Optimized phone traces and field data |
| Errors and recovery | No defect found in executed scenarios | Source tests; six current synthetic save/reload confirmations | Actual interruption and isolated real backend outcomes |
| Accessibility on mobile | Defects found: F-01/F-03, implemented | Proxy: current focus/keyboard regressions; prior contrast/axe retained | VoiceOver/TalkBack and actual display/keyboard |

## 3. Findings

**F-02 — WebKit mouse activation can miss Energy after a scroll reset. P2, observed, now implemented.** In the original sequence, opening Check-in and rapidly activating Mood 4 then Energy 3 could leave one band unset. Prior traces isolated Shell's focus-reveal callback measuring the entire main landmark while it was transiently active during radio-label activation. The resulting scroll moved the label before pointer-up.

The applied change in `src/components/pattern/Shell.tsx:94-101` captures the main element and returns when the active element is main itself, missing, outside main or not an HTMLElement. All later geometry, viewport-scale handling, visible-label targeting and scrolling behavior remain unchanged.

Before applying the guard, the new deterministic test failed in **both engines**: starting at scrollY 600, `main.focus({preventScroll:true})` still caused Shell to call `scrollBy(-608)`, resetting scrollY to 0. The textarea and native-radio label clearance checks passed on that same baseline. After the guard, all three cases pass in both engines. The regression tests real scroll/focus behavior; it does not inspect source text or suppress the callback.

Repeated post-guard trials also passed without a main-triggered `scrollBy`: 12 mouse, 4 synthetic-touch and 4 keyboard contexts per engine. Historical intermittent failures remain retained in the parent ledger. The exact guard addresses the isolated main-targeting mechanism, but the passing counts do not qualify unrun physical input, OS keyboard/chrome, accessibility or backend conditions.

**F-01 and F-03 remain implemented.** Their source files are byte-identical to the start of this continuation. All seven existing route-focus cases were rerun in each engine. Contrast/layout/axe and independent review results from the previous step remain historical; they were not all repeated for this guard.

Current checks: C-G-CH-SHELL / C-G-WK-SHELL, C-G-CH-SELECT / C-G-WK-SELECT, C-G-CH-ROUTE / C-G-WK-ROUTE and C-G-UNIT. C-G-CH-SHELL-RED / C-G-WK-SHELL-RED retain the expected pre-fix failures. Physical checks C-GD01–C-GD10 remain not_run.

## 4. Recommendations

No additional source change is proposed by this continuation. If physical qualification is later pursued, use the current build-specific script and independently confirm the non-production backend and actual setup. Performance remains a separate measurement recommendation; this focused development fixture establishes no production performance result.

## 5. Changes and validation

Only two files changed in this step:

- `src/components/pattern/Shell.tsx`: minimal main-landmark exclusion in `revealFocus`.
- `tests/helpers/mobile-ui/shell-focus.cases.txt`: three executable browser cases for main scroll preservation, textarea clearance and native-radio label clearance/keyboard selection.

[changes.patch](changes.patch) contains only these changes. [preservation.json](preservation.json) confirms that 2,264 of 2,265 baseline files are unchanged, with only Shell changed; the regression file is the sole addition. Prior F-01/F-03 files, settings and editorial work are preserved, the index remains empty, HEAD is unchanged, and all 20 inspected runner/Impeccable/instruction files retain their hashes.

| Focused check | Chromium | Desktop WebKit |
| --- | ---: | ---: |
| Main/textarea/radio focus regressions | 3/3 | 3/3 |
| Mouse band-selection trials | 12/12 | 12/12 |
| Synthetic-touch band-selection trials | 4/4 | 4/4 |
| Keyboard band-selection trials | 4/4 | 4/4 |
| Existing route-focus regressions | 7/7 | 7/7 |
| Total | **30/30** | **30/30** |

The first trial of each input method also saved and reloaded a Unicode reflection plus both bands: six synthetic persistence confirmations, included within the selection counts above. No page errors were recorded.

The full `npm test` command completed with **1,211 tests: 1,207 passed, 0 failed, 4 skipped**. TypeScript, scoped ESLint, Prettier and `git diff --check` passed. An initial formatting-only lint/check failure is retained: Prettier wrapped the guard's return onto another line, and the checks then passed. Selection trials used the same guard before that whitespace-only wrap; the focus and route regressions were rerun on final bytes. This equivalence is recorded in source-identity.json. The design hook reported no deterministic issues. A production build was not rerun for this focused change.

[validation.json](validation.json) links the results and logs. [cleanup.json](cleanup.json) confirms that both owned browser sessions and the verified loopback server are closed. Only owned resources were stopped.

## 6. Physical-device script — explicitly unrun

[device-script.md](device-script.md) contains ten current-build entries, all not_run. The required phone build B-PHONE-GUARD must contain F-01/F-02/F-03 and match source-identity.json. It has not been provisioned or deployed. Build and setup substitutions remain unknown until independently confirmed; local Vite aliases are not inherited by a phone.

Five distinct guard entries fit the reserved five of the unchanged ten-entry budget: Safari Compact/Bottom/Top tab settings, Android Chrome, and Safari with a supported external pointer. They include native band activation, main/control focus, keyboard open/closed, chrome transitions, portrait/short landscape and enlarged text. VoiceOver, TalkBack, actual interruption and an Android performance trace remain separate unrun entries. The previously unrun iPhone performance trace is preserved historically and listed beyond budget so the applied guard's pointer check receives priority. No completed device result was removed or invented.

## 7. Open questions

- Does physical Safari reproduce the original event sequence, and does this guard prevent it for finger and supported external-pointer input under the listed states?
- Are real keyboard/chrome transitions, zoom, focus clearance, VoiceOver/TalkBack and Android Back correct on the current build?
- Which non-production phone build/backend will supply the exact current source, isolated account and actual wiring?
- What do real interruption, server persistence, production hydration and measured phone/field performance show? Those remain outside this fixture and this request.

All physical-device verification remains explicitly unrun. F-02 is recorded as implemented with local proxy passes, without a target Verified claim.

## Ledger helper limitation

The installed helper returned exit 2 for the applied guard target-plan mapping; its exact errors are retained in [ledger-validation.json](ledger-validation.json). The original F-02 affected scope names desktop Playwright WebKit, while the required future checks correctly describe physical phone configurations and a not-yet-provisioned build. Its strict matcher cannot validate that plan, including the additional native-control regression configurations. The source/proxy checks are recorded separately from required target checks. No original affected scope, browser/device, build identity or achieved evidence level was relabelled to obtain approval, and no plugin was updated. The machine ledger is retained with this validation limitation; application checks remain passing and all physical-device checks remain unrun. [summary.json](summary.json) records these facts without a target verification claim.
