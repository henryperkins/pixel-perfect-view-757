import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  ContentReleaseError,
  setActiveContentRelease,
} from "../../../lib/content/release-lifecycle.server";
const bodySchema = z.object({
  version: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/),
  expectedPreviousVersion: z.string().max(64).nullable().optional(),
});
function verify(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const Route = createFileRoute("/api/public/content-releases/rollback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const raw = await request.text();
        if (!verify(raw, request.headers.get("x-pattern-signature"), secret))
          return new Response("Invalid signature", { status: 401 });
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid rollback request", { status: 400 });
        }
        try {
          const { records } = await import("../../../lib/d1.server");
          const receipt = await setActiveContentRelease(records(), {
            ...parsed,
            actor: { kind: "signed-public" },
            source: "public-rollback",
          });
          return Response.json(
            { ok: true, ...receipt, workflowInstanceId: null },
            { status: receipt.publication.status === "complete" ? 200 : 202 },
          );
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Release rollback failed", {
            status: error instanceof ContentReleaseError ? error.status : 500,
          });
        }
      },
      GET: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        if (!verify("", request.headers.get("x-pattern-signature"), secret))
          return new Response("Invalid signature", { status: 401 });
        const { records } = await import("../../../lib/d1.server");
        const { data, error } = await records()
          .from<{
            version: string;
            checksum: string;
            checksum_algorithm: string | null;
            is_active: boolean;
            created_at: string;
            publication_state: unknown;
          }>("content_releases")
          .select("version,checksum,checksum_algorithm,is_active,created_at,publication_state")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) return new Response("Release inventory could not be read", { status: 500 });
        return Response.json({ releases: data ?? [] });
      },
    },
  },
});
