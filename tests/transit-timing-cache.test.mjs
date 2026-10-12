import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, cache;
before(async () => {
  h = await createRecordsHarness();
  cache = await h.vite.ssrLoadModule("/src/lib/astro/transit-timing-cache.server.ts");
});
after(async () => h?.close());
test("timing_memory_is_bounded_by_retention_and_owner_erasure", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  let a = 0,
    b = 0;
  const result = () => ({ status: "omitted", reason: "service_unavailable" });
  const readA = () =>
    cache.cachedTimingCalculation("a", "key-a", async () => {
      a++;
      return result();
    });
  const readB = () =>
    cache.cachedTimingCalculation("b", "key-b", async () => {
      b++;
      return result();
    });
  await readA();
  await readB();
  const owned = await readA();
  owned.reason = "invalid_scan";
  assert.equal((await readA()).reason, "service_unavailable");
  assert.equal(a, 1);
  cache.clearTimingCalculations("a");
  await readA();
  await readB();
  assert.equal(a, 2);
  assert.equal(b, 1);
  t.mock.timers.tick(15 * 60_000 + 1);
  await readA();
  await readB();
  assert.equal(a, 3);
  assert.equal(b, 2);
});
