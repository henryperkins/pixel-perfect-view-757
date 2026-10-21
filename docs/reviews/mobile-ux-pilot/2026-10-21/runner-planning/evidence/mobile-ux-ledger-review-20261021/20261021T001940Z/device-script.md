# Remaining physical-device script — all unrun

These entries are plans only. Their planned acquisition level is target; achieved level remains unestablished. Status is not_run, actual results and evidence are empty, and physical-device capability is not available.

B-PHONE-GUARD is a planned, unprovisioned phone build. Build and setup substitutions remain unknown until independently confirmed. It must match the original guard source identity and contain F-01/F-02/F-03. No phone build is created by this review.

C-GD01/C-GD02/C-GD03/C-GD04/C-GD10 are related guard regressions, not direct verification of the preserved Linux desktop-WebKit scope. They have practical priority in the ten-entry script; the original-scope application plan remains unadmitted. No check was removed.

## C-GD01: Read Today and complete the check-in with real keyboard, expanded/collapsed chrome, touch selection and large-text/narrow layouts

Device/browser: iPhone / Safari / Compact tabs. Record actual model, OS and browser versions.

Planning role: related_guard_regression. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.
2. At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.
3. Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.
4. With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.
5. Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.
6. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD02: Check Bottom-tab chrome, keyboard and orientation transitions

Device/browser: iPhone / Safari / Bottom tabs. Record actual model, OS and browser versions.

Planning role: related_guard_regression. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.
2. Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.
3. Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.
4. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD03: Check Top-tab chrome, keyboard and orientation transitions

Device/browser: iPhone / Safari / Top tabs. Record actual model, OS and browser versions.

Planning role: related_guard_regression. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.
2. Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.
3. Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.
4. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD04: Exercise real Android keyboard, gesture bar and Back/Forward

Device/browser: Android phone / Chrome / regular tabs / gesture navigation. Record actual model, OS and browser versions.

Planning role: related_guard_regression. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.
2. Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.
3. Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.
4. Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.
5. Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD10: Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari

Device/browser: iPhone with supported external pointer / Safari / Compact tabs; external mouse/pointer; record exact hardware and input mode. Record actual model, OS and browser versions.

Planning role: related_guard_regression. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.
2. With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.
3. Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state.

Expected: Both intended bands remain selected in every recorded trial, without an extra main-focus scroll reset; actual fields/radio labels still clear fixed chrome and the Unicode note persists only after the confirmed test-backend save. Report every requested state independently.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD05: Complete the reader/check-in journey with VoiceOver

Device/browser: iPhone / Safari + VoiceOver / Compact tabs / VoiceOver enabled. Record actual model, OS and browser versions.

Planning role: broader_audit_follow_up. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.
2. Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.
3. Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD06: Complete the reader/check-in journey with TalkBack

Device/browser: Android phone / Chrome + TalkBack / regular tabs / TalkBack enabled. Record actual model, OS and browser versions.

Planning role: broader_audit_follow_up. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.
2. Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.
3. Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD07: Test real browser interruption and draft recovery

Device/browser: iPhone / Safari / Compact tabs / browser interruption. Record actual model, OS and browser versions.

Planning role: broader_audit_follow_up. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.
2. Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.
3. Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD08: Test Android interruption and draft recovery

Device/browser: Android phone / Chrome / regular tabs / browser interruption. Record actual model, OS and browser versions.

Planning role: broader_audit_follow_up. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.
2. Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.
3. Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## C-GD09: Measure the optimized reading on real Android hardware

Device/browser: Android phone / Chrome / regular tabs / remote DevTools. Record actual model, OS and browser versions.

Planning role: broader_audit_follow_up. Build: B-PHONE-GUARD (unprovisioned).

Setup: Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

1. Confirm a non-production phone build containing F-01, F-02 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.
2. Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.
3. Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP.

Expected: Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

Result per tested state: ___

Build/source identity and build substitutions as tested (confirm independently): ___

Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___

Notes, missing states and discrepancies: ___

Screenshot/trace evidence: ___

## Beyond budget

- Exact 320-CSS-pixel physical-phone configuration if none of the scheduled devices can provide it
- Optimized reading performance trace on real iPhone hardware with Safari Web Inspector
