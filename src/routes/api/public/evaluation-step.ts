import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/** The edge plane names a run and a case position; nothing else is accepted. */
const stepSchema = z
  .object({
    runId: z.string().min(1).max(80),
    position: z.number().int().min(0).max(1000),
  })
  .strict();

function verify(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signed by the `pattern-workflows` evaluation Workflow, once per synthetic case. */
export const Route = createFileRoute("/api/public/evaluation-step")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PATTERN_WORKFLOW_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        if (!verify(raw, request.headers.get("x-pattern-signature"), secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let step: z.infer<typeof stepSchema>;
        try {
          step = stepSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid evaluation step", { status: 400 });
        }

        const { records } = await import("../../../lib/d1.server");
        const { evaluationStep } = await import("../../../lib/evaluation-runs.server");
        return Response.json(await evaluationStep(records(), step));
      },
    },
  },
});
