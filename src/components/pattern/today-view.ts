/** Stable targets for one saved reading, using the model's one-based paragraph numbers. */
export function todayParagraphId(readingId: string, paragraph: number) {
  return `today-${encodeURIComponent(readingId)}-paragraph-${paragraph}`;
}

export function todayFactId(readingId: string, factId: string) {
  return `today-${encodeURIComponent(readingId)}-fact-${encodeURIComponent(factId)}`;
}

const POINT_LABELS: Record<string, string> = {
  node: "North Node",
  ascendant: "Ascendant",
  midheaven: "Midheaven",
  imum_coeli: "Imum Coeli",
};

export function todayPointLabel(value: string) {
  return (
    POINT_LABELS[value] ??
    value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

/**
 * Format raw lowercase engine contact strings (e.g. "mars square natal mercury")
 * into sentence-case editorial headlines while leaving authored headlines untouched.
 */
export function todayHeadline(
  headline: string,
  primary?: { transit_body: string; aspect: string; natal_point: string; label: string } | null,
) {
  const trimmed = headline.trim();
  if (!trimmed) return headline;
  const rawContact = trimmed.match(
    /^([a-z_]+)\s+(conjunction|opposition|square|trine|sextile|quincunx)\s+natal\s+([a-z_]+)$/,
  );
  if (rawContact) {
    const [, transit = "", aspect = "", natal = ""] = rawContact;
    return `${todayPointLabel(transit)} ${aspect} natal ${todayPointLabel(natal)}`;
  }
  if (primary && trimmed === primary.label && /^[a-z]/.test(trimmed)) {
    return `${todayPointLabel(primary.transit_body)} ${primary.aspect} natal ${todayPointLabel(primary.natal_point)}`;
  }
  if (/^[a-z]/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return headline;
}

export function todayPhaseLabel(value: string) {
  if (value === "between") return "Between calculated contacts";
  if (value === "uncertain") return "Timing varies across samples";
  if (value === "applying" || value === "approaching") return "Building · moving toward exact";
  if (value === "separating") return "Fading · moving away from exact";
  if (value === "exact") return "Exact";
  return todayPointLabel(value);
}

export function todayFactLabel(id: string) {
  const cycle = id.match(/^C(\d+)$/);
  if (cycle) return cycle[1] === "1" ? "Primary calculated cycle" : `Calculated cycle ${cycle[1]}`;
  if (/^I\d+$/.test(id)) return "Interpretation reference";
  if (id === "S1") return "Published synthesis";
  if (id === "N1") return "Published natal lens";
  if (id === "A1") return "Calculated contact sequence";
  if (id === "P2") return "Published transit chapter";
  if (/^D\d+$/.test(id)) return "Area-of-life framing";
  if (/^P\d+$/.test(id)) return "Phase wording";
  if (/^T\d+$/.test(id)) return "Timing wording";
  if (/^E\d+$/.test(id)) return "Calculation source";
  if (/^U\d+$/.test(id)) return "Birth-time limits";
  if (/^R\d+$/.test(id)) return "Reflection reference";
  return "Supplied reference";
}

export function todayFactCategory(id: string) {
  if (id === "N1") return "Interpretive reference";
  if (id === "A1") return "Calculation";
  if (/^C\d+$/.test(id)) return "Calculated cycle";
  if (id === "S1") return "Published synthesis";
  if (/^[IDPT]\d+$/.test(id)) return "Published reference";
  if (/^[EU]\d+$/.test(id)) return "Calculation";
  if (/^R\d+$/.test(id)) return "Reflection";
  return "Reference";
}

export function todaySourceCategory(lane: string, sourceId: string) {
  if (sourceId === "LLM-01") return "Language wording";
  if (lane === "calculation") return "Calculation";
  if (lane === "cycle") return "Calculated cycle";
  if (lane === "content") return "Published reference";
  if (lane === "context") return "Your context";
  if (lane === "reflection") return "Reflection";
  return "Source";
}

export type TodayFactDescription = {
  label: string;
  text?: string;
  values?: { label: string; value: string }[];
};

/** Read the saved statement itself; never substitute a fresh cycle for an archived fact. */
export function describeTodayFact(fact: { id: string; statement: string }): TodayFactDescription {
  const label = todayFactLabel(fact.id);
  if (/^C\d+$/.test(fact.id)) {
    const cycle = fact.statement.match(
      /^transiting ([a-z_]+) (conjunction|opposition|square|trine|sextile|quincunx) natal ([a-z_]+)\. Current orb at the reading's calculation time: ([\d.]+) degrees\. phase ([a-z_]+)\. domain ([a-z_-]+)\. (?:Calculated exact date: (\d{4}-\d{2}-\d{2})|No exact date was found inside the scanned window)\.$/i,
    );
    if (cycle) {
      const [, transit = "", aspect = "", natal = "", orb = "", phase = "", domain = "", exact] =
        cycle;
      return {
        label,
        values: [
          {
            label: "Cycle",
            value: `${todayPointLabel(transit)} ${aspect} natal ${todayPointLabel(natal)}`,
          },
          { label: "Current orb at calculation time", value: `${orb}°` },
          { label: "Phase", value: todayPhaseLabel(phase) },
          { label: "Area of life", value: todayPointLabel(domain) },
          { label: "Calculated exact date", value: exact ?? "Not found in the scanned window" },
        ],
      };
    }
  }
  if (/^I\d+$/.test(fact.id)) {
    return { label, text: fact.statement.replace(/^Published interpretation \S+:\s*/, "") };
  }
  if (fact.id === "S1") {
    return {
      label,
      text: fact.statement.replace(
        /^Published (?:tension|reinforcement) synthesis .+? \(parents: [^)]+\):\s*/s,
        "",
      ),
    };
  }
  if (fact.id === "N1")
    return {
      label,
      text: fact.statement.replace(/^Published natal lens, an interpretive possibility:\s*/, ""),
    };
  if (/^D\d+$/.test(fact.id)) {
    return { label, text: fact.statement.replace(/^Published framing for /, "") };
  }
  if (fact.id === "P2")
    return { label, text: fact.statement.replace(/^Published transit chapter:\s*/, "") };
  if (/^P\d+$/.test(fact.id)) {
    return { label, text: fact.statement.replace(/^Published phase wording:\s*/, "") };
  }
  if (/^E\d+$/.test(fact.id)) {
    const source = fact.statement.match(
      /^positions computed by (\S+) (\S+) at (\S+) precision(?:, (\S+) houses)?$/,
    );
    if (source) {
      const [, engine = "", version = "", precision = "", houses] = source;
      return {
        label,
        values: [
          { label: "Engine", value: todayPointLabel(engine) },
          { label: "Engine version", value: version },
          { label: "Precision", value: todayPointLabel(precision) },
          ...(houses ? [{ label: "House system", value: todayPointLabel(houses) }] : []),
        ],
      };
    }
  }
  if (/^U\d+$/.test(fact.id)) {
    const accuracy = fact.statement.match(
      /^recorded birth-time accuracy is "([^"]+)" \(about plus or minus ([\d.]+) minutes\)$/,
    );
    if (accuracy) {
      const [, recorded = "", minutes = ""] = accuracy;
      return {
        label,
        values: [
          { label: "Recorded birth-time accuracy", value: todayPointLabel(recorded) },
          { label: "Time uncertainty", value: `Approximately ±${minutes} minutes` },
        ],
      };
    }
    // Instructions addressed to the model are retained in Original supplied text.
    return {
      label,
      text: fact.statement.replace(/ Their caveat will be appended separately;.*$/s, ""),
    };
  }
  return { label, text: fact.statement };
}
