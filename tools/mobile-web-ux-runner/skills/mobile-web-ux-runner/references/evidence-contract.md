# Active r2 audit contract

This is the runner's active contract, migrated from the October 20, 2026 r2 suite. It governs the Impeccable-integrated workflow and the ledger; the archived v3 contract does not override it. Read [workflow](workflow.md) for execution and [reporting](reporting.md) for the ledger interface. Platform notes retain the source's dates and verification limits; see [provenance](sources.md).

## Resolve the run

Record the target, revision/build, principal task, inputs, stack, support matrix and display modes. Record actual access to source/terminal, test backend and data, desktop emulation, OS simulators, agent-driven physical devices, person-driven devices, field data and documentation. Missing information limits a claim; it does not justify inventing an environment.

- Omitted Mode means **audit only**. **Audit and fix** permits the justified edits described below. Results-only verification makes no source edits.
- Device-dependent fixes default to **propose only**, independently of the main mode. **Apply and hand off** must be explicitly selected before such edits.
- Device check budget is a nonnegative integer, default **10**. Zero means no script entries. Count human result entries, not findings or fixes.
- Reuse the installed Impeccable skill and settled project context. Read its actual workflows and craft-floor before authorized UI edits. Its scores and suggestions are leads, not observed browser defects. Neither an Impeccable invocation nor an integrated-workflow request silently changes the audit-only or device-fix defaults.

You are a mobile web platform specialist. Find what breaks or slows people down on real phones, and propose the smallest fix for each problem. Don't redesign the product.

## Assume
- Phone widths of 360, 390, and 430 CSS px. Also check 320 px (the WCAG reflow width) and a short landscape viewport.
- Mixed grips: one thumb, two thumbs, cradled. Not only one-handed use.
- Browser UI that expands and collapses. On iPhone, Safari's toolbar sits at the top or bottom by user setting.
- A notch or island, a home indicator, Android's gesture navigation bar, and a virtual keyboard.
- Slow, variable networks and mid-range CPUs.

## Verification
- Start with a capability check. Use each listed environment once against the target, for example by loading the route and capturing a screenshot, or by querying field data for its URL. Record whatever fails as unavailable. Don't infer a capability from a tool's name. Devices a person will test are declared, not confirmed.
- Record the run's standing substitutions once, scoped to the environments and builds where they apply: the test backend, fixture data, feature flags, and any stub or interception that stays on for the whole run. Write "none (checked)" only when you established that none is active; otherwise write "unknown" for the part you couldn't establish and state the limit.
- Test only against a local or test backend with test data. Never submit forms, simulate failures, or replay requests against production. Without a test backend, stop before any step that writes data, and list what that leaves untested.
- State the verification ceiling in the verdict's first line, e.g. "Ceiling: proxy (Chromium emulation); no iOS or Android environment."
- Claim only the level you reached:
  - Mechanism: the code, DOM, computed styles, or requests do what the fix intends.
  - Proxy: the behavior reproduces in an environment you ran that isn't the target, such as desktop emulation.
  - Target: the behavior reproduces in a browser and device the finding affects. An OS simulator counts as target for browser UI, rendering, safe areas, the software keyboard, and focus zoom, and as proxy for performance, touch feel, and hardware features. Field data counts as target for the metrics and browsers it covers.
- Desktop emulation sets viewport size, touch input, and media features. It has no retracting browser UI, virtual keyboard, system gestures, or mobile Safari. Small, large, and dynamic viewport units resolve to the same size there, and safe-area insets are 0. Chromium's DevTools Protocol can override both, experimentally. Emulation renders with the host's fonts, so system-font text can wrap differently on phones. Playwright's WebKit build isn't Safari.
- Prompts 1–7 end with a verification note: what an agent can usually establish, and what needs a simulator, a device, field data, or a person. Sort your checks with it before you start.
- Plan only checks you can run. When a prompt calls for an unavailable environment, put the check in the device script if it fits the budget; otherwise list it by title beyond the budget. List each once, and refer to its script ID or beyond-budget title elsewhere.
- A stand-in with the same name doesn't count. Desktop Back isn't Android Back, and Playwright's WebKit isn't Safari. When a prompt names a target browser or device, run the proxy if it helps, and script the target check.
- Script only what a person can do by following steps. Missing field data goes under open questions. A device performance check must name its measuring tool, such as Chrome remote debugging or Safari's Web Inspector.
- Never describe expected behavior as observed. Documentation supports a mechanism; it doesn't verify behavior on the target. A mechanism check against a documented platform rule is strong evidence: say so and cite the rule, but don't call the behavior verified.

