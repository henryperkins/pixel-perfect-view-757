import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = "docs/reviews/daily-reading-release/2026-10-17";
const output = `${base}/provider-validation`;
const mode = process.argv[2];
assert.ok(
  process.argv.length === 3 && ["--prepare", "--verify", "--run"].includes(mode),
  "Usage: node scripts/validate-editorial-release.mjs --prepare|--verify|--run",
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => hash(JSON.stringify(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const encoded = (value) => `${JSON.stringify(value, null, 2)}\n`;
const runtimeFiles = async (directory) => {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? runtimeFiles(path) : entry.isFile() ? [path] : [];
      }),
    )
  )
    .flat()
    .sort();
};
const sourceCommit = async () => {
  const head = (await readFile(resolve(root, ".git/HEAD"), "utf8")).trim();
  if (/^[a-f0-9]{40}$/.test(head)) return head;
  assert.match(head, /^ref: refs\/[A-Za-z0-9_./-]+$/);
  const ref = head.slice(5);
  try {
    return (await readFile(resolve(root, ".git", ref), "utf8")).trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const packed = await readFile(resolve(root, ".git/packed-refs"), "utf8");
    const line = packed.split("\n").find((entry) => entry.endsWith(` ${ref}`));
    assert.ok(line, "Current source commit could not be resolved.");
    return line.split(" ")[0];
  }
};
const caseIds = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
];
const expectedChecksum = "d771accdde355e1b435788b9ca708b6deeab3f0d5d9665a9b049b539be81506f";
const tokenCap = 65536;
const reservationMicros = 2_800_000;
const dollarCeilingMicros = 5_000_000;
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
let ledger = null;
const save = async (name, value, options = {}) => {
  const contents = typeof value === "string" ? value : encoded(value);
  if (secret && contents.includes(secret)) throw Error("Refusing to persist a credential.");
  await writeFile(resolve(root, output, name), contents, options);
};
const noNetwork = async () => {
  throw Error("Only the explicitly bounded provider request is permitted.");
};
globalThis.fetch = noNetwork;
try {
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const load = (path) => vite.ssrLoadModule(`/src/lib/${path}`);
  const { contentChecksum } = await load("content/draft-comparison.ts");
  const { validateContentGraph } = await load("content/schema.ts");
  const { prepareSyntheticEvaluationCase } = await load("ai/reading-evaluation.server.ts");
  const { generateReadingProse, memberLanguageProvider } = await load("ai/language.server.ts");
  const { GEMINI_ENTERPRISE_MODEL, DAILY_GATEWAY_TIMEOUT_MS } = await load("ai/diagnostics.ts");
  const { createAdminTransportTrace, qualificationTransportIssue, qualificationReservationMicros } =
    await load("ai/admin-transport.ts");
  const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${GEMINI_ENTERPRISE_MODEL}:generateContent`;
  const bundle = await readJson(`${base}/bundle.json`);
  validateContentGraph(bundle);
  assert.equal(bundle.version, "0.9.0");
  assert.equal(await contentChecksum(bundle), expectedChecksum);
  const prepared = caseIds.map((id) =>
    prepareSyntheticEvaluationCase(id, bundle, undefined, "daily-editorial-1"),
  );
  assert.equal(
    new Set(prepared.map((item) => item.assembled.writingPlan.editorial?.entry.key)).size,
    5,
  );
  for (const item of prepared) {
    assert.equal(item.assembled.writingPlan.editorial?.mode, "contact");
    assert.equal(item.assembled.writingPlan.editorial?.releaseVersion, "0.9.0");
    assert.ok(!item.facts.some((fact) => ["N1", "A1", "P2"].includes(fact.id)));
    assert.equal(item.input.tone, "warm");
    assert.equal(item.input.depth, "standard");
  }
  // Produce the exact native member request without sending it. Only the token
  // ceiling differs in the live lane, as explicitly bound in the frozen plan.
  process.env.GEMINI_ENTERPRISE_API_KEY = "offline-request-capture";
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  const requests = [];
  for (const item of prepared) {
    let count = 0;
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), endpoint);
      assert.equal(init.method, "POST");
      assert.equal(++count, 1);
      const request = JSON.parse(init.body);
      assert.ok(Buffer.byteLength(JSON.stringify(request)) <= tokenCap);
      requests.push(request);
      const selected = item.assembled.writingPlan.editorial;
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      paragraphs: selected.entry.fallbackParagraphs.map((text) => ({
                        text,
                        facts: selected.requiredFacts,
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
    assert.equal(count, 1);
  }
  globalThis.fetch = noNetwork;
  const sourcePaths = [...(await runtimeFiles("src")), "package.json", "bun.lock"];
  sourcePaths.push("scripts/validate-editorial-release.mjs");
  const sourceFileHashes = Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (path) => [path, hash(await readFile(resolve(root, path)))]),
    ),
  );
  const plan = {
    version: "daily-editorial-release-member-writer-validation-1",
    sourceSha: await sourceCommit(),
    sourceFileHashes,
    bundleVersion: bundle.version,
    bundleChecksum: expectedChecksum,
    bundleSerializedHash: jsonHash(bundle),
    entryPoint: "generateReadingProse -> memberLanguageProvider",
    provider: "gemini-enterprise",
    model: GEMINI_ENTERPRISE_MODEL,
    bounds: {
      maxProviderAttempts: 5,
      maxPerCase: 1,
      quietProviderAttempts: 0,
      maxInputBytes: tokenCap,
      maxOutputTokens: tokenCap,
      deadlineMs: DAILY_GATEWAY_TIMEOUT_MS,
      dollarCeilingMicros,
      reservationPerAttemptMicros: reservationMicros,
      retries: 0,
    },
    transportDifferenceFromMembers:
      "The wrapper adds maxOutputTokens=65536 solely to bound validation spend. System, user, schema, selected provider, validators and fallback handling use generateReadingProse unchanged.",
    evidenceLimit:
      "Local Node execution of the shared member writer on fixed synthetic inputs. This is not production Worker execution, getToday, cache, save/reload, real-chart correctness or member acceptance proof.",
    cases: prepared.map((item, index) => ({
      id: item.fixed.id,
      editorialKey: item.assembled.writingPlan.editorial.entry.key,
      input: item.input,
      inputHash: jsonHash(item.input),
      request: requests[index],
      requestHash: jsonHash(requests[index]),
    })),
  };
  const expectedPlan = { ...plan, hash: jsonHash(plan) };
  await mkdir(resolve(root, output), { recursive: true });
  if (mode === "--prepare") {
    let exists = false;
    try {
      await readFile(resolve(root, output, "run.json"));
      exists = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    assert.equal(exists, false, "An attempted campaign is immutable; do not replace its plan.");
    await save("plan.json", expectedPlan);
    await save(
      "README.md",
      [
        "# Bounded release writer validation",
        "",
        "Preparation freezes five contact requests from numeric release 0.9.0 through the shared generateReadingProse/memberLanguageProvider path. Preparation and verification make zero provider calls.",
        "",
        "Run `node scripts/validate-editorial-release.mjs --verify` to verify the frozen runtime, bundle and requests. `--run` is the explicit paid execution command: at most five sequential Gemini requests, one per contact case, zero retries and zero quiet requests, with a $5 conservative reservation ceiling. It creates an exclusive run.json lock before any request. An existing run can never be restarted with this script.",
        "",
        "The live wrapper adds only a 65,536 output-token cap. A full $2.80 conservative reservation is durable before each request and is reduced only using complete valid provider usage. Unknown billing, unavailable response or rejected prose stops remaining requests. These are estimates, not invoices.",
        "",
        "Requests omit authentication headers; response evidence excludes thought parts and raw error bodies. The script reads the Gemini key privately from .env only during --run. It uses no database, Workflow, content-publication or activation endpoint.",
        "",
        "Results establish local shared-member-writer behavior on synthetic fixtures. Actual production getToday, persistence, cache and reload evidence must be recorded separately. Automated acceptance does not replace editorial review.",
        "",
      ].join("\n"),
    );
    console.log(
      JSON.stringify({
        status: "prepared",
        planHash: expectedPlan.hash,
        maxProviderAttempts: 5,
        networkAttempts: 0,
      }),
    );
  } else {
    assert.deepEqual(
      await readJson(`${output}/plan.json`),
      expectedPlan,
      "Prepared runtime/request identity changed; prepare again before any provider attempt.",
    );
    if (mode === "--verify") {
      console.log(
        JSON.stringify({ status: "verified", planHash: expectedPlan.hash, networkAttempts: 0 }),
      );
    } else {
      const privateEnv = parseEnv(await readFile(resolve(root, ".env"), "utf8"));
      secret = privateEnv.GEMINI_ENTERPRISE_API_KEY;
      if (!secret) throw Error("The local Gemini Enterprise key is unavailable.");
      process.env.GEMINI_ENTERPRISE_API_KEY = secret;
      const selector =
        savedEnvironment.PATTERN_MEMBER_LANGUAGE_PROVIDER ??
        privateEnv.PATTERN_MEMBER_LANGUAGE_PROVIDER;
      if (selector === undefined) delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
      else process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = selector;
      assert.equal(
        memberLanguageProvider(),
        "gemini-enterprise",
        "Configured member provider must be Gemini Enterprise.",
      );
      ledger = {
        version: "daily-editorial-release-validation-ledger-1",
        planHash: expectedPlan.hash,
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "running",
        providerAttempts: 0,
        reservedMicros: 0,
        costStatus: "reservation-estimates-not-invoices",
        stopReason: null,
        entries: [],
      };
      await save("run.json", ledger, { flag: "wx" });
      for (const [index, item] of prepared.entries()) {
        if (ledger.reservedMicros + reservationMicros > dollarCeilingMicros) {
          ledger.stopReason = "budget_reservation_limit";
          break;
        }
        const entry = {
          id: item.fixed.id,
          attempted: false,
          capture: "not_started",
          reservedMicros: 0,
          resultFile: null,
        };
        ledger.entries.push(entry);
        let trace = null;
        let candidate = null;
        let responseText = null;
        let seen = 0;
        globalThis.fetch = async (url, init) => {
          assert.equal(String(url), endpoint);
          assert.equal(init.method, "POST");
          assert.equal(++seen, 1, "A case cannot be retried.");
          assert.ok(networkAttempts < 5);
          const nativeRequest = JSON.parse(init.body);
          assert.deepEqual(
            nativeRequest,
            requests[index],
            "Member request differs from the frozen plan.",
          );
          assert.ok(Buffer.byteLength(JSON.stringify(nativeRequest)) <= tokenCap);
          const boundedRequest = structuredClone(nativeRequest);
          boundedRequest.generationConfig.maxOutputTokens = tokenCap;
          entry.attempted = true;
          entry.capture = "uncertain";
          entry.reservedMicros = reservationMicros;
          ledger.providerAttempts++;
          ledger.reservedMicros += reservationMicros;
          await save("run.json", ledger);
          await save(`${index + 1}-request.json`, {
            caseId: entry.id,
            endpoint,
            body: boundedRequest,
          });
          const recorder = createAdminTransportTrace(
            "gemini-enterprise",
            `gemini-enterprise/${GEMINI_ENTERPRISE_MODEL}`,
            DAILY_GATEWAY_TIMEOUT_MS,
            { boundedQualification: true },
            init.signal,
          );
          networkAttempts++;
          try {
            const response = await originalFetch(url, {
              ...init,
              body: JSON.stringify(boundedRequest),
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
        let prose = null;
        let localFailure = false;
        try {
          prose = await generateReadingProse(item.input);
        } catch {
          localFailure = true;
        }
        globalThis.fetch = noNetwork;
        const issue = qualificationTransportIssue(trace ?? undefined);
        const retained = qualificationReservationMicros(trace ?? undefined, entry.attempted);
        ledger.reservedMicros += retained - entry.reservedMicros;
        entry.reservedMicros = retained;
        entry.capture = prose ? "recorded" : "uncertain";
        entry.resultFile = `${index + 1}-result.json`;
        await save(entry.resultFile, {
          caseId: entry.id,
          inputHash: plan.cases[index].inputHash,
          requestHash: plan.cases[index].requestHash,
          trace,
          transportIssue: issue,
          candidate,
          providerText: responseText,
          prose,
          localFailure,
          actualMemberPersistence: false,
        });
        if (prose)
          await save(
            `${index + 1}-reading.md`,
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
            attempt: ledger.providerAttempts,
            outcome: prose?.meta.diagnostics?.outcome ?? "local_failure",
            code: prose?.meta.diagnostics?.code ?? null,
            reservedMicros: ledger.reservedMicros,
          }),
        );
        if (localFailure || issue || prose?.meta.mode !== "model") {
          ledger.stopReason = localFailure
            ? "local_failure"
            : issue
              ? "transport_or_usage_uncertain"
              : "model_output_not_accepted";
          break;
        }
      }
      ledger.status = ledger.stopReason ? "halted" : "completed";
      ledger.completedAt = new Date().toISOString();
      await save("run.json", ledger);
      console.log(
        JSON.stringify({
          status: ledger.status,
          attempts: ledger.providerAttempts,
          stopReason: ledger.stopReason,
          reservedMicros: ledger.reservedMicros,
        }),
      );
      if (ledger.status !== "completed") process.exitCode = 1;
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
