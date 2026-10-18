import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
async function result<T>(
  operation: () => Promise<T>,
): Promise<T | { error: string; retryable?: true }> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.name === "BillingBusyError")
      return { error: error.message, retryable: true };
    return { error: (await import("./stripe.server")).getStripeErrorMessage(error) };
  }
}
export const fetchMembership = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./billing.server")).getMembership(context.userId, context.db),
  );
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ plan: z.enum(["month", "year"]) }))
  .handler(async ({ context, data }) =>
    result(async () =>
      (await import("./billing.server")).startCheckout(
        context.userId,
        context.email,
        data.plan,
        context.db,
      ),
    ),
  );
export const openMembershipPortal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    result(async () =>
      (await import("./billing.server")).membershipPortal(
        context.userId,
        context.email,
        context.db,
      ),
    ),
  );
export const cancelMembership = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    result(async () =>
      (await import("./billing.server")).cancelMembership(context.userId, context.db),
    ),
  );
export const changeMembership = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ action: z.enum(["resume", "month", "year"]) }))
  .handler(async ({ context, data }) =>
    result(async () =>
      (await import("./billing.server")).updateMembership(context.userId, data.action, context.db),
    ),
  );
export const refreshMembership = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    z.object({
      sessionId: z
        .string()
        .regex(/^cs_(test_|live_)?[A-Za-z0-9_]+$/)
        .max(250)
        .optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    result(async () =>
      (await import("./billing.server")).refreshMembership(
        context.userId,
        data.sessionId,
        context.db,
      ),
    ),
  );
export function unwrapBilling<T>(value: T): Exclude<T, { error: string }> {
  if (value && typeof value === "object" && "error" in value)
    throw Object.assign(new Error(String(value.error)), {
      retryable: "retryable" in value && value.retryable === true,
    });
  return value as Exclude<T, { error: string }>;
}
/** Only billing-lease contention is safe to repeat automatically, and at most twice. */
export const retryBillingContention = (failureCount: number, error: Error) =>
  failureCount < 2 && error instanceof Error && "retryable" in error && error.retryable === true;
