# Mobile member flow — implementation and qualification

Date: 2026-10-14. Baseline: `e8eee400592848033df1e36d3fef6a123ad9b5c8`. This records local implementation of the [approved remediation plan](2026-10-14-mobile-member-flow-remediation.md), following authorization to proceed. No commit, push, deployment, live account mutation or paid model request was performed.

## 1. Summary

- The three P0 paths now retain unfinished reflections, reconcile uncertain saves, and reject stale birthplace responses.
- Deletion requires confirmation; Back, failed requests and focus return have explicit recovery behavior.
- Phone fields, reflow, enlarged text, selected-state semantics and fixed-bar focus clearance are corrected.
- Both desktop engines pass 54 behavioral checks, 72 layout cases and 40 focus samples each; 883 unit tests pass, with four existing skips.
- Physical iOS Safari/Android Chrome, actual keyboard/browser chrome, assistive technology and production performance remain **Not tested**; LCP, INP and CLS are **not measured**.

### Principal journey

**Read Today and save a personal check-in/reflection.** This remains an interface-based inference, not a claim about traffic analytics.

1. Open Today as a returning member with a chart.
2. Read the reflection and use the Check-in shortcut.
3. Choose permitted bands and enter a reflection note.
4. Save and distinguish account confirmation from a local checkpoint.
5. Navigate away, return or reload; recover unfinished work and optionally continue in Journal.

This journey was exercised at 390×844 before the detailed layout sweep in Chromium 155.0.8059.12 and desktop WebKit 26.6. Both use real application components with synthetic member/server services. These are **Render** results, not physical-device results. The viewports were 320×568, 360×800, 390×844, 440×956, 667×375 and 844×390. Root-font 32 px was additionally tested at 320×568, 390×844 and 667×375; it is a text-layout stress test, not actual phone 200% zoom.

Evidence: [Chromium results](../../../output/playwright/mobile-member-2026-10-14/chromium-results.json), [WebKit results](../../../output/playwright/mobile-member-2026-10-14/webkit-results.json), [reproduction instructions](../../../tests/helpers/mobile-ui/browser-cases.md), and the source checksum manifest beside those results. Source citations below refer to the implemented local files; baseline citations and original causes remain in the approved plan.

## 2. Area dispositions

A repaired defect remains **Defect found**, with its verification status recorded. “No defect found” is limited to the exercised evidence. Missing hardware is not “Not applicable.”

| Area                                   | Disposition                                           | Result and remaining boundary                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Reach and placement                 | **Defect found** — F09                                | No tested focused control is partly or wholly behind the measured header/nav. Frequent check-in controls are 48 px high. Real grips and large-phone reach are Not tested.                                                                       |
| 2. Viewport and safe areas             | **Defect found** — F05/F08/F10                        | Eight routes pass all 72 width/text cases per engine without page overflow or overlapping nav labels. Landscape filters use normal flow. Physical notch, indicator, toolbar and keyboard insets are Not tested.                                 |
| 3. Touch targets                       | **No defect found** in sampled Code/Render controls   | Preserve at least 24×24 or the spacing exception, excluding inline text links. Check-in controls now provide 48 px height. Device mis-taps and mixed grips remain Not tested.                                                                   |
| 4. Forms and keyboard                  | **Defect found** — F01/F02/F03/F07/F12                | Recovery, save reconciliation, current lookup identity, purpose metadata and at least 16 px sampled editable text pass. Real focus zoom, autofill, Next/Done and keyboard occlusion are Not tested.                                             |
| 5. Gestures and scrolling              | **No defect found** in inspected Code/Render          | Native scrolling and tap alternatives remain; reduced-motion render check passes. Physical edge-swipe and pull-to-refresh remain Not tested.                                                                                                    |
| 6. Overlays, navigation and dense data | **Defect found** — F04/F11                            | Deletion confirmation traps focus, locks body scrolling and handles Back/direct URLs/failure/pending completion. Membership Keep restores focus. Responsive chart presentation is retained; real AT/gestures remain Not tested.                 |
| 7. Content priority                    | **No defect found** in exercised journey              | Reading/check-in order and shortcuts remain. Recovery controls follow the fields and appear only when relevant. No new permanent dashboard section was added.                                                                                   |
| 8. Performance                         | **Not tested** — production phone/network unavailable | LCP, INP and CLS are **not measured**. Passing a build or fixture interaction is not a performance measurement.                                                                                                                                 |
| 9. Errors and recovery                 | **Defect found** — F01/F02/F03/F04                    | Lost acknowledgements, failed writes, storage denial/quota, corruption, expiry, consent, cross-tab conflicts, account switching and dated drafts have reproducible checks. OS eviction and a physical background-tab discard remain Not tested. |
| 10. Accessibility on mobile            | **Defect found** — F06/F09/F10/F12                    | Selected state, input purposes, focus return/clearance, text reflow and reduced motion pass available checks. VoiceOver, TalkBack, actual 200% zoom and OS text settings remain Not tested.                                                     |

