import { createHash } from "node:crypto";
import { positionSourceSchema } from "./transit-anchors";
import { transitEpisodePolicy } from "./transit-episodes.server";
export const SWISS_CALCULATION_DEADLINE_MS = 6000;
/** A qualified source ID binds the exact native engine/data/frame used by the service. */
export function verifySwissSource(value: unknown, sourceId: string) {
  const source = positionSourceSchema.parse(value);
  const expected =
    "pattern-swiss-1:" +
    createHash("sha256")
      .update(
        JSON.stringify({
          source,
          utc: "swe_utc_to_jd",
          wrapper: "sweph@2.10.3-7",
          solver: "transit-episode-1",
        }),
      )
      .digest("hex")
      .slice(0, 32);
  if (expected !== sourceId) throw Error("Unqualified Swiss source.");
  return source;
}
export type SwissCalculationResult<T> =
  | { status: "available"; value: T }
  | {
      status: "unavailable";
      reason: "not_configured" | "invalid_request" | "transport" | "timeout" | "invalid_response";
    };
/** New calculation endpoints share bounded transport. Member prose never uses this client. */
export async function swissCalculation<T>(
  path: "/v1/astronomy-events" | "/v1/solar-context" | "/v1/upcoming-cycles",
  input: Record<string, unknown>,
  parse: (raw: unknown, sourceId: string) => T,
  options: { deadlineMs?: number } = {},
): Promise<SwissCalculationResult<T>> {
  const policy = transitEpisodePolicy();
  if (!policy.enabled) return { status: "unavailable", reason: "not_configured" };
  if (input["sourceId"] !== policy.sourceId)
    return { status: "unavailable", reason: "invalid_request" };
  const endpoint = new URL(path, policy.endpoint).toString(),
    controller = new AbortController();
  let timedOut = false,
    reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const duration = Math.max(
    1,
    Math.min(SWISS_CALCULATION_DEADLINE_MS, options.deadlineMs ?? SWISS_CALCULATION_DEADLINE_MS),
  );
  const deadline = Date.now() + duration;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      void reader?.cancel().catch(() => {});
      reject(Error("deadline"));
    }, duration);
  });
  const run = async (): Promise<SwissCalculationResult<T>> => {
    const key = process.env["SWISS_EPHEMERIS_KEY"]!;
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        authorization: "Bearer " + key,
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      void response.body?.cancel();
      return { status: "unavailable", reason: "transport" };
    }
    if (!response.body) return { status: "unavailable", reason: "invalid_response" };
    reader = response.body.getReader();
    let body = "",
      bytes = 0;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 128 * 1024) {
        await reader.cancel();
        return { status: "unavailable", reason: "invalid_response" };
      }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
    if (timedOut || Date.now() >= deadline) return { status: "unavailable", reason: "timeout" };
    try {
      const value = parse(JSON.parse(body), policy.sourceId);
      return Date.now() >= deadline
        ? { status: "unavailable", reason: "timeout" }
        : { status: "available", value };
    } catch {
      return { status: "unavailable", reason: "invalid_response" };
    }
  };
  try {
    return await Promise.race([run(), timeout]);
  } catch {
    return { status: "unavailable", reason: timedOut ? "timeout" : "transport" };
  } finally {
    clearTimeout(timer!);
    controller.abort();
    void reader?.cancel().catch(() => {});
  }
}
