import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/retention-step")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRetentionStep } = await import("../../../lib/retention.server");
        return handleRetentionStep(request);
      },
    },
  },
});
