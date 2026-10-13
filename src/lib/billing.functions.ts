import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

export const fetchMembership = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./billing.server")).getMembership(context.userId, context.db),
  );
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ plan: z.enum(["month", "year"]) }))
  .handler(async ({ context, data }) =>
    (await import("./billing.server")).startCheckout(
      context.userId,
      context.email,
      data.plan,
      context.db,
    ),
  );
export const openMembershipPortal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./billing.server")).membershipPortal(context.userId, context.db),
  );
export const cancelMembership = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./billing.server")).cancelMembership(context.userId, context.db),
  );
export const refreshMembership = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    z.object({
      sessionId: z
        .string()
        .regex(/^cs_test_[A-Za-z0-9_]+$/)
        .max(250)
        .optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    (await import("./billing.server")).refreshMembership(
      context.userId,
      data.sessionId,
      context.db,
    ),
  );
