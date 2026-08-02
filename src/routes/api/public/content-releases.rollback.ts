import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const bodySchema = z.object({
  version: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/),
});

function verify(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Moves the active release pointer back to a previously ingested release.
 * Published readings are never rewritten — each one already records the
 * content version it was assembled from.
 */
export const Route = createFileRoute("/api/public/content-releases/rollback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        if (!verify(raw, request.headers.get("x-pattern-signature"), secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid rollback request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: target, error: findErr } = await supabaseAdmin
          .from("content_releases")
          .select("id, version, checksum, bundle")
          .eq("version", parsed.version)
          .maybeSingle();
        if (findErr) return new Response(findErr.message, { status: 500 });
        if (!target) return new Response("Unknown release version", { status: 404 });

        // A release is only a valid rollback target if it still resolves content.
        const families = Object.keys((target.bundle ?? {}) as Record<string, unknown>);
        if (families.length === 0) {
          return new Response("Target release has an empty content graph", { status: 422 });
        }

        await supabaseAdmin
          .from("content_releases")
          .update({ is_active: false })
          .neq("id", target.id);
        const { error: activateErr } = await supabaseAdmin
          .from("content_releases")
          .update({ is_active: true })
          .eq("id", target.id);
        if (activateErr) return new Response(activateErr.message, { status: 500 });

        return Response.json({
          ok: true,
          activeVersion: target.version,
          checksum: target.checksum,
        });
      },

      // Release inventory for the editorial plane: versions and pointer state only.
      GET: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        if (!verify("", request.headers.get("x-pattern-signature"), secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("content_releases")
          .select("version, checksum, is_active, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ releases: data ?? [] });
      },
    },
  },
});
