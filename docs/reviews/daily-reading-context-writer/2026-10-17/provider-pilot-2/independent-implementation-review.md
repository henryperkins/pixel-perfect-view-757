# Independent implementation review

Verdict: **PASS for the approved source-pinned second pilot. No blocking implementation findings.** This is a predeployment, offline code review, not a writing-quality qualification.

Reviewed on 2026-10-17 in `/tmp/pattern-context-material-worktree-20261017`, against base `3de2393149c5b086efab31dd5c3183702b4f4138`. Scope included the complete tracked diff, the new material and claim-scope tests, the material JSON, and the existing request, fact-graph, durable-runner, accounting and Workflow paths that consume these changes. The execution ledger was read before review. No provider, deployment, release, member-record or Git mutation was performed by this reviewer; this report is the only added file.

## Identity and scope

- Material raw-byte SHA256 independently recomputed as `be7c09a59c536ea963e128770f61b5d1af4dbb7bccebe6ac771efd4b52108a21`.
- Benchmark hash remains `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024`; the frozen source bundle remains version `0.9.0`, canonical hash `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f`.
- The same five cases and their order remain fixed. The new campaign identity is `daily-context-pilot-2`, with at most five attempts, a conservative $5 ceiling, no paid review reserve and zero automatic retries.

## Reviewed boundaries

| Concern | Result and evidence |
| --- | --- |
| Material/source mismatch | `reviewedCard` compares the explicit complete selected source-fact projection, including statement, source identity, release, parents and context metadata, before exposing any card. `assertDailyFactGraph` runs before optional facts are dropped and again after selection. Changed meaning, release, natal evidence or chapter fails closed. The closed benchmark preparation additionally compares the entire selected graph with the immutable benchmark graph. |
| Private and local-only fields | The provider brief projects named fields rather than spreading a card. Source proof, review annotations, source paragraphs and local limitations are absent from the actual request. References expose only the intended source identity, geometry and literal chronology. Existing hidden-context probes remain applicable to the unchanged explicit fact projection. |
| Parent and dependency coverage | Required parents are traversed from the validated selected graph. Synthesis, natal and chapter parents remain present, and existing shared validation enforces their paragraph citations and early coverage. Review conditions are supplied separately under `controls.sourceConditions`. |
| Frozen plan versus actual request | The plan now includes both the parsed material packet and its independently pinned raw-byte hash, plus each derived writing brief. Before an unclaimed durable step, revalidation checks version, source SHA, provider, stored whole-plan integrity and equality with a freshly reconstructed whole plan. Independently intercepted native Gemini payloads for all five cases used exactly the frozen writing briefs, with matching observed system/user text, schema and 65,536-token output bound. |
| Historical v1 evidence | The shared run/metadata types retain v1 as readable evidence. The new version receives a separate start allowance, while `revalidateContextPilotPlan` rejects a v1 plan before a new reservation/provider call. The historical-row test confirms that reading a retained completed v1 row does not rewrite it to obtain v2's allowance. |
| Attempt, budget and retry behavior | The existing atomic position reservation still guards attempt and campaign cost limits before sending. Duplicate/overlapping callbacks cannot send a second request for a reserved position. Unknown usage, uncertain transport, incomplete capture/finish, model drift and lost final persistence retain the spent reservation or capture and stop further traffic. Failed dispatch consumes the version's campaign identity. The separate Workflow explicitly retains `retries.limit: 0`. |
| Raw rejection versus authored fallback | The new recent-onset regression rejects the captured first-pilot assertion as `editorial_claim`, retains that raw candidate, reports `outcome: rejected` and `mode: template`, and returns the complete authored benchmark fallback. It makes one intercepted request. Durable tests also preserve lossless rejected drafts across distinct cases; neither the shared report scope nor accepted/model consistency checks describe fallback as generated success. |
| Member route | The changed brief and onset guard require the explicit synthetic context-candidate switch. The member `generateReadingProse` route and ordinary synthetic route retain their previous behavior; the dedicated regression test exercises both with the first-pilot wording. Provider selection and failover behavior were not changed. |

## Verification

This reviewer ran:

```text
node --test tests/reading-context-material.test.mjs tests/reading-context-claim-scope.test.mjs tests/reading-context-pilot-plan.test.mjs tests/reading-context-pilot.test.mjs tests/reading-context-pilot-contract.test.mjs
```

Result: **39 passed, 0 failed, 0 skipped**. These use mocked/intercepted transport and establish no live provider result.

The saved `/tmp/pattern-context-material-pilot-20261017/offline-validation/manifest.json` was independently audited: all 15 listed source-file hashes still matched this checkout, and its five captures contained the same briefs as their assembled requests. Full authored benchmark paragraphs, headlines, reflections and local card audit fields were absent from those requests. The manifest records ten intercepted requests and zero live/paid requests; it explicitly labels its authored response injection and fallback checks as offline contract validation.

A separate reviewer probe reconstructed the frozen plan and intercepted five Gemini Enterprise calls through the real synthetic runner. For every case, the request brief equalled `plan.cases[].writingBrief` and the saved offline brief; native system text, user text and response schema equalled the observed request. The probe made five intercepted Enterprise requests, zero gateway requests and zero live provider requests. The full suite was left to the parent task as requested.

## Remaining qualification gate

No finding here establishes that generated prose preserves every source condition or sounds better. The onset guard deliberately catches a known literal regression and does not constitute general semantic validation. The I2 distinction's result-limit wording can still sound like narrated policy if the model copies it; that is an actual-output voice question rather than a source-binding or request-integrity defect.

After source-pinned deployment, the separately authorized five-attempt pilot must preserve and independently assess the **raw candidates**, their rejection/acceptance diagnostics and transport/accounting evidence. An authored fallback matching the benchmark cannot count as generated quality. No activation or member-use claim follows from this review.
