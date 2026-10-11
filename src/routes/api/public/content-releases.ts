import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { samePublishedBundle, validateContentGraph } from "../../../lib/content/schema";

const bundleSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  bundle: z.record(z.string(), z.unknown()),
});

interface PublishedRelease {
  id: string;
  version: string;
  checksum: string;
  is_active: boolean;
  bundle: unknown;
}

function replayResponse(existing: PublishedRelease, bundle: unknown): Response {
  if (!samePublishedBundle(existing.bundle, bundle)) {
    return new Response("Release version conflict with differing content", { status: 409 });
  }
  return Response.json({
    ok: true,
    version: existing.version,
    checksum: existing.checksum,
    workflowInstanceId: null,
  });
}

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

        try {
          validateContentGraph(parsed.bundle);
        } catch (err) {
          return new Response(err instanceof Error ? err.message : "Invalid release graph", {
            status: 422,
          });
        }

        const { records } = await import("../../../lib/d1.server");
        const db = records();

        const findVersion = () =>
          db
            .from<PublishedRelease>("content_releases")
            .select("id, version, checksum, is_active, bundle")
            .eq("version", parsed.version)
            .maybeSingle();
        const { data: existing, error: existingErr } = await findVersion();
        if (existingErr) return new Response(existingErr.message, { status: 500 });

        // An active or differing row is answered without change. An identical row
        // left inactive by a failed activation is activated below, so a retry
        // converges instead of reporting success while the release is not live.
        if (
          existing &&
          (existing.is_active || !samePublishedBundle(existing.bundle, parsed.bundle))
        )
          return replayResponse(existing, parsed.bundle);

        let release: { id: string; checksum: string };
        if (existing) {
          release = { id: existing.id, checksum: existing.checksum };
        } else {
          const checksum = createHmac("sha256", secret)
            .update(JSON.stringify(parsed.bundle))
            .digest("hex");

          // Store inactive first, then update the existing active pointer.
          const { data: inserted, error } = await db
            .from<{ id: string }>("content_releases")
            .insert({
              version: parsed.version,
              bundle: parsed.bundle,
              checksum,
              is_active: false,
            })
            .select("id")
            .single();
          if (error) {
            // Another request may have published this version after the initial
            // lookup. That request owns the activation; this one only reuses or
            // rejects its row.
            const { data: winner, error: rereadErr } = await findVersion();
            if (rereadErr) return new Response(rereadErr.message, { status: 500 });
            if (winner) return replayResponse(winner, parsed.bundle);
            return new Response(error.message, { status: 500 });
          }
          release = { id: inserted.id, checksum };
        }

        await db.from("content_releases").update({ is_active: false }).neq("id", release.id);
        const { error: activateErr } = await db
          .from("content_releases")
          .update({ is_active: true })
          .eq("id", release.id);
        if (activateErr) return new Response(activateErr.message, { status: 500 });

        // Mirror into the edge plane and kick off a durable build for today.
        const w = await import("../../../lib/workflows.server");
        await w.syncReleasePointer(parsed.version, release.checksum);
        const run = await w.triggerReadingWorkflow({
          kind: "release-ingest",
          version: parsed.version,
        });

        return Response.json({
          ok: true,
          version: parsed.version,
          checksum: release.checksum,
          workflowInstanceId: run?.instanceId ?? null,
        });
      },
    },
  },
});
