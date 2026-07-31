import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DB } from "./pattern.server";

export const fetchToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ timezone: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.getToday(context.supabase as unknown as DB, context.userId, data.timezone);
  });

export const fetchBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    const db = context.supabase as unknown as DB;
    const [profile, consents, snapshot] = await Promise.all([
      m.loadProfile(db, context.userId),
      m.loadConsents(db, context.userId),
      m.loadSnapshot(db, context.userId),
    ]);
    return { profile, consents, hasChart: Boolean(snapshot) };
  });

export const saveBirthProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        birthTime: z.string().regex(/^\d{2}:\d{2}$/),
        placeLabel: z.string().min(1).max(160),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezone: z.string().min(1),
        accuracy: z.enum(["exact", "near", "hour", "unknown"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    const { accuracy, timezone, ...details } = data;
    return m.saveBirth(
      context.supabase as unknown as DB,
      context.userId,
      details,
      accuracy,
      timezone,
    );
  });

export const updateConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sourceId: z.string(), granted: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.setConsent(
      context.supabase as unknown as DB,
      context.userId,
      data.sourceId,
      data.granted,
    );
  });

export const fetchPattern = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.getPattern(context.supabase as unknown as DB, context.userId);
  });

export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        readingId: z.string().uuid(),
        resonance: z.number().int().min(-1).max(1),
        labels: z.array(z.string()).max(6).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.submitFeedback(
      context.supabase as unknown as DB,
      context.userId,
      data.readingId,
      data.resonance,
      data.labels,
    );
  });

export const saveDailyCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mood: z.number().int().min(1).max(5).nullable(),
        energy: z.number().int().min(1).max(5).nullable(),
        note: z.string().max(2000).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.saveCheckIn(
      context.supabase as unknown as DB,
      context.userId,
      data.day,
      data.mood,
      data.energy,
      data.note,
    );
  });

export const savePrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        displayName: z.string().max(80).nullable(),
        tone: z.enum(["plain", "warm", "clinical"]),
        depth: z.enum(["standard", "technical"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.updatePrefs(
      context.supabase as unknown as DB,
      context.userId,
      data.displayName,
      data.tone,
      data.depth,
    );
  });

export const exportData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.exportEverything(context.supabase as unknown as DB, context.userId);
  });

export const eraseData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.eraseEverything(context.supabase as unknown as DB, context.userId);
  });
