# Remaining device checks

**Status: all ten entries are not run.** The local fixtures have stopped. B-FIX-PHONE is an unprovisioned future non-production build; there is no phone-reachable URL or confirmed test backend yet. This handoff is complete as a plan and is not ready for execution until those prerequisites exist. No commit, push or deployment was performed or authorized.

Use the exact fixed source below. Build confirmation and setup confirmation are independent. Local Playwright substitutions do not carry into a phone build. Stop writes if isolated test-account/backend routing is unconfirmed; leave dependent portions unrun. Use synthetic test data and return partial results as partial.

- Base commit: `c4c38208f5304cbf76e06606f24e82a50fae60e3`.
- BirthDetailsForm SHA-256: `cab0ae46b74f280489009b69faaa7bec507cdfc0d157a43d0b17641ad74606de`.
- Patch SHA-256: `ee96f1f99bb7b16f3a8bf0e4155d23d593a73c6bc770394e649fa96d2a0112d0`.
- Source manifest: [source-identity.json](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/source-identity.json); patch: [changes.patch](/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-fixes-20261021/changes.patch).
- Build substitutions: **unknown** until independently inspected; app bootstrap, member APIs, authentication, model and billing wiring must be recorded.
- Setup substitutions: **unknown** until independently inspected; test account/data, keyboard/locale and any failure controls must be recorded separately.
- Record actual model, OS/browser versions, CSS viewport, orientation, tab layout/display mode, keyboard/locale and enlargement. Unavailable target widths/configurations remain unrun. A resized desktop is not a phone result.

Budget: 10 entries. C-FIX-D01 through C-FIX-D04 are the complete independent F-06 regression plan across Safari Compact/Bottom/Top tabs (where exposed) and Android Chrome. They use 4 of the 5 reserved applied-device-fix slots. These regression links do not change the original static signed-source-policy scope and do not automatically refute or verify that finding. F-04/F-05 color checks share the entries and receive no reserved priority.

When returning results, keep every requested state separate: portrait/short landscape, narrow available supported width (record actual CSS pixels), keyboard open/closed, chrome expanded/collapsed, normal/200% enlargement, route, field and sign. Confirm canonical saved test data before claiming persistence. A pass in one state does not imply the others passed.

| Check | Device/browser configuration | Purpose |
| --- | --- | --- |
| C-FIX-D01 | iPhone, Safari, Compact tabs | Primary journey, keyboard, insets and manual signed coordinates |
| C-FIX-D02 | iPhone, Safari, Bottom tabs | Bottom-tab chrome/keyboard and manual signed coordinates |
| C-FIX-D03 | iPhone, Safari, Top tabs | Top-tab chrome/keyboard and manual signed coordinates |
| C-FIX-D04 | Android phone, Chrome, regular tab / gesture navigation | Primary journey, real Android Back and signed coordinates |
| C-FIX-D05 | iPhone, Safari, Compact tabs / VoiceOver | VoiceOver principal journey and form feedback |
| C-FIX-D06 | Android phone, Chrome, regular tab / TalkBack | TalkBack principal journey and form feedback |
| C-FIX-D07 | iPhone, Safari, Compact tabs / recovery | Safari background/discard and uncertain-save recovery |
| C-FIX-D08 | Android phone, Chrome, regular tab / recovery | Android background/discard and uncertain-save recovery |
| C-FIX-D09 | iPhone, Safari, Compact tabs / measured performance | Real iPhone performance with Safari Web Inspector |
| C-FIX-D10 | Android phone, Chrome, regular tab / measured performance | Real Android performance with Chrome remote debugging |

## C-FIX-D01 — iPhone / Safari / Compact tabs

Replaces the earlier unrun `C-P01` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Compact tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for 91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and 200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Independent regression link: `F-06/DR-F06-D01`; source scope `signed-source-policy`. Qualified result: **not run**. No original-scope target observation is claimed.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D02 — iPhone / Safari / Bottom tabs

Replaces the earlier unrun `C-P02` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Bottom tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for 91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and 200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Independent regression link: `F-06/DR-F06-D02`; source scope `signed-source-policy`. Qualified result: **not run**. No original-scope target observation is claimed.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D03 — iPhone / Safari / Top tabs

