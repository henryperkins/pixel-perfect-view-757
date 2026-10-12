// pattern-workflows: the app's signed records plane and durable Workflows.
// Deploy with `npx wrangler deploy` from a copy of this folder outside the app tree:
// the app build's generated .wrangler/deploy/config.json otherwise redirects wrangler.
import { WorkflowEntrypoint } from "cloudflare:workers";

const enc = new TextEncoder();

async function hmacHex(raw, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verify(raw, sig, secret) {
  if (!sig) return false;
  const hex = await hmacHex(raw, secret);
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export function canonicalReleaseJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalReleaseJson).join(",") + "]";
  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + canonicalReleaseJson(value[key]))
      .join(",") +
    "}"
  );
}

/** Immutable editorial artifact delivery. The authoritative records pointer fences its mirror. */
async function publishEditorialRelease(raw, env) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return new Response("Invalid publication request", { status: 400 });
  }
  const { operationId, version, checksum, active } = input;
  if (
    typeof operationId !== "string" ||
    !/^[0-9a-f-]{36}$/.test(operationId) ||
    typeof version !== "string" ||
    !/^[A-Za-z0-9._-]{1,64}$/.test(version) ||
    typeof checksum !== "string" ||
    checksum.length < 1 ||
    checksum.length > 256 ||
    typeof active !== "boolean"
  )
    return new Response("Invalid publication identity", { status: 400 });
  const row = await env.RECORDS.prepare(
    "SELECT version,checksum,checksum_algorithm,bundle,is_active FROM content_releases WHERE version=?",
  )
    .bind(version)
    .first();
  if (!row || row.checksum !== checksum || (active && !row.is_active))
    return new Response("Publication source changed", { status: 409 });
  let canonical;
  try {
    canonical = canonicalReleaseJson(JSON.parse(row.bundle));
  } catch {
    return new Response("Invalid stored content", { status: 409 });
  }
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(canonical)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (row.checksum_algorithm === "sha256-canonical-json-v1" && hash !== checksum)
    return new Response("Stored content checksum mismatch", { status: 409 });
  const operationKey = "operations/content-release/" + operationId + ".json";
  const oldOperation = await env.ARTIFACTS.get(operationKey);
  let oldReceipt = null;
  if (oldOperation) {
    try {
      oldReceipt = JSON.parse(await oldOperation.text());
    } catch {
      return new Response("Invalid publication receipt", { status: 409 });
    }
    if (
      oldReceipt.version !== version ||
      oldReceipt.checksum !== checksum ||
      oldReceipt.active !== active
    )
      return new Response("Publication operation conflict", { status: 409 });
  }
  const artifactKey = "content-releases/" + version + "/bundle.json";
  const artifact = await env.ARTIFACTS.get(artifactKey);
  if (artifact && (await artifact.text()) !== canonical)
    return new Response("Immutable editorial artifact conflict", { status: 409 });
  if (!artifact)
    await env.ARTIFACTS.put(artifactKey, canonical, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: {
        checksum,
        checksumAlgorithm: row.checksum_algorithm || "legacy-unlabelled",
        canonicalSha256: hash,
      },
    });
  if (active) {
    try {
      await env.RECORDS.batch([
        env.RECORDS.prepare(
          "SELECT CASE WHEN (SELECT COUNT(*) FROM content_releases WHERE is_active=1)=1 AND EXISTS(SELECT 1 FROM content_releases WHERE version=? AND checksum=? AND is_active=1) THEN 1 ELSE json('release-pointer-changed') END",
        ).bind(version, checksum),
        env.RECORDS.prepare("UPDATE release_pointer SET is_active=0"),
        env.RECORDS.prepare(
          "INSERT INTO release_pointer (version,checksum,is_active,created_at) VALUES (?,?,1,?) ON CONFLICT(version) DO UPDATE SET is_active=1,checksum=excluded.checksum",
        ).bind(version, checksum, new Date().toISOString()),
      ]);
    } catch {
      const current = await env.RECORDS.prepare(
        "SELECT version FROM content_releases WHERE version=? AND checksum=? AND is_active=1",
      )
        .bind(version, checksum)
        .first();
      return new Response(
        current ? "Publication mirror unavailable" : "Publication source changed",
        { status: current ? 503 : 409 },
      );
    }
  }
  const receipt = oldReceipt ?? {
    ok: true,
    operationId,
    version,
    checksum,
    active,
    canonicalSha256: hash,
    artifactKey,
    activeVersion: active ? version : null,
    at: new Date().toISOString(),
  };
  if (!oldReceipt)
    await env.ARTIFACTS.put(operationKey, JSON.stringify(receipt), {
      httpMetadata: { contentType: "application/json" },
    });
  return Response.json(receipt);
}

