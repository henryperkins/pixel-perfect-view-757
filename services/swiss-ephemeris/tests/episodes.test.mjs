import assert from "node:assert/strict";
import { test } from "node:test";
import { solveEpisodes } from "../src/episodes.mjs";
import { curve, request, BASE, DAY } from "./helpers/curves.mjs";

test("enumerates independently known one, three and five contacts with two closure legs", () => {
  for (const count of [1, 3, 5]) {
    const scan = solveEpisodes(request(), curve({ count }));
    const s = scan.samples[1];
    assert.equal(s.limit, null);
    assert.equal(s.contacts.length, count);
    assert.equal(s.components.length, 1);
    assert.equal(s.components[0].complete, true);
    assert.ok(s.components[0].leftClosureLegId && s.components[0].rightClosureLegId);
    s.contacts.forEach((c, i) => {
      assert.ok(Math.abs(Date.parse(c.at) - (BASE + (i - (count - 1) / 2) * 100 * DAY)) < 60000);
      assert.equal(c.direction, i % 2 ? "retrograde" : "direct");
      assert.ok(c.residualDeg <= 1e-6);
      assert.ok(Date.parse(c.bracket[1].at) - Date.parse(c.bracket[0].at) <= 60000);
    });
  }
});
test("retains separate orb windows and shared windows without inventing gaps", () => {
  assert.equal(solveEpisodes(request(), curve({ count: 3 })).samples[1].windows.length, 3);
  assert.equal(
    solveEpisodes(request({ maxOrbDegrees: 3 }), curve({ count: 3, amplitude: 2 })).samples[1]
      .windows.length,
    1,
  );
});
test("unwrapped zero and minus branch do not change the physical crossings", () => {
  for (const [longitude, aspect, natal] of [
    [359, "conjunction", 359],
    [10, "square", 100],
    [359, "quincunx", 149],
    [180, "opposition", 0],
  ]) {
    const scan = solveEpisodes(
      request({
        aspect,
        targets: [-2, 0, 2].map((offsetMinutes) => ({ offsetMinutes, longitude: natal })),
      }),
      curve({ count: 3, longitude }),
    );
    assert.equal(scan.samples[1].contacts.length, 3);
    assert.equal(
      scan.samples[1].contacts[0].branch,
      aspect === "square" || aspect === "quincunx" ? "minus" : "plus",
    );
  }
});
test("station target and near miss cannot become an ordinary complete passage", () => {
  for (const longitude of [15, 15.0005]) {
    assert.throws(
      () =>
        solveEpisodes(
          request({ targets: [-2, 0, 2].map((offsetMinutes) => ({ offsetMinutes, longitude })) }),
          curve({ count: 3 }),
        ),
      /ambiguous_station_contact/,
    );
  }
});
test("no closure and evaluation, duration and source bounds cannot yield complete counts", () => {
  assert.throws(
    () => solveEpisodes(request(), curve({ count: 3 }), { maxEvaluations: 2 }),
    /evaluation_limit/,
  );
  let now = 0;
  assert.throws(
    () =>
      solveEpisodes(request(), curve({ count: 3 }), { now: () => (now += 10), maxDurationMs: 5 }),
    /time_limit/,
  );
  const linear = curve({ count: 3 });
  linear.position = (_body, at) => ({
    longitude: (((10 + (at - BASE) / DAY / 100) % 360) + 360) % 360,
    latitude: 0,
    speed: 0.01,
  });
  const scan = solveEpisodes(request(), linear);
  assert.ok(
    scan.samples.every((s) => s.limit === "scan_limit" || s.components.some((c) => !c.complete)),
  );
  assert.throws(
    () =>
      solveEpisodes(request(), { ...curve(), coverage: { from: BASE + DAY, to: BASE + 2 * DAY } }),
    /source_range/,
  );
});
test("invalid requests and different source IDs fail before computation", () => {
  for (const patch of [
    { sourceId: "other" },
    { transitBody: "mars" },
    { maxOrbDegrees: 4 },
    { extra: true },
    { targets: [{ offsetMinutes: 0, longitude: 10 }] },
  ]) {
    assert.throws(
      () => solveEpisodes(request(patch), curve()),
      /invalid_request|unqualified_source/,
    );
  }
});
test("a stationary or tangent track produces a closed omission, never a fabricated leg", () => {
  const engine = curve();
  engine.position = () => ({ longitude: 10, latitude: 0, speed: 0 });
  assert.throws(() => solveEpisodes(request(), engine), /ambiguous_station_contact/);
});
