import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANGUAGE_PROVIDERS } from "./ai/diagnostics";
import { requireAuth } from "./auth-middleware";
import { checkInInputSchema } from "./check-in";
import { LIFE_DOMAINS } from "./context-policy";
import {
  readingEvaluationInputSchema,
  readingEvaluationRunInputSchema,
} from "./ai/reading-evaluation.shared";

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
        expectedRevision: z.string().max(160).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    const { accuracy, timezone, expectedRevision, ...details } = data;
    return m.saveBirth(context.db, context.userId, details, accuracy, timezone, expectedRevision);
  });

export const updateConsent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ sourceId: z.string(), granted: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.setConsent(context.db, context.userId, data.sourceId, data.granted);
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
  .inputValidator((d: unknown) => checkInInputSchema.parse(d))
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
        domainPref: z.enum(LIFE_DOMAINS).nullable().optional(),
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
      data.domainPref,
    );
  });

export const exportData = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.exportEverything(context.db, context.userId);
  });

export const resetPersonalization = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./account-data.server");
    return m.resetPersonalization(context.userId, context.db);
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ context, data }) => {
    const m = await import("./account-data.server");
    const result = await m.deleteAccount(context.userId, data.password, context.db);
    const auth = await import("./auth.server");
    auth.clearCurrentSessionCookie();
    return result;
  });

export const fetchCycles = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        day: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        timezone: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.getCyclesFor(context.db, context.userId, data.day, data.timezone ?? "UTC");
  });

export const fetchJournal = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.listJournal(context.db, context.userId);
  });

export const fetchReadingJournal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        day: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        cycleKeys: z.array(z.string().min(1).max(120)).max(20),
        featureKeys: z.array(z.string().min(1).max(120)).max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.listReadingJournal(
      context.db,
      context.userId,
      data.day,
      data.cycleKeys,
      data.featureKeys,
    );
  });

export const fetchBirthRecord = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.loadBirthRecord(context.db, context.userId);
  });

export const addEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        domain: z.string().min(1).max(40),
        label: z.string().min(1).max(400),
        body: z.string().max(4000).nullable().optional(),
        cycleKey: z.string().max(120).nullable().optional(),
        featureKey: z.string().max(120).nullable().optional(),
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
      data.body ?? null,
      data.cycleKey ?? null,
      data.featureKey ?? null,
    );
  });

export const editEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1),
        label: z.string().trim().min(1).max(400),
        body: z.string().max(4000).nullable(),
        expectedRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.updateLifeEvent(context.db, context.userId, data);
  });

export const removeEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.deleteLifeEvent(context.db, context.userId, data.id);
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
    return m.activateRelease(context.db, context.userId, data.releaseId);
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

export const fetchFeatureNarrative = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ featureKey: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.getFeatureNarrative(context.db, context.userId, data.featureKey);
  });

export const fetchContentDrafts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return { drafts: await m.listDrafts(context.db, context.userId) };
  });

export const fetchReadingQuality = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.readingQuality(context.db, context.userId);
  });

export const fetchLanguageProviders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const m = await import("./pattern.server");
    return m.listLanguageProviders(context.db, context.userId);
  });

/** One fixed synthetic case per request; credentials and facts stay server-side. */
export const runReadingEvaluationCase = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => readingEvaluationInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.runReadingEvaluationCase(
      context.db,
      context.userId,
      data.caseId,
      data.bundleSource ?? "active",
      data.provider ?? "lovable",
    );
  });

/** Starts a server-side run; it continues on the edge plane after the admin leaves. */
export const startReadingEvaluationRun = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => readingEvaluationRunInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const m = await import("./evaluation-runs.server");
    return m.startEvaluationRun(context.db, context.userId, data, new URL(getRequest().url).origin);
  });

export const fetchReadingEvaluationRun = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        runId: z.string().min(1).max(80).optional(),
        after: z.number().int().min(0).max(1000).optional(),
      })
      .strict()
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./evaluation-runs.server");
    return m.readEvaluationRun(context.db, context.userId, data);
  });

export const stopReadingEvaluationRun = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ runId: z.string().min(1).max(80) })
      .strict()
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./evaluation-runs.server");
    return m.stopEvaluationRun(context.db, context.userId, data.runId);
  });

export const draftContentRelease = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ provider: z.enum(LANGUAGE_PROVIDERS).optional() })
      .strict()
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.draftRelease(context.db, context.userId, data.provider);
  });

export const publishContentDraft = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ draftId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.publishDraft(context.db, context.userId, data.draftId);
  });

export const discardContentDraft = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ draftId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("./pattern.server");
    return m.discardDraft(context.db, context.userId, data.draftId);
  });
