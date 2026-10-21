# Execution workflow

This runner implements the October 20, 2026 r2 contract. Read evidence-contract.md for claim, substitution, closure, and budget rules; reporting.md for outputs and ledger commands. Impeccable supplies the installed design workflows. Neither its generic examples nor the old runner's implicit `run` convention overrides r2.

## Resolve scope and authorization

Resolve repository root, target route/component, revision/build, principal task, stack, support matrix, display modes, inputs, test backend, and available environments from the request and verified project context. Retain exclusions and missing facts. A whole-app request requires a route/template inventory and explicit coverage; a sampled homepage is not whole-app coverage.

Use audit only when Mode is blank or the user asks for review only. Explicitly requested implementation can be recorded as audit and fix. An unqualified invocation, “run,” or selected plugin is not by itself edit authorization. The existing plugin's starter prompt explicitly asks to apply fixes; when the user submits it, record audit and fix, while device-dependent fixes still default to propose only. A more specific audit-only instruction takes precedence. Verify and device-results operations are read-only for application source. Resume retains the recorded mode unless the user changes it; historical edit permission does not authorize a changed scope.

Read applicable project instructions, existing PRODUCT.md/DESIGN.md/surface briefs, relevant source and test configuration. Preserve dirty files and unrelated changes. Never reset, stash, rewrite history, or overwrite another contributor's work. Follow project isolation rules when a separate checkout is useful; retain the actual changes being audited.

Routine implementation choices within the user's scope do not need another approval. A missing fact that blocks one repair should not block unrelated authorized work. Keep material product decisions and consequential actions within the user's actual authorization.

## Capability preflight and safe launch

Discover actual tools. Test each listed environment against the target once: read the relevant source, load the intended route, run an applicable local command, or query field data for its URL. Record success or failure with evidence. Do not infer mobile Safari, hardware, or field access from a tool name. Devices a person says they will test are declared, not confirmed capabilities.

Resolve Impeccable's installed skill and version; read its routing prerequisites. Load context once per live project session. A manual fallback after launcher failure can still execute the installed workflow, but reading the skill alone is not execution. Missing Impeccable does not prevent a supported audit; label its execution not run and do not present generic work as its completed workflow.

A browser connector is not automatically a writable checkout. If source or runtime access is absent, continue within what the inputs establish. With screenshots only, inspect visible layout; with code only, inspect mechanisms and risks. Use the first verdict line to name the resulting ceiling and missing target environments.

For an existing app, inspect its documented development command and scripts before execution. Reuse the installed package manager, lockfile, and verified server where practical. Otherwise start the safe development/preview command, record process ownership, log, URL, and stop method; bind to loopback unless a different exposure is authorized. Confirm the intended route and state render, not merely that the port returns HTTP 200. On startup failure, capture the error and continue source review; do not upgrade the stack as a workaround.

Test only a local or test backend with test data. A production URL allows read-only inspection. Without a test backend, stop before the first data write, including form submission or replay, and name the remaining steps. Local stubs can exercise client handling, but do not establish that a real service saved, sent, or published anything.

Record standing substitutions once with environment/build scope. Keep build, setup, and check additions distinguishable. Uninspected wiring is unknown. Actual offline mode is scenario state; an injected failure response is a substitution. See evidence-contract.md for their verification limits.

## Baseline and assessment

Walk the principal journey at phone width and record steps, bottlenecks, and recovery paths. Use 320 CSS px, representative phone widths 360/390/430 where relevant, short landscape, and text enlargement. Record actual browser/OS/version, build, account/data, display mode, viewport, and state. A screenshot alone cannot establish keyboard, share-sheet, touch, or screen-reader behavior.

Use module 1 for all ten master coverage rows. Review each of modules 2–7 for applicability; perform targeted deep dives where evidence or the task warrants them. Static inspection counts as a completed mechanism check in its limited scope, not as target interaction. Missing access means Not tested for unexercised scenarios, never Not applicable. Seven module dispositions are orchestration records, not a replacement for ten-area coverage.

Use one consolidated Impeccable audit for overlapping source evidence. Run critique only when useful, with the installed procedure and actual independence/fallback disclosure. Do not repeat detector passes by habit or let a detector label become an unverified platform claim.

