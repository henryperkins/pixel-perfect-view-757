import { createHmac } from "node:crypto";
import { z } from "zod";

const schema = z.object({
  enabled: z.boolean(),
  secretKey: z.string(),
  webhookSecret: z.string(),
  monthPriceId: z.string(),
  yearPriceId: z.string(),
  portalConfigurationId: z.string(),
});
export type BillingConfig = z.infer<typeof schema>;
let cached: { value: BillingConfig; until: number } | undefined;

/** Server-to-server only. The existing signed records plane also owns billing secrets. */
export async function billingConfig(): Promise<BillingConfig> {
  if (process.env["PATTERN_MEMBERSHIPS_ENABLED"] !== undefined)
    return {
      enabled: process.env["PATTERN_MEMBERSHIPS_ENABLED"] === "true",
      secretKey: process.env["STRIPE_SECRET_KEY"] ?? "",
      webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] ?? "",
      monthPriceId: process.env["STRIPE_MONTHLY_PRICE_ID"] ?? "",
      yearPriceId: process.env["STRIPE_YEARLY_PRICE_ID"] ?? "",
      portalConfigurationId: process.env["STRIPE_PORTAL_CONFIGURATION_ID"] ?? "",
    };
  if (cached && cached.until > Date.now()) return cached.value;
  const base = process.env["PATTERN_WORKFLOW_URL"],
    secret = process.env["PATTERN_WORKFLOW_SECRET"];
  if (!base || !secret) throw new Error("Membership settings are unavailable.");
  const raw = JSON.stringify({
    purpose: "membership-config",
    issuedAt: Date.now(),
    nonce: crypto.randomUUID(),
  });
  const response = await fetch(`${base.replace(/\/$/, "")}/billing/config`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pattern-signature": createHmac("sha256", secret).update(raw).digest("hex"),
    },
    body: raw,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("Membership settings are unavailable. Please try again.");
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Membership settings are unavailable.");
  cached = { value: parsed.data, until: Date.now() + 60_000 };
  return parsed.data;
}
