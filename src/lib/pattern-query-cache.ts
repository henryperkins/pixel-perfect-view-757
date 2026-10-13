import type { QueryClient } from "@tanstack/react-query";

/** Stop old requests before clearing the chart and its retained chapter readers. */
export async function clearPatternQueries(client: QueryClient) {
  await Promise.all([
    client.cancelQueries({ queryKey: ["pattern"] }),
    client.cancelQueries({ queryKey: ["feature-narrative"] }),
    client.cancelQueries({ queryKey: ["upcoming-cycles"] }),
  ]);
  client.removeQueries({ queryKey: ["pattern"] });
  client.removeQueries({ queryKey: ["feature-narrative"] });
  client.removeQueries({ queryKey: ["upcoming-cycles"] });
}

/** Cancel old responses before removing consent-dependent local context. */
export async function clearReadingContextQueries(client: QueryClient) {
  for (const key of [
    "today",
    "cycles",
    "journal",
    "upcoming-cycles",
    "sky-events",
    "coarse-location",
  ]) {
    await client.cancelQueries({ queryKey: [key] });
    client.removeQueries({ queryKey: [key] });
  }
}
