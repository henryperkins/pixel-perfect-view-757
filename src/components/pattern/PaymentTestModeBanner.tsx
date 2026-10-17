const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];
export function PaymentTestModeBanner() {
  if (token?.startsWith("pk_live_")) return null;
  return (
    <div
      className="w-full border-y border-rule bg-muted px-4 py-3 text-center text-sm"
      role="status"
    >
      {token?.startsWith("pk_test_")
        ? "All payments made in the preview are in test mode. No real money is charged."
        : "Production checkout is not configured. Complete Stripe go-live in your Lovable project to accept real payments."}
    </div>
  );
}
