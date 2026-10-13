import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

test("schema-4 composition invalidates the former same-day cache while preserving saved text, sources and feedback", async () => {
  let legacy = true;
  const contexts = [];
  // Feed the previous cache policy into the real HMAC/SQL path to seed a saved
  // row. This hook changes only the daily cache identity, not storage or reads.
  globalThis.__patternPrimaryCacheFixture = (context) => {
    if (context?.version !== "daily-privacy-3") return context;
    contexts.push(structuredClone(context));
    if (!legacy) return context;
    const { compositionVersion: _composition, reflectionVersion: _reflection, ...old } = context;
    return { ...old, promptVersion: "daily-astro-body-13" };
  };
  const h = await createRecordsHarness({
    plugins: [
      {
        name: "historical-primary-cache-policy",
        enforce: "pre",
        transform(code, id) {
          if (!id.endsWith("/src/lib/crypto.server.ts")) return;
          const signature =
            "export async function keyedFingerprint(userId: string, context: unknown): Promise<string> {";
          assert.ok(code.includes(signature));
          return code.replace(
            signature,
            signature + "\ncontext = globalThis.__patternPrimaryCacheFixture(context);",
          );
        },
      },
    ],
  });
  try {
    const { bundles } = JSON.parse(
      await readFile(
        new URL(
          "../docs/reviews/content-draft-effectiveness/2026-10-13/pilot/frozen-pair.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const bundle = { ...bundles.candidate, version: "0.7.99" };
    const { contentChecksum } = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
    assert.equal(
      (
        await h
          .records()
          .from("content_releases")
          .insert({
            version: bundle.version,
            bundle,
            checksum: await contentChecksum(bundle),
            is_active: true,
          })
      ).error,
      null,
    );
    const fixture = await h.seedChart(h.records(), h.userA);
    const first = await h.app.getToday(h.records(), h.userA, "UTC");
    const oldId = first.reading.id;
    const oldPrompt = "What might fit today? Which description of yourself is out of date?";
    h.sqlite.prepare("UPDATE daily_readings SET prompt=? WHERE id=?").run(oldPrompt, oldId);
    await h.app.submitFeedback(h.records(), h.userA, oldId, 1, []);
    const before = Object.fromEntries(
      ["daily_readings", "reading_sources", "reading_feedback"].map((table) => [
        table,
        h.sqlite
          .prepare(
            `SELECT * FROM ${table} WHERE ${table === "daily_readings" ? "id" : "reading_id"}=?`,
          )
          .all(oldId),
      ]),
    );
    legacy = false;
    const next = await h.app.getToday(h.records(), h.userA, "UTC");
    assert.notEqual(next.reading.id, oldId);
    assert.notEqual(next.reading.prompt, oldPrompt);
    assert.equal((await h.app.getToday(h.records(), h.userA, "UTC")).reading.id, next.reading.id);
    assert.equal(contexts.at(-1).compositionVersion, "primary-composition-1");
    assert.equal(contexts.at(-1).reflectionVersion, "primary-reflection-1");
    for (const [table, rows] of Object.entries(before))
      assert.deepEqual(
        h.sqlite
          .prepare(
            `SELECT * FROM ${table} WHERE ${table === "daily_readings" ? "id" : "reading_id"}=?`,
          )
          .all(oldId),
        rows,
      );
    assert.equal(
      await h.cryptoModule.decryptField(fixture.dek, before.daily_readings[0].body_ct),
      first.reading.body,
    );
    assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  } finally {
    await h.close();
    delete globalThis.__patternPrimaryCacheFixture;
  }
});
