/**
 * Durable synthetic evaluation runs.
 *
 * The `pattern-workflows` edge plane runs one Workflow per run and calls the
 * signed `/api/public/evaluation-step` endpoint once per fixed case, so a run
 * keeps going after the admin leaves /content. A run stores its fixed settings,
 * status and per-case results only; it never reads member records. Model
 * requests are never retried: a replayed step returns the stored case.
 */
import type { DBClient } from "./d1.server";
import {
  diagnosticLabel,
  LANGUAGE_PROVIDERS,
  languageModel,
  readDailyDiagnostics,
  type LanguageProvider,
} from "./ai/diagnostics";
import {
  combineReadingEvaluationResults,
  READING_EVALUATION_BUNDLE_SOURCES,
  READING_EVALUATION_CATALOG,
  READING_EVALUATION_STALL_MS,
  readingEvaluationRunActive,
  type ReadingEvaluationBundleSource,
  type ReadingEvaluationCaseResult,
  type ReadingEvaluationRun,
  type ReadingEvaluationRunStatus,
  type ReadingEvaluationLedger,
  type EvaluationJsonValue,
} from "./ai/reading-evaluation.shared";
import { evaluateFixedCase, evaluationBundle, isAdmin } from "./pattern.server";
import {
  createEvaluationPlan,
  createEnterprisePilotPlan,
  evaluationSourceSha,
  type EvaluationPlan,
} from "./ai/qualification-plan.server";
import {
  QUALIFICATION_PROFILES,
  qualificationPolicy,
  type QualificationProfile,
} from "./ai/qualification-profiles";
import { readingEvaluationRunInputSchema } from "./ai/reading-evaluation.shared";
import {
  qualificationReservationMicros,
  qualificationTransportIssue,
  type EnterpriseThinkingLevel,
} from "./ai/admin-transport";
import { startEvaluationWorkflow } from "./workflows.server";

const HALT_CODES = new Set(["not_configured", "auth", "credit", "rate_limit"]);
const jsonValue = (x: unknown): EvaluationJsonValue => JSON.parse(JSON.stringify(x));
/** Reviewable plans and templates; this read-only call never dispatches a Workflow. */
export async function previewEvaluationPlan(
  db: DBClient,
  userId: string,
  settings: ReturnType<typeof readingEvaluationRunInputSchema.parse>,
) {
  await requireAdmin(db, userId);
  readingEvaluationRunInputSchema.parse(settings);
  const bundle = await evaluationBundle(db, settings.bundleSource);
  const sourceSha = evaluationSourceSha();
  if (settings.enterpriseThinking) {
    if (
      settings.provider !== "gemini-enterprise" ||
      settings.bundleSource !== "transit-candidate" ||
      settings.qualificationProfile
    )
      throw Error("Unsupported Enterprise pilot source.");
    const plans = {
      LOW: createEnterprisePilotPlan(bundle, "LOW", sourceSha),
      MEDIUM: createEnterprisePilotPlan(bundle, "MEDIUM", sourceSha),
    };
    return {
      hash: plans[settings.enterpriseThinking].hash,
      attemptLimit: 24,
      sourceSha,
      plans: jsonValue(plans),
    };
  }
  if (settings.qualificationProfile) {
    if (settings.provider !== "lovable" || settings.bundleSource !== "writing-candidate")
      throw Error("Unsupported qualification source.");
    const plans = Object.fromEntries(
      QUALIFICATION_PROFILES.map((p) => [
        p,
        createEvaluationPlan(bundle, p, sourceSha, settings.provider),
      ]),
    );
    return {
      hash: plans[settings.qualificationProfile]!.hash,
      attemptLimit: 196,
      sourceSha,
      plans: jsonValue(plans),
    };
  }
  const plan = createEvaluationPlan(bundle, undefined, sourceSha, settings.provider);
  return { hash: plan.hash, attemptLimit: plan.attemptLimit, sourceSha, plans: jsonValue(plan) };
}
const RUN_COLUMNS =
  "id, user_id, status, provider, bundle_source, case_ids, completed, message, workflow_instance_id, created_at, updated_at,plan,qualification_profile,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,enterprise_thinking,arm_key,campaign_attempt_limit";