Installed-PWA launch is **Not applicable to this implementation**: installation was unspecified, and no manifest or service worker was introduced. This does not provide an offline application shell.

## 3. Findings by journey impact

For every finding, iOS Safari and Android Chrome are the intended phone targets in portrait and landscape. **No Device finding or Device verification is claimed.** Shared code was exercised in Chromium and desktop WebKit; an iPhone browser sharing WebKit is not a separate device test. The API support/fallback references remain in the approved plan.

### F02 — Unfinished drafts disappear — P0 — Code + Render

- **Where:** `src/components/pattern/TodayCheckIn.tsx:128`, `src/components/pattern/JournalEntryEditor.tsx:22`, journal composer; `src/components/pattern/MemberDraftProvider.tsx:39`, `src/lib/member-draft-controller.ts:81` and `src/lib/member-draft-store.client.ts:118`.
- **Affects:** Both intended phone browsers; navigation/Back/reload in either orientation. Observed and retested at 390×844 in both desktop engines.
- **Cause:** Route-owned state disappeared on unmount/reload; saves also needed a durable pending snapshot and reconciliation.
- **Fix — Implemented; Verified in unit/Render scope:** Root-owned drafts and encrypted IndexedDB checkpoints for check-ins, new entries and edits. Explicit Resume/Discard/Copy, seven-day expiry, account/day scoping, transaction acknowledgement, generation/discard fences and conflict forks. A previous day's active draft is immediately offered with its date. Discard resets Today to saved values. Unsupported/blocked storage and quota retain usable memory with a truthful warning. Corruption isolates the unreadable record without deleting healthy drafts.
- **Verify on device:** After the checkpoint acknowledgement, navigate/Back, reload, background-discard and reopen. Recover every field; test a different account and a day boundary. Kill before a checkpoint separately and record possible uncommitted-keystroke loss.

### F01 — Delayed journal save clears newer input — P0 — Code + Render

- **Where:** `src/routes/_authenticated/journal.tsx` (`save`, `checkSave`, `.journal-compose`); `src/lib/journal-submit.ts`; `src/lib/pattern.server.ts` (`addLifeEvent`, `resolveLifeEventSubmission`).
- **Affects:** Both intended phone browsers, both orientations; slow/failed/uncertain network saves. Retested at 390×844 in both desktop engines.
- **Cause:** The old success callback cleared current fields regardless of which text had been submitted.
- **Fix — Implemented; Verified in unit/Render scope:** Immutable submission snapshot, read-only pending composer, revision-aware acknowledgement, and a UUID operation reused only for its exact original payload. Creation atomically inserts once and returns the owned canonical entry; replay never overwrites it. Check save reads first. Existing edit revision checks remain. Later text survives a retry of an earlier create or edit.
- **Verify on device:** Interrupt a response after commit, reconnect and use Check save. Confirm one entry, the original payload on an explicit retry, and the later draft still available. Repeat a failure before commit.

### F03 — A stale birthplace response replaces newer input — P0 — Code + Render

- **Where:** `src/lib/place-lookup.ts:33`, `src/hooks/usePlaceLookup.ts:3`, onboarding and birth editors (`City, country`, Lat, Lon, Time zone).
- **Affects:** Both intended phone browsers/orientations when lookup is delayed. Retested in both desktop engines, including the saved birth editor.
- **Cause:** Results, errors and loading completion were not tied to the current input/request generation.
- **Fix — Implemented; Verified in unit/Render scope:** Shared generation guard plus AbortController; current result validation; invalidation on label/manual-coordinate edits and unmount; disabled/guarded calculation while unresolved or pending. Valid manual signed coordinates remain usable.
- **Verify on device:** Request Paris, type Berlin before completion, then repeat with negative manual coordinates. Old responses/errors must not change fields or loading state; retry/manual entry must remain available.

### F09 — Fixed bars obscure keyboard focus — P1 — Code + Render

