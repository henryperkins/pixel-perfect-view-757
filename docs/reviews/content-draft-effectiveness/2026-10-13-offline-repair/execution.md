# SDD ledger — plan: docs/superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md

Baseline: 13113be0ca50d9590208fa24bd586a969c094bab. Native worktree, branch feat/content-pilot-offline-repair. Protected primary .env and all 58 pilot files hashed in baseline-identities.json.

Historical Tasks 0–8: implementation and eight-attempt pilot completed; account-specific invoice gate remains open. Task 4 exact-source replay unresolved. Task 9 editorial qualification failed and human approval absent. Task 10 not started.

Ruling: Resume with historical replay plus the summary's offline composition/reflection/fixture repairs — current user authorized completing the checklist; the earlier eight-call authorization is exhausted and the request supplies no new numeric budget or exact-content approval — local evidence cannot close paid writing or release gates.

Pre-flight: Composition and reflection repairs share assembleReading and cache identity; use a separately versioned schema-4 assembly policy and serving prompt, leaving schema-5 writing policy separate. Historical replay must load exact Git source, never repaired code. Future fixture data must have a new identity; old hashes and packets remain byte-identical.

Tasks in this pass: 4 matching-runtime replay; 11 schema-4 composition/reflection repair; 12 portable versioned fixtures; 13 offline verification, review, and release handoff. Tests and evidence accompany each task. No publication or generation until its remaining gates are satisfied.
Task 11: complete (commits 13113be..7c81ab7, tests: node --test tests/reading-primary-composition.test.mjs tests/reading-primary-cache.test.mjs tests/reading-language.test.mjs tests/reading-content-report.test.mjs → ℹ duration_ms 3937.079006)

Task 4: Matching-runtime replay complete: original source 82efe38, frozen pair revalidated, 8/8 requests/facts/candidates/templates/outputs/outcomes equal in workerd 2026-10-06. Zero provider calls, outbound service denied. Original failed Node reports and all 58 original evidence files remain byte-identical.

Task 11: Tests first: 5 composition failures and missing prompt-policy instructions reproduced before implementation. Broader 420-variant check exposed the quiet-day prefix; quiet fallback regression RED then GREEN. Cache integration uses real SQL, HMAC and encryption; archived review packets retain two questions. Browser checks cover actual TodayContent body/reflection markup and CSS at 1440/390, with adjacent interactions stubbed. Full suite 857 pass, 2 existing skips, zero failures; workerd enabled. Typecheck, scoped lint and build pass.

Task 12: New manifest lookup failed before implementation. All four full plans (148 cases) now match Node/workerd. Canonical data uses JSON serialization, whose negative-zero conversion is explicit and hash-preserving. New v2 catalogues are offline only; old paid manifests and original hashes are preserved.

Task 13: Review package prepared after local tests. Human approval, paid generation, deployment, activation and member evidence remain outside completed local gates. No new paid scope inferred.
Task 12: complete (commits 13113be..7c81ab7, tests: env PATTERN_TEST_WORKERD=/home/ubuntu/.npm/_npx/c943b712072b77c4/node_modules/@cloudflare/workerd-linux-64/bin/workerd node --test tests/reading-portable-fixtures.test.mjs tests/reading-workerd-replay.test.mjs → ℹ duration_ms 2420.765742)

Final review: fresh GPT-6-astra context, range 13113be..7c81ab7. Ready to merge for offline scope. No Critical, Important or actionable Minor findings. Independently reran 11 tests with workerd enabled, verified 58 original hashes, 25 source/test hashes, 420 variants and 148 complete case plans.
Final: Ruling: Fresh writing quality was not assessed — keep the failed round and require a newly authorized captured round — cost if wrong: prompt instructions might not improve prose and further revision would be needed.
Final: Ruling: Human approval, release, billing and member behavior remain outside this implementation review — leave their gates open — cost if wrong: release cannot proceed without the required external evidence.
Final: Ruling: Static browser coverage is sufficient for the local server-composition repair, with its limits explicit — unchanged adjacent interactions were stubbed — cost if wrong: device or authenticated interaction bugs can remain undetected before release checks.
Final: Ruling: Unchanged Tasks 1–10 infrastructure retains historical evidence and current regression coverage — no fresh production certification claimed — cost if wrong: historical deployment evidence could be stale.
Final: Ruling: The owner ran the full suite/build/typecheck/lint; the independent reviewer repeated focused tests — retain both evidence levels — cost if wrong: whole-suite validation is author-run rather than independently duplicated.
Task 13: complete (commits 13113be..7c81ab7, tests: env PATTERN_TEST_WORKERD=/home/ubuntu/.npm/_npx/c943b712072b77c4/node_modules/@cloudflare/workerd-linux-64/bin/workerd npm test → ℹ duration_ms 53224.310764)
