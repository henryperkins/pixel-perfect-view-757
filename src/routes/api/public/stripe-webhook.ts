import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return (await import("@/lib/billing-webhook.server")).billingWebhook(request,"sandbox");
      },
    },
  },
});
