import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, ingestRoute, rollbackRoute;
const SECRET = "test-ingest-secret";

before(async () => {
  process.env.PATTERN_INGEST_SECRET = SECRET;
  h = await createRecordsHarness();
  ingestRoute = await h.vite.ssrLoadModule("/src/routes/api/public/content-releases.ts");
  rollbackRoute = await h.vite.ssrLoadModule("/src/routes/api/public/content-releases.rollback.ts");
});

after(async () => {
  delete process.env.PATTERN_INGEST_SECRET;
  await h?.close();
});

beforeEach(async () => {
  await h.reset();
  await h.records().from("user_roles").insert({
    user_id: h.userA,
    role: "admin",
  });
});

function signedRequest(url, body) {
  const raw = JSON.stringify(body);
  const signature = createHmac("sha256", SECRET).update(raw).digest("hex");
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pattern-signature": signature,
    },
    body: raw,
  });
}

for (const provider of ["lovable", "gemini-enterprise"]) {
  test(`drafting: ${provider} receives the versioned reflective brief and retains separate validated fields`, async () => {
    const language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
    const specs = [
      "saturn",
      "jupiter",
      "mars",
      "venus",
      "mercury",
      "sun",
      "moon",
      "uranus",
      "neptune",
      "pluto",
      "*",
    ].flatMap((body) =>
      ["hard", "soft"].map((family) => ({
        key: `${family}:${body}:*`,
        family,
        transitBody: body === "*" ? "any body" : body,
        natalPoint: "any natal point",
      })),
    );
    const accepted = {
      key: "hard:saturn:*",
      mechanism: " A weekly commitment can be compared with the time available to keep it. ",
      question: " What, if anything, would you like to leave room for? ",
    };
    const payload = {
      entries: [
        accepted,
        { key: "square:saturn:sun", mechanism: "Unrequested copy.", question: "What fits?" },
        { key: "soft:saturn:*", mechanism: "", question: "What fits?" },
      ],
    };
    let request;
    if (provider === "lovable") {
      h.setGateway((body) => {
        request = body;
        return Response.json({ choices: [{ message: { content: JSON.stringify(payload) } }] });
      });
    } else {
      h.setGeminiEnterprise((body) => {
        request = body;
        return Response.json({
          candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
        });
      });
    }

    const result = await language.generateBundleEntries(specs, provider);
    assert.equal(result.promptVersion, "bundle-draft-v2");
    assert.equal(result.promptVersion, language.BUNDLE_DRAFT_PROMPT_VERSION);
    assert.deepEqual(result.entries, [
      {
        key: accepted.key,
        mechanism: accepted.mechanism.trim(),
        question: accepted.question.trim(),
      },
    ]);
    assert.equal(result.dropped, 2);
    assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 1);
    const prompt =
      provider === "lovable"
        ? request.messages.find((message) => message.role === "user").content
        : request.contents[0].parts[0].text;
    const schema =
      provider === "lovable"
        ? request.response_format.json_schema.schema
        : request.generationConfig.responseJsonSchema;
    assert.equal(prompt.split("\n").filter((line) => /^(hard|soft):/.test(line)).length, 22);
    assert.match(prompt, /conditional.*reflection/i);
    assert.match(prompt, /one concrete.*everyday comparison/i);
    assert.match(prompt, /vary.*sentence structure/i);
    assert.match(prompt, /no planetary causation/i);
    assert.match(prompt, /unsupported frequency/i);
    assert.match(prompt, /nothing.*does not fit/i);
    assert.match(prompt, /commitment versus available capacity/i);
    assert.match(prompt, /imagination with uncertainty left explicit/i);
    assert.doesNotMatch(prompt, /what it tends to coincide with/i);
    assert.deepEqual(schema.properties.entries.items.required, ["key", "mechanism", "question"]);
    assert.equal(schema.properties.entries.items.additionalProperties, false);
  });
}

