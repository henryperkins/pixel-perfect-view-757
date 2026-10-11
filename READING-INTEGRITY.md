# Reading integrity audit

Implemented 2026-10-11. Verification uses isolated local fixtures, not a live
signed-in account or external model. No production migration or publication was
performed.

| Finding                               | Result                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Check-in consent bypass            | USR-04 permission is checked before framing. Mood/energy remain privately storable without enabling reading use.                                                                                                                                                                                        |
| 2. External wellbeing processing      | Mood, energy, sleep, stress and local-time context are excluded from language requests. The registry separately permits `external_language` only for chart-derived sources and consented ordinary tone/depth preferences. Privacy explains the Google Gemini/Lovable gateway boundary.                  |
| 3. No eligible cycle                  | Quiet days have a readable deterministic body and skip the model.                                                                                                                                                                                                                                       |
| 4. Different cycle sets               | Both paths share the same ranked, thresholded, suppression-aware top three cycles.                                                                                                                                                                                                                      |
| 5. Different reflection questions     | Headline and reflection are deterministic, including permitted sleep/stress adjustments. Only the astronomical body may be rewritten.                                                                                                                                                                   |
| 6. Inaccurate provenance              | Model readings omit template-copy claims and identify the curated references actually cited. Fact statements are persisted and restored with cached model readings. Local context provenance describes the locally appended copy.                                                                       |
| 7. Citation membership versus support | Checks enforce supplied IDs, editorial coverage and certain numerical/astronomical contradictions. UI and code explicitly describe their limits: they cannot prove arbitrary semantic support.                                                                                                          |
| 8. Suppression/shape unchecked        | Daily drafts fall back as a whole on suppressed house/angle wording, unknown placements, checked contradictions, safety flags, malformed data or invalid paragraph/sentence/word bounds. These are conservative bounded checks, not a complete semantic verifier.                                       |
| 9. Stale readings                     | Versioned HMAC context keys include consent, effective preferences, framed bands, ambient bucket, timezone and chart metadata. Changed/cleared bands refresh Today; note-only edits reuse prose. Old reading IDs and feedback are preserved. Legacy pre-fix daily rows are excluded from current reuse. |
| 10. UTC noon/local dates              | Calculation uses noon in the effective timezone. Exact-pass dates, phase labels and timelines use the same calendar. DEV-01 off selects UTC consistently. Date-only travel arithmetic stays date-only.                                                                                                  |
| 11. Tone/depth                        | Unsupported or absent tone normalizes to plain. Standard and technical depth affect template detail; model preferences use the same normalized values. USR-01/USR-02 consent applies to preferences, including natal tone and its cache key.                                                            |
| 12. Curated copy absent               | Model inputs include the selected interpretation, domain, phase and timing text from the active content bundle.                                                                                                                                                                                         |

The birth-cache checks also cover A→B→A edits and tied timestamps: snapshot
selection follows the current birth fingerprint rather than the newest-created
row. Browser checks cover phone and desktop layouts, keyboard source switches,
date-picker preservation, day rollover and account changes.

Run `npm test` with Node.js 24. The checked-in suites exercise real signed SQL,
AES-GCM, server functions and language validation with temporary SQLite storage and
intercepted model responses. External requests are blocked. Live-account
save/read-back and generated-model quality acceptance remain open.
