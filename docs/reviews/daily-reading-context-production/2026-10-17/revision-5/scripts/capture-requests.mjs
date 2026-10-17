// Offline capture of the provider-bound request for the five context cases.
// Usage: node capture-requests.mjs <worktree> <out.json> [label]
// Network: the records harness replaces fetch and forbids external calls; any attempt is counted.
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const [root, out, label] = process.argv.slice(2);
process.env.PATTERN_TEST_PROJECT_ROOT = root;
const { createRecordsHarness } = await import(pathToFileURL(`${root}/tests/helpers/records-harness.mjs`).href);
const { contextWritingFixture, readContextBenchmarks } = await import(
  pathToFileURL(`${root}/tests/helpers/context-writing-fixture.mjs`).href
);
const sha = (v) => createHash("sha256").update(v).digest("hex");
const h = await createRecordsHarness();
const intercept = globalThis.fetch;
let externalAttempts = 0;
globalThis.fetch = async (...args) => {
  try {
    return await intercept(...args);
  } catch (error) {
    if (/forbids external network calls/.test(String(error?.message))) externalAttempts += 1;
    throw error;
  }
};
try {
  const plans = await h.vite.ssrLoadModule("/src/lib/ai/context-pilot-plan.server.ts");
  const evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  const language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  const plan = plans.createContextPilotPlan("0".repeat(40), "gemini-enterprise");
  const benchmarks = await readContextBenchmarks();
  const cases = [];
  for (const frozen of plan.cases) {
    h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
    const before = h.geminiEnterpriseRequests.length;
    const result = await evaluation.runSyntheticEvaluationCase(
      frozen.id,
      plan.contextPilot.candidate,
      "gemini-enterprise",
      undefined,
      { boundedQualification: true },
      "daily-context-1",
    );
    if (h.geminiEnterpriseRequests.length !== before + 1) throw Error("expected exactly one intercepted request");
    const wire = h.geminiEnterpriseRequests.at(-1);
    const system = wire.systemInstruction.parts.map((p) => p.text).join("");
    const user = wire.contents[0].parts.map((p) => p.text).join("");
    // Member Today route: same adapter and writer, provider chosen by configuration.
    const benchmark = benchmarks.cases.find((b) => b.id === frozen.id);
    const { input } = await contextWritingFixture(h, benchmark);
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
    const memberBefore = h.geminiEnterpriseRequests.length;
    const member = await language.generateReadingProse(input, {
      contextModes: plan.contextPilot.allowedModes,
      contextRenderMode: "model",
    });
    delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
    if (h.geminiEnterpriseRequests.length !== memberBefore + 1) throw Error("member path made no single request");
    const memberWire = h.geminiEnterpriseRequests.at(-1);
    cases.push({
      id: frozen.id,
      promptVersion: result.case.diagnostics.promptVersion,
      validatorVersion: result.case.diagnostics.validatorVersion,
      diagnostics: result.case.diagnostics.code,
      memberDiagnostics: member.meta.diagnostics.code,
      memberMessagesIdentical: JSON.stringify(memberWire.systemInstruction) === JSON.stringify(wire.systemInstruction) && JSON.stringify(memberWire.contents) === JSON.stringify(wire.contents),
      memberGenerationConfig: memberWire.generationConfig,
      systemChars: system.length,
      userChars: user.length,
      requestBytes: Buffer.byteLength(JSON.stringify(wire)),
      requestSha256: sha(JSON.stringify(wire)),
      generationConfig: wire.generationConfig,
      system,
      user,
    });
  }
  await writeFile(
    out,
    JSON.stringify(
      {
        capturedFrom: label ?? root,
        planHash: plan.hash,
        planVersion: plan.contextPilot.version,
        network: "records-harness fetch interception; external calls throw",
        providerRequestsIntercepted: h.geminiEnterpriseRequests.length,
        lovableRequestsIntercepted: h.gatewayRequests.length,
        externalAttempts,
        cases,
      },
      null,
      1,
    ) + "\n",
  );
  console.log(
    cases.map((c) => `${c.id} sys=${c.systemChars} user=${c.userChars} bytes=${c.requestBytes} member=${c.memberMessagesIdentical} ${c.diagnostics}/${c.memberDiagnostics}`).join("\n"),
  );
} finally {
  await h.close();
}
