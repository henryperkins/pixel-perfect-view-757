# Application connection check

Historical receipt: the failure below is now resolved. The [Cloudflare runtime correction](../2026-10-12-transit-runtime-fix/README.md) passed native-runtime and production checks, and combined `0.7.1` is active. The initial JSON and failed-probe details remain unchanged.

**Chart connection passed; production transit connection remains unresolved. Combined content `0.7.1` is inactive.** The [machine-readable receipt](application-connection.json) records the synthetic inputs, source evidence, two production failures, pointer rollback and account cleanup.

The operator confirmed applying the four Lovable secrets. The initial synthetic chart still returned unqualified anchors. After publishing source `f62ef72ecd366ec5b8fa4be3aa3d7328f0ddab17` through Lovable (deployment request `8130f1f0-c20b-470f-b7bd-e20b3035e959`), the same account's explicit birth save returned a high-precision Swiss `2.10.03` Placidus chart and nine screened transit anchors. All three birth-window samples identify the qualified engine, data hash, frame, time scale and flags. The published entry, privacy and birth-page assets match that source's local build byte-for-byte. This frontend comparison does not independently expose the server runtime commit.

The current source passed all **532 tests**, typecheck and build before publication. The concurrent Lovable changes already on `main` were preserved. No application code changed during this connection check, and no model request was made.

The staged `0.7.1` bundle passes `validateContentGraph`; its SHA-256 remains `20b793acda524da945b07ec32b2ed795f31e273c533ff6b4e9c4f96ef821eeac`. It contains 62 natal lens rules and five transit chapter rules. The operator activated both pointers for the production check, then restored the prior state when `fetchCycles` returned `omitted / service_unavailable`. A separate uncached date reproduced the failure and was also followed by rollback. Both checks selected Jupiter square natal Midheaven. They took approximately 1.18 and 0.81 seconds, respectively.

The identical synthetic transit request returns HTTP 200 directly from Fly, including with redirects disabled. The current application adapter also qualifies it locally using the prepared settings, selecting the first of three contacts. Its natal reliability screen passes with 23 evidence entries. This local reading correctly omits a personal natal lens because the primary contact targets Midheaven. These checks establish a working service and local adapter; they do not establish the deployed app's transit connection. The production omission combines several transport errors, so neither an incorrect setting nor a specific HTTP failure has been established as the cause.

The synthetic account was erased through the normal application operation and signed out, then deleted with an exact ID/email guard. Scoped database counts confirm zero remaining account, profile, chart, birth, reading, natal-feature, consent and audit rows. No real member records were read or altered by these probes.

## Pointers and next operation at this initial check

- `content_releases`: no active row; the reviewed `0.7.1` row remains staged.
- `release_pointer`: `editorial-1.0.0` active, checksum null.
- Chart URL/key: verified through the published app.
- Transit URL/source ID: settings need confirmation; calculation through the published app has not passed.

Confirm these two server-only setting values in Lovable; neither is the API key:

```text
SWISS_TRANSIT_EPISODE_URL=https://pattern-transit-calc.fly.dev/v1/transit-episodes
SWISS_TRANSIT_EPISODE_SOURCE_ID=pattern-swiss-1:c8ebf2f4f7e7f377aa22ff0776a8e54a
```

After any correction, publish and use a new synthetic account or uncached selection to repeat the transit check. The timing cache retains an omission for up to 15 minutes. Joint activation remains authorized; retain it only after the production transit calculation passes. Existing owners explicitly save/recalculate their birth details to acquire the new source evidence. Historical readings keep their original provenance.
