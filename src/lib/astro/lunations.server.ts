import { z } from "zod";
import {
  swissCalculation,
  verifySwissSource,
  type SwissCalculationResult,
} from "./swiss-calculations.server";
import { transitEpisodePolicy } from "./transit-episodes.server";
const instant = z.string().datetime({ precision: 3 });
export const LUNATION_KINDS = [
  "new-moon",
  "full-moon",
  "solar-total",
  "solar-annular",
  "solar-hybrid",
  "solar-partial",
  "lunar-total",
  "lunar-partial",
  "lunar-penumbral",
] as const;
const longitude = z.number().finite().min(0).lt(360);
const eventSchema = z
  .object({
    id: z.string().regex(/^sky:[a-f0-9]{32}$/),
    kind: z.enum(LUNATION_KINDS),
    at: instant,
    sunLongitude: longitude,
    moonLongitude: longitude,
    elongationDegrees: longitude,
    targetDegrees: z.union([z.literal(0), z.literal(180), z.null()]),
    residualDegrees: z.number().min(0).max(0.001).nullable(),
    nativeClassification: z.number().int().min(1).max(255).nullable(),
    sourceId: z.string().min(1).max(160),
    localVisibility: z.null(),
    uncertaintySeconds: z.literal(60),
  })
  .strict();
export type LunationEvent = z.infer<typeof eventSchema>;
const cache = new Map<string, { until: number; value: SwissCalculationResult<LunationEvent[]> }>();
/** Public derived ephemeris only: no member chart, cache writes or model input. */
export async function getLunations(
  from: string,
  to: string,
): Promise<SwissCalculationResult<LunationEvent[]>> {
  const a = Date.parse(from),
    b = Date.parse(to),
    policy = transitEpisodePolicy();
  if (
    !instant.safeParse(from).success ||
    !instant.safeParse(to).success ||
    !(b > a) ||
    b - a > 366 * 86400000
  )
    return { status: "unavailable", reason: "invalid_request" };
  const key = JSON.stringify([
    "swiss-astronomy-events/1",
    "lunations-eclipses-1",
    policy.sourceId,
    policy.endpoint,
    from,
    to,
  ]);
  const found = cache.get(key);
  if (found && found.until > Date.now()) return found.value;
  const result = await swissCalculation(
    "/v1/astronomy-events",
    { contract: "swiss-astronomy-events/1", sourceId: policy.sourceId, from, to },
    (raw, sourceId) => {
      const r = z
        .object({
          status: z.literal("complete"),
          contract: z.literal("swiss-astronomy-events/1"),
          solverVersion: z.literal("lunations-eclipses-1"),
          sourceId: z.literal(sourceId),
          source: z.unknown(),
          range: z
            .object({ from: z.literal(from), to: z.literal(to), boundary: z.literal("half-open") })
            .strict(),
          events: z.array(eventSchema).max(40),
        })
        .strict()
        .parse(raw);
      verifySwissSource(r.source, sourceId);
      const ids = new Set<string>();
      let previous = -Infinity;
      for (const e of r.events) {
        const ms = Date.parse(e.at);
        if (ms < a || ms >= b || ms < previous || e.sourceId !== sourceId || ids.has(e.id))
          throw Error("Invalid event range.");
        ids.add(e.id);
        previous = ms;
        const phase = e.kind === "new-moon" || e.kind === "full-moon";
        if (
          phase
            ? e.targetDegrees !== (e.kind === "new-moon" ? 0 : 180) ||
              e.residualDegrees === null ||
              e.nativeClassification !== null
            : e.targetDegrees !== null ||
              e.residualDegrees !== null ||
              e.nativeClassification === null
        )
          throw Error("Invalid event geometry.");
      }
      return r.events;
    },
  );
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, {
    until: Date.now() + (result.status === "available" ? 600_000 : 10_000),
    value: result,
  });
  return result;
}
