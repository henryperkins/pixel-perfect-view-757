/**
 * Records data plane — Cloudflare D1.
 *
 * The app has no direct D1 binding (it runs as a Worker of its own), so every
 * statement is signed with the shared workflow secret and executed by the
 * `pattern-workflows` Worker, which owns the binding. That Worker is the only
 * thing on the account that can reach the database.
 *
 * The surface below is a deliberately small query builder — enough for the
 * data layer's needs — with SQLite's two rough edges handled centrally:
 *   * JSON documents are stored as TEXT and parsed on the way out.
 *   * booleans are stored as 0/1 and revived on the way out.
 *
 * Row ownership used to be enforced by database policies. It is now enforced
 * here-and-above: every statement this layer builds is scoped by `user_id` in
 * the calling data layer, which only runs behind a verified session.
 */
import { createHmac } from "crypto";

type Primitive = string | number | null;
export interface D1Result<T> {
  data: T;
  error: { message: string } | null;
}

/** Columns holding a JSON document, per table. */
const JSON_COLUMNS: Record<string, readonly string[]> = {
  chart_snapshots: ["positions", "houses", "aspects", "uncertainty"],
  natal_features: ["payload"],
  reading_sources: ["detail"],
  reading_feedback: ["labels"],
  audit_events: ["detail"],
  content_releases: ["bundle"],
  context_signals: ["value"],
};

/** Columns stored as 0/1 that the app treats as booleans. */
const BOOL_COLUMNS: Record<string, readonly string[]> = {
  content_releases: ["is_active"],
  source_consents: ["granted"],
};

/** Tables whose rows carry an app-generated uuid primary key. */
const GENERATED_ID_TABLES = new Set([
  "sessions",
  "user_roles",
  "source_consents",
  "birth_profiles",
  "chart_snapshots",
  "natal_features",
  "cycle_instances",
  "context_signals",
  "content_releases",
  "daily_readings",
  "reading_sources",
  "reading_feedback",
  "check_ins",
  "life_events",
  "audit_events",
  "users",
]);

/** Tables with a created_at / updated_at the app fills with an ISO instant. */
const CREATED_AT_TABLES = new Set([
  ...GENERATED_ID_TABLES,
  "profiles",
]);
const UPDATED_AT_TABLES = new Set(["profiles", "source_consents", "birth_profiles"]);

function config() {
  const url = process.env["PATTERN_WORKFLOW_URL"];
  const secret = process.env["PATTERN_WORKFLOW_SECRET"];
  if (!url || !secret) {
    throw new Error(
      "Records plane is not configured: PATTERN_WORKFLOW_URL / PATTERN_WORKFLOW_SECRET missing.",
    );
  }
  return { url: url.replace(/\/$/, ""), secret };
}

/** Runs one statement against D1 through the signed worker endpoint. */
export async function exec<T = Record<string, unknown>>(
  sql: string,
  params: Primitive[] = [],
): Promise<T[]> {
  const cfg = config();
  const raw = JSON.stringify({ sql, params });
  const signature = createHmac("sha256", cfg.secret).update(raw).digest("hex");
  const res = await fetch(`${cfg.url}/d1/query`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pattern-signature": signature },
    body: raw,
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 400);
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) detail = parsed.error;
    } catch {
      /* keep the raw text */
    }
    throw new Error(`records query failed (${res.status}): ${detail}`);
  }
  const payload = JSON.parse(text) as { results?: T[] };
  return payload.results ?? [];
}

function encode(table: string, column: string, value: unknown): Primitive {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (typeof value === "object") return JSON.stringify(value);
  if (JSON_COLUMNS[table]?.includes(column) && typeof value === "string") return value;
  return String(value);
}

function decodeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const jsonCols = JSON_COLUMNS[table] ?? [];
  const boolCols = BOOL_COLUMNS[table] ?? [];
  const out: Record<string, unknown> = { ...row };
  for (const col of jsonCols) {
    const v = out[col];
    if (typeof v === "string") {
      try {
        out[col] = JSON.parse(v);
      } catch {
        /* leave the raw string */
      }
    }
  }
  for (const col of boolCols) {
    if (col in out && out[col] !== null) out[col] = Boolean(out[col]);
  }
  return out;
}

type Filter = { sql: string; params: Primitive[] };

class Query<T = Record<string, unknown>> implements PromiseLike<D1Result<T>> {
  private op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private columns = "*";
  private rows: Record<string, unknown>[] = [];
  private values: Record<string, unknown> = {};
  private conflict: string[] = [];
  private filters: Filter[] = [];
  private orderBy: string[] = [];
  private limitN: number | null = null;
  private returning: string | null = null;
  private rowMode: "many" | "maybeSingle" | "single" = "many";

  constructor(private table: string) {}

  select(columns = "*") {
    if (this.op === "select") this.columns = columns;
    else this.returning = columns;
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(
    rows: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string },
  ) {
    this.op = "upsert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    this.conflict = (options?.onConflict ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    return this;
  }

