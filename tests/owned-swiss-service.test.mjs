import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { solveEpisodes } from "../services/swiss-ephemeris/src/episodes.mjs";
import { curve, request } from "../services/swiss-ephemeris/tests/helpers/curves.mjs";
let h, wire, proof;
const nativeReady =
  existsSync(new URL("../services/swiss-ephemeris/node_modules/sweph/", import.meta.url)) &&
  existsSync(new URL("../services/swiss-ephemeris/data/ephe/sepl_18.se1", import.meta.url));
before(async () => {
  h = await createRecordsHarness();
  wire = await h.vite.ssrLoadModule("/src/lib/astro/transit-episodes.ts");
  proof = await h.vite.ssrLoadModule("/src/lib/astro/transit-episode-proof.ts");
});
after(async () => h?.close());
test("native solver output satisfies the app wire and independent geometric proof validator", () => {
  for (const count of [1, 3, 5]) {
    const req = request();
    const scan = wire.parseTransitEpisodeScan(solveEpisodes(req, curve({ count })), req);
    assert.doesNotThrow(() => proof.validateEpisodeProof(scan));
    assert.equal(scan.samples[1].contacts.length, count);
  }
});
test(
  "real Swiss episode output retains enough evidence for existing app acceptance",
  { skip: nativeReady ? false : "Run the standalone Swiss service installation first." },
  async () => {
    const { createEngine } = await import("../services/swiss-ephemeris/src/engine.mjs");
    const engine = createEngine(),
      referenceAt = "2026-10-12T12:00:00.000Z";
    for (const transitBody of ["jupiter", "saturn", "uranus", "neptune", "pluto"]) {
      const longitude = engine.position(transitBody, Date.parse(referenceAt)).longitude;
      const req = request({
        sourceId: engine.sourceId,
        referenceAt,
        transitBody,
        targets: [-2, 0, 2].map((offsetMinutes) => ({ offsetMinutes, longitude })),
      });
      const scan = wire.parseTransitEpisodeScan(solveEpisodes(req, engine), req);
      assert.doesNotThrow(() => proof.validateEpisodeProof(scan), transitBody);
    }
  },
);
test("all 15 recorded independent qualification tracks satisfy app proof validation", () => {
  const base = new URL(
    "../docs/reviews/daily-transit-story/2026-10-12-owned-swiss/",
    import.meta.url,
  );
  const cases = JSON.parse(readFileSync(new URL("cases.json", base)));
  for (const item of cases) {
    const { scan, request } = JSON.parse(readFileSync(new URL(`${item.id}.json`, base)));
    assert.doesNotThrow(
      () => proof.validateEpisodeProof(wire.parseTransitEpisodeScan(scan, request)),
      item.id,
    );
  }
});
test(
  "explicit birth recalculation stores owned source anchors while preserving the legacy snapshot",
  { skip: nativeReady ? false : "Run the standalone Swiss service installation first." },
  async () => {
    const { createEngine } = await import("../services/swiss-ephemeris/src/engine.mjs"),
      engine = createEngine();
    await h.reset();
    const { dek } = await h.seedChart(h.records());
    const legacy = await h.app.loadSnapshot(h.records(), h.userA),
      frozen = JSON.stringify(legacy);
    assert.equal(await h.app.loadTransitAnchors(legacy, dek), null);
    h.setSwiss((_url, init) => Response.json(engine.chart(JSON.parse(init.body))));
    await h.app.saveBirth(
      h.records(),
      h.userA,
      {
        birthDate: "1990-05-15",
        birthTime: "19:34",
        placeLabel: "Synthetic location",
        latitude: 34.0522,
        longitude: -118.2437,
      },
      "exact",
      "UTC",
    );
    assert.equal(h.swissRequests.length, 3);
    const current = await h.app.loadSnapshot(h.records(), h.userA),
      anchors = await h.app.loadTransitAnchors(current, dek);
    assert.equal(anchors.status, "screened");
    assert.ok(anchors.sources.every((s) => s.dataId === engine.source.dataId));
    assert.equal(anchors.anchors.length, 9);
    assert.equal(JSON.stringify(legacy), frozen);
    assert.notEqual(current.id, legacy.id);
  },
);
