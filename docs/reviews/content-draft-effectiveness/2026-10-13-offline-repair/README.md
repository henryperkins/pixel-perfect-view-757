# Offline repair after the completed pilot

The local repair fixes deterministic composition and reflection, reproduces the historical pilot under workerd, and adds portable offline fixture identities. It makes **zero new model calls**. The candidate source bytes remain `78be37d2740102c827fd291777f43f686b9c9f3488c887d76c00212ca84db632`; the failed pilot and its 58 evidence files remain unchanged. No human approval, publication or activation occurred in this pass. Production was not rechecked; 0.7.1 is the last observed active release in the original closeout.

| Check | Result and evidence |
| --- | --- |
| Historical reproduction | [Baseline](baseline-workerd-replay.json) and [candidate](candidate-workerd-replay.json): all eight original requests, facts, captured paragraphs, templates, outputs and validator outcomes match. Original source `82efe38df4c5ee571d6c583de144498c93f596f1`, archived from Git; matching dependency lock; workerd 2026-10-06; outbound network denied. |
| Reflection/composition | [420 fixed case/tone/depth variants](offline-composition.json), including 120 variants covering all 20 additions. All final questions pass structural validation and contain one question; each added source retains its own question. This is not blinded editorial approval. |
| Runtime portability | [Four complete plans](runtime-parity.json), totaling 148 case plans, are equal in Node and workerd. The source SHA in this parity test is explicitly a placeholder, not a publication identity. |
| Saved readings | `reading-primary-cache.test.mjs` exercises real HMAC, encryption and SQLite: the old same-day cache gets a new reading ID; saved text, sources and feedback remain unchanged. |
| Rendering | [Browser record](browser/result.json): all four pilot cases at 1440px and 390px; one question, keyboard access and no overflow or console errors. Actual `TodayContent` body/reflection markup and application CSS, with adjacent interactive components stubbed; no authenticated member workflow or device qualification. |
| Preservation | [All 58 original evidence files and unrelated `.env` preserved](preservation.json). |

Schema 4 now uses `primary-composition-1` and `primary-reflection-1`. A valid primary interpretation question wins; a missing or malformed one gets a safe domain fallback. Quiet days use the generic fallback. Domain and wellness questions no longer append. The cache context includes both policy versions; previously saved readings retain their original text. Schema 5 retains its separate writing/reflection policy.

Deterministic templates omit the three identified generic phase sentences and mechanical tone openers, while retaining distinct authored phase text and the supplied facts. Technical timing names the contact: “Saturn's sextile to natal Mercury is approaching exactness; its current aspect orb is 0.42 degrees.” The serving prompt has a separate `daily-astro-body-15` identity, keeps citations in metadata, discourages repeated contact explanations and preserves the source subject of frequency claims. These instructions have been verified at the request boundary; their effect on newly generated prose has not been tested.

The eleven analytic scans are checked-in canonical data for `draft-fallback-2` and `draft-pilot-2`. Their JSON bytes equal the former Node representation, including JSON's standard conversion of negative zero to zero. New transit hashes use only their selected catalogue. Historical version-1 and `synthetic-daily-7` calculations/hashes remain intact. The existing paid API remains on the original four-case manifest; it cannot reuse the exhausted campaign or silently adopt these offline identities. A future paid campaign must explicitly bind the new version.

The original strict **Node** replay remains a failed historical observation. Matching-runtime replay is additional evidence, not a rewritten result or a writing pass. Both workerd reports deliberately say `qualified: false`.

Reproduce the offline gates from the repository root, using a local workerd 2026-10-06 executable:

```bash
PATTERN_TEST_WORKERD=/path/to/workerd npm test
node_modules/.bin/tsc --noEmit
npm run build
node scripts/evaluate-readings.mjs --replay-content-workerd docs/reviews/content-draft-effectiveness/2026-10-13/pilot/baseline-report.json --content-plan docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json --arm baseline --workerd /path/to/workerd --output /tmp/NEW-baseline-workerd-replay.json
node scripts/evaluate-readings.mjs --replay-content-workerd docs/reviews/content-draft-effectiveness/2026-10-13/pilot/candidate-report.json --content-plan docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json --arm candidate --workerd /path/to/workerd --output /tmp/NEW-candidate-workerd-replay.json
```

Replay refuses an existing output path. Tests that require workerd explicitly skip when `PATTERN_TEST_WORKERD` is absent; the recorded full run supplied it. The original Node replay command retains its original source/dirty-runtime guards. For browser reproduction, build first, set `PLAYWRIGHT_CHROMIUM_PATH` to an installed Chromium binary, run `node docs/reviews/content-draft-effectiveness/2026-10-13-offline-repair/browser/preview.mjs`, then run the adjacent `check.cjs` using Playwright CLI's `run-code --filename` against port 4176.

The next editorial step is a **proposed** separate repair pilot using the same four paired cases, with an explicit new limit of eight attempts and a $5 cap, no retries or replacement outputs. The operator must authorize it and recheck provider/account evidence first; it is not scheduled. Its manifest must identify the repaired serving policy and portable fixtures. Freeze its review rubric before generation, preserve every output, and review body and final reflection independently. That pilot would still leave the other 16 additions without live qualification. Full affected-key evidence and exact-content human approval remain necessary before the existing guarded stage/activate flow and consented member-use/rollback checks.

See [validation](validation.json), [implementation review](implementation-review.md) and the [checklist](../../../superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md) for the final implementation status and open release gates.
