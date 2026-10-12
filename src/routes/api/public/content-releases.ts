import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  ContentReleaseError,
  stageContentRelease,
  setActiveContentRelease,
} from "../../../lib/content/release-lifecycle.server";

const bundleSchema = z.object({
  version: z
    .string()
    .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
    .max(64),
  bundle: z.record(z.string(), z.unknown()),
  activate: z.boolean().optional(),
  expectedPreviousVersion: z.string().max(64).nullable().optional(),
});
function verify(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/content-releases")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const raw = await request.text();
        if (raw.length > 1000000)
          return new Response("Release exceeds the content limit", { status: 413 });
        if (!verify(raw, request.headers.get("x-pattern-signature"), secret))
          return new Response("Invalid signature", { status: 401 });
        let parsed: z.infer<typeof bundleSchema>;
        try {
          parsed = bundleSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid release bundle", { status: 400 });
        }
        try {
          const { records } = await import("../../../lib/d1.server");
          const db = records();
          const input = {
            version: parsed.version,
            bundle: parsed.bundle,
            actor: { kind: "signed-public" as const },
            source: "public-ingest" as const,
          };
          const staged = await stageContentRelease(db, input);
          // Existing upload callers activate by default; an explicit false stages only.
          const receipt =
            parsed.activate === false
              ? staged
              : await setActiveContentRelease(db, {
                  version: parsed.version,
                  expectedPreviousVersion: parsed.expectedPreviousVersion,
                  actor: input.actor,
                  source: input.source,
                });
          return Response.json(
            { ok: true, ...receipt, workflowInstanceId: null },
            { status: receipt.publication.status === "complete" ? 200 : 202 },
          );
        } catch (error) {
          return new Response(
            error instanceof Error ? error.message : "Release publication failed",
            { status: error instanceof ContentReleaseError ? error.status : 500 },
          );
        }
      },
    },
  },
});
