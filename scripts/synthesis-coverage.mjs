import { mkdir, open, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "vite";
const args = process.argv.slice(2),
  options = {};
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (!["--output", "--matrix", "--bundle"].includes(flag) || !args[i + 1])
    throw Error("Use --output NEW.json [--matrix NEW.json] [--bundle baseline|candidate]");
  options[flag.slice(2)] = args[++i];
}
if (!options.output) throw Error("--output is required");
if (options.bundle && !["baseline", "candidate"].includes(options.bundle))
  throw Error("Unknown coverage bundle");
const vite = await createServer({
  configFile: false,
  envFile: false,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { TRANSIT_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  const { SYNTHESIS_CANDIDATE_BUNDLE } = await vite.ssrLoadModule(
    "/src/lib/content/synthesis-candidate-bundle.ts",
  );
  const bundle =
    options.bundle === "candidate" ? SYNTHESIS_CANDIDATE_BUNDLE : TRANSIT_CANDIDATE_BUNDLE;
  const { READING_EVAL_CASES, READING_EVAL_FIXTURE_VERSION } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.fixtures.mjs",
  );
  const { assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts");
  const { synthesisAcceptanceCoverage, synthesisCatalogueMatrix } = await vite.ssrLoadModule(
    "/src/lib/content/synthesis-coverage.ts",
  );
  const { canonicalContentJson } = await vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
  const coverage = synthesisAcceptanceCoverage(bundle, READING_EVAL_CASES, assembleReading);
  const report = {
    fixtureVersion: READING_EVAL_FIXTURE_VERSION,
    fixtureHash: createHash("sha256")
      .update(canonicalContentJson(JSON.parse(JSON.stringify(READING_EVAL_CASES))))
      .digest("hex"),
    ...coverage,
    scope:
      "Structural catalogue/selection coverage only; no member data, model call or physical ephemeris qualification.",
    humanReviewCompleted: false,
  };
  const artifacts = [
    { path: resolve(options.output), body: JSON.stringify(report, null, 2) + "\n" },
  ];
  if (options.matrix) {
    const { proposeSynthesisDecisions, synthesisSourceFocus } = await vite.ssrLoadModule(
      "/src/lib/content/synthesis-editorial.ts",
    );
    const matrix = {
      ...synthesisCatalogueMatrix(bundle),
      sources: bundle.cycles
        .filter((c) => !c.key.includes("*"))
        .map((c) => ({ ...c, focus: synthesisSourceFocus(c.key) })),
      rows: proposeSynthesisDecisions(bundle),
      reviewStatus: "unreviewed proposals; each directed pair requires source review",
      humanReviewCompleted: false,
    };
    const matrixPath = resolve(options.matrix);
    artifacts.push({ path: matrixPath, body: JSON.stringify(matrix, null, 2) + "\n" });
  }
  if (new Set(artifacts.map((item) => item.path)).size !== artifacts.length)
    throw Error("Coverage and matrix need distinct new output paths.");
  const created = [];
  try {
    for (const item of artifacts) {
      await mkdir(dirname(item.path), { recursive: true });
      const handle = await open(item.path, "wx");
      created.push({ ...item, handle });
    }
    for (const item of created) await item.handle.writeFile(item.body);
  } catch (error) {
    for (const item of created) {
      await item.handle.close();
      await unlink(item.path);
    }
    throw error;
  }
  for (const item of created) await item.handle.close();
  console.log(
    JSON.stringify({
      caseCount: report.caseCount,
      fixtureVersion: report.fixtureVersion,
      bundleVersion: report.bundleVersion,
      counts: report.counts,
      pairCount: report.pairs.length,
      unmatchedPairs: report.unmatchedPairs.length,
      wildcardSourceKeys: report.wildcardSourceKeys.length,
    }),
  );
} finally {
  await vite.close();
}
