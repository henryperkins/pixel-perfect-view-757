import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credentials.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./auth.server");
    return m.signUpWithPassword(data.email, data.password);
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credentials.parse(d))
  .handler(async ({ data }) => {
    const m = await import("./auth.server");
    return m.signInWithPassword(data.email, data.password);
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const m = await import("./auth.server");
  return m.signOutCurrent();
});

export const currentSession = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./auth.server");
  return { session: await m.getSessionUser() };
});
