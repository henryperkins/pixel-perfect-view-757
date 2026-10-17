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
import {
  readingEvaluationRunInputSchema,
  readingEvaluationPreviewInputSchema,
  type ContentComparisonSettings,
} from "./ai/reading-evaluation.shared";
import {
  qualificationReservationMicros,
  qualificationTransportIssue,
  type EnterpriseThinkingLevel,
} from "./ai/admin-transport";
import { readEvaluationWorkflowStatus, startEvaluationWorkflow } from "./workflows.server";

import {
  resolveContentComparisonSource,
  type ContentComparisonGuard,
} from "./content/evaluation-source.server";
import { draftAdminGuard } from "./content/content-drafts.server";
import { memberLanguageProvider } from "./ai/language.server";
import {
  createContentComparisonPlan,
  contentComparisonArmPlan,
  revalidateContentComparisonPlan,
} from "./ai/content-comparison-plan.server";
import {
  createLatencyProbePlan,
  revalidateLatencyProbePlan,
  resolveLatencyProbeSource,
  type LatencyProbePlan,
} from "./ai/latency-probe-plan.server";
import {
  LATENCY_PROBE_CASE_SET_ID,
  LATENCY_PROBE_DOLLAR_CEILING_MICROS,
  LATENCY_PROBE_PROVIDER,
  LATENCY_PROBE_RESERVATION_MICROS,
  LATENCY_PROBE_VERSION,
  type LatencyProbeSettings,
} from "./ai/latency-probe";
import {
  createEditorialPilotPlan,
  revalidateEditorialPilotPlan,
} from "./ai/editorial-pilot-plan.server";
import {
  EDITORIAL_PILOT_VERSION,
  EDITORIAL_PILOT_CASE_SET_ID,
  EDITORIAL_PILOT_ATTEMPT_LIMIT,
  EDITORIAL_PILOT_DOLLAR_CEILING_MICROS,
  type EditorialPilotSettings,
} from "./ai/editorial-pilot";
import { createContextPilotPlan, revalidateContextPilotPlan } from "./ai/context-pilot-plan.server";
import {
  CONTEXT_PILOT_VERSION,
  CONTEXT_PILOT_CASE_SET_ID,
  CONTEXT_PILOT_ATTEMPT_LIMIT,
  CONTEXT_PILOT_DOLLAR_CEILING_MICROS,
  CONTEXT_PILOT_RESERVATION_MICROS,
  type ContextPilotSettings,
} from "./ai/context-pilot";