test("lifecycle: admin activation and rollback record the actual pointer direction", async () => {
  const releases = [];
  for (const [version, created_at] of [
    ["1.0.0", "2026-10-01T12:00:00.000Z"],
    ["2.0.0", "2026-10-12T12:00:00.000Z"],
  ]) {
    const { data, error } = await h
      .records()
      .from("content_releases")
      .insert({
        version,
        checksum: `checksum-${version}`,
        bundle: { cycles: [], natal: { sun_placement: `Copy ${version}` } },
        is_active: false,
        created_at,
      })
      .select("id")
      .single();
    assert.equal(error, null);
    releases.push(data);
  }
  const [older, newer] = releases;
  await assert.rejects(() => h.app.activateRelease(h.records(), h.userB, newer.id), /admin/i);
  const first = await h.app.activateRelease(h.records(), h.userA, older.id);
  const forward = await h.app.activateRelease(h.records(), h.userA, newer.id);
  const back = await h.app.activateRelease(h.records(), h.userA, older.id);
  assert.deepEqual([first.isRollback, forward.isRollback, back.isRollback], [false, false, true]);
  const events = h.sqlite.prepare("select kind, detail from audit_events order by rowid").all();
  assert.deepEqual(
    events.map((row) => [
      row.kind,
      JSON.parse(row.detail).previousVersion,
      JSON.parse(row.detail).action,
    ]),
    [
      ["content_release_activated", null, "activate"],
      ["content_release_activated", "1.0.0", "activate"],
      ["content_release_rollback", "2.0.0", "rollback"],
    ],
  );
  assert.deepEqual(
    h.sqlite
      .prepare("select id from content_releases where is_active = 1")
      .all()
      .map((row) => row.id),
    [older.id],
  );
});

test("lifecycle: an unreadable active pointer prevents activation and leaves its audit untouched", async () => {
  const { data: target } = await h
    .records()
    .from("content_releases")
    .insert({
      version: "1.0.0",
      checksum: "pointer-read-fixture",
      bundle: { cycles: [], natal: { sun_placement: "Published copy" } },
      is_active: true,
    })
    .select("id")
    .single();
  h.setFault({
    matches: (sql) => /^select .* from "content_releases" where "is_active"/i.test(sql),
  });
  await assert.rejects(
    () => h.app.activateRelease(h.records(), h.userA, target.id),
    /active release pointer could not be read/,
  );
  assert.equal(
    h.sqlite.prepare("select is_active from content_releases where id = ?").get(target.id)
      .is_active,
    1,
  );
  assert.equal(h.sqlite.prepare("select count(*) as n from audit_events").get().n, 0);
});

test("lifecycle: activeBundle validates stored bundle and isolates legacy releases", async () => {
  const legacyBundle = {
    version: "1.0.0",
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "Legacy saturn mechanism",
        question: "Legacy saturn question?",
      },
    ],
  };

  await h.records().from("content_releases").insert({
    version: "1.0.0",
    checksum: "checksum-100",
    bundle: legacyBundle,
    is_active: true,
  });

  const active = await h.app.activeBundle(h.records());
  assert.equal(active.version, "1.0.0");
  assert.equal(active.cycles.length, 1);
  assert.deepEqual(active.synthesisRules, []);
  assert.ok(active.natal.sun_placement); // has fallback natal defaults
});

test("lifecycle: invalid active release in storage fails closed instead of generating partial graph", async () => {
  const invalidBundle = {
    version: "2.0.0",
    schemaVersion: 2,
    cycles: [
      {
        key: "invalid_key",
        mechanism: "Mechanism",
        question: "Question?",
      },
    ],
    synthesisRules: [
      {
        key: "dangling-rule",
        relationship: "tension",
        mechanism: "Tension mechanism",
        primary: { interpretationKey: "nonexistent", theme: "structure" },
        supporting: { interpretationKey: "nonexistent2", theme: "expansion" },
      },
    ],
  };

  await h.records().from("content_releases").insert({
    version: "2.0.0",
    checksum: "checksum-200",
    bundle: invalidBundle,
    is_active: true,
  });

  await assert.rejects(() => h.app.activeBundle(h.records()), /missing parent|invalid/i);
});