Replaces the earlier unrun `C-P03` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Top tabs; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for 91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and 200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Independent regression link: `F-06/DR-F06-D03`; source scope `signed-source-policy`. Qualified result: **not run**. No original-scope target observation is claimed.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D04 — Android phone / Chrome / regular tab / gesture navigation

Replaces the earlier unrun `C-P04` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: regular tab / gesture navigation; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Signed coordinates, leading signs, decimals and IANA timezone text remain enterable and preserve existing validation/save/draft behavior. Full text keyboard remains usable across the stated browser UI/keyboard/orientation/enlargement states. Corrected selected help and empty boundaries remain distinguishable, with visible focus and no page overflow. Confirm the actual canonical test record before claiming a save.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. At the narrowest supported phone width available, record actual CSS width; read Today, select Mood 4 and Energy 3 using visible labels, enter a Unicode/multiline reflection, and verify each selected value. Repeat the selection in three fresh states; report each trial.
3. Open/close the software keyboard, expand/collapse browser chrome, rotate portrait to short landscape, then repeat with 200% text/page enlargement. Check focus visibility, note/submit reachability, safe-area clearance and pinch zoom; report each state independently.
4. Scroll a short note and an overflowing note at both ends; navigate Today → Journal → Today and compare draft values. Save only against the confirmed test backend; verify the canonical record returned after navigation.
5. On both /birth and /onboarding, open Enter coordinates manually. With the default software keyboard, type ASCII -33.8688 / -151.2093, +90 / +180, -90 / -180, 0 / -0 and leading-zero decimals; paste signed decimals too. Record keyboard/locale and access to minus, plus and decimal point. Verify range errors for 91/181 and correct them. Check IANA timezone slashes, date/time, next/done keys, and draft recovery after reload. Save once only against the confirmed test backend and inspect returned canonical coordinates. Repeat portrait/short landscape, keyboard open/closed, expanded/collapsed chrome, narrowest supported available width (record actual CSS width) and 200% enlargement; report each portion.
6. Open and close the menu, test Back/Forward separately from native edge gestures, and open/collapse/reopen a Pattern chapter. Record reach/regrips/missed taps for one-thumb, two-thumb and cradled grips.
7. With the menu open press Android system Back; verify it dismisses the overlay without an extra page traversal. Distinguish this from desktop history navigation. Expand/collapse Chrome bottom chin and inspect gesture-bar clearance.
8. For F-04/F-05, inspect all four selected accuracy helpers and empty/unfocused, focused and invalid birth inputs in both supported theme states if the build exposes them. Text and boundaries must stay legible, focus visible and radio labels operable. Capture screenshots; do not infer quantitative contrast from visual inspection alone.

Independent regression link: `F-06/DR-F06-D04`; source scope `signed-source-policy`. Qualified result: **not run**. No original-scope target observation is claimed.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D05 — iPhone / Safari / Compact tabs / VoiceOver

Replaces the earlier unrun `C-P05` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Compact tabs / VoiceOver; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn VoiceOver on. Read the headline and content in order, use Today section links and check-in radios; report names, group/value announcements and focus after selection.
3. Type a test reflection, submit once to the confirmed backend and inspect pending/error/confirmed announcements. Navigate to Journal and back, open/close the navigation disclosure, inspect chapter collapse/inert content and field/helper descriptions.
4. Record rotor destinations, reading order, focus destination/return, keyboard focus visibility, and any silent errors. Do not infer TalkBack behavior.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D06 — Android phone / Chrome / regular tab / TalkBack

Replaces the earlier unrun `C-P06` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: regular tab / TalkBack; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Turn TalkBack on. Read Today in order, use section shortcuts and each radio group; record names, values and selected state.
3. Enter and save one test note only after test-backend confirmation; record pending/error/confirmed announcements and navigation to Journal and back.
4. Test the menu with Android Back, chapter collapse, error/helper descriptions, and focus restoration. Record failures separately; do not infer VoiceOver behavior.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D07 — iPhone / Safari / Compact tabs / recovery

