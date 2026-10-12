# Pattern Swiss Ephemeris service

Standalone AGPL-3.0-or-later chart and complete transit-episode calculator. This is an isolated service for the Lovable Pattern app; it does not modify the other project's `patternlike-calc` deployment. The Fly app is `pattern-transit-calc`, organization **imladris**, primary region **iad**.

## Local reproduction

Use Node 22 or later. From this directory:

```sh
npm ci
npm run ephe:download
npm test
node scripts/qualify.mjs dist/qualification
```

The package lock pins the complete native dependency graph. The ephemeris manifest pins upstream commit, byte lengths and SHA-256 hashes. Download or startup fails on mismatched files. Calculations reject non-Swiss returned flags; supported UTC coverage is conservatively 1800-01-02 through 2399-12-30. UTC is converted with `swe_utc_to_jd`, using its UT result with `swe_calc_ut`. Swiss's pre-1972 convention and built-in leap-second table belong to the pinned library version. Metadata names the exact files, frame and conversion.

`/v1/chart` accepts UTC date/time, `timezoneOffset: 0`, latitude and longitude, matching the app's existing client. Planets, analytic speeds, Placidus houses, angles and aspects come from Swiss; unavailable polar Placidus uses explicitly labelled Porphyry. `/v1/transit-episodes` implements `swiss-transit-episode/1`. Signed roots, speed reversals, branches/turns, orb edges and station-connected closure are retained, with conservative omissions at tangencies or resource limits. Individual requests begin at ±400 days and may extend unresolved sides to ±1,460 days.

The reference tool uses a separate hourly enumerator and root refinement, calling Swiss in ET through `swe_calc`; it imports no candidate numerical code. Its comparison is independent algorithmic verification against Swiss, not an independent ephemeris model or a claim of physical timing accuracy. Recorded qualification inputs are invented longitudes, not member birth records.

## HTTP and privacy

Set a random `SWISS_API_KEY` of at least 32 characters in the environment. Run `npm start` (port 8080, bound to 0.0.0.0). Both calculation routes accept `X-Api-Key` or `Authorization: Bearer`; conflicting credentials fail. No birth bodies, anchors, responses, credentials or errors containing them are logged. No derived-anchor cache, database or volume is used. A maximum of two child processes isolates the native library's global state. Oversized requests, overload and timeout fail closed, without retries. Computation is limited to 20,000 unique positions/four seconds, with a 4.5-second child-process deadline and 128 KiB output bound.

Public `/health` and `/v1/engine` show source metadata. `/source` links to `/source.tar.gz`, a complete service source distribution. The archive includes native binding/library sources, pinned dependency/build inputs, ephemeris files, licence, tests and instructions. It excludes the application tree and private environment. Rebuild the source distribution with `node scripts/source-archive.mjs`.

In production `RELEASE_GIT_SHA` must identify the source revision and the source archive must exist. Build from the service directory:

```sh
docker build --build-arg RELEASE_GIT_SHA="$(git rev-parse HEAD)" -t pattern-swiss .
```

## Deployment and app configuration

The app was created with `fly apps create pattern-transit-calc --org imladris`. Deploy from this directory with a Fly credential for **Imladris**, an imported `SWISS_API_KEY` secret, and `fly deploy --build-arg RELEASE_GIT_SHA=<reviewed-commit>`. The image runs its tests while building; native dependencies never enter the Lovable application build. One 512 MiB shared-CPU machine remains running to avoid cold-start delay.

After remote qualification, set these **server-only Lovable secrets** together:

```text
SWISS_EPHEMERIS_URL=https://pattern-transit-calc.fly.dev/v1/chart
SWISS_EPHEMERIS_KEY=<same value as Fly SWISS_API_KEY>
SWISS_TRANSIT_EPISODE_URL=https://pattern-transit-calc.fly.dev/v1/transit-episodes
SWISS_TRANSIT_EPISODE_SOURCE_ID=<exact reviewed sourceId from /v1/engine>
```

Existing AstroWay charts are not relabelled or silently migrated. The owner explicitly saves/recalculates their birth details, which makes the existing central/boundary calls and stores new encrypted source anchors. Old readings retain their original evidence. The combined content release remains inactive until deployment, settings and production checks establish both features' readiness.

Rollback: disable transit episode configuration and restore the prior chart URL/key and content-release pointers from the private deployment receipt. Preserve new charts' actual source identity; they must be recalculated through the owner's existing path if changing source again. Never overwrite archived readings or force-push Git history.

See `NOTICE` and `LICENSE` for the AGPL service/source offer and upstream attribution. No commercial licence is purchased or implied.