test("lifecycle: empty releases cannot be ingested, activated, rolled back to, or read as active", async () => {
  const { data: previous } = await h
    .records()
    .from("content_releases")
    .insert({
      version: "1.0.0",
      checksum: "previous",
      bundle: { cycles: [] },
      is_active: true,
    })
    .select("id")
    .single();
  const { data: empty } = await h
    .records()
    .from("content_releases")
    .insert({
      version: "2.0.0",
      checksum: "empty",
      bundle: {},
      is_active: false,
    })
    .select("id")
    .single();

  await assert.rejects(() => h.app.activateRelease(h.records(), h.userA, empty.id), /empty/i);
  const rollback = await rollbackRoute.Route.options.server.handlers.POST({
    request: signedRequest("http://test/rollback", { version: "2.0.0" }),
  });
  assert.equal(rollback.status, 422);
  const ingest = await ingestRoute.Route.options.server.handlers.POST({
    request: signedRequest("http://test/ingest", { version: "3.0.0", bundle: {} }),
  });
  assert.equal(ingest.status, 422);
  const rows = h.sqlite
    .prepare("SELECT id, is_active FROM content_releases ORDER BY version")
    .all();
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => [row.id, row.is_active]),
    [
      [previous.id, 1],
      [empty.id, 0],
    ],
  );

  h.sqlite.prepare("UPDATE content_releases SET is_active = (id = ?)").run(empty.id);
  await assert.rejects(() => h.app.activeBundle(h.records()), /empty/i);
});

test("lifecycle: overlapping identical signed ingests reuse the single winning release", async () => {
  const bundle = { cycles: [], natal: { sun_placement: "Published sun copy" } };
  const post = ingestRoute.Route.options.server.handlers.POST;
  h.requests.length = 0;
  const responses = await Promise.all(
    [0, 1].map(() =>
      post({
        request: signedRequest("http://test/ingest", { version: "3.0.0", bundle }),
      }),
    ),
  );
  assert.deepEqual(
    responses.map((response) => response.status),
    [200, 200],
  );
  const bodies = await Promise.all(responses.map((response) => response.json()));
  const rows = h.sqlite
    .prepare("SELECT version, checksum, bundle, is_active FROM content_releases")
    .all();
  assert.equal(rows.length, 1);
  assert.ok(bodies.every((body) => body.checksum === rows[0].checksum));
  assert.equal(rows[0].is_active, 1);
  assert.deepEqual(JSON.parse(rows[0].bundle), bundle);
  const audit = JSON.parse(
    h.sqlite.prepare("SELECT activation_audit FROM content_releases").get().activation_audit,
  );
  assert.equal(audit.length, 1, "identical overlapping uploads produce one activation");
  assert.ok(bodies.every((body) => body.publication.status === "complete"));
});

test("lifecycle: overlapping differing signed ingests return 409 and retain the winning content", async () => {
  const bundles = ["First published copy", "Different published copy"].map((copy) => ({
    cycles: [],
    natal: { sun_placement: copy },
  }));
  const post = ingestRoute.Route.options.server.handlers.POST;
  const responses = await Promise.all(
    bundles.map((bundle) =>
      post({
        request: signedRequest("http://test/ingest", { version: "3.0.0", bundle }),
      }),
    ),
  );
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const winner = responses.findIndex((response) => response.status === 200);
  const body = await responses[winner].json();
  const rows = h.sqlite.prepare("SELECT checksum, bundle, is_active FROM content_releases").all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].checksum, body.checksum);
  assert.equal(rows[0].is_active, 1);
  assert.deepEqual(JSON.parse(rows[0].bundle), bundles[winner]);
});

