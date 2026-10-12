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
  .handler(async ({ context }) => {
    const m = await import("./assistant.server");
    return m.unlinkIdentity(context.userId);
  });

export const fetchAssistantAccess = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./assistant.server");
    return m.assistantAccess(context.userId);
  });

export const revokeAssistantGrant = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ clientId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./assistant.server");
    return m.revokeGrant(context.userId, data.clientId);
  });

/** Consent page: identity verified from its own token, never from input claims. */
export const assistantConsentStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => token.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./assistant.server");
    return m.consentStatus(data.accessToken);
  });

export const recordAssistantGrant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    token
      .extend({
        clientId: z.string().min(1).max(200),
        clientName: z.string().max(200).nullable(),
        scopes: z.array(z.enum(["today", "pattern", "journal"])).max(3),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const m = await import("./assistant.server");
    return m.recordGrant(data.accessToken, data.clientId, data.clientName, data.scopes);
  });