const HALT_CODES = new Set(["not_configured", "auth", "credit", "rate_limit"]);
const jsonValue = (x: unknown): EvaluationJsonValue => JSON.parse(JSON.stringify(x));
/** Reviewable plans and templates; this read-only call never dispatches a Workflow. */
export async function previewEvaluationPlan(
  db: DBClient,
  userId: string,
  settings: ReturnType<typeof readingEvaluationPreviewInputSchema.parse>,
) {
  await requireAdmin(db, userId);
  readingEvaluationPreviewInputSchema.parse(settings);
  if ("mode" in settings) {
    if (settings.mode === "context-pilot") {
      const plan = createContextPilotPlan(evaluationSourceSha(), memberLanguageProvider());
      return {
        hash: plan.hash,
        attemptLimit: plan.attemptLimit,
        sourceSha: plan.sourceSha,
        plans: jsonValue(plan),
      };
    }
    if (settings.mode === "editorial-pilot") {
      const plan = createEditorialPilotPlan(evaluationSourceSha(), memberLanguageProvider());
      return {
        hash: plan.hash,
        attemptLimit: plan.attemptLimit,
        sourceSha: plan.sourceSha,
        plans: jsonValue(plan),
      };
    }
    if (settings.mode === "latency-probe") {
      if (memberLanguageProvider() !== LATENCY_PROBE_PROVIDER)
        throw Error("The latency probe requires the member Gemini Enterprise provider.");
      const { baseline, baselineIdentity } = await resolveLatencyProbeSource(
        db,
        userId,
        settings.source,
      );
      const plan = createLatencyProbePlan(baseline, baselineIdentity, evaluationSourceSha());
      return {
        hash: plan.hash,
        attemptLimit: plan.attemptLimit,
        sourceSha: plan.sourceSha,
        plans: jsonValue(plan),
      };
    }
    const { pair } = await comparisonPair(db, userId, settings);
    return {
      hash: contentComparisonArmPlan(pair, settings.arm).hash,
      attemptLimit: 8,
      sourceSha: pair.sourceSha,
      plans: jsonValue(pair),
    };
  }
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
    caseIds: [...row.case_ids],
    completed: row.completed,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.plan?.contextPilot
      ? {
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
          contextPilot: {
            version: row.plan.contextPilot.version,
            benchmarkHash: row.plan.contextPilot.benchmarkHash,
          },
        }
      : {}),
    ...(row.plan?.editorialPilot
      ? {
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
          editorialPilot: {
            version: row.plan.editorialPilot.version,
            quietDates: row.plan.editorialPilot.caseManifest.cases
              .slice(5)
              .map((fixed) => fixed.config.day),
          },
        }
      : {}),
    ...(row.plan?.contentComparison
      ? {
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
          contentComparison: {
            arm: row.plan.contentComparison.arm,
            pairHash: row.plan.contentComparison.pair.hash,
            caseSetId: row.plan.contentComparison.pair.caseSetId,
          },
        }
      : {}),
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
    ...(row.plan?.latencyProbe
      ? {
          campaignId: row.campaign_id!,
          attemptLimit: row.attempt_limit!,
          latencyProbe: {
            version: row.plan.latencyProbe.version,
            positions: row.plan.latencyProbe.positions,
          },
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

/** Return byte guards only after every baseline capture and its accounting is complete. */
async function comparisonCaptureGuards(db: DBClient, root: RunRow, plan: EvaluationPlan) {
  const pair = plan.contentComparison!.pair;
  const { data: rows, error } = await db
    .from<{
      id: string;
      position: number;
      case_id: string;
      result: ReadingEvaluationCaseResult | { kind: string };
      result_identity: string;
      attempted: number;
      reserved_micros: number;
    }>("evaluation_results")
    .select("id,position,case_id,result,result AS result_identity,attempted,reserved_micros")
    .eq("run_id", root.id)
    .order("position");
  if (error) throw Error("The baseline captures could not be verified.");
  if (!rows || rows.length !== 4)
    throw Error("The comparison requires four complete baseline captures.");
  const guards: ContentComparisonGuard[] = [
    {
      sql: "SELECT CASE WHEN (SELECT count(*) FROM evaluation_results WHERE run_id=?)=4 THEN 1 ELSE json('comparison-baseline-captures-changed') END",
      params: [root.id],
    },
  ];
  let actualModel: string | null = null;
  for (const [position, row] of rows.entries()) {
    if (!row.result || "kind" in row.result)
      throw Error("The comparison baseline has an uncertain or missing capture.");
    const result = row.result;
    const fixed = plan.cases[position]!;
    const diagnostics = readDailyDiagnostics(result.case?.diagnostics);
    const trace = result.case?.transport;
    const expectedComparison = {
      version: pair.version,
      arm: "baseline",
      pairHash: pair.hash,
      baselineCanonicalHash: pair.identities.baseline.canonicalHash,
      candidateCanonicalHash: pair.identities.candidate.canonicalHash,
      caseSetId: pair.caseSetId,
    };
    const metadata = result.metadata as unknown as Record<string, unknown> | undefined;
    const metadataMatches =
      metadata &&
      Object.entries(plan.metadata).every(
        ([key, value]) =>
          value === null ||
          ["maxInputBytes", "maxOutputTokens"].includes(key) ||
          metadata[key] === value,
      );
    if (
      row.position !== position ||
      row.case_id !== fixed.id ||
      result.case?.id !== fixed.id ||
      result.case.configHash !== fixed.configHash ||
      JSON.stringify(result.case.facts) !== JSON.stringify(fixed.facts) ||
      JSON.stringify(result.case.interpretationPlan) !== JSON.stringify(fixed.interpretationPlan) ||
      result.case.template?.body !== fixed.template.body ||
      !metadataMatches ||
      result.metadata.bundleSource !== "content-comparison" ||
      result.metadata.runPlanHash !== plan.hash ||
      JSON.stringify(result.metadata.contentComparison) !== JSON.stringify(expectedComparison) ||
      !diagnostics?.attempted ||
      diagnostics.outcome === "unavailable" ||
      HALT_CODES.has(diagnostics.code) ||
      (diagnostics.outcome === "accepted") !== (result.case.output?.mode === "model") ||
      result.controller?.status !== (position === 3 ? "complete" : "running") ||
      row.attempted !== 1 ||
      !trace ||
      trace.provider !== pair.provider ||
      trace.requestedModel !== pair.model ||
      trace.deadlineMs !== plan.metadata.gatewayTimeoutMs ||
      qualificationTransportIssue(trace) ||
      row.reserved_micros !== qualificationReservationMicros(trace, true) ||
      (actualModel !== null && trace.actualModel !== actualModel)
    )
      throw Error(
        "The comparison baseline capture identity or reservation is incomplete or inconsistent.",
      );
    actualModel = trace.actualModel;
    guards.push({
      sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM evaluation_results WHERE id=? AND run_id=? AND position=? AND case_id=? AND result=? AND attempted=? AND reserved_micros=?) THEN 1 ELSE json('comparison-baseline-capture-changed') END",
      params: [
        row.id,
        root.id,
        row.position,
        row.case_id,
        row.result_identity,
        row.attempted,
        row.reserved_micros,
      ],
    });
  }
  return guards;
}

/** A candidate arm always uses the pair frozen by its baseline, even after draft edits. */
async function comparisonPair(
  db: DBClient,
  userId: string,
  settings: ReturnType<
    typeof import("./ai/reading-evaluation.shared").contentComparisonPreviewSchema.parse
  >,
) {
  if (settings.provider !== memberLanguageProvider())
    throw Error("Content comparison must use the currently selected member provider.");
  if (settings.arm === "baseline") {
    if (settings.campaignId) throw Error("The baseline starts a new comparison campaign.");
    const resolved = await resolveContentComparisonSource(db, userId, settings.source);
    return {
      pair: createContentComparisonPlan(
        resolved,
        evaluationSourceSha(),
        settings.provider,
        settings.caseSetId,
      ),
      guards: resolved.guards,
      root: null,
    };
  }
  if (!settings.campaignId) throw Error("The candidate requires its completed baseline campaign.");
  const { data: root, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", settings.campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw Error(error.message);
  if (
    !root ||
    root.status !== "complete" ||
    root.completed !== 4 ||
    root.campaign_id !== root.id ||
    root.arm_key !== "content-baseline" ||
    !root.plan?.contentComparison ||
    root.provider !== settings.provider
  )
    throw Error("The candidate requires a complete baseline from this content comparison.");
  const pair = revalidateContentComparisonPlan(
    root.plan.contentComparison.pair,
    evaluationSourceSha(),
    settings.provider,
  );
  if (pair.caseSetId !== settings.caseSetId)
    throw Error("The comparison case set cannot switch manifests within a campaign.");
  const baselinePlan = contentComparisonArmPlan(pair, "baseline");
  if (JSON.stringify(root.plan) !== JSON.stringify(baselinePlan))
    throw Error("The completed baseline arm plan failed its integrity check.");
  if (JSON.stringify(pair.source) !== JSON.stringify(settings.source))
    throw Error("The comparison source selector changed.");
  const guards: ContentComparisonGuard[] = [
    draftAdminGuard(userId),
    {
      sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM evaluation_runs WHERE id=? AND user_id=? AND status='complete' AND completed=4 AND plan=?) THEN 1 ELSE json('comparison-baseline-changed') END",
      params: [root.id, userId, JSON.stringify(root.plan)],
    },
    ...(await comparisonCaptureGuards(db, root, baselinePlan)),
  ];
  await requireAdmin(db, userId);
  return { pair, guards, root };
}
async function startContentComparisonRun(
  db: DBClient,
  userId: string,
  settings: ContentComparisonSettings,
  origin: string,
) {
  const { pair, guards, root } = await comparisonPair(db, userId, settings);
  const plan = contentComparisonArmPlan(pair, settings.arm);
  if (plan.hash !== settings.expectedPlanHash)
    throw Error("The reviewed comparison plan changed. Prepare a new dry plan.");
  if (
    root
      ? !!settings.budget
      : !settings.budget || settings.budget.reviewReserveCents >= settings.budget.dollarCeilingCents
  )
    throw Error(
      "Set the immutable budget on the baseline only, up to $5 with a separate review reserve.",
    );
  const ceiling = root?.dollar_ceiling_micros ?? settings.budget!.dollarCeilingCents * 10_000;
  const reserve = root?.review_reserve_micros ?? settings.budget!.reviewReserveCents * 10_000;
  if (!ceiling || ceiling > 5_000_000 || reserve < 0 || reserve >= ceiling)
    throw Error("Invalid content comparison budget.");
  if (Buffer.byteLength(JSON.stringify(plan)) > 1_900_000)
    throw Error("Frozen comparison exceeds the database row size.");
  const runId = crypto.randomUUID(),
    campaignId = root?.id ?? runId,
    armKey = `content-${settings.arm}`;
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - READING_EVALUATION_STALL_MS).toISOString();
  const result = await db.batch([
    ...guards,
    {
      sql: "INSERT INTO evaluation_runs(id,user_id,status,provider,bundle_source,case_ids,completed,plan,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,created_at,updated_at,arm_key,campaign_attempt_limit) SELECT ?,?,'queued',?,'content-comparison',?,0,?,?,4,?,?,?,?,?,8 WHERE NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND status IN ('queued','running','stopping') AND julianday(updated_at)>julianday(?)) AND NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE campaign_id=? AND arm_key=?) RETURNING id",
      params: [
        runId,
        userId,
        settings.provider,
        JSON.stringify(plan.cases.map((c) => c.id)),
        JSON.stringify(plan),
        campaignId,
        ceiling,
        reserve,
        now,
        now,
        armKey,
        userId,
        cutoff,
        campaignId,
        armKey,
      ],
    },
  ]);
  if (!result.at(-1)?.results.length)
    throw Error("An evaluation is already running or this comparison arm already started.");
  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .single();
  if (error || !created) throw Error(error?.message ?? "Comparison run could not be read.");
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId,
    total: 4,
    callback: `${base}/api/public/evaluation-step`,
    planHash: plan.hash,
  });
  if (!started?.ok) {
    const message =
      "Workflow dispatch could not be confirmed. No retry was made; the campaign is retained.";
    await updateRun(db, runId, { status: "error", message });
    throw Error(message);
  }
  return view(
    (await updateRun(db, runId, { workflow_instance_id: started.instanceId })) ?? created,
  );
}

