from pathlib import Path
from datetime import datetime, timezone
import copy, hashlib, json, subprocess

ROOT=Path('/home/ubuntu/pixel-perfect-view-757')
D=Path(__file__).resolve().parent
PRIOR=ROOT/'output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a'
r=json.loads((PRIOR/'run.json').read_text())
now=datetime.now(timezone.utc).isoformat()
ref=lambda name:str(D/name)
old_checks={c['id']:c for c in r['checks']}
old_build=copy.deepcopy(next(b for b in r['builds'] if b['id']=='B-PILOT'))
new_build=copy.deepcopy(old_build)
new_build.update(id='B-LOCAL-FIX',description='Uncommitted F-01/F-03 local build; see source-identity.json for HEAD plus exact dirty file hashes; Vite bootstrap and member APIs remain substituted',contains_fixes=['F-01','F-03'],source_identity=ref('source-identity.json'))
r['builds'].append(new_build)
baseline=copy.deepcopy(old_build);baseline.update(id='B-RESUME-BASE',description='Source before the authorized F-01/F-03 edits; same original application bytes, new isolated launcher/cache on port 4208')
r['builds'].append(baseline)
phone=copy.deepcopy(next(b for b in r['builds'] if b['id']=='B-PHONE'))
phone.update(id='B-PHONE-LOCAL',description='Planned source-matched non-production phone build of the local F-01/F-03 changes; not provisioned/deployed; confirm actual source hashes and backend before writes',expected_source_identity=ref('source-identity.json'))
r['builds'].append(phone)
for s in r['standing_substitutions']:s['build_ids'] += ['B-LOCAL-FIX','B-RESUME-BASE']
r.update(parent_run_file=str(PRIOR/'run.json'),run_id=r['run_id']+'-local-'+D.name,created_at=now,mode='audit_and_fix',operation='audit',device_dependent_fixes='propose_only',dirty_before=(D/'baseline-status.txt').read_text().strip(),scope_of_this_continuation={'fix':['F-01','F-03'],'investigate_only':['F-02'],'exclusions':['device-dependent application changes','commit','push','deployment','plugin or dependency updates']},local_source_identity=ref('source-identity.json'))
r['scope']['included'] += ['src/components/pattern/RouteFocus.tsx','src/routes/__root.tsx route focus wiring']
r['scope']['excluded']=[x for x in r['scope']['excluded'] if x!='source changes']+['all source changes outside the explicit F-01/F-03 fixes and regression fixture']
r['impeccable'].update(status='executed',reason='Reused already-loaded project context in this live project session; followed harden/craft-floor and scanned changed application files. No context/config/plugin/dependency update.',evidence=r['impeccable']['evidence']+[ref('impeccable-changed.json')])
r['launch'].update(status='started',url='http://127.0.0.1:4208/',pid=1177198,log=ref('server.log'),evidence=[ref('server.log'),ref('confirm-chromium.json'),ref('confirm-webkit.json')],reason='New owned loopback fixture; normal import entry and fresh cache; real shared RouteFocus runs in fixture and production root')
for cap in r['capabilities']:
 if cap['id']=='CAP-SOURCE':cap['evidence'].append(ref('source-identity.json'))
 if cap['id']=='CAP-NODE':cap['evidence']=[ref('npm-test.txt'),ref('validation.json')]
 if cap['id'] in ['CAP-CHROMIUM','CAP-WEBKIT']:cap['evidence'].append(ref('confirm-'+cap['id'].split('-')[1].lower()+'.json'))

def fresh(cid,oldid,actual,evidence,status='pass',build='B-LOCAL-FIX',covers=None,extra=None):
 c=copy.deepcopy(old_checks[oldid]);c.update(id=cid,replaces_check_id=oldid,build_id=build,status=status,actual=actual,evidence=evidence,required=True,reason='' if status in ['pass','fail'] else actual)
 c['conditions']['build_id']=build
 if covers is not None:c['covers']=covers
 if extra is not None:c['substitutions']['additional']=extra
 r['checks'].append(c);return c

for engine,tag in [('chromium','CH'),('webkit','WK')]:
 b=json.loads((D/f'confirm-{engine}.json').read_text())
 f=json.loads((D/f'route-focus-{engine}-final.json').read_text())
 fresh(f'C-L-{tag}-CONTRAST',f'C-{tag}-CONTRAST','Field border/outer: 5.217826 light, 6.645490 dark; both >3:1; no global token change',[ref(f'confirm-{engine}.json'),ref(f'{engine}-today-390.png')])
 c=fresh(f'C-L-{tag}-FOCUS',f'C-{tag}-FOCUS','Seven route-focus regression cases passed, including PUSH, REPLACE, field focus through same-page/refresh, initial/reload, menu, Back/Forward, and cross-route hash targets',[ref(f'route-focus-{engine}-final.json'),str(ROOT/'tests/helpers/mobile-ui/route-focus.cases.txt')])
 c['scenario']='Confirm F-03 destination focus and preservation of existing route/menu/history behavior'
 fresh(f'C-L-{tag}-LAYOUT',f'C-{tag}-LAYOUT','Nine layouts/text samples; zero document overflow; both themes remain usable',[ref(f'confirm-{engine}.json')])
 fresh(f'C-L-{tag}-AXE',f'C-{tag}-AXE','Zero axe violations in light and dark on the changed local source',[ref(f'confirm-{engine}.json')])
 fresh(f'C-L-{tag}-JOURNEY',f'C-{tag}-JOURNEY','One complete save/reload journey passed with both bands and Unicode note; this observation does not close intermittent F-02',[ref(f'confirm-{engine}.json')],covers=[])
