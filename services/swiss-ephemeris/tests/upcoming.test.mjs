import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateUpcoming, UPCOMING_SOLVER_VERSION } from "../src/upcoming.mjs";
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
  solverVersion: UPCOMING_SOLVER_VERSION,
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

const linearMotion = (speed, exactDay, phase = 0) => ({
  sourceId: "linear-coverage-test",
  source,
  coverage: { from: zero - 2000 * DAY, to: zero + 2000 * DAY },
  position: (_body, ms) => ({
    longitude: (((speed * ((ms - zero) / DAY - exactDay) + phase) % 360) + 360) % 360,
    speed,
  }),
});
test("open orb intervals without a scanned exact pass cannot become complete empty coverage", () => {
  for (const exactDay of [610, -500]) {
    const engine = linearMotion(0.005, exactDay);
    const r = calculateUpcoming(
      request(engine, { bodies: ["pluto"], to: "2026-04-01T00:00:00.000Z" }),
      engine,
    );
    assert.equal(r.status, "partial");
    assert.ok(r.incompleteWindows > 0);
    assert.deepEqual(r.windows, [], "unscanned exact passes must not be invented");
    assert.equal(r.truncated, false);
  }
});
test("a native slow window starting inside ninety days stays unresolved until its exact pass is scanned", () => {
  const engine = createEngine();
  const input = request(engine, {
    bodies: ["neptune"],
    from: "2026-03-01T12:00:00.000Z",
    to: "2026-05-30T12:00:00.000Z",
    targets: [{ name: "sun", offsets: [-2, 0, 2], longitudes: Array(3).fill(4.429663699040248) }],
  });
  const short = calculateUpcoming(input, engine);
  assert.equal(short.status, "partial");
  assert.ok(short.incompleteWindows > 0);
  assert.deepEqual(short.windows, []);
  const long = calculateUpcoming({ ...input, to: "2027-03-01T12:00:00.000Z" }, engine);
  assert.equal(long.windows.length, 1);
  assert.ok(
    Math.abs(Date.parse(long.windows[0].start) - Date.parse("2026-03-11T12:00:00.000Z")) < 60000,
  );
  assert.equal(long.windows[0].phase, "upcoming");
  assert.equal(long.windows[0].end, null);
  assert.equal(long.windows[0].duration, "unknown");
});
test("closed orb near misses with no exact contact do not imply unresolved coverage", () => {
  const engine = {
    ...linear,
    position: (_body, ms) => {
      const d = (ms - zero) / DAY - 15;
      return { longitude: 2 + 0.001 * d * d, speed: 0.002 * d };
    },
  };
  const r = calculateUpcoming(request(engine, { to: "2026-01-31T00:00:00.000Z" }), engine);
  assert.equal(r.status, "complete");
  assert.equal(r.incompleteWindows, 0);
  assert.deepEqual(r.windows, []);
});
test("an exact window present only in a birth-time sample cannot become complete empty coverage", () => {
  const engine = linearMotion(0.03, 500);
  const input = request(engine, {
    bodies: ["saturn"],
    to: "2026-04-01T00:00:00.000Z",
    targets: [{ name: "ascendant", offsets: [-60, 0, 60], longitudes: [345.15, 0, 14.85] }],
  });
  for (const [duration, status] of [
    ["all", "partial"],
    ["long", "partial"],
    ["short", "complete"],
    ["unknown", "complete"],
  ]) {
    const r = calculateUpcoming({ ...input, duration }, engine);
    assert.equal(r.status, status, duration);
    assert.equal(r.incompleteWindows > 0, status === "partial");
    assert.deepEqual(r.windows, [], "a boundary sample must not invent a nominal window");
  }
});
test("birth-time samples cannot pair identical contact signatures from different orb intervals", () => {
  const points = [
    [-50, -5],
    [5, 0.75],
    [9, 0.25],
    [15, 5],
    [25, -5],
    [35, 0.25],
    [39, -0.25],
    [45, 5],
    [55, -5],
    [65, -0.25],
    [69, -0.75],
    [75, 5],
    [130, 10],
  ];
  const engine = {
    ...linearMotion(0.1, 0),
    position: (_body, ms) => {
      const day = (ms - zero) / DAY;
      let value, speed;
      if (day < points[0][0] || day > points.at(-1)[0]) {
        const edge = day < points[0][0] ? points[0] : points.at(-1);
        value = edge[1] + (day - edge[0]) * 0.1;
        speed = 0.1;
      } else {
        const index = points.findIndex((p) => p[0] >= day),
          [a, x] = points[Math.max(0, index - 1)],
          [b, y] = points[Math.max(1, index)],
          u = (day - a) / (b - a);
        value = x + ((y - x) * (1 - Math.cos(Math.PI * u))) / 2;
        speed = ((y - x) * Math.PI * Math.sin(Math.PI * u)) / (2 * (b - a));
      }
      return { longitude: ((value % 360) + 360) % 360, speed };
    },
  };
  const r = calculateUpcoming(
    request(engine, {
      to: "2026-04-01T00:00:00.000Z",
      targets: [{ name: "ascendant", offsets: [-60, 0, 60], longitudes: [359.5, 0, 0.5] }],
    }),
    engine,
  );
  assert.equal(r.status, "partial");
  assert.equal(r.incompleteWindows, 3);
  assert.deepEqual(
    r.windows.map((w) => w.exactAt),
    [["2026-01-21T00:00:00.000Z"], ["2026-02-20T00:00:00.000Z"]],
  );
});
test("padded sample mismatches wholly outside the requested interval do not reduce coverage", () => {
  const engine = linearMotion(13, -2.99);
  for (const duration of ["all", "long", "unknown"]) {
    const r = calculateUpcoming(
      request(engine, {
        bodies: ["moon"],
        to: "2026-01-02T00:00:00.000Z",
        targets: [{ name: "ascendant", offsets: [-2, 0, 2], longitudes: [359.7, 0, 0.3] }],
        duration,
      }),
      engine,
    );
    assert.equal(r.status, "complete", duration);
    assert.equal(r.incompleteWindows, 0);
    assert.equal(r.totalMatched, 0);
  }
});
test("irrelevant duration mismatches are excluded while relevant unmatched samples stay partial", () => {
  const engine = linearMotion(1, 5);
  for (const [duration, status] of [
    ["all", "partial"],
    ["short", "partial"],
    ["long", "complete"],
    ["unknown", "complete"],
  ]) {
    const r = calculateUpcoming(
      request(engine, {
        bodies: ["moon"],
        targets: [{ name: "ascendant", offsets: [-60, 0, 60], longitudes: [350, 0, 10] }],
        duration,
      }),
      engine,
    );
    assert.equal(r.status, status, duration);
    assert.equal(r.incompleteWindows > 0, status === "partial");
    assert.equal(r.totalMatched, 0);
  }
});
test("phase caps still retain forty of ninety-five future matches after duration selection", () => {
  const engine = linearMotion(13, 0, 17.123);
  const input = request(engine, {
    bodies: ["moon"],
    aspects: ["conjunction", "sextile", "square", "trine", "quincunx", "opposition"],
    to: "2026-04-01T00:00:00.000Z",
    targets: [0, 30, 60].map((longitude, i) => ({
      name: ["sun", "moon", "mercury"][i],
      offsets: [-2, 0, 2],
      longitudes: [longitude, longitude, longitude],
    })),
  });
  const r = calculateUpcoming(input, engine);
  assert.equal(r.upcomingMatched, 95);
  assert.equal(r.windows.length, 40);
  assert.equal(r.truncated, true);
  assert.equal(r.incompleteWindows, 0);
  assert.equal(r.status, "partial");
  const filtered = calculateUpcoming({ ...input, duration: "long" }, engine);
  assert.equal(filtered.totalMatched, 0);
  assert.equal(filtered.truncated, false);
  assert.equal(filtered.status, "complete");
});
test("duration filters use the same canonical boundary dates as the displayed window", () => {
  for (const [rawDays, exactDay, days] of [
    [7 - 0.2 / 86400, 5, 7],
    [30 + 0.2 / 86400, 20, 30],
  ]) {
    const engine = linearMotion(3 / rawDays, exactDay);
    const input = request(engine, { bodies: ["moon"], to: "2026-04-01T00:00:00.000Z" });
    const all = calculateUpcoming(input, engine);
    assert.equal(all.windows.length, 1);
    assert.equal(all.windows[0].duration, "medium");
    assert.equal(all.windows[0].durationDays, days);
    const matching = calculateUpcoming({ ...input, duration: "medium" }, engine);
    assert.deepEqual(matching.windows, all.windows);
    for (const duration of ["short", "long"])
      assert.equal(calculateUpcoming({ ...input, duration }, engine).totalMatched, 0);
  }
});
test("superseded solver requests are refused instead of serving old coverage semantics", () => {
  assert.throws(
    () => calculateUpcoming(request(linear, { solverVersion: "upcoming-cycles-1" }), linear),
    /invalid_request/,
  );
});
