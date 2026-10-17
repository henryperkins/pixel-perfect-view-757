import { loadStripe, type Stripe } from "@stripe/stripe-js";
type StripeEnv = "sandbox" | "live";
const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
export function getStripeEnvironment(): StripeEnv {
  if (token?.startsWith("pk_test_")) return "sandbox";
  if (token?.startsWith("pk_live_")) return "live";
  throw new Error("Stripe payments are not configured for this build. Complete Stripe go-live in your Lovable project to enable production checkout.");
}
let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe() {
  getStripeEnvironment();
  if (!stripePromise) stripePromise = loadStripe(token as string);
  return stripePromise;
}