import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, upcoming, fixtures;
before(async () => {
  h = await createRecordsHarness();
  upcoming = await h.vite.ssrLoadModule("/src/lib/astro/upcoming.server.ts");
  fixtures = await Promise.all(
    [0, 1, 2].map(async (i) =>
      JSON.parse(
        await readFile(
          new URL("./fixtures/native-astronomy/upcoming-full-year-" + i + ".json", import.meta.url),
        ),
      ),
    ),
  );
});
after(async () => h?.close());
beforeEach(async () => h.reset());
const manifest = (patch = {}) => ({
  version: "transit-anchor-1",
  chartFingerprint: "synthetic-future-test",
  accuracy: "exact",
  status: "screened",
  sampleOffsetsMinutes: [-2, 0, 2],
  sources: [fixtures[0].actual.source, fixtures[0].actual.source, fixtures[0].actual.source],
  anchors: fixtures.flatMap((f) =>
    f.input.targets.map((t) => ({ target: t.name, longitudes: t.longitudes })),
  ),
  ...patch,
});
test("full future scan preserves native anchor bindings, all sampled targets, partial counts and unique window IDs across three bounded requests", async () => {
  const a = fixtures[0].input;
  h.setSwissCalculations((body) => {
    assert.equal(body.solverVersion, "upcoming-cycles-2");
    const f = fixtures.find(
      (f) => JSON.stringify(f.input.targets) === JSON.stringify(body.targets),
    );
    assert.ok(f);
    return Response.json(f.actual);
  });
  const r = await upcoming.getUpcomingFromAnchors(manifest(), a.from, a.to, "all", "all");
  assert.equal(r.status, "available");
  assert.equal(r.calculationStatus, "partial");
  assert.equal(
    r.totalMatched,
    fixtures.reduce((n, f) => n + f.actual.totalMatched, 0),
  );
  assert.equal(r.windows.length, new Set(r.windows.map((w) => w.id)).size);
  assert.equal(h.calculationRequests.length, 3);
  assert.ok(h.calculationRequests.every((r) => r.body.targets.length <= 3));
  assert.equal(h.gatewayRequests.length, 0);
  assert.ok(r.windows.some((w) => w.natalPoint === "ascendant" || w.natalPoint === "midheaven"));
  const active = new Set(r.windows.filter((w) => w.phase === "active").map((w) => w.id));
  assert.ok(r.windows.filter((w) => w.phase === "upcoming").every((w) => !active.has(w.id)));
});
test("old solver responses cannot become corrected coverage or trigger a retry", async () => {
  const a = fixtures[0].input;
  h.setSwissCalculations((body) => {
    const f = fixtures.find((f) => f.input.targets[0].name === body.targets[0].name);
    return Response.json({ ...f.actual, solverVersion: "upcoming-cycles-1" });
  });
  const r = await upcoming.getUpcomingFromAnchors(manifest(), a.from, a.to, "all", "all");
  assert.deepEqual(r, { status: "unavailable", reason: "invalid_response" });
  assert.equal(h.calculationRequests.length, 3);
  assert.equal(h.gatewayRequests.length, 0);
});
test("unqualified and unknown-time anchors are suppressed without requests; failed batches remain explicit and are never retried", async () => {
  const a = fixtures[0].input;
  h.setSwissCalculations(() => Response.json({}, { status: 503 }));
  assert.equal(
    (
      await upcoming.getUpcomingFromAnchors(
        manifest({
          status: "unavailable",
          reason: "unknown_time",
          accuracy: "unknown",
          sampleOffsetsMinutes: [],
          sources: [],
          anchors: [],
        }),
        a.from,
        a.to,
        "all",
        "all",
      )
    ).reason,
    "unknown_time",
  );
  assert.equal(h.calculationRequests.length, 0);
  assert.equal(
    (
      await upcoming.getUpcomingFromAnchors(
        manifest({ sources: manifest().sources.map((s) => ({ ...s, dataId: "bad" })) }),
        a.from,
        a.to,
        "all",
        "all",
      )
    ).reason,
    "unqualified_anchors",
  );
  assert.equal(h.calculationRequests.length, 0);
  const failed = await upcoming.getUpcomingFromAnchors(manifest(), a.from, a.to, "all", "all");
  assert.equal(failed.status, "unavailable");
  assert.equal(h.calculationRequests.length, 3);
  h.calculationRequests.length = 0;
  h.setSwissCalculations((body) =>
    body.targets[0].name === "sun"
      ? Response.json(fixtures[0].actual)
      : Response.json({}, { status: 503 }),
  );
  const partial = await upcoming.getUpcomingFromAnchors(manifest(), a.from, a.to, "all", "all");
  assert.equal(partial.status, "available");
  assert.equal(partial.calculationStatus, "partial");
  assert.deepEqual(partial.missingTargets, [
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "ascendant",
    "midheaven",
  ]);
  assert.equal(h.calculationRequests.length, 3);
});
test("changed source, anchor identity, range, phase, counts and durations cannot become qualified windows", () => {
  const f = fixtures[0];
  assert.doesNotThrow(() => upcoming.parseUpcoming(f.actual, f.input));
  for (const mutate of [
    (r) => (r.source.engineVersion = "other"),
    (r) => (r.range.to = "2028-01-01T00:00:00.000Z"),
    (r) => (r.windows[0].id = "cycle:" + "0".repeat(32)),
    (r) => (r.windows[0].phase = r.windows[0].phase === "upcoming" ? "active" : "upcoming"),
    (r) => r.totalMatched++,
    (r) => (r.windows[0].duration = r.windows[0].duration === "long" ? "short" : "long"),
    (r) => (r.windows[0].exactRanges = []),
  ]) {
    const r = structuredClone(f.actual);
    mutate(r);
    assert.throws(() => upcoming.parseUpcoming(r, f.input));
  }
});
test("authenticated calculation is owner scoped and cached, and calendar timezone permission selects the reference instant", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-13T10:00:00.000Z") });
  const db = h.records();
  await h.seedChart(db, h.userA, {
    fingerprint: "synthetic-future-test",
    transitAnchors: manifest(),
  });
  h.setSwissCalculations((body) =>
    Response.json(fixtures.find((f) => f.input.targets[0].name === body.targets[0].name).actual),
  );
  const first = await h.app.getUpcomingCycles(db, h.userA, "Pacific/Honolulu", 365, "all", "all");
  assert.equal(first.timezone, "UTC");
  assert.equal(first.calculation.status, "available");
  assert.equal(h.calculationRequests.length, 3);
  t.mock.timers.tick(60000);
  const cached = await h.app.getUpcomingCycles(db, h.userA, "UTC", 365, "all", "all");
  assert.equal(h.calculationRequests.length, 3);
  assert.equal(cached.computedAt, first.computedAt);
  assert.equal(
    (await h.app.getUpcomingCycles(db, h.userB, "UTC", 365, "all", "all")).needsOnboarding,
    true,
  );
  await h.app.setConsent(db, h.userA, "DEV-01", true);
  h.setSwissCalculations(() => Response.json({}, { status: 503 }));
  const local = await h.app.getUpcomingCycles(db, h.userA, "Pacific/Honolulu", 90, "all", "all");
  assert.equal(local.timezone, "Pacific/Honolulu");
  assert.equal(local.from, "2026-10-13T22:00:00.000Z");
  assert.equal(h.gatewayRequests.length, 0);
});
test("legacy future coverage caches are bypassed while corrected calculations are reused", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-13T10:00:00.000Z") });
  const db = h.records(),
    anchors = manifest();
  const snapshot = await h.seedChart(db, h.userA, {
    fingerprint: "synthetic-future-test",
    transitAnchors: anchors,
  });
  h.setSwissCalculations((body) =>
    Response.json(fixtures.find((f) => f.input.targets[0].name === body.targets[0].name).actual),
  );
  const cache = await h.vite.ssrLoadModule("/src/lib/astro/transit-timing-cache.server.ts");
  const { transitEpisodePolicy } = await h.vite.ssrLoadModule(
    "/src/lib/astro/transit-episodes.server.ts",
  );
  const oldKey = await h.cryptoModule.keyedFingerprint(h.userA, {
    version: "future-timing-cache-1",
    snapshotId: snapshot.snapshotId,
    fingerprint: snapshot.fingerprint,
    anchors,
    from: fixtures[0].input.from,
    to: fixtures[0].input.to,
    domain: "all",
    duration: "all",
    policy: transitEpisodePolicy(),
  });
  await cache.cachedTimingCalculation(h.userA, oldKey, async () => ({
    calculation: { status: "available", calculationStatus: "complete", windows: [] },
    computedAt: "legacy-coverage-sentinel",
  }));
  const corrected = await h.app.getUpcomingCycles(db, h.userA, "UTC", 365, "all", "all");
  assert.equal(h.calculationRequests.length, 3);
  assert.notEqual(corrected.computedAt, "legacy-coverage-sentinel");
  assert.equal(corrected.calculation.status, "available");
  const cached = await h.app.getUpcomingCycles(db, h.userA, "UTC", 365, "all", "all");
  assert.equal(h.calculationRequests.length, 3);
  assert.equal(cached.computedAt, corrected.computedAt);
});