/** One retained campaign per admin and manifest version; neither status nor source drift resets it. */
async function startLatencyProbeRun(
  db: DBClient,
  userId: string,
  settings: LatencyProbeSettings,
  origin: string,
) {
  if (memberLanguageProvider() !== LATENCY_PROBE_PROVIDER)
    throw Error("The latency probe runs only while the member provider is Gemini Enterprise.");
  const { baseline, baselineIdentity, guards } = await resolveLatencyProbeSource(
    db,
    userId,
    settings.source,
  );
  const plan = createLatencyProbePlan(baseline, baselineIdentity, evaluationSourceSha());
  if (plan.hash !== settings.expectedPlanHash)
    throw Error("The reviewed latency probe plan changed. Prepare a new dry plan.");
  if (Buffer.byteLength(JSON.stringify(plan)) > 1_900_000)
    throw Error("Frozen probe exceeds the database row size.");
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - READING_EVALUATION_STALL_MS).toISOString();
  const result = await db.batch([
    ...guards,
    {
      sql: "INSERT INTO evaluation_runs(id,user_id,status,provider,bundle_source,case_ids,completed,plan,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,created_at,updated_at,arm_key,campaign_attempt_limit) SELECT ?,?,'queued',?,'latency-probe',?,0,?,?,4,?,?,?,?,'latency-probe',4 WHERE NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND status IN ('queued','running','stopping') AND julianday(updated_at)>julianday(?)) AND NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND bundle_source='latency-probe' AND json_extract(plan,'$.latencyProbe.version')=?) RETURNING id",
      params: [
        runId,
        userId,
        LATENCY_PROBE_PROVIDER,
        JSON.stringify(plan.cases.map((planned) => planned.id)),
        JSON.stringify(plan),
        runId,
        LATENCY_PROBE_DOLLAR_CEILING_MICROS,
        0,
        now,
        now,
        userId,
        cutoff,
        userId,
        LATENCY_PROBE_VERSION,
      ],
    },
  ]);
  if (!result.at(-1)?.results.length)
    throw Error(
      "An evaluation is already running or this latency probe campaign has already started; its records are retained.",
    );
  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .single();
  if (error || !created) throw Error(error?.message ?? "Probe run could not be read.");
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId,
    total: plan.cases.length,
    callback: `${base}/api/public/evaluation-step`,
    planHash: plan.hash,
  });
  if (!started?.ok) {
    const message =
      "Workflow dispatch could not be confirmed. No retry was made; the campaign is retained.";
    await updateRun(db, runId, { status: "error", message });
    throw Error(message);
  }
  return view(
    (await updateRun(db, runId, { workflow_instance_id: started.instanceId })) ?? created,
  );
}

