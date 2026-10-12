import assert from "node:assert/strict";
import { test } from "node:test";
import { enumerateReference } from "../scripts/reference.mjs";
import { curve, request, BASE, DAY } from "./helpers/curves.mjs";
test("independent dense enumerator finds exact lattice roots and true reversals", () => {
  const engine = curve(),
    r = request();
  const result = enumerateReference(r, engine.position, {
    from: BASE - 400 * DAY,
    to: BASE + 400 * DAY,
    stepMs: DAY / 24,
  });
  assert.equal(result.samples[1].contacts.length, 3);
  assert.deepEqual(
    result.samples[1].contacts.map((c) => c.direction),
    ["direct", "retrograde", "direct"],
  );
  assert.deepEqual(
    result.samples[1].contacts.map((c) => Math.round((c.at - BASE) / DAY)),
    [-100, 0, 100],
  );
  assert.equal(result.samples[1].windows.length, 3);
  assert.ok(result.stations.some((s) => Math.abs((s.at - BASE) / DAY + 50) < 0.0001));
});
test("independent reference retains a connected window across two reversals", () => {
  const result = enumerateReference(
    request({ maxOrbDegrees: 3 }),
    curve({ amplitude: 2 }).position,
    { from: BASE - 400 * DAY, to: BASE + 400 * DAY, stepMs: DAY / 24 },
  );
  assert.equal(result.samples[1].windows.length, 1);
  assert.equal(result.samples[1].windows[0].contacts.length, 3);
});
