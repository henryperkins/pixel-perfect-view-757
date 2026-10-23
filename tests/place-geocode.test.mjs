import assert from "node:assert/strict";
import { test } from "node:test";

process.env.MAPBOX_API_KEY = "test-mapbox-key";
process.env.LOVABLE_API_KEY = "test-lovable-key";

const m = await import("../src/lib/place-geocode.server.ts");

const feature = (name, longitude, latitude, context = {}) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [longitude, latitude] },
  properties: { name, context },
});
const cambridgeUk = feature("Cambridge", 0.1218, 52.2053, {
  region: { name: "England" },
  country: { name: "United Kingdom" },
});
const cambridgeMa = feature("Cambridge", -71.1056, 42.3751, {
  district: { name: "Middlesex County" },
  region: { name: "Massachusetts" },
  country: { name: "United States" },
});
const collection = (...features) => Response.json({ type: "FeatureCollection", features });

test("requests route through the connector gateway with connection credentials", async () => {
  let requested;
  await m.searchPlaceCandidates("Paris", async (url, init) => {
    requested = { url: new URL(url), headers: new Headers(init?.headers) };
    return collection();
  });
  assert.equal(requested.url.hostname, "connector-gateway.lovable.dev");
  assert.equal(requested.url.pathname, "/mapbox/search/geocode/v6/forward");
  assert.equal(requested.url.searchParams.get("q"), "Paris");
  assert.equal(requested.url.searchParams.get("limit"), "5");
  assert.equal(requested.url.searchParams.get("access_token"), "test-mapbox-key");
  assert.equal(requested.headers.get("X-Connection-Api-Key"), "test-mapbox-key");
  assert.equal(requested.headers.get("Lovable-API-Key"), "test-lovable-key");
});

test("features become validated candidates with offline timezone resolution", async () => {
  const result = await m.searchPlaceCandidates("Cambridge", async () =>
    collection(cambridgeUk, cambridgeMa),
  );
  assert.equal(result.status, "ok");
  assert.deepEqual(
    result.candidates.map(({ label }) => label),
    [
      "Cambridge, England, United Kingdom",
      "Cambridge, Middlesex County, Massachusetts, United States",
    ],
  );
  assert.equal(result.candidates[0].timezone, "Europe/London");
  assert.equal(result.candidates[1].timezone, "America/New_York");
  assert.equal(result.candidates[1].longitude, "-71.1056");
  assert.equal(new Set(result.candidates.map(({ id }) => id)).size, 2);
});

test("duplicate, nameless and out-of-range features do not hide valid choices", async () => {
  const valid = feature("Springfield", -89.6501, 39.7817, {
    region: { name: "Illinois" },
    country: { name: "United States" },
  });
  const result = await m.searchPlaceCandidates("Springfield", async () =>
    collection(
      { ...valid, properties: { ...valid.properties, name: " " } },
      feature("Springfield", -89.6501, 90.00001, valid.properties.context),
      { type: "Feature", geometry: null, properties: { name: "No geometry" } },
      valid,
      { ...valid },
    ),
  );
  assert.equal(result.status, "ok");
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].label, "Springfield, Illinois, United States");
  assert.equal(result.candidates[0].timezone, "America/Chicago");
});

test("empty collections report no_match and gateway failures report failed", async () => {
  const empty = await m.searchPlaceCandidates("No such place", async () => collection());
  assert.deepEqual(empty, { status: "no_match" });
  const unavailable = await m.searchPlaceCandidates(
    "Cambridge",
    async () => new Response(null, { status: 503 }),
  );
  assert.deepEqual(unavailable, { status: "failed" });
  const threw = await m.searchPlaceCandidates("Cambridge", async () => {
    throw new TypeError("socket hangup");
  });
  assert.deepEqual(threw, { status: "failed" });
});
