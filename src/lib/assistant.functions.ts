import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware";

const token = z.object({ accessToken: z.string().min(20).max(8000) });

/** Signed-in Pattern member links an assistant identity (proof of both accounts). */
export const linkAssistantIdentity = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => token.parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./assistant.server");
    return m.linkIdentity(context.userId, data.accessToken);
  });

export const unlinkAssistantIdentity = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ accessToken: z.string().min(20).max(8000).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const m = await import("./assistant.server");
    return m.unlinkIdentity(context.userId, data.accessToken);
  });

export const fetchAssistantAccess = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./assistant.server");
    return m.assistantAccess(context.userId);
  });

export const revokeAssistantGrant = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        clientId: z.string().min(1).max(200),
        accessToken: z.string().min(20).max(8000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./assistant.server");
    return m.revokeGrant(context.userId, data.clientId, data.accessToken);
  });

/** The server resolves the client from an auth-server authorization request. */
export const fetchAssistantAuthorization = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    token.extend({ authorizationId: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const m = await import("./assistant.server");
    return m.getAuthorization(data.accessToken, data.authorizationId);
  });

export const decideAssistantAuthorization = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    token
      .extend({
        authorizationId: z.string().min(1).max(200),
        scopes: z.array(z.enum(["today", "pattern", "journal"])).max(3),
        action: z.enum(["approve", "deny"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const m = await import("./assistant.server");
    return m.decideAuthorization(data.accessToken, data.authorizationId, data.scopes, data.action);
  });
