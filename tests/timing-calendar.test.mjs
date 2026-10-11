import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
let vite, timing, travel;

before(async () => {
  vite = await createServer({
    root: projectRoot,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: { alias: { "@": join(projectRoot, "src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  timing = await vite.ssrLoadModule("/src/components/pattern/timing.ts");
  travel = await vite.ssrLoadModule("/src/components/pattern/time-travel.ts");
});
after(async () => await vite?.close());

test("closest-pass dates use the effective calendar instead of slicing UTC", () => {
  const cycle = { exact_at: "2026-10-11T01:00:00Z", days_to_exact: null, phase: "applying" };
  assert.equal(timing.daysToExact(cycle, "2026-10-11", "America/Los_Angeles"), -1);
  assert.equal(timing.windowPhase(cycle, "2026-10-11", "America/Los_Angeles"), "fading");
  assert.equal(timing.timingDate(cycle.exact_at, "America/Los_Angeles"), "Oct 10, 2026");
  assert.equal(timing.daysToExact(cycle, "2026-10-11", "Pacific/Kiritimati"), 0);
  assert.equal(timing.timingDate("2026-10-11T23:00:00Z", "Pacific/Kiritimati"), "Oct 12, 2026");
});

test("date-only selections keep their original civil day in every zone", () => {
  for (const zone of ["America/Los_Angeles", "Pacific/Kiritimati", "UTC"])
    assert.equal(timing.timingDate("2026-10-11", zone), "Oct 11, 2026");
  assert.equal(travel.travelDate("2026-10-11"), "October 11, 2026");
  assert.equal(travel.shiftTravelDate("2026-03-08", 1, "day"), "2026-03-09");
  assert.equal(timing.timingDate("2026-02-30", "America/Los_Angeles"), "Not in range");
});

test("a timeline uses local noon and an explicit server reference when supplied", () => {
  const cycle = {
    ingress_at: "2026-10-11T00:00:00Z",
    exact_at: "2026-10-11T12:00:00Z",
    egress_at: "2026-10-12T00:00:00Z",
  };
  assert.equal(
    timing.timelinePositions(cycle, "2026-10-11", "America/Los_Angeles").today,
    (19 / 24) * 100,
  );
  assert.equal(
    timing.timelinePositions(cycle, "2026-10-11", "America/Los_Angeles", "2026-10-11T20:00:00Z")
      .today,
    (20 / 24) * 100,
  );
  assert.equal(timing.timelinePositions({ ...cycle, ingress_at: null }, "2026-10-11", "UTC"), null);
});

test("calendar phase fallback stays whole-day accurate across a DST boundary", () => {
  const cycle = { exact_at: "2026-03-09T00:30:00Z", days_to_exact: null, phase: "applying" };
  assert.equal(timing.daysToExact(cycle, "2026-03-08", "America/New_York"), 0);
  assert.equal(timing.windowPhase(cycle, "2026-03-08", "America/New_York"), "exact");
  assert.equal(
    timing.daysToExact({ ...cycle, days_to_exact: 3 }, "2026-03-08", "America/New_York"),
    3,
  );
  assert.equal(
    timing.daysToExact({ ...cycle, exact_at: "invalid" }, "2026-03-08", "America/New_York"),
    null,
  );
});