fresh('C-L-UNIT','C-UNIT','Full npm test: 1211 tests; 1207 passed, zero failed, four explicit Swiss/workerd skips',[ref('npm-test.txt'),ref('validation.json')],build='B-LOCAL-FIX')['scenario']='Run full existing application test suite on local changes'
red=fresh('C-L-FOCUS-RED','C-CH-FOCUS','Before implementation the destination-focus browser case failed with activeElement BODY; five preservation cases passed',[ref('route-focus-chromium-red.json')],status='fail',build='B-RESUME-BASE')
red['required']=False
for cid,name,build in [('C-L-F02-BASE','f02-webkit-before.json','B-RESUME-BASE'),('C-L-F02-LOCAL','f02-main-focus-control.json','B-LOCAL-FIX')]:
 c=fresh(cid,'C-WK-MOUSE','Observed failures originate in unchanged Shell.revealFocus: transient MAIN focus results in scrollBy(-809) while pointer is down. Diagnostic substitutions and separate trial counts are retained in the referenced report',[ref(name),ref('f02-investigation.md')],status='fail',build=build)
 c['scenario']='Investigate F-02 with pass-through scroll/focus stacks and bounded disposable controls'
 c['substitutions']['additional']={'status':'known','items':[{'boundary':'diagnostic browser instrumentation','description':'Pass-through scroll/focus wrappers plus separately labeled disposable router/focus-event controls','behavior':'replaced','configured_response':'See each group in raw JSON: ordinary tracing, extra settling, router-managed hash, scroll restoration disabled, or main-focus event suppression; controls are not active in the application build','real_components':'Real Shell, native radio labels/inputs, routes and ordinary RouteFocus where build includes it','untested':'Physical Safari, exact proposed Shell guard, real keyboards and device regressions'}],'unknown_boundaries':[],'evidence':[ref(name)],'reason':'Every control is a separate group, never an application fix or a target pass'}

for f in r['findings']:
 f.setdefault('status_history',[]).append({'at':now,'previous_status':f['status'],'operation':'authorized local fixes and bounded investigation'})
 if f['id']=='F-01':
  f['status']='implemented';f['location']='src/components/pattern/TodayCheckIn.tsx:469'
  f['fix'].update(applied=True,device_dependent=False,build_id='B-LOCAL-FIX',evidence=[ref('changes.patch'),ref('source-identity.json')],required_check_ids=['C-L-CH-CONTRAST','C-L-WK-CONTRAST'])
  f['current_result']='Existing muted-foreground token now supplies only the reflection textarea border. Local contrast passes in both engines/themes; physical target verification remains unrun.'
  f['verification_ids'] += ['C-L-CH-CONTRAST','C-L-WK-CONTRAST']
 elif f['id']=='F-03':
  f['status']='implemented';f['location']='src/components/pattern/RouteFocus.tsx; src/routes/__root.tsx persistent root wiring'
  f['fix'].update(applied=True,device_dependent=False,build_id='B-LOCAL-FIX',evidence=[ref('changes.patch'),ref('source-identity.json')],required_check_ids=['C-L-CH-FOCUS','C-L-WK-FOCUS'])
  f['current_result']='Persistent root observer focuses destination main after rendered PUSH/REPLACE; it skips initial/reload, same-path/hash/query, Back/Forward and destination-owned focus. Seven maintained browser cases pass per engine. Real AT/phone verification remains unrun.'
  f['verification_ids'] += ['C-L-CH-FOCUS','C-L-WK-FOCUS']
 else:
  f['cause']='Proxy traces isolate unchanged Shell.revealFocus acting while MAIN#main-content is transiently active during radio-label mouse activation. It measures the entire main rectangle and calls scrollBy(-809), moving the label before pointer-up. Exact physical Safari occurrence remains unestablished.'
  f['evidence'] += [{'ref':ref('f02-webkit-before.json'),'level':'proxy','observation':'Four failures across twenty before-fix diagnostic trials; immediate failing scroll stacks point to Shell.revealFocus, including when router settlement was awaited','scope_ids':['webkit-mouse-390']},{'ref':ref('f02-main-focus-control.json'),'level':'proxy','observation':'Changed-build ordinary group failed once in six; active element MAIN, rect y=-718, scrollBy(-809). Disposable main-focus event suppression had zero misses in six and counted two suppressed events per trial. No exact guard patch applied.','scope_ids':['webkit-mouse-390']}]
  f['fix']['proposal']='Proposed only: exclude the main landmark itself from focus-clearance targeting while retaining real control/radio label clearance. Exact diff and device conditions are documented in f02-investigation.md; no Shell/viewport/gesture/history application edit.'
  f['verification_ids'] += ['C-L-F02-BASE','C-L-F02-LOCAL']
 f['reason']='Current user authorized only F-01/F-03 ordinary local fixes and F-02 investigation. Implemented is distinct from target Verified.'

r['changes']=[{'path':p,'summary':summary,'finding_ids':[fid]} for p,summary,fid in [
 ('src/components/pattern/TodayCheckIn.tsx','Use existing contrasting token for only the reflection textarea border','F-01'),
 ('src/components/pattern/RouteFocus.tsx','Observe completed new route navigation and place destination main focus without taking over history/anchors or deliberate focus','F-03'),
 ('src/routes/__root.tsx','Mount RouteFocus once in the persistent application root','F-03'),
 ('tests/helpers/mobile-ui/main.tsx','Run the same real RouteFocus in the isolated fixture root','F-03'),
 ('tests/helpers/mobile-ui/route-focus.cases.txt','Seven maintained real-browser focus/navigation regression cases','F-03')]]

old_script=r['device_script'];r['device_script']=[]
for i,oldid in enumerate(old_script,1):
 old=old_checks[oldid];new=copy.deepcopy(old);cid=f'C-LD{i:02d}'
 new.update(id=cid,replaces_check_id=oldid,build_id='B-PHONE-LOCAL',reason='No phone-accessible build/backend or physical device has been provisioned; confirm current local source identity before execution')
 new['conditions']['build_id']='B-PHONE-LOCAL'
 new['steps'][0]='Confirm a non-production phone build containing F-01 and F-03 matches source-identity.json and record all actual test-backend/build/setup substitutions. '+new['steps'][0]
 old.update(required=False,replaced_by=cid)
 new['related_finding_ids']=['F-01','F-02','F-03'] if i in [1,4] else ['F-03'] if i in [5,6] else []
 r['checks'].append(new);r['device_script'].append(cid)
for a in r['coverage']:
 a['check_ids'] += [c['id'] for c in r['checks'] if c['id'].startswith('C-L-') and c.get('replaces_check_id') in a['check_ids']]
 a['remaining']=[s.replace('C-D','C-LD') for s in a['remaining']]
 if a['id'] in [4,6,10]:a['reason']='F-01/F-03 implemented and passing in the recorded local proxy; target verification remains unrun. Original failed checks remain historical evidence.'
for p in r['phases']:
 r['phases'][p]={'status':'done','evidence':[ref('local-fixes-report.md'),ref('validation.json')],'reason':'Authorized continuation completed within source/proxy capabilities; target checks stay explicit'}
r['cleanup']={'status':'pending','evidence':[],'reason':'Owned fixture/browser cleanup follows independent review'}
r['commands'] += [
 {'kind':'browser','command':'Seven maintained route focus cases in Chromium and WebKit; before-fix red baseline retained','status':'completed','evidence':[ref('route-focus-chromium-red.json'),ref('route-focus-chromium-final.json'),ref('route-focus-webkit-final.json')]},
 {'kind':'browser','command':'F-02 before/after local-build diagnostic traces and disposable controls; no application handler change','status':'completed','evidence':[ref('f02-webkit-before.json'),ref('f02-main-focus-control.json'),ref('f02-investigation.md')]},
 {'kind':'shell','command':'Full npm test, local npm run build, typecheck, scoped ESLint, formatting, changed-file Impeccable detector','status':'completed','evidence':[ref('validation.json'),ref('npm-test.txt'),ref('build.txt'),ref('impeccable-changed.json')]},
]
r['history'] += [{'at':now,'event':'explicit_authorization','evidence':ref('authorization.json'),'mode':'audit_and_fix','device_dependent_fixes':'propose_only'},{'at':now,'event':'local_ordinary_fixes','detail':'F-01 and F-03 implemented on a new dirty-source identity; no target Verified claim; original evidence/check IDs retained; F-02 cause revised without closure.'}]
r['limitations']=[
 'Ceiling remains proxy: desktop Chromium 149 and Playwright WebKit 26.6 on Linux; no physical iOS/Android, OS simulator or screen-reader target result.',
 'Local Vite/API substitutions remain; synthetic saves cannot qualify real server persistence, encryption, provider writing or production bootstrap.',
 'F-01 and F-03 are implemented with passing local mechanism/proxy checks, not target Verified; historical failed checks remain retained and are not silently superseded.',
 'F-02 remains open. Only disposable diagnostic contexts suppress main-focus events or alter restoration; no Shell, viewport, gesture or history application code was changed.',
 'Phone script IDs changed because the required source build changed. Ten original entries remain in history, replaced by ten current entries under the unchanged budget.',
 'No commit, push, deployment, plugin or dependency update; the phone-accessible isolated backend/build is still unprovisioned.',
]
r['next_steps']=['Use the current ten-entry device script with confirmed source/build/setup if target verification is pursued.','Review the conditional F-02 proposal before any authorized device-dependent implementation; the exact guard has not been applied or verified.']
(D/'run.json').write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'mode':r['mode'],'findings':{f['id']:f['status'] for f in r['findings']},'changes':len(r['changes']),'device_entries':len(r['device_script'])}))