  update(values: Record<string, unknown>) {
    this.op = "update";
    this.values = values;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({
      sql: `"${column}" is ?`,
      params: [encode(this.table, column, value)],
    });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({
      sql: `"${column}" is not ?`,
      params: [encode(this.table, column, value)],
    });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ sql: `"${column}" < ?`, params: [encode(this.table, column, value)] });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ sql: `"${column}" <= ?`, params: [encode(this.table, column, value)] });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ sql: `"${column}" >= ?`, params: [encode(this.table, column, value)] });
    return this;
  }

  in(column: string, values: unknown[]) {
    if (values.length === 0) {
      this.filters.push({ sql: "1 = 0", params: [] });
      return this;
    }
    this.filters.push({
      sql: `"${column}" in (${values.map(() => "?").join(", ")})`,
      params: values.map((v) => encode(this.table, column, v)),
    });
    return this;
  }

  isNotNull(column: string) {
    this.filters.push({ sql: `"${column}" is not null`, params: [] });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push(`"${column}" ${options?.ascending === false ? "desc" : "asc"}`);
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  maybeSingle() {
    this.rowMode = "maybeSingle";
    if (this.limitN === null) this.limitN = 1;
    return this as unknown as Query<T | null>;
  }

  single() {
    this.rowMode = "single";
    if (this.limitN === null && this.op === "select") this.limitN = 1;
    return this as unknown as Query<T>;
  }

  private where(): Filter {
    if (!this.filters.length) return { sql: "", params: [] };
    return {
      sql: ` where ${this.filters.map((f) => f.sql).join(" and ")}`,
      params: this.filters.flatMap((f) => f.params),
    };
  }

  private withDefaults(row: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString();
    const out = { ...row };
    if (GENERATED_ID_TABLES.has(this.table) && out["id"] === undefined) {
      out["id"] = crypto.randomUUID();
    }
    if (CREATED_AT_TABLES.has(this.table) && out["created_at"] === undefined) {
      out["created_at"] = now;
    }
    if (UPDATED_AT_TABLES.has(this.table)) out["updated_at"] = now;
    return out;
  }

  private build(): Filter {
    const t = `"${this.table}"`;
    if (this.op === "select") {
      const where = this.where();
      const order = this.orderBy.length ? ` order by ${this.orderBy.join(", ")}` : "";
      const limit = this.limitN !== null ? ` limit ${this.limitN}` : "";
      return {
        sql: `select ${this.columns === "*" ? "*" : this.columns} from ${t}${where.sql}${order}${limit}`,
        params: where.params,
      };
    }

    if (this.op === "delete") {
      const where = this.where();
      return { sql: `delete from ${t}${where.sql}`, params: where.params };
    }

    if (this.op === "update") {
      const values = { ...this.values };
      if (UPDATED_AT_TABLES.has(this.table)) values["updated_at"] = new Date().toISOString();
      const cols = Object.keys(values);
      const where = this.where();
      return {
        sql:
          `update ${t} set ${cols.map((c) => `"${c}" = ?`).join(", ")}${where.sql}` +
          (this.returning ? ` returning ${this.returning}` : ""),
        params: [
          ...cols.map((c) => encode(this.table, c, values[c])),
          ...where.params,
        ],
      };
    }

    // insert / upsert
    const prepared = this.rows.map((r) => this.withDefaults(r));
    const cols = [...new Set(prepared.flatMap((r) => Object.keys(r)))];
    const tuples = prepared.map(() => `(${cols.map(() => "?").join(", ")})`);
    const params = prepared.flatMap((r) =>
      cols.map((c) => encode(this.table, c, r[c] ?? null)),
    );
    let sql = `insert into ${t} (${cols.map((c) => `"${c}"`).join(", ")}) values ${tuples.join(", ")}`;
    if (this.op === "upsert" && this.conflict.length) {
      const updatable = cols.filter(
        (c) => !this.conflict.includes(c) && c !== "id" && c !== "created_at",
      );
      sql +=
        ` on conflict(${this.conflict.map((c) => `"${c}"`).join(", ")}) do update set ` +
        (updatable.length
          ? updatable.map((c) => `"${c}" = excluded."${c}"`).join(", ")
          : `"${this.conflict[0]}" = excluded."${this.conflict[0]}"`);
    }
    if (this.returning) sql += ` returning ${this.returning}`;
    return { sql, params };
  }

  async run(): Promise<D1Result<T>> {
    try {
      const { sql, params } = this.build();
      const rows = (await exec<Record<string, unknown>>(sql, params)).map((r) =>
        decodeRow(this.table, r),
      );
      if (this.rowMode === "many") return { data: rows as unknown as T, error: null };
      const first = rows[0] ?? null;
      if (this.rowMode === "single" && !first) {
        return { data: null as unknown as T, error: { message: "No row returned." } };
      }
      return { data: first as unknown as T, error: null };
    } catch (err) {
      return {
        data: null as unknown as T,
        error: { message: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  then<R1 = D1Result<T>, R2 = never>(
    onfulfilled?: ((value: D1Result<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

/** Records client. `db.from("table")` mirrors the small builder above. */
export function records() {
  return {
    from<T = Record<string, unknown>>(table: string) {
      return new Query<T>(table);
    },
    exec,
  };
}

export type DBClient = ReturnType<typeof records>;
