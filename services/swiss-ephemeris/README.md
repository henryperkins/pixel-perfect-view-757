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

`/v1/astronomy-events` implements `swiss-astronomy-events/1`: a half-open range of at most 366 days, native new/full Moon geometry, and independently calculated global eclipse classifications. Its upper coverage bound is 2399-01-01; the remaining pinned year is reserved for native shadow searches. Local visibility and personal interpretations are not calculated.

`/v1/solar-context` implements `swiss-solar-context/1`: an explicit civil day, timezone, range and supplied coordinates. It returns native apparent upper-limb sunrise/sunset at sea level with 1013.25 hPa and 15°C assumptions, including absent polar events. The app sends only a consented one-degree current-location grid; the service does not infer a current location from birthplace.

`/v1/upcoming-cycles` implements `swiss-upcoming-cycles/1` / `upcoming-cycles-1`. It scans up to 365 elapsed days for all supported bodies/aspects with at most three natal targets per request. Each target supplies three screened birth-time samples. The app partitions nine targets into three disjoint requests. Active, upcoming and uncertain windows retain all exact passes, sampled time ranges and stable source/anchor-bound IDs. Duration is short under seven days, medium through thirty, long above thirty, or unknown when bounds are unavailable. Per-request lists retain at most 40 active, 40 upcoming and 20 uncertain windows; counts, truncation and incomplete matches remain explicit. A partial response is never a complete inventory.

The new future path has a separate ceiling of 120,000 cached positions and four seconds. Only one future request can occupy a child-process slot; the second slot remains available for chart calculations. The original transit-episode defaults and natal Placidus calculation are unchanged. All five calculation routes require credentials and share the request/output bounds below. No calculation request is retried.

Run `node scripts/qualify-astronomy.mjs dist/astronomy-qualification` for the 27 frozen reference/resource cases. Phase instants and solar events must match independently captured native results within 60 seconds; phase longitudes and future root/orb-edge residuals must remain within 0.001°. The three full-year groups use an invented precise chart, including angles, and exercise the actual resource limits. This compares independent code paths through the same pinned ephemeris, rather than an independent astronomical model or a guarantee of observed timing accuracy.

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
