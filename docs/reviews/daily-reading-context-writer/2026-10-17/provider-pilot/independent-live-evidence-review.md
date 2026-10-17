# Independent live-evidence review

Reviewed on 2026-10-17 using saved pilot artifacts and local source only. No network, provider request, database mutation, runtime edit, or commit was performed by this reviewer.

**Evidence verdict: the saved records consistently establish completion of the bounded five-attempt pilot, with no material internal evidence inconsistency found. Writing qualification remains failed.** Automatic acceptance is structural; it cannot override the separate reader and grounding reviews.

## Identity and scope

| Item | Independently checked identity |
| --- | --- |
| Run / Workflow instance | `e5b9b69d-7cb6-4527-af9d-15a79e89a080` |
| Runtime source | `be0522bcc86187280fd8c2951b8dac1a3f1fdd54` |
| Hosted frozen plan | `b9d70a46fac7d7379a1dd9b79ede5987beb55d47a918fdc9f8db86b7275ffbba` |
| Serving deployment recorded before dispatch | `43b3a438-c357-4338-9a9a-885e90554d45` |
| Reviewed benchmark bytes | `825c877dbb88d5d20d39a12abfd67cea01781506250db93d44ae7c9885b35024` |
| Candidate canonical checksum | `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f` |

The plan hash was recomputed from the full `preview.json` plan using the application's `JSON.stringify` convention, excluding its final `hash` field. It matches both the expected hosted identity and the full plan saved in `run.json` and the private original database export. The benchmark bytes hash, candidate canonical checksum, ordinary candidate hash, and manifest case-set hash were also recomputed successfully. All result metadata carries the same runtime source and plan hash. The provider is Gemini Enterprise and every receipt reports actual model `gemini-3.8-flash`, HTTP 200, STOP, no abort, and the configured 60,000 ms deadline.

`deployment.json` records the matching serving identity at 08:24:07.620Z, before run creation at 08:24:44.826Z and the first provider start at 08:24:51.705Z. It explicitly retains the earlier publication/source mismatch and reports zero provider attempts before identity verification. This review verifies consistency of that saved observation; it did not make a fresh HTTP request.

The runtime identifier above belongs to the executed experiment. Later documentation/evidence commits have a separate purpose and must not replace it in pilot provenance. At review, `git diff be0522bcc86187280fd8c2951b8dac1a3f1fdd54 -- src edge` was empty. The deployed source's member route still selects the reviewed authored `0.9.0` release, while the context writer is reached through the synthetic seam.

## Attempts, captures, and accounting

`run.json`, the original database export, and `database-receipt.json` agree on exactly five attempted, stored positions in the approved order. `workflow-status.json` independently records five successful steps, each with one attempt and retry limit zero. Each case has a distinct response ID. The run is complete with five results; no uncertain capture is present.

| Position / case | Input | Output | Thinking | Conservative micros |
| --- | ---: | ---: | ---: | ---: |
| 0 / contact-only | 1,383 | 180 | 1,009 | 26,546 |
| 1 / natal-only | 1,581 | 182 | 3,695 | 80,702 |
| 2 / transit-only | 1,541 | 192 | 2,817 | 63,262 |
| 3 / natal-and-transit | 1,739 | 221 | 1,259 | 33,078 |
| 4 / synthesis-natal-and-transit | 2,036 | 314 | 3,042 | 71,192 |
| Total | 8,280 | 1,089 | 11,822 | 274,780 |

All native usage receipts satisfy `total = input + output + thinking` with `outputIncludesThinking = false`. Recomputing `2 × input + 20 × (output + thinking)` gives **274,780 micros, or $0.274780**, exactly matching the per-position database amounts, run ledger, and summary. The $2.80 initial reservation plus previously settled estimates remains below the $5 ceiling before every position. Final `reservedMicros` values are settled conservative estimates, not the original reservations or provider invoices. No paid-review reserve is present. All five authorized provider attempts are consumed.

For all five cases, the individual JSON export equals its `run.results` entry, ledger raw entry, and parsed original database result. The original serialized database result bytes and SHA-256 match every `database-receipt.json` entry: 14,407; 19,222; 43,109; 48,647; and 52,202 bytes respectively. Thus the public case exports preserve the stored results, including generated paragraph text, references, transport, diagnostics, and authored fallback.

Each candidate contains two paragraphs, `captureLossless: true`, and `truncated: false`. The accepted body is exactly those paragraph texts joined with blank lines; every delivery mode is `model`. Authored headlines and reflections match the frozen plan, and the authored benchmark body remains separate. The reader and source packet byte hashes match `summary.json`; the blinded reader bodies also match the captured paragraph texts and `blind-mapping.json` positions.

The word "raw" here means the captured generated paragraph fields. Source inspection confirms that capture preserves bounded `text`, `facts`, and `scenes` before validation. These artifacts do not retain the complete unparsed HTTP response, every possible extra JSON field, or provider thinking text. The lossless flag applies to the expected paragraph fields, not a forensic archive of the entire provider response.

## Durable completion and cleanup

`admin-page-closed.json` records closure at **08:25:13.224Z**, with one completed attempt at its last read. The second provider request had already started at 08:25:02.655Z and finished at 08:25:25.211Z. The remaining three provider requests started after closure. The server Workflow ended successfully at 08:26:22.369Z with five steps, and the persisted run reached five completed cases at 08:26:22.078Z. This supports completion after the recorded browser closure. It would be inaccurate to say all four remaining requests began after closure.

The closure file is an operator observation rather than an independently authenticated browser trace. The saved browser accessibility snapshots provide little substantive corroboration. The separate Workflow status and database captures provide the actual server-completion evidence; this review did not repeat the closure experiment.

The active release row in `baseline.json`, `cleanup.json`, and `cleanup-verification.json` is identical, including ID, version `0.9.0`, checksum, active flag, and full publication-state string. The follow-up read-only recheck records the same historical-run fingerprint as the baseline. These are snapshots supporting unchanged publication state and preservation of the historical run; they are not a global audit of every member record or an authenticated member-flow test.

The temporary operator identity matches setup, run ownership, and cleanup. The cleanup implementation checks the disabled password-login sentinel before removing sessions, roles, and profile. The 08:32:01.364Z read-only cleanup recheck reports **zero sessions, roles, profiles, and member readings; one evaluation run; five evaluation results; password login disabled**. The disabled user is retained as evidence owner. This supports revocation of the temporary session/admin authority and preservation of evaluation evidence at that snapshot.

## Qualification and limits

The separate AI reader review fails all five bodies against the authored benchmark thresholds. The separate source review identifies a blocking unsupported recent onset in the contact-only body; the four context-bearing bodies score 2/5 integration. Their reviews assess different questions from this evidence-integrity review. Five automatic accepts therefore establish neither editorial acceptance nor semantic grounding.

This review found no evidence defect requiring another provider attempt. It verifies saved-record consistency and selected source semantics locally; it does not independently authenticate remote export provenance, refresh deployment or database state, establish provider billing, or qualify other sources, tone/depth combinations, consecutive days, physical devices, human readers, or member use. The completed pilot provides no authorization or evidence basis for candidate activation or further model calls.
