import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = new URL(request.url).searchParams.get("env");
        if (env !== "sandbox" && env !== "live")
          return new Response("Invalid environment", { status: 400 });
        return (await import("@/lib/billing-webhook.server")).billingWebhook(request, env);
      },
    },
  },
});
