/** Offline dry graphs/templates. Never starts a run or configures a real provider key. */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { createServer } from "vite";
import { readBuildSourceSha } from "./build-source-identity.mjs";
import { withNetworkBlocked } from "./evaluate-readings.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function freezeEvaluationPlans(outputDirectory) {
  const sourceSha = readBuildSourceSha(root);
  if (!sourceSha)
    throw Error(
      "Commit the runtime source before freezing its exact identity. No generation was started.",
    );
  let vite;
  const files = await withNetworkBlocked(async () => {
    vite = await createServer({
      root,
      configFile: false,
      envFile: false,
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const { WRITING_CANDIDATE_BUNDLE: writing } = await vite.ssrLoadModule(
      "/src/lib/content/writing-candidate-bundle.ts",
    );
    const { TRANSIT_CANDIDATE_BUNDLE: transit } = await vite.ssrLoadModule(
      "/src/lib/content/transit-candidate-bundle.ts",
    );
    const { QUALIFICATION_PROFILES: profiles } = await vite.ssrLoadModule(
      "/src/lib/ai/qualification-profiles.ts",
    );
    const { createQualificationPlan, createEnterprisePilotPlan } = await vite.ssrLoadModule(
      "/src/lib/ai/qualification-plan.server.ts",
    );
    const writingPlans = profiles.map((p) => [p, createQualificationPlan(writing, p, sourceSha)]);
    const pilotPlans = ["LOW", "MEDIUM"].map((p) => [
      `enterprise-${p}`,
      createEnterprisePilotPlan(transit, p, sourceSha),
    ]);
    if (
      writingPlans.reduce((n, [, p]) => n + p.attemptLimit, 0) !== 196 ||
      pilotPlans.reduce((n, [, p]) => n + p.attemptLimit, 0) !== 24
    )
      throw Error("Dry scope changed; no run setup is authorized by the previous ceiling.");
    return [...writingPlans, ...pilotPlans].map(([name, plan]) => ({
      name: name + ".json",
      plan,
      json: JSON.stringify(plan, null, 2) + "\n",
    }));
  }).finally(async () => {
    await vite?.close();
  });
  const directory = resolve(outputDirectory);
  await mkdir(directory, { recursive: false });
  const manifest = {
    version: "evaluation-dry-freeze-1",
    sourceSha,
    createdAt: new Date().toISOString(),
    network: "blocked",
    modelAttempts: 0,
    nativeCalls: 0,
    writingPlannedAttempts: 196,
    enterprisePilotPlannedAttempts: 24,
    sevenDayPlannedAllowance: 28,
    paidBudget: null,
    humanReviewCompleted: false,
    files: Object.fromEntries(
      files.map((f) => [
        f.name,
        {
          sha256: sha(f.json),
          planHash: f.plan.hash,
          attemptLimit: f.plan.attemptLimit,
          bytes: Buffer.byteLength(f.json),
        },
      ]),
    ),
  };
  try {
    for (const file of files)
      await writeFile(join(directory, file.name), file.json, { flag: "wx" });
    await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", {
      flag: "wx",
    });
  } catch (error) {
    await writeFile(
      join(directory, "INCOMPLETE.json"),
      JSON.stringify({ sourceSha, status: "incomplete", modelAttempts: 0 }) + "\n",
      { flag: "wx" },
    ).catch(() => {});
    throw error;
  }
  return manifest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 4 || process.argv[2] !== "--output-dir")
    throw Error("Usage: node scripts/freeze-evaluation-plans.mjs --output-dir NEW_DIRECTORY");
  console.log(JSON.stringify(await freezeEvaluationPlans(process.argv[3]), null, 2));
}
