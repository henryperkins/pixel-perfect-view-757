import { createFileRoute } from "@tanstack/react-router";
import { billingConfig } from "@/lib/billing-config.server";
import { handleBillingEvent, stripeClient } from "@/lib/billing.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = (await billingConfig()).webhookSecret;
        if (!secret) return new Response("Not configured", { status: 503 });
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        let event;
        try {
          event = await (
            await stripeClient()
          ).webhooks.constructEventAsync(await request.text(), signature, secret);
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }
        try {
          await handleBillingEvent(event);
        } catch {
          return new Response("Membership update could not be completed", { status: 500 });
        }
        return Response.json({ received: true });
      },
    },
  },
});
