# Limited daily reading release 0.9.0

The release uses the five reviewed authored contact readings and four authored quiet entries in [authored-readings.md](authored-readings.md). The numeric bundle is unchanged from the prepared candidate apart from its release version. Its canonical checksum is `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f`.

## Delivery decision

The five fresh Gemini attempts produced four automatically accepted responses and one rejection with a valid authored fallback. Editorial review found formal, repetitive wording in accepted responses and an unsupported frequency claim in the accepted Neptune response. Automatic acceptance did not establish the requested voice or complete source fidelity. Those generated responses are evidence, not approved member copy.

For this release, eligible member requests return the exact authored text, validate its source references, and record `authored_editorial`, `skipped`, and `attempted: false`. They make no language-provider request. Synthetic model evaluation remains available for future writing work. This authored delivery rule is explicitly pinned to `0.9.0`; a later release needs an explicit delivery and qualification decision.

The first validation run halted after two attempts. Its ledger and captures are unchanged. A separate pinned continuation tested only the three unattempted cases. Combined accounting is five attempts, zero retries, and $0.168724 in usage-derived conservative estimates, not an invoice. Both stages used runtime commit `fe8d717a046aaf396486e72ae175c0cf8ba3542a`, before the authored delivery decision. Their frozen runtime checks intentionally do not describe the later authored member implementation. Do not reprepare or reopen those historical runs.

## Scope

- Warm tone and standard depth, with the corresponding preference consent.
- Exact Mercury–Mercury conjunction, Venus–Venus opposition, the selected Saturn/Jupiter synthesis, Jupiter–Sun trine, and Neptune–Mercury square bindings; plus four rotating quiet observations.
- Selected natal or transit-story context keeps the existing writer and its N1/A1/P2 source references. Other tones, depths, and uncovered contacts also keep the existing writer.
- The new exact Neptune–Mercury interpretation is available to the existing writer as a source addition. Existing interpretation and synthesis text is preserved.
- Four quiet entries and five contact frames are a limited catalogue. This release does not establish long-term daily variation or member benefit.

## Publication

Release `0.9.0` is active on [Pattern](https://patterns.lakefrontdigital.io). The exact bundle was reviewed, staged and activated through the production admin functions, with the previous-version guard set to `0.7.1`. Publication completed, including the edge artifact. The deployed authored implementation is `2bfa7b3f8e6ad13e2184249ebaf65160d353d2ff`; [deployment](production/deployment.json) and [activation](production/activation.json) identify the exact code and content separately.

A temporary synthetic member with a service-calculated birth chart received the authored Jupiter–Sun reading through the real Today endpoint. The visible page matched the reviewed headline, two authored paragraphs and reflection, followed by the existing birth-time uncertainty caveat. Its encrypted body and writing evidence survived a real browser reload and saved export. The saved diagnostic is `authored_editorial`, `skipped`, `attempted: false`, with no output model. See the [member proof](production/member-proof.json) and [saved reading](production/member-reading.json). This is one hosted contact case; all nine authored entries and compatibility cases are covered by the offline tests.

Final verification passed 970 tests with four skips and no failures, plus build, TypeScript and scoped lint checks. Temporary member records, sessions and administrator access were removed. The disabled operator, published draft and two publication audit events remain for provenance. The historical failed pilot is unchanged. See [cleanup](production/cleanup.json).

The previous release `0.7.1` remains inactive and available for rollback; its normalized live bundle matched the candidate's frozen baseline.

Activation must compare the previous active version with `0.7.1`. Rollback uses the normal activation function for release ID `edcc53cf-d19a-415b-a8a2-a66040846b1d`, with expected previous version `0.9.0`. No deletion or rewrite of existing saved readings is required: the content version is part of Today’s cache identity.
