import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";

export const fetchToday = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ timezone: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.getToday(context.db, context.userId, data.timezone);
  });

export const fetchBootstrap = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    const db = context.db;
    const [profile, consents, snapshot] = await Promise.all([
      m.loadProfile(db, context.userId),
      m.loadConsents(db, context.userId),
      m.loadSnapshot(db, context.userId),
    ]);
    return { profile, consents, hasChart: Boolean(snapshot) };
  });

export const saveBirthProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
      context.db,
      context.userId,
      details,
      accuracy,
      timezone,
    );
  });

export const updateConsent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ sourceId: z.string(), granted: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.setConsent(
      context.db,
      context.userId,
      data.sourceId,
      data.granted,
    );
  });

export const fetchPattern = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.getPattern(context.db, context.userId);
  });

export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
      context.db,
      context.userId,
      data.readingId,
      data.resonance,
      data.labels,
    );
  });

export const saveDailyCheckIn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mood: z.number().int().min(1).max(5).nullable(),
        energy: z.number().int().min(1).max(5).nullable(),
        note: z.string().max(2000).nullable(),
        // Tier 3 self-reported bands (WEL-01 sleep, WEL-03 stress). Coarse
        // 1-5 only; the server drops either unless that source is consented.
        sleep: z.number().int().min(1).max(5).nullable().default(null),
        stress: z.number().int().min(1).max(5).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.saveCheckIn(
      context.db,
      context.userId,
      data.day,
      data.mood,
      data.energy,
      data.note,
      data.sleep,
      data.stress,
    );
  });


export const savePrefs = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
      context.db,
      context.userId,
      data.displayName,
      data.tone,
      data.depth,
    );
  });

export const exportData = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.exportEverything(context.db, context.userId);
  });

export const eraseData = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.eraseEverything(context.db, context.userId);
  });

export const fetchCycles = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.getCyclesFor(context.db, context.userId, data.day);
  });

export const fetchJournal = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.listJournal(context.db, context.userId);
  });

export const addEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        domain: z.string().min(1).max(40),
        label: z.string().min(1).max(400),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.addLifeEvent(
      context.db,
      context.userId,
      data.occurredOn,
      data.domain,
      data.label,
    );
  });

export const fetchReleases = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    const db = context.db;
    const [releases, admin] = await Promise.all([
      m.listReleases(db),
      m.isAdmin(db, context.userId),
    ]);
    return { releases, isAdmin: admin };
  });

export const activateContentRelease = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ releaseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.activateRelease(
      context.db,
      context.userId,
      data.releaseId,
    );
  });


export const fetchEdgePlane = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    const w = await import("./workflows.server");
    const db = context.db;
    const [ledger, admin] = await Promise.all([
      w.listWorkflowRuns(),
      m.isAdmin(db, context.userId),
    ]);
    return { ...ledger, isAdmin: admin };
  });

export const triggerEdgeRun = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    const w = await import("./workflows.server");
    const db = context.db;
    if (!(await m.isAdmin(db, context.userId))) {
      throw new Error("Only admins can start edge runs.");
    }
    const started = await w.triggerReadingWorkflow({ kind: "manual-reading", day: data.day });
    if (!started) throw new Error("The edge workflow plane is unreachable.");
    await db.from("audit_events").insert({
      user_id: context.userId,
      kind: "workflow_run_started",
      detail: { instanceId: started.instanceId, day: data.day },
    });
    return started;
  });
