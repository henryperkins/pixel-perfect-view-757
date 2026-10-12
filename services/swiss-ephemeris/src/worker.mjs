// SPDX-License-Identifier: AGPL-3.0-or-later
import { createEngine } from "./engine.mjs";
import { solveEpisodes } from "./episodes.mjs";
process.once("message", ({ path, input }) => {
  try {
    const engine = createEngine();
    const data = path === "/v1/chart" ? engine.chart(input) : solveEpisodes(input, engine);
    process.send({ data }, () => process.disconnect());
  } catch (error) {
    process.send({ error: error.message }, () => process.disconnect());
  }
});
