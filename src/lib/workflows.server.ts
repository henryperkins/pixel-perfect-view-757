/**
 * Bridge to the Cloudflare edge plane (Workflows + D1 + R2).
 *
 * The Lovable app has no direct D1/R2 bindings, so it talks to the
 * `pattern-workflows` Worker over HMAC-signed HTTP. The Worker owns:
 *   - D1  `release_pointer`  — mirrored active content version
 *   - D1  `workflow_runs`    — durable run ledger
 *   - R2  `pattern-artifacts` — immutable reading artifacts
 *   - Workflow `nightly-reading` — durable multi-step reading build
 */
import { createHmac } from "crypto";

export type WorkflowRun = {
  instance_id: string;
  kind: string;
  release_version: string | null;
  artifact_key: string | null;
  created_at: string;
};

function config() {
  const url = process.env["PATTERN_WORKFLOW_URL"];
  const secret = process.env["PATTERN_WORKFLOW_SECRET"];
  if (!url || !secret) return null;
  return { url: url.replace(/\/$/, ""), secret };
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T | null> {
  const cfg = config();
  if (!cfg) return null;

  const raw = method === "GET" || body === undefined ? "" : JSON.stringify(body);
  const signature = createHmac("sha256", cfg.secret).update(raw).digest("hex");

  // The edge plane is a mirror, never the source of truth: any transport-level
  // failure (DNS, refused connection, TLS, timeout) must degrade to null rather
  // than reject, so a release that is already active is not reported as failed.
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method,
      headers: {
        "x-pattern-signature": signature,
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: raw } : {}),
    });

    if (!res.ok) {
      console.error(`[workflows] ${method} ${path} -> ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[workflows] ${method} ${path} unreachable`, error);
    return null;
  }
}

/** Mirrors the active content release into D1 so the edge plane agrees with the app. */
export async function syncReleasePointer(version: string, checksum: string | null) {
  return call<{ ok: boolean; activeVersion: string }>("POST", "/pointer", {
    version,
    checksum,
  });
}

/** Idempotent delivery of immutable editorial content; no member/model work. */
export async function publishReleaseArtifact(params: {
  operationId: string;
  version: string;
  checksum: string;
  active: boolean;
}) {
  return call<{
    ok: boolean;
    operationId: string;
    version: string;
    checksum: string;
    artifactKey: string;
    activeVersion: string | null;
  }>("POST", "/release-publication", params);
}

/** Starts a durable workflow instance that writes an R2 artifact and a D1 run row. */
export async function triggerReadingWorkflow(params: {
  kind: string;
  day?: string;
  version?: string;
}) {
  return call<{ ok: boolean; instanceId: string; status: { status: string } }>(
    "POST",
    "/trigger",
    params,
  );
}

/** Starts the durable synthetic evaluation; the edge plane calls `callback` once per case. */
export async function startEvaluationWorkflow(params: {
  runId: string;
  total: number;
  callback: string;
}) {
  return call<{ ok: boolean; instanceId: string }>("POST", "/evaluations", params);
}

/** Reads the durable run ledger plus the mirrored pointer state. */
export async function listWorkflowRuns() {
  const data = await call<{ runs: WorkflowRun[]; activeVersion: string | null }>("GET", "/runs");
  return data ?? { runs: [], activeVersion: null, unavailable: true as const };
}
