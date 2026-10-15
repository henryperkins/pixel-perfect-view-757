# Independent implementation review

Read-only source review of the inactive editorial candidate, source selection, writer, saved-state/cache changes, and server pilot controller. No secrets, hosted service, member database, or real provider were accessed. The small adversarial probes used intercepted synthetic gateway responses with Vite environment-file loading disabled. This review did not rerun the implementation agents' broader test suites.

## Findings

1. **P2 — Required synthesis references could disappear after the first paragraph; resolved in the 2026-10-15 follow-up below.** At initial review, `src/lib/ai/language.server.ts`, `dailyDraft` checked synthesis parents only when a paragraph explicitly cited `S1`, then required one `S1` citation among the first two paragraphs. The editorial scene deliberately does not use the schema-5 scene-reference checks. Replaying the exact authored synthesis fallback with paragraph 2 citing only `C1,I1,C2,I2` and paragraph 3 citing only `C1,I1` was accepted as model prose, although those paragraphs contain the selected synthesis imagery and direction. The requested correction was to require selected editorial `requiredFacts` on each paragraph using that material and cover omitted `S1` and omitted secondary-parent cases. This finding remained reproducible at the original review's last check.

2. **P2 — Possessive planetary wording bypassed aspect validation; corrected during review.** `dailyReferenceProblem`'s relation expression expected whitespace immediately after the body name. The new Jupiter trine case accepted “Jupiter's sextile to your natal Sun is a wider frame around a familiar self-portrait.” Removing the possessive made the same wrong geometry reject. The writer added candidate-only normalization during review. Independent follow-up probes confirmed that both straight and curly possessives now reject with `relation`.

## Scope and evidence notes

- The Jupiter frame uses the original `soft:jupiter:sun` source and only matches `jupiter_trine_sun`; a sextile does not inherit that frame. The added Neptune source is exact and preserves the baseline entries.
- Source edits and displaced family matches invalidate associated editorial frames. Writing material and controls are separate; quiet entries rotate by civil date and need no model call.
- The server plan captures and rebuilds candidate, case, provider, model, source, and policy identities. Admission checks operator authority and retained campaign identity; per-case reservations enforce five attempts and the $5 ceiling. Unknown usage retains its reservation and halts. No new active-release pointer or member-data write path was found.
- At initial review, the new mode was accepted by authenticated preview/start server functions, but no dedicated `/content` launcher existed. This was addressed in the follow-up below.
- At initial review, result metadata still described “Actual model outputs” and a live network for the deterministic quiet records. Their `request`, diagnostics and output mode correctly distinguished them. This metadata wording was addressed in the follow-up below.
- Neither these probes nor the offline fallback preview establish fresh generated-writing quality, human approval, publication, activation, deployment, or member use.

The original review reproduced both defects with three mocked responses; the follow-up used three more. All six were intercepted locally, with zero network requests.

## Follow-up — 2026-10-15, 03:50 UTC

- **Synthesis citations and saved restoration resolved.** Every candidate paragraph now requires its selected source and parent facts, and `validateSavedDailyWriting` rejects missing required citations in saved model prose as well as fallback prose. Re-ran `tests/reading-editorial-writing.test.mjs`; its omitted-`S1`, omitted-secondary-parent, possessive wrong-geometry, source-selection tampering, and saved-citation checks pass. The original finding descriptions above remain as the record of what was observed.
- **Quiet metadata resolved.** Re-ran `tests/reading-editorial-pilot.test.mjs`; deterministic quiet captures are labeled “No provider request” and “Authored quiet-day copy,” while attempted/rejected model captures distinguish generated candidates from displayed fallback copy. Both focused test files passed with no provider traffic.
- **Admin controls now exist and have local browser evidence.** `EditorialPilotEvaluation.tsx` is mounted on `/content`. The actual component passed synthetic Chromium checks for preview, one explicit start, polling, stop, saved-run recovery, lost acknowledgement, persistent pending marker, result expansion, and JSON download. See [UI verification](ui-verification.md).
- These are offline code and component findings. They establish no deployed route, real authentication boundary, Workflow delivery, model quality, human editorial approval, or member use.
