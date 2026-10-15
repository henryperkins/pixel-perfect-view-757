# Editorial source separation and Workflow recovery repair

Implemented after the user requested removal of competing writing material and failed-Workflow status recovery before another pilot. This work is based on `520402c` and the preserved [interrupted pilot](../live/README.md). It makes no new provider requests and does not reopen that campaign.

## Writing input

The candidate writer now receives only the selected `writingMaterial` as draftable interpretation. A separate structural projection supplies the exact source IDs, keys, parent dependencies, and named transit-to-natal contact. Legacy interpretation, synthesis, domain, phase, timing, engine, and uncertainty prose do not enter this prompt. Full original facts remain in the captured audit inputs and validation graph. Existing non-editorial writers keep their previous input policy and behavior.

The candidate prompt, validator, and voice identities advance to version 2. The source candidate itself is unchanged. A regression reconstructs the historical source SHA with the new policy and proves the frozen plan hash changes; the previous saved plan is rejected for execution under the new policy. Historical evidence is not regenerated.

Warm/standard technical detail has a separate `editorial_detail` rejection reason. The captured orb-heavy draft is rejected. Independent review found the initial guard also rejected ordinary “a degree of uncertainty” and imagery about “separating an impression.” Three positive regression cases failed first, then passed after narrowing the guard to measurements and explicit contact-phase syntax. This remains a bounded style check, not proof of semantic quality or human approval.

## Failed Workflow recovery

The Worker exposes a signed `POST /evaluations/status` read. Signing the body binds the requested instance ID. It calls only `EVALUATIONS.get(id).status()`; it does not create, resume, restart, or dispatch a Workflow. The app checks admin authority and run ownership before lookup, verifies the returned instance ID, and uses a five-second deadline with no caching.

An owned run read or Stop action reconciles confirmed `errored` to `error` and `terminated` to `stopped`. Unknown, malformed, mismatched, unavailable, and nonterminal statuses do not establish a failure. Age does not drive this recovery decision. Existing terminal application status and reason remain authoritative if completion or another halt races the lookup.

The original provider response can arrive after recovery. Its capture and accounting are retained, the completion count advances monotonically, and terminal status remains terminal. A subsequent read repairs a lost completion-count write from stored captures. Unchanged terminal reads do not write timestamps or look up the Workflow again. Reserved attempts remain spent; recovery never invokes the evaluation-step endpoint or creates another reservation.

All evaluation panels show an unresolved-capture notice when a terminal run still has an uncertain attempt. Their existing recovery controls remain usable; the general panel now has an explicit read-only refresh. General evidence downloads also refresh saved data first. A failed or competing refresh refuses a stale export. Reopening a panel recovers the same stored run; it does not start another campaign.

The Workers API was checked against [Cloudflare's official documentation](https://developers.cloudflare.com/workflows/build/workers-api/). The new endpoint is backward compatible: an older Worker returns an unconfirmed lookup, leaving the app state unchanged.

## Verification

- Regression tests reproduced the copied legacy opening, technical-detail acceptance, missing status endpoint, stuck running/stopping states, late capture with stale completion count, and lost progress-write recovery before implementation.
- Final suite, TypeScript, scoped ESLint, production build, and Worker dry-run results are recorded in [verification.json](verification.json).
- Local Chromium exercised the actual editorial and general evaluation components against synthetic server functions. A terminal unresolved attempt survived reload; read-only recovery revealed its late saved response; both downloaded exports retained `error`, one captured result, and one spent attempt. The fixture recorded zero starts, stops, or previews. The general download fetched the late response without a preceding manual refresh.
- Independent review found one important issue, the style guard false positives described above; its regression tests now pass. No other important source, ownership, accounting, or concurrency defect was identified. A download attempted during another active status read can safely refuse rather than export stale data; it can be repeated after that read finishes.
- All fourteen historical live-evidence hashes still match. The unrelated `.env` is unchanged. The temporary browser and local fixture server were closed.

## Publication boundary

The user subsequently approved publication. Runtime commit `be9d7237e7c93423a6f6ec92326c6236cb08352d` was committed and pushed to `main` without rewriting history. Both production app domains now return that exact SHA from `/api/public/evaluation-identity`; Lovable deployment is `3ed25717-14c4-46b5-be77-bf0193278d75`.

The separately deployed `pattern-workflows` Worker was published first with Wrangler 4.149.0 from the verified copy outside the app tree, using `--keep-vars`. Version `34dfd849-82d8-4cb8-8f0b-27f2162983da` serves 100% of traffic. Downloaded deployed code exactly matches the verified bundle; existing secret names and resource bindings are preserved. An unsigned status request returns HTTP 401. Publication receipts are in [publication.json](publication.json); [verification.json](verification.json) remains the unchanged prepublication record.

Read-only production checks confirm that the old Workflow remains `errored`, its application run remains `error` with one captured response and one spent attempt, and the active content release remains `0.7.1`. No new pilot, model request, content activation, or production data write occurred during this publication.

The full signed app-to-Worker recovery round trip was not exercised live: the shared secret is unavailable locally, and the preserved run is already terminal. Regression tests cover that path. No historical run was reopened and no production test run was created to exercise it. Source identity and Worker publication do not establish fresh writing quality.

Following the user's subsequent request, the [production end-to-end exercise](production-e2e/README.md) passed using isolated temporary fixtures and the actual signed lookup of the existing failed Workflow. Recovery, Stop, late-capture refresh/export, accounting, ownership, and access revocation were verified. All temporary records were removed; the original pilot and active content were unchanged. The paragraph above and publication receipt retain the evidence boundary at publication time.

A future pilot requires a new reviewed frozen campaign identity and plan under the revised policy. The interrupted campaign and its spent attempt remain preserved; do not resume it or silently reset its allowance. Fresh generated-writing quality and human editorial approval remain open.
