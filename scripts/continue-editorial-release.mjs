import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = "docs/reviews/daily-reading-release/2026-10-17";
const parent = `${base}/provider-validation`;
const destination = `${parent}/remaining-cases`;
const mode = process.argv[2];
assert.ok(
  process.argv.length === 3 && ["--prepare", "--verify", "--run"].includes(mode),
  "Usage: node scripts/continue-editorial-release.mjs --prepare|--verify|--run",
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
const read = (path) => readFile(resolve(root, path), "utf8");
const readJson = async (path) => JSON.parse(await read(path));
const parentHashes = {
  "plan.json": "ea6fed701923e0e18c0a67d899a7bbcdb15e36405a3b8bc1dbb1c397db3e3b6b",
  "run.json": "bf2477b5cc172852dde77944fd6411727060d286ac344db8a2b17be2ed84141f",
};
const remainingIds = [
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
];
const originalFetch = globalThis.fetch;
const savedEnvironment = Object.fromEntries(
  ["GEMINI_ENTERPRISE_API_KEY", "PATTERN_MEMBER_LANGUAGE_PROVIDER"].map((key) => [
    key,
    process.env[key],
  ]),
);
let secret = null;
let vite;
let networkAttempts = 0;
const save = async (name, value, options = {}) => {
  const text = typeof value === "string" ? value : encode(value);
  if (secret && text.includes(secret)) throw Error("Refusing to persist a credential.");
  await writeFile(resolve(root, destination, name), text, options);
};
const blocked = async () => {
  throw Error("Continuation permits only its explicit bounded Gemini request.");
};
globalThis.fetch = blocked;
try {
  // These exact two completed captures are the only predecessor. A running,
  // altered, or uncertain ledger cannot be used to mint another attempt lane.
  for (const [name, expected] of Object.entries(parentHashes))
    assert.equal(hash(await read(`${parent}/${name}`)), expected, `Parent ${name} changed.`);
  const originalPlan = await readJson(`${parent}/plan.json`);
  const originalRun = await readJson(`${parent}/run.json`);
  const { hash: originalPlanHash, ...originalPlanValue } = originalPlan;
  assert.equal(jsonHash(originalPlanValue), originalPlanHash);
  assert.equal(originalRun.planHash, originalPlanHash);
  assert.equal(originalRun.status, "halted");
  assert.equal(originalRun.stopReason, "model_output_not_accepted");
  assert.equal(originalRun.providerAttempts, 2);
  assert.equal(originalRun.reservedMicros, 61926);
  assert.deepEqual(
    originalRun.entries.map((entry) => entry.id),
    ["writing-reply-scene", "venus-opposition-venus"],
  );
  assert.ok(originalRun.entries.every((entry) => entry.attempted && entry.capture === "recorded"));
  assert.deepEqual(
    originalPlan.cases
      .filter((item) => !originalRun.entries.some((entry) => entry.id === item.id))
      .map((item) => item.id),
    remainingIds,
  );
  assert.equal(originalPlan.bounds.maxProviderAttempts, 5);
  assert.equal(originalPlan.bounds.dollarCeilingMicros, 5_000_000);
  for (const [path, expected] of Object.entries(originalPlan.sourceFileHashes))
    assert.equal(
      hash(await readFile(resolve(root, path))),
      expected,
      `Original runtime changed: ${path}`,
    );
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const load = (path) => vite.ssrLoadModule(`/src/lib/${path}`);
  const { prepareSyntheticEvaluationCase } = await load("ai/reading-evaluation.server.ts");
  const { generateReadingProse, memberLanguageProvider } = await load("ai/language.server.ts");
  const { contentChecksum } = await load("content/draft-comparison.ts");
  const { createAdminTransportTrace, qualificationReservationMicros, qualificationTransportIssue } =
    await load("ai/admin-transport.ts");
  const bundle = await readJson(`${base}/bundle.json`);
  assert.equal(await contentChecksum(bundle), originalPlan.bundleChecksum);
  assert.equal(jsonHash(bundle), originalPlan.bundleSerializedHash);
  const bounds = originalPlan.bounds;
  const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${originalPlan.model}:generateContent`;
  const parentResultHashes = {};
  let originalReserved = 0;
  let previousFallbacks = 0;
  for (const entry of originalRun.entries) {
    assert.match(entry.resultFile, /^[12]-result\.json$/);
    const raw = await read(`${parent}/${entry.resultFile}`);
    parentResultHashes[entry.resultFile] = hash(raw);
    const result = JSON.parse(raw);
    const originalCase = originalPlan.cases.find((item) => item.id === entry.id);
    assert.equal(result.caseId, entry.id);
    assert.equal(result.inputHash, originalCase.inputHash);
    assert.equal(result.requestHash, originalCase.requestHash);
    assert.equal(qualificationTransportIssue(result.trace), null);
    assert.equal(qualificationReservationMicros(result.trace, true), entry.reservedMicros);
    assert.ok(["accepted", "rejected"].includes(result.prose.meta.diagnostics.outcome));
    originalReserved += entry.reservedMicros;
    if (result.prose.meta.mode === "template") previousFallbacks++;
  }
  assert.equal(originalReserved, originalRun.reservedMicros);
  const cases = remainingIds.map((id) => originalPlan.cases.find((item) => item.id === id));
  const prepared = remainingIds.map((id) =>
    prepareSyntheticEvaluationCase(id, bundle, undefined, "daily-editorial-1"),
  );
  process.env.GEMINI_ENTERPRISE_API_KEY = "offline-continuation-capture";
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  for (const [index, item] of prepared.entries()) {
    assert.deepEqual(item.input, cases[index].input);
    let captured = 0;
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), endpoint);
      assert.equal(init.method, "POST");
      assert.equal(++captured, 1);
      assert.deepEqual(JSON.parse(init.body), cases[index].request);
      const editorial = item.assembled.writingPlan.editorial;
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      paragraphs: editorial.entry.fallbackParagraphs.map((text) => ({
                        text,
                        facts: editorial.requiredFacts,
                        scenes: [],
                      })),
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    await generateReadingProse(item.input);
    assert.equal(captured, 1);
  }
  globalThis.fetch = blocked;
  const planValue = {
    version: "daily-editorial-release-remaining-cases-1",
    parent: {
      directory: parent,
      planHash: originalPlanHash,
      artifactHashes: parentHashes,
      resultHashes: parentResultHashes,
      attemptedCaseIds: originalRun.entries.map((entry) => entry.id),
      providerAttempts: originalRun.providerAttempts,
      reservedMicros: originalRun.reservedMicros,
    },
    sourceSha: originalPlan.sourceSha,
    runtimeIdentity:
      "Every original plan sourceFileHash is rechecked; original writer, guard, fixtures and requests are unchanged.",
    continuationRunnerHash: hash(await read("scripts/continue-editorial-release.mjs")),
    bundleVersion: originalPlan.bundleVersion,
    bundleChecksum: originalPlan.bundleChecksum,
    provider: originalPlan.provider,
    model: originalPlan.model,
    cases,
    combinedBounds: bounds,
    remainingAttemptLimit: 3,
    stopPolicy:
      "Halt on local failure, unavailable/uncertain transport, incomplete usage or budget exhaustion. Accepted model prose and validated authored fallback after a rejected model response both count as tested outcomes; fallback remains explicitly labelled.",
    evidenceLimit: originalPlan.evidenceLimit,
    transportDifferenceFromMembers: originalPlan.transportDifferenceFromMembers,
  };
  const plan = { ...planValue, hash: jsonHash(planValue) };
  await mkdir(resolve(root, destination), { recursive: true });
  if (mode === "--prepare") {
    try {
      await read(`${destination}/run.json`);
      throw Error(
        "This continuation already has a run ledger; it cannot be restarted or rewritten.",
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await save("plan.json", plan);
    await save(
      "README.md",
      [
        "# Remaining original release-validation cases",
        "",
        "The original five-case run stopped after Mercury was accepted and Venus was rejected with a valid authored fallback. Its two attempts and $0.061926 conservative accounting remain intact. This continuation covers only the three original unattempted cases; it does not retry either attempted case or create a new budget.",
        "",
        "The parent plan and ledger are pinned by exact file hashes. Original source hashes, request/input identities and captured accounting are rechecked. Combined limits remain five total provider attempts and $5 conservative accounting. The original runner, plan, ledger and results are never written.",
        "",
        "`node scripts/continue-editorial-release.mjs --verify` performs only offline checks. `--run` explicitly attempts at most the three remaining cases in order. An exclusive continuation run.json lock prevents repeat execution. Completed model or validated authored-fallback outcomes allow progress; transport/usage uncertainty, local failure and budget exhaustion halt the continuation.",
        "",
        "Completion with any fallback is labelled completed_with_fallbacks. Each output retains its acceptance/rejection diagnosis; authored fallback is never counted as accepted model prose. Production getToday and persistence proof remain separate.",
        "",
      ].join("\n"),
    );
    console.log(
      JSON.stringify({
        status: "prepared",
        planHash: plan.hash,
        remainingCaseIds: remainingIds,
        parentAttempts: 2,
        maximumAdditionalAttempts: 3,
        networkAttempts: 0,
      }),
    );
  } else {
    assert.deepEqual(
      await readJson(`${destination}/plan.json`),
      plan,
      "Continuation plan or runtime identity changed.",
    );
    if (mode === "--verify")
      console.log(JSON.stringify({ status: "verified", planHash: plan.hash, networkAttempts: 0 }));
    else {
      const privateEnv = parseEnv(await read(".env"));
      secret = privateEnv.GEMINI_ENTERPRISE_API_KEY;
      if (!secret) throw Error("The local Gemini Enterprise key is unavailable.");
      process.env.GEMINI_ENTERPRISE_API_KEY = secret;
      const selector =
        savedEnvironment.PATTERN_MEMBER_LANGUAGE_PROVIDER ??
        privateEnv.PATTERN_MEMBER_LANGUAGE_PROVIDER;
      if (selector === undefined) delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
      else process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = selector;
      assert.equal(memberLanguageProvider(), "gemini-enterprise");
      const ledger = {
        version: "daily-editorial-release-continuation-ledger-1",
        planHash: plan.hash,
        parentLedgerHash: parentHashes["run.json"],
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "running",
        inheritedAttempts: originalRun.providerAttempts,
        inheritedReservedMicros: originalRun.reservedMicros,
        providerAttempts: originalRun.providerAttempts,
        reservedMicros: originalRun.reservedMicros,
        costStatus: "reservation-estimates-not-invoices",
        fallbackCount: previousFallbacks,
        stopReason: null,
        entries: [],
      };
      await save("run.json", ledger, { flag: "wx" });
      for (const [index, item] of prepared.entries()) {
        if (
          ledger.providerAttempts >= bounds.maxProviderAttempts ||
          ledger.reservedMicros + bounds.reservationPerAttemptMicros > bounds.dollarCeilingMicros
        ) {
          ledger.stopReason = "combined_attempt_or_budget_limit";
          break;
        }
        for (const [name, expected] of Object.entries(parentHashes))
          assert.equal(
            hash(await read(`${parent}/${name}`)),
            expected,
            `Parent ${name} changed before dispatch.`,
          );
        const entry = {
          id: item.fixed.id,
          attempted: false,
          capture: "not_started",
          reservedMicros: 0,
          resultFile: null,
          testedOutcome: null,
        };
        assert.ok(!originalRun.entries.some((old) => old.id === entry.id));
        assert.ok(!ledger.entries.some((old) => old.id === entry.id));
        ledger.entries.push(entry);
        const position = index + originalRun.providerAttempts + 1;
        let seen = 0,
          trace = null,
          candidate = null,
          responseText = null;
        globalThis.fetch = async (url, init) => {
          assert.equal(String(url), endpoint);
          assert.equal(init.method, "POST");
          assert.equal(++seen, 1, "A case cannot be retried.");
          assert.ok(networkAttempts < 3 && ledger.providerAttempts < bounds.maxProviderAttempts);
          const nativeRequest = JSON.parse(init.body);
          assert.deepEqual(nativeRequest, cases[index].request);
          assert.ok(Buffer.byteLength(init.body) <= bounds.maxInputBytes);
          const bounded = structuredClone(nativeRequest);
          bounded.generationConfig.maxOutputTokens = bounds.maxOutputTokens;
          entry.attempted = true;
          entry.capture = "uncertain";
          entry.reservedMicros = bounds.reservationPerAttemptMicros;
          ledger.providerAttempts++;
          ledger.reservedMicros += bounds.reservationPerAttemptMicros;
          assert.ok(ledger.reservedMicros <= bounds.dollarCeilingMicros);
          await save("run.json", ledger);
          await save(`${position}-request.json`, { caseId: entry.id, endpoint, body: bounded });
          const recorder = createAdminTransportTrace(
            "gemini-enterprise",
            `gemini-enterprise/${originalPlan.model}`,
            bounds.deadlineMs,
            { boundedQualification: true },
            init.signal,
          );
          networkAttempts++;
          try {
            const response = await originalFetch(url, {
              ...init,
              body: JSON.stringify(bounded),
              redirect: "error",
            });
            recorder.headers(response);
            const raw = await response.text();
            recorder.body();
            if (response.ok) {
              const payload = JSON.parse(raw);
              recorder.payload(payload);
              const parts = payload.candidates?.[0]?.content?.parts;
              responseText = (Array.isArray(parts) ? parts : [])
                .filter((part) => part?.thought !== true && typeof part?.text === "string")
                .map((part) => part.text)
                .join("");
              if (responseText.length > 262144)
                throw Error("Provider text exceeded evidence bounds.");
              try {
                candidate = JSON.parse(responseText);
              } catch {
                candidate = null;
              }
            }
            return new Response(raw, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          } finally {
            trace = recorder.finish();
          }
        };
        let prose = null,
          localFailure = false;
        try {
          prose = await generateReadingProse(item.input);
        } catch {
          localFailure = true;
        }
        globalThis.fetch = blocked;
        const issue = qualificationTransportIssue(trace ?? undefined);
        const retained = qualificationReservationMicros(trace ?? undefined, entry.attempted);
        ledger.reservedMicros += retained - entry.reservedMicros;
        entry.reservedMicros = retained;
        const accepted =
          prose?.meta.mode === "model" && prose.meta.diagnostics?.outcome === "accepted";
        const authoredFallback =
          prose?.meta.mode === "template" &&
          prose.meta.diagnostics?.outcome === "rejected" &&
          prose.meta.writing?.finalQuality.outcome === "pass" &&
          prose.headline === item.input.fallback.headline &&
          prose.body === item.input.fallback.body &&
          prose.prompt === item.input.fallback.prompt;
        entry.testedOutcome = accepted
          ? "accepted_model"
          : authoredFallback
            ? "validated_authored_fallback"
            : null;
        if (authoredFallback) ledger.fallbackCount++;
        entry.capture = prose ? "recorded" : "uncertain";
        entry.resultFile = `${position}-result.json`;
        await save(entry.resultFile, {
          caseId: entry.id,
          inputHash: cases[index].inputHash,
          requestHash: cases[index].requestHash,
          trace,
          transportIssue: issue,
          candidate,
          providerText: responseText,
          prose,
          testedOutcome: entry.testedOutcome,
          localFailure,
          actualMemberPersistence: false,
        });
        if (prose)
          await save(
            `${position}-reading.md`,
            [
              `# ${prose.headline}`,
              "",
              `Case: ${entry.id}. Result: ${prose.meta.mode}; validator: ${prose.meta.diagnostics?.code}.`,
              "",
              prose.body,
              "",
              `Reflection: ${prose.prompt}`,
              "",
            ].join("\n"),
          );
        await save("run.json", ledger);
        console.log(
          JSON.stringify({
            caseId: entry.id,
            combinedAttempts: ledger.providerAttempts,
            testedOutcome: entry.testedOutcome,
            code: prose?.meta.diagnostics?.code ?? null,
            combinedReservedMicros: ledger.reservedMicros,
          }),
        );
        if (localFailure || issue || !entry.testedOutcome) {
          ledger.stopReason = localFailure
            ? "local_failure"
            : issue
              ? "transport_or_usage_uncertain"
              : "unvalidated_outcome";
          break;
        }
      }
      ledger.status = ledger.stopReason
        ? "halted"
        : ledger.fallbackCount
          ? "completed_with_fallbacks"
          : "completed";
      ledger.completedAt = new Date().toISOString();
      await save("run.json", ledger);
      console.log(
        JSON.stringify({
          status: ledger.status,
          combinedAttempts: ledger.providerAttempts,
          additionalAttempts: networkAttempts,
          stopReason: ledger.stopReason,
          combinedReservedMicros: ledger.reservedMicros,
          fallbackCount: ledger.fallbackCount,
        }),
      );
      if (ledger.status === "halted") process.exitCode = 1;
    }
  }
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await vite?.close();
}
