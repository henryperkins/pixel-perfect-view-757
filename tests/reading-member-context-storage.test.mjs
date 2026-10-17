import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";

test("reviewed member context activation creates a new encrypted Today row and rollback restores the prior reading without additional model requests", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-17T12:00:00Z") });
  const h = await createRecordsHarness();
  try {
    await seedTransitReading(h);
    h.setEpisode(null);
    const bundle = JSON.parse(
      await readFile(
        new URL("../src/lib/content/context-pilot-bundle.json", import.meta.url),
        "utf8",
      ),
    );
    const { contentChecksum } = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
    h.sqlite
      .prepare("UPDATE content_releases SET version=?,bundle=?,checksum=?")
      .run(bundle.version, JSON.stringify(bundle), await contentChecksum(bundle));
    await h.app.updatePrefs(h.records(), h.userA, "Synthetic member", "warm", "standard");
    await h.app.setConsent(h.records(), h.userA, "USR-01", true);
    await h.app.setConsent(h.records(), h.userA, "USR-02", true);
    h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
    const before = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.equal(before.reading.primary_cycle_key, "saturn_square_sun");
    const baselineAttempts = h.gatewayRequests.length + h.geminiEnterpriseRequests.length;
    await h.app.submitFeedback(h.records(), h.userA, before.reading.id, 1, []);
    const old = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(before.reading.id);
    const { memberContextPolicyIdentity } = await h.vite.ssrLoadModule(
      "/src/lib/ai/member-context-rollout.server.ts",
    );
    const policy = {
      version: "daily-member-context-rollout-1",
      releaseVersion: "0.9.0",
      provider: "gemini-enterprise",
      render: "authored",
      modes: ["contact-only"],
      policy: memberContextPolicyIdentity(),
      reviewId: "a".repeat(64),
    };
    h.sqlite
      .prepare("UPDATE content_releases SET writer_rollout=? WHERE is_active=1")
      .run(JSON.stringify(policy));
    const next = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.notEqual(
      next.reading.id,
      before.reading.id,
      "activation must invalidate the previous same-day cache branch",
    );
    const diagnostics = JSON.parse(
      h.sqlite.prepare("SELECT language_meta FROM daily_readings WHERE id=?").get(next.reading.id)
        .language_meta,
    ).diagnostics;
    assert.equal(diagnostics.code, "authored_context");
    assert.equal(diagnostics.attempted, false);
    assert.equal(next.language.dailyWriting.status, "saved");
    assert.equal(next.language.dailyWriting.evidence.reflection.variant, "context");
    const runtime = JSON.parse(
      await readFile(
        new URL("../src/lib/ai/member-context-readings.json", import.meta.url),
        "utf8",
      ),
    ).cases.find((c) => c.id === "contact-only");
    assert.equal(next.reading.headline, runtime.headline);
    assert.equal(next.reading.prompt, runtime.reflection);
    assert.equal(next.reading.body, runtime.paragraphs.map((p) => p.text).join("\n\n"));
    const row = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(next.reading.id);
    assert.equal(row.prompt, null);
    assert.ok(!row.language_meta.includes(runtime.reflection));
    assert.equal(
      await h.cryptoModule.decryptField(await h.app.getDek(h.records(), h.userA), row.body_ct),
      next.reading.body,
    );
    h.reopen();
    const cached = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.deepEqual(cached.reading, next.reading);
    assert.deepEqual(cached.language.dailyWriting, next.language.dailyWriting);
    const exported = await h.app.exportEverything(h.records(), h.userA);
    assert.equal(exported.readings.find((r) => r.id === next.reading.id).body, next.reading.body);
    h.sqlite.prepare("UPDATE content_releases SET writer_rollout=NULL WHERE is_active=1").run();
    const rolled = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.equal(rolled.reading.id, before.reading.id);
    assert.deepEqual(
      h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(before.reading.id),
      old,
    );
    assert.equal(
      h.sqlite
        .prepare("SELECT COUNT(*) n FROM reading_feedback WHERE reading_id=?")
        .get(before.reading.id).n,
      1,
    );
    assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings").get().n, 2);
    assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, baselineAttempts);
  } finally {
    await h.close();
  }
});

test("all five runtime fallback plans and independent reflections satisfy archive validation with frozen question binding", async () => {
  const h = await createRecordsHarness();
  try {
    const { contextWritingFixture, readContextBenchmarks } =
      await import("./helpers/context-writing-fixture.mjs");
    const { prepareMemberContextReading } = await h.vite.ssrLoadModule(
      "/src/lib/ai/member-context-reading.ts",
    );
    const { generateReadingProse } = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
    const { validateSavedDailyWriting } = await h.vite.ssrLoadModule(
      "/src/lib/content/daily-writing-storage.server.ts",
    );
    const { DAILY_REFLECTION_VERSION } = await h.vite.ssrLoadModule(
      "/src/lib/content/daily-reflection.ts",
    );
    for (const benchmark of (await readContextBenchmarks()).cases) {
      const { input } = await contextWritingFixture(h, benchmark);
      const prepared = prepareMemberContextReading(input);
      const prose = await generateReadingProse(prepared, {
        contextModes: [benchmark.id],
        contextRenderMode: "authored",
      });
      assert.equal(prose.meta.diagnostics.code, "authored_context");
      const reflection = {
        version: DAILY_REFLECTION_VERSION,
        question: prepared.fallback.prompt,
        themeFactId: prepared.writing.plan.theme.factId,
        frameKey: null,
        variant: "context",
        localSource: null,
      };
      const saved = {
        version: 1,
        readingId: "runtime-reading",
        snapshotId: "runtime-snapshot",
        releaseVersion: "0.9.0",
        primaryCycleKey: "saturn_square_sun",
        plan: prepared.writing.plan,
        ...prose.meta.writing,
        reflection,
        legacySourceQuestion: reflection.question,
        effectiveTimezone: "UTC",
        astroParagraphCount: prose.paragraphs.length,
        historyAvailability: { status: "available", inspected: 0, retainedDays: 0, omissions: [] },
      };
      const row = {
        id: saved.readingId,
        snapshot_id: saved.snapshotId,
        release_version: "0.9.0",
        primary_cycle_key: saved.primaryCycleKey,
        headline: prose.headline,
        language_mode: "template",
        language_meta: { astroParagraphCount: prose.paragraphs.length },
      };
      validateSavedDailyWriting(saved, row, prepared.facts, prose.paragraphs, prose.meta.citations);
      const altered = structuredClone(saved);
      altered.reflection.question = "What else could fit today?";
      assert.throws(
        () =>
          validateSavedDailyWriting(
            altered,
            row,
            prepared.facts,
            prose.paragraphs,
            prose.meta.citations,
          ),
        /question|reflection/i,
      );
    }
    assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  } finally {
    await h.close();
  }
});
