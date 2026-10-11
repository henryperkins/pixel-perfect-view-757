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

## Synthesis source contract

Daily policy versions are `daily-synthesis-1`, `daily-astro-body-8`, and
`daily-reference-5`; built-in fallback content is `builtin-0.5.0`, schema version 2.
Prompt `daily-astro-body-8` keeps each claim at its source's strength; its identity
change regenerates each reader's Today once and leaves older rows and feedback intact.
The inactive natal candidate `builtin-0.6.0` (schema 3) adds only the lens catalogue
and goes live only as an explicitly activated release.
Lookup checks exact aspect/body/point, exact aspect/body/_, exact aspect/_/point,
then exact aspect/_/_. Only then does it check the corresponding four aspect-family
keys in the same order. An explicit active array replaces the built-in catalogue;
legacy entries receive no inferred themes and absent legacy rules normalize to `[]`.
When a partial legacy release omits its catalogue, fallback entries carry no new
theme approvals. An explicit empty catalogue remains authoritative; a bundle with
neither a catalogue nor framing content is invalid.

`I1`, `I2`, and `I3` refer to the same-index calculated cycles. The reviewed ordered
`C1/C2` pair can produce one `S1`, or remain independent/unmatched. Missing, wildcard,
suppressed, weak, nonfinite, and fourth-or-lower contacts cannot supply synthesis.
Equal importance uses `cycle_key` as a stable tie-breaker. The template places the
selected relationship once after the primary mechanism; gateway failure and draft
rejection return that same body.

A unique, acyclic fact graph is checked before provider traffic. `S1` needs all four
parents, a rule key, and one matching content version, with no geometry payload.
Paragraph 1 keeps `C1/I1`; paragraph 1 or 2 must cite `S1` when supplied, and every
use cites `C1/I1/C2/I2` explicitly. Supporting meanings may support ordinary prose;
technical claims still need the direct matching calculated cycle. These checks
verify bounded contradictions and dependencies, not arbitrary semantic truth.

Safe fact metadata and bounded plan identity are persisted in `language_meta`,
with tolerant historical readers and no database migration. Cached evidence never
reconstructs editorial meaning from current copy. Available but uncited meanings
remain supplied references rather than consumed model evidence. The cache digest
now includes plan, prompt, validator, and configured model identity alongside the
existing chart, date, bundle, context, and permission inputs. Rollback can reuse a
matching old reading without rewriting its sources or feedback.

Drafting requests only the reusable family slots and overlays the replies onto the
effective bundle, so reviewed exact-aspect entries and their rules are never sent
for rewriting. A repeated or unpublishable drafted entry is dropped on its own.
Edited mechanisms lose theme approval and dependent rules enter
`synthesisReviewRequired`; unchanged reviewed entries remain.
All load, publication, activation, signed ingest, and rollback paths validate before
changing state. Identical version replay reuses the original row/checksum; differing
content under the same version returns 409. New candidates stay inactive until
explicit publication/activation.
Concurrent same-version inserts reread the winning row and apply the same reuse
or conflict response; the request that inserted the row owns its activation. A
later identical replay leaves an active row unchanged. If it finds the row inactive,
such as a retry after a failed activation, it completes that activation, pointer
sync and build trigger. As before this change, replaying a superseded version
therefore makes it active again.

The separate skip reasons are `no_cycle` and `no_interpretation`. Both avoid model
traffic and are excluded from attempt-based fallback rates. The model remains
`google/gemini-3.7-flash`, with one strict-schema call and a 20,000 ms daily deadline.
Wellbeing bands, local-time framing, private notes, and authoring notes remain local.

## Natal lens source contract

The schema-3 graph extends schema 2 without replacing synthesis. Missing legacy
`natalLenses` normalize to `[]`; explicit empty arrays are authoritative. Cycle
drafting preserves the catalogue verbatim. Rule bounds, roles, same-body selectors,
canonical duplicates, safety, technical-claim and bounded certainty/clinical checks
are enforced at every existing content lifecycle boundary. The 62-entry catalogue's
agent editorial review is recorded separately from independent approval and writing
qualification; structural checks cannot approve psychological claims.

`natal-reliability-1` binds the snapshot fingerprint and declared accuracy to exactly
three service samples with one coherent engine/version. Signs require ≥1° margins
and consistent positions; aspects require raw membership/orbs, service provenance
and longitude agreement within 0.05°; exact-time Placidus houses require service
cusps/angles, stable membership and ≥0.5° cusp margins. Proofs for the same body must
share their sampled longitudes. Missing house/aspect sources only exclude their
items; degraded positions make the whole window unavailable. Known-time birth saves
reuse the center and fetch two concurrent UTC-offset boundaries with six-second
deadlines and no retry. Unknown/degraded centers add no requests. Today decrypts
the saved manifest once. Only while the active release carries a catalogue does it
re-run a missing, stale-version or retryably failed (`service_unavailable`,
`invalid_sample`) screen through the same birth calculation, before the reading's
identity is computed, at most once per six hours per snapshot and never for an
unknown time. It stores only an improvement (a screened result or a no-longer-degraded
chart); otherwise it records the attempt time, which never enters a reading's identity.
A manifest from another reliability version is stale, not corrupt: it supplies no lens.

`daily-natal-lens-2` selects one optional lens relevant to published `C1/I1`. The
transited body's own rules lead in service aspect → Placidus house → sign order; Moon
rules in the same order are the fallback for other personal targets. Opaque keys
break ties by code point. It never uses weaker contacts, wellness, journal,
feedback, feature scores or inferred keywords. The template appends its exact
mechanism inside the primary paragraph; model facts use that same selection.

`N1` carries only the curated conditional meaning in the provider fact block. Its
local typed metadata/proofs stay out of serialization. Every model use explicitly
cites `N1/C1/I1`, with coverage in paragraph 1 or 2; synthesis can share that paragraph.
A request without `N1` carries no natal instruction, so it matches the pre-lens
brief byte for byte. `natal_coverage` and `natal_claim` are closed diagnostics. Placements, natal aspects,
suppression, technical geometry, safety, response shape, model and request budget
remain guarded. Bounded lexical checks do not prove meaningful integration or catch
every stereotype; those require the blinded writing gate.

`houses.natalReliability_ct` and `language_meta.natal_lens_ct` use the owner's DEK.
The version-1 reading envelope saves the selected plan, `N1`, and exact consumed
paragraph IDs. Its private `screen` labels retain declared accuracy, offsets and
service engine identities so an archive does not borrow today's source labels.
Clear metadata contains other facts, safe fact order, counts, statuses and versions;
new source rows contain source IDs and actual `N1` paragraph IDs, not copy or origins.
Broken present assessments/envelopes fail read-back before fresh model work rather
than being replaced with invented evidence. Legacy absent assessments remain valid.

Cache identity uses canonical decrypted assessment data, policy versions, chart
metadata, immutable copy version, model and existing context inputs. Randomized
assessment ciphertext is excluded. Same assessed state reuses its row; an assessment
or source upgrade creates a new row and preserves older feedback. Owner export
includes exact saved reading evidence and paragraph boundaries for all saved daily
rows. A row whose text, paragraphs or evidence cannot be read is exported with an
`unreadable` marker and counted, never reconstructed; owner reads of that row still
fail closed. A failed export query or deletion is explicit, and a failed deletion
retains the DEK for retry. Erasure removes the envelopes through existing rows, also
deletes chapter essays (their clear feature keys can name chart placements), and
clears the birth fingerprint from retained audit events. No profile table or
temperament cohort is added. Production quality reporting never decrypts the lens.
