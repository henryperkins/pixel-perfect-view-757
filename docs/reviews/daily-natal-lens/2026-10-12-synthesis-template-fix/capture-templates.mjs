/**
 * Capture only deterministic templates from the closed production evaluator.
 * A separate child receives no credential environment and permits no fetch.
 * No environment files or handwritten model responses are read or replayed.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HELPER_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = resolve(dirname(HELPER_PATH), "../../../..");
const EXPECTED_REVISION = "9316cbf77e7ea51c47a48f3678bab6901f917093";
const SOURCE_PATHS = [
  "src", "scripts", "package.json", "bun.lock", "pnpm-lock.yaml",
  "package-lock.json", "tsconfig.json",
];
const SENSITIVE_ENVIRONMENT_NAME = /key|token|secret|password|credential/i;
// The fix prepends published parent sentences to paragraph 2 of lens-plus-synthesis
// templates only. Every other body, fact, headline, prompt and context must be unchanged.
const EXPECTED_CHANGES = ["natal-candidate", "transit-candidate"].flatMap((bundleSource) =>
  ["natal-synthesis-integration", "arc-synthesis-natal-integration"].map((caseId) => `${bundleSource}/${caseId}`));
const SATURN_SUN = "Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.";
const JUPITER_MARS = "Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const writeNew = (path, value) => writeFile(path, json(value), { flag: "wx", mode: 0o600 });

function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
}

async function sourceSnapshot(root) {
  const sourceRevision = git(root, "rev-parse", "HEAD").trim();
  assert.equal(sourceRevision, EXPECTED_REVISION, "unexpected generating revision");
  git(root, "diff", "--quiet", "HEAD", "--", ...SOURCE_PATHS);
  const paths = git(root, "ls-files", "-z", "--", ...SOURCE_PATHS)
    .split("\0").filter(Boolean).sort();
  assert.ok(paths.length, "empty tracked source inventory");
  const trackedSourceFiles = [];
  for (const path of paths)
    trackedSourceFiles.push({ path, sha256: digest(await readFile(join(root, path))) });
  return {
    sourceRevision,
    trackedSourceFiles,
    trackedSourceSha256: digest(json(trackedSourceFiles)),
    helperSha256: digest(await readFile(HELPER_PATH)),
  };
}

async function worker(root, outputDir) {
  assert.ok(
    Object.keys(process.env).every((name) => !SENSITIVE_ENVIRONMENT_NAME.test(name)),
    "credential-like environment variables must be absent",
  );
  assert.equal(process.env.NODE_OPTIONS, undefined, "inherited Node options must be absent");
  const initial = await sourceSnapshot(root);
  const originalFetch = globalThis.fetch;
  let blockedFetchCalls = 0;
  globalThis.fetch = async () => {
    blockedFetchCalls += 1;
    throw new Error("offline template capture blocks every fetch");
  };
  let vite;
  try {
    const projectRequire = createRequire(join(root, "package.json"));
    const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
    vite = await createServer({
      root, configFile: false, envFile: false, appType: "custom", logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const load = (path) => vite.ssrLoadModule(path);
    const { READING_EVAL_CASES: cases, READING_EVAL_FIXTURE_VERSION } = await load(
      "/src/lib/ai/reading-evaluation.fixtures.mjs",
    );
    const { runSyntheticEvaluationCase } = await load("/src/lib/ai/reading-evaluation.server.ts");
    const { DEFAULT_BUNDLE } = await load("/src/lib/content/default-bundle.ts");
    const { NATAL_CANDIDATE_BUNDLE } = await load("/src/lib/content/natal-candidate-bundle.ts");
    const { TRANSIT_CANDIDATE_BUNDLE } = await load("/src/lib/content/transit-candidate-bundle.ts");
    assert.equal(READING_EVAL_FIXTURE_VERSION, "synthetic-daily-6");
    assert.equal(cases.length, 38);
    const bundles = {
      builtin: DEFAULT_BUNDLE,
      "natal-candidate": NATAL_CANDIDATE_BUNDLE,
      "transit-candidate": TRANSIT_CANDIDATE_BUNDLE,
    };
    const snapshots = [];
    for (const [bundleSource, bundle] of Object.entries(bundles)) {
      const captured = [];
      let metadata;
      for (const fixed of cases) {
        const result = await runSyntheticEvaluationCase(fixed.id, bundle, "gemini-enterprise");
        const row = result.case;
        assert.equal(row.candidate, null, "model candidate must never be captured");
        assert.equal(row.diagnostics.attempted, false, "model transport must never be attempted");
        assert.ok(["not_configured", "no_cycle"].includes(row.diagnostics.code));
        assert.equal(row.output.mode, "template");
        assert.equal(row.output.body, row.template.body);
        assert.equal(blockedFetchCalls, 0, "unexpected fetch attempted by evaluator");
        metadata = result.metadata;
        captured.push({
          id: row.id, configHash: row.configHash, tone: row.config.tone, depth: row.config.depth,
          lensRuleKey: row.natalLensPlan.lens?.ruleKey ?? null,
          storyStatus: row.transitStoryPlan.status,
          facts: row.facts, headline: row.output.headline, prompt: row.output.prompt,
          templateBody: row.template.body,
        });
      }
      const policy = Object.fromEntries([
        "bundleVersion", "bundleHash", "transitCopyHash", "fixtureVersion", "caseSetHash",
        "promptVersion", "validatorVersion", "planVersion", "natalPlanVersion",
        "reliabilityVersion", "storyPlanVersion", "anchorVersion", "solverVersion",
        "sourceContract", "transitFixtureHash", "storyUse", "gatewayTimeoutMs",
      ].filter((key) => Object.hasOwn(metadata, key)).map((key) => [key, metadata[key]]));
      snapshots.push({ bundleSource, ...policy, cases: captured });
    }
    const contexts = cases.map((fixed) => ({
      id: fixed.id,
      config: structuredClone(fixed.config),
      suppression: {
        angles: fixed.chart.uncertainty.angleClaimsSuppressed,
        houses: !fixed.chart.uncertainty.housesReliable,
      },
    }));
    const priorPath = "docs/reviews/daily-natal-lens/2026-10-12-qualification-round-3/templates.json";
    const priorBytes = await readFile(join(root, priorPath));
    const prior = JSON.parse(priorBytes);
    const changed = [];
    let compared = 0, preservedNatalPositiveBodies = 0;
    for (const snapshot of snapshots) {
      const previous = prior.snapshots.find((row) => row.bundleSource === snapshot.bundleSource);
      assert.ok(previous, snapshot.bundleSource);
      assert.equal(previous.cases.length, snapshot.cases.length);
      for (const row of snapshot.cases) {
        const before = previous.cases.find((item) => item.id === row.id);
        assert.ok(before, row.id);
        for (const key of ["configHash", "tone", "depth", "lensRuleKey", "storyStatus", "facts", "headline", "prompt"])
          assert.deepEqual(row[key], before[key], `${snapshot.bundleSource}/${row.id}/${key}`);
        if (row.templateBody !== before.templateBody) {
          assert.ok(EXPECTED_CHANGES.includes(`${snapshot.bundleSource}/${row.id}`), `unexpected change: ${snapshot.bundleSource}/${row.id}`);
          const [opening, support, ...rest] = row.templateBody.split("\n\n");
          const [oldOpening, oldSupport, ...oldRest] = before.templateBody.split("\n\n");
          assert.equal(opening, oldOpening, `${row.id} paragraph 1 changed`);
          assert.deepEqual(rest, oldRest, `${row.id} later paragraphs changed`);
          const prefix = row.storyStatus === "selected" ? JUPITER_MARS : `${SATURN_SUN} ${JUPITER_MARS}`;
          assert.equal(support, `${prefix} ${oldSupport}`, `${row.id} paragraph 2 is not the old paragraph after its parents`);
          changed.push({ bundleSource: snapshot.bundleSource, caseId: row.id, storyStatus: row.storyStatus });
        }
        if (snapshot.bundleSource === "natal-candidate" && row.lensRuleKey && row.templateBody === before.templateBody)
          preservedNatalPositiveBodies += 1;
        compared += 1;
      }
    }
    assert.equal(compared, 114);
    assert.equal(preservedNatalPositiveBodies, 7);
    assert.deepEqual(changed.map((row) => `${row.bundleSource}/${row.caseId}`).sort(), [...EXPECTED_CHANGES].sort());
    const previousContexts = JSON.parse(await readFile(join(root,
      "docs/reviews/daily-natal-lens/2026-10-12-qualification-round-3/case-contexts.json"), "utf8"));
    assert.deepEqual(contexts, previousContexts, "fixed suppression contexts changed");
    const final = await sourceSnapshot(root);
    assert.deepEqual(final, initial, "source or capture helper changed during capture");
    const sourceIdentity = {
      sourceRevision: initial.sourceRevision,
      trackedSourceSha256: initial.trackedSourceSha256,
      trackedSourceFiles: initial.trackedSourceFiles.length,
      helperSha256: initial.helperSha256,
      manifestPath: "template-source-manifest.json",
    };
    const artifact = {
      artifactVersion: "natal-template-preview-3",
      kind: "offline-deterministic-template-preview",
      network: "all fetch blocked; child credential environment removed; no env files read",
      qualification: "unqualified deterministic templates only; no model captures, handwritten model prose, or quality grades",
      sourceIdentity,
      executionContext: {
        moduleLoader: "Vite ssrLoadModule", entrypoint: "src/lib/ai/reading-evaluation.server.ts#runSyntheticEvaluationCase",
        viteConfigFile: false, viteEnvFile: false, credentialEnvironmentRemoved: true,
        inheritedNodeOptionsRemoved: true, nodeVersion: process.version,
        modelRequestsAttempted: 0, blockedFetchCalls, handwrittenModelResponsesReplayed: 0,
        memberGatewayExercised: false, hostedWorkflowExecuted: false,
        databaseOrReadingCacheAccessed: false, contentActivated: false,
      },
      sourceHashes: Object.fromEntries(initial.trackedSourceFiles.map(({ path, sha256 }) => [path, sha256])),
      snapshots,
    };
    await mkdir(outputDir, { recursive: false, mode: 0o700 });
    await writeNew(join(outputDir, "template-source-manifest.json"), initial);
    await writeNew(join(outputDir, "templates.json"), artifact);
    await writeNew(join(outputDir, "case-contexts.json"), contexts);
    const receipt = {
      artifactVersion: "natal-template-capture-receipt-2", capturedAt: new Date().toISOString(), sourceIdentity,
      compared, preservedNatalPositiveBodies, changed,
      previousTemplates: { path: priorPath, sha256: digest(priorBytes) },
      files: await Promise.all(["template-source-manifest.json", "templates.json", "case-contexts.json"].map(async (path) => ({
        path, sha256: digest(await readFile(join(outputDir, path))),
      }))),
      fixedContextsPreserved: contexts.length,
      modelRequestsAttempted: 0, blockedFetchCalls, handwrittenModelResponsesReplayed: 0,
      sourceUnchangedThroughoutCapture: true,
    };
    await writeNew(join(outputDir, "template-capture-receipt.json"), receipt);
    console.log(json({ outputDir, sourceIdentity, compared, preservedNatalPositiveBodies, changed, modelRequestsAttempted: 0, blockedFetchCalls }));
  } finally {
    globalThis.fetch = originalFetch;
    await vite?.close();
  }
}

const args = process.argv.slice(2);
if (args[0] === "--worker") {
  assert.equal(args.length, 3, "worker requires source root and a new output directory");
  await worker(resolve(args[1]), resolve(args[2]));
} else {
  let root = DEFAULT_ROOT, outputDir;
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    assert.ok(["--source-root", "--output-dir"].includes(option) && args[index + 1] && !args[index + 1].startsWith("--"), "Usage: node capture-templates.mjs [--source-root ROOT] --output-dir NEW_DIRECTORY");
    if (option === "--source-root") root = resolve(args[++index]);
    else {
      assert.equal(outputDir, undefined, "duplicate output directory");
      outputDir = resolve(args[++index]);
    }
  }
  assert.ok(outputDir, "a new output directory is required; overwrites are forbidden");
  const childEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !SENSITIVE_ENVIRONMENT_NAME.test(name) && name !== "NODE_OPTIONS"));
  const result = spawnSync(process.execPath, [HELPER_PATH, "--worker", root, outputDir], {
    cwd: root, env: childEnv, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