For each finding retain a stable F-ID, location/revision, expected and actual results, reproduction conditions, affected scope, evidence class, cause or hypothesis, severity, and minimal fix. Deduplicate shared causes while retaining all affected locations and checks. Investigative leads are not automatic defects. Recommendations remain separate; hypotheses say what would confirm them. Use open for unfixed unresolved findings, including those awaiting hardware or a backend.

## Remediation

Apply only in audit-and-fix mode. Read Impeccable's craft-floor and the relevant installed procedure. Use existing tokens, components, content, native behavior, and desktop affordances. Prioritize task failures and data loss, accessibility, recovery and responsiveness, then useful polish. A module's mention of an API is not a reason to add it.

Before each change, state its expected result and regression checks. Classify device dependence by plausible regressions in environments unavailable to the agent. Ordinary label, field-hint, and sizing edits do not automatically consume the reserved human script budget. For an applied device-dependent fix, plan every remaining target configuration/state needing a person. Apply only if the union of these entries fits floor(total budget / 2). If one fix's complete remaining coverage does not fit, propose the full fix and its conditions; do not drop a browser, round up, or merge independent results.

When a needed result is unavailable, propose the conditional diff and script the check. Preserve valid characters, page zoom, focus, native navigation and recovery even in proposals. Avoid blanket viewport, touch-action, history, scroll-lock, blur, lazy-load, optimistic-completion or retry changes. Add automated regression coverage where it meaningfully exercises the defect; do not fabricate a phone test by renaming a mocked resize.

For a fix whose observed origin is explicitly mechanism/proxy evidence, preserve that original scope and declare its independent device regression requirements in `fix.device_regressions`. Each requirement names its source scope IDs, expected behavior, environment, complete device/build conditions and relevant dependencies. Map every requirement to `required_check_ids` through `check.regression_covers`; use `covers` only for actual original-scope coverage. A phone regression build may differ from the local fix build if its named build contains the fix. Every remaining human entry still counts against the same half-budget reservation and priority. Mixed findings retain the strict original-scope plan for target or unclassified evidence. Do not relabel desktop evidence, rewrite Affects, mark a new edit as pre-existing, or fabricate an application basis to make admission pass.

Within one browser/device entry, list state transitions and use `regression_conditions` snapshots when requirements have different planned conditions. Keep those snapshots separate from actual `regression_results`. A partial report must preserve each executed portion and leave missing portions not run. Passing all independent regressions does not automatically verify or refute the original finding.

## Confirmation and handoff

Batch related baseline and confirmation views for efficiency. There is no inherited global two-round stop that prevents completing an authorized repair. Rerun the affected journey and necessary project gates after changes. Expand testing only to resolve a concrete remaining risk or required gate. Preserve baseline failures, current failures, and unrun checks; do not overwrite history to obtain a green summary.

Use the verification matrix in reporting.md and the schema in ledger-schema.md. Mechanism and proxy checks can establish their scoped behavior, but Verified fixes need target checks on a build containing the change and across every affected scope. Real-device layout can pass independently of an unknown backend; backend-dependent claims cannot.

Inspect the final diff against the initial dirty state. Stop only processes and temporary resources owned by this run. Record cleanup failures. Do not automatically stage, commit, push, or deploy application changes. Produce the contract outputs and remaining checks within budget. A completed audit can still contain open defects; an unavailable target check leaves a verification limit, not a fabricated pass.

## Device results and resume

Device results update only the supplied audit and ledger. Do not re-audit source to invent a missing causal explanation. Read reporting.md's results procedure and the contrary-evidence rules. Preserve clear partial results, original evidence, IDs, and closed findings with reasons. Reissue verdict, coverage, updated findings, and the remaining script; include other contract sections when relevant.

On resume, reopen the exact run and check target identity, current revision/dirty files, evidence timestamps, and process ownership. Keep unchanged check IDs; a changed build or scenario gets a new ID linked to the earlier check. Old passes do not silently transfer to the new build. Preserve historical failures and show whether a later eligible result supersedes each one. A new session loads Impeccable context once again.