interface RunRow {
  id: string;
  user_id: string;
  status: ReadingEvaluationRunStatus;
  provider: LanguageProvider;
  bundle_source: ReadingEvaluationBundleSource;
  case_ids: string[];
  completed: number;
  message: string | null;
  workflow_instance_id: string | null;
  created_at: string;
  updated_at: string;
  plan: EvaluationPlan | null;
  qualification_profile: QualificationProfile | null;
  campaign_id: string | null;
  attempt_limit: number | null;
  dollar_ceiling_micros: number | null;
  review_reserve_micros: number | null;
  enterprise_thinking: EnterpriseThinkingLevel | null;
  arm_key: string | null;
  campaign_attempt_limit: number | null;
}

function view(row: RunRow): ReadingEvaluationRun {
  return {
    id: row.id,
    status: row.status,
    provider: row.provider,
    bundleSource: row.bundle_source,
    total: row.case_ids.length,
    completed: row.completed,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.enterprise_thinking
      ? {
          enterpriseThinking: row.enterprise_thinking,
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
        }
      : {}),
    ...(row.qualification_profile
      ? {
          qualificationProfile: row.qualification_profile,
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
        }
      : {}),
  };
}

async function requireAdmin(db: DBClient, userId: string) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can run a synthetic reading evaluation.");
  }
}

