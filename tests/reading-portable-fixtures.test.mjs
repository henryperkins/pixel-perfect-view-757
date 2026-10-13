import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { runOfflineWorker } from "./helpers/offline-workerd.mjs";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
let vite, getSet, createPlan, bundles;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ getEvaluationCaseSet: getSet } = await vite.ssrLoadModule(
    "/src/lib/ai/evaluation-case-sets.ts",
  ));
  ({ createEvaluationPlan: createPlan } = await vite.ssrLoadModule(
    "/src/lib/ai/qualification-plan.server.ts",
  ));
  ({ bundles } = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ));
});
after(async () => vite?.close());

test("new offline fixture identities preserve every historical case and use immutable canonical scans", () => {
  for (const [prior, next, count] of [
    ["draft-fallback-1", "draft-fallback-2", 70],
    ["draft-pilot-1", "draft-pilot-2", 4],
  ]) {
    const old = getSet(prior),
      portable = getSet(next);
    assert.equal(portable.fixtureVersion, next);
    assert.equal(portable.cases.length, count);
    assert.equal(hash(portable.cases), portable.caseSetHash);
    // The JSON identity stays exact, including JSON's specified -0 to 0 encoding.
    assert.equal(JSON.stringify(portable.cases), JSON.stringify(old.cases));
    portable.cases[0].description = "caller mutation";
    assert.notEqual(getSet(next).cases[0].description, "caller mutation");
    assert.equal(hash(getSet(prior).cases), old.caseSetHash);
  }
});

test(
  "Node and workerd produce identical complete plans for the new case sets and both bundles",
  { skip: !process.env.PATTERN_TEST_WORKERD },
  async () => {
    const expected = Object.fromEntries(
      ["draft-fallback-2", "draft-pilot-2"].map((id) => [
        id,
        Object.fromEntries(
          Object.entries(bundles).map(([arm, bundle]) => [
            arm,
            createPlan(bundle, undefined, "a".repeat(40), "gemini-enterprise", id),
          ]),
        ),
      ]),
    );
    const output = await runOfflineWorker(`
    import assert from "node:assert/strict";
    import { createEvaluationPlan } from "./src/lib/ai/qualification-plan.server.ts";
    const bundles = ${JSON.stringify(bundles)};
    const expected = ${JSON.stringify(expected)};
    export default { test() {
      for (const [id, arms] of Object.entries(expected)) for (const [arm, plan] of Object.entries(arms))
        assert.deepEqual(createEvaluationPlan(bundles[arm], undefined, "a".repeat(40), "gemini-enterprise", id), plan, id + "/" + arm);
      console.log("PORTABLE_PLANS_MATCH:148");
    } };
  `);
    assert.match(output, /PORTABLE_PLANS_MATCH:148/);
  },
);
