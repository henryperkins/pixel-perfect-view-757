import { createFileRoute } from "@tanstack/react-router";
/** Engineering build attribution is available only to signed-in administrators. */
export const Route = createFileRoute("/api/public/evaluation-identity")({
  server: {
    handlers: {
      GET: async () => {
        const { getSessionUser } = await import("../../../lib/auth.server");
        const user = await getSessionUser();
        if (!user?.isAdmin)
          return new Response("Administrator access required", {
            status: user ? 403 : 401,
            headers: { "cache-control": "no-store" },
          });
        const { evaluationSourceSha, EVALUATION_REQUEST_POLICY_VERSION } =
          await import("../../../lib/ai/qualification-plan.server");
        const { READING_EVAL_FIXTURE_VERSION } =
          await import("../../../lib/ai/reading-evaluation.fixtures.mjs");
        return Response.json(
          {
            sourceSha: evaluationSourceSha(),
            requestPolicyVersion: EVALUATION_REQUEST_POLICY_VERSION,
            fixtureVersion: READING_EVAL_FIXTURE_VERSION,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
