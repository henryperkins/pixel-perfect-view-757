import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const bundleSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  bundle: z.record(z.string(), z.unknown()),
});

function verify(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/content-releases")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PATTERN_INGEST_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        if (!verify(raw, request.headers.get("x-pattern-signature"), secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof bundleSchema>;
        try {
          parsed = bundleSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid release bundle", { status: 400 });
        }

        const checksum = createHmac("sha256", secret)
          .update(JSON.stringify(parsed.bundle))
          .digest("hex");

        const { records } = await import("@/lib/d1.server");
        const db = records();

        // Store inactive first, then flip the pointer atomically-ish.
        const { data: inserted, error } = await db
          .from<{ id: string }>("content_releases")
          .upsert(
            {
              version: parsed.version,
              bundle: parsed.bundle,
              checksum,
              is_active: false,
            },
            { onConflict: "version" },
          )
          .select("id")
          .single();
        if (error) return new Response(error.message, { status: 500 });

        // Smoke test: the bundle must resolve at least one interpretation family.
        const families = Object.keys(parsed.bundle);
        if (families.length === 0) {
          return new Response("Empty content graph", { status: 422 });
        }

        await db
          .from("content_releases")
          .update({ is_active: false })
          .neq("id", inserted.id);
        const { error: activateErr } = await db
          .from("content_releases")
          .update({ is_active: true })
          .eq("id", inserted.id);
        if (activateErr) return new Response(activateErr.message, { status: 500 });

        // Mirror into the edge plane and kick off a durable build for today.
        const w = await import("@/lib/workflows.server");
        await w.syncReleasePointer(parsed.version, checksum);
        const run = await w.triggerReadingWorkflow({
          kind: "release-ingest",
          version: parsed.version,
        });

        return Response.json({
          ok: true,
          version: parsed.version,
          checksum,
          workflowInstanceId: run?.instanceId ?? null,
        });
      },
    },
  },
});
