import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const output = new URL("baseline.json", import.meta.url);
const sourcePath = "docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json";
const bundleHash = "300173610977707a1852f4e5898d8e27a2e0d4b932ab3fc4db398eda7efbdad8";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
async function sourceCommit() {
  let gitDir = resolve(root, ".git");
  try {
    const pointer = await readFile(gitDir, "utf8");
    assert.ok(pointer.startsWith("gitdir: "));
    gitDir = resolve(root, pointer.slice(8).trim());
  } catch (error) {
    if (error.code !== "EISDIR") throw error;
  }
  const head = (await readFile(resolve(gitDir, "HEAD"), "utf8")).trim();
  if (/^[a-f0-9]{40}$/.test(head)) return head;
  assert.ok(head.startsWith("ref: refs/"));
  const ref = head.slice(5);
  let commonDir = gitDir;
  try {
    commonDir = resolve(gitDir, (await readFile(resolve(gitDir, "commondir"), "utf8")).trim());
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let commit;
  try {
    commit = (await readFile(resolve(commonDir, ref), "utf8")).trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const packed = await readFile(resolve(commonDir, "packed-refs"), "utf8");
    commit = packed.split("\n").find((line) => line.endsWith(` ${ref}`))?.split(" ")[0];
  }
  assert.match(commit ?? "", /^[a-f0-9]{40}$/);
  return commit;
}
const rows = [
  ["writing-reply-scene", "Communication", ["conjunction:mercury:mercury"]],
  ["venus-opposition-venus", "Relationships", ["opposition:venus:venus"]],
  [
    "synthesis-tension",
    "Ambition",
    [
      "square:saturn:sun",
      "trine:jupiter:mars",
      "square:saturn:sun_tension_trine:jupiter:mars",
    ],
  ],
  ["jupiter-trine-sun-technical", "Self-worth", ["soft:jupiter:sun"]],
  ["fallback-hard-neptune-mercury", "Uncertainty", ["hard:*:*"]],
  ["quiet-threshold", "A quiet day", []],
];
assert.equal(new Set(rows.map(([id]) => id)).size, 6);
assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--verify"));

let networkAttempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkAttempts++;
  throw new Error("Network access is forbidden for this offline editorial capture.");
};

