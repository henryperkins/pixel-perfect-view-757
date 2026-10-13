import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
const gatewayURL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const geminiEnterpriseURL =
  "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent";
const envNames = [
  "PATTERN_MEMBERSHIPS_ENABLED",
  "PATTERN_ROOT_KEY",
  "PATTERN_WORKFLOW_URL",
  "PATTERN_WORKFLOW_SECRET",
  "PATTERN_APP_URL",
  "LOVABLE_API_KEY",
  "GEMINI_ENTERPRISE_API_KEY",
  "PATTERN_MEMBER_LANGUAGE_PROVIDER",
  "SWISS_EPHEMERIS_URL",
  "SWISS_EPHEMERIS_KEY",
  "SWISS_TRANSIT_EPISODE_URL",
  "SWISS_TRANSIT_EPISODE_SOURCE_ID",
];

/** Real application SQL, crypto and server modules with no live network access. */
export async function createRecordsHarness() {
  const oldEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  const oldFetch = globalThis.fetch;
  const directory = await mkdtemp(join(tmpdir(), "pattern-records-"));
  const file = join(directory, "records.sqlite");
  const schema = await readFile(join(projectRoot, "d1/schema.sql"), "utf8");
  const testURL = "http://pattern-records-test.invalid/d1/query";
  const secret = randomBytes(32).toString("hex");
  const userA = "local-reading-user-a";
  const userB = "local-reading-user-b";
  const requests = [];
  const gatewayRequests = [];
  const geminiEnterpriseRequests = [];
  const evaluationStarts = [];
  const releasePublications = [];
  const swissRequests = [];
  const episodeRequests = [];
  const calculationRequests = [];
  let calculationHandler = null;
  let episodeHandler = null;
  let sqlite;
  let vite;
  let gatewayHandler = null;
  let geminiEnterpriseHandler = null;
  let evaluationPlane = null;
  let releasePublicationHandler = null;
  let swissHandler = null;
  let fault = null;
  let closed = false;

  process.env.PATTERN_ROOT_KEY = randomBytes(32).toString("hex");
  process.env.PATTERN_MEMBERSHIPS_ENABLED = "false";
  process.env.PATTERN_WORKFLOW_URL = testURL.replace(/\/d1\/query$/, "");
  process.env.PATTERN_WORKFLOW_SECRET = secret;
  for (const name of [
    "PATTERN_APP_URL",
    "LOVABLE_API_KEY",
    "GEMINI_ENTERPRISE_API_KEY",
    "PATTERN_MEMBER_LANGUAGE_PROVIDER",
    "SWISS_EPHEMERIS_URL",
    "SWISS_EPHEMERIS_KEY",
  ])
    delete process.env[name];

  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (
      calculationHandler &&
      ["astronomy-events", "solar-context", "upcoming-cycles"].some(
        (path) => url === "https://swiss-fixture.invalid/v1/" + path,
      )
    ) {
      const body = JSON.parse(String(init.body));
      calculationRequests.push({ url, body });
      return calculationHandler(body, init, url);
    }
    if (url === "https://swiss-fixture.invalid/episodes" && episodeHandler) {
      const body = JSON.parse(String(init.body));
      episodeRequests.push(body);
      return episodeHandler(body, init);
    }
    if (url === "https://swiss-fixture.invalid/chart" && swissHandler) {
      const body = JSON.parse(String(init.body));
      swissRequests.push(body);
      return swissHandler(body, init);
    }
    if (url === gatewayURL && gatewayHandler) {
      const body = JSON.parse(String(init.body));
      gatewayRequests.push(body);
      return gatewayHandler(body, init);
    }
    if (url === geminiEnterpriseURL && geminiEnterpriseHandler) {
      const body = JSON.parse(String(init.body));
      geminiEnterpriseRequests.push(body);
      return geminiEnterpriseHandler(body, init);
    }
    const workflowBase = process.env.PATTERN_WORKFLOW_URL;
    if (workflowBase && url === `${workflowBase}/release-publication`) {
      const body = JSON.parse(String(init.body));
      releasePublications.push(body);
      return releasePublicationHandler
        ? releasePublicationHandler(body)
        : Response.json({
            ok: true,
            ...body,
            artifactKey: "content-releases/" + body.version + "/bundle.json",
            activeVersion: body.active ? body.version : null,
          });
    }
    if (workflowBase && url === `${workflowBase}/evaluations`) {
      const body = JSON.parse(String(init.body));
      evaluationStarts.push(body);
      return evaluationPlane
        ? evaluationPlane(body)
        : Response.json({ ok: true, instanceId: body.runId });
    }
    if (workflowBase && (url === `${workflowBase}/pointer` || url === `${workflowBase}/trigger`)) {
      return Response.json({ ok: true, instanceId: "mock-workflow-" + randomUUID() });
    }
    const batchURL = testURL.replace(/\/query$/, "/batch");
    assert.ok(url === testURL || url === batchURL, "The harness forbids external network calls");
    assert.equal(init.method, "POST");
    const raw = String(init.body);
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    const signature = new Headers(init.headers).get("x-pattern-signature") ?? "";
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return Response.json({ error: "Invalid local test signature" }, { status: 401 });
    if (url === batchURL) {
      const { statements } = JSON.parse(raw);
      sqlite.exec("BEGIN");
      try {
        const batch = statements.map(({ sql, params = [] }) => {
          requests.push({ sql, params });
          if (fault?.matches(sql, params)) {
            throw Object.assign(new Error("Injected local records failure"), { status: 503 });
          }
          const results = sqlite.prepare(sql).all(...params);
          return { results, meta: { changes: sqlite.prepare("SELECT changes() AS n").get().n } };
        });
        sqlite.exec("COMMIT");
        return Response.json({ ok: true, batch });
      } catch (error) {
        sqlite.exec("ROLLBACK");
        return Response.json({ error: error.message }, { status: error.status ?? 400 });
      }
    }
    const { sql, params } = JSON.parse(raw);
    requests.push({ sql, params });
    if (fault?.matches(sql, params))
      return Response.json({ error: "Injected local records failure" }, { status: 503 });
    try {
      return Response.json({ results: sqlite.prepare(sql).all(...params) });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  };

  async function close() {
    if (closed) return;
    closed = true;
    sqlite?.close();
    await vite?.close();
    globalThis.fetch = oldFetch;
    for (const name of envNames) {
      if (oldEnv[name] === undefined) delete process.env[name];
      else process.env[name] = oldEnv[name];
    }
    await rm(directory, { recursive: true, force: true });
  }

  try {
    vite = await createServer({
      root: projectRoot,
      // Concurrent suites must not remove or rebuild another harness's Vite cache.
      cacheDir: join(directory, "vite-cache"),
      configFile: false,
      envFile: false,
      define: { __PATTERN_SOURCE_SHA__: JSON.stringify("a".repeat(40)) },
      resolve: { alias: { "@": join(projectRoot, "src") } },
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const app = await vite.ssrLoadModule("/src/lib/pattern.server.ts");
    const { records } = await vite.ssrLoadModule("/src/lib/d1.server.ts");
    const cryptoModule = await vite.ssrLoadModule("/src/lib/crypto.server.ts");
    const factsModule = await vite.ssrLoadModule("/src/lib/ai/facts.ts");
    const registryModule = await vite.ssrLoadModule("/src/lib/registry.ts");
    const ephemerisModule = await vite.ssrLoadModule("/src/lib/astro/ephemeris.ts");

    async function seedUser(user) {
      const result = await records()
        .from("users")
        .insert({
          id: user,
          email: `${user}@example.invalid`,
          password_hash: "local-fixture-not-an-auth-password",
          created_at: new Date().toISOString(),
        });
      assert.equal(result.error, null, result.error?.message);
    }

    async function reset() {
      sqlite?.close();
      await rm(file, { force: true });
      sqlite = new DatabaseSync(file);
      sqlite.exec("PRAGMA foreign_keys = ON");
      sqlite.exec(schema);
      requests.length = 0;
      gatewayRequests.length = 0;
      geminiEnterpriseRequests.length = 0;
      evaluationStarts.length = 0;
      releasePublications.length = 0;
      releasePublicationHandler = null;
      swissRequests.length = 0;
      episodeRequests.length = 0;
      calculationRequests.length = 0;
      calculationHandler = null;
      episodeHandler = null;
      delete process.env.SWISS_TRANSIT_EPISODE_URL;
      delete process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID;
      delete process.env.SWISS_EPHEMERIS_KEY;
      fault = null;
      gatewayHandler = null;
      geminiEnterpriseHandler = null;
      evaluationPlane = null;
      swissHandler = null;
      delete process.env.SWISS_EPHEMERIS_URL;
      delete process.env.LOVABLE_API_KEY;
      delete process.env.GEMINI_ENTERPRISE_API_KEY;
      delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
      delete process.env.PATTERN_APP_URL;
      await seedUser(userA);
      await seedUser(userB);
    }

    async function seedChart(client, user = userA, opts = {}) {
      const dek = await app.getDek(client, user);
      const fingerprint = opts.fingerprint ?? `local-fixture-${user}-${randomUUID()}`;
      const birthId = randomUUID();
      const snapshotId = randomUUID();
      const accuracy = opts.accuracy ?? "exact";
      const rows = [
        [
          "birth_profiles",
          {
            id: birthId,
            user_id: user,
            payload_ct: await cryptoModule.encryptJson(dek, {
              birthDate: "1990-01-01",
              birthTime: "12:00",
              placeLabel: "Private birth place sentinel",
              latitude: 12.34567,
              longitude: 76.54321,
              utcISO: "1990-01-01T12:00:00Z",
            }),
            fingerprint,
            time_accuracy: accuracy,
            timezone: "UTC",
            ...(opts.createdAt ? { created_at: opts.createdAt } : {}),
          },
        ],
        [
          "chart_snapshots",
          {
            id: snapshotId,
            user_id: user,
            birth_profile_id: birthId,
            fingerprint,
            engine: "swiss-ephemeris@local-fixture",
            contract_version: "local-fixture",
            positions: opts.positions ?? opts.chart?.points ?? {},
            houses: {
              ...(opts.transitAnchors
                ? { transitAnchors_ct: await cryptoModule.encryptJson(dek, opts.transitAnchors) }
                : {}),
              ...(opts.natalReliability
                ? {
                    natalReliability_ct: await cryptoModule.encryptJson(dek, opts.natalReliability),
                  }
                : {}),
              system: opts.chart?.houseSystem ?? "Placidus",
              cusps: opts.chart?.houses ?? [],
              ...(opts.chart?.sources ? { sources: opts.chart.sources } : {}),
              ephemeris: {
                precision: "high",
                degraded: false,
                degradedReason: null,
              },
            },
            aspects: opts.chart?.aspects ?? [],
            uncertainty: {
              accuracy,
              minutes: 0,
              housesReliable: true,
              anglesReliable: true,
              ascendantSpreadDeg: 0,
              moonSpreadDeg: 0,
              angleClaimsSuppressed: false,
              ...(opts.chart?.uncertainty ?? {}),
              ...(opts.uncertainty ?? {}),
            },
            ...(opts.createdAt ? { created_at: opts.createdAt } : {}),
          },
        ],
      ];
      for (const [table, row] of rows) {
        const result = await client.from(table).insert(row);
        assert.equal(result.error, null, `${table}: ${result.error?.message}`);
      }
      return { dek, fingerprint, birthId, snapshotId };
    }

    await reset();
    return {
      app,
      records,
      cryptoModule,
      factsModule,
      registryModule,
      ephemerisModule,
      vite,
      userA,
      userB,
      requests,
      gatewayRequests,
      geminiEnterpriseRequests,
      evaluationStarts,
      releasePublications,
      swissRequests,
      episodeRequests,
      calculationRequests,
      setSwissCalculations(handler, sourceId = "pattern-swiss-1:c8ebf2f4f7e7f377aa22ff0776a8e54a") {
        calculationHandler = handler;
        process.env.SWISS_TRANSIT_EPISODE_URL = "https://swiss-fixture.invalid/episodes";
        process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID = sourceId;
        process.env.SWISS_EPHEMERIS_KEY = "local-fixture-key";
      },
      setEpisode(handler) {
        episodeHandler = handler;
        process.env.SWISS_TRANSIT_EPISODE_URL = "https://swiss-fixture.invalid/episodes";
        process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID = "analytic-test-only";
        process.env.SWISS_EPHEMERIS_KEY = "local-fixture-key";
      },
      get sqlite() {
        return sqlite;
      },
      seedUser,
      seedChart,
      reset,
      close,
      reopen() {
        sqlite.close();
        sqlite = new DatabaseSync(file);
        sqlite.exec("PRAGMA foreign_keys = ON");
      },
      setGateway(handler) {
        gatewayHandler = handler;
        if (handler) process.env.LOVABLE_API_KEY = "local-test-key-never-a-real-secret";
        else delete process.env.LOVABLE_API_KEY;
      },
      setEvaluationPlane(handler) {
        evaluationPlane = handler;
      },
      setReleasePublicationHandler(handler) {
        releasePublicationHandler = handler;
      },
      setGeminiEnterprise(handler) {
        geminiEnterpriseHandler = handler;
        if (handler)
          process.env.GEMINI_ENTERPRISE_API_KEY = "local-test-gemini-key-never-a-real-secret";
        else delete process.env.GEMINI_ENTERPRISE_API_KEY;
      },
      setSwiss(handler) {
        swissHandler = handler;
        if (handler) process.env.SWISS_EPHEMERIS_URL = "https://swiss-fixture.invalid/chart";
        else delete process.env.SWISS_EPHEMERIS_URL;
      },
      setFault(value) {
        fault = value;
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
}

export function successfulReadingResponse(body) {
  const prompt = body.messages.find((message) => message.role === "user").content;
  const cycle = prompt.match(/C1: transiting (\w+) (\w+) natal (\w+)/);
  assert.ok(cycle, "The success fixture requires a real eligible cycle");
  return Response.json({
    choices: [
      {
        message: {
          content: JSON.stringify({
            paragraphs: [
              {
                text: `${cycle[1]} ${cycle[2]} natal ${cycle[3]} is the strongest named contact. The published interpretation provides reflective context.`,
                facts: ["C1", "I1"],
              },
              {
                text: "This contact is framed through a defined domain. You can consider how that context fits what you notice.",
                facts: ["C1", "D1"],
              },
              {
                text: "The supplied phase and timing describe the calculated contact. You can leave room for your own perspective on that window.",
                facts: ["C1", "P1", "T1"],
              },
            ],
          }),
        },
      },
    ],
  });
}
