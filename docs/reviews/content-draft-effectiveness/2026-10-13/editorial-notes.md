# Editorial revision of the fallback entries

The proposed [editorial delta](revised-fallback-entries.json) replaces all 22 changed mechanism/question pairs. It contains 20 body-specific entries and the two global catch-alls, with no additional bundle fields. Its current version is `2026-10-13.2`; its raw-file SHA-256 is `78be37d2740102c827fd291777f43f686b9c9f3488c887d76c00212ca84db632`. The initial `2026-10-13.1` round had checksum `37c4f88bcce0cfdb8c2210065063efa89f3892912f7eb30e9b03e7604995a261`; the second round removes repeated explanatory framing and awkward wording identified during source review. This is an artifact checksum, not a complete-bundle or canonical content checksum.

The copy was authored and reviewed locally without model requests. It remains proposed copy. Authoring this delta by itself neither changes a saved draft nor records human editorial approval. The authoritative save and current release state are recorded separately in [the publication decision](publication-decision.md).

## Editorial decisions

Each mechanism has one hypothetical everyday comparison and a distinct reflective contrast. The comparisons do not establish events in a reader's life. No entry says a planet causes behavior, imposes change, diagnoses a problem or promises an outcome. The mechanisms vary between two and three sentences, with both scene-first and distinction-first openings. The separate questions deliberately retain an explicit “if any,” “if anything” or “if anywhere” so a reader can reject the premise. This repetition serves the question's purpose; the mechanisms no longer share the original three-part formula.

| Entry            | Disposition and distinction                                                          | Conditional comparison                                     |
| ---------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `hard:saturn:*`  | Revised: commitment can matter independently of available capacity.                  | A task and its allotted hour.                              |
| `soft:saturn:*`  | Revised: a routine can fit an ordinary pace.                                         | A small recurring task between ordinary activities.        |
| `hard:jupiter:*` | Revised: appealing added scope can exceed unchanged room.                            | Another book on a reading list.                            |
| `soft:jupiter:*` | Revised: another option need not enlarge the plan.                                   | Two possible nearby visits during one spare hour.          |
| `hard:mars:*`    | Revised: urgency and task pace can differ.                                           | A reply started before a question is fully explained.      |
| `soft:mars:*`    | Revised: effort can have a clear next action.                                        | A loose shelf with its screw and tool available.           |
| `hard:venus:*`   | Revised: a familiar choice can be considered alongside present preference.           | An imagined menu and the usual order.                      |
| `soft:venus:*`   | Revised: a small preference can be easy to name.                                     | Wanting a particular song while making a meal.             |
| `hard:mercury:*` | Revised: intended meaning and wording are separate.                                  | Rereading a message before sending.                        |
| `soft:mercury:*` | Revised: a thought can take an understandable form.                                  | Three steps finding a useful order on a note.              |
| `hard:sun:*`     | Revised: a role's description and the focus of attention can differ.                 | An organizer attending to one event detail.                |
| `soft:sun:*`     | Revised: a chosen activity can fit a description.                                    | Making a small object by hand.                             |
| `hard:moon:*`    | Revised: a passing moment can differ from a familiar rhythm without making it wrong. | An empty kitchen during an hour set aside for cooking.     |
| `soft:moon:*`    | Revised: an ordinary arrangement can be comfortable as it is.                        | A chair positioned where the light suits a page.           |
| `hard:uranus:*`  | Revised: a useful arrangement can leave little room for a different approach.        | A desk layout accommodating one task but crowding another. |
| `soft:uranus:*`  | Revised: a small alternative need not force disruption.                              | Sorting a few files in another order.                      |
| `hard:neptune:*` | Revised: a vivid impression and incomplete detail can coexist.                       | A blurred photograph.                                      |
| `soft:neptune:*` | Revised: imagination can leave uncertainty explicit.                                 | Several possible shapes in an unfinished sketch.           |
| `hard:pluto:*`   | Revised: established and negotiable parts can be distinguished.                      | A meeting's fixed time and changeable agenda.              |
| `soft:pluto:*`   | Revised: a lasting priority can receive deliberate attention.                        | Choosing one item to keep in a personal collection.        |
| `hard:*:*`       | Revised: competing preferences do not imply an error or required resolution.         | A quiet afternoon and a lively gathering in the same plan. |
| `soft:*:*`       | Revised: ease does not require a productive outcome.                                 | A simple request that is easily understood.                |

All 22 source questions are single, open questions. Each can be answered “nothing” or “that does not fit”; none requires accepting an imbalance, a boundary problem, a changed preference or a duty to improve. This is an author review of source questions. The existing schema-4 composition can append a separate domain question, which still requires review in the assembled reading.

## Future drafting contract

`generateBundleEntries` now returns `promptVersion: "bundle-draft-v2"`, includes the distinct hard/soft briefs above, and asks for conditional comparisons, varied structure and non-presumptive questions. The strict `key`/`mechanism`/`question` response schema and existing filtering/safety pass remain in place. New saved draft notes must persist that returned version, separately from the selected provider's own model identity.

Two mocked contract tests cover Lovable and Gemini Enterprise, including 22 requested slots, separate schema fields, dropped unrequested/empty entries and exactly one provider request. Both tests failed for the missing prompt version before the implementation and then passed. A lifecycle assertion was added to require the version in saved draft notes; it was observed failing before the persistence change and passing afterward. The full releases test file passed 13/13 tests. No real provider was called for these tests or this revision.

## Applying and reviewing the delta

Use the authoritative complete saved draft and its stored baseline. Submit these 22 mechanism/question replacements through `editContentDraft` with the expected candidate hash; retain empty themes on the changed entries. Preserve the 24 inherited cycle entries, 62 lenses, five transit chapters, six synthesis rules, other sections and stored baseline. Confirm the full diff contains only the intended copy changes, approval is cleared and new canonical hashes are recorded. The delta file alone cannot prove that preservation.

The copied attachment catalogue is suitable for repeatable local coverage checks, but it is not an authoritative complete release. Do not publish a bundle reconstructed from that catalogue or from this delta. Check complete-bundle templates, source facts, final prompts and unchanged precedence after the authoritative edit.

The authorized live scope is four fixed cases in `draft-pilot-1` across baseline and candidate: hard Mars, hard Uranus, soft Saturn and soft Neptune. At most eight generation attempts may run under a $5 total generation cap; failed or uncertain requests are never retried. Full 70-case coverage remains offline. This pilot does not qualify all 20 reachable additions, the shadowed catch-alls, production usage, or human approval of the exact release. See [publication decision](publication-decision.md).

## Revision 2026-10-13.2

An independent source review identified three awkward/redundant passages and repeated explanations of the comparison. Those phrases were revised locally before any live generation. The [source review](source-editorial-review.md) records findings, correction and re-review. The first revision is preserved in `prior-editorial-revision.json`; the final bundle hash is `78be37d2740102c827fd291777f43f686b9c9f3488c887d76c00212ca84db632`. The 22 questions and every inherited entry/ancillary section remain unchanged by this refinement.