test("lifecycle: activation and rollback leave previous active row unchanged on invalid input", async () => {
  const validV1 = {
    version: "1.0.0",
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "V1 saturn mechanism",
        question: "V1 question?",
      },
    ],
  };
  const invalidV2 = {
    version: "2.0.0",
    schemaVersion: 2,
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "V2 saturn mechanism",
        question: "V2 question?",
      },
    ],
    synthesisRules: [
      {
        key: "invalid-rule",
        relationship: "tension",
        mechanism: "Tension mechanism",
        primary: { interpretationKey: "missing:parent", theme: "structure" },
        supporting: { interpretationKey: "missing:parent2", theme: "expansion" },
      },
    ],
  };

  const { data: r1 } = await h
    .records()
    .from("content_releases")
    .insert({
      version: "1.0.0",
      checksum: "chk-1",
      bundle: validV1,
      is_active: true,
    })
    .select("id")
    .single();

  const { data: r2 } = await h
    .records()
    .from("content_releases")
    .insert({
      version: "2.0.0",
      checksum: "chk-2",
      bundle: invalidV2,
      is_active: false,
    })
    .select("id")
    .single();

  // Activating invalid release must fail
  await assert.rejects(
    () => h.app.activateRelease(h.records(), h.userA, r2.id),
    /invalid|missing parent/i,
  );

  // Previous release must STILL be active
  const { data: stillActive } = await h
    .records()
    .from("content_releases")
    .select("id, is_active")
    .eq("id", r1.id)
    .single();
  assert.equal(Boolean(stillActive.is_active), true);

  // Rollback endpoint to invalid release must return 422 and leave r1 active
  const postRollback = rollbackRoute.Route.options.server.handlers.POST;
  const rollbackRes = await postRollback({
    request: signedRequest("http://test/rollback", { version: "2.0.0" }),
  });
  assert.equal(rollbackRes.status, 422);

  const { data: stillActiveAfterRollback } = await h
    .records()
    .from("content_releases")
    .select("id, is_active")
    .eq("id", r1.id)
    .single();
  assert.equal(Boolean(stillActiveAfterRollback.is_active), true);
});

test("lifecycle: signed ingestion enforces validation, idempotent replay, and 409 conflict on version reuse", async () => {
  const postIngest = ingestRoute.Route.options.server.handlers.POST;

  const validBundle = {
    version: "1.0.0",
    schemaVersion: 2,
    cycles: [
      {
        key: "square:saturn:sun",
        mechanism: "Valid square saturn mechanism",
        question: "Valid question?",
        themes: ["structure"],
      },
      {
        key: "trine:jupiter:mars",
        mechanism: "Valid jupiter mars mechanism",
        question: "Valid question?",
        themes: ["expansion"],
      },
    ],
    synthesisRules: [
      {
        key: "rule-1",
        relationship: "tension",
        mechanism: "Tension mechanism between square saturn and trine jupiter",
        primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
        supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
      },
    ],
  };

  // 1. Ingest invalid bundle -> 422
  const invalidRes = await postIngest({
    request: signedRequest("http://test/ingest", {
      version: "1.0.0",
      bundle: {
        ...validBundle,
        synthesisRules: [
          {
            ...validBundle.synthesisRules[0],
            primary: { interpretationKey: "missing", theme: "structure" },
          },
        ],
      },
    }),
  });
  assert.equal(invalidRes.status, 422);

  // 2. Ingest valid bundle -> 200
  const ingestRes = await postIngest({
    request: signedRequest("http://test/ingest", {
      version: "1.0.0",
      bundle: validBundle,
    }),
  });
  assert.equal(ingestRes.status, 200);
  const ingestJson = await ingestRes.json();
  assert.equal(ingestJson.ok, true);
  assert.equal(ingestJson.version, "1.0.0");
  const originalChecksum = ingestJson.checksum;

  // 3. Identical replay -> 200 with same checksum (idempotent)
  const replayRes = await postIngest({
    request: signedRequest("http://test/ingest", {
      version: "1.0.0",
      bundle: { ...validBundle }, // identical content
    }),
  });
  assert.equal(replayRes.status, 200);
  const replayJson = await replayRes.json();
  assert.equal(replayJson.checksum, originalChecksum);

  // 4. Conflicting reuse with different content -> 409
  const conflictRes = await postIngest({
    request: signedRequest("http://test/ingest", {
      version: "1.0.0",
      bundle: {
        ...validBundle,
        cycles: [
          ...validBundle.cycles,
          {
            key: "trine:saturn:sun",
            mechanism: "Different extra cycle",
            question: "Question?",
            themes: ["structure"],
          },
        ],
      },
    }),
  });
  assert.equal(conflictRes.status, 409);
});

