import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

const password = z.string().min(8).max(200);
const token = z.string().regex(/^[a-f0-9]{64}$/);
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().trim().email().max(200) }))
  .handler(async ({ data }) => {
    const m = await import("./account-security.server");
    return m.requestPasswordReset(
      data.email,
      getRequest().headers.get("cf-connecting-ip") ?? "unknown",
    );
  });
export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token, password }))
  .handler(async ({ data }) =>
    (await import("./account-security.server")).consumeAccountToken(
      data.token,
      "reset",
      data.password,
    ),
  );
export const confirmEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token }))
  .handler(async ({ data }) =>
    (await import("./account-security.server")).consumeAccountToken(data.token, "confirm"),
  );
export const fetchAccountSecurity = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./account-security.server")).securityStatus(context.userId, context.db),
  );
export const sendConfirmation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./account-security.server")).sendConfirmation(context.userId, context.db),
  );
export const fetchEmailDelivery = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    (await import("./account-security.server")).emailDeliveryStatus(context.userId, context.db),
  );
export const changeEmail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    z.object({
      currentPassword: z.string().min(1).max(200),
      email: z.string().trim().email().max(200),
    }),
  )
  .handler(async ({ context, data }) =>
    (await import("./account-security.server")).changeEmail(
      context.userId,
      data.currentPassword,
      data.email,
      context.db,
    ),
  );
export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ currentPassword: z.string().min(1).max(200), password }))
  .handler(async ({ context, data }) => {
    const result = await (
      await import("./account-security.server")
    ).changePassword(context.userId, data.currentPassword, data.password, context.db);
    (await import("./auth.server")).clearCurrentSessionCookie();
    return result;
  });

export const signOutAll = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const result = await (await import("./account-security.server")).signOutAll(context.userId, context.db);
    (await import("./auth.server")).clearCurrentSessionCookie();
    return result;
  });
