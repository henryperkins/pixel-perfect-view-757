import assert from "node:assert/strict";
import { test } from "node:test";
let m = {};
try {
  m = await import("../src/lib/place-lookup.ts");
} catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}
const candidate = (name, latitude = "48.8567") => ({
  label: `${name}, Country`,
  placeLabel: `${name}, Country`,
  latitude,
  longitude: "-12.5",
  timezone: "UTC",
});
const ok = (...candidates) => ({ status: "ok", candidates });
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
  held.resolve(ok(candidate("Paris")));
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
  b.resolve(ok(candidate("Berlin")));
  assert.equal((await current).candidates[0].placeLabel, "Berlin, Country");
});
test("the trimmed query reaches the transport and no choice is preselected", async () => {
  const queries = [];
  const c = m.createPlaceLookup(async (query) => {
    queries.push(query);
    return ok(candidate("Cambridge", "52.2053"), candidate("Cambridge", "42.3751"));
  });
  const result = await c.lookup("  Cambridge  ");
  assert.equal(result.status, "candidates");
  assert.equal(result.fields, undefined, "a lookup must not choose a location for the user");
  assert.deepEqual(queries, ["Cambridge"]);
  assert.equal(result.candidates.length, 2);
  assert.equal(new Set(result.candidates.map(({ id }) => id)).size, 2);
});
test("even one usable result remains an unselected candidate", async () => {
  const c = m.createPlaceLookup(async () => ok(candidate("Paris")));
  const result = await c.lookup("Paris");
  assert.equal(result.status, "candidates");
  assert.equal(result.candidates.length, 1);
  assert.equal(result.fields, undefined);
});
test("duplicate and unusable wire candidates do not hide valid choices", async () => {
  const valid = candidate("Springfield", "39.7817");
  const c = m.createPlaceLookup(async () =>
    ok(
      { ...valid, label: "Invalid", placeLabel: "Invalid", latitude: "90.00001" },
      valid,
      { ...valid },
      { ...valid, label: "Missing timezone", timezone: "" },
      { ...valid, label: "Invalid timezone", timezone: "Invalid/Zone" },
    ),
  );
  const result = await c.lookup("Springfield");
  assert.equal(result.status, "candidates");
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].label, "Springfield, Country");
  assert.equal(result.candidates[0].latitude, "39.7817");
});
test("no match, provider failure and transport failure offer retry guidance without raw errors", async () => {
  const missing = m.createPlaceLookup(async () => ({ status: "no_match" }));
  await assert.rejects(missing.lookup("No such place"), /try|spelling|nearby/i);
  const failed = m.createPlaceLookup(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    failed.lookup("Cambridge"),
    (error) => /try again/i.test(error.message) && !/Failed to fetch/.test(error.message),
  );
  const unavailable = m.createPlaceLookup(async () => ({ status: "failed" }));
  await assert.rejects(unavailable.lookup("Cambridge"), /try again/i);
});
test("invalidation while reading a response cannot expose obsolete choices", async () => {
  const body = deferred();
  const c = m.createPlaceLookup(() => body.promise);
  const current = c.lookup("Paris");
  await Promise.resolve();
  c.invalidate();
  body.resolve(ok(candidate("Paris")));
  assert.deepEqual(await current, { status: "stale" });
});
test("signed decimal manual coordinates remain usable", async () => {
  assert.equal(typeof m.createPlaceLookup, "function");
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
