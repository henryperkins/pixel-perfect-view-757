import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../..");
const revision = process.argv[2];
assert.match(revision ?? "", /^[a-f0-9]{40}$/);
const work = await mkdtemp(join(tmpdir(), "natal-six-offline-"));
const fake = join(work, "fake-transport.mjs");
await writeFile(
  fake,
  `
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const report=JSON.parse(readFileSync(${JSON.stringify(resolve(here, "../2026-10-12-qualification-round-3/natal-candidate-partial-report.json"))},'utf8'));
const ids=['natal-duty-reflex','natal-moon-fallback','natal-synthesis-integration'];
let calls=0;
globalThis.fetch=async (url,init)=>{
  assert.equal(String(url),'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent');
  assert.equal(init.method,'POST');
  assert.ok(++calls<=6);
  const row=report.cases.find(x=>x.id===ids[(calls-1)%3]);
  if(process.env.NATAL_OFFLINE_HTTP==='credit') return Response.json({error:{status:'PERMISSION_DENIED',details:[{reason:'BILLING_DISABLED'}]}},{status:403});
  return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({paragraphs:row.candidate.paragraphs})}]}}],modelVersion:'offline-fixture',usageMetadata:{promptTokenCount:1,candidatesTokenCount:2,totalTokenCount:3}});
};
`,
);
const execute = (args, env = {}) =>
  spawnSync(process.execPath, ["--import", fake, join(here, "run-targeted.mjs"), ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GEMINI_ENTERPRISE_API_KEY: "offline-no-network", ...env },
  });
const fullDir = join(work, "full");
const full = execute(["--run", revision, fullDir]);
assert.equal(full.status, 0, full.stderr);
const read = async (dir, name) => JSON.parse(await readFile(join(dir, name), "utf8"));
const captured = await read(fullDir, "capture.json");
const finished = await read(fullDir, "run-finished.json");
assert.equal(finished.modelAttempts, 6);
assert.equal(finished.settledSamples, 6);
assert.equal(finished.losslessRawDrafts, 6);
assert.equal(captured.complete, true);
assert.equal(captured.fullBenchmarkClaim, false);
assert.deepEqual(
  captured.samples.map((s) => s.result.case.diagnostics.code),
  ["accepted", "editorial_claim", "accepted", "accepted", "editorial_claim", "accepted"],
);
for (const sample of captured.samples) {
  assert.equal(sample.transports.length, 1);
  assert.equal(sample.transports[0].modelVersion, "offline-fixture");
  assert.equal(sample.result.case.diagnostics.gatewayTimeoutMs, 120000);
  if (sample.result.case.diagnostics.code === "editorial_claim")
    assert.equal(sample.result.case.output.body, sample.result.case.template.body);
}
const creditDir = join(work, "credit");
assert.equal(execute(["--run", revision, creditDir], { NATAL_OFFLINE_HTTP: "credit" }).status, 1);
const credit = await read(creditDir, "run-finished.json");
assert.equal(credit.haltReason, "credit");
assert.equal(credit.modelAttempts, 1);
assert.equal(credit.settledSamples, 1);
assert.equal(execute(["--run", revision, fullDir]).status, 1);
assert.equal(execute(["--run", "0".repeat(40), join(work, "wrong-revision")]).status, 1);
assert.equal(
  execute(["--run", revision, join(work, "no-key")], { GEMINI_ENTERPRISE_API_KEY: "" }).status,
  1,
);
const dry = execute(["--dry-plan", revision]);
assert.equal(dry.status, 0, dry.stderr);
assert.equal(JSON.parse(dry.stdout).providerCallsMade, 0);
console.log(
  JSON.stringify(
    {
      passed: true,
      networkCalls: 0,
      tests: [
        "six scheduled transports including two rejections without retries",
        "credit halts after one settled transport",
        "existing output refused",
        "wrong revision refused",
        "missing key refused",
        "dry plan makes zero calls",
      ],
      work,
    },
    null,
    2,
  ),
);
