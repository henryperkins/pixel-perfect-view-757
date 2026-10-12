# Swiss service source discovery — 2026-10-11

The chart processor is **AstroWay**, a hosted external service. The recorded chart endpoint is `https://api.astroway.info/v1/chart`. No accessible repository containing AstroWay's backend calculation implementation was located. The native episode-service work remains open.

## Evidence

- Read the [Lovable project](https://lovable.dev/projects/16964b03-ff4a-4ee1-b4a5-76757e94bec3) through the Lovable plugin. The user's message at `2026-08-11T15:35:24Z` explicitly selected this endpoint (`main:user#00000000000057#usr:CJTX54E2`). Assistant configuration messages at `2026-08-11T15:38:13Z` and `2026-08-12T04:11:08Z` also contain the endpoint. These are historical configuration records, not a fresh read of deployed secrets.
- The current app client uses `SWISS_EPHEMERIS_URL` and `SWISS_EPHEMERIS_KEY`, with the matching calendar-date/time, coordinates and `x-api-key` contract. Its source is `src/lib/astro/swiss.server.ts`. Neither the local environment nor the checkout's local `.env` supplies the Swiss URL.
- [AstroWay's official organization](https://github.com/astroway) describes a hosted Swiss Ephemeris calculation API. Its 22 visible repositories include SDKs, integrations, renderers, examples and an API specification; no hosted calculation backend repository was found. An unavailable/private backend is an inference from this search, not confirmation of its private repository name.
- The [API specification repository](https://github.com/astroway/astrology-api-openapi) contains a snapshot at commit `e015f48d62f2b2498110ce89b408f123b7b69aee`, dated `2026-10-10T12:36:28Z`, describing API version `2.248.0`. Its 792 paths include `/chart`, `/ephemeris`, `/transits`, `/transit-calendar` and `/retrograde-periods`. It does not include the proposed `/transit-episodes` endpoint. These existing endpoints have not been qualified as substitutes for the planned proof contract.
- Snapshot SHA-256: `340108dc3be41b3a6ae76cd366240cdad4058c1b97ed6429404a8c7b53fe49dc`; downloaded public snapshot retained at `/tmp/pattern-swiss-discovery-20261011/astroway-openapi-snapshot.json`.
- Unauthenticated GETs for AstroWay's live OpenAPI, health and metadata URLs returned HTTP 403 from this environment. No API key was used and no chart calculation or birth-data request was made. The live API's precise current endpoint inventory and deployed frame/files remain unverified.
- The upstream **Swiss Ephemeris library source** is [Astrodienst's `aloistr/swisseph`](https://github.com/aloistr/swisseph). This identifies the underlying library, not AstroWay's HTTP implementation or deployed version.
- Local `/home/ubuntu/patternlike-app/apps/calc-stub` contains a different owned Swiss calculation service, including `src/server.ts`, `src/engine.ts` and `src/cycles.ts`. Its Git remote is `henryperkins/patternlike-app`. No evidence connects it to this Lovable app's configured chart processor; it was inspected without changes.

## Consequence for the plan

Task 2 assumes an existing editable native service. The discovered chart provider does not supply an accessible implementation to extend. Completing the episode service requires either provider support/access or a separately approved owned service/adapter design, with explicit source compatibility and the existing numerical qualification gates. The public SDK/specification and upstream library do not satisfy those gates.

This discovery changes no application code, configuration, candidate activation or deployment. Qualification remains OPEN. Raw Lovable message content and credentials are not retained in this report.