async function updateRun(
  db: DBClient,
  id: string,
  values: Partial<Pick<RunRow, "status" | "message" | "completed" | "workflow_instance_id">>,
): Promise<RunRow | null> {
  // A late response must never resurrect a terminal run or undo a stop request.
  const fields: string[] = [],
    params: (string | number | null)[] = [];
  if (values.status !== undefined) {
    fields.push(
      "status=CASE WHEN status NOT IN ('queued','running','stopping') THEN status WHEN status='stopping' AND ? IN ('queued','running') THEN status WHEN status='stopping' AND ?='complete' THEN 'stopped' ELSE ? END",
    );
    params.push(values.status, values.status, values.status);
  }
  if (values.message !== undefined) {
    fields.push(
      "message=CASE WHEN status IN ('queued','running','stopping') THEN ? ELSE message END",
    );
    params.push(values.message);
  }
  if (values.completed !== undefined) {
    fields.push("completed=MAX(completed,?)");
    params.push(values.completed);
  }
  if (values.workflow_instance_id !== undefined) {
    fields.push("workflow_instance_id=?");
    params.push(values.workflow_instance_id);
  }
  fields.push("updated_at=?");
  params.push(new Date().toISOString(), id);
  await db.exec(`UPDATE evaluation_runs SET ${fields.join(",")} WHERE id=?`, params);
  const { data, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function latestRun(db: DBClient, userId: string): Promise<RunRow | null> {
  const { data, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Starts a run that continues on the edge plane until it completes, stops or halts. */
export async function startEvaluationRun(
  db: DBClient,
  userId: string,
  settings: ReturnType<typeof readingEvaluationRunInputSchema.parse>,
  origin: string,
): Promise<ReadingEvaluationRun> {
  await requireAdmin(db, userId);
  if (!(READING_EVALUATION_BUNDLE_SOURCES as readonly unknown[]).includes(settings.bundleSource))
    throw new Error("Unknown synthetic evaluation bundle.");
  if (!(LANGUAGE_PROVIDERS as readonly unknown[]).includes(settings.provider))
    throw new Error("Unknown language provider.");
  if (settings.qualificationProfile) qualificationPolicy(settings.qualificationProfile);
  readingEvaluationRunInputSchema.parse(settings);
  if (
    settings.enterpriseThinking &&
    (settings.qualificationProfile ||
      settings.provider !== "gemini-enterprise" ||
      settings.bundleSource !== "transit-candidate")
  )
    throw Error(
      "The Enterprise pilot uses only the closed transit candidate and native Enterprise provider.",
    );
  if (
    settings.qualificationProfile &&
    (settings.bundleSource !== "writing-candidate" || settings.provider !== "lovable")
  )
    throw Error(
      "Writing qualification requires the inactive final catalogue and member Lovable provider.",
    );
  if (
    !settings.qualificationProfile &&
    !settings.enterpriseThinking &&
    (settings.campaignId || settings.budget)
  )
    throw Error("Campaign budgets require a qualification profile.");
  const sourceBundle = await evaluationBundle(db, settings.bundleSource);
  const plan: EvaluationPlan = settings.enterpriseThinking
    ? createEnterprisePilotPlan(sourceBundle, settings.enterpriseThinking, evaluationSourceSha())
    : createEvaluationPlan(
        sourceBundle,
        settings.qualificationProfile,
        evaluationSourceSha(),
        settings.provider,
      );
  const runId = crypto.randomUUID();
  if (settings.expectedPlanHash && settings.expectedPlanHash !== plan.hash)
    throw Error(
      "The reviewed source plan changed. Prepare and review a new dry plan before starting.",
    );
  const armKey =
    settings.qualificationProfile ??
    (settings.enterpriseThinking ? `enterprise-${settings.enterpriseThinking}` : null);
  const campaignLimit = settings.enterpriseThinking ? 24 : 224;
  let campaignId: string | null = null,
    ceiling: number | null = null,
    reviewReserve: number | null = null;
  if (settings.qualificationProfile || settings.enterpriseThinking) {
    campaignId = settings.campaignId ?? runId;
    if (settings.campaignId) {
      if (settings.budget)
        throw Error("The campaign budget is immutable; do not replace it on another arm.");
      const { data: root, error } = await db
        .from<RunRow>("evaluation_runs")
        .select(RUN_COLUMNS)
        .eq("id", campaignId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw Error(error.message);
      if (
        !root ||
        root.campaign_id !== root.id ||
        root.arm_key !== (settings.enterpriseThinking ? "enterprise-LOW" : "writing-base") ||
        !root.plan ||
        root.plan.metadata.bundleHash !== plan.metadata.bundleHash ||
        root.plan.metadata.sourceSha !== plan.metadata.sourceSha ||
        root.plan.metadata.caseSetHash !== plan.metadata.caseSetHash ||
        (settings.enterpriseThinking
          ? root.plan.pilotPlans?.[settings.enterpriseThinking]?.hash
          : root.plan.campaignPlans?.[settings.qualificationProfile!]?.hash) !== plan.hash
      )
        throw Error("Unknown or changed qualification campaign source.");
      ceiling = root.dollar_ceiling_micros;
      reviewReserve = root.review_reserve_micros;
      const { data: duplicate, error: duplicateError } = await db
        .from<{ id: string }>("evaluation_runs")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("arm_key", armKey!)
        .maybeSingle();
      if (duplicateError) throw Error(duplicateError.message);
      if (duplicate)
        throw Error("Each frozen qualification arm may start only once in a campaign.");
    } else {
      if (
        (settings.enterpriseThinking
          ? settings.enterpriseThinking !== "LOW"
          : settings.qualificationProfile !== "writing-base") ||
        !settings.budget ||
        settings.budget.reviewReserveCents >= settings.budget.dollarCeilingCents
      )
        throw Error(
          "Start the base arm with an explicit dollar budget and separate review reserve.",
        );
      if (settings.enterpriseThinking) {
        plan.pilotPlans = {
          LOW: createEnterprisePilotPlan(sourceBundle, "LOW", plan.sourceSha),
          MEDIUM: createEnterprisePilotPlan(sourceBundle, "MEDIUM", plan.sourceSha),
        };
        if (Object.values(plan.pilotPlans).reduce((n, p) => n + p.attemptLimit, 0) !== 24)
          throw Error("Enterprise pilot scope changed.");
      } else {
        plan.campaignPlans = Object.fromEntries(
          QUALIFICATION_PROFILES.map((profile) => [
            profile,
            createEvaluationPlan(sourceBundle, profile, plan.sourceSha, settings.provider),
          ]),
        ) as NonNullable<EvaluationPlan["campaignPlans"]>;
        if (Object.values(plan.campaignPlans).reduce((n, p) => n + p.attemptLimit, 0) !== 196)
          throw Error("Qualification scope changed; no generation was started.");
      }
      ceiling = settings.budget.dollarCeilingCents * 10_000;
      reviewReserve = settings.budget.reviewReserveCents * 10_000;
    }
  }

  const previous = await latestRun(db, userId);
  if (previous && readingEvaluationRunActive(previous.status)) {
    if (Date.now() - Date.parse(previous.updated_at) < READING_EVALUATION_STALL_MS)
      throw new Error(
        "A synthetic evaluation is already running. Stop it or wait for it to finish.",
      );
    await updateRun(db, previous.id, {
      status: "error",
      message: "This run stopped making progress and was replaced by a new run.",
    });
  }

  const savedAt = new Date().toISOString();
  if (Buffer.byteLength(JSON.stringify(plan)) > 1_900_000)
    throw Error(
      "The frozen plan exceeds the bounded database row size. No Workflow was dispatched.",
    );
  const cutoff = new Date(Date.now() - READING_EVALUATION_STALL_MS).toISOString();
  const [inserted] = await db.exec<{ id: string }>(
    "INSERT INTO evaluation_runs(id,user_id,status,provider,bundle_source,case_ids,completed,plan,qualification_profile,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,created_at,updated_at,enterprise_thinking,arm_key,campaign_attempt_limit) SELECT ?,?,'queued',?,?,?,0,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND status IN ('queued','running','stopping') AND julianday(updated_at)>julianday(?)) AND (? IS NULL OR NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE campaign_id=? AND arm_key=?)) RETURNING id",
    [
      runId,
      userId,
      settings.provider,
      settings.bundleSource,
      JSON.stringify(plan.cases.map((f) => f.id)),
      JSON.stringify(plan),
      settings.qualificationProfile ?? null,
      campaignId,
      plan.attemptLimit,
      ceiling,
      reviewReserve,
      savedAt,
      savedAt,
      settings.enterpriseThinking ?? null,
      armKey,
      campaignLimit,
      userId,
      cutoff,
      campaignId,
      campaignId,
      armKey,
    ],
  );
  if (!inserted)
    throw Error(
      "An evaluation is already running or this frozen campaign arm was already started.",
    );
  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .single();
  if (error || !created) throw Error(error?.message ?? "The evaluation run could not be read.");

  // The edge plane must reach a public origin; the auth-gated editor preview cannot answer it.
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId: created.id,
    total: created.case_ids.length,
    callback: `${base}/api/public/evaluation-step`,
    planHash: plan.hash,
    ...(created.qualification_profile
      ? { qualificationProfile: created.qualification_profile }
      : {}),
    ...(created.enterprise_thinking ? { enterpriseThinking: created.enterprise_thinking } : {}),
  });
  if (!started?.ok) {
    const message =
      "The edge workflow plane dispatch could not be confirmed. Existing captures and uncertain reservations are retained; no automatic retry was made.";
    await updateRun(db, created.id, { status: "error", message });
    throw new Error(message);
  }
  return view(
    (await updateRun(db, created.id, { workflow_instance_id: started.instanceId })) ?? created,
  );
}

/** The admin's latest run (or one named run) plus results from position `after` on. */
export async function readEvaluationRun(
  db: DBClient,
  userId: string,
  options: { runId?: string | undefined; after?: number | undefined } = {},
): Promise<{
  run: ReadingEvaluationRun | null;
  results: ReadingEvaluationCaseResult[];
  ledger: ReadingEvaluationLedger | null;
}> {
  await requireAdmin(db, userId);
  let run: RunRow | null;
  if (options.runId) {
    const { data, error } = await db
      .from<RunRow>("evaluation_runs")
      .select(RUN_COLUMNS)
      .eq("user_id", userId)
      .eq("id", options.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    run = data;
  } else run = await latestRun(db, userId);
  if (!run) return { run: null, results: [], ledger: null };
  const { data: rows, error } = await db
    .from<{
      position: number;
      case_id: string;
      attempted: number;
      reserved_micros: number;
      result: ReadingEvaluationCaseResult | { kind: "attempt-reservation" };
    }>("evaluation_results")
    .select("position,case_id,result,attempted,reserved_micros")
    .eq("run_id", run.id)
    .order("position")
    .limit(run.case_ids.length);
  if (error) throw new Error(error.message);
  const [totals] = await db.exec<{ attempts: number; reserved: number }>(
    "SELECT COALESCE(SUM(CASE WHEN r.plan IS NULL AND json_valid(e.result) AND json_extract(e.result,'$.case.diagnostics.attempted')=1 THEN 1 ELSE e.attempted END),0) attempts, COALESCE(SUM(e.reserved_micros),0) reserved FROM evaluation_results e JOIN evaluation_runs r ON r.id=e.run_id WHERE r.user_id=? AND (r.id=? OR (? IS NOT NULL AND r.campaign_id=?))",
    [userId, run.id, run.campaign_id, run.campaign_id],
  );
  return {
    run: view(run),
    results: (rows ?? []).flatMap((row) =>
      row.position < (options.after ?? 0) || "kind" in row.result ? [] : [row.result],
    ),
    ledger: {
      version: "evaluation-ledger-1",
      costStatus: run.plan ? "reservation-estimates-not-invoices" : "legacy-accounting-unknown",
      sourcePlan: jsonValue(run.plan),
      dollarCeilingMicros: run.dollar_ceiling_micros,
      reviewReserveMicros: run.review_reserve_micros,
      campaignAttempts: totals?.attempts ?? 0,
      campaignReservedMicros: totals?.reserved ?? 0,
      entries: (rows ?? []).map((row) => ({
        position: row.position,
        caseId: row.case_id,
        attempted:
          !!row.attempted ||
          (!run.plan &&
            !("kind" in row.result) &&
            readDailyDiagnostics(row.result.case.diagnostics)?.attempted === true),
        reservedMicros: row.reserved_micros,
        capture: "kind" in row.result ? "uncertain" : "stored",
        raw: jsonValue(row.result),
      })),
    },
  };
}

async function caseDisposition(
  db: DBClient,
  run: RunRow,
  result: ReadingEvaluationCaseResult,
  position: number,
): Promise<NonNullable<ReadingEvaluationCaseResult["controller"]>> {
  const base = { version: "evaluation-disposition-1" as const, message: null };
  const diagnostics = readDailyDiagnostics(result.case.diagnostics);
  if (!diagnostics)
    return { ...base, status: "error", message: "The captured case has invalid diagnostics." };
  if (HALT_CODES.has(diagnostics.code))
    return {
      ...base,
      status: "halted",
      message: `Run stopped: ${diagnosticLabel(diagnostics.code)}. Remaining cases were not requested.`,
    };
  if (position > 0) {
    const { data: first, error } = await db
      .from<{ result: ReadingEvaluationCaseResult }>("evaluation_results")
      .select("result")
      .eq("run_id", run.id)
      .eq("position", 0)
      .maybeSingle();
    if (error) throw Error(error.message);
    try {
      if (run.enterprise_thinking) {
        if (
          !first ||
          JSON.stringify(first.result.metadata) !== JSON.stringify(result.metadata) ||
          (first.result.case.transport?.actualModel &&
            result.case.transport?.actualModel &&
            first.result.case.transport.actualModel !== result.case.transport.actualModel)
        )
          throw Error("Mixed pilot configuration.");
      } else
        combineReadingEvaluationResults(first ? [first.result, result] : [result], {
          partial: true,
        });
    } catch {
      return {
        ...base,
        status: "error",
        message:
          "Evaluation settings or reported model identity changed. This capture is retained; remaining cases were not requested.",
      };
    }
  }
  const actual = result.case.transport?.actualModel;
  if (actual) {
    const known = await db.exec<{ actual: string }>(
      "SELECT DISTINCT json_extract(result,'$.case.transport.actualModel') actual FROM evaluation_results WHERE run_id=? AND json_valid(result) AND json_extract(result,'$.case.transport.actualModel') IS NOT NULL",
      [run.id],
    );
    if (known.some((row) => row.actual !== actual))
      return {
        ...base,
        status: "error",
        message:
          "The reported model identity changed during this run. This capture is retained; remaining cases were not requested.",
      };
  }
  if (actual && !/^(?:google\/)?gemini-3\.8-flash(?:-\d{3,8})?$/.test(actual))
    return {
      ...base,
      status: "halted",
      message:
        "The reported model differs from the frozen configuration. This capture is retained.",
    };
  if ((run.qualification_profile || run.enterprise_thinking) && diagnostics.attempted) {
    const issue = qualificationTransportIssue(result.case.transport ?? undefined);
    if (issue)
      return {
        ...base,
        status: "halted",
        message: `${issue} The full reservation is retained; remaining cases were not requested.`,
      };
  }
  return { ...base, status: position + 1 >= run.case_ids.length ? "complete" : "running" };
}

async function settleCapturedCase(
  db: DBClient,
  run: RunRow,
  result: ReadingEvaluationCaseResult,
  position: number,
) {
  const disposition = result.controller ?? (await caseDisposition(db, run, result, position));
  const { data: latest, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", run.id)
    .maybeSingle();
  if (error) throw Error(error.message);
  if (!latest || !readingEvaluationRunActive(latest.status)) return { next: false };
  const settled = await updateRun(db, run.id, {
    status: latest.status === "stopping" ? "stopped" : disposition.status,
    completed: position + 1,
    message: disposition.message,
  });
  return { next: settled?.status === "running" };
}

/** Lets the current case finish and keeps its result; the next case never starts. */
export async function stopEvaluationRun(
  db: DBClient,
  userId: string,
  runId: string,
): Promise<ReadingEvaluationRun> {
  await requireAdmin(db, userId);
  const { data: run, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("user_id", userId)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!run) throw new Error("Unknown synthetic evaluation run.");
  if (run.status !== "queued" && run.status !== "running") return view(run);
  return view((await updateRun(db, run.id, { status: "stopping" })) ?? run);
}

/**
 * One signed edge-plane step: runs the case at `position` once and reports whether
 * the workflow should request the next one.
 */
export async function evaluationStep(
  db: DBClient,
  step: {
    runId: string;
    position: number;
    planHash?: string | undefined;
    qualificationProfile?: QualificationProfile | undefined;
    enterpriseThinking?: EnterpriseThinkingLevel | undefined;
  },
): Promise<{ next: boolean }> {
  const { data: run, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", step.runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!run || !readingEvaluationRunActive(run.status)) return { next: false };
  if (
    run.plan &&
    (step.planHash !== run.plan.hash ||
      (step.qualificationProfile ?? null) !== run.qualification_profile ||
      (step.enterpriseThinking ?? null) !== run.enterprise_thinking)
  ) {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "Signed evaluation source plan or profile differs from the frozen run. No case was requested.",
    });
    return { next: false };
  }
  const caseId = run.case_ids[step.position];

  const { data: stored, error: storedError } = await db
    .from<{
      id: string;
      result: ReadingEvaluationCaseResult | { kind: "attempt-reservation"; startedAt: string };
    }>("evaluation_results")
    .select("id,result")
    .eq("run_id", run.id)
    .eq("position", step.position)
    .maybeSingle();
  if (storedError) throw new Error(storedError.message);
  // A replayed step settles the run from the stored case instead of requesting it again.
  if (stored) {
    if ("kind" in stored.result) {
      if (Date.now() - Date.parse(stored.result.startedAt) >= 120_000)
        await updateRun(db, run.id, {
          status: "error",
          message:
            "This case has a reserved attempt with an uncertain outcome. No retry was made; its incomplete record is retained.",
        });
      // Another caller may still be receiving the original request. Its claim
      // remains spent even if the response or final database write is lost.
      return { next: false };
    }
    return settleCapturedCase(db, run, stored.result, step.position);
  }

  if (run.status === "stopping") {
    await updateRun(db, run.id, { status: "stopped" });
    return { next: false };
  }
  if (caseId === undefined || step.position !== run.completed) {
    await updateRun(db, run.id, {
      status: "error",
      message: "Evaluation steps arrived out of order. Completed results are still available.",
    });
    return { next: false };
  }
  if (!(await isAdmin(db, run.user_id))) {
    await updateRun(db, run.id, {
      status: "error",
      message: "The admin who started this run no longer has admin access.",
    });
    return { next: false };
  }
  if (run.status === "queued") await updateRun(db, run.id, { status: "running" });

  if (!run.plan) {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "This older run has no frozen source plan. Its existing results are retained; start a new explicitly scoped run.",
    });
    return { next: false };
  }
  const capturedBundle = await evaluationBundle(db, run.bundle_source);
  const currentPlan = run.enterprise_thinking
    ? createEnterprisePilotPlan(capturedBundle, run.enterprise_thinking, evaluationSourceSha())
    : createEvaluationPlan(
        capturedBundle,
        run.qualification_profile ?? undefined,
        evaluationSourceSha(),
        run.provider,
      );
  if (currentPlan.hash !== run.plan.hash) {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "Frozen evaluation source or policy changed. This case was stopped before provider traffic.",
    });
    return { next: false };
  }
  const planned = run.plan.cases[step.position];
  if (!planned || planned.id !== caseId) throw Error("Frozen evaluation case sequence is invalid.");

  const reservationId = crypto.randomUUID();
  const reservation = {
    version: 1,
    kind: "attempt-reservation",
    startedAt: new Date().toISOString(),
    caseId,
    gatewayTimeoutMs: 60_000,
    outcome: "uncertain",
  };
  // Reserve a conservative amount before transport. Unknown billing keeps its
  // full reservation; billing estimates never masquerade as an invoice.
  const reservedMicros =
    (run.qualification_profile || run.enterprise_thinking) && planned.expectsModel ? 2_800_000 : 0;
  const [claimed] = await db.exec<{ id: string }>(
    "INSERT INTO evaluation_results(id,run_id,position,case_id,result,reserved_micros,attempted) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM evaluation_runs r WHERE r.id=? AND r.completed=? AND r.status IN ('queued','running') AND (SELECT COALESCE(SUM(e.attempted),0) FROM evaluation_results e WHERE e.run_id=r.id)+?<=r.attempt_limit AND (r.campaign_id IS NULL OR ((SELECT COALESCE(SUM(e.attempted),0) FROM evaluation_results e JOIN evaluation_runs a ON a.id=e.run_id WHERE a.campaign_id=r.campaign_id)+?<=r.campaign_attempt_limit AND (SELECT COALESCE(SUM(e.reserved_micros),0) FROM evaluation_results e JOIN evaluation_runs a ON a.id=e.run_id WHERE a.campaign_id=r.campaign_id)+?<=r.dollar_ceiling_micros-r.review_reserve_micros))) ON CONFLICT(run_id,position) DO NOTHING RETURNING id",
    [
      reservationId,
      run.id,
      step.position,
      caseId,
      JSON.stringify(reservation),
      reservedMicros,
      planned.expectsModel ? 1 : 0,
      run.id,
      step.position,
      planned.expectsModel ? 1 : 0,
      planned.expectsModel ? 1 : 0,
      reservedMicros,
    ],
  );
  if (!claimed) {
    const { data: winner, error } = await db
      .from<{ id: string }>("evaluation_results")
      .select("id")
      .eq("run_id", run.id)
      .eq("position", step.position)
      .maybeSingle();
    if (error) throw Error(error.message);
    const { data: latest, error: latestError } = await db
      .from<RunRow>("evaluation_runs")
      .select(RUN_COLUMNS)
      .eq("id", run.id)
      .maybeSingle();
    if (latestError) throw Error(latestError.message);
    if (!winner && latest?.status === "stopping")
      await updateRun(db, run.id, { status: "stopped" });
    else if (!winner && latest && readingEvaluationRunActive(latest.status))
      await updateRun(db, run.id, {
        status: "halted",
        message:
          "The frozen attempt or dollar reservation ceiling was reached before this case. Remaining cases were not requested.",
      });
    return { next: false };
  }

  let result: ReadingEvaluationCaseResult;
  try {
    result = await evaluateFixedCase(
      db,
      caseId,
      run.bundle_source,
      run.provider,
      {
        ...(run.qualification_profile ? { profile: run.qualification_profile } : {}),
        ...(run.enterprise_thinking ? { enterpriseThinking: run.enterprise_thinking } : {}),
        sourceSha: run.plan.sourceSha,
        runPlanHash: run.plan.hash,
      },
      capturedBundle,
    );
  } catch {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "This case could not be completed. Completed results are still available; no automatic retry was made.",
    });
    return { next: false };
  }
  const diagnostics = readDailyDiagnostics(result?.case?.diagnostics);
  if (
    result?.case?.id !== caseId ||
    result.metadata?.bundleSource !== run.bundle_source ||
    result.metadata?.model !== languageModel(run.provider) ||
    !diagnostics ||
    (diagnostics.outcome === "accepted") !== (result.case.output?.mode === "model")
  ) {
    await updateRun(db, run.id, {
      status: "error",
      message: "This case returned an incomplete result. Completed results are still available.",
    });
    return { next: false };
  }

  const { data: saved, error: insertError } = await db
    .from("evaluation_results")
    .update({
      result: { ...result, controller: await caseDisposition(db, run, result, step.position) },
      attempted: diagnostics.attempted ? 1 : 0,
      reserved_micros:
        run.qualification_profile || run.enterprise_thinking
          ? qualificationReservationMicros(
              result.case.transport ?? undefined,
              diagnostics.attempted,
            )
          : 0,
    })
    .eq("id", reservationId)
    .eq("run_id", run.id)
    .select("id")
    .maybeSingle();
  if (insertError || !saved) {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "The attempt was reserved but its final capture could not be stored. No retry will be made; this result is unavailable.",
    });
    return { next: false };
  }

  // The stored disposition is authoritative even if the following status write is lost.
  const { data: capture, error: captureError } = await db
    .from<{ result: ReadingEvaluationCaseResult }>("evaluation_results")
    .select("result")
    .eq("id", reservationId)
    .single();
  if (captureError || !capture) throw Error(captureError?.message ?? "Stored capture unavailable.");
  return settleCapturedCase(db, run, capture.result, step.position);
}