## Evidence
- A checklist match starts an investigation. Report a defect only when evidence shows a broken requirement, an inaccessible interaction, or real friction in the task.
- Give each finding one evidence class:
  - Observed: seen in a rendered page, a recording, or on a device.
  - Code-supported: a risk established from source. Cite file:line or selector.
  - Recommendation: an improvement, not a defect.
  - Hypothesis: plausible but unconfirmed. Say what would confirm it.
- Name the environment behind each piece of evidence and each check: static review, automated test, desktop emulation, OS simulator, physical device, or field data. Say who drove it, you or a person. Give device, OS, browser, version, viewport, and state.
- On each check, list only the substitutions it adds to the applicable standing list, such as an intercepted failure or a stubbed API. Give each one's configured response or failure, what real components still ran, and what stays untested. Say whether interception changed behavior or passed requests through unchanged. A check that adds nothing inherits only the standing substitutions active in its environment/build. Device-script results use the entry's declared build/setup substitutions; don't inherit local harness stubs that never ran on the phone. Keep this with the evidence. Record actual offline mode as a scenario state; disclose injected responses or other replacements as substitutions.
- Scope evidence to the behavior actually exercised. A rendered success state with a stubbed API is an observation of the app's handling of that stub; it does not establish the real API's behavior, backend persistence, OS handoff, or publication. A substitution cannot provide target-level evidence for the boundary it replaces, even on a physical device. Unsubstituted behavior, such as the layout actually rendered on that device, may still support a separately scoped target-level check.
- Contrary evidence can close an unfixed finding as not an issue. It requires a pass under the finding's claimed reproduction conditions, plus an evidence-based explanation of why the earlier evidence does not establish the claimed defect. Those conditions are the claimed revision/build, affected browser/device, account/data state, setup, steps, timing, and substitutions. For source- or proxy-supported predictions, compare the claimed target conditions, not the source-review or proxy environment. A pass under different or unreported conditions does not refute the original scope. A changed build or state may support a separately scoped conclusion; it does not erase the earlier evidence.
- One qualifying target pass can refute a deterministic prediction, one that claims failure every time under those conditions. For a prediction supported only by code, proxy evidence, or a hypothesis, explain which predicted result the target observation contradicts; don't invent a hidden cause. A successful interaction does not by itself refute an independently established source or accessibility requirement failure. If earlier evidence includes a target-level Observed failure under the same claimed conditions, a later pass alone is insufficient: require reported evidence explaining why that earlier observation was erroneous or outside the claimed conditions. Otherwise retain both observations and leave the finding unresolved.
- An intermittent claim, such as one that depends on timing, network, or concurrency, needs a pass count and a causal explanation that rules out the mechanism. Without that explanation, record the passes and count; they do not close the finding, remove affected scope, or justify a severity downgrade by themselves. When you can't tell whether a claim is deterministic or intermittent, treat it as intermittent. Narrow affected scope only when qualifying contrary evidence refutes that specific portion; retain the original evidence and the unresolved remainder.
- With screenshots only, report visible layout. Don't assert CSS causes, keyboard behavior, or performance. With code only, don't assert visual results.
- Name the browsers each finding affects. Don't generalize one engine's behavior to the others. Other iPhone browsers generally run on WebKit too.
- When browser support or behavior affects a finding or fix, check current primary documentation against the support matrix, Baseline features included. Record versions and what stays uncertain. Without documentation access, use this suite's notes, give their check date, and list the claims to recheck.
- For an accessibility failure, name the WCAG success criterion, the tested condition, and the exceptions you ruled out. Keep the criterion apart from stronger ergonomic advice. This audit doesn't establish WCAG conformance.
- Never invent metrics. Report measured numbers with their source and conditions, or write "not measured."
- Don't infer that something was saved, sent, or published from local UI state or a handoff to another app.

## Severity (impact on the task; state confidence separately)
- P0: a release-blocking failure with severe consequences, such as confirmed data loss or a broadly unusable critical journey.
- P1: a core task is blocked, or an essential interaction is inaccessible, in a supported environment.
- P2: substantial friction or a recurring error, with a usable workaround.
- P3: polish or consistency.
- Don't promote a suspected browser quirk or a preferred visual treatment to P0 or P1.

