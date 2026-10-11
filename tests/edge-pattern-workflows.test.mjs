import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { pathToFileURL } from "node:url";

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
