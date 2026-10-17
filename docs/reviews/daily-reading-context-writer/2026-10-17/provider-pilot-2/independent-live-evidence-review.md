# Independent execution-evidence review: second context pilot

Reviewed on 2026-10-17 from saved artifacts, the private original database export, and local source. This reviewer made no network or live provider requests, database or runtime changes, deployment, activation, or commit. The additional native-payload probe used the existing local harness, which rejects external network access; it intercepted five simulated Enterprise requests and made zero gateway or live provider requests.

**Evidence verdict: the saved records consistently establish completion of the separately bounded five-attempt second pilot. No material execution-evidence inconsistency was found.** This verdict does not assess the generated writing. Five automatic accepts establish structural acceptance only; source grounding, reader quality, human approval, activation, and member use remain separate questions.

## Frozen identity and unchanged comparison inputs

| Item | Independently checked identity |
| --- | --- |
| Run and Workflow instance | `12bdc739-e16f-45f8-beca-3c1656b0eaf8` |
| Executed runtime source | `9bce3b55ce72eae00563b3b3b51e61f6a72f8b59` |
| Full frozen plan | `583c3a84f06645e9400abe0200020621976cfdfb58bfef99df29a299a109eebb` |
| Reviewed material exact file bytes | `be7c09a59c536ea963e128770f61b5d1af4dbb7bccebe6ac771efd4b52108a21` |
| Authored benchmark exact file bytes | `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024` |
| Manifest case-set hash | `93855b484ef95b1b950fc229633d4467215ff0cd2c6d6ce1eb1445ba3375f5c4` |
| Candidate ordinary JSON hash | `761d68d270b93759b66c4a77dabad21213f1e4ca2f2873a4295d003cadcb6b61` |
| Candidate canonical checksum | `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f` |
| Recorded serving deployment | `cfa7847d-e514-478c-8bfa-e4d54f63c9cb` |

The whole-plan hash was recomputed using the application's `JSON.stringify` convention with only its final `hash` field removed. The result matches `preview.json`, `run.ledger.sourcePlan`, and the full plan parsed from `/tmp/pattern-context-material-pilot-20261017/db-proof.json`. Rebuilding the complete plan from current source with the executed source SHA also produced exactly the same serialized plan and hash. Each of the five case hashes and every original-fixture hash matched. Comparisons use the serialized JSON contract; an in-memory negative zero serializes to the same JSON zero and changes no stored bytes or hash.

The benchmark and material file-byte hashes were recomputed, and their parsed contents equal the packets frozen in the plan. The application copies of the benchmark, material and source bundle are byte-identical to those files in the executed runtime commit. All 15 source-file hashes recorded by `offline-validation/manifest.json` match the reviewed checkout; `git diff` against the executed commit is empty for `src` and `edge`.

The first pilot's `preview.json.plans` and this pilot retain the exact same case manifest, authored benchmark packet, original fixtures, complete source bundle `0.9.0`, five case IDs and order. Each selected source graph also equals the first pilot and the immutable benchmark's selected graph. The cases remain `contact-only`, `natal-only`, `transit-only`, `natal-and-transit`, and `synthesis-natal-and-transit`. The new material and writing policy therefore do not conceal a changed benchmark, source bundle or comparison case.

## Actual request material and native mapping

For every captured request, the brief JSON embedded in its user message equals that case's frozen `writingBrief`, including its exact serialized field order and contents. Each material entry has only the intended identity fields, meaning, scene details, practical distinction, optional directions and required parents. These values equal the exact reviewed material cards; the full parent closure was independently traversed from the selected source graph. Each card's required conditions appears unchanged under `controls.sourceConditions`.

The captured request text contains no `sourceFact`, `sourceMeaning` or `reviewSupport` fields, no full interpretation, natal or chapter source paragraphs, and no complete authored benchmark paragraph, headline or reflection from any of the five benchmarks. The three transit-context requests intentionally contain the immutable A1 chronology sentence; its presence is required calculated chronology, rather than leakage of a benchmark answer or source-audit packet.

The actual live artifacts retain a normalized request observation rather than a complete native wire-body archive. To check the mapping independently, this reviewer rebuilt each case through the real synthetic runner with only its saved candidate paragraphs supplied by intercepted local transport. All five newly observed normalized requests equal the saved live requests byte for byte under `JSON.stringify`. Each intercepted native Gemini payload has the exact same system text, user text and response schema as that saved request, with `responseMimeType: application/json`, `maxOutputTokens: 65536`, and no explicit thinking override. The source uses the native Enterprise `generateContent` endpoint and selects one provider without fallback.

