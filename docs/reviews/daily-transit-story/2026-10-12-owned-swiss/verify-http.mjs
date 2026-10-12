import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
const [base, release, outFile] = process.argv.slice(2);
assert.ok(base && /^[0-9a-f]{40}$/.test(release) && outFile);
const root = process.cwd();
const evidence = path.join(root, 'docs/reviews/daily-transit-story/2026-10-12-owned-swiss');
const load = n => JSON.parse(fs.readFileSync(path.join(evidence,n)));
const qualification = load('qualification.json');
const report = { base, release, capturedAt: new Date().toISOString(), syntheticOnly: true, results: [] };
const vite = await createServer({root,configFile:false,envFile:false,resolve:{alias:{'@':path.join(root,'src')}},appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false}});
async function get(p) {
  const r=await fetch(base+p,{signal:AbortSignal.timeout(6000)});
  assert.equal(r.status,200,p);
  return r;
}
async function post(p,body,authenticated=true) {
  const start=performance.now();
  const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json',...(authenticated?{'x-api-key':process.env.SWISS_API_KEY}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(6000)});
  const raw=await r.text();
  assert.ok(Buffer.byteLength(raw)<=128*1024);
  return {status:r.status,body:JSON.parse(raw),durationMs:performance.now()-start};
}
try {
  const wire=await vite.ssrLoadModule('/src/lib/astro/transit-episodes.ts');
  const proof=await vite.ssrLoadModule('/src/lib/astro/transit-episode-proof.ts');
  report.health=await (await get('/health')).json();
  report.metadata=await (await get('/v1/engine')).json();
  assert.equal(report.health.release,release);
  assert.equal(report.health.sourceAvailable,true);
  assert.deepEqual(report.health.engine,qualification.source.source);
  assert.equal(report.health.sourceId,qualification.source.sourceId);
  assert.equal(report.metadata.release,release);
  assert.deepEqual(report.metadata.files,qualification.source.files);
  report.sourceOffer=await (await get('/source')).json();
  assert.equal(report.sourceOffer.release,release);
  const archive=Buffer.from(await (await get('/source.tar.gz')).arrayBuffer());
  report.sourceArchive={bytes:archive.length,sha256:createHash('sha256').update(archive).digest('hex')};
  fs.writeFileSync(outFile+'.source.tar.gz',archive,{mode:0o600});
  const chart={date:'1990-05-15',time:'19:34:00',timezoneOffset:0,latitude:34.0522,longitude:-118.2437};
  assert.equal((await post('/v1/chart',chart,false)).status,401);
  assert.equal((await post('/v1/transit-episodes',load('cases.json')[0].request,false)).status,401);
  report.unauthenticatedStatus=401;
  for(const label of ['first-chart','subsequent-chart']) {
    const r=await post('/v1/chart',chart);
    assert.equal(r.status,200);
    assert.deepEqual(r.body.data.positionSource,qualification.source.source);
    assert.equal(r.body.data.houses.system,'P');
    report.results.push({id:label,...r});
  }
  for(const item of load('cases.json')) {
    const r=await post('/v1/transit-episodes',item.request);
    assert.equal(r.status,200,item.id);
    proof.validateEpisodeProof(wire.parseTransitEpisodeScan(r.body,item.request));
    assert.deepEqual(r.body,load(item.id+'.json').scan,item.id+' differs from numerically qualified scan');
    report.results.push({id:item.id,status:r.status,durationMs:r.durationMs,exactQualifiedScanMatch:true,appProofAccepted:true,scan:r.body});
  }
  for(const item of load('native-omissions.json').results) {
    const r=await post('/v1/transit-episodes',item.request);
    assert.equal(r.status,422,item.id);
    assert.equal(r.body.error,item.reason,item.id);
    report.results.push({id:item.id,...r});
  }
  report.passed=true;
} catch(error) {
  report.passed=false;
  report.error=error.message;
  process.exitCode=1;
} finally {
  await vite.close();
  fs.writeFileSync(outFile,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,results:report.results.length,maxDurationMs:Math.max(0,...report.results.map(r=>r.durationMs)),sourceId:report.health?.sourceId,error:report.error}));
}
