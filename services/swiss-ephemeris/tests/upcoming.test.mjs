import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateUpcoming } from "../src/upcoming.mjs";
import { createEngine } from "../src/engine.mjs";
import { curve, BASE } from "./helpers/curves.mjs";
const DAY = 86400000,
  zero = Date.parse("2026-01-01T00:00:00.000Z");
const source = { engine: "synthetic-curve", engineVersion: "fixture-1" };
const linear = {
  sourceId: "linear-test",
  source,
  coverage: { from: zero - 500 * DAY, to: zero + 500 * DAY },
  position: (body, ms) => ({ longitude: ((((ms - zero) / DAY - 5) % 360) + 360) % 360, speed: 1 }),
};
const request = (engine = linear, patch = {}) => ({
  contract: "swiss-upcoming-cycles/1",
  solverVersion: "upcoming-cycles-1",
  sourceId: engine.sourceId,
  from: "2026-01-01T00:00:00.000Z",
  to: "2026-01-11T00:00:00.000Z",
  bodies: ["jupiter"],
  aspects: ["conjunction"],
  targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: [0, 0, 0] }],
  duration: "all",
  ...patch,
});
test("a contact outside today's orb gets its real future start, all exact passes, end and stable identity", () => {
  const r = calculateUpcoming(request(), linear);
  assert.equal(r.status, "complete");
  assert.equal(r.windows.length, 1);
  const w = r.windows[0];
  assert.equal(w.phase, "upcoming");
  assert.equal(w.start, "2026-01-03T00:00:00.000Z");
  assert.deepEqual(w.exactAt, ["2026-01-06T00:00:00.000Z"]);
  assert.equal(w.end, "2026-01-09T00:00:00.000Z");
  const moved = calculateUpcoming(request(linear, { from: "2026-01-02T00:00:00.000Z" }), linear);
  assert.equal(moved.windows[0].id, w.id);
  assert.equal(calculateUpcoming(request(linear, { to: w.start }), linear).windows.length, 0);
  const active = calculateUpcoming(request(linear, { from: "2026-01-05T00:00:00.000Z" }), linear);
  assert.equal(active.windows[0].phase, "active");
  assert.equal(
    calculateUpcoming(
      request(linear, { from: "2026-01-10T00:00:00.000Z", to: "2026-01-11T00:00:00.000Z" }),
      linear,
    ).windows.length,
    0,
  );
});
test("native short-range Sun and Moon contacts are calculated from pinned Swiss positions", () => {
  const engine = createEngine(),
    longitude = engine.position("sun", zero + 5 * DAY).longitude;
  const r = calculateUpcoming(
    request(engine, {
      bodies: ["sun", "moon"],
      to: "2026-02-01T00:00:00.000Z",
      targets: [
        { name: "sun", offsets: [-2, 0, 2], longitudes: [longitude, longitude, longitude] },
      ],
    }),
    engine,
  );
  assert.ok(r.windows.some((w) => w.transitBody === "sun"));
  assert.ok(r.windows.some((w) => w.transitBody === "moon"));
  assert.ok(r.windows.every((w) => w.sourceId === engine.sourceId));
});
test("native slow-body root refinement converges across long station-separated legs", () => {
  const engine = createEngine(),
    longitude = engine.position("uranus", Date.parse("2026-02-01T12:00:00.000Z")).longitude;
  const r = calculateUpcoming(
    request(engine, {
      from: "2026-01-01T12:00:00.000Z",
      to: "2026-04-01T12:00:00.000Z",
      bodies: ["uranus"],
      targets: [
        {
          name: "sun",
          offsets: [-2, 0, 2],
          longitudes: [longitude - 0.00001, longitude, longitude + 0.00001],
        },
      ],
    }),
    engine,
  );
  assert.ok(r.windows.length > 0);
  assert.ok(r.windows.every((w) => w.exactAt.length > 0));
});
test("unsafe bodies, arbitrary anchors, filters, source and horizons are refused before scanning", () => {
  for (const patch of [
    { bodies: ["made-up"] },
    { aspects: ["custom"] },
    { duration: "forever" },
    { targets: [{ name: "unknown", offsets: [0], longitudes: [0] }] },
    { to: "2028-01-01T00:00:00.000Z" },
    { sourceId: "other-source" },
    { memberId: "private" },
  ])
    assert.throws(() => calculateUpcoming(request(linear, patch), linear));
});
test("each repeated retrograde window binds its own sample roots, including targets across zero longitude", () => {
  for (const longitude of [10, 0]) {
    const engine = curve({ count: 3, longitude }),
      angles = longitude === 0 ? [359.999, 0, 0.001] : [10, 10, 10];
    const r = calculateUpcoming(
      request(engine, {
        from: new Date(BASE - 180 * DAY).toISOString(),
        to: new Date(BASE + 180 * DAY).toISOString(),
        targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: angles }],
      }),
      engine,
    );
    assert.equal(r.windows.length, 3);
    for (const w of r.windows) {
      const [a, b] = w.exactRanges[0];
      assert.ok(
        Date.parse(a) <= Date.parse(w.exactAt[0]) && Date.parse(w.exactAt[0]) <= Date.parse(b),
      );
      assert.ok(
        Date.parse(w.startRange[0]) <= Date.parse(w.start) &&
          Date.parse(w.start) <= Date.parse(w.startRange[1]),
      );
    }
  }
});
test("birth ranges straddling today have an uncertain phase, and shared retrograde windows keep all passes", () => {
  const r = calculateUpcoming(
    request(linear, {
      from: "2026-01-03T00:00:00.000Z",
      targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: [359.9, 0, 0.1] }],
    }),
    linear,
  );
  assert.equal(r.windows[0].phase, "uncertain");
  assert.equal(r.uncertainMatched, 1);
  const engine = curve({ count: 3, amplitude: 2 });
  const shared = calculateUpcoming(
    request(engine, {
      from: new Date(BASE - 180 * DAY).toISOString(),
      to: new Date(BASE + 180 * DAY).toISOString(),
      targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: [10, 10, 10] }],
    }),
    engine,
  );
  assert.equal(shared.windows.length, 1);
  assert.equal(shared.windows[0].exactAt.length, 3);
  assert.throws(
    () =>
      calculateUpcoming(request(), linear, {
        maxDurationMs: 1,
        now: (() => {
          let n = 0;
          return () => n++;
        })(),
      }),
    /time_limit/,
  );
});
test("an orb window containing the whole query stays visible when every exact pass falls outside it", () => {
  const engine = curve({ count: 3, amplitude: 2 });
  const r = calculateUpcoming(
    request(engine, {
      from: new Date(BASE + 20 * DAY).toISOString(),
      to: new Date(BASE + 80 * DAY).toISOString(),
      bodies: ["saturn"],
      targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: [10, 10, 10] }],
    }),
    engine,
  );
  assert.equal(r.status, "partial");
  assert.equal(r.windows.length, 1);
  assert.equal(r.windows[0].phase, "uncertain");
  assert.ok(r.incompleteWindows > 0);
});
