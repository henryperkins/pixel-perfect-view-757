import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

const SECRET = "edge-test-secret-never-a-real-secret";
const sign = (raw) => createHmac("sha256", SECRET).update(raw).digest("hex");
let directory, worker;
before(async () => {
  // Node cannot resolve the Workers runtime module, so the test supplies its base class.
  const source = await readFile(
    new URL("../edge/pattern-workflows/worker.mjs", import.meta.url),
    "utf8",
  );
  const runnable = source.replace(
    'import { WorkflowEntrypoint } from "cloudflare:workers";',
    "class WorkflowEntrypoint { constructor(ctx, env) { this.env = env; } }",
  );
  assert.notEqual(runnable, source);
  directory = await mkdtemp(join(tmpdir(), "pattern-edge-"));
  await writeFile(join(directory, "worker.mjs"), runnable);
  worker = await import(pathToFileURL(join(directory, "worker.mjs")).href);
});
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

test("billing configuration requires a fresh signed server request and forbids caching", async () => {
  const env = {
    PATTERN_WORKFLOW_SECRET: SECRET,
    PATTERN_MEMBERSHIPS_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_test_fixture",
  };
  const request = (data, signature = true) => {
    const raw = JSON.stringify(data);
    return new Request("https://worker.example.test/billing/config", {
      method: "POST",
      body: raw,
      headers: signature ? { "x-pattern-signature": sign(raw) } : {},
    });
  };
  const data = { purpose: "membership-config", issuedAt: Date.now(), nonce: crypto.randomUUID() };
  assert.equal((await worker.default.fetch(request(data, false), env)).status, 401);
  assert.equal(
    (await worker.default.fetch(request({ ...data, issuedAt: Date.now() - 61000 }), env)).status,
    401,
  );
  assert.equal(
    (await worker.default.fetch(request({ ...data, purpose: "other" }), env)).status,
    401,
  );
  const response = await worker.default.fetch(request(data), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const configuration = await response.json();
  assert.equal(Object.hasOwn(configuration, "secretKey"), false);
  assert.equal(Object.hasOwn(configuration, "webhookSecret"), false);
});

function publicationFixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE content_releases(version TEXT PRIMARY KEY,checksum TEXT,checksum_algorithm TEXT,bundle TEXT,is_active INTEGER);CREATE TABLE release_pointer(version TEXT PRIMARY KEY,checksum TEXT,is_active INTEGER,created_at TEXT);",
  );
  const bundle = { cycles: [], natal: { sun_placement: "Reviewed editorial copy." } };
  const canonical = JSON.stringify(bundle),
    checksum = createHash("sha256").update(canonical).digest("hex");
  db.prepare("INSERT INTO content_releases VALUES (?,?,?,?,1)").run(
    "1.0.0",
    checksum,
    "sha256-canonical-json-v1",
    canonical,
  );
  db.prepare("INSERT INTO release_pointer VALUES (?,?,1,?)").run(
    "old-version",
    "old-checksum",
    "2026-01-01",
  );
  const objects = new Map(),
    puts = [];
  let beforeBatch = null;
  const env = {
    PATTERN_WORKFLOW_SECRET: SECRET,
    RECORDS: {
      prepare(sql) {
        let params = [];
        return {
          bind(...values) {
            params = values;
            return this;
          },
          async first() {
            return db.prepare(sql).get(...params) ?? null;
          },
          async run() {
            return db.prepare(sql).run(...params);
          },
          async all() {
            return { results: db.prepare(sql).all(...params) };
          },
          sql,
          get params() {
            return params;
          },
        };
      },
      async batch(statements) {
        if (beforeBatch) beforeBatch();
        db.exec("BEGIN");
        try {
          const results = statements.map((s) => ({ results: db.prepare(s.sql).all(...s.params) }));
          db.exec("COMMIT");
          return results;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
    ARTIFACTS: {
      async get(key) {
        const text = objects.get(key);
        return text === undefined
          ? null
          : {
              body: text,
              async text() {
                return text;
              },
            };
      },
      async put(key, text) {
        objects.set(key, text);
        puts.push(key);
      },
    },
  };
  const body = {
    operationId: "36d7cf2c-3e38-4ef4-af28-3dc01e95ae91",
    version: "1.0.0",
    checksum,
    active: true,
  };
  const request = (payload = body) =>
    new Request("https://worker.example.test/release-publication", {
      method: "POST",
      headers: { "x-pattern-signature": sign(JSON.stringify(payload)) },
      body: JSON.stringify(payload),
    });
  return {
    db,
    env,
    objects,
    puts,
    body,
    request,
    setBeforeBatch(fn) {
      beforeBatch = fn;
    },
  };
}

test("/release-publication writes immutable editorial artifacts and idempotent receipts with an atomic pointer mirror", async () => {
  const f = publicationFixture();
  try {
    const first = await worker.default.fetch(f.request(), f.env);
    assert.equal(first.status, 200);
    const receipt = await first.json();
    assert.equal(receipt.activeVersion, "1.0.0");
    assert.equal(receipt.artifactKey, "content-releases/1.0.0/bundle.json");
    assert.equal((await worker.default.fetch(f.request(), f.env)).status, 200);
    assert.equal(f.puts.length, 2);
    assert.equal(
      f.db.prepare("SELECT version FROM release_pointer WHERE is_active=1").get().version,
      "1.0.0",
    );
    const operation = f.objects.get("operations/content-release/" + f.body.operationId + ".json");
    assert.ok(operation);
    assert.ok(!/userId|user_id|password|email/.test(operation));
  } finally {
    f.db.close();
  }
});

test("/release-publication rejects stale activation and differing artifacts without replacing the mirror", async () => {
  const f = publicationFixture();
  try {
    f.setBeforeBatch(() => f.db.prepare("UPDATE content_releases SET is_active=0").run());
    assert.equal((await worker.default.fetch(f.request(), f.env)).status, 409);
    assert.equal(
      f.db.prepare("SELECT version FROM release_pointer WHERE is_active=1").get().version,
      "old-version",
    );
    f.setBeforeBatch(null);
    f.db.prepare("UPDATE content_releases SET is_active=1").run();
    f.objects.set("content-releases/1.0.0/bundle.json", "Different content");
    assert.equal((await worker.default.fetch(f.request(), f.env)).status, 409);
    assert.equal(f.objects.get("content-releases/1.0.0/bundle.json"), "Different content");
  } finally {
    f.db.close();
  }
});

test("/release-publication staging does not change the active pointer and validates source checksum and operation identity", async () => {
  const f = publicationFixture();
  try {
    const staged = { ...f.body, active: false };
    assert.equal((await worker.default.fetch(f.request(staged), f.env)).status, 200);
    assert.equal(
      f.db.prepare("SELECT version FROM release_pointer WHERE is_active=1").get().version,
      "old-version",
    );
    assert.equal(
      (await worker.default.fetch(f.request({ ...f.body, operationId: "../unsafe" }), f.env))
        .status,
      400,
    );
    assert.equal(
      (await worker.default.fetch(f.request({ ...f.body, checksum: "0".repeat(64) }), f.env))
        .status,
      409,
    );
    assert.equal(
      (await worker.default.fetch(f.request(), f.env)).status,
      409,
      "an operation ID cannot change meaning",
    );
  } finally {
    f.db.close();
  }
});

function evaluationsRequest(body, signature = sign(JSON.stringify(body))) {
  return new Request("https://pattern-workflows.example.workers.dev/evaluations", {
    method: "POST",
    headers: { "x-pattern-signature": signature },
    body: JSON.stringify(body),
  });
}

test("/evaluations starts one Workflow per run, only for the signed app step callback", async () => {
  const created = [];
  const env = {
    PATTERN_WORKFLOW_SECRET: SECRET,
    EVALUATIONS: {
      async create(options) {
        created.push(options);
        return { id: options.id };
      },
    },
  };
  const runId = "0b6f6a1e-6d1c-4d0f-9f5e-1f6b8c2d3e4a";
  const good = {
    runId,
    total: 28,
    callback: "https://app.example.test/api/public/evaluation-step",
  };
  const response = await worker.default.fetch(evaluationsRequest(good), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, instanceId: runId });
  assert.deepEqual(created, [{ id: runId, params: good }]);

  for (const [body, status] of [
    [{ ...good, callback: "http://app.example.test/api/public/evaluation-step" }, 400],
    [{ ...good, planHash: "bad", qualificationProfile: "writing-base" }, 400],
    [{ ...good, planHash: "a".repeat(64), qualificationProfile: "arbitrary" }, 400],
    [{ ...good, planHash: "a".repeat(64), enterpriseThinking: "MINIMAL" }, 400],
    [{ ...good, callback: "https://attacker.example.test/collect" }, 400],
    [{ ...good, callback: "not a url" }, 400],
    [{ ...good, runId: "../../escape" }, 400],
    [{ ...good, total: 0 }, 400],
    [{ ...good, total: 1.5 }, 400],
  ])
    assert.equal((await worker.default.fetch(evaluationsRequest(body), env)).status, status);
  assert.equal(
    (await worker.default.fetch(evaluationsRequest(good, "0".repeat(64)), env)).status,
    401,
  );
  assert.equal(created.length, 1);
});

test("signed Workflow status lookup only reads its named existing instance and omits payloads", async () => {
  const instanceId = "0b6f6a1e-6d1c-4d0f-9f5e-1f6b8c2d3e4a";
  const lookedUp = [];
  const env = {
    PATTERN_WORKFLOW_SECRET: SECRET,
    EVALUATIONS: {
      async get(id) {
        lookedUp.push(id);
        return {
          id,
          async status() {
            return {
              status: "errored",
              error: { message: "private debug detail" },
              output: "private output",
            };
          },
        };
      },
      async create() {
        assert.fail("Status must never create a Workflow");
      },
    },
  };
  const raw = JSON.stringify({ instanceId });
  const request = (body = raw, signature = sign(body)) =>
    new Request("https://worker.example.test/evaluations/status", {
      method: "POST",
      body,
      headers: { "x-pattern-signature": signature },
    });
  assert.equal((await worker.default.fetch(request(raw, "0".repeat(64)), env)).status, 401);
  for (const bad of ["not json", JSON.stringify({ instanceId: "../private" }), JSON.stringify({})])
    assert.equal((await worker.default.fetch(request(bad), env)).status, 400);
  assert.deepEqual(lookedUp, []);
  const response = await worker.default.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, instanceId, status: "errored" });
  assert.deepEqual(lookedUp, [instanceId]);
  env.EVALUATIONS.get = async () => {
    throw new Error("private service error");
  };
  const unavailable = await worker.default.fetch(request(), env);
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(await unavailable.text(), /private/);
});

