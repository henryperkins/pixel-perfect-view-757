Ceiling: **proxy** — Chromium 149.0.7827.55 and Playwright WebKit 26.6 on Linux; no iOS Safari, Android Chrome, OS simulator or physical-device execution. Assessment completed for the bounded Today/check-in scope; target verification remains incomplete.

# Pattern Mobile Web UX Runner application pilot

## 1. Verdict

The installed runner performed a real-application, audit-only pilot at source revision `8e0e5c933ab8bad2b3e186e70501ef8e31d82570`. It successfully integrated the existing Impeccable workflow, rendered Pattern's real routes/components, recorded schema-2 evidence, and preserved both findings and contradictory observations. Three P2 defects remain open. No P0/P1 was established in the tested scope. No source fix, upgrade, commit, push or deployment was performed.

The main uncertainties are real phone behavior and the real service boundary. A successful synthetic save establishes the client's handling of the fixture response, not server persistence or encryption. The WebKit mouse miss is the principal unresolved activation issue; its physical Safari relevance is unestablished.

Installed tooling identity and invocation evidence are in [provenance.json](provenance.json). The runner is plugin 2.0.0, contract `2026-10-20-r2`, schema 2. Pattern's Impeccable skill declares 4.2.0; the executing engine reports 3.6.0. Context loading and detector execution succeeded without upgrades. The runner's bundled 49 decision scenarios and helper suite were not rerun by this application pilot.

## 2. Coverage

The principal journey was: open Today → read the synthetic reading → follow Check-in → choose bands and enter a note → save → revisit/reload → recover interruptions or an unconfirmed result. A short Journal route transition and shared menu history were included. Onboarding, natal chapters, billing, content admin, live providers, editorial qualification and whole-app coverage were excluded.

Standing substitutions, recorded once by build/setup scope:

- **B-PILOT, all recorded browser checks:** current real routes, components and styles run through the repository's client-rendered test root. Six module aliases replace auth/member/account/billing/assistant/server-function boundaries with the inspected synthetic service module. Fixture persistence uses memory/sessionStorage. Real encrypted IndexedDB drafts still run. The bootstrap, SSR and real backend are outside this evidence.
- **B-PILOT / SS-STRIPE, recorded browser contexts:** unrelated external Stripe domains are aborted. Initial exploratory contexts had allowed those resources and produced Stripe console noise; that is retained separately. No checkout action or provider request was tested.
- **Per-case additions:** rejected/lost-response service results, 450ms delay, or a confirmed IndexedDB SecurityError are disclosed on their check IDs. Actual context-offline state is recorded as scenario state, not described as a fault-response stub.
- **B-PHONE, planned human entries:** no phone build/backend is provisioned. Build/setup wiring is **unknown** until confirmed; local-only harness replacements do not silently transfer to a phone.

| Master area | Disposition in checked scope | Environment / highest level | Remaining target work |
| --- | --- | --- | --- |
| Reach and placement | Defects found: F-02 proxy activation | Desktop emulation / proxy | C-D01–C-D04: real grips, missed taps and toolbar collisions |
| Viewport and safe areas | No defect found in layout samples | Desktop emulation / proxy | C-D01–C-D04: real chrome/insets/orientation; no device pass inferred |
| Touch targets | Defects found: F-02 activation; sampled geometry passes | Desktop emulation / proxy | Physical input methods; distinguish mouse failure from finger taps |
| Forms and keyboard | Defects found: F-01 | Source/computed styles / mechanism; interaction proxies | C-D01–C-D04: software keyboard, focus zoom, IME |
| Gestures and scrolling | Defects found: F-02 mouse scroll reset; note scroll mechanisms pass | Desktop emulation / proxy; CSS mechanism | C-D01–C-D04: edge gestures, rubber-banding, pull-to-refresh, pinch |
| Overlays/navigation/dense data | Defects found: F-03; menu history passes | Desktop emulation / proxy | Actual Android Back; AT route context. No dense table in scoped journey. |
| Content priority | No defect found in sampled structure | Desktop emulation / proxy | VoiceOver/TalkBack order; no live writing assessment |
| Performance | No defect found in limited source inventory | Source review / mechanism | C-D09/C-D10: optimized-build device traces; no lab/field Web Vitals measured |
| Errors and recovery | No defect found in executed synthetic cases | Automated tests / mechanism; emulation / proxy | Real backend outcome-unknown handling and real browser interruption |
| Accessibility on mobile | Defects found: F-01, F-03 | Source/computed styles and emulation / proxy | C-D05/C-D06: real screen-reader journeys and phone text settings |

All seven modules were reviewed for applicability; these orchestration records are distinct from the ten master coverage rows. Performance review was limited to code mechanisms, and unexecuted phone states remain explicit.

Completed evidence:

- **37/37** focused application tests passed: check-in validation, member draft/controller behavior and Today evidence. This is separate from the runner's bundled validation record.
- **18 layout/text samples:** nine configurations per engine, covering 320/360/390/430px phones, short landscape, tablet/desktop and 32px root-font stress. No document horizontal overflow. At 320px with normal text, radio label hit areas were 46×48px. At 320px/32px root font, the smallest width was 28.390625px with 48px height. This meets the sampled 24px AA floor; 44px ergonomic guidance is a different rule. See [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- **Four axe scans:** light/dark in each engine, zero reported violations. The detector also returned `[]`. Neither result negates manual boundary-contrast evidence or establishes conformance.
- **Seven recovery scenarios passed in each engine:** rejected save with explicit status check/retry; committed fixture write with lost acknowledgement; later edits during saving; ordinary reload with explicit draft resume; offline checkpoint with later unsaved edits; failed reading refresh/retry; and 2000-character note/short-note scroll ownership.
- **Confirmed storage fault passed separately in both engines:** the IDBFactory prototype replacement counted one actual invocation and produced the truthful tab-only fallback. The original WebKit instance-level replacement was not established to be active; its failed expectation remains an inconclusive harness check.
- **Recorded activation trials:** Chromium mouse/touch/keyboard 3/3 each; WebKit mouse 2/3, touch 3/3, keyboard 3/3. These are separate bounded observations. They do not form an all-green run and do not refute an intermittent failure.
- Menu Escape restored trigger focus; desktop history Back closed the menu and Forward reopened it. Those are proxy history checks, not actual Android Back. Route return retained the unsaved reflection.

The note field accepts optional Unicode prose up to 2000 characters. Its markup is textarea / `inputmode=text` / `autocomplete=off` / `enterkeyhint=enter` / `autocapitalize=sentences` / `spellcheck=true`. It is labeled and linked to limit/privacy/status text. The font measured 16px at phone width. WebKit did not expose the enterKeyHint JavaScript property; its real keyboard label was not tested.

## 3. Findings by severity

### F-01 — P2 / Observed / Open: reflection input boundary contrast

Location: `src/styles.css:89`, `src/styles.css:127`, `src/components/pattern/TodayCheckIn.tsx:455`, at the stated revision. Reproduction: load a synthetic member's Today page, find the enabled Reflection note, leave it unfocused, and measure the field against the surrounding form in light and dark themes.

Expected: a sufficient outline or contrasting field fill identifies the editable region. Actual border-to-outer contrast was **1.29:1 light** and **1.88:1 dark**; fill-to-outer contrast was only **1.08:1 / 1.05:1**. The field is author-styled and enabled, so native/inactive exceptions do not apply. Its label and focus indication provide a workaround, which is why the runner impact classification is P2.

This is a [WCAG 1.4.11 non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) issue for identifying the text-entry area. It is not a claim that every low-contrast decorative border fails that criterion. Text contrast itself measured well above its minimum. Both engines agreed on the computed colors and ratios.

Cause: the shared `--input` token and near-background field fill. Minimal proposed fix: strengthen the semantic field boundary/fill in both themes and recheck shared consumers before choosing a global token change. Keep existing dimensions and focus styling. No edit was applied. Evidence: C-CH-CONTRAST / C-WK-CONTRAST, [Chromium measurements](chromium-baseline.json), [WebKit measurements](webkit-baseline.json). These failures remain in the ledger despite the clean detector/axe results.

### F-02 — P2 / Observed / Open / Intermittent: WebKit mouse selection miss

Affected observed scope: **desktop Playwright WebKit 26.6, 390×844**, fresh fixture, mouse input. Reproduction: use the Today Check-in anchor, click Mood 4, then Energy 3. The original journey submitted Mood 4 and Energy null. In the recorded follow-up, one of three mouse trials missed Energy.

The failing trace shows pointer-down on Energy 3 at `scrollY=801`, then pointer-up over reading prose at `scrollY=0`; no Energy change event followed. Expected: both selected bands remain selected and enter the single submitted payload. Actual: the scroll reset retargeted the activation.

The trace identifies the immediate mechanism; it does not isolate the initiating cause among app focus work, router restoration, browser behavior or the harness interaction. `Shell.tsx:95` is a focus/scroll investigative lead, not a proven source cause. WebKit synthetic touch and keyboard passed 3/3 each, and Chromium passed all three methods 3/3. These observations remain beside the failure. They neither close an intermittent mouse finding nor prove a physical Safari touch bug.

Minimal proposed action: obtain corresponding Safari touch/pointer traces before choosing a change. If the app's specific focus/restore path causes the jump, constrain that identified action while preserving native scrolling and intended focus. No blanket blur, history or touch-action change is justified. This is a **proposed device-dependent investigation/fix**, with no edit applied. C-D01 includes related phone probes; a separate pointer configuration remains beyond budget if it cannot be covered there. Evidence: C-WK-JOURNEY, C-WK-MOUSE, [original payload](webkit-baseline.json), [recorded event traces](webkit-followup.json).

### F-03 — P2 / Observed / Open: route navigation loses focus context

Affected observed scope: Chromium and WebKit desktop proxies at 390×844, reduced motion. Reproduction: enter a note on Today, activate Quick navigation → Journal, wait for the completed Journal route and two animation frames, then press Tab once.

Expected: deliberate destination focus supports continuing in the new content. Actual: both engines leave `activeElement` on BODY; the next Tab reaches Skip to content and restarts at document chrome. Back to Today retains the note, so this finding is about navigation context rather than lost data. No independent WCAG failure is asserted from this observation alone.

The existing keyed `main` in `Shell.tsx:478` can receive programmatic focus but does not receive it after this route transition. Minimal proposed fix: focus destination heading/main after new-route completion, while preserving intentional focus, same-page anchors, refresh behavior and Back/Forward restoration. No edit was applied. Evidence: C-CH-FOCUS / C-WK-FOCUS, [Chromium navigation](chromium-navigation.json), [WebKit navigation](webkit-navigation.json). VoiceOver/TalkBack impact needs C-D05/C-D06.

## 4. Recommendations

The most valuable next validation is the real-phone handoff against a verified isolated backend. Production/server persistence, encryption, provider selection and authenticated routing cannot be qualified by the current fixture. Real-phone optimized-build measurements should precede any performance claim; missing measurements are not themselves a demonstrated performance defect.

The installed Impeccable diagnostic is [15/20 within this scoped audit](impeccable-audit.md); its score is an informational rubric, not a readiness verdict. The existing design system and dependencies were sufficient to execute the pilot. No plugin update is indicated as a prerequisite by this run. Tooling follow-up should use the saved application evidence instead of rerunning the bundled validation as a substitute for application/device checks.

## 5. Changes made

**Application source: none. Plugin/dependency changes: none.** Only sanitized audit evidence, an isolated fixture launcher and browser probe/report files were created beneath this ignored output directory, plus Playwright's ignored runtime artifacts.

The launcher addition explicitly declares the fixture's normal-import entry and a fresh cache after preserving initial Vite dependency 504s. A first menu-history probe used an obsolete accessible label after the menu correctly reopened; the corrected probe uses the stable `aria-controls` relationship. Those are harness changes, separate from build/service substitutions and application findings.

No private member records or credentials were used. No paid model request, production submission, commit, push or deployment was made. [preservation.json](preservation.json) records all **1,985** baseline file hashes unchanged, identical Git status including pre-existing dirty/untracked work, and unchanged tooling hashes. [cleanup.json](cleanup.json) records owned-resource cleanup.

## 6. Device check script

The human script has **10 entries / budget 10**, with zero applied device-dependent fixes and therefore no reserved entries consumed. All entries remain **not run**. Each configuration has a separately reportable result; Compact/Bottom/Top Safari checks and AT configurations are distinct entries.

Use [device-script.md](device-script.md) for complete actionable steps and result/build/setup fields. Its entries are:

| ID | Configuration | Task |
| --- | --- | --- |
| C-D01 | iPhone Safari / Compact tabs | Principal journey, repeated selection, real keyboard/chrome, narrow/large text, grips, gestures and route return |
| C-D02 | iPhone Safari / Bottom tabs | Long note, keyboard, toolbar states, portrait/landscape, text/insets |
| C-D03 | iPhone Safari / Top tabs | Separate tab-layout and keyboard/viewport result |
| C-D04 | Android Chrome / gesture navigation | Real keyboard/chrome, system Back, selection/save, gestures |
| C-D05 | iPhone Safari / VoiceOver | Reading, optional bands/note, announcements, route context |
| C-D06 | Android Chrome / TalkBack | Same principal journey with actual AT |
| C-D07 | iPhone Safari / interruption | Background/force-close/reopen and explicit draft resume |
| C-D08 | Android Chrome / interruption | Browser interruption and preserved draft/save |
| C-D09 | Android Chrome / remote DevTools | Optimized-build navigation/interaction trace |
| C-D10 | iPhone Safari / Web Inspector | Optimized-build supported timing/shift evidence |

Beyond-budget titles: exact 320-CSS-pixel physical configuration if unavailable on scheduled devices; separately configured Safari external-pointer reproduction if C-D01 cannot cover it. No physical capability or compatible hardware is invented.

## 7. Open questions and continuation limits

- A phone-accessible, source-matched non-production build and inspected test-only backend are needed before any device submission. The loopback fixture used here has been stopped; it is not a shared preview.
- Actual tester devices, OS/browser versions, Safari tab settings, input methods and AT settings are not supplied. Record them independently with each result.
- Return each C-D result with build and setup confirmed separately and the specific states exercised. A portrait pass is not a landscape pass. Unknown wiring remains unknown; local fixture stubs are not inherited on the phone.
- Real backend persistence/encryption and outcome-unknown HTTP handling require an isolated service integration test; no physical layout observation or synthetic success can qualify a replaced boundary.
- A source fix is a separate authorized stage. The audit is complete in its recorded source/proxy scope; its open defects and ten target checks make verification incomplete.

The helper's [summary.json](summary.json) should say `assessment_complete: true`, `verification_ceiling: proxy`, `verification: failed`, and `claimable_complete: false`. The failed verification is intentional and retains measured defects; it is not a malformed ledger or a claim that the audit did not run. [run.json](run.json) is the schema-2 record; [report.md](report.md) is the generated full ledger report. The helper validates consistency, not authenticity or omitted-scenario coverage.