let vite;
try {
  const saved = JSON.parse(await readFile(new URL(sourcePath, `file://${root}`), "utf8"));
  const bundle = saved.bundles.baseline;
  assert.equal(bundle.version, "0.7.1");
  assert.equal(bundle.schemaVersion, 4);
  assert.equal(jsonHash(bundle), bundleHash);

  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const { getEvaluationCaseSet } = await vite.ssrLoadModule("/src/lib/ai/evaluation-case-sets.ts");
  const { daysToLocalDate } = await vite.ssrLoadModule("/src/lib/local-day.ts");
  const { assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts");
  const { readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts");
  const catalogue = getEvaluationCaseSet("draft-fallback-2");
  assert.equal(jsonHash(catalogue.cases), catalogue.caseSetHash);
  const effectiveContext = {
    granted: ["USR-01", "USR-02"],
    tone: "warm",
    depth: "standard",
    localBucket: null,
    checkIn: null,
    wellness: null,
  };
  const cases = rows.map(([id, topic, expectedKeys]) => {
    const fixed = catalogue.cases.find((entry) => entry.id === id);
    assert.ok(fixed, `Missing fixed case ${id}`);
    assert.ok(!fixed.natalWindowSamples && !fixed.transitScan, "Unexpected additional source input");
    const originalFixture = structuredClone(fixed);
    const originalFixtureHash = jsonHash(originalFixture);
    const cycles = fixed.cycles.map((cycle) => ({
      ...cycle,
      days_to_exact: daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone),
    }));
    const context = { ...effectiveContext, granted: new Set(effectiveContext.granted) };
    const assembled = assembleReading(fixed.chart, cycles, context, bundle, null, null);
    const selectedSourceKeys = assembled.interpretationPlan.interpretations.map(
      (entry) => entry.interpretationKey,
    );
    if (assembled.interpretationPlan.synthesis)
      selectedSourceKeys.push(assembled.interpretationPlan.synthesis.ruleKey);
    assert.deepEqual(selectedSourceKeys, expectedKeys, id);
    assert.ok(assembled.headline && assembled.body && assembled.prompt, id);
    assert.equal(jsonHash(fixed), originalFixtureHash, "Fixture was mutated");
    if (id === "quiet-threshold") {
      assert.equal(assembled.primary_cycle_key, null);
      assert.equal(assembled.eligibleCycles.length, 0);
    }
    const effectiveInput = {
      chart: fixed.chart,
      cycles,
      day: fixed.config.day,
      timeZone: fixed.config.timeZone,
      context: effectiveContext,
      bundleHash,
      natalReliability: null,
      transitCalculation: null,
    };
    return {
      id,
      topic,
      originalFixture,
      originalFixtureHash,
      presentationOverride: { tone: "warm", depth: "standard" },
      effectiveContext,
      effectiveInput,
      effectiveInputHash: jsonHash(effectiveInput),
      selectedSourceKeys,
      selectedPrimaryCycle: assembled.primary_cycle_key,
      interpretationPlan: assembled.interpretationPlan,
      facts: readingFacts(fixed.chart, assembled, fixed.config.timeZone),
      reading: {
        headline: assembled.headline,
        body: assembled.body,
        paragraphs: assembled.body.split("\n\n"),
        prompt: assembled.prompt,
      },
      outputKind: "recomputed_template_saved_content",
    };
  });
  assert.equal(networkAttempts, 0);
  const files = [
    "docs/reviews/daily-reading-editorial/2026-10-15/capture-baseline.mjs",
    "src/lib/ai/reading-evaluation.fixtures.mjs",
    "src/lib/ai/reading-evaluation.draft.fixtures.mjs",
    "src/lib/ai/reading-evaluation.transit.fixtures.mjs",
    "src/lib/ai/reading-evaluation.canonical-scans.mjs",
    "src/lib/ai/evaluation-case-sets.ts",
    "src/lib/reading.server.ts",
    "src/lib/ai/facts.ts",
    "src/lib/local-day.ts",
    "src/lib/registry.ts",
    ...(await readdir(`${root}src/lib/content`))
      .filter((name) => name.endsWith(".ts"))
      .map((name) => `src/lib/content/${name}`),
  ].sort();
  const sourceFileHashes = Object.fromEntries(
    await Promise.all(files.map(async (path) => [path, hash(await readFile(`${root}${path}`))])),
  );
  const capture = {
    version: "editorial-sample-baseline-1",
    capturedAt: new Date().toISOString(),
    sourceCommit: await sourceCommit(),
    sourceFileHashes,
    bundle: { sourcePath, selector: "bundles.baseline", sha256: bundleHash, value: bundle },
    caseSetId: catalogue.id,
    caseSetHash: catalogue.caseSetHash,
    provider: "none",
    networkAttempts,
    evidenceLimit: "Historical synthetic scenarios; saved content; no live member or model output.",
    cases,
  };
  if (process.argv[2] === "--verify") {
    const previous = JSON.parse(await readFile(output, "utf8"));
    const stable = ({ capturedAt, ...rest }) => rest;
    assert.deepEqual(stable(capture), stable(previous));
    console.log("BASELINE_VERIFIED: six exact readings, source identity unchanged, zero network attempts.");
  } else {
    await writeFile(output, `${JSON.stringify(capture, null, 2)}\n`, { flag: "wx" });
    console.log("BASELINE_CAPTURED: six exact readings, zero network attempts.");
  }
  for (const entry of cases)
    console.log(`${entry.id}: ${entry.selectedSourceKeys.join(", ") || "no selected contact"}`);
} finally {
  await vite?.close();
  globalThis.fetch = originalFetch;
}
