import { resolveTransitEpisodeScan } from "../../../../src/lib/astro/transit-episodes.server.ts";
import fixture from "../2026-10-12-owned-swiss/jupiter-single-direct.json";

globalThis.process = {
  env: {
    SWISS_TRANSIT_EPISODE_URL: "https://episode-fixture.invalid/v1/transit-episodes",
    SWISS_TRANSIT_EPISODE_SOURCE_ID: fixture.request.sourceId,
    SWISS_EPHEMERIS_KEY: "synthetic-runtime-test-key",
  },
};

export default {
  async test() {
    let rejected = false;
    try {
      new Request("https://episode-fixture.invalid", { redirect: "error" });
    } catch (error) {
      rejected = true;
      console.log("Runtime diagnostic:", error.message);
    }
    if (!rejected) throw Error("This reproduction expected workerd to reject redirect:error");
    const result = await resolveTransitEpisodeScan(fixture.request);
    if (result.status !== "available")
      throw Error("Valid episode request was rejected: " + JSON.stringify(result));
    console.log("PASS: the app adapter accepts the valid scan in workerd");
  },
};