test("lifecycle: an identical ingest retry after a failed activation completes that activation", async () => {
  await h
    .records()
    .from("content_releases")
    .insert({
      version: "1.0.0",
      checksum: "previous",
      bundle: { cycles: [], natal: { sun_placement: "Previous copy" } },
      is_active: true,
    });
  const bundle = { cycles: [], natal: { sun_placement: "Next copy" } };
  const post = () =>
    ingestRoute.Route.options.server.handlers.POST({
      request: signedRequest("http://test/ingest", { version: "2.0.0", bundle }),
    });
  const activeVersions = () =>
    h.sqlite
      .prepare("SELECT version FROM content_releases WHERE is_active = 1 ORDER BY version")
      .all()
      .map((row) => row.version);

  // Both pointer writes and the audit now roll back together on a middle failure.
  h.setFault({
    matches: (sql) => /^update content_releases set is_active=1/i.test(sql),
  });
  assert.equal((await post()).status, 409);
  assert.deepEqual(activeVersions(), ["1.0.0"]);

  h.setFault(null);
  h.requests.length = 0;
  const retry = await post();
  assert.equal(retry.status, 200);
  const body = await retry.json();
  assert.deepEqual(activeVersions(), ["2.0.0"]);
  const stored = h.sqlite
    .prepare("SELECT checksum FROM content_releases WHERE version = ?")
    .get("2.0.0");
  assert.equal(body.checksum, stored.checksum);
  assert.equal(
    body.publication.status,
    "complete",
    "the retry confirms immutable artifact and pointer delivery",
  );
  assert.ok(body.publication.artifactKey);
  assert.equal(
    h.requests.filter(({ sql }) => /^insert into "?content_releases"? /i.test(sql)).length,
    0,
    "the retry reuses the stored row and checksum",
  );

  // Once the release is active, a further identical replay changes nothing.
  h.requests.length = 0;
  const replay = await post();
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).workflowInstanceId, null);
  assert.equal(
    h.requests.filter(({ sql }) => /^update "?content_releases"? /i.test(sql)).length,
    0,
  );
});