test("the evaluation Workflow carries the immutable plan and closed profile in every signed step", async () => {
  const savedFetch = globalThis.fetch,
    calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(init);
    return Response.json({ next: calls.length < 2 });
  };
  try {
    const profile = { planHash: "b".repeat(64), qualificationProfile: "writing-final" };
    const flow = new worker.SyntheticEvaluationWorkflow({}, { PATTERN_WORKFLOW_SECRET: SECRET });
    await flow.run(
      {
        payload: {
          runId: "run-frozen",
          total: 50,
          callback: "https://app.example.test/api/public/evaluation-step",
          ...profile,
        },
      },
      { do: async (name, config, callback) => callback() },
    );
    for (const [position, init] of calls.entries()) {
      assert.deepEqual(JSON.parse(init.body), { runId: "run-frozen", position, ...profile });
      assert.equal(init.headers["x-pattern-signature"], sign(init.body));
    }
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test("the evaluation Workflow signs one step per case and stops when the app says so", async () => {
  const calls = [];
  const configs = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({ next: calls.length < 3 });
  };
  try {
    const flow = new worker.SyntheticEvaluationWorkflow({}, { PATTERN_WORKFLOW_SECRET: SECRET });
    const step = {
      async do(name, config, callback) {
        configs.push({ name, config });
        return callback();
      },
    };
    const callback = "https://app.example.test/api/public/evaluation-step";
    const result = await flow.run({ payload: { runId: "run-1", total: 28, callback } }, step);
    assert.deepEqual(result, { runId: "run-1", steps: 3 });
    assert.deepEqual(
      calls.map(({ url, init }) => [url, JSON.parse(init.body)]),
      [0, 1, 2].map((position) => [callback, { runId: "run-1", position }]),
    );
    for (const { init } of calls)
      assert.equal(init.headers["x-pattern-signature"], sign(init.body));
    assert.deepEqual(
      configs.map(({ name, config }) => [name, config.retries.limit, config.timeout]),
      [0, 1, 2].map((position) => [`case ${position}`, 0, "5 minutes"]),
    );

    globalThis.fetch = async () => new Response("down", { status: 503 });
    await assert.rejects(
      flow.run({ payload: { runId: "run-2", total: 28, callback } }, step),
      /answered 503/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the UTC cron creates one retention instance per day and surfaces startup failure", async () => {
  assert.equal(typeof worker.default.scheduled, "function", "retention cron is missing");
  const created = [],
    instances = new Map();
  const env = {
    PATTERN_APP_URL: "https://patterns.lakefrontdigital.io",
    RETENTION: {
      async create(options) {
        if (instances.has(options.id)) throw new Error("existing");
        created.push(options);
        instances.set(options.id, {});
        return { id: options.id };
      },
      async get(id) {
        if (!instances.has(id)) throw new Error("missing");
        return { id };
      },
    },
  };
  const scheduledTime = Date.parse("2026-10-12T03:00:00Z");
  await worker.default.scheduled({ scheduledTime }, env);
  await worker.default.scheduled({ scheduledTime }, env);
  assert.equal(created.length, 1);
  assert.equal(created[0].id, "retention-2026-10-12");
  assert.equal(created[0].params.now, "2026-10-12T03:00:00.000Z");
  assert.equal(
    created[0].params.callback,
    "https://patterns.lakefrontdigital.io/api/public/retention-step",
  );
  env.RETENTION.create = async () => {
    throw new Error("offline");
  };
  await assert.rejects(worker.default.scheduled({ scheduledTime: scheduledTime + 86400000 }, env));
});

test("retention resumes cached pages with a fixed cutoff and publishes only count receipts", async () => {
  assert.equal(typeof worker.RetentionWorkflow, "function", "retention Workflow is missing");
  const originalFetch = globalThis.fetch,
    requests = [],
    artifacts = [],
    cache = new Map();
  let fail = true;
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    requests.push({ body, headers: init.headers });
    assert.equal(
      init.headers["x-pattern-signature"],
      sign(init.headers["x-pattern-timestamp"] + "\n" + init.body),
    );
    if (body.cursor === null)
      return Response.json({ nextCursor: "owner-cursor", counts: { owners: 100, journal: 2 } });
    if (fail) return new Response("unavailable", { status: 503 });
    return Response.json({ nextCursor: null, counts: { owners: 4, feedback: 3 } });
  };
  const step = {
    async do(name, config, fn) {
      if (cache.has(name)) return cache.get(name);
      const result = await (fn ?? config)();
      cache.set(name, result);
      return result;
    },
  };
  const flow = new worker.RetentionWorkflow(
    {},
    {
      PATTERN_WORKFLOW_SECRET: SECRET,
      ARTIFACTS: {
        async put(key, value) {
          artifacts.push({ key, body: JSON.parse(value) });
        },
      },
    },
  );
  const event = {
    instanceId: "retention-2026-10-12",
    payload: {
      now: "2026-10-12T03:00:00Z",
      callback: "https://app.example.test/api/public/retention-step",
    },
  };
  try {
    await assert.rejects(flow.run(event, step), /answered 503/);
    assert.equal(artifacts.at(-1).body.status, "failed");
    fail = false;
    const result = await flow.run(event, step);
    assert.deepEqual(result.counts, { owners: 104, journal: 2, feedback: 3 });
    assert.equal(requests.filter((request) => request.body.cursor === null).length, 1);
    assert.equal(
      requests.every(
        (request) => request.body.now === event.payload.now && request.body.limit === 100,
      ),
      true,
    );
    assert.equal(artifacts.at(-1).key, "operations/retention/retention-2026-10-12.json");
    assert.equal(artifacts.at(-1).body.status, "complete");
    assert.equal(JSON.stringify(artifacts).includes("owner-cursor"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
