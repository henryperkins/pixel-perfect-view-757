import { createStripeClient, type StripeEnv } from "./stripe.server";
import { handleBillingEvent } from "./billing.server";
export async function billingWebhook(request: Request, env: StripeEnv) {
  const secret =
    process.env[
      env === "sandbox" ? "PAYMENTS_SANDBOX_WEBHOOK_SECRET" : "PAYMENTS_LIVE_WEBHOOK_SECRET"
    ];
  if (!secret) return new Response("Not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event;
  try {
    event = await createStripeClient(env).webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    await handleBillingEvent(event, undefined, env);
    return Response.json({ received: true });
  } catch {
    return new Response("Membership update could not be completed", { status: 500 });
  }
}