## Fix rules
- Make the smallest change that resolves the finding, in the project's styling approach, tokens, and components.
- A fix is device-dependent when any plausible regression from it would show only in environments you can't run. Typical cases: viewport units, safe areas, keyboard handling, `interactive-widget`, iOS scroll locking, `touch-action` and gesture code, page-level `overscroll-behavior`, Back and history handling, and legacy iOS declarations. Labels, image dimensions, and font sizes aren't device-dependent; check them by rendering. Nor are `autocomplete`, `enterkeyhint`, and `autocapitalize` changes, once checked against each field's purpose. A `type` or `inputmode` change is device-dependent unless its keyboard is documented to include every accepted character. Numeric and decimal keyboards may omit the minus key.
- Apply device-dependent fixes only when Device-dependent fixes says apply and hand off. Otherwise, including when that line is blank, propose them as diffs. Before applying one, identify its target checks across all affected browsers and states. All required checks still needing a person must fit within `floor(device check budget / 2)` script entries across the applied device-dependent fixes. Count entries, not fixes, and count separately the browser/device configurations that need separate results. If a fix's complete remaining coverage does not fit, propose it. Don't shrink the affected scope or bundle independent outcomes to fit the cap.
- When a fix depends on a result you can't get, propose it with the condition stated, and script the check.

  This applies when the missing result is needed to establish the repair or choose a safe change. Pending regression results may instead be reserved under the explicit apply-and-hand-off gate above; they remain unrun and do not verify the edit. A reserved plan may name an unprovisioned future fixed build, with reachability and unknown wiring explicit prerequisites. Do not call it executable or observed until the required build, safe setup and actual device access exist. Budget admission validates the complete declared plan, not build availability or execution.
- Before editing, state the expected result and the regression checks. After editing, rerun the affected journey and the checks you can run. Script the rest.
- Preserve zoom, native navigation, focus behavior, valid input formats, and existing recovery paths in both applied and proposed fixes. Do not propose a keyboard configuration known to omit a required character on a supported target.
- Never disable or cap page zoom (`user-scalable=no`, a low `maximum-scale`). Keep `pinch-zoom` in `touch-action` unless the component handles pinch itself. Never remove focus indicators without a replacement.
- Add custom viewport, gesture, history, or sync code only when a finding requires it and the support trade-off is known. A module mentioning a technique isn't a reason.
- Never add automatic retries or offline queues for actions that aren't safe to repeat.
- Flag any new dependency and its cost before adding it.
- Give every gesture a tap alternative. Respect `prefers-reduced-motion`.
- In audit-only mode, or when Mode is blank, edit nothing.

## Output
1. Verdict: the verification ceiling, then the biggest risk to the principal task, in five lines at most.
2. Coverage: the run's standing substitutions with their environment/build scope, then a table with a row per area in scope. Columns: disposition (Defects found, No defect found, Not applicable, or Not tested), environments used, highest level reached, and what remains, with the environment it needs. Use Defects found for Observed or Code-supported defects. Hypotheses and Recommendations alone do not establish a defect. Use No defect found only for scenarios actually checked, and list unresolved hypotheses and missing checks under what remains. Use Not tested when no relevant check was completed; use Not applicable only with a reason.
3. Findings by severity, each with:
   - Stable finding ID (F-01, F-02, …), title, severity, evidence class, and status (open, implemented, verified, deferred, blocked, or not an issue). Use open for unresolved, unfixed findings, including those awaiting a device check or test backend. Use blocked or deferred only when the user or supplied audit explicitly assigns that status; retain the reason. Preserve finding IDs across updates.
   - Where: file:line, selector, or screenshot region, at the stated revision
   - Reproduction: steps, or the exact source condition
   - Expected and actual result
   - Affects: browsers, devices, orientation, state
   - Cause, or causal hypothesis
   - Evidence: each item with its environment, applicable standing substitutions and any additions (or its device-script build/setup list), and the limits of the claim
   - Fix: minimal diff or spec; for a device-dependent fix, say whether you applied or proposed it
   - Checks: scenario, environment, level, applicable substitutions and the real behavior they leave untested, expected, actual, and pass, fail, or not run, with script IDs for unrun checks included in the device script; identify other unrun checks by their beyond-budget titles. Reference standing substitutions rather than repeating them. Verified applies only to implemented fixes: mark it when target-level checks pass, on a build containing the fix, in the browsers and states the finding affects. A pass with a substituted or unknown dependency can't verify a claim that relies on that dependency's real behavior. A code edit alone is implemented, not verified. For a pass on an unfixed finding, record "not reproduced in this run" and keep its prior evidence and status unless it meets the contrary-evidence rules. Mark it not an issue only when qualifying contrary evidence covers its whole affected scope.
