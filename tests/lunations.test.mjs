import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, lunar, transport, fixture;
before(async () => {
  h = await createRecordsHarness();
  lunar = await h.vite.ssrLoadModule("/src/lib/astro/lunations.server.ts");
  transport = await h.vite.ssrLoadModule("/src/lib/astro/swiss-calculations.server.ts");
  fixture = JSON.parse(
    await readFile(new URL("./fixtures/native-astronomy/lunar-multiple.json", import.meta.url)),
  );
});
after(async () => h?.close());
beforeEach(async () => h.reset());
test("qualified lunar range retains independently captured phases and native eclipse classes, with a public-only cache", async () => {
  h.setSwissCalculations(() => Response.json(fixture.actual));
  const a = await lunar.getLunations(fixture.input.from, fixture.input.to);
  assert.equal(a.status, "available");
  assert.deepEqual(a.value, fixture.actual.events);
  const b = await lunar.getLunations(fixture.input.from, fixture.input.to);
  assert.deepEqual(a, b);
  assert.equal(h.calculationRequests.length, 1);
  assert.ok(!JSON.stringify(h.calculationRequests).includes(h.userA));
});
test("bad source data, oversized output, redirects and missing configuration fail closed without retries", async () => {
  const call = (parse = (x) => x) =>
    transport.swissCalculation("/v1/astronomy-events", fixture.input, parse);
  assert.equal((await call()).reason, "not_configured");
  for (const response of [
    () => new Response("x".repeat(128 * 1024 + 1)),
    () => new Response("", { status: 302, headers: { location: "https://other.invalid" } }),
    () =>
      Response.json({
        ...fixture.actual,
        source: { ...fixture.actual.source, engineVersion: "different" },
      }),
  ]) {
    h.setSwissCalculations(response);
    const before = h.calculationRequests.length;
    const r = await call((raw) => {
      transport.verifySwissSource(raw.source, fixture.input.sourceId);
      return raw;
    });
    assert.equal(r.status, "unavailable");
    assert.equal(h.calculationRequests.length, before + 1);
  }
  assert.equal(
    (await lunar.getLunations("2026-02-30T00:00:00.000Z", "2026-03-01T00:00:00.000Z")).status,
    "unavailable",
  );
});
test("the transport deadline includes body capture and stops an abort-ignoring response", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let cancelled = false;
  h.setSwissCalculations(
    () =>
      new Response(
        new ReadableStream({
          start() {},
          cancel() {
            cancelled = true;
          },
        }),
      ),
  );
  const pending = callTimeout();
  await new Promise((resolve) => setImmediate(resolve));
  t.mock.timers.tick(6001);
  const r = await pending;
  assert.equal(r.reason, "timeout");
  assert.ok(cancelled);
  assert.equal(h.calculationRequests.length, 1);
  function callTimeout() {
    return transport.swissCalculation("/v1/astronomy-events", fixture.input, (x) => x);
  }
});