| Case | Saved normalized request SHA-256 | Reconstructed native payload SHA-256 |
| --- | --- | --- |
| contact-only | `28596201beb03ee940a2851046abf345a653f3413f831908cecd5e3641f2d25a` | `aaae8406f0b4faabed5b21cffc34d14236e5bc39b42829d1093020bf2c0bab56` |
| natal-only | `1d9cfa2a01d8dc9afe962cd31ad42b955cef0c73720029362ca573c7fd5992d5` | `a11d20725fde1f6e4a42510793ede4c73d1fd09fe6b698d2b44cc07a085eecf4` |
| transit-only | `95bfe551f7ac4a322880f300ca73b57e5664bea42c833234dad969b5e6c807f1` | `9dfaac1d7809fd317055faa15011e9bbbed55785f5667b6b2b891e76ef7fb0f8` |
| natal-and-transit | `5c9ce7023c6ad982ea4b629cf888ba53d82704af2bf704dd5e516de18e2b19f2` | `8b3c5f3aac1ea4346cc6c32fefa7c09962b42bb66b1ba5eff7f675cff4fefc5b` |
| synthesis-natal-and-transit | `2445b530102d4bf9de0b73c0ba5185fa1a360aff88edbf7f60abff1324b5cb2e` | `bac38fa5d0c0d910385450a7f9c685ae3d021ba812c059aa3e4e11197a3f0f9c` |

The normalized requests are 7,800; 9,405; 9,363; 10,968; and 13,457 UTF-8 bytes respectively, all below the 65,536-byte request bound. Reconstructed native payloads are 7,759; 9,364; 9,322; 10,927; and 13,416 bytes. This source-pinned reconstruction proves the mapping used by the reviewed code. It does not independently authenticate the bytes received by the remote provider.

## Attempts, captures and accounting

`run.json`, the original database export, `database-receipt.json` and the Workflow agree on five ordered positions and five attempted, persisted results. The Workflow records five successful steps, each with one attempt and retry limit zero. All five response IDs are distinct. Every transport receipt records Gemini Enterprise, actual model `gemini-3.8-flash`, HTTP 200, `STOP`, no abort, a 60,000 ms application deadline, and a 65,536-token output bound. `operator-observations.json` separately records one start invocation, read-only Workflow polling and zero retry invocations.

| Position / case | Input | Output | Thinking | Conservative micros |
| --- | ---: | ---: | ---: | ---: |
| 0 / contact-only | 1,594 | 195 | 1,113 | 29,348 |
| 1 / natal-only | 1,925 | 203 | 1,316 | 34,230 |
| 2 / transit-only | 1,932 | 258 | 1,590 | 40,824 |
| 3 / natal-and-transit | 2,263 | 234 | 3,555 | 80,306 |
| 4 / synthesis-natal-and-transit | 2,807 | 289 | 2,988 | 71,154 |
| Total | 10,521 | 1,179 | 10,562 | 255,862 |

Each usage receipt satisfies `total = input + output + thinking` and `outputIncludesThinking = false`. Independently applying `2 × input + 20 × (output + thinking)` yields **255,862 micros, or $0.255862**, exactly matching the database, per-position ledger and summary. Before every position, previously settled estimates plus the next 2,800,000-micro reservation remain within the 5,000,000-micro ceiling. Final `reservedMicros` values are settled conservative estimates, not original reservations or provider invoices. The stored attempt limit is five; the review reserve is zero. All five authorized provider attempts are consumed.

Every individual case export equals its `run.results` entry, ledger raw entry and parsed original serialized database result. Independently recomputed original database-result byte counts and hashes match the receipt:

| Case | Original result UTF-8 bytes | Original result SHA-256 |
| --- | ---: | --- |
| contact-only | 15,850 | `3d2958e498f1a0e96c651eda11252b00f6366ed6665265a46ea49971f294a57f` |
| natal-only | 21,587 | `904ccc29830dac127e792a1934e78d4abf5cf90f47de6d80c82378697e065dab` |
| transit-only | 45,923 | `ee9cb54d0627b5da8ce95fc5f3eb4ac504f9902968dd102d7bbbbad36ccf9a0e` |
| natal-and-transit | 51,664 | `b7bdd32269bf6e50ac0eaf63896b7d5e1ae6ebb7f8ec4123b49b585847bdf024` |
| synthesis-natal-and-transit | 56,189 | `88b004a2b2215b9b1d57a96baf4f25f1ea93e092f3cf9708f6107bd4cf918b42` |

