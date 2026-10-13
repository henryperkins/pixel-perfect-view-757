import { createFileRoute } from "@tanstack/react-router";
/** Public build identity only: no provider call, account access or key material. */
export const Route = createFileRoute("/api/public/evaluation-identity")({
  server: {
    handlers: {
      GET: async () => {
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