export class NightlyReadingWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const p = event.payload || {};
    const day = p.day || new Date().toISOString().slice(0, 10);

    const release = await step.do("resolve-release", async () => {
      const row = await this.env.RECORDS.prepare(
        "select version from release_pointer where is_active = 1 limit 1",
      ).first();
      return p.version || (row && row.version) || "editorial-1.0.0";
    });

    const key = await step.do("write-artifact", async () => {
      const k = "readings/" + day + "/" + event.instanceId + ".json";
      await this.env.ARTIFACTS.put(
        k,
        JSON.stringify({
          instanceId: event.instanceId,
          kind: p.kind || "nightly-reading",
          release,
          day,
          payload: p,
          at: new Date().toISOString(),
        }),
        { httpMetadata: { contentType: "application/json" } },
      );
      return k;
    });

    await step.do("record-run", async () => {
      await this.env.RECORDS.prepare(
        "insert into workflow_runs (instance_id, kind, release_version, artifact_key, created_at) values (?, ?, ?, ?, ?)",
      )
        .bind(event.instanceId, p.kind || "nightly-reading", release, key, new Date().toISOString())
        .run();
    });

    return { release, key, day };
  }
}

// One synthetic evaluation run: each case is a signed call to the app, which runs the
// case, stores its result and answers whether to continue. A failed call ends the run
// (no retries), so a model request is never repeated automatically.
export class SyntheticEvaluationWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { runId, total, callback } = event.payload || {};
    let steps = 0;
    for (let position = 0; position < total; position++) {
      const outcome = await step.do(
        "case " + position,
        { retries: { limit: 0, delay: "1 second" }, timeout: "5 minutes" },
        async () => {
          const raw = JSON.stringify({ runId, position });
          const res = await fetch(callback, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-pattern-signature": await hmacHex(raw, this.env.PATTERN_WORKFLOW_SECRET),
            },
            body: raw,
          });
          if (!res.ok) throw new Error("Evaluation step " + position + " answered " + res.status);
          const body = await res.json();
          return { next: Boolean(body && body.next === true) };
        },
      );
      steps = position + 1;
      if (!outcome.next) break;
    }
    return { runId, steps };
  }
}

export class RetentionWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { now, callback } = event.payload || {};
    const runId = event.instanceId;
    if (!/^retention-\d{4}-\d{2}-\d{2}$/.test(runId) || !Number.isFinite(Date.parse(now)))
      throw new Error("Invalid retention run");
    const target = new URL(callback);
    if (
      target.protocol !== "https:" ||
      target.pathname !== "/api/public/retention-step" ||
      target.username ||
      target.password ||
      target.search ||
      target.hash
    )
      throw new Error("Invalid retention callback");
    const counts = {};
    let cursor = null,
      pages = 0;
    try {
      for (;;) {
        if (pages >= 1000) throw new Error("Retention continuation limit reached");
        const outcome = await step.do(
          "retention page " + pages,
          { retries: { limit: 0, delay: "1 second" }, timeout: "5 minutes" },
          async () => {
            const raw = JSON.stringify({ now, cursor, limit: 100 });
            const timestamp = String(Math.floor(Date.now() / 1000));
            const response = await fetch(target, {
              method: "POST",
              redirect: "manual",
              headers: {
                "content-type": "application/json",
                "x-pattern-timestamp": timestamp,
                "x-pattern-signature": await hmacHex(
                  timestamp + "\n" + raw,
                  this.env.PATTERN_WORKFLOW_SECRET,
                ),
              },
              body: raw,
              signal: AbortSignal.timeout(240_000),
            });
            if (!response.ok) throw new Error("Retention step answered " + response.status);
            const value = await response.json();
            if (
              !(value.nextCursor === null || typeof value.nextCursor === "string") ||
              !value.counts ||
              Object.values(value.counts).some((n) => !Number.isSafeInteger(n) || n < 0)
            )
              throw new Error("Invalid retention response");
            if (value.nextCursor !== null && value.nextCursor === cursor)
              throw new Error("Retention cursor did not advance");
            return value;
          },
        );
        for (const [name, count] of Object.entries(outcome.counts))
          counts[name] = (counts[name] || 0) + count;
        pages++;
        cursor = outcome.nextCursor;
        if (cursor === null) break;
      }
      await step.do("retention receipt", async () => {
        await this.env.ARTIFACTS.put(
          "operations/retention/" + runId + ".json",
          JSON.stringify({ runId, status: "complete", now, pages, counts }),
          { httpMetadata: { contentType: "application/json" } },
        );
        return true;
      });
      return { runId, pages, counts };
    } catch (error) {
      console.error(JSON.stringify({ event: "retention-failed", runId, pages }));
      await step.do("retention failure receipt", async () => {
        await this.env.ARTIFACTS.put(
          "operations/retention/" + runId + ".failed.json",
          JSON.stringify({ runId, status: "failed", now, pages, counts }),
          { httpMetadata: { contentType: "application/json" } },
        );
        return true;
      });
      throw error;
    }
  }
}