test("lifecycle: a complete draft reply rewrites family slots only, keeps reviewed entries and rules, and drops unusable entries", async () => {
  const reviewed = [
    {
      key: "square:saturn:sun",
      mechanism: "Base saturn square sun mechanism",
      question: "Base question?",
      themes: ["structure"],
    },
    {
      key: "trine:jupiter:mars",
      mechanism: "Base jupiter trine mars mechanism",
      question: "Base question?",
      themes: ["expansion"],
    },
    {
      key: "trine:saturn:sun",
      mechanism: "Base saturn trine sun mechanism",
      question: "Base question?",
      themes: ["structure"],
    },
    {
      key: "trine:mars:sun",
      mechanism: "Base mars trine sun mechanism",
      question: "Base question?",
      themes: ["initiative"],
    },
  ];
  const softCatchAll = {
    key: "soft:*:*",
    mechanism: "Base soft catch-all mechanism",
    question: "Base question?",
    themes: ["rest"],
  };
  const baseBundle = {
    version: "1.0.0",
    schemaVersion: 2,
    cycles: [
      ...reviewed,
      {
        key: "hard:*:*",
        mechanism: "Base hard catch-all mechanism",
        question: "Base question?",
        themes: ["structure"],
      },
      softCatchAll,
    ],
    natal: { sun_placement: "Base natal sun" },
    phases: { approaching: "Base approaching" },
    domains: { work: { label: "Work", hard: "h", soft: "s", prompt: "p" } },
    synthesisRules: [
      {
        key: "rule-saturn-jupiter",
        relationship: "tension",
        mechanism: "Tension mechanism between saturn and jupiter",
        primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
        supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
      },
      {
        key: "rule-saturn-mars",
        relationship: "reinforcement",
        mechanism: "Reinforcement mechanism between saturn and mars",
        primary: { interpretationKey: "trine:saturn:sun", theme: "structure" },
        supporting: { interpretationKey: "trine:mars:sun", theme: "initiative" },
      },
    ],
  };

  await h.records().from("content_releases").insert({
    version: "1.0.0",
    checksum: "base-chk",
    bundle: baseBundle,
    is_active: true,
  });

  // The model answers every requested slot, as the prompt asks, and also repeats
  // a new slot, returns over-length copy, and adds an unrequested reviewed key.
  let requested = [];
  h.setGateway((body) => {
    const prompt = body.messages.find((message) => message.role === "user").content;
    requested = [...prompt.matchAll(/^(\S+) — /gm)].map((match) => match[1]);
    const entries = requested.map((key) => ({
      key,
      mechanism: key === "soft:*:*" ? "x".repeat(1001) : `Drafted copy for ${key}.`,
      question: "Drafted question?",
    }));
    entries.push(
      { key: "hard:jupiter:*", mechanism: "A repeated slot is ignored.", question: "Again?" },
      { key: "square:saturn:sun", mechanism: "Unrequested reviewed copy.", question: "Why?" },
    );
    return Response.json({ choices: [{ message: { content: JSON.stringify({ entries }) } }] });
  });

  const draftResult = await h.app.draftRelease(h.records(), h.userA);
  assert.equal(requested.length, 22);
  assert.ok(
    requested.every((key) => /^(hard|soft):/.test(key)),
    "reviewed exact-aspect entries are never sent for rewriting",
  );
  assert.equal(draftResult.entries, 21);
  assert.equal(draftResult.dropped, 3);

  const [draft] = await h.app.listDrafts(h.records(), h.userA);
  assert.equal(draft.notes.promptVersion, "bundle-draft-v2");
  assert.deepEqual(
    {
      requested: draft.notes.requested,
      returned: draft.notes.returned,
      dropped: draft.notes.dropped,
    },
    { requested: 22, returned: 21, dropped: 3 },
  );

  // Reviewed entries, their themes and both directional rules survive the draft.
  for (const entry of reviewed) {
    assert.deepEqual(
      draft.entries.find((c) => c.key === entry.key),
      entry,
    );
  }
  assert.deepEqual(
    draft.synthesisRules.map((rule) => rule.key),
    ["rule-saturn-jupiter", "rule-saturn-mars"],
  );
  assert.deepEqual(draft.removedRules, []);

  // Changed text loses inherited approval.
  assert.deepEqual(
    draft.entries.find((c) => c.key === "hard:*:*"),
    {
      key: "hard:*:*",
      mechanism: "Drafted copy for hard:*:*.",
      question: "Drafted question?",
      themes: [],
    },
  );
  // Unpublishable copy is dropped alone, leaving the base entry and its approval.
  assert.deepEqual(
    draft.entries.find((c) => c.key === "soft:*:*"),
    softCatchAll,
  );
  // New family slots join the full base bundle once, without reviewed themes; the
  // first reply for a repeated slot wins.
  assert.deepEqual(
    draft.entries.filter((c) => c.key === "hard:jupiter:*"),
    [
      {
        key: "hard:jupiter:*",
        mechanism: "Drafted copy for hard:jupiter:*.",
        question: "Drafted question?",
        themes: [],
      },
    ],
  );
  assert.equal(draft.entries.length, 26);
  assert.equal(draft.themeCount, 5);
  assert.equal(draft.ruleCount, 2);
  assert.ok(Array.isArray(draft.affectedKeys));
  assert.equal(draft.affectedKeys.length, 21);
  assert.ok(draft.affectedKeys.includes("hard:*:*"));
  assert.ok(draft.affectedKeys.includes("hard:jupiter:*"));
});