/** Candidate only; one retained campaign per operator and pilot version, including failed dispatches. */
async function startEditorialPilotRun(
  db: DBClient,
  userId: string,
  settings: EditorialPilotSettings,
  origin: string,
) {
  const provider = memberLanguageProvider();
  const plan = createEditorialPilotPlan(evaluationSourceSha(), provider);
  if (plan.hash !== settings.expectedPlanHash)
    throw Error("The reviewed editorial pilot plan changed. Prepare a new dry plan.");
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - READING_EVALUATION_STALL_MS).toISOString();
  const result = await db.batch([
    draftAdminGuard(userId),
    {
      sql: "INSERT INTO evaluation_runs(id,user_id,status,provider,bundle_source,case_ids,completed,plan,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,created_at,updated_at,arm_key,campaign_attempt_limit) SELECT ?,?,'queued',?,'editorial-pilot',?,0,?,?,?,?,0,?,?,'editorial-pilot',? WHERE NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND status IN ('queued','running','stopping') AND julianday(updated_at)>julianday(?)) AND NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND bundle_source='editorial-pilot' AND json_extract(plan,'$.editorialPilot.version')=?) RETURNING id",
      params: [
        runId,
        userId,
        provider,
        JSON.stringify(plan.cases.map((item) => item.id)),
        JSON.stringify(plan),
        runId,
        EDITORIAL_PILOT_ATTEMPT_LIMIT,
        EDITORIAL_PILOT_DOLLAR_CEILING_MICROS,
        now,
        now,
        EDITORIAL_PILOT_ATTEMPT_LIMIT,
        userId,
        cutoff,
        userId,
        EDITORIAL_PILOT_VERSION,
      ],
    },
  ]);
  if (!result.at(-1)?.results.length)
    throw Error(
      "An evaluation is already running or this editorial pilot already started; its records are retained.",
    );
  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .single();
  if (error || !created) throw Error(error?.message ?? "Editorial pilot run could not be read.");
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId,
    total: plan.cases.length,
    callback: `${base}/api/public/evaluation-step`,
    planHash: plan.hash,
  });
  if (!started?.ok) {
    const message =
      "Workflow dispatch could not be confirmed. No retry was made; the editorial pilot campaign is retained.";
    await updateRun(db, runId, { status: "error", message });
    throw Error(message);
  }
  return view(
    (await updateRun(db, runId, { workflow_instance_id: started.instanceId })) ?? created,
  );
}

