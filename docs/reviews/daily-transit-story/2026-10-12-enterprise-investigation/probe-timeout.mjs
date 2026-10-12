// Offline investigation only: real app modules, fake provider, short simulated deadline.
// No source edits and no network requests to a model provider.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRecordsHarness } from '/home/ubuntu/pixel-perfect-view-757/.worktrees/integrate-planning-natal-transit-20261011/tests/helpers/records-harness.mjs';

const base = new URL('./', import.meta.url);
const report = JSON.parse(await readFile(new URL('source-report.json', base), 'utf8'));
const sourceCase = report.cases.find((item) => item.id === 'saturn-square-sun');
const originalTimeout = AbortSignal.timeout;
const observations = [];
let h;
try {
  h = await createRecordsHarness();
  const { runSyntheticEvaluationCase } = await h.vite.ssrLoadModule('/src/lib/ai/reading-evaluation.server.ts');
  const { TRANSIT_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule('/src/lib/content/transit-candidate-bundle.ts');
  for (const scenario of ['immediate_valid', 'waiting_for_headers', 'waiting_for_body', 'http_504']) {
    await h.reset();
    const requestedDeadlines = [];
    AbortSignal.timeout = (ms) => {
      requestedDeadlines.push(ms);
      return originalTimeout(25);
    };
    const untilAbort = (signal) => new Promise((_resolve, reject) => {
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
    let headersObserved = false;
    let bodyReadStarted = false;
    h.setGeminiEnterprise((_body, init) => {
      if (scenario === 'waiting_for_headers') return untilAbort(init.signal);
      headersObserved = true;
      if (scenario === 'http_504') return Response.json({ error: { status: 'DEADLINE_EXCEEDED' } }, { status: 504 });
      if (scenario === 'waiting_for_body') return {
        ok: true,
        status: 200,
        json: () => { bodyReadStarted = true; return untilAbort(init.signal); },
      };
      return Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ paragraphs: sourceCase.candidate.paragraphs }) }] }, finishReason: 'STOP' }],
        modelVersion: 'provider-version-sentinel',
        responseId: 'response-id-sentinel',
        usageMetadata: { promptTokenCount: 2000, candidatesTokenCount: 200, thoughtsTokenCount: 8000, totalTokenCount: 10200 },
      });
    });
    // AbortSignal.timeout uses an unref timer; keep the process alive during the simulated wait.
    const keepAlive = setInterval(() => {}, 100);
    let result;
    try { result = await runSyntheticEvaluationCase(sourceCase.id, TRANSIT_CANDIDATE_BUNDLE, 'gemini-enterprise'); }
    finally { clearInterval(keepAlive); }
    const generated = h.geminiEnterpriseRequests[0];
    const record = {
      scenario, simulatedDeadlineMs: 25, requestedDeadlines,
      headersObserved, bodyReadStarted, diagnostics: result.case.diagnostics,
      candidateCaptured: result.case.candidate !== null,
      providerCalls: h.geminiEnterpriseRequests.length,
      generationConfigKeys: Object.keys(generated.generationConfig),
      exportedUsageMetadata: JSON.stringify(result).includes('thoughtsTokenCount'),
      exportedResponseId: JSON.stringify(result).includes('response-id-sentinel'),
      exportedObservedModelVersion: JSON.stringify(result).includes('provider-version-sentinel'),
      requestMatchesUploaded: JSON.stringify(result.case.request) === JSON.stringify(sourceCase.request),
      templateMatchesUploaded: result.case.template.body === sourceCase.template.body,
    };
    assert.equal(record.providerCalls, 1);
    assert.deepEqual(requestedDeadlines, [60_000]);
    assert.equal(record.requestMatchesUploaded, true);
    assert.equal(record.templateMatchesUploaded, true);
    assert.equal(record.exportedUsageMetadata, false);
    assert.equal(record.exportedResponseId, false);
    assert.equal(record.exportedObservedModelVersion, false);
    if (scenario === 'immediate_valid') assert.equal(record.diagnostics.code, 'accepted');
    else {
      assert.equal(record.diagnostics.code, 'timeout');
      assert.equal(record.candidateCaptured, false);
      assert.equal(result.case.output.body, result.case.template.body);
    }
    observations.push(record);
  }
  await writeFile(new URL('offline-timeout-probe.json', base), JSON.stringify({
    kind: 'offline-provider-boundary-probe',
    warning: 'Simulated 25 ms waits test diagnostic classification, not Gemini latency. Provider calls are intercepted by the local harness.',
    scenariosPassed: observations.length, observations,
  }, null, 2) + '\n');
  console.log(JSON.stringify({ scenariosPassed: observations.length, observations }, null, 2));
} finally {
  AbortSignal.timeout = originalTimeout;
  await h?.close();
}
