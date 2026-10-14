import assert from "node:assert/strict";
import { test } from "node:test";
let m = {};
try {
  m = await import("../src/lib/place-lookup.ts");
} catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}
const hit = (name, latitude = 48.85) =>
  Response.json({
    results: [{ name, country: "Country", latitude, longitude: -12.5, timezone: "UTC" }],
  });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
test("Paris cannot replace Berlin after typing or manually changing coordinates", async () => {
  assert.equal(typeof m.createPlaceLookup, "function", "request generation guard is missing");
  const held = deferred(),
    c = m.createPlaceLookup(() => held.promise);
  const paris = c.lookup("Paris");
  c.invalidate();
  held.resolve(hit("Paris"));
  assert.deepEqual(await paris, { status: "stale" });
});
test("reversed results and old errors cannot complete the latest request", async () => {
  assert.equal(typeof m.createPlaceLookup, "function");
  const a = deferred(),
    b = deferred();
  let n = 0;
  const c = m.createPlaceLookup(() => (++n === 1 ? a.promise : b.promise));
  const old = c.lookup("Paris"),
    current = c.lookup("Berlin");
  a.reject(Error("Old failed"));
  assert.deepEqual(await old, { status: "stale" });
  b.resolve(hit("Berlin"));
  assert.equal((await current).fields.placeLabel, "Berlin, Country");
});
test("invalid responses fail and signed decimal manual coordinates remain usable", async () => {
  assert.equal(typeof m.createPlaceLookup, "function");
  const c = m.createPlaceLookup(async () => hit("Invalid", 123));
  await assert.rejects(c.lookup("Invalid"), /coordinates|match/i);
  assert.equal(
    m.validPlaceFields({
      placeLabel: "Manual",
      latitude: "-33.86",
      longitude: "151.2",
      timezone: "Australia/Sydney",
    }),
    true,
  );
  for (const latitude of ["", "NaN", "91", "-91"])
    assert.equal(
      m.validPlaceFields({ placeLabel: "Manual", latitude, longitude: "0", timezone: "UTC" }),
      false,
    );
  assert.equal(
    m.validPlaceFields({
      placeLabel: "Manual",
      latitude: "0",
      longitude: "0",
      timezone: "Invalid/Zone",
    }),
    false,
  );
});
