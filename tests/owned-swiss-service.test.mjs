import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { solveEpisodes } from "../services/swiss-ephemeris/src/episodes.mjs";
import { createEngine } from "../services/swiss-ephemeris/src/engine.mjs";
import { curve, request } from "../services/swiss-ephemeris/tests/helpers/curves.mjs";
let h, wire, proof;
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
test("real Swiss episode output retains enough evidence for existing app acceptance", () => {
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
});
