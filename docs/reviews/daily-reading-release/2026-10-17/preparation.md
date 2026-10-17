# Limited daily release preparation

Numeric release `0.9.0` promotes the exact candidate `0.9.0-editorial-pilot.1`; only the top-level version changes. Canonical publication checksum: `d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f`.

- [Bundle](bundle.json), [manifest](manifest.json), and [source bindings](source-bindings.json) freeze content and eligibility.
- [Authored reading copy](authored-readings.md) contains five contact fallbacks and four quiet readings for prose review.
- [Rollback reference](rollback-reference.json) records the saved 0.7.1 bundle and last verified production release ID/checksum separately. Its historical stored checksum differs from the current canonical hash; verify the live bundle and checksum algorithm before publication.

Existing interpretations, synthesis, natal, transit, phase and domain copy are preserved. One exact Neptune-square-Mercury interpretation and the editorial catalogue are added. Graph validation and warm/standard selection pass; plain remains outside this release's editorial scope. Parent release references are derived as 0.9.0 at selection time; no embedded candidate-version child references remain.

Run `node scripts/prepare-editorial-release.mjs --verify` to compare these exact artifacts with their sources. Omitting `--verify` rewrites only this preparation's artifact files. Vite config and environment-file loading are disabled, and every fetch throws.

This record proves offline packaging and bindings. Runtime compatibility, generated prose, actual member save/reload, publication, activation and production member use are recorded separately. Historical pilot artifacts are unchanged.
