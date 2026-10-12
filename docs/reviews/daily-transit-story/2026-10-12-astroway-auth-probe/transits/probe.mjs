import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const key=process.env.ASTROWAY_API_KEY;
assert.ok(key);
const out='/home/ubuntu/.local/state/pixel-perfect-view-757/combined-release/20261012/astroway-transits-probe';
await mkdir(out,{mode:0o700});
const natal={date:'1990-01-01',time:'12:00:00',timezoneOffset:0,latitude:0,longitude:0,houseSystem:'P'};
const jobs=[{id:'transits',url:'https://api.astroway.info/v1/transits',input:{...natal,transitDate:'2026-10-12',transitTime:'12:00:00',transitTzOffset:0}}];
const receipts=[];
function clean(value){
 if(Array.isArray(value))return value.map(clean);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/api.?key|authorization|access.?token|refresh.?token|secret/i.test(k)?'[redacted]':clean(v)]));
 return typeof value==='string'?value.split(key).join('[redacted]'):value;
}
for(const job of jobs){
 const started=new Date().toISOString(),tick=performance.now();
 let record;
 try{
  const response=await fetch(job.url,{method:'POST',redirect:'error',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify(job.input),signal:AbortSignal.timeout(30000)});
  const body=await response.text();
  let payload;try{payload=clean(JSON.parse(body));}catch{payload={nonJson:body.split(key).join('[redacted]').slice(0,1200)};}
  record={id:job.id,url:job.url,synthetic:true,input:job.input,startedAt:started,elapsedMs:Math.round(performance.now()-tick),httpStatus:response.status,payload};
 }catch(error){record={id:job.id,url:job.url,synthetic:true,input:job.input,startedAt:started,elapsedMs:Math.round(performance.now()-tick),httpStatus:null,errorName:error.name};}
 await writeFile(`${out}/${job.id}.json`,JSON.stringify(record,null,2)+'\n',{flag:'wx',mode:0o600});
 const summary={id:record.id,httpStatus:record.httpStatus,elapsedMs:record.elapsedMs,topLevelKeys:Object.keys(record.payload??{}),dataKeys:Object.keys(record.payload?.data??{}),errorCode:record.payload?.error?.code??record.errorName??null};
 receipts.push(summary);console.log(JSON.stringify(summary));
 if(record.httpStatus!==200)break;
}
await writeFile(`${out}/receipt.json`,JSON.stringify({atUTC:new Date().toISOString(),requests:receipts.length,retries:0,realBirthDataUsed:false,receipts},null,2)+'\n',{flag:'wx',mode:0o600});
