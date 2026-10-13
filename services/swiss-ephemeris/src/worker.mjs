// SPDX-License-Identifier: AGPL-3.0-or-later
import { createEngine } from "./engine.mjs";
import { solveEpisodes } from "./episodes.mjs";
import { calculateLunations } from "./lunations.mjs";
import { calculateSolarContext } from "./solar.mjs";
import { calculateUpcoming } from "./upcoming.mjs";
process.once("message", ({ path, input }) => {
  try {
    const engine = createEngine();
    const data =
      path === "/v1/chart"
        ? engine.chart(input)
        : path === "/v1/astronomy-events"
          ? calculateLunations(input, engine)
          : path === "/v1/solar-context"
            ? calculateSolarContext(input, engine)
            : path === "/v1/upcoming-cycles"
              ? calculateUpcoming(input, engine)
              : solveEpisodes(input, engine);
    process.send({ data }, () => process.disconnect());
  } catch (error) {
    process.send({ error: error.message }, () => process.disconnect());
  }
});