/** Synthetic context candidate only; failed dispatches still consume the one campaign identity. */
async function startContextPilotRun(
  db: DBClient,
  userId: string,
  settings: ContextPilotSettings,
  origin: string,
) {
  const provider = memberLanguageProvider();
  const plan = createContextPilotPlan(evaluationSourceSha(), provider);
  if (plan.hash !== settings.expectedPlanHash)
    throw Error("The reviewed context pilot plan changed. Prepare a new dry plan.");
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - READING_EVALUATION_STALL_MS).toISOString();
  const result = await db.batch([
    draftAdminGuard(userId),
    {
      sql: "INSERT INTO evaluation_runs(id,user_id,status,provider,bundle_source,case_ids,completed,plan,campaign_id,attempt_limit,dollar_ceiling_micros,review_reserve_micros,created_at,updated_at,arm_key,campaign_attempt_limit) SELECT ?,?,'queued',?,'context-pilot',?,0,?,?,?,?,0,?,?,'context-pilot',? WHERE NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND status IN ('queued','running','stopping') AND julianday(updated_at)>julianday(?)) AND NOT EXISTS(SELECT 1 FROM evaluation_runs WHERE user_id=? AND bundle_source='context-pilot' AND json_extract(plan,'$.contextPilot.version')=?) RETURNING id",
      params: [
        runId,
        userId,
        provider,
        JSON.stringify(plan.cases.map((item) => item.id)),
        JSON.stringify(plan),
        runId,
        CONTEXT_PILOT_ATTEMPT_LIMIT,
        CONTEXT_PILOT_DOLLAR_CEILING_MICROS,
        now,
        now,
        CONTEXT_PILOT_ATTEMPT_LIMIT,
        userId,
        cutoff,
        userId,
        CONTEXT_PILOT_VERSION,
      ],
    },
  ]);
  if (!result.at(-1)?.results.length)
    throw Error(
      "An evaluation is already running or this context pilot already started; its records are retained.",
    );
  const { data: created, error } = await db
    .from<RunRow>("evaluation_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .single();
  if (error || !created) throw Error(error?.message ?? "Context pilot run could not be read.");
  const base = (process.env["PATTERN_APP_URL"] || origin).replace(/\/$/, "");
  const started = await startEvaluationWorkflow({
    runId,
    total: plan.cases.length,
    callback: `${base}/api/public/evaluation-step`,
    planHash: plan.hash,
  });
  if (!started?.ok) {
    const message =
      "Workflow dispatch could not be confirmed. No retry was made; the context pilot campaign is retained.";
    await updateRun(db, runId, { status: "error", message });
    throw Error(message);
  }
  return view(
    (await updateRun(db, runId, { workflow_instance_id: started.instanceId })) ?? created,
  );
}

