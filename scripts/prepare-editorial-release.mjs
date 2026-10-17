import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = "docs/reviews/daily-reading-release/2026-10-17";
const candidatePath = "docs/reviews/daily-reading-pilot/2026-10-15/candidate.json";
const receiptPath =
  "docs/reviews/daily-reading-pilot/2026-10-15/repair/production-e2e/receipt.json";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
assert.ok(
  process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--verify"),
  "Usage: node scripts/prepare-editorial-release.mjs [--verify]",
);

let networkAttempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkAttempts++;
  throw Error("Offline release packaging forbids all network requests.");
};
let vite;
try {
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const { EDITORIAL_CANDIDATE_BUNDLE: candidate } = await vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  );
  const { validateContentGraph } = await vite.ssrLoadModule("/src/lib/content/schema.ts");
  const { canonicalContentJson, contentChecksum, compareContentBundles } = await vite.ssrLoadModule(
    "/src/lib/content/draft-comparison.ts",
  );
  const { resolveInterpretationPlan } = await vite.ssrLoadModule("/src/lib/content/synthesis.ts");
  const { resolveDailyEditorial } = await vite.ssrLoadModule("/src/lib/content/daily-editorial.ts");
  const data = await readJson("src/lib/content/editorial-candidate-data.json");
  const baseline = data.baseline.value;
  const historicalCandidate = await readJson(candidatePath);
  const historicalReceipt = await readJson(receiptPath);
  assert.deepEqual(
    candidate,
    historicalCandidate,
    "Candidate must match the frozen pilot exactly.",
  );
  assert.equal(candidate.version, "0.9.0-editorial-pilot.1");
  assert.equal(
    jsonHash(candidate),
    "ac78d4b47d8b0930f2b2d6d560948869284bbc032834a1c195d061a7a1f29cb4",
  );
  assert.equal(jsonHash(baseline), data.baseline.sha256);
  assert.equal(baseline.version, "0.7.1");
  const bundle = structuredClone(candidate);
  bundle.version = "0.9.0";
  validateContentGraph(bundle);
  assert.deepEqual({ ...bundle, version: candidate.version }, candidate);
  // A content-only promotion changes the parent identity. Nested catalogues use
  // schema identities, not a copied parent release identifier.
  const childVersionReferences = [];
  const visit = (value, path = "$") => {
    if (typeof value === "string" && value.includes(candidate.version))
      childVersionReferences.push(path);
    else if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}[${index}]`));
    else if (value && typeof value === "object")
      for (const [key, item] of Object.entries(value)) visit(item, `${path}.${key}`);
  };
  visit(bundle);
  assert.deepEqual(childVersionReferences, []);
  const canonicalChecksum = await contentChecksum(bundle);
  assert.equal(canonicalChecksum, hash(canonicalContentJson(bundle)));
  const baselineChecksum = await contentChecksum(baseline);
  const rollback = historicalReceipt.activeRelease.find(
    (entry) => entry.version === baseline.version,
  );
  assert.ok(rollback, "Historical verified rollback target must exist.");
  const comparison = compareContentBundles(baseline, bundle);
  assert.equal(comparison.counts.removed, 0);
  assert.deepEqual(bundle.cycles.slice(0, baseline.cycles.length), baseline.cycles);
  assert.deepEqual(
    bundle.cycles.slice(baseline.cycles.length).map((entry) => entry.key),
    ["square:neptune:mercury"],
  );
  const preservedSections = Object.keys(baseline).filter(
    (key) => !["version", "schemaVersion", "cycles"].includes(key),
  );
  for (const key of preservedSections) assert.deepEqual(bundle[key], baseline[key], key);
  const sourceBindings = bundle.dailyEditorial.frames.map((entry) => {
    const cycles = entry.cycleKeys.map((cycleKey) => {
      const [transit_body, aspect, natal_point] = cycleKey.split("_");
      return { cycle_key: cycleKey, transit_body, aspect, natal_point };
    });
    const plan = resolveInterpretationPlan(bundle, cycles);
    const selected = resolveDailyEditorial(bundle, plan, {
      day: "2026-10-17",
      tone: "warm",
      depth: "standard",
    });
    assert.equal(selected.entry.key, entry.key);
    assert.equal(selected.releaseVersion, bundle.version);
    assert.equal(plan.releaseVersion, bundle.version);
    if (plan.synthesis) assert.equal(plan.synthesis.releaseVersion, bundle.version);
    assert.equal(
      resolveDailyEditorial(bundle, plan, {
        day: "2026-10-17",
        tone: "plain",
        depth: "standard",
      }),
      null,
    );
    return {
      editorialKey: entry.key,
      source: entry.source,
      cycleKeys: entry.cycleKeys,
      requiredFacts: selected.requiredFacts,
      interpretationKeys: plan.interpretations.map((item) => item.interpretationKey),
      releaseVersion: selected.releaseVersion,
      headline: entry.headline,
    };
  });
  const quietPlan = resolveInterpretationPlan(bundle, []);
  const quietBindings = bundle.dailyEditorial.quiet.map((entry, index) => {
    const day = `2026-10-${11 + index}`;
    const selected = resolveDailyEditorial(bundle, quietPlan, {
      day,
      tone: "warm",
      depth: "standard",
    });
    assert.equal(selected.entry.key, entry.key);
    assert.deepEqual(selected.requiredFacts, []);
    assert.equal(selected.releaseVersion, bundle.version);
    return { editorialKey: entry.key, day, releaseVersion: selected.releaseVersion, source: null };
  });
  assert.equal(sourceBindings.length, 5);
  assert.equal(quietBindings.length, 4);
  const authored = [...bundle.dailyEditorial.frames, ...bundle.dailyEditorial.quiet];
  const files = {
    "bundle.json": encode(bundle),
    "source-bindings.json": encode({ contacts: sourceBindings, quietRotation: quietBindings }),
    "rollback-reference.json": encode({
      ...rollback,
      storedChecksumAlgorithm: "not recorded in historical receipt; verify live",
      canonicalBundleChecksum: baselineChecksum,
      canonicalBundleChecksumAlgorithm: "sha256-canonical-json-v1",
      serializedBundleHash: jsonHash(baseline),
      frozenBundleSource: data.baseline.sourcePath,
      frozenBundleSelector: data.baseline.selector,
      lastProductionVerification: historicalReceipt.checkedAt,
      productionEvidence: receiptPath,
      instruction:
        "Confirm this exact release ID/version/stored checksum is still present and its bundle canonically matches the saved baseline before activation. Use the normal rollback lifecycle to reactivate 0.7.1; retain both immutable releases and existing readings.",
      verificationScope:
        "Historical production receipt plus current offline baseline identity. The historical stored checksum differs from the canonical checksum; its algorithm and full live bundle require separate verification. This script performs no live reads.",
    }),
    "authored-readings.md": [
      "# Limited daily release: authored reading copy",
      "",
      "Exact authored content from release 0.9.0. Contact paragraphs are deterministic fallbacks; generated contact writing still needs review through the member flow. Quiet readings use the authored repertoire. No prose has been changed from the frozen candidate.",
      "",
      ...authored.flatMap((entry, index) => [
        `## ${index + 1}. ${entry.headline}`,
        "",
        `Entry: \`${entry.key}\`. Source: ${entry.source ? `\`${entry.source.key}\`` : "source-free observation"}.`,
        "",
        ...entry.fallbackParagraphs.flatMap((paragraph) => [paragraph, ""]),
        `Reflection: ${entry.reflection}`,
        "",
      ]),
    ].join("\n"),
  };
  const sourcePaths = [
    "scripts/prepare-editorial-release.mjs",
    "src/lib/content/editorial-candidate-bundle.ts",
    "src/lib/content/editorial-candidate-data.json",
    "src/lib/content/schema.ts",
    "src/lib/content/draft-comparison.ts",
    "src/lib/content/daily-editorial.ts",
    "src/lib/content/synthesis.ts",
    candidatePath,
    receiptPath,
  ];
  const manifest = {
    version: "daily-editorial-limited-release-preparation-1",
    releaseVersion: bundle.version,
    checksum: canonicalChecksum,
    checksumAlgorithm: "sha256-canonical-json-v1",
    serializedBundleHash: jsonHash(bundle),
    compactBytes: Buffer.byteLength(JSON.stringify(bundle)),
    formattedBytes: Buffer.byteLength(files["bundle.json"]),
    schemaVersion: bundle.schemaVersion,
    candidate: {
      version: candidate.version,
      serializedBundleHash: jsonHash(candidate),
      changedPaths: ["version"],
    },
    baseline: {
      version: baseline.version,
      canonicalChecksum: baselineChecksum,
      historicalStoredChecksum: rollback.checksum,
      serializedBundleHash: jsonHash(baseline),
    },
    scope: {
      tone: "warm",
      depth: "standard",
      contactFrames: 5,
      quietEntries: 4,
      natalAndTransitContext:
        "existing writer; runtime compatibility guard is a separate prerequisite",
    },
    counts: {
      interpretations: bundle.cycles.length,
      synthesisRules: bundle.synthesisRules.length,
      natalLenses: bundle.natalLenses.length,
      transitChapters: bundle.transitChapters.length,
      dailyWritingFrames: bundle.dailyWritingFrames.length,
    },
    preservedSections,
    addedInterpretationKeys: ["square:neptune:mercury"],
    childVersionReferences,
    comparison: {
      counts: comparison.counts,
      changedEntries: comparison.entries.filter((entry) => entry.change !== "unchanged"),
    },
    sourceFileHashes: Object.fromEntries(
      await Promise.all(
        sourcePaths.map(async (path) => [path, hash(await readFile(resolve(root, path)))]),
      ),
    ),
    artifacts: Object.fromEntries(
      Object.entries(files).map(([name, contents]) => [name, hash(contents)]),
    ),
    evidence: {
      mode: "offline_packaging",
      networkAttempts,
      providerRequests: 0,
      published: false,
      activated: false,
      memberFlowVerified: false,
    },
  };
  assert.equal(networkAttempts, 0);
  files["manifest.json"] = encode(manifest);
  files["preparation.md"] = [
    "# Limited daily release preparation",
    "",
    `Numeric release \`0.9.0\` promotes the exact candidate \`${candidate.version}\`; only the top-level version changes. Canonical publication checksum: \`${canonicalChecksum}\`.`,
    "",
    "- [Bundle](bundle.json), [manifest](manifest.json), and [source bindings](source-bindings.json) freeze content and eligibility.",
    "- [Authored reading copy](authored-readings.md) contains five contact fallbacks and four quiet readings for prose review.",
    "- [Rollback reference](rollback-reference.json) records the saved 0.7.1 bundle and last verified production release ID/checksum separately. Its historical stored checksum differs from the current canonical hash; verify the live bundle and checksum algorithm before publication.",
    "",
    "Existing interpretations, synthesis, natal, transit, phase and domain copy are preserved. One exact Neptune-square-Mercury interpretation and the editorial catalogue are added. Graph validation and warm/standard selection pass; plain remains outside this release's editorial scope. Parent release references are derived as 0.9.0 at selection time; no embedded candidate-version child references remain.",
    "",
    "Run `node scripts/prepare-editorial-release.mjs --verify` to compare these exact artifacts with their sources. Omitting `--verify` rewrites only this preparation's artifact files. Vite config and environment-file loading are disabled, and every fetch throws.",
    "",
    "This record proves offline packaging and bindings. Runtime compatibility, generated prose, actual member save/reload, publication, activation and production member use are recorded separately. Historical pilot artifacts are unchanged.",
    "",
  ].join("\n");
  await mkdir(resolve(root, destination), { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    const path = resolve(root, destination, name);
    if (process.argv[2] === "--verify") assert.equal(await readFile(path, "utf8"), contents, name);
    else await writeFile(path, contents);
  }
  console.log(
    JSON.stringify({
      result: process.argv[2] === "--verify" ? "verified" : "prepared",
      releaseVersion: bundle.version,
      checksum: canonicalChecksum,
      bytes: manifest.compactBytes,
      counts: manifest.counts,
      networkAttempts,
    }),
  );
} finally {
  await vite?.close();
  globalThis.fetch = originalFetch;
}
