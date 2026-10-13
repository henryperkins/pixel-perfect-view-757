import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { main } from "../scripts/evaluate-readings.mjs";

const archived = new URL(
  "../docs/reviews/content-draft-effectiveness/2026-10-13/pilot/",
  import.meta.url,
).pathname;
const workerd = process.env.PATTERN_TEST_WORKERD;
test(
  "strict archived-source workerd replay reproduces captured requests and outputs without provider calls",
  { skip: !workerd },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "pattern-workerd-replay-test-"));
    try {
      for (const arm of ["baseline", "candidate"]) {
        const output = join(directory, `${arm}.json`);
        await main([
          "--replay-content-workerd",
          `${archived}${arm}-report.json`,
          "--content-plan",
          `${archived}frozen-pair.json`,
          "--arm",
          arm,
          "--workerd",
          workerd,
          "--output",
          output,
        ]);
        const report = JSON.parse(await readFile(output, "utf8"));
        assert.equal(report.sourceComparison.matchingOutputs, 4);
        assert.equal(report.sourceComparison.matchingRequests, 4);
        assert.equal(report.summary.modelAttempts, 0);
        assert.equal(report.summary.capturedResponsesReplayed, 4);
        assert.equal(report.qualified, false);
        assert.equal(report.replayRuntime.sourceSha, "82efe38df4c5ee571d6c583de144498c93f596f1");
        assert.equal(
          report.replayRuntime.network,
          "denied by workerd configuration; fetch intercepted in memory",
        );
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
