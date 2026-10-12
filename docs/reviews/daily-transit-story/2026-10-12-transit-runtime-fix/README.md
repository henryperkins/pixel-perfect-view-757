# Transit client runtime correction

The production transit client used `redirect: "error"`. Cloudflare's runtime rejects that option before sending a request; the client caught the exception and reported `service_unavailable`. Node accepts the option, so earlier local client checks passed. This is an application runtime defect, not evidence of a bad API key or calculation service.

The behavior is reproduced with native `workerd 1.20260926.1`, using the actual application adapter and a previously qualified synthetic scan. All outbound requests in the reproduction route to a local fixture Worker; no credential or birth data leaves the test. [The failing run](workerd-red.log) reproduces the old client rejection. [The corrected run](workerd-green.log) accepts the same scan. The runtime's [request implementation](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B) rejects the unsupported value explicitly; the broader request-reference documentation currently lists it nevertheless.

The client now uses `redirect: "manual"`. Its existing non-OK status guard rejects redirect responses, cancels their bodies and returns the closed transport error. No redirect is followed and no credential is forwarded to a redirect destination. Tests cover a valid scan and each of HTTP 301, 302, 303, 307 and 308, in addition to the existing source/contract, timeout and response-size checks. The valid-scan expectation uses its JSON wire representation because JSON normalizes negative zero.

All **534 application tests**, typecheck and build pass. The standalone numerical service, calculation contract, reviewed editorial bundle and model prompt are unchanged. Live publication and joint activation will be recorded separately after the production check; no new model calls are needed.

Reproduce from the repository root with Bun and `workerd 1.20260926.1` available:

```sh
node docs/reviews/daily-transit-story/2026-10-12-transit-runtime-fix/run-workerd.mjs /path/to/workerd
node --test tests/transit-episode-client.test.mjs
```

The runner bundles the current client into a temporary folder, runs the native runtime test and removes only that temporary folder. To reproduce the failure, run against the client from `8845966`. The saved failing log came from the initial equivalent reproduction before the correction; the committed runner preserves the same request and fixture.
