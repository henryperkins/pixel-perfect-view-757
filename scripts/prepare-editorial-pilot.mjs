import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = "docs/reviews/daily-reading-pilot/2026-10-15";
const benchmarkPath = "docs/reviews/daily-reading-editorial/2026-10-15";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
assert.ok(
  process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--verify"),
);

let networkAttempts = 0;
const oldFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkAttempts++;
  throw Error("Offline editorial preparation forbids all network requests.");
};
let vite;
try {
  const baseline = await readJson(`${benchmarkPath}/baseline.json`);
  const benchmarks = await readJson(`${benchmarkPath}/drafts.json`);
  const sourceData = await readJson("src/lib/content/editorial-candidate-data.json");
  assert.equal(jsonHash(baseline.bundle.value), baseline.bundle.sha256);
  assert.equal(sourceData.baseline.sha256, baseline.bundle.sha256);
  assert.deepEqual(sourceData.baseline.value, baseline.bundle.value);
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
  const { assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts");
  const { readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts");
  validateContentGraph(candidate);
  const cases = baseline.cases.map((saved, index) => {
    const input = structuredClone(saved.effectiveInput);
    input.bundleHash = jsonHash(candidate);
    input.context.day = input.day;
    const context = { ...input.context, day: input.day, granted: new Set(input.context.granted) };
    const assembled = assembleReading(input.chart, input.cycles, context, candidate, null, null);
    const facts = readingFacts(input.chart, assembled, input.timeZone);
    assert.ok(!facts.some((fact) => ["N1", "A1", "P2"].includes(fact.id)), saved.id);
    const sourceKeys = assembled.interpretationPlan.interpretations.map(
      (entry) => entry.interpretationKey,
    );
    if (assembled.interpretationPlan.synthesis)
      sourceKeys.push(assembled.interpretationPlan.synthesis.ruleKey);
    const expectedSources = index === 4 ? ["square:neptune:mercury"] : saved.selectedSourceKeys;
    assert.deepEqual(sourceKeys, expectedSources, saved.id);
    assert.ok(assembled.writingPlan.editorial, `Editorial entry was not selected for ${saved.id}`);
    const selected = assembled.writingPlan.editorial;
    const reading = {
      headline: assembled.headline,
      body: assembled.astroBody,
      prompt: assembled.prompt,
    };
    assert.equal(reading.headline, selected.entry.headline, saved.id);
    assert.equal(reading.prompt, selected.entry.reflection, saved.id);
    assert.equal(reading.body, selected.entry.fallbackParagraphs.join("\n\n"), saved.id);
    return {
      id: saved.id,
      inputHash: jsonHash(input),
      baselineEffectiveInputHash: saved.effectiveInputHash,
      originalFixtureHash: saved.originalFixtureHash,
      benchmarkRevision: benchmarks.cases[index].revision,
      sourceKeys,
      primaryCycleKey: assembled.primary_cycle_key,
      editorialKey: selected.entry.key,
      interpretationPlan: assembled.interpretationPlan,
      facts,
      reading,
      outputKind: "application_assembled_editorial_fallback",
      provider: "none",
      humanReviewed: false,
    };
  });
  const quietEntries = candidate.dailyEditorial.quiet.map((entry, index) => ({
    key: entry.key,
    status:
      index === 0
        ? "working_benchmark_not_human_approved"
        : "new_provisional_editorial_observation",
    headline: entry.headline,
    body: entry.fallbackParagraphs.join("\n\n"),
    prompt: entry.reflection,
    sourceKeys: [],
    imagery: entry.writingMaterial.imagery,
    humanReviewed: false,
  }));
  const preview = {
    version: "daily-editorial-offline-preview-1",
    candidateVersion: candidate.version,
    candidateHash: jsonHash(candidate),
    provider: "none",
    mode: "offline_application_assembly",
    evidenceLimit:
      "Authored source and fallback wiring only; no model generation, human approval, publication, activation, or member-use evidence.",
    cases,
    quietEntries,
  };
  const markdown = [
    "# Inactive editorial pilot — application fallback preview",
    "",
    "These six readings were assembled by the application from the inactive candidate and the same saved historical synthetic inputs. They are authored fallbacks, not fresh model output. The working benchmarks have not received human approval; three additional quiet entries are provisional.",
    "",
    ...cases.flatMap((entry, index) => [
      `## ${index + 1}. ${entry.id}`,
      "",
      `Source: ${entry.sourceKeys.map((key) => `\`${key}\``).join(", ") || "source-free editorial observation"}. Editorial entry: \`${entry.editorialKey}\`.`,
      "",
      `### ${entry.reading.headline}`,
      "",
      entry.reading.body,
      "",
      `Reflection: ${entry.reading.prompt}`,
      "",
    ]),
  ].join("\n");
  const quietMarkdown = [
    "# Quiet editorial repertoire — provisional review copy",
    "",
    "These are editorial observations for readings without a selected contact. They contain no interpretation key or chart explanation. The first is the working sample-pack benchmark; the other three are newly authored and need reader review. This is no evidence of repeated-day model variation.",
    "",
    ...quietEntries.flatMap((entry) => [
      `## ${entry.headline}`,
      "",
      `Entry: \`${entry.key}\`; status: \`${entry.status}\`.`,
      "",
      entry.body,
      "",
      `Reflection: ${entry.prompt}`,
      "",
    ]),
  ].join("\n");
  const sourcePaths = [
    "scripts/prepare-editorial-pilot.mjs",
    "src/lib/content/editorial-candidate-bundle.ts",
    "src/lib/content/editorial-candidate-data.json",
    "src/lib/content/daily-editorial.ts",
    "src/lib/content/daily-writing.ts",
    "src/lib/content/daily-writing-template.ts",
    "src/lib/content/daily-reflection.ts",
    "src/lib/content/default-bundle.ts",
    "src/lib/content/schema.ts",
    "src/lib/reading.server.ts",
    "src/lib/ai/facts.ts",
    `${benchmarkPath}/drafts.json`,
    `${benchmarkPath}/source-proposals.json`,
    `${benchmarkPath}/quiet-variation-plan.md`,
  ];
  const sourceFileHashes = Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (path) => [path, hash(await readFile(resolve(root, path)))]),
    ),
  );
  const files = {
    "candidate.json": encode(candidate),
    "preview.json": encode(preview),
    "preview.md": markdown,
    "quiet-preview.md": quietMarkdown,
  };
  const manifest = {
    version: "daily-editorial-pilot-preparation-1",
    candidateVersion: candidate.version,
    candidateHash: jsonHash(candidate),
    baseline: { ...sourceData.baseline, value: undefined },
    sourceFileHashes,
    artifacts: Object.fromEntries(
      Object.entries(files).map(([name, contents]) => [name, hash(contents)]),
    ),
    scope: {
      tone: "warm",
      depth: "standard",
      caseIds: cases.map((entry) => entry.id),
      natalReliability: null,
      transitCalculation: null,
    },
    changedExistingInterpretations: sourceData.sourceChanges.interpretations.map(
      (entry) => entry.key,
    ),
    changedExistingSynthesisRules: sourceData.sourceChanges.synthesisRules.map(
      (entry) => entry.key,
    ),
    addedInterpretations: sourceData.sourceChanges.additions.map((entry) => entry.key),
    preservedBaseline:
      "All existing interpretations, synthesis rules, natal lenses, transit copy, phases, domains and natal copy remain byte-identical as JSON values.",
    sourceMigration: { caseId: cases[4].id, before: "hard:*:*", after: "square:neptune:mercury" },
    quiet: {
      entryCount: quietEntries.length,
      newlyAuthoredProvisionalCount: 3,
      humanApproved: false,
    },
    provider: "none",
    networkAttempts,
    published: false,
    activated: false,
    generatedModelReadings: 0,
    editorialQualification: "pending real-model writing and human review",
  };
  assert.equal(networkAttempts, 0);
  files["manifest.json"] = encode(manifest);
  files["README.md"] = [
    "# Daily editorial pilot preparation",
    "",
    `Candidate \`${candidate.version}\` is an inactive schema-6 proposal based on saved content \`${baseline.bundle.value.version}\`. It adds one exact Neptune–Mercury source, five source-bound editorial frames, and four source-free quiet entries. Every existing interpretation and synthesis rule is preserved.`,
    "",
    "- [Application fallback preview](preview.md): six exact historical synthetic cases, warm tone and standard depth.",
    "- [Quiet repertoire](quiet-preview.md): working benchmark plus three provisional observations needing reader review.",
    "- [Frozen candidate](candidate.json), [machine preview](preview.json), and [manifest](manifest.json): exact source, input, and artifact identities.",
    "",
    "Run `node scripts/prepare-editorial-pilot.mjs` to refresh this offline preparation, or append `--verify` to require exact existing artifacts. The script disables Vite environment-file loading and throws on every fetch attempt. It invokes no provider, database, ephemeris service, publication, or activation endpoint.",
    "",
    "These artifacts verify candidate selection and authored fallback wiring. They do not establish fresh generated-writing quality, human approval, successive-day variation, or member response. The pilot version intentionally remains a descriptive prerelease identifier; it is not a publishable numeric release version.",
    "",
    "## Running the bounded pilot",
    "",
    "The committed app runtime must be deployed before generation: the existing build-identity guard refuses an uncommitted source tree, and the existing Workflow calls the signed public evaluation-step endpoint. The Worker protocol is unchanged. This preparation has not committed, deployed, or started a run.",
    "",
    "In `/content`, an administrator can use **Inactive daily editorial pilot → Preview exact pilot** to inspect the frozen candidate, provider/model, source SHA, and plan hash. **Start five-attempt pilot** starts one retained campaign with nine positions: five possible model responses and four authored quiet outputs. The generation ceiling is $5; failed or uncertain requests are not retried. The panel can recover a saved run, stop after the current case, and download its plan and captured evidence.",
    "",
    "Review each captured outcome before scoring the prose: an authored fallback after a rejected or failed response is not accepted model writing. Score recognition, meaning, direction, distinctness, and voice against the frozen reader rubric; check astrology support, independent reflections, and repetition across the set. Human approval remains pending even when automated checks pass.",
    "",
    "This pilot deliberately omits natal-lens and transit-story integration. Existing coverage guards remain in force; full-context qualification is required before any member activation. The four quiet dates establish a deterministic editorial repertoire, not repeated-day model behavior.",
    "",
  ].join("\n");
  await mkdir(resolve(root, destination), { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    const path = resolve(root, destination, name);
    if (process.argv[2] === "--verify") assert.equal(await readFile(path, "utf8"), contents, name);
    else await writeFile(path, contents);
  }
  console.log(
    `EDITORIAL_PILOT_${process.argv[2] === "--verify" ? "VERIFIED" : "PREPARED"}: six application fallbacks, four quiet entries, zero network attempts.`,
  );
} finally {
  await vite?.close();
  globalThis.fetch = oldFetch;
}