- **Where:** `src/components/pattern/Shell.tsx` (header/nav measurement and focus reveal); `src/styles.css` (`scroll-padding-*`, `.pattern-shell` focus margins, `[data-constrained-viewport]`).
- **Affects:** Both intended phone browsers, portrait/landscape; real virtual-keyboard behavior still requires Device evidence.
- **Cause:** Fixed surfaces lacked measured lower clearance; native focus scrolling could leave the control behind navigation.
- **Fix — Implemented; Verified in Render scope:** Measure both surfaces, reserve page/scroll clearance and reveal obscured focus on deliberate focus/viewport changes. Feature-detect VisualViewport, preserve pinch zoom, and move nav/filters to normal flow when available height is too small. All 40 focus samples per engine are fully clear at 390×844 and 667×375.
- **Verify on device:** With both Safari toolbar positions and the OS keyboard open, tab/Next/tap through all fields, rotate and close the keyboard. Focus must remain visible without oscillation or unwanted scroll during typing.

### F04 — Journal deletion is immediate — P1 — Code + Render

- **Where:** `src/components/pattern/JournalDeleteDialog.tsx`, journal `remove` mutation and `deleteEntry` search state; `.journal-delete-dialog` at `src/styles.css:3190`.
- **Affects:** Both intended phone browsers/orientations; confirmation also checked at 320 px and short landscape in both desktop engines.
- **Cause:** The Delete control immediately performed a permanent mutation.
- **Fix — Implemented; Verified in Render scope:** Existing Radix alert dialog, Cancel-first focus, explicit permanent-delete text, disabled repeat confirmation, persistent pending/error state, scroll lock, bounded scrolling, and route-aware Back/Cancel/direct-link behavior. Removing an entry also discards its edit drafts. Back during a confirmed request shows truthful pending status; completion returns focus after the old control disappears.
- **Verify on device:** Cancel/Escape/Back before confirmation must keep the entry. Fail and retry a confirmed request. Go Back during the pending request and verify eventual outcome/focus. Check controls with the keyboard, safe areas and enlarged text.

### F05 — An unbroken saved URL breaks reflow — P1 — Code + Render

- **Where:** `src/styles.css` (`.journal-entry`, `.journal-entry-editor`, `.draft-recovery`, shrinkable labels/fields).
- **Affects:** Both intended phone browsers/orientations; 320 px regression reproduced and retested in both desktop engines.
- **Cause:** Long content and intrinsic field widths could exceed their containing column.
- **Fix — Implemented; Verified in Render scope:** Local shrink constraints and `overflow-wrap: anywhere`; full saved text remains intact. The long-URL probe reports scroll width equal to client width, 320 px, in both engines.
- **Verify on device:** Save/paste a long URL or unbroken token, inspect entry/editor/recovery and selection/copy at 320-equivalent reflow and landscape. No page-level horizontal scroll or truncation.

### F06 — Accuracy selection has no accessible state — P1 — Code + Render

- **Where:** `src/routes/_authenticated/onboarding.tsx` accuracy buttons, matching the birth editor's `aria-pressed` pattern.
- **Affects:** Both intended phone browsers; VoiceOver/TalkBack announcements remain untested.
- **Cause:** Selection was represented only by visual styling.
- **Fix — Implemented; Verified in Render scope:** Exactly one selected button exposes `aria-pressed="true"`; the existing labels and selection behavior remain.
- **Verify on device:** Navigate the group with VoiceOver/TalkBack and change accuracy. Confirm the label and selected state are announced once and stay synchronized with the form.

### F12 — Personal input purposes are missing — P1 — Code + Render

- **Where:** Onboarding/birth date `autocomplete="bday"`; privacy display name at `src/routes/_authenticated/privacy.tsx:490` (`nickname`).
- **Affects:** Both intended phone browsers with autofill/AT support; actual autofill remains untested.
- **Cause:** Browser-recognizable input purpose metadata was omitted.
- **Fix — Implemented; Verified in Render scope:** Birthday and nickname metadata, retained password/email autocomplete and appropriate single-line enter hints. Journal event dates are not marked as birthdays.
- **Verify on device:** Use autofill/password manager and screen readers; confirm the intended field receives each value without overwriting unrelated fields.

### F07 — Small editable text risks Safari focus zoom — P2 — Code + Render; zoom Inferred