Replaces the earlier unrun `C-P07` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Compact tabs / recovery; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type a unique test reflection and a separate Journal draft. Wait for the device-draft confirmation; background the tab, trigger a genuine tab discard/reload if available, then return and compare every field. State explicitly if you only reloaded.
3. With a confirmed test backend supporting a controlled lost-ack scenario, save once while the backend applies the mutation but the acknowledgement is withheld. If this setup is unavailable, leave this portion not run.
4. Use Check save/reconciliation and compare canonical saved test records; ensure no duplicate entry and preserve any newer typing. Restore connectivity and inspect draft state; report each portion independently.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D08 — Android phone / Chrome / regular tab / recovery

Replaces the earlier unrun `C-P08` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: regular tab / recovery; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Type unique test Today and Journal drafts. Wait for local-draft status, background and genuinely discard the tab if available, reopen and compare fields; distinguish reload from discard.
3. Use the isolated backend controlled lost-ack setup to apply one mutation then withhold its response; if not provisioned, leave this portion not run.
4. Run Check save and compare canonical test records and duplicate counts. Confirm newer text remains; restore connectivity and record each result separately.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D09 — iPhone / Safari / Compact tabs / measured performance

Replaces the earlier unrun `C-P09` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: Compact tabs / measured performance; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Safari Web Inspector to this actual device; record hardware, OS/browser, connection, cache and CPU conditions. Use a production-mode test build with this exact source and record all service/build differences.
3. Record comparable navigation and principal interactions with Web Inspector timelines. Report available LCP, layout-shift and interaction/long-task measurements with traces and tool support limits; write not measured for unsupported metrics.
4. Record loading, tap feedback, keyboard and navigation delays on the actual device. Do not label a single lab trace field performance or call an arbitrary tap duration INP.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## C-FIX-D10 — Android phone / Chrome / regular tab / measured performance

Replaces the earlier unrun `C-P10` for the new fixed build; historical checks remain unchanged.

Build: **B-FIX-PHONE**, exact identity above. Actual phone URL, build wiring and safe backend are unavailable.

Setup: Provision a phone-reachable non-production build from base c4c38208f5304cbf76e06606f24e82a50fae60e3 plus the exact final F-04/F-05/F-06 patch and SHA-256 source manifest. Confirm test-only API/account routing and record actual build/setup substitutions before any write; otherwise stop at read-only checks. Record device, OS/browser version, actual CSS viewport width, display mode, keyboard and locale. Local Playwright aliases and Stripe interception do not automatically exist here.

Planned state: regular tab / measured performance; narrowest supported available CSS width and 200% enlargement where primary journey specifies. Timing: Record actual connection, load state and timing for each requested portion.

Expected: Each stated action remains visible, operable and truthfully reported, drafts retain entered values, no duplicate is created after reconciliation, and accepted signed coordinates can be entered. For measurement entries, return actual traces and qualified metrics, not an assumed pass. Record each requested state separately; contrast findings remain open until target evidence qualifies the fixed build.

1. Confirm fixed-source identity (base plus final patch/manifest) and test backend separately. Use a fresh isolated test account/state; do not continue a write while backend routing is unconfirmed.
2. Connect Chrome remote debugging to the actual phone; record hardware, OS/browser, network, cache and throttle conditions. Use a production-mode test build with this exact source, documenting service/build differences.
3. Collect a Performance panel navigation and scripted/manual principal-interaction trace. Report measured lab LCP/CLS and event/INP diagnostics where available; attach trace and collection conditions.
4. Record representative mid-range hardware behavior, loading/tap feedback and long tasks. Separate these lab observations from field percentiles and do not infer Safari behavior.

Result by requested portion: ___

Actual device / OS / browser / keyboard / locale / CSS width: ___

Build as tested (URL, manifest/source match, substitutions, confirm or describe difference): ___

Setup as tested (isolated backend, account/data, failure controls, substitutions; confirm independently): ___

Notes and unavailable portions: ___

Screenshots / recording / trace paths: ___


## Not selected in this ten-entry budget

- Safari external-pointer reproduction of historical F-02 under all original timing conditions
- Complete populated placements/aspects comparison with screen reader
- Saved-data autofill/password-manager and IME combinations beyond the primary device entries
- Independent installed/PWA-mode audit if that display mode becomes supported

Field performance needs a production origin, collection window and RUM/CrUX access. It is a missing-data prerequisite, not another pretend completed device check. Safari Web Inspector and Android Chrome remote-debugging traces above are device lab evidence only.