Each candidate contains two captured paragraphs with `text`, `facts` and `scenes`, `captureLossless: true`, and `truncated: false`. The delivered body equals those paragraph texts joined with blank lines, and every delivery mode is `model`. Headline and reflection equal the separately authored frozen fields; the complete authored benchmark body remains stored separately as fallback. Replaying only the captured paragraph objects through intercepted transport preserves the saved candidate and delivered body in all five cases.

The capture's lossless claim is limited to these expected paragraph fields. Source inspection confirms bounded, explicit capture before validation. The records do not retain the entire unparsed HTTP response, every possible extra JSON field, or provider thinking text. An HTTP- or thinking-level forensic completeness claim would exceed this evidence.

The review-packet exact byte hashes also match `summary.json`: reader packet `c5ec808225a65438002c1c1d6807f6397d7043f6f676bbdf5758e65023cef9bc`; source packet `b01bae81b0561ed223955d335210a8151bc290657d5ac3e6a8ee72f6d788d71e`. Each blinded reader-packet body matches its captured body and the case/position recorded in `blind-mapping.json`.

## Source verification, browser closure and durable completion

`deployment.json` records the matching serving source at **08:47:50.199Z**, with zero provider attempts before identity verification. This precedes run creation at **08:48:35.619Z** and the first provider start at **08:48:44.440Z**. The later `serving-verification.json` records HTTP 200 and the same source and deployment identity at **08:51:47.744Z**, with zero provider requests for that check. These are consistent saved observations; this reviewer made no fresh HTTP request.

The close receipt records browser closure at **08:48:51.874521Z**, with queued/zero-completed as its last known UI state. The first provider request was already running and finished at **08:48:53.998Z**. All four subsequent provider requests started after the recorded closure. Workflow observations show continued progression to five successful steps; the persisted run completed at **08:50:11.014Z**, and the Workflow ended at **08:50:11.300Z**. The browser was recorded as reopened for terminal capture at **08:50:19.791046Z**, after server completion.

This supports durable completion after the recorded browser closure. The closure and reopening receipts are operator observations, not independently authenticated browser traces. The saved accessibility snapshots expose only a notifications region and do not materially corroborate the admin workflow. Workflow status, the transport timestamps and persisted run/results supply the substantive server-completion evidence. The stale last-known queued label does not mean the server was still queued at closure.

## Cleanup and preservation

The baseline, cleanup and follow-up read-only cleanup verification contain the same complete active release row: ID `94b44ea7-65c3-490b-83ea-37baeff8bfd3`, version `0.9.0`, canonical checksum above, active flag and full publication-state string. Thus the observed active publication pointer and publication operation remain unchanged.

The two recorded historical run IDs remain `a7b75991-14eb-422e-b892-3a6cfd9ca596` and `e5b9b69d-7cb6-4527-af9d-15a79e89a080`; their baseline and follow-up fingerprint remains `d29c6b7d1740045063fb956530df414ae0b3bfcac4b61fe157c077b3888b12b9`. The local operational script fingerprints the selected historical `evaluation_runs` fields `id`, `status`, `completed`, `message`, `updated_at` and the complete stored `plan`. The matching saved receipts support preservation of those rows. They do not independently establish byte-for-byte equality of every historical `evaluation_results` row, which is outside that fingerprint, and this reviewer did not requery the database.

The temporary operator `19a3e356-8dcd-4aeb-b572-466916af5f6f` matches database run ownership and both cleanup receipts. The operational script checks the disabled-password sentinel before removing sessions, roles and profile. The application rejects a password hash without the supported PBKDF2 scheme, resolves sessions from the sessions table, and checks administrator authority through `user_roles`.

At **08:51:04.729Z**, the follow-up read-only cleanup recheck reports zero sessions, roles, profiles and member readings for this operator; one retained evaluation run and five results; and password login disabled. The disabled user is retained as evidence owner. This supports removal of temporary login-session/admin authority and preservation of the pilot evidence at that snapshot. It is not a global member-data audit or a live authentication test.

## Limits and decision boundary

This review qualifies saved execution-evidence consistency and selected source-code behavior locally. It does not independently authenticate remote export provenance, refresh remote state, establish billed cost, assess writing quality, qualify additional sources or tone/depth combinations, test human readers or devices, or demonstrate member use. It does not replace the separate source and reader reviews. No activation or additional provider campaign follows from five automatic accepts or from this evidence verdict.
