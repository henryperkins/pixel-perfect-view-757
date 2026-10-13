import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
let vite, voice;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  voice = await vite.ssrLoadModule("/src/lib/ai/daily-voice.ts");
});
after(async () => await vite?.close());
test("all six complete demonstrations share isolated sources and retain paragraph, citation and timing bounds", () => {
  assert.equal(voice.DAILY_VOICE_EXAMPLES_VERSION, "daily-voice-examples-1");
  const cards = { standard: new Set(), technical: new Set() };
  for (const tone of ["plain", "warm", "clinical"])
    for (const depth of ["standard", "technical"]) {
      const example = voice.DAILY_VOICE_EXAMPLES[tone][depth];
      cards[depth].add(example.sourceCard);
      assert.equal(example.paragraphs.length, depth === "technical" ? 3 : 2);
      for (const [i, p] of example.paragraphs.entries()) {
        assert.equal(
          [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(p.text)].length,
          4,
        );
        assert.ok(p.text.length <= 1600);
        assert.ok(p.facts.every((id) => id.startsWith("EX-")));
        assert.deepEqual(p.scenes, i < 2 ? [`EX-SC${i + 1}`] : []);
      }
      if (depth === "technical") {
        assert.match(example.paragraphs[2].text, /1\.2°[.]|1\.2°/);
        assert.match(example.paragraphs[2].text, /2026-10-15/);
        assert.ok(
          !example.paragraphs[2].text
            .split(". ")
            .some((s) => s.includes("1.2°") && s.includes("2026-10-15")),
        );
      }
      const guide = voice.dailyVoice(tone, depth, true);
      assert.ok(guide.includes(example.paragraphs[0].text));
      assert.ok(guide.includes("example content never supplies"));
      assert.ok(guide.includes("EX-SC1"));
    }
  assert.equal(cards.standard.size, 1);
  assert.equal(cards.technical.size, 1);
  assert.ok(!voice.dailyVoice("plain", "standard", false).includes("EX-SC1"));
});
