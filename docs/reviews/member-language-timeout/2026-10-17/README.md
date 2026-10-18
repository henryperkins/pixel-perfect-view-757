# Member first-reading timeout correction

The live first-chart run at source `917c7c4` saved a template after the language request reached the application's 60-second deadline. The original run retained no transport phase data, so the provider-side cause of that individual failure cannot be established retrospectively.

Member daily Gemini Enterprise requests now explicitly select LOW thinking. The model, validation, provider selection, and 60-second deadline are unchanged; the story-reference prompt clarification below follows the first live check. Natal chapters and admin evaluations keep their existing defaults. Each request still makes one provider call, with no retry or provider failover. Synthetic member captures inherit the member policy while explicit evaluation overrides remain available.

Production daily diagnostics now retain bounded provider/model, thinking setting, HTTP status, phase timings, deadline-abort timing, finish reason and token counts. They do not retain prompts, facts, prose, thought text, credentials, headers, request IDs or exception messages. Existing saved diagnostics remain readable; missing historical measurements are not inferred. Diagnostics stay in server-side reading metadata.

## Evidence for the policy

Two sequential, frozen synthetic observations used the plain/standard Jupiter trine Sun input, release `0.9.0`, prompt `daily-astro-body-15`, validator `daily-reference-10`, Gemini Enterprise `gemini-3.8-flash`, the same schema and 60-second deadline. Both requests explicitly capped output at 65,536 tokens; production leaves the provider's existing maximum unchanged. The only difference between the paired requests was LOW versus omitted thinking control.

| Variant | Duration | Result | Reported thinking tokens |
| --- | ---: | --- | ---: |
| Provider default | 50,950 ms | HTTP 200, STOP, accepted model prose | 9,191 |
| LOW | 2,238 ms | HTTP 200, STOP, accepted model prose | omitted, retained as unknown |

The source and request manifest hash is `d27f7afdf235154683b48e9ed03bb575565ca9678b771633a51ac65930163a20`. The baseline used the failed-run source, whose language implementation is unchanged in the subsequent email/dependency release. Both captures were lossless. Independent review found the LOW output supported by supplied I1/D1/P1 facts; timing detail is optional at standard depth. This is a narrow transport and grounding check, not content-wide editorial acceptance or a reliability measurement.

Google documents MEDIUM as this model's default and recommends lower thinking for latency-sensitive tasks: [Gemini 3.8 Flash developer guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash). The observed pair supports this correction; it does not prove thinking caused the earlier timeout.

Private execution receipts and synthetic captures are in `/home/ubuntu/.cache/pattern-language-timeout-20261017/paired/`. No historical evaluation campaign was reopened. No account data was used by this pair.

## Verification

Regression coverage checks the native member request and unchanged deadline, independent synthetic controls and Lovable selection, no retries, pre-header and body deadline aborts, upstream HTTP timeout, network/JSON failure, bounded reported-model mismatches, metadata sanitization and historical compatibility, and persisted model metadata reused without another provider request. The final release and fresh-account cleanup receipts are recorded separately after deployment.

Final local checks: 1,149 tests passed, four existing tests skipped, zero failures; TypeScript, scoped ESLint, and production build passed. Independent implementation review findings were corrected and rechecked.

## Live check and story-reference follow-up

The first deployed LOW run (`d257450`, 2026-10-18 UTC) returned HTTP 200 / STOP in 5,030 ms. The unchanged story validator rejected paragraph two with `arc_dependencies`, so Today correctly saved a template. The fresh synthetic account, all records across 30 owner/account tables, its exact verification-rate-limit row, browser storage and private artifacts were removed. This run does not count as generated-reading success.

A separate one-call reconstruction from its retained synthetic facts reproduced `arc_dependencies` in 4,200 ms. The captured first paragraph cited C1/I1/N1/P2 but omitted A1, while the chronology and A1 citation were in paragraph two. This identifies the new observed failure: P2 needs its parent A1 in the same paragraph, even when the chronology text is elsewhere. The original live rejected candidate was not retained, so its precise missing reference remains unknown.

The story prompt now gives literal paragraph-local JSON reference arrays and explicitly separates citing A1 from repeating its chronology sentence. The chronology-once rule and every validator remain unchanged. Prompt identities advance to `daily-astro-body-16` and `daily-concrete-body-15`; historical report files retain their original identities. Regression cases still reject each missing P2 parent and missing chronology reference.

A controlled candidate using exactly the same reconstructed input, LOW setting, model, schema and deadline returned accepted generated prose in 2,778 ms. The only native-request difference was the story-citation instruction. Its chronology appears once, and the separate P2 paragraph cites C1/I1/A1/P2. Source-grounding review found no substantive unsupported claim. Both baseline and candidate were single attempts, without retries. Candidate manifest: `c02038ff50aeb7fd97339c7b5721c90fa1195dc9584d90b513aeea6e89cae3d9`.

Follow-up local verification: 1,155 tests passed, four existing skips, zero failures; TypeScript, scoped ESLint, formatting and production build passed. Independent implementation review found no remaining issues. Final deployed first-reading acceptance is recorded in the external run receipt.
