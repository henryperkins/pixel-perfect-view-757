# Pattern pilot device checks

All ten entries are NOT RUN. Budget: 10. No applied device-dependent fixes. Build B-PHONE is a planned source-matched non-production build of 8e0e5c933ab8bad2b3e186e70501ef8e31d82570; no phone-accessible build/backend was provisioned by this audit.

Confirm build and setup independently before submitting test data. Standing local Vite aliases and Stripe interception are not assumed to exist on the phone. Unknown build/setup wiring prevents any real-service verification claim.

## C-D01 [F-01, F-02, F-03] iPhone / Safari / Compact tabs

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Use a non-production build/account; record model, OS, Safari version, Compact tab setting, source identity, actual CSS width and backend/test substitutions. Do not continue a write if routing to the test backend is unconfirmed.
2. At the narrowest supported phone configuration available, record actual CSS width; separately use 200% text/page enlargement. Read Today, choose Mood 4 and Energy 3 with a finger, enter a Unicode reflection, and verify each selected value before saving once.
3. Repeat the selection sequence three times in independent fresh test states and record each result. If a pointer is supported, record its trials separately from finger taps. A touch pass does not refute F-02 desktop mouse behavior.
4. With the keyboard open and closed, expand/collapse Safari chrome; rotate to landscape; verify note and save remain reachable, pinch zoom works, and the home/notch regions do not cover controls.
5. Use one thumb, two thumbs and a cradled grip; record missed taps/regrips. For a long note, scroll inside it and at each end; for a short note, scroll the document. Return to Today after opening Journal and record focus and draft state.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D02 [journey coverage] iPhone / Safari / Bottom tabs

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm the same test-only source/build/backend; record actual device/OS/version/width and Bottom tab setting independently.
2. Enter a near-2000-character optional reflection; test first/last field and Save with keyboard open/closed, toolbar expanded/collapsed, portrait and short landscape.
3. Repeat with enlarged text and the narrowest supported configuration available, recording actual CSS width. Verify visible focus, note scrolling, pinch zoom, and notch/home-indicator clearance. Record each state separately.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D03 [journey coverage] iPhone / Safari / Top tabs

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm the test-only build/backend and record device/OS/version/width with Top tabs selected.
2. Repeat note focus, keyboard open/close, toolbar expansion/collapse, long-note scrolling, portrait/landscape, and 200% text enlargement.
3. Verify note, save and navigation remain reachable and focus is visible. Record a result per state rather than treating portrait as a landscape pass.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D04 [journey coverage] Android phone / Chrome / regular tabs / gesture navigation

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm the non-production source/build/backend; record phone, Android and Chrome versions, CSS width, keyboard and gesture-navigation mode.
2. Read Today; select both bands; type a Unicode note. Check keyboard/submit visibility in portrait and landscape with chrome expanded/collapsed and enlarged text; record grip/missed-tap observations.
3. Open the menu and press Android system Back, then use Forward if exposed; distinguish overlay dismissal from leaving Today. Verify focus and draft state. Test the long note at its scroll boundaries and pinch zoom starting on the note.
4. Save only against the confirmed test backend, reopen Today, and compare both bands and note with the server-returned test record.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D05 [F-03] iPhone / Safari + VoiceOver / Compact tabs / VoiceOver enabled

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm test build/backend and record device/OS/Safari/VoiceOver settings and actual CSS width.
2. Read the headline and prose, navigate to Check-in, hear Mood/Energy names/options/selected states, enter a note, and save against the test backend.
3. Confirm pending/saved or error announcements are understandable and not duplicated; use Sources, open/close menu, navigate Journal and return. Record destination focus/order, including F-03.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D06 [F-03] Android phone / Chrome + TalkBack / regular tabs / TalkBack enabled

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm test build/backend and record phone/OS/Chrome/TalkBack settings and actual CSS width.
2. Read Today and reach Check-in; hear optional field names, band descriptions and selection states; type and save a test note.
3. Inspect pending/saved/error announcements, Sources disclosure, menu dismissal, Android Back and route focus/order. Record failures separately from visual layout.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D07 [journey coverage] iPhone / Safari / Compact tabs / browser interruption

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm test build/backend. Enter a distinctive unsaved note and wait until the UI reports the device draft is stored.
2. Background Safari, force-close the browser through the app switcher, reopen the same test URL and account, then inspect and resume the draft. Record the actual interruption; do not call an ordinary reload an OS tab discard.
3. Compare the full note and bands, save once against the test backend, and revisit Today. Confirm the recovered draft did not silently submit or overwrite a later saved version.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D08 [journey coverage] Android phone / Chrome / regular tabs / browser interruption

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm test build/backend; enter a distinctive unsaved note and wait for the stored-device-draft message.
2. Background and force-close Chrome through the app switcher; reopen the test URL/account and resume the draft. If an actual system tab discard is observed, record that event independently.
3. Compare all text/bands, save once to the test backend and revisit. Record any recovery candidate, conflict or unavailable-storage message accurately.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D09 [journey coverage] Android phone / Chrome / regular tabs / remote DevTools

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Use an optimized non-production build with confirmed test-only API routing; record build, phone, Android/Chrome, actual network conditions and throttling. Do not measure the local Vite development fixture as production performance.
2. Connect Chrome remote DevTools Performance panel; record a navigation and the full read/select/type/save interaction. Export the trace with synthetic data only.
3. Report measured LCP, CLS, long tasks, interaction timings and request timing with units/tool versions. Distinguish lab measurements from field percentiles; do not label TBT or a navigation-only trace as INP.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## C-D10 [journey coverage] iPhone / Safari / Compact tabs / Safari Web Inspector

**Build:** B-PHONE, unmodified source identity above; confirm the actual source, optimized/development mode and URL.
**Substitutions:** build: unknown until inspected; setup: unknown until test account/backend routing and device settings are confirmed; additions: record actual overrides. No local harness substitution is inherited.

**Setup:** Test-only build and synthetic account. Confirm source/build and setup separately; stop before writing if test routing is not established.

**Steps:**

1. Confirm optimized test-only build/backend; record iPhone, iOS/Safari, network conditions, CSS width, and Inspector version.
2. Connect Safari Web Inspector Timelines; record reading navigation and selection/type/save interactions using synthetic data.
3. Export the trace and report supported measured timings and layout shifts with the tool limitations. Record visible stalls and data preservation; no all-browser field-performance claim follows.

**Expected:** Complete each stated step using test data; controls remain visible/operable, choices and notes persist truthfully, recovery/status and focus are usable. Report each actual state and any failure; for performance return measured traces without assumed values.

- Result per requested state: ___
- Actual phone / OS / browser version / input or AT settings: ___
- CSS width / orientation / text scale: ___
- Build as tested, confirm or note difference: ___
- Setup as tested, confirm or note difference: ___
- Actual replacements/fault controls: ___
- Notes / screenshots / trace: ___

## Beyond budget

- Exact 320-CSS-pixel physical-phone configuration if none of the scheduled devices can provide it
- Safari WebKit missed-selection behavior with an external pointer on a separately configured target if C-D01 cannot cover it

A touch pass does not refute an intermittent desktop mouse observation. Report a causal explanation only if the evidence establishes it. Ordinary reload, force-close, and a confirmed OS tab discard are distinct events; record which actually occurred.
