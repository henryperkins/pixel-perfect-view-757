# Owned Swiss calculation qualification

The reviewed service is now [deployed and verified on Fly](deployment.md). The published app's chart connection passes, including all nine screened transit anchors. Its transit calculation still returns `service_unavailable`; two activation probes were rolled back. The [application connection receipt](application-connection.md) records the current evidence and pending settings check. Combined content remains inactive.

The local numerical qualification passes all 15 frozen synthetic cases across Jupiter, Saturn, Uranus, Neptune and Pluto. Every contact, station and orb-window edge agrees with a separate dense enumerator within **5.625 seconds** (the acceptance limit is 300 seconds). Counts, direction, aspect branch, component closure and window separation match. All recorded scans also pass the application's existing wire and geometric proof validators.

`qualification.json` binds the actual Swiss build, file hashes, calculation settings and numerical source-file hashes. Each case has the complete request, candidate scan, reference events and measured differences in `<case>.json`. Its `<case>.track.json.gz` contains the unrounded hourly reference track. Inputs are invented natal longitudes, never member records. `artifact-sha256.json` binds these evidence files.

The reference uses its own uniform hourly sampling, longitude unwrapping, event enumeration and root refinement. It calls Swiss directly using ET with `swe_calc`; the candidate uses UT with `swe_calc_ut`. It imports no candidate engine or numerical helpers. Both use the same physical Swiss model and pinned data: this establishes independent algorithmic agreement, not comparison with an independent astronomical ephemeris. Dense sampling is a qualification method, not a universal mathematical proof of arbitrary tracks.

Cases include single, three and five contacts, both quincunx branches, wraparound, separate and shared orb windows, and three birth-boundary targets near a station. `native-omissions.json` records five actual station tangencies rejected as `ambiguous_station_contact`, plus an out-of-range request rejected as `source_range`. Analytic tests separately cover scan/evaluation limits and unresolved closure.

The first fixture generator incorrectly labelled the fastest-direct Neptune and Pluto cases as single contacts. Both algorithms independently found five. Their numerical comparisons passed; the fixture-count assertions failed. The preserved `initial-fixture-label-report.json` records this failure. The corrected cases explicitly require five contacts; no timing tolerance or solver behavior was relaxed.

Reproduce from the repository root after installing the standalone service:

```sh
npm ci --prefix services/swiss-ephemeris
npm run ephe:download --prefix services/swiss-ephemeris
npm test --prefix services/swiss-ephemeris
node services/swiss-ephemeris/scripts/qualify.mjs docs/reviews/daily-transit-story/2026-10-12-owned-swiss
node --test tests/owned-swiss-service.test.mjs
```

The qualifier reuses `cases.json` when present. Recorded candidate computation took approximately 65–190 ms and 3,362–7,138 position evaluations on the development host. These are in-process measurements; cold process startup, HTTP latency and deployed limits require the separate deployment receipt. Hosting, application secret configuration and content activation are distinct gates and are not established by these local files.
