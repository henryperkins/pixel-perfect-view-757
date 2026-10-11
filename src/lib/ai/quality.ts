import { diagnosticLabel, readDailyDiagnostics, type DailyDiagnostics } from "./diagnostics";

export interface QualityReading {
  id: string;
  user_id: string;
  reading_date: string;
  created_at: string;
  generated_at?: string | null;
  release_version: string | null;
  language_mode: string | null;
  language_model: string | null;
  language_meta: unknown;
}

export interface QualityFeedback {
  reading_id: string;
  user_id: string;
  resonance: number;
}

const FACT_KINDS = [
  ["C", "Timing window"],
  ["I", "Published interpretation"],
  ["D", "Domain framing"],
  ["P", "Phase wording"],
  ["T", "Timing wording"],
  ["N", "Natal structure"],
  ["E", "Calculation engine"],
  ["U", "Birth-time uncertainty"],
  ["F", "Historical framing"],
] as const;
const percent = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 1000) / 10 : null;
const safeLabel = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9][a-z0-9/_.-]{0,99}$/i.test(value) ? value : "unlabelled";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Only closed diagnostics and citation IDs leave this boundary, never fact statements or reasons. */
export function summarizeReadingQuality(
  rows: QualityReading[],
  userId: string,
  feedback: QualityFeedback[],
  optedInUsers: Set<string>,
  truncated: boolean,
) {
  const measurement = {
    instrumented: 0,
    attempts: 0,
    accepted: 0,
    rejected: 0,
    unavailable: 0,
    skipped: 0,
    unconfigured: 0,
    legacy: 0,
    fallbackCount: 0,
    fallbackRate: null as number | null,
  };
  const outcomes = new Map<
    string,
    { outcome: string; code: string; label: string; count: number }
  >();
  const configurations = new Map<
    string,
    {
      promptVersion: string;
      validatorVersion: string;
      model: string;
      releaseVersion: string;
      readings: number;
      attempts: number;
      accepted: number;
      rejected: number;
      unavailable: number;
      fallbackRate: number | null;
    }
  >();
  const cohorts = ["model", "template", "legacy"].map((cohort) => ({
    cohort: cohort as "model" | "template" | "legacy",
    readings: 0,
    eligibleReadings: 0,
    ratedReadings: 0,
    coverage: null as number | null,
    positive: 0,
    neutral: 0,
    negative: 0,
    average: null as number | null,
  }));
  const feedbackByReading = new Map<string, QualityFeedback>();
  for (const rating of feedback)
    if ([-1, 0, 1].includes(rating.resonance))
      feedbackByReading.set(rating.reading_id + "/" + rating.user_id, rating);
  const factCounts = new Map<string, { readings: Set<string>; paragraphs: number }>();
  const kindCounts = new Map<string, Set<string>>();
  const models = new Set<string>();
  const samples: {
    id: string;
    reading_date: string;
    mode: "model" | "template";
    model: string | null;
    paragraphs: number;
    dropped: number;
    facts: string[];
    reason: string | null;
  }[] = [];
  let model = 0,
    citedParagraphs = 0,
    droppedParagraphs = 0,
    flagged = 0,
    distinctFactsTotal = 0;

  for (const row of rows) {
    const meta = object(row.language_meta);
    const candidate = readDailyDiagnostics(meta["diagnostics"]);
    const diag: DailyDiagnostics | null =
      candidate && (candidate.outcome === "accepted") === (row.language_mode === "model")
        ? candidate
        : null;
    if (!diag) measurement.legacy++;
    else {
      measurement.instrumented++;
      if (diag.attempted) measurement.attempts++;
      if (diag.code === "not_configured") measurement.unconfigured++;
      else measurement[diag.outcome]++;
      const cause = outcomes.get(diag.code) ?? {
        outcome: diag.outcome,
        code: diag.code,
        label: diagnosticLabel(diag.code),
        count: 0,
      };
      cause.count++;
      outcomes.set(diag.code, cause);
      const releaseVersion = safeLabel(row.release_version);
      const key = JSON.stringify([
        diag.promptVersion,
        diag.validatorVersion,
        diag.model,
        releaseVersion,
      ]);
      const config = configurations.get(key) ?? {
        promptVersion: diag.promptVersion,
        validatorVersion: diag.validatorVersion,
        model: diag.model,
        releaseVersion,
        readings: 0,
        attempts: 0,
        accepted: 0,
        rejected: 0,
        unavailable: 0,
        fallbackRate: null,
      };
      config.readings++;
      if (diag.attempted) {
        config.attempts++;
        if (diag.outcome !== "skipped") config[diag.outcome]++;
      }
      configurations.set(key, config);
    }
    const cohort = cohorts.find(
      (c) => c.cohort === (!diag ? "legacy" : row.language_mode === "model" ? "model" : "template"),
    )!;
    cohort.readings++;
    if (optedInUsers.has(row.user_id)) {
      cohort.eligibleReadings++;
      const rating = feedbackByReading.get(row.id + "/" + row.user_id);
      if (rating) {
        cohort.ratedReadings++;
        if (rating.resonance === 1) cohort.positive++;
        else if (rating.resonance === -1) cohort.negative++;
        else cohort.neutral++;
      }
    }

    const citations = (Array.isArray(meta["citations"]) ? meta["citations"] : []).flatMap((c) => {
      const citation = object(c);
      if (!Number.isInteger(citation["paragraph"]) || !Array.isArray(citation["facts"])) return [];
      const facts = [
        ...new Set(
          citation["facts"].filter(
            (id): id is string => typeof id === "string" && /^[A-Z]{1,2}\d{1,3}$/.test(id),
          ),
        ),
      ];
      return facts.length ? [{ facts }] : [];
    });
    const unique = new Set(citations.flatMap((c) => c.facts));
    const isModel = row.language_mode === "model";
    const name = safeLabel(row.language_model);
    if (isModel) {
      model++;
      if (name !== "unlabelled") models.add(name);
      citedParagraphs += citations.length;
      distinctFactsTotal += unique.size;
      for (const id of unique) {
        const entry = factCounts.get(id) ?? { readings: new Set<string>(), paragraphs: 0 };
        entry.readings.add(row.id);
        factCounts.set(id, entry);
        const kind = FACT_KINDS.find(([prefix]) => id.startsWith(prefix))?.[1] ?? "Other";
        const set = kindCounts.get(kind) ?? new Set<string>();
        set.add(row.id);
        kindCounts.set(kind, set);
      }
      for (const citation of citations)
        for (const id of citation.facts) factCounts.get(id)!.paragraphs++;
    }
    const dropped =
      Number.isInteger(meta["dropped"]) && Number(meta["dropped"]) >= 0
        ? Math.min(Number(meta["dropped"]), 100)
        : 0;
    droppedParagraphs += dropped;
    flagged += Array.isArray(meta["flagged"]) ? Math.min(meta["flagged"].length, 100) : 0;
    if (row.user_id === userId && samples.length < 12)
      samples.push({
        id: row.id,
        reading_date: row.reading_date,
        mode: isModel ? "model" : "template",
        model: isModel && name !== "unlabelled" ? name : null,
        paragraphs: citations.length,
        dropped,
        facts: [...unique].sort(),
        reason:
          diag && diag.outcome !== "accepted"
            ? diagnosticLabel(diag.code)
            : !diag
              ? "No structured diagnosis recorded"
              : null,
      });
  }
  measurement.fallbackCount = measurement.rejected + measurement.unavailable;
  measurement.fallbackRate = percent(measurement.fallbackCount, measurement.attempts);
  for (const config of configurations.values())
    config.fallbackRate = percent(config.rejected + config.unavailable, config.attempts);
  for (const cohort of cohorts) {
    cohort.coverage = percent(cohort.ratedReadings, cohort.eligibleReadings);
    cohort.average = cohort.ratedReadings
      ? Math.round(((cohort.positive - cohort.negative) / cohort.ratedReadings) * 100) / 100
      : null;
  }
  const facts = [...factCounts]
    .map(([id, value]) => ({
      id,
      kind: FACT_KINDS.find(([prefix]) => id.startsWith(prefix))?.[1] ?? "Other",
      readings: value.readings.size,
      paragraphs: value.paragraphs,
      share: percent(value.readings.size, model) ?? 0,
    }))
    .sort((a, b) => b.readings - a.readings || a.id.localeCompare(b.id));
  const causes = [...outcomes.values()].sort(
    (a, b) => b.count - a.count || a.code.localeCompare(b.code),
  );
  return {
    isAdmin: true as const,
    total: rows.length,
    model,
    template: rows.length - model,
    modelShare: percent(model, rows.length) ?? 0,
    citedParagraphs,
    droppedParagraphs,
    flagged,
    avgFactsPerReading: model ? Math.round((distinctFactsTotal / model) * 10) / 10 : 0,
    avgParagraphs: model ? Math.round((citedParagraphs / model) * 10) / 10 : 0,
    models: [...models].sort(),
    facts: facts.slice(0, 24),
    kinds: [...kindCounts].map(([label, readings]) => ({
      label,
      readings: readings.size,
      atoms: facts.filter((f) => f.kind === label).length,
      paragraphs: facts.filter((f) => f.kind === label).reduce((n, f) => n + f.paragraphs, 0),
    })),
    reasons: causes
      .filter((c) => c.outcome !== "accepted")
      .map((c) => ({ reason: c.label, count: c.count })),
    samples,
    measurement,
    outcomes: causes,
    configurations: [...configurations.values()],
    feedback: cohorts,
    window: {
      limit: 300 as const,
      truncated,
      newest: rows[0]?.generated_at ?? rows[0]?.created_at ?? null,
      oldest: rows.at(-1)?.generated_at ?? rows.at(-1)?.created_at ?? null,
    },
  };
}
