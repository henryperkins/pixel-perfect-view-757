import type { QueryClient } from "@tanstack/react-query";

/** Stop old requests before clearing the chart and its retained chapter readers. */
export async function clearPatternQueries(client: QueryClient) {
  await Promise.all([
    client.cancelQueries({ queryKey: ["pattern"] }),
    client.cancelQueries({ queryKey: ["feature-narrative"] }),
  ]);
  client.removeQueries({ queryKey: ["pattern"] });
  client.removeQueries({ queryKey: ["feature-narrative"] });
}
