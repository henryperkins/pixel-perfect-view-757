import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "../src/server.mjs";
import { createEngine } from "../src/engine.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { connect } from "node:net";
const servers = [];
const key = "synthetic-test-key-32-characters-minimum";
async function start(options = {}) {
  const server = createServer({ key, ...options });
  servers.push(server);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${server.address().port}`;
}
after(async () => {
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
const chart = {
  date: "1990-05-15",
  time: "19:34:00",
  timezoneOffset: 0,
  latitude: 34.0522,
  longitude: -118.2437,
};
const post = (url, body, auth = key) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { "x-api-key": auth } : {}) },
    body: JSON.stringify(body),
  });
test("private calculations require credentials while health exposes actual source", async () => {
  const base = await start();
  assert.equal((await post(`${base}/v1/chart`, chart, null)).status, 401);
  assert.equal((await post(`${base}/v1/chart`, chart, "incorrect")).status, 401);
  const h = await (await fetch(`${base}/health`)).json();
  assert.equal(h.ok, true);
  assert.equal(h.engine.engineVersion, "2.10.03");
  assert.equal(h.license, "AGPL-3.0-or-later");
  assert.throws(() => createServer({ key: "" }), /authentication_required/);
});
test("lunar events and solar context retain authenticated bounded HTTP contracts and actual native source", async () => {
  const base = await start(),
    engine = createEngine();
  const events = {
    contract: "swiss-astronomy-events/1",
    sourceId: engine.sourceId,
    from: "2026-01-01T00:00:00.000Z",
    to: "2026-02-01T00:00:00.000Z",
  };
  assert.equal((await post(base + "/v1/astronomy-events", events, null)).status, 401);
  const range = await post(base + "/v1/astronomy-events", events);
  assert.equal(range.status, 200);
  assert.equal((await range.json()).events.length, 2);
  assert.equal(
    (await post(base + "/v1/astronomy-events", { ...events, to: "2028-01-01T00:00:00.000Z" }))
      .status,
    400,
  );
  const solar = await post(base + "/v1/solar-context", {
    contract: "swiss-solar-context/1",
    sourceId: engine.sourceId,
    day: "2026-10-13",
    timeZone: "UTC",
    from: "2026-10-13T00:00:00.000Z",
    to: "2026-10-14T00:00:00.000Z",
    latitude: 52,
    longitude: 0,
  });
  assert.equal(solar.status, 200);
  assert.equal((await solar.json()).daylight, "ordinary");
  const metadata = await (await fetch(base + "/v1/engine")).json();
  assert.equal(metadata.capabilities.astronomyEvents.solverVersion, "lunations-eclipses-1");
});
test("real chart and episode requests share source identity across isolated processes", async () => {
  const base = await start(),
    engine = createEngine();
  const response = await post(`${base}/v1/chart`, chart);
  assert.equal(response.status, 200);
  const c = await response.json();
  assert.deepEqual(c.data.positionSource, engine.source);
  const referenceAt = "2026-10-12T12:00:00.000Z",
    lon = engine.position("saturn", Date.parse(referenceAt)).longitude;
  const response2 = await post(`${base}/v1/transit-episodes`, {
    contract: "swiss-transit-episode/1",
    solverVersion: "transit-episode-1",
    sourceId: engine.sourceId,
    transitBody: "saturn",
    aspect: "conjunction",
    referenceAt,
    maxOrbDegrees: 3,
    targets: [-2, 0, 2].map((offsetMinutes) => ({ offsetMinutes, longitude: lon })),
  });
  assert.equal(response2.status, 200);
  const scan = await response2.json();
  assert.deepEqual(scan.source, c.data.positionSource);
  assert.ok(scan.samples[1].components.every((c) => c.complete));
});
test("invalid JSON, oversized bodies and mismatched source are rejected without leaking input", async () => {
  const base = await start();
  const malformed = await fetch(`${base}/v1/chart`, {
    method: "POST",
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: "{secret-birth-data",
  });
  assert.equal(malformed.status, 400);
  assert.ok(!(await malformed.text()).includes("birth-data"));
  assert.equal((await post(`${base}/v1/chart`, { value: "x".repeat(20000) })).status, 413);
  assert.equal((await post(`${base}/v1/chart`, { ...chart, date: "2026-02-30" })).status, 400);
  assert.equal((await fetch(`${base}/unknown`)).status, 404);
});
test("slow calculations are terminated and admission is bounded", async () => {
  const base = await start({
    workerPath: new URL("./helpers/hanging-worker.mjs", import.meta.url),
    deadlineMs: 150,
    maxConcurrency: 1,
  });
  const first = post(`${base}/v1/chart`, chart);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal((await post(`${base}/v1/chart`, chart)).status, 503);
  const response = await first;
  assert.equal(response.status, 504);
  assert.deepEqual(await response.json(), { error: "time_limit" });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal((await post(`${base}/v1/chart`, chart)).status, 504);
});
test("rejected streaming bodies close the connection promptly after their error response", async () => {
  const base = await start();
  for (const scenario of ["unauthenticated", "oversized", "timeout"]) {
    const url = new URL(base);
    await new Promise((resolve, reject) => {
      const socket = connect(Number(url.port), url.hostname);
      let response = "",
        keepAlive,
        finished = false;
      const deadline = setTimeout(
        () => finish(new Error(`${scenario}: rejected upload stayed open`)),
        2500,
      );
      function finish(error) {
        if (finished) return;
        finished = true;
        clearTimeout(deadline);
        clearInterval(keepAlive);
        socket.destroy();
        if (error) reject(error);
        else resolve();
      }
      socket.on("error", finish);
      socket.on("data", (bytes) => {
        response += bytes.toString();
      });
      socket.on("close", () => {
        const expected =
          scenario === "unauthenticated" ? 401 : scenario === "oversized" ? 413 : 504;
        try {
          assert.match(response, new RegExp(`HTTP/1.1 ${expected}`));
          finish();
        } catch (error) {
          finish(error);
        }
      });
      socket.on("connect", () => {
        const credential = scenario === "unauthenticated" ? "" : `X-Api-Key: ${key}\r\n`;
        socket.write(
          `POST /v1/chart HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n${credential}Transfer-Encoding: chunked\r\n\r\n`,
        );
        if (scenario === "oversized") socket.write(`2328\r\n${"x".repeat(9000)}\r\n`);
        keepAlive = setInterval(() => socket.write("1\r\nx\r\n"), 100);
      });
    });
  }
});
test("public source offer serves the complete service archive without private environment files", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  execFileSync(process.execPath, ["scripts/source-archive.mjs"], { cwd: root });
  const base = await start();
  const offer = await (await fetch(`${base}/source`)).json();
  assert.equal(offer.license, "AGPL-3.0-or-later");
  const response = await fetch(`${base}${offer.archive}`);
  assert.equal(response.status, 200);
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    readFileSync(new URL("../dist/source.tar.gz", import.meta.url)),
  );
  const listing = execFileSync("tar", ["-tzf", "dist/source.tar.gz"], {
    cwd: root,
    encoding: "utf8",
  }).split("\n");
  assert.ok(listing.includes("swiss-ephemeris/LICENSE"));
  assert.ok(listing.includes("swiss-ephemeris/src/episodes.mjs"));
  assert.ok(listing.some((p) => p.endsWith("/sweph.c")));
  assert.ok(listing.includes("swiss-ephemeris/SOURCE-MANIFEST.json"));
  assert.ok(!listing.some((p) => p.includes(".env") || p.includes("private.env")));
});
