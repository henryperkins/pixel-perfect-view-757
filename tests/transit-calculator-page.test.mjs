import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
let vite, check, cycles, chart, ephemeris, timing, anchors, seo;

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
  check = await vite.ssrLoadModule("/src/lib/astro/contact-check.ts");
  cycles = await vite.ssrLoadModule("/src/lib/astro/cycles.ts");
  chart = await vite.ssrLoadModule("/src/lib/astro/chart.ts");
  ephemeris = await vite.ssrLoadModule("/src/lib/astro/ephemeris.ts");
  timing = await vite.ssrLoadModule("/src/components/pattern/timing.ts");
  anchors = await vite.ssrLoadModule("/src/lib/astro/transit-anchors.ts");
  seo = await vite.ssrLoadModule("/src/lib/seo.ts");
});
after(async () => await vite?.close());

test("worked example on the calculator page matches the ranking rules", () => {
  // Saturn at 12°30′ Aries against a natal Sun at 14°00′ Capricorn.
  const r = check.checkContact({
    body: "saturn",
    bodyLongitude: 12.5,
    point: "sun",
    pointLongitude: 284,
    accuracy: "exact",
  });
  assert.equal(r.separation, 88.5);
  assert.equal(r.aspect, "square");
  assert.equal(r.orb, 1.5);
  assert.equal(r.limit, 3);
  assert.equal(r.inOrb, true);
  assert.equal(r.importance.toFixed(2), "0.50");
  assert.equal(timing.weightLabel(r.importance), "Prominent");
  assert.equal(timing.contactTitle("saturn", r.aspect, "sun"), "Saturn pressing on your Sun");
});

test("the arithmetic check ranks a real sky exactly as computeCycles does", () => {
  const when = new Date("2026-10-12T12:00:00Z");
  const jd = ephemeris.toJulianDay(when);
  const base = chart.computeChart({
    utcISO: "1990-01-01T12:00:00Z",
    latitude: 51.5,
    longitude: 0,
    timezone: "UTC",
    accuracy: "exact",
  });
  for (const [body, aspect, offset] of [
    ["saturn", "square", 1.25],
    ["jupiter", "trine", -0.8],
    ["venus", "sextile", 2.1],
    ["mars", "quincunx", 0.5],
  ]) {
    const transitLon = ephemeris.positionOf(body, jd).lon;
    const angle = chart.ASPECTS.find((a) => a.key === aspect).angle;
    const natalLon = ephemeris.norm360(transitLon - angle - offset);
    const synthetic = structuredClone(base);
    synthetic.points.sun.lon = natalLon;
    const cycle = cycles
      .computeCycles(synthetic, when)
      .find((c) => c.transit_body === body && c.natal_point === "sun");
    assert.ok(cycle, `${body} ${aspect} should be in orb`);
    const r = check.checkContact({
      body,
      bodyLongitude: transitLon,
      point: "sun",
      pointLongitude: natalLon,
      accuracy: "exact",
    });
    assert.equal(cycle.aspect, r.aspect);
    assert.equal(cycle.orb, Number(r.orb.toFixed(2)));
    assert.equal(cycle.importance, Number(r.importance.toFixed(4)));
  }
});

test("angle contacts follow the birth-time rules the page states", () => {
  const ascendant = (accuracy) =>
    check.checkContact({
      body: "saturn",
      bodyLongitude: 12.5,
      point: "ascendant",
      pointLongitude: 284,
      accuracy,
    });
  assert.equal(ascendant("near").factors.angle, 1);
  assert.equal(ascendant("hour").factors.angle, cycles.UNCERTAIN_ANGLE_FACTOR);
  assert.equal(ascendant("hour").importance.toFixed(2), "0.27");
  assert.equal(ascendant("unknown").suppressed, true);
  assert.equal(ascendant("unknown").importance, null);
  // The FAQ and the birth-time table describe exactly these thresholds.
  assert.deepEqual(
    ["exact", "near", "hour", "unknown"].map((a) => {
      const s = chart.birthTimeSupport(a);
      return [s.housesReliable, s.angleClaimsSuppressed];
    }),
    [
      [true, false],
      [true, false],
      [false, false],
      [false, true],
    ],
  );
  // The page names Jupiter through Pluto as the bodies with service timing.
  assert.deepEqual([...anchors.STORY_BODIES], ["jupiter", "saturn", "uranus", "neptune", "pluto"]);
});

test("pairs outside the limit are not ranked", () => {
  const r = check.checkContact({
    body: "moon",
    bodyLongitude: 10,
    point: "venus",
    pointLongitude: 104,
    accuracy: "exact",
  });
  assert.equal(r.aspect, "square");
  assert.equal(r.orb, 4);
  assert.equal(r.inOrb, false);
  assert.equal(r.importance, null);
});

test("strength labels keep their boundaries", () => {
  assert.deepEqual([0.7, 0.6999, 0.4, 0.3999, 0, -1, Number.NaN].map(timing.weightLabel), [
    "Major",
    "Prominent",
    "Prominent",
    "Background",
    "Background",
    "Background",
    "Background",
  ]);
});

test("sitemap, robots and canonical links name the same public pages", () => {
  const sitemap = readFileSync(join(projectRoot, "public/sitemap.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(
    locs,
    seo.PUBLIC_PATHS.map((path) => seo.absoluteUrl(path)),
  );
  const robots = readFileSync(join(projectRoot, "public/robots.txt"), "utf8");
  assert.match(robots, new RegExp(`^Sitemap: ${seo.absoluteUrl("/sitemap.xml")}$`, "m"));
  for (const path of seo.PUBLIC_PATHS) {
    const file = path === "/" ? "src/routes/index.tsx" : `src/routes${path}.tsx`;
    assert.ok(existsSync(join(projectRoot, file)), `${path} needs a route`);
    const head = seo.publicPageHead({ path, title: "t", description: "d" });
    assert.deepEqual(head.links, [{ rel: "canonical", href: seo.absoluteUrl(path) }]);
    assert.ok(
      head.meta.some((m) => m.property === "og:url" && m.content === seo.absoluteUrl(path)),
    );
  }
});

test("the share image is a 1200 by 630 JPEG", () => {
  const bytes = readFileSync(join(projectRoot, "public", seo.SHARE_IMAGE.path));
  assert.equal(seo.SHARE_IMAGE.type, "image/jpeg");
  assert.ok(bytes.length < 300_000, "keep link previews quick to fetch");
  let offset = 2;
  let size = null;
  while (offset < bytes.length) {
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      size = { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      break;
    }
    offset += 2 + length;
  }
  assert.deepEqual(size, { width: seo.SHARE_IMAGE.width, height: seo.SHARE_IMAGE.height });
});

test("site defaults never repeat the homepage's title or description", () => {
  const home = readFileSync(join(projectRoot, "src/routes/index.tsx"), "utf8");
  assert.ok(!home.includes(seo.SITE_DEFAULTS.title));
  assert.ok(!home.includes(seo.SITE_DEFAULTS.description));
  const root = seo.siteMeta();
  assert.ok(!root.some((m) => m.name === "twitter:title" || m.name === "twitter:description"));
  assert.ok(!root.some((m) => m.property === "og:url"));
});
