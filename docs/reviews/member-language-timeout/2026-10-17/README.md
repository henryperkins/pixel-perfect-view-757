# Member first-reading timeout correction

The live first-chart run at source `917c7c4` saved a template after the language request reached the application's 60-second deadline. The original run retained no transport phase data, so the provider-side cause of that individual failure cannot be established retrospectively.

Member daily Gemini Enterprise requests now explicitly select LOW thinking. The model, prompt, validation, provider selection, and 60-second deadline are unchanged. Natal chapters and admin evaluations keep their existing defaults. Each request still makes one provider call, with no retry or provider failover. Synthetic member captures inherit the member policy while explicit evaluation overrides remain available.

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
