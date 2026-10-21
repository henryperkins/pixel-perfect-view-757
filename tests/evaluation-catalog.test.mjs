import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { resolve } from "node:path";
import { build } from "vite";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, catalog, manifests, getIdentity;
before(async () => {
  h = await createRecordsHarness({
    plugins: [
      {
        name: "evaluation-identity-session-fixture",
        enforce: "pre",
        resolveId(id) {
          if (/\/auth\.server(?:\.ts)?$/.test(id)) return "\0evaluation-session";
        },
        load(id) {
          if (id === "\0evaluation-session")
            return "export const getSessionUser = async () => globalThis.__evaluationIdentitySession ?? null;";
        },
      },
    ],
  });
  catalog = await h.vite.ssrLoadModule("/src/lib/ai/evaluation-catalog.ts");
  manifests = await h.vite.ssrLoadModule("/src/lib/ai/evaluation-case-sets.ts");
  getIdentity = (await h.vite.ssrLoadModule("/src/routes/api/public/evaluation-identity.ts")).Route
    .options.server.handlers.GET;
});
after(async () => {
  delete globalThis.__evaluationIdentitySession;
  await h?.close();
});

test("browser inventory preserves every server case, historical hash, version and description", () => {
  for (const id of [
    "synthetic-daily-7",
    "draft-fallback-1",
    "draft-fallback-2",
    "draft-pilot-1",
    "draft-pilot-2",
    "daily-editorial-1",
    "daily-context-1",
  ]) {
    const actual = catalog.getEvaluationCaseInventory(id);
    const expected = manifests.getEvaluationCaseSet(id);
    assert.equal(actual.fixtureVersion, expected.fixtureVersion);
    assert.equal(actual.caseSetHash, expected.caseSetHash);
    assert.deepEqual(
      actual.cases,
      expected.cases.map(({ id }) => ({ id })),
    );
  }
  assert.deepEqual(
    catalog.EVALUATION_CASE_CATALOG,
    manifests.getEvaluationCaseSet().cases.map(({ id, description }) => ({ id, description })),
  );
  const changed = catalog.getEvaluationCaseInventory("draft-pilot-2");
  changed.cases[0].id = "changed";
  assert.notEqual(catalog.getEvaluationCaseInventory("draft-pilot-2").cases[0].id, "changed");
  assert.throws(() => catalog.getEvaluationCaseInventory("unknown"), /Unknown/);
});

test("shared report helpers bundle no synthetic inputs, scans, server code or project binding", async () => {
  const output = await build({
    configFile: false,
    envFile: false,
    logLevel: "silent",
    build: {
      write: false,
      lib: { entry: resolve("src/lib/ai/reading-evaluation.shared.ts"), formats: ["es"] },
      rollupOptions: { external: ["zod"] },
    },
  });
  const chunks = [output]
    .flat()
    .flatMap((result) => result.output)
    .filter((item) => item.type === "chunk");
  assert.ok(chunks.length > 0);
  for (const chunk of chunks) {
    assert.ok(
      Object.keys(chunk.modules).every((id) => !/fixtures|canonical-scans|\.server\./.test(id)),
    );
    assert.doesNotMatch(chunk.code, /river-bruin-511100-g8|natalLongitudes|anchorSamples/);
  }
});

test("build attribution denies visitors and members, while administrators retain access", async () => {
  for (const [session, status] of [
    [null, 401],
    [{ userId: "member", isAdmin: false }, 403],
  ]) {
    globalThis.__evaluationIdentitySession = session;
    const response = await getIdentity();
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(await response.text(), /sourceSha|fixtureVersion|requestPolicyVersion/);
  }
  globalThis.__evaluationIdentitySession = { userId: "admin", isAdmin: true };
  const response = await getIdentity();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).fixtureVersion, catalog.READING_EVAL_FIXTURE_VERSION);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});
