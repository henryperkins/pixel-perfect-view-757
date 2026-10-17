import { useCallback } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { startCheckout, unwrapBilling } from "@/lib/billing.functions";
import type { MembershipPlan } from "@/lib/billing-policy";
export function StripeEmbeddedCheckout({
  plan,
  onError,
}: {
  plan: MembershipPlan;
  onError: (message: string) => void;
}) {
  const fetchClientSecret = useCallback(async () => {
    try {
      return unwrapBilling(await startCheckout({ data: { plan } })).clientSecret;
    } catch (error) {
      onError(error instanceof Error ? error.message : "Checkout could not open.");
      throw error;
    }
  }, [plan, onError]);
  return (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
