import json,subprocess,sys
from pathlib import Path
session,source,destination=sys.argv[1:]
p=Path(destination)
result=subprocess.run(['/home/ubuntu/.codex/skills/playwright/scripts/playwright_cli.sh','--session',session,'run-code','--filename',source],capture_output=True,text=True)
p.with_suffix('.txt').write_text(result.stdout+result.stderr)
if result.returncode: print(result.stdout[-2500:]+result.stderr[-1000:]);raise SystemExit(result.returncode)
try:
 data=json.loads(result.stdout.split('### Result\n',1)[1].split('\n### ',1)[0].strip())
except Exception:
 print(result.stdout[-3500:]);raise
p.write_text(json.dumps(data,indent=2)+'\n')
checks=data.get('checks',data.get('results',[]))
failed=[x for x in checks if not x.get('passed',x.get('pass',False))]
print(json.dumps({'output':str(p),'engine':data.get('engine'),'total':len(checks),'passed':len(checks)-len(failed),'failed':failed},ensure_ascii=False))
raise SystemExit(1 if failed else 0)
