import { createMiddleware } from "@tanstack/react-start";

/**
 * Session gate for server functions. The route guard protects the UI; this
 * protects the RPC endpoint, which is the actual security boundary.
 */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getSessionUser } = await import("./auth.server");
  const { records } = await import("./d1.server");
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized: no active session");
  return next({
    context: { db: records(), userId: session.userId, email: session.email },
  });
});
