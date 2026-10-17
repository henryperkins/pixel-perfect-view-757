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
  assert.equal((await current).candidates[0].placeLabel, "Berlin, Country");
});
test("lookup offers named regional choices rather than resolving the first match", async () => {
  let requested;
  const c = m.createPlaceLookup(async (url) => {
    requested = new URL(url);
    return Response.json({
      results: [
        {
          id: 1,
          name: "Cambridge",
          admin1: "England",
          country: "United Kingdom",
          latitude: 52.2053,
          longitude: 0.1218,
          timezone: "Europe/London",
        },
        {
          id: 2,
          name: "Cambridge",
          admin2: "Middlesex County",
          admin1: "Massachusetts",
          country: "United States",
          latitude: 42.3751,
          longitude: -71.1056,
          timezone: "America/New_York",
        },
      ],
    });
  });
  const result = await c.lookup("  Cambridge  ");
  assert.equal(result.status, "candidates");
  assert.equal(result.fields, undefined, "a lookup must not choose a location for the user");
  assert.equal(requested.searchParams.get("count"), "5");
  assert.equal(requested.searchParams.get("name"), "Cambridge");
  assert.deepEqual(
    result.candidates.map(({ label }) => label),
    [
      "Cambridge, England, United Kingdom",
      "Cambridge, Middlesex County, Massachusetts, United States",
    ],
  );
  assert.equal(
    result.candidates[1].placeLabel,
    "Cambridge, Middlesex County, Massachusetts, United States",
  );
  assert.equal(result.candidates[1].longitude, "-71.1056");
  assert.equal(new Set(result.candidates.map(({ id }) => id)).size, 2);
});
test("even one usable result remains an unselected candidate", async () => {
  const c = m.createPlaceLookup(async () => hit("Paris"));
  const result = await c.lookup("Paris");
  assert.equal(result.status, "candidates");
  assert.equal(result.candidates.length, 1);
  assert.equal(result.fields, undefined);
});
test("duplicate and unusable hits do not hide valid choices", async () => {
  const valid = {
    name: "Springfield",
    admin1: "Illinois",
    country: "United States",
    latitude: 39.7817,
    longitude: -89.6501,
    timezone: "America/Chicago",
  };
  const c = m.createPlaceLookup(async () =>
    Response.json({
      results: [
        { ...valid, name: "Invalid", latitude: 90.00001 },
        { ...valid, id: 1 },
        { ...valid, id: 2 },
        { ...valid, name: "Missing timezone", timezone: undefined },
        { ...valid, name: "Invalid timezone", timezone: "Invalid/Zone" },
      ],
    }),
  );
  const result = await c.lookup("Springfield");
  assert.equal(result.status, "candidates");
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].label, "Springfield, Illinois, United States");
});
test("no match and network failure offer retry guidance without exposing raw fetch errors", async () => {
  const missing = m.createPlaceLookup(async () => Response.json({ results: [] }));
  await assert.rejects(missing.lookup("No such place"), /try|spelling|nearby/i);
  const failed = m.createPlaceLookup(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    failed.lookup("Cambridge"),
    (error) => /try again/i.test(error.message) && !/Failed to fetch/.test(error.message),
  );
  const unavailable = m.createPlaceLookup(async () => new Response(null, { status: 503 }));
  await assert.rejects(unavailable.lookup("Cambridge"), /try again/i);
});
test("invalidation while reading a response cannot expose obsolete choices", async () => {
  const body = deferred();
  const c = m.createPlaceLookup(async () => ({ ok: true, json: () => body.promise }));
  const current = c.lookup("Paris");
  await Promise.resolve();
  c.invalidate();
  body.resolve({
    results: [
      {
        name: "Paris",
        country: "France",
        latitude: 48.85,
        longitude: 2.35,
        timezone: "Europe/Paris",
      },
    ],
  });
  assert.deepEqual(await current, { status: "stale" });
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