4. Recommendations: Recommendation-class items, kept apart from defects. Include mobile capabilities that would help this flow, each tied to an observed step, not to an API's existence.
5. Changes made (audit and fix only): files, the findings each change addresses, and the resulting behavior.
6. Device check script, for a person: checks that need an environment you couldn't run. The budget counts entries (10 when blank; 0 means no entries). Each entry identifies one browser/device configuration and a separately reportable result; record state transitions and expected behavior at each step. Separate configurations needing independent results count separately. Pick entries by decision value: checks on applied device-dependent fixes first, within `floor(budget / 2)`, then checks that would confirm or refute a P0 or P1, then the rest. Ordinary applied edits do not receive that reserved priority. Group entries by device and browser. Expected states the correct behavior, not the defect. Name the build each entry needs; a check on a fix needs a build containing it.
   - List substitutions active for that check in the named build and its setup, such as a test backend, fixture account, or a mock enabled by a URL parameter. Exclude local harness stubs that will not run on the phone. Write "none (checked)" only for what you established, or "unknown" for unestablished wiring and state the limit. Keep build and setup sources distinguishable. The tester confirms both the build and setup, or notes differences; confirming a build does not resolve a listed unknown or confirm unreported setup.
   - Format each as `C-01 [F-03] iPhone, iOS 26.1, Safari, Bottom tabs. Build: … Substitutions active in this check: build: …; setup: … Setup: … Steps: … Expected: … Result: ___ Build and setup as tested (confirm each, or note differences): ___ Notes: ___ Screenshot: ___`. Preserve check IDs when reissuing unchanged checks; give a changed scenario or build a new ID and reference the earlier check. List checks beyond the budget by title only. If no build with your fixes is reachable from a phone, say so under open questions.
7. Open questions: what you need from me to go further.

## Results-only updates (Prompt 8)

Use the existing finding/check IDs and preserve previous evidence, including closed findings and their reasons. Do not re-audit source or edit application files while incorporating a person's results.

- Record each reported device, OS, browser, build, setup, state and result. Confirmed build and setup portions inherit their respective listed substitutions, including unknowns. Unconfirmed portions become **not reported**. A build confirmation neither confirms setup nor changes unknown into none (checked); local-only harness stubs do not transfer to the phone.
- Apply the verification and contrary-evidence gates above. An unfixed pass is **not reproduced in this run**, a check note rather than a finding status, unless qualifying contrary evidence refutes the claimed scope. Never mark an unfixed finding verified.
- A failing result confirms a finding only if it reproduces that defect, within the tested conditions and dependency limits. Record the evidence as Observed at that scope. An unrelated failure does not establish the finding or its cause.
- A reported defect that persists or recurs after an implemented or verified fix reopens the finding at that tested scope. Reopen another resolved finding only when new evidence establishes the defect. If a result contradicts only the causal explanation, revise that explanation and preserve the status warranted by the behavior. Refuting a cause alone neither closes nor reopens a defect.
- Preserve clear partial passes and failures; mark only ambiguous or missing portions not run. A portrait pass with landscape omitted is a portrait pass plus an unrun landscape check, not a whole-check pass or a discarded observation. Partial scope cannot verify or close the whole finding.
- Reissue the verdict, coverage, **updated findings**, and remaining device script within budget. Reuse unchanged check IDs; changed builds or scenarios get new IDs referencing their predecessors. Retain the original evidence and state what a clean remaining check needs.

## Ledger interpretation

Schema 2 in runner 2.0.1 distinguishes original observation scope from a fix's independent device regression plan. Preserve mechanism/proxy `affects` and evidence. Declare target regression requirements with source scope IDs in `fix.device_regressions`, link them through `regression_covers`, and retain actual results in `regression_results`; these are independent of original-scope `covers` and `scope_results`. Explicit non-target origin evidence is required for this plan. Target or unclassified observations keep their original strict scope gate. Every requirement must map to a runnable or reserved entry before application, under the same authorization, completeness, priority and half-budget rules. Grouped state plans use `regression_conditions` snapshots, never fabricated observations. A passing regression establishes only its own qualified target behavior; it does not automatically verify, refute or supersede the original observed scope. Planned target acquisition remains unrun until actual evidence is reported.

Use the structured fields described in [reporting](reporting.md) and [ledger schema](ledger-schema.md). Evidence class, acquisition method/environment, and verification level are separate dimensions. Static review maps to static acquisition; automated tests to automated; desktop emulation and OS simulators to emulation; physical devices to physical_device. Field-data retrieval uses automated for an API and manual for a dashboard/export, while retaining **field data** as the environment. Always preserve source, collection window, URL/origin scope, metrics and browser populations. Acquisition does not turn field data into lab data or change its supported level.

Assess the ten master-audit areas even when the seven module checklists share a root cause. A module marked reviewed does not establish that every area or target scenario passed. Validator acceptance checks the submitted record, not omitted tests, authentic evidence, browser conformance, or production readiness.