- **Where:** `src/styles.css:3209` (`.pattern-mobile-field`), auth/security/check-in/journal/birth/profile/current-location fields.
- **Affects:** Small text affects both intended phone browsers; unexpected focus zoom is an iOS Safari concern, not a reproduced Chrome Android behavior.
- **Cause:** Several editable controls computed to 12–14 px at phone sizes, including landscape.
- **Fix — Implemented; Verified for computed text in Render scope:** At least 16 px editable text below 1024 px, preserving larger user text settings. The final matrix reports no sampled field below 16 px. Coordinate inputs retain ordinary text entry until signed-decimal keyboard support is physically qualified.
- **Verify on device:** Focus every field in both orientations, use Next/Done and negative coordinates; observe Safari focus zoom separately from intentional pinch zoom. This is what would confirm the inferred Safari effect.

### F10 — Enlarged text overlaps or exceeds columns — P2 — Code + Render; actual phone scaling Inferred

- **Where:** Shell header and `.mobile-journey` labels; `.pattern-summary-*`; check-in Save; `.today-reading h1`; journal fields/recovery and `.privacy-main` actions.
- **Affects:** Both intended phone browsers with enlarged text; tested with 32 px root font in both desktop engines.
- **Cause:** Nonwrapping labels/actions, long headline words and intrinsic field widths outgrew their columns. The enlarged header also needed to wrap without covering its brand text.
- **Fix — Implemented; Verified in Render scope:** Wrap/shrink only the affected owners, constrain Save, permit the header to grow, and measure the resulting fixed surfaces. All 72 route/viewport/text cases per engine pass without page overflow or nav-label overlap.
- **Verify on device:** Test actual 200% pinch zoom and OS/browser text enlargement separately, at narrow portrait and short landscape. Confirm text, controls, focus rings and menu remain usable.

### F08 — Sticky Timing surfaces leave little landscape content space — P2 — Code + Render

- **Where:** `src/styles.css` (`.timing-filters` short-viewport and constrained-viewport rules).
- **Affects:** Both intended phone browsers in short landscape. Render checks include 667×375 and 844×390.
- **Cause:** Header, sticky filters and bottom navigation occupied most of the available height; the baseline left 89 px for content at 667×375.
- **Fix — Implemented; Verified in Render scope:** Filters use normal flow on phone viewports at most 500 px high; the constrained-height fallback also releases fixed surfaces when required. Measured filter position is `static` in both landscape cases/engines.
- **Verify on device:** Expand/collapse browser chrome, rotate, change filters and open a window. Reading content and actions must remain visible without nested scrolling traps.

### F11 — Membership Keep drops focus — P2 — Code + Render

- **Where:** `src/components/pattern/MembershipSettings.tsx:15` (trigger/heading refs and close focus handling).
- **Affects:** Both intended phone browsers with keyboard/AT navigation, either orientation.
- **Cause:** Closing the inline confirmation removed the currently focused button without selecting a return target.
- **Fix — Implemented; Verified for Keep in Render scope:** Restore the cancellation trigger after Keep; use the section heading if successful cancellation removes that trigger. Billing behavior is unchanged; no live billing action was used.
- **Verify on device:** Open cancellation then Keep with VoiceOver/TalkBack or an external keyboard. Focus returns to the trigger; separately qualify the heading fallback with an authorized test membership.

## 4. Opportunities

- **Implemented:** The observed check-in band/Save step now has 48 px control height using existing components. Validate comfort with mixed grips; this was not an asserted 24 px AA target failure.
- **Implemented:** F02 now offers contextual Resume/Discard/Copy and distinguishes local recovery from account Save. The notice follows the fields so typing does not move the field on its first keystroke.
- **Proposed, awaiting Device evidence:** A decimal keyboard for manual coordinates could help F03's fallback. Ordinary text input is retained because negative values must remain enterable on both phone keyboards.

## 5. Verification, review and delivery checklist

