/** Current authored release delivery check. No provider, database, credentials or campaign mutations. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { readBuildSourceSha } from "./build-source-identity.mjs";
import { withNetworkBlocked } from "./evaluate-readings.mjs";
import { EDITORIAL_RELEASE_DIRECTORY } from "./editorial-release-archive.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
const caseIds = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
  "quiet-threshold",
  "editorial-quiet-2026-10-12",
  "editorial-quiet-2026-10-13",
  "editorial-quiet-2026-10-14",
];
const runtimeFiles = async (root, directory) => {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? runtimeFiles(root, path) : entry.isFile() ? [path] : [];
      }),
    )
  )
    .flat()
    .sort();
};

export async function prepareEditorialMemberDelivery(root) {
  const envNames = [
    "LOVABLE_API_KEY",
    "GEMINI_ENTERPRISE_API_KEY",
    "PATTERN_MEMBER_LANGUAGE_PROVIDER",
  ];
  const savedEnvironment = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  let vite;
  let networkAttempts = 0;
  try {
    process.env.LOVABLE_API_KEY = "offline-delivery-check";
    process.env.GEMINI_ENTERPRISE_API_KEY = "offline-delivery-check";
    return await withNetworkBlocked(async () => {
      // Count even caught fetch failures; a fallback must never conceal a provider attempt.
      globalThis.fetch = async () => {
        networkAttempts++;
        throw Error("Authored member delivery must not request a provider.");
      };
      vite = await createServer({
        root,
        configFile: false,
        envFile: false,
        appType: "custom",
        logLevel: "error",
        server: { middlewareMode: true, hmr: false, ws: false },
      });
      const load = (path) => vite.ssrLoadModule(`/src/lib/${path}`);
      const { memberDailyLanguagePolicy } = await load("ai/diagnostics.ts");
      const { generateReadingProse, generateSyntheticMemberReadingProse } =
        await load("ai/language.server.ts");
      const { prepareSyntheticEvaluationCase } = await load("ai/reading-evaluation.server.ts");
      const { validateContentGraph } = await load("content/schema.ts");
      const { contentChecksum } = await load("content/draft-comparison.ts");
      const bundle = JSON.parse(
        await readFile(resolve(root, EDITORIAL_RELEASE_DIRECTORY, "bundle.json"), "utf8"),
      );
      validateContentGraph(bundle);
      const bundleChecksum = await contentChecksum(bundle);
      assert.equal(
        bundleChecksum,
        "d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f",
      );
      const policies = ["lovable", "gemini-enterprise"].map(memberDailyLanguagePolicy);
      const cases = [];
      for (const policy of policies) {
        process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = policy.provider;
        for (const id of caseIds) {
          const { input } = prepareSyntheticEvaluationCase(
            id,
            bundle,
            undefined,
            "daily-editorial-1",
          );
          const prose = await generateReadingProse(input);
          const capture = await generateSyntheticMemberReadingProse(input);
          assert.deepEqual(capture.prose, prose, `${id}: capture differs from member delivery`);
          assert.deepEqual(capture.policy, policy);
          assert.equal(prose.meta.diagnostics.code, "authored_editorial");
          assert.equal(prose.meta.diagnostics.attempted, false);
          assert.equal(prose.meta.diagnostics.model, policy.model);
          assert.equal(prose.meta.mode, "template");
          assert.equal(prose.meta.model, null);
          assert.equal(prose.body, input.fallback.body);
          assert.equal(prose.headline, input.fallback.headline);
          assert.equal(prose.prompt, input.fallback.prompt);
          assert.notEqual(prose.meta.writing.finalQuality.outcome, "reject");
          assert.equal(capture.request, null);
          assert.equal(capture.candidate, null);
          assert.equal(capture.transport, null);
          assert.equal(networkAttempts, 0);
          cases.push({
            id,
            provider: policy.provider,
            inputHash: jsonHash(input),
            prose,
            request: null,
            transport: null,
          });
        }
      }
      const paths = [
        ...(await runtimeFiles(root, "src")),
        "package.json",
        "bun.lock",
        "scripts/validate-editorial-release.mjs",
        "scripts/editorial-member-delivery.mjs",
        "scripts/editorial-release-archive.mjs",
        "scripts/build-source-identity.mjs",
        "scripts/evaluate-readings.mjs",
      ];
      const sourceFileHashes = Object.fromEntries(
        await Promise.all(
          paths.map(async (path) => [path, hash(await readFile(resolve(root, path)))]),
        ),
      );
      const value = {
        version: "daily-editorial-member-delivery-validation-2",
        sourceSha: readBuildSourceSha(root),
        sourceFileHashes,
        bundleVersion: bundle.version,
        bundleChecksum,
        policies,
        providerAttempts: networkAttempts,
        plannedProviderAttempts: 0,
        cases,
        evidence:
          "Offline authored-delivery validation on fixed synthetic cases, for both member providers. No model generation, paid qualification, member records or production execution.",
      };
      return { ...value, hash: jsonHash(value) };
    });
  } finally {
    await vite?.close();
    for (const [name, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
