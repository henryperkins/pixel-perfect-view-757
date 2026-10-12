import {
  parseTransitEpisodeScan,
  transitEpisodeRequestSchema,
  type TransitEpisodeRequest,
  type TransitEpisodeScanResult,
} from "./transit-episodes";
const DEADLINE_MS = 6000,
  MAX_BYTES = 128 * 1024;
/** Only explicit reviewed configuration enables calls; credentials never enter identity. */
export function transitEpisodePolicy() {
  const url = process.env["SWISS_TRANSIT_EPISODE_URL"] ?? "",
    sourceId = process.env["SWISS_TRANSIT_EPISODE_SOURCE_ID"] ?? "";
  let valid = false;
  try {
    const u = new URL(url);
    valid =
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.hash &&
      sourceId.length > 0 &&
      sourceId.length <= 160;
  } catch {
    /* disabled */
  }
  return { enabled: valid && !!process.env["SWISS_EPHEMERIS_KEY"], endpoint: url, sourceId };
}
export async function resolveTransitEpisodeScan(
  input: TransitEpisodeRequest,
): Promise<TransitEpisodeScanResult> {
  const policy = transitEpisodePolicy();
  const unavailable = (
    reason: Extract<TransitEpisodeScanResult, { status: "unavailable" }>["reason"],
  ): TransitEpisodeScanResult => ({ status: "unavailable", reason });
  if (!policy.enabled) return unavailable("not_configured");
  if (input.sourceId !== policy.sourceId) return unavailable("unqualified_source");
  const request = transitEpisodeRequestSchema.safeParse(input);
  if (!request.success) return unavailable("invalid_response");
  const controller = new AbortController();
  let timedOut = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const deadline = Date.now() + DEADLINE_MS;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      void reader?.cancel().catch(() => {});
      reject(new Error("deadline"));
    }, DEADLINE_MS);
  });
  const run = async (): Promise<TransitEpisodeScanResult> => {
    const key = process.env["SWISS_EPHEMERIS_KEY"]!;
    const response = await fetch(policy.endpoint, {
      method: "POST",
      // Workers rejects redirect: "error" before making a request. Manual mode
      // leaves 3xx responses to the non-OK guard below without forwarding keys.
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(request.data),
    });
    if (!response.ok) {
      void response.body?.cancel();
      return unavailable("transport");
    }
    if (!response.body) return unavailable("invalid_response");
    reader = response.body.getReader();
    let bytes = 0;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let body = "";
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > MAX_BYTES) {
          await reader.cancel();
          return unavailable("invalid_response");
        }
        body += decoder.decode(part.value, { stream: true });
      }
      body += decoder.decode();
      if (timedOut || Date.now() >= deadline) return unavailable("timeout");
      const scan = parseTransitEpisodeScan(JSON.parse(body), request.data);
      if (Date.now() >= deadline) return unavailable("timeout");
      return { status: "available", scan };
    } catch {
      return unavailable(timedOut ? "timeout" : "invalid_response");
    }
  };
  try {
    return await Promise.race([run(), timeout]);
  } catch {
    return unavailable(timedOut ? "timeout" : "transport");
  } finally {
    clearTimeout(timer!);
    controller.abort();
    void reader?.cancel().catch(() => {});
  }
}

import type { AssembledReading } from "../reading.server";
import type { TransitAnchorManifest, Triple, StoryBody } from "./transit-anchors";
import { STORY_BODIES } from "./transit-anchors";
import {
  TRANSIT_EPISODE_CONTRACT,
  TRANSIT_EPISODE_SOLVER_VERSION,
  resolveDailyTransitCalculation,
  type DailyTransitCalculation,
} from "./transit-episodes";
import { transitOrb } from "./cycles";
import { localNoon } from "../local-day";
import { assertUse } from "../registry";
export async function resolveTransitForReading(
  assembled: AssembledReading,
  anchor: TransitAnchorManifest | null,
  day: string,
  timezone: string,
): Promise<DailyTransitCalculation> {
  const p = assembled.eligibleCycles[0];
  const omitted = (
    reason: Extract<DailyTransitCalculation, { status: "omitted" }>["reason"],
  ): DailyTransitCalculation => ({ status: "omitted", reason });
  if (!p || !STORY_BODIES.includes(p.transit_body as StoryBody))
    return omitted("unsupported_primary");
  if (!assembled.interpretationPlan.interpretations.some((i) => i.index === 1))
    return omitted("no_primary_copy");
  if (
    assembled.transitStoryPlan.status === "omitted" &&
    assembled.transitStoryPlan.reason === "no_catalogue"
  )
    return omitted("no_catalogue");
  if (!anchor || anchor.status !== "screened") return omitted("no_anchor");
  const target = anchor.anchors.find((a) => a.target === p.natal_point);
  if (!target) return omitted("no_anchor");
  const policy = transitEpisodePolicy();
  if (!policy.enabled) return omitted("unqualified_source");
  assertUse("AST-05", "calculation");
  assertUse("AST-08", "timing");
  const result = await resolveTransitEpisodeScan({
    contract: TRANSIT_EPISODE_CONTRACT,
    solverVersion: TRANSIT_EPISODE_SOLVER_VERSION,
    sourceId: policy.sourceId,
    transitBody: p.transit_body as StoryBody,
    aspect: p.aspect,
    targets: anchor.sampleOffsetsMinutes.map((offsetMinutes, i) => ({
      offsetMinutes,
      longitude: target.longitudes[i]!,
    })) as Triple<{ offsetMinutes: number; longitude: number }>,
    referenceAt: localNoon(day, timezone).toISOString(),
    maxOrbDegrees: transitOrb(p.transit_body, p.aspect),
  });
  if (result.status === "unavailable")
    return omitted(
      result.reason === "invalid_response"
        ? "invalid_scan"
        : result.reason === "unqualified_source" || result.reason === "not_configured"
          ? "unqualified_source"
          : "service_unavailable",
    );
  return resolveDailyTransitCalculation(result.scan, anchor, p, day, timezone);
}
