# Transit episode source qualification

Status: OPEN. No qualified native service identity is configured. Ordinary readings remain available; synthetic scans do not establish astronomical accuracy.

The follow-up [source discovery](source-discovery.md) identifies the chart provider as AstroWay. Lovable's historical configuration records specify `https://api.astroway.info/v1/chart`. AstroWay publishes SDKs and an OpenAPI specification, but no accessible backend calculation repository was located. The proposed `/v1/transit-episodes` endpoint is absent from the inspected GitHub specification snapshot. An owned editable service therefore remains an unfulfilled plan assumption.

The upstream library source is [Astrodienst's Swiss Ephemeris repository](https://github.com/aloistr/swisseph). A local `patternlike-app/apps/calc-stub` contains another owned Swiss service, but no evidence binds it to this app's chart processor. Unauthenticated live documentation/health/metadata lookups returned HTTP 403; no key, chart calculation or real birth-data request was used. Neither the deployed Swiss frame/files nor native episode accuracy has been qualified.

App contract: `swiss-transit-episode/1`; solver: `transit-episode-1`; anchor: `transit-anchor-1`. The wire validator requires explicitly returned flags 258 (`SWIEPH | SPEED`), UT, and tropical apparent geocentric positions at the true equinox of date. Flag values and frame behavior were checked against the [Swiss programming reference](https://www.astro.com/swisseph/swephprg.htm). Other flag combinations require a separately reviewed contract; neither absent flags nor Moshier fallback is accepted.

Before configuring a source ID, record:

- Exact native repository and commit; Swiss version and ephemeris file hashes/coverage.
- Actual flags/frame and UTC-to-UT conversion, analytic speeds, request authentication, four-second/20,000-evaluation limits, cold/warm timings, and private cache retention.
- Native tests for signed crossings, stations, branches/turns, tangencies, five contacts, gaps, closure, and limits.
- At least fifteen independent dense Swiss reference tracks across all five supported bodies. Record reference commands/tool version, fixture hashes, matching counts/directions, and every root/station/edge delta (at most five minutes).
- Sampled uncertainty, incomplete and out-of-range omissions.

App structural, browser, model writing and production gates are separate. No native qualification, paid model evaluation, activation or deployment is claimed here.
