import type { StripeEnv } from "./stripe.server";
export type BillingConfig = {
  enabled: boolean; environment: StripeEnv; webhookSecret: string;
  monthPriceId: string; yearPriceId: string; portalConfigurationId: string;
};
export function billingEnvironment(): StripeEnv {
  const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'];
  if (token?.startsWith("pk_test_")) return "sandbox";
  if (token?.startsWith("pk_live_")) return "live";
  throw new Error("Payments are not configured for this build. Complete Stripe go-live before accepting real payments.");
}
export async function billingConfig(): Promise<BillingConfig> {
  const environment = billingEnvironment();
  return {
    environment, enabled: process.env["PATTERN_MEMBERSHIPS_ENABLED"] !== "false",
    webhookSecret: process.env[environment === "sandbox" ? "PAYMENTS_SANDBOX_WEBHOOK_SECRET" : "PAYMENTS_LIVE_WEBHOOK_SECRET"] ?? "",
    monthPriceId: "plus_monthly", yearPriceId: "plus_yearly",
    portalConfigurationId: process.env[environment === "sandbox" ? "STRIPE_SANDBOX_PORTAL_CONFIGURATION_ID" : "STRIPE_LIVE_PORTAL_CONFIGURATION_ID"] ?? "",
  };
}
