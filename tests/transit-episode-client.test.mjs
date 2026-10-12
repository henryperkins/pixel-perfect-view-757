import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, client, request, oldFetch;
const env = ["SWISS_TRANSIT_EPISODE_URL", "SWISS_TRANSIT_EPISODE_SOURCE_ID", "SWISS_EPHEMERIS_KEY"];
let prior;
before(async () => {
  prior = Object.fromEntries(env.map((k) => [k, process.env[k]]));
  h = await createRecordsHarness();
  client = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.server.ts");
  oldFetch = globalThis.fetch;
});
beforeEach(() => {
  for (const k of env) delete process.env[k];
  request = {
    contract: "swiss-transit-episode/1",
    solverVersion: "transit-episode-1",
    sourceId: "synthetic",
    transitBody: "saturn",
    aspect: "square",
    targets: [
      { offsetMinutes: -2, longitude: 15 },
      { offsetMinutes: 0, longitude: 15 },
      { offsetMinutes: 2, longitude: 15 },
    ],
    referenceAt: "2026-10-11T12:00:00.000Z",
    maxOrbDegrees: 3,
  };
});
after(async () => {
  globalThis.fetch = oldFetch;
  await h?.close();
  for (const k of env) {
    if (prior[k] === undefined) delete process.env[k];
    else process.env[k] = prior[k];
  }
});
function configure() {
  process.env.SWISS_TRANSIT_EPISODE_URL = "https://episode-fixture.invalid/v1/transit-episodes";
  process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID = "synthetic";
  process.env.SWISS_EPHEMERIS_KEY = "fixture-key";
}
test("episode_endpoint_is_optional", async () => {
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    throw Error("no");
  };
  assert.deepEqual(await client.resolveTransitEpisodeScan(request), {
    status: "unavailable",
    reason: "not_configured",
  });
  assert.equal(calls, 0);
});
test("episode_client_rejects_wrong_source_or_contract", async () => {
  configure();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ contract: "wrong" });
  };
  assert.equal((await client.resolveTransitEpisodeScan(request)).reason, "invalid_response");
  assert.equal(calls, 1);
  request.sourceId = "wrong";
  assert.equal((await client.resolveTransitEpisodeScan(request)).reason, "unqualified_source");
  assert.equal(calls, 1);
});
test("episode_client_has_no_retry_and_sends_only_contract_fields", async () => {
  configure();
  let calls = 0;
  globalThis.fetch = async (_, init) => {
    calls++;
    assert.equal(init.headers["x-api-key"], "fixture-key");
    assert.equal(init.redirect, "manual");
    assert.deepEqual(JSON.parse(init.body), request);
    throw Error("private transport detail");
  };
  assert.deepEqual(await client.resolveTransitEpisodeScan(request), {
    status: "unavailable",
    reason: "transport",
  });
  assert.equal(calls, 1);
});
test("episode_client_accepts_a_valid_scan", async () => {
  const { analyticEpisode } = await import("./fixtures/transit-episodes/analytic.mjs");
  const f = analyticEpisode();
  configure();
  f.scan.sourceId = "synthetic";
  f.scan.request.sourceId = "synthetic";
  const wireScan = JSON.parse(JSON.stringify(f.scan));
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(wireScan);
  };
  const result = await client.resolveTransitEpisodeScan(f.scan.request);
  assert.equal(result.status, "available");
  assert.deepEqual(result.scan, wireScan);
  assert.equal(calls, 1);
});
test("episode_client_rejects_redirect_responses_without_following_them", async () => {
  configure();
  for (const status of [301, 302, 303, 307, 308]) {
    let calls = 0;
    let cancelled = false;
    globalThis.fetch = async (_, init) => {
      calls++;
      assert.equal(init.redirect, "manual");
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        {
          status,
          headers: { location: "https://different-origin.invalid/secret-catcher" },
        },
      );
    };
    assert.deepEqual(await client.resolveTransitEpisodeScan(request), {
      status: "unavailable",
      reason: "transport",
    });
    assert.equal(calls, 1);
    assert.equal(cancelled, true);
  }
});
test("episode_body_read_shares_deadline", async (t) => {
  configure();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let aborted = false;
  globalThis.fetch = async (_, init) => {
    init.signal.addEventListener("abort", () => (aborted = true));
    return new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode("{"));
        },
      }),
    );
  };
  const pending = client.resolveTransitEpisodeScan(request);
  await Promise.resolve();
  t.mock.timers.tick(6000);
  assert.equal((await pending).reason, "timeout");
  assert.equal(aborted, true);
});
test("oversized_body_is_cancelled", async () => {
  configure();
  let cancelled = false;
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(new Uint8Array(128 * 1024 + 1));
        },
        cancel() {
          cancelled = true;
        },
      }),
    );
  assert.equal((await client.resolveTransitEpisodeScan(request)).reason, "invalid_response");
  assert.equal(cancelled, true);
});
test("missing_episode_speed_is_not_zero", async () => {
  const { analyticEpisode } = await import("./fixtures/transit-episodes/analytic.mjs");
  const f = analyticEpisode();
  configure();
  f.scan.sourceId = "synthetic";
  f.scan.request.sourceId = "synthetic";
  request = f.scan.request;
  delete f.scan.reference.speed;
  globalThis.fetch = async () => Response.json(f.scan);
  assert.equal((await client.resolveTransitEpisodeScan(request)).reason, "invalid_response");
});
