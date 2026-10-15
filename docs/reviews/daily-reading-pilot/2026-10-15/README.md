# Daily editorial pilot preparation

Candidate `0.9.0-editorial-pilot.1` is an inactive schema-6 proposal based on saved content `0.7.1`. It adds one exact Neptune–Mercury source, five source-bound editorial frames, and four source-free quiet entries. Every existing interpretation and synthesis rule is preserved.

- [Application fallback preview](preview.md): six exact historical synthetic cases, warm tone and standard depth.
- [Quiet repertoire](quiet-preview.md): working benchmark plus three provisional observations needing reader review.
- [Frozen candidate](candidate.json), [machine preview](preview.json), and [manifest](manifest.json): exact source, input, and artifact identities.

Run `node scripts/prepare-editorial-pilot.mjs` to refresh this offline preparation, or append `--verify` to require exact existing artifacts. The script disables Vite environment-file loading and throws on every fetch attempt. It invokes no provider, database, ephemeris service, publication, or activation endpoint.

These artifacts verify candidate selection and authored fallback wiring. They do not establish fresh generated-writing quality, human approval, successive-day variation, or member response. The pilot version intentionally remains a descriptive prerelease identifier; it is not a publishable numeric release version.

## Running the bounded pilot

The committed app runtime must be deployed before generation: the existing build-identity guard refuses an uncommitted source tree, and the existing Workflow calls the signed public evaluation-step endpoint. The Worker protocol is unchanged. This preparation has not committed, deployed, or started a run.

In `/content`, an administrator can use **Inactive daily editorial pilot → Preview exact pilot** to inspect the frozen candidate, provider/model, source SHA, and plan hash. **Start five-attempt pilot** starts one retained campaign with nine positions: five possible model responses and four authored quiet outputs. The generation ceiling is $5; failed or uncertain requests are not retried. The panel can recover a saved run, stop after the current case, and download its plan and captured evidence.

Review each captured outcome before scoring the prose: an authored fallback after a rejected or failed response is not accepted model writing. Score recognition, meaning, direction, distinctness, and voice against the frozen reader rubric; check astrology support, independent reflections, and repetition across the set. Human approval remains pending even when automated checks pass.

This pilot deliberately omits natal-lens and transit-story integration. Existing coverage guards remain in force; full-context qualification is required before any member activation. The four quiet dates establish a deterministic editorial repertoire, not repeated-day model behavior.
