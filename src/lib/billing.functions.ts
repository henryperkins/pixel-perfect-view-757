import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
async function result<T>(operation: () => Promise<T>): Promise<T | { error: string }> {
  try { return await operation(); }
  catch (error) { return { error: (await import("./stripe.server")).getStripeErrorMessage(error) }; }
}
export const fetchMembership = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({context}) => (await import("./billing.server")).getMembership(context.userId,context.db));
export const startCheckout = createServerFn({method:"POST"}).middleware([requireAuth]).inputValidator(z.object({plan:z.enum(["month","year"])})).handler(async ({context,data}) => result(async()=> (await import("./billing.server")).startCheckout(context.userId,context.email,data.plan,context.db)));
export const openMembershipPortal = createServerFn({method:"POST"}).middleware([requireAuth]).handler(async ({context}) => result(async()=> (await import("./billing.server")).membershipPortal(context.userId,context.email,context.db)));
export const cancelMembership = createServerFn({method:"POST"}).middleware([requireAuth]).handler(async ({context}) => result(async()=> (await import("./billing.server")).cancelMembership(context.userId,context.db)));
export const changeMembership = createServerFn({method:"POST"}).middleware([requireAuth]).inputValidator(z.object({action:z.enum(["resume","month","year"])})).handler(async ({context,data}) => result(async()=> (await import("./billing.server")).updateMembership(context.userId,data.action,context.db)));
export const refreshMembership = createServerFn({method:"POST"}).middleware([requireAuth]).inputValidator(z.object({sessionId:z.string().regex(/^cs_(test_|live_)?[A-Za-z0-9_]+$/).max(250).optional()})).handler(async ({context,data}) => result(async()=> (await import("./billing.server")).refreshMembership(context.userId,data.sessionId,context.db)));
export function unwrapBilling<T>(value:T | {error:string}):T { if (value && typeof value === "object" && "error" in value) throw new Error(String(value.error)); return value as T; }