/** Starts a run that continues on the edge plane until it completes, stops or halts. */
export async function startEvaluationRun(
  db: DBClient,
  userId: string,
  settings: ReturnType<typeof readingEvaluationRunInputSchema.parse>,
  origin: string,
): Promise<ReadingEvaluationRun> {
  await requireAdmin(db, userId);
  if ("mode" in settings) {
    readingEvaluationRunInputSchema.parse(settings);
    if (settings.mode === "context-pilot")
      return startContextPilotRun(db, userId, settings, origin);
    if (settings.mode === "editorial-pilot")
      return startEditorialPilotRun(db, userId, settings, origin);
    if (settings.mode === "latency-probe")
      return startLatencyProbeRun(db, userId, settings, origin);
    return startContentComparisonRun(db, userId, settings, origin);
  }

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

/** Reconcile only confirmed terminal scheduling failure; age or missing status is not evidence. */
async function recoverFailedWorkflow(db: DBClient, run: RunRow): Promise<RunRow> {
  if (!readingEvaluationRunActive(run.status) || !run.workflow_instance_id) return run;
  const status = await readEvaluationWorkflowStatus(run.workflow_instance_id);
  if (status !== "errored" && status !== "terminated") return run;
  const [capture] = await db.exec<{ completed: number }>(
    "SELECT COUNT(*) completed FROM evaluation_results WHERE run_id=? AND json_valid(result) AND json_extract(result,'$.kind') IS NULL AND json_extract(result,'$.case.id')=case_id",
    [run.id],
  );
  return (
    (await updateRun(db, run.id, {
      status: status === "errored" ? "error" : "stopped",
      completed: capture?.completed ?? 0,
      message: `The Workflow is ${status}. Stored captures and reserved attempts are retained. An in-flight response may still be saved; no retry or remaining case was requested by recovery.`,
    })) ?? run
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
  run = await recoverFailedWorkflow(db, run);
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
  // A capture can persist after recovery, even if its progress write is lost.
  // Only terminal progress is repaired here: an active capture's disposition
  // must still settle before any subsequent signed step can advance.
  if (!readingEvaluationRunActive(run.status)) {
    const captured = (rows ?? []).filter(
      (row) => !("kind" in row.result) && row.result.case.id === row.case_id,
    ).length;
    if (captured > run.completed)
      run = (await updateRun(db, run.id, { completed: captured })) ?? run;
  }
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
  if (
    HALT_CODES.has(diagnostics.code) ||
    ((run.plan?.contentComparison ||
      run.plan?.latencyProbe ||
      run.plan?.editorialPilot ||
      run.plan?.contextPilot) &&
      diagnostics.outcome === "unavailable")
  )
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
      } else if (run.plan?.latencyProbe) {
        // The probe intentionally varies its thinking control per frozen position;
        // every other run-scoped metadata identity must still match exactly.
        const consistency = (capture: ReadingEvaluationCaseResult) => {
          const { enterpriseThinking: _level, ...rest } = capture.metadata;
          return rest;
        };
        if (
          !first ||
          JSON.stringify(consistency(first.result)) !== JSON.stringify(consistency(result))
        )
          throw Error("Mixed probe configuration.");
      } else
        combineReadingEvaluationResults(first ? [first.result, result] : [result], {
          partial: true,
        });
    } catch {
      return {
        ...base,
        status: run.plan?.contextPilot ? "halted" : "error",
        message:
          "Evaluation settings or reported model identity changed. This capture is retained; remaining cases were not requested.",
      };
    }
  }
  const actual = result.case.transport?.actualModel;
  if (actual) {
    const known = run.plan?.contentComparison
      ? await db.exec<{ actual: string }>(
          "SELECT DISTINCT json_extract(e.result,'$.case.transport.actualModel') actual FROM evaluation_results e JOIN evaluation_runs r ON r.id=e.run_id WHERE r.campaign_id=? AND r.user_id=? AND json_valid(e.result) AND json_extract(e.result,'$.case.transport.actualModel') IS NOT NULL",
          [run.campaign_id, run.user_id],
        )
      : await db.exec<{ actual: string }>(
          "SELECT DISTINCT json_extract(result,'$.case.transport.actualModel') actual FROM evaluation_results WHERE run_id=? AND json_valid(result) AND json_extract(result,'$.case.transport.actualModel') IS NOT NULL",
          [run.id],
        );
    if (known.some((row) => row.actual !== actual))
      return {
        ...base,
        status:
          run.plan?.contentComparison ||
          run.plan?.latencyProbe ||
          run.plan?.editorialPilot ||
          run.plan?.contextPilot
            ? "halted"
            : "error",
        message:
          "The reported model identity changed during this run or its comparison campaign. This capture is retained; remaining cases were not requested.",
      };
  }
  if (actual && !/^(?:google\/)?gemini-3\.8-flash(?:-\d{3,8})?$/.test(actual))
    return {
      ...base,
      status: "halted",
      message:
        "The reported model differs from the frozen configuration. This capture is retained.",
    };
  if (run.plan?.latencyProbe && diagnostics.attempted) {
    const expected = (run.plan.cases[position] as { thinking?: string } | undefined)?.thinking;
    const recorded = (result.metadata as { enterpriseThinking?: string } | undefined)
      ?.enterpriseThinking;
    if (result.case.transport?.thinkingLevel !== expected || !recorded || recorded !== expected)
      return {
        ...base,
        status: "error",
        message:
          "The recorded thinking control differs from the frozen probe position. This capture is retained.",
      };
  }
  if (
    (run.qualification_profile ||
      run.enterprise_thinking ||
      run.plan?.contentComparison ||
      run.plan?.editorialPilot ||
      run.plan?.contextPilot ||
      run.plan?.latencyProbe) &&
    diagnostics.attempted
  ) {
    const issue = qualificationTransportIssue(result.case.transport ?? undefined);
    if (issue)
      return {
        ...base,
        status: "halted",
        message: `${issue} The full reservation is retained; remaining cases were not requested.`,
      };
  }
  if (
    run.plan?.contextPilot &&
    (!diagnostics.attempted ||
      result.case.transport?.finishReason !== "STOP" ||
      !result.case.candidate ||
      result.case.candidate.captureLossless !== true ||
      result.case.candidate.truncated)
  )
    return {
      ...base,
      status: "halted",
      message:
        "The generated draft capture is unavailable or lossy. This case is retained; remaining cases were not requested.",
    };
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
  if (!latest) return { next: false };
  // Recovery can finish before an already-reserved provider call returns. The
  // capture still counts; updateRun preserves terminal status and its message.
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
  const stopping =
    run.status === "queued" || run.status === "running"
      ? ((await updateRun(db, run.id, { status: "stopping" })) ?? run)
      : run;
  return view(await recoverFailedWorkflow(db, stopping));
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
  let capturedBundle: import("./content/default-bundle").ContentBundle;
  let currentPlan: EvaluationPlan;
  try {
    if (run.plan.contextPilot) {
      const pilot = revalidateContextPilotPlan(
        run.plan,
        evaluationSourceSha(),
        memberLanguageProvider(),
      );
      currentPlan = pilot;
      capturedBundle = pilot.contextPilot.candidate;
    } else if (run.plan.editorialPilot) {
      const pilot = revalidateEditorialPilotPlan(
        run.plan,
        evaluationSourceSha(),
        memberLanguageProvider(),
      );
      currentPlan = pilot;
      capturedBundle = pilot.editorialPilot.candidate;
    } else if (run.plan.latencyProbe) {
      if (memberLanguageProvider() !== LATENCY_PROBE_PROVIDER)
        throw Error("The member provider changed during the latency probe.");
      const probe = revalidateLatencyProbePlan(run.plan as LatencyProbePlan, evaluationSourceSha());
      currentPlan = probe;
      capturedBundle = probe.latencyProbe.baseline;
    } else if (run.plan.contentComparison) {
      const pair = revalidateContentComparisonPlan(
        run.plan.contentComparison.pair,
        evaluationSourceSha(),
        memberLanguageProvider(),
      );
      currentPlan = contentComparisonArmPlan(pair, run.plan.contentComparison.arm);
      capturedBundle = pair.bundles[run.plan.contentComparison.arm];
    } else {
      capturedBundle = await evaluationBundle(db, run.bundle_source);
      currentPlan = run.enterprise_thinking
        ? createEnterprisePilotPlan(capturedBundle, run.enterprise_thinking, evaluationSourceSha())
        : createEvaluationPlan(
            capturedBundle,
            run.qualification_profile ?? undefined,
            evaluationSourceSha(),
            run.provider,
          );
    }
    if (currentPlan.hash !== run.plan.hash) throw Error("Frozen plan mismatch.");
  } catch {
    await updateRun(db, run.id, {
      status: "error",
      message:
        "Frozen evaluation source, provider or policy changed. This case stopped before provider traffic.",
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
    (run.qualification_profile ||
      run.enterprise_thinking ||
      run.plan?.contentComparison ||
      run.plan?.editorialPilot ||
      run.plan?.contextPilot ||
      run.plan?.latencyProbe) &&
    planned.expectsModel
      ? run.plan?.latencyProbe
        ? LATENCY_PROBE_RESERVATION_MICROS
        : run.plan?.contextPilot
          ? CONTEXT_PILOT_RESERVATION_MICROS
          : 2_800_000
      : 0;
  const [claimed] = await db.exec<{ id: string }>(
    "INSERT INTO evaluation_results(id,run_id,position,case_id,result,reserved_micros,attempted) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM evaluation_runs r WHERE r.id=? AND r.completed=? AND r.status IN ('queued','running') AND EXISTS(SELECT 1 FROM user_roles WHERE user_id=r.user_id AND role='admin') AND (SELECT COALESCE(SUM(e.attempted),0) FROM evaluation_results e WHERE e.run_id=r.id)+?<=r.attempt_limit AND (r.campaign_id IS NULL OR ((SELECT COALESCE(SUM(e.attempted),0) FROM evaluation_results e JOIN evaluation_runs a ON a.id=e.run_id WHERE a.campaign_id=r.campaign_id)+?<=r.campaign_attempt_limit AND (SELECT COALESCE(SUM(e.reserved_micros),0) FROM evaluation_results e JOIN evaluation_runs a ON a.id=e.run_id WHERE a.campaign_id=r.campaign_id)+?<=r.dollar_ceiling_micros-r.review_reserve_micros))) ON CONFLICT(run_id,position) DO NOTHING RETURNING id",
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
    else if (
      !winner &&
      latest &&
      readingEvaluationRunActive(latest.status) &&
      !(await isAdmin(db, run.user_id))
    )
      await updateRun(db, run.id, {
        status: "error",
        message:
          "The admin authority changed before the attempt was reserved. No case was requested.",
      });
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
        ...(run.plan.editorialPilot
          ? { boundedQualification: true, caseSetId: EDITORIAL_PILOT_CASE_SET_ID }
          : {}),
        ...(run.plan.contextPilot
          ? { boundedQualification: true, caseSetId: CONTEXT_PILOT_CASE_SET_ID }
          : {}),
        ...(run.plan.latencyProbe
          ? {
              enterpriseThinking: (planned as { thinking?: "LOW" | "MEDIUM" }).thinking,
              boundedQualification: true,
              caseSetId: LATENCY_PROBE_CASE_SET_ID,
            }
          : {}),
        ...(run.plan.contentComparison
          ? {
              boundedQualification: true,
              caseSetId: run.plan.contentComparison.pair.caseSetId,
              contentComparison: {
                version: run.plan.contentComparison.pair.version,
                arm: run.plan.contentComparison.arm,
                pairHash: run.plan.contentComparison.pair.hash,
                baselineCanonicalHash:
                  run.plan.contentComparison.pair.identities.baseline.canonicalHash,
                candidateCanonicalHash:
                  run.plan.contentComparison.pair.identities.candidate.canonicalHash,
                caseSetId: run.plan.contentComparison.pair.caseSetId,
              },
            }
          : {}),
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

  // Probe captures belong to the latency experiment, not to the 24-call thinking
  // pilot whose shared transport stamps this identity when a thinking control is set.
  if (run.plan.latencyProbe) result.metadata.experimentVersion = LATENCY_PROBE_VERSION;
  if (run.plan.editorialPilot) result.metadata.experimentVersion = EDITORIAL_PILOT_VERSION;
  if (run.plan.contextPilot) result.metadata.experimentVersion = CONTEXT_PILOT_VERSION;

  const { data: saved, error: insertError } = await db
    .from("evaluation_results")
    .update({
      result: { ...result, controller: await caseDisposition(db, run, result, step.position) },
      attempted: diagnostics.attempted ? 1 : 0,
      reserved_micros:
        run.qualification_profile ||
        run.enterprise_thinking ||
        run.plan?.contentComparison ||
        run.plan?.editorialPilot ||
        run.plan?.contextPilot ||
        run.plan?.latencyProbe
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