export default {
  async scheduled(controller, env) {
    const now = new Date(controller.scheduledTime).toISOString();
    const id = "retention-" + now.slice(0, 10);
    const callback = new URL("/api/public/retention-step", env.PATTERN_APP_URL).toString();
    try {
      await env.RETENTION.create({ id, params: { now, callback } });
    } catch (error) {
      try {
        await env.RETENTION.get(id);
      } catch {
        console.error(JSON.stringify({ event: "retention-start-failed", runId: id }));
        throw error;
      }
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    const raw = request.method === "GET" ? "" : await request.text();
    const ok = await verify(
      raw,
      request.headers.get("x-pattern-signature"),
      env.PATTERN_WORKFLOW_SECRET,
    );
    if (!ok) return new Response("Invalid signature", { status: 401 });

    // ---- signed data plane: the app's only route to the records database ----
    if (request.method === "POST" && url.pathname === "/d1/query") {
      const { sql, params } = JSON.parse(raw);
      if (typeof sql !== "string" || !sql) return new Response("sql required", { status: 400 });
      try {
        const stmt = env.RECORDS.prepare(sql);
        const bound = Array.isArray(params) && params.length ? stmt.bind(...params) : stmt;
        const out = await bound.all();
        return Response.json({ ok: true, results: out.results || [], meta: out.meta || null });
      } catch (e) {
        return Response.json({ ok: false, error: String((e && e.message) || e) }, { status: 400 });
      }
    }

    if (request.method === "POST" && url.pathname === "/d1/batch") {
      const { statements } = JSON.parse(raw);
      if (!Array.isArray(statements) || !statements.length)
        return new Response("statements required", { status: 400 });
      try {
        const prepared = statements.map((s) => {
          const stmt = env.RECORDS.prepare(s.sql);
          return Array.isArray(s.params) && s.params.length ? stmt.bind(...s.params) : stmt;
        });
        const out = await env.RECORDS.batch(prepared);
        return Response.json({
          ok: true,
          batch: out.map((r) => ({ results: r.results || [], meta: r.meta || null })),
        });
      } catch (e) {
        return Response.json({ ok: false, error: String((e && e.message) || e) }, { status: 400 });
      }
    }

    if (request.method === "POST" && url.pathname === "/release-publication") {
      if (raw.length > 4096) return new Response("Publication request too large", { status: 413 });
      try {
        return await publishEditorialRelease(raw, env);
      } catch {
        return new Response("Editorial artifact delivery unavailable", { status: 503 });
      }
    }

    if (request.method === "POST" && url.pathname === "/trigger") {
      const payload = raw ? JSON.parse(raw) : {};
      const instance = await env.NIGHTLY.create({ params: payload });
      return Response.json({ ok: true, instanceId: instance.id, status: await instance.status() });
    }

    if (request.method === "POST" && url.pathname === "/evaluations") {
      const { runId, total, callback } = raw ? JSON.parse(raw) : {};
      let target;
      try {
        target = new URL(callback);
      } catch {
        return new Response("callback required", { status: 400 });
      }
      // Only the app's signed evaluation step may be called back.
      if (target.protocol !== "https:" || target.pathname !== "/api/public/evaluation-step")
        return new Response("callback not allowed", { status: 400 });
      if (
        typeof runId !== "string" ||
        !/^[0-9a-f-]{36}$/.test(runId) ||
        !Number.isInteger(total) ||
        total < 1 ||
        total > 200
      )
        return new Response("invalid evaluation run", { status: 400 });
      const instance = await env.EVALUATIONS.create({
        id: runId,
        params: { runId, total, callback: target.toString() },
      });
      return Response.json({ ok: true, instanceId: instance.id });
    }

    if (request.method === "POST" && url.pathname === "/pointer") {
      const { version, checksum } = JSON.parse(raw);
      if (!version) return new Response("version required", { status: 400 });
      await env.RECORDS.prepare("update release_pointer set is_active = 0").run();
      await env.RECORDS.prepare(
        "insert into release_pointer (version, checksum, is_active, created_at) values (?, ?, 1, ?) on conflict(version) do update set is_active = 1, checksum = excluded.checksum",
      )
        .bind(version, checksum || null, new Date().toISOString())
        .run();
      return Response.json({ ok: true, activeVersion: version });
    }

    if (request.method === "GET" && url.pathname === "/runs") {
      const { results } = await env.RECORDS.prepare(
        "select instance_id, kind, release_version, artifact_key, created_at from workflow_runs order by id desc limit 20",
      ).all();
      const pointer = await env.RECORDS.prepare(
        "select version, checksum from release_pointer where is_active = 1 limit 1",
      ).first();
      return Response.json({
        runs: results || [],
        activeVersion: pointer ? pointer.version : null,
      });
    }

    if (request.method === "GET" && url.pathname === "/artifact") {
      const k = url.searchParams.get("key");
      if (!k) return new Response("key required", { status: 400 });
      const obj = await env.ARTIFACTS.get(k);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, { headers: { "content-type": "application/json" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