- [x] Pure recovery/controller, journal creation/edit/replay and lookup tests, including content revision conflicts, latest queued writes and waiting for a forked submission checkpoint before transport.
- [x] Full suite: **887 tests, 883 passed, 4 existing skipped, 0 failed**. Final run: 56.32 seconds, Node test-runner output.
- [x] TypeScript `--noEmit` and production build pass. ESLint on changed code has **0 errors and 2 Fast Refresh organization warnings** in the provider file; no runtime rule errors.
- [x] Both desktop engines: **54 behavioral checks + 72 layout cases + 40 unobscured focus samples each**. Long saved URL reflow and reduced-motion checks pass. Results are synthetic/Render evidence.
- [x] One independent whole-change review and subsequent corrections: consent/content CAS, quick-login session refresh, cross-tab purge/reactivation, blocked sessionStorage, isolated corruption recovery and Today discard. Extended regressions also cover prior-day active drafts and pending-delete Back focus.
- [x] No new dependency, database migration, service worker, chart/provider change or live backend operation. Existing Button/Tailwind/Radix systems are used.
- [x] Source and fixture evidence retained with checksums; selected screenshots visually inspected. Existing dirty work is preserved by guarded delivery to the shared checkout.
- [ ] Real current iOS Safari and Android Chrome qualification below.
- [ ] Production/mid-range-phone/slow-network measurements and any resulting performance fixes.
- [ ] Commit/push/deploy and live principal-journey qualification, if subsequently authorized.

Recovery limits: seven-day expiry is enforced when the application accesses storage; a closed browser cannot run timed deletion. An OS kill before a transaction commits, browser eviction/site-data clearing, or an unavailable offline app shell can prevent recovery. Encryption keeps private values out of plaintext draft records; it is not protection from a compromised origin or someone controlling the unlocked browser profile. No server key is exported. A source-linked build success is not deployment or live-account proof.

## 6. Real-device test plan

Record device model, OS/browser build, CSS viewport, orientation, toolbar placement, text/zoom settings, network, build SHA/URL and evidence filename. Use a notched/home-indicator iPhone with current Safari and a real mid-range Android with current Chrome; include a large phone for reach. These steps require synthetic or separately designated test-account data.

1. Walk the principal journey with one thumb, two thumbs and a cradled grip. Record regrips/mis-taps. Distinguish device checkpoint from account confirmation.
2. Repeat portrait/landscape with expanded/collapsed browser chrome and both Safari toolbar positions. Inspect the notch, home indicator, final action, Timing filters and deletion dialog. Rotate mid-form.
3. Open/close the virtual keyboard on each edited field. Check focus zoom, autofill/password managers, birthday/nickname, Next/Done, multiline Return, signed coordinates and visible Save. Zoom intentionally to 200% separately.
4. Wait for checkpoint confirmation, then navigate/Back/Forward, reload and background-discard/reopen. Cross midnight. Interrupt requests before and after commit; Check save must find exactly one creation and preserve later text. Test before-checkpoint termination separately.
5. In an already loaded page, go offline, edit and reconnect. Exercise private browsing, blocked/quota storage, another signed-in tab, sign-out and account switching. Do not assume offline reload can load an application shell. Confirm consent revocation strips only its optional fields.
6. Use VoiceOver and TalkBack through the complete reading/form/recovery flow. Check selected accuracy, errors/status, focus order/return, external-keyboard focus, deletion Back/edge-swipe/pending failure and membership Keep. Pull-to-refresh must retain a committed checkpoint. Ordinary tap controls remain available.
7. Test OS/browser text enlargement and 200% zoom separately, reduced motion, retained chapter content, long URLs and short landscape. No hidden control, overlap or horizontal page scrolling at the target reflow width.
8. Measure a production build on the Android phone with a recorded slow/variable network profile and representative saved reading/chart/journal data. Capture at least five cold loads and five warm journeys, individual samples and median/range. Collect LCP/CLS plus representative tap/input traces and INP where supported; do not call a small lab sample field p75. Measure before/after any demonstrated bottleneck fix. Report unsupported Safari metrics as **not measured**; inspect Safari scrolling, keyboard and responsiveness separately.

**Deep-dive modules 2–7 worth running next:** No separate module catalog was supplied, so the numbers map to the requested audit areas. Prioritize **4 — forms/keyboard** and **2 — viewport/safe areas** to qualify P0 recovery and real OS chrome; then **6 — overlays/navigation/dense data** and **5 — gestures/scrolling** for the new confirmation/history and refresh paths; finish **3 — touch targets** for the 48 px mixed-grip opportunity and **7 — content priority** to check that real recovery/conflict notices preserve the short Today journey. These are bounded verification modules, not a product redesign.

## 7. Open questions / remaining inputs

- Which physical iPhone and mid-range Android devices, OS/browser versions and designated test build/account will be used for the remaining gates?
- Which production performance trace or field-measurement source is available? Current LCP/INP/CLS are **not measured**.
- If “modules 2–7” refers to a different external catalog, provide its names; the mapping above uses the supplied checklist.
- PWA installation remains unspecified. It is not required for these fixes; confirm it only if installation becomes a separate requirement.
