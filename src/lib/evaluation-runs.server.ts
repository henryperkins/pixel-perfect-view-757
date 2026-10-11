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
} from "./ai/reading-evaluation.shared";
import { evaluateFixedCase, isAdmin } from "./pattern.server";
import { startEvaluationWorkflow } from "./workflows.server";

const HALT_CODES = new Set(["not_configured", "auth", "credit", "rate_limit"]);
const RUN_COLUMNS =
  "id, user_id, status, provider, bundle_source, case_ids, completed, message, workflow_instance_id, created_at, updated_at";

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
  const { data, error } = await db
    .from<RunRow>("evaluation_runs")
    .update(values)
    .eq("id", id)
    .select(RUN_COLUMNS)
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
  settings: { bundleSource: ReadingEvaluationBundleSource; provider: LanguageProvider },
  origin: string,
): Promise<ReadingEvaluationRun> {
  await requireAdmin(db, userId);
  if (!(READING_EVALUATION_BUNDLE_SOURCES as readonly unknown[]).includes(settings.bundleSource))
    throw new Error("Unknown synthetic evaluation bundle.");
  if (!(LANGUAGE_PROVIDERS as readonly unknown[]).includes(settings.provider))
    throw new Error("Unknown language provider.");

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

  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .insert({
      user_id: userId,
      status: "queued",
      provider: settings.provider,
      bundle_source: settings.bundleSource,
      // Freeze the case sequence before the first request.
      case_ids: READING_EVALUATION_CATALOG.map((fixed) => fixed.id),
      completed: 0,
    })
    .select(RUN_COLUMNS)
    .single();
  if (error || !created) throw new Error(error?.message ?? "The evaluation run was not created.");

  // The edge plane must reach a public origin; the auth-gated editor preview cannot answer it.
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId: created.id,
    total: created.case_ids.length,
    callback: `${base}/api/public/evaluation-step`,
  });
  if (!started?.ok) {
    const message = "The edge workflow plane could not start this run; no case was requested.";
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
): Promise<{ run: ReadingEvaluationRun | null; results: ReadingEvaluationCaseResult[] }> {
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
  if (!run) return { run: null, results: [] };
  const { data: rows, error } = await db
    .from<{ result: ReadingEvaluationCaseResult }>("evaluation_results")
    .select("result")
    .eq("run_id", run.id)
    .gte("position", options.after ?? 0)
    .order("position")
    .limit(run.case_ids.length);
  if (error) throw new Error(error.message);
  return { run: view(run), results: (rows ?? []).map((row) => row.result) };
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
  step: { runId: string; position: number },
): Promise<{ next: boolean }> {
  const { data: run, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", step.runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!run || !readingEvaluationRunActive(run.status)) return { next: false };
  const total = run.case_ids.length;
  const caseId = run.case_ids[step.position];

  const { data: stored, error: storedError } = await db
    .from<{ id: string }>("evaluation_results")
    .select("id")
    .eq("run_id", run.id)
    .eq("position", step.position)
    .maybeSingle();
  if (storedError) throw new Error(storedError.message);
  // A replayed step settles the run from the stored case instead of requesting it again.
  if (stored) {
    const completed = Math.max(run.completed, step.position + 1);
    if (run.status === "stopping") {
      await updateRun(db, run.id, { status: "stopped", completed });
      return { next: false };
    }
    if (completed >= total) {
      await updateRun(db, run.id, { status: "complete", completed });
      return { next: false };
    }
    if (completed !== run.completed) await updateRun(db, run.id, { completed });
    return { next: true };
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

  let result: ReadingEvaluationCaseResult;
  try {
    result = await evaluateFixedCase(db, caseId, run.bundle_source, run.provider);
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

  // A plan, prompt, validator, model or copy change during the run stops it.
  if (step.position > 0) {
    const { data: first, error: firstError } = await db
      .from<{ result: ReadingEvaluationCaseResult }>("evaluation_results")
      .select("result")
      .eq("run_id", run.id)
      .eq("position", 0)
      .maybeSingle();
    if (firstError) throw new Error(firstError.message);
    try {
      combineReadingEvaluationResults(first ? [first.result, result] : [result], {
        partial: true,
      });
    } catch {
      await updateRun(db, run.id, {
        status: "error",
        message:
          "Evaluation settings changed during this run. Completed results are still available; start a new run to compare one configuration.",
      });
      return { next: false };
    }
  }

  const { error: insertError } = await db
    .from("evaluation_results")
    .insert({ run_id: run.id, position: step.position, case_id: caseId, result });
  if (insertError) throw new Error(insertError.message);

  const completed = step.position + 1;
  if (HALT_CODES.has(diagnostics.code)) {
    await updateRun(db, run.id, {
      status: "halted",
      completed,
      message: `Run stopped: ${diagnosticLabel(diagnostics.code)}. Remaining cases were not requested.`,
    });
    return { next: false };
  }
  if (completed >= total) {
    await updateRun(db, run.id, { status: "complete", completed });
    return { next: false };
  }
  const { data: latest, error: latestError } = await db
    .from<{ status: ReadingEvaluationRunStatus }>("evaluation_runs")
    .select("status")
    .eq("id", run.id)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);
  if (latest?.status === "stopping") {
    await updateRun(db, run.id, { status: "stopped", completed });
    return { next: false };
  }
  await updateRun(db, run.id, { completed });
  return { next: true };
}
