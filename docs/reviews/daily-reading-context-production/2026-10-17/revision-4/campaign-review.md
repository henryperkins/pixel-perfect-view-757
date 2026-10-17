# Campaign 4 implementation review

Status: campaign implementation complete; integrated test run remains pending; final material bytes are pinned subject to independent source review. No provider, deployment, production database or activation calls were made in this task.

`daily-context-pilot-4` is a fresh immutable campaign. Its fixed five cases/order, member-production adapter, Gemini Enterprise selection, five-attempt limit, $5 conservative ceiling, durable reservation/capture logic and no-retry policy are unchanged. Historical campaigns 1, 2 and 3 remain readable and consumed; their records are not rewritten to obtain the new allowance. Shared report and metadata unions include version 4 while retaining all historical versions. The report keeps runtime fallback bodies separate from original review benchmarks.

Tests were changed first. Before implementation, the fresh-version, historical-consumption/isolation and fourth-campaign scope tests failed for the expected reused-v3/report-branch reasons (3 failed). After minimal campaign and type/report changes, the same three passed. The full contract suite passed 3/3; scoped ESLint passed after fixing one line-wrap. Complete integrated campaign suites have not yet run against final revision-4 writing material.

The runtime fallback pin is `af143337793ad4136a16fd4144adec0be365d15fa0b1e83d326763bcae85a0eb`. Independently comparing the full fallback JSON with the prior committed artifact, excluding only `materialVersion`, showed all other fields identical. Runtime adapter/fallback versions remain 1. Benchmarks and source bundle remain pinned to their original identities.

Remaining integration work:

1. The final material-4 SHA256 is pinned as `3b94054b97f9243f1606593602209cec8cbeba8fcca9c7d8ad47e4cdcadf31c3`. Re-pin if independent source review requires a material revision.
2. Confirm material, body, reference, brief and voice versions are 4; pilot plan tests already expect them.
3. Run:

```sh
node --test --test-concurrency=1 tests/reading-context-pilot-contract.test.mjs tests/reading-context-pilot-plan.test.mjs tests/reading-context-pilot.test.mjs tests/reading-context-production-path.test.mjs
npx eslint src/lib/ai/context-pilot.ts src/lib/ai/context-pilot-plan.server.ts src/lib/ai/qualification-plan.server.ts src/lib/ai/reading-evaluation.shared.ts tests/reading-context-pilot-contract.test.mjs tests/reading-context-pilot-plan.test.mjs tests/reading-context-pilot.test.mjs tests/reading-context-production-path.test.mjs
```

Root retains complete-suite, TypeScript, exact-source build, independent review, deployment, bounded paid pilot and conditional activation responsibility.
