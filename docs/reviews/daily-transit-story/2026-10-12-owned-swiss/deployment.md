# Fly deployment and remaining application connection

`pattern-transit-calc` is deployed in **Imladris**, region `iad`, on one shared-CPU 512 MiB machine. The deployed service revision is `4d217d9db60f393e55a891de53d632e9626c4321`; the image digest, machine identity, source ID and timings are in [deployment.json](deployment.json).

Source commit `3143a0f` was pushed normally to `main` and synchronized exactly into Lovable. A Lovable publish request was accepted; the live entry, privacy and birth-page JavaScript assets match the gated local build byte-for-byte. [publication.json](publication.json) records those checks. This proves the published frontend assets, while the app's server runtime commit and new secret configuration are not independently exposed by that check.

- Public [health](https://pattern-transit-calc.fly.dev/health), engine metadata and [source offer](https://pattern-transit-calc.fly.dev/source) identify the expected revision and calculation source. Fly's health check is passing.
- Both calculation routes return 401 without credentials. An independent generated key is stored in Fly secrets and a private operator file, never in Git or the source archive.
- Two synthetic chart requests return Placidus and the expected source. All 15 remote episode scans exactly match their locally qualified scans and pass the application's existing proof validator. Six tangent/out-of-range requests return the expected closed errors. Full synthetic responses and timings are retained in [live-probes.json](live-probes.json).
- The slowest measured calculation HTTP request took 257.284 ms, below the app's six-second deadline. Every request creates a fresh native calculation process; these observations do not establish performance under sustained traffic or a stopped-machine restart. The machine is configured to stay running.
- The public source archive's 189 file hashes and release revision were checked. It contains the native Swiss sources, service code, tests, build inputs and pinned data, with no API key or environment file.

Remote reproduction from the repository root, using a private environment file containing `SWISS_API_KEY`:

```sh
node --env-file=<private-key-file> docs/reviews/daily-transit-story/2026-10-12-owned-swiss/verify-http.mjs https://pattern-transit-calc.fly.dev 4d217d9db60f393e55a891de53d632e9626c4321 /tmp/swiss-live-check.json
```

## Remaining connection

The operator must set these four **server-only Lovable secrets** together. The private operator settings file contains the generated key; the connected Lovable tools provide no secret editor.

```text
SWISS_EPHEMERIS_URL=https://pattern-transit-calc.fly.dev/v1/chart
SWISS_EPHEMERIS_KEY=<same private value as Fly SWISS_API_KEY>
SWISS_TRANSIT_EPISODE_URL=https://pattern-transit-calc.fly.dev/v1/transit-episodes
SWISS_TRANSIT_EPISODE_SOURCE_ID=pattern-swiss-1:c8ebf2f4f7e7f377aa22ff0776a8e54a
```

Then publish the current Lovable revision, verify a synthetic exact-time chart/anchor path through the deployed app, and activate the already reviewed combined `0.7.1` release. At this receipt, neither content candidate is active. The database still has no active `content_releases` row and its mirror remains `editorial-1.0.0`. Do not substitute Fly health or a Git push for application configuration evidence.

Existing owners explicitly save/recalculate their birth details. No existing AstroWay source is relabelled. Historical readings retain their original evidence. The separate `patternlike-calc` service is unchanged.

## Rollback

Disable the two transit episode settings and restore the prior AstroWay chart URL/key from the operator's secret store. The prior deployed key is not readable through the connected tools. If content has since been activated, restore both the content pointer and its mirror from the pre-activation receipt. Preserve actual chart provenance and archived readings; changing provider again requires explicit recalculation. The Fly service can remain available while the application points back to AstroWay.
