import copy,json
from pathlib import Path
from datetime import datetime,timezone
p=Path(__file__).resolve().parent
parent=p.parent.parent/'mobile-ux-local-fixes-20261020'/'20261020T234742Z'/'run.json'
r=json.loads(parent.read_text());now=datetime.now(timezone.utc).isoformat()
r['parent_run_file']=str(parent);r['run_id']=p.name+'-f02-guard';r['created_at']=now
r['mode']='audit_and_fix';r['device_dependent_fixes']='apply_and_hand_off'
r['dirty_before']=(p/'baseline-status.txt').read_text().strip();r['dirty_after']=(p/'final-status.txt').read_text().strip()
r['scope_of_this_continuation']={'fix':['F-02'],'preserve':['F-01','F-03'],'requested_checks':['focused Chromium/WebKit checks'],'explicitly_unrun':['physical-device verification'],'exclusions':['commit','push','deployment','plugin or dependency updates']}
r['local_source_identity']=str(p/'source-identity.json')
guard=copy.deepcopy(next(x for x in r['builds'] if x['id']=='B-LOCAL-FIX'))
guard.update(id='B-F02-GUARD',description='Current uncommitted F-01/F-03 plus exact minimal F-02 guard; final source hashes in source-identity.json',contains_fixes=['F-01','F-02','F-03'])
guard['substitutions']['evidence']=[str(p/'fixture-server.mjs'),str(Path.cwd()/'tests/helpers/mobile-ui/services.ts'),str(Path.cwd()/'tests/helpers/mobile-ui/main.tsx')]
guard['substitutions']['reason']='Real UI and focus/scroll code; local Vite member API and client bootstrap substitutions remain. No real server, provider or device qualification.'
pre=copy.deepcopy(guard);pre.update(id='B-F02-PRE',description='Resume baseline with F-01/F-03 already present; Shell.before.tsx lacks F-02 guard',contains_fixes=['F-01','F-03'])
phone=copy.deepcopy(next(x for x in r['builds'] if x['id']=='B-PHONE-LOCAL'))
phone.update(id='B-PHONE-GUARD',description='Planned phone-reachable non-production build matching current source-identity.json and containing F-01/F-02/F-03. Not provisioned or deployed.',contains_fixes=['F-01','F-02','F-03'])
source=copy.deepcopy(guard);source.update(id='B-GUARD-SOURCE',description='Current source for full Node test command and static checks; no Vite bootstrap is executed by this test command')
source['substitutions']={'status':'known','items':[{'boundary':'test-specific data and external-service fixtures','description':'Existing Node suite uses its own synthetic data and dependency controls; the Vite UI aliases are not the test runner.','behavior':'replaced','configured_response':'Per-test controlled inputs and responses; full suite command is node --test tests/*.test.mjs','real_components':'Actual modules exercised by the existing tests','untested':'Real provider, authentication, payment and production backend behavior'}],'unknown_boundaries':[],'evidence':[str(Path.cwd()/'package.json'),str(p/'npm-test.txt')],'reason':'Unit/synthetic suite results are scoped to their existing test fixtures.'}
r['builds'].extend([guard,pre,phone,source])
new_checks=[]
def clone_check(engine,kind):
 short='CH' if engine=='chromium' else 'WK'
 c=copy.deepcopy(next(x for x in r['checks'] if x['id']==f'C-L-{short}-FOCUS'))
 c.pop('replaces_check_id',None);c['id']=f'C-G-{short}-{kind}';c['build_id']='B-F02-GUARD';c['conditions']['build_id']='B-F02-GUARD'
 c['substitutions']['build']=copy.deepcopy(guard['substitutions'])
 c['substitutions']['additional']={'status':'none_checked','items':[],'unknown_boundaries':[],'evidence':[str(p/'f02-selection.cases.txt'),str(Path.cwd()/'tests/helpers/mobile-ui/shell-focus.cases.txt')],'reason':'Inspected scripts: real focus/native events run. The scrollBy wrapper only records arguments and calls the original; no focus suppression or restoration alteration is installed.'}
 c['conditions']['setup']='Fresh local synthetic member context; real components and current guard; Stripe resources blocked as in standing fixture.'
 c['conditions']['substitutions']='B-F02-GUARD + standing Stripe block; pass-through scrollBy trace where declared'
 c['covers']=[]
 if engine=='webkit':c['covers']=[{'finding_id':'F-02','scope_id':'webkit-mouse-390'}]
 return c
for engine in ['chromium','webkit']:
 short='CH' if engine=='chromium' else 'WK'
 shell=clone_check(engine,'SHELL');shell['module']=6
 shell.update(scenario='F-02 guard: main focus preserves scroll while textarea/native-radio label focus still clears fixed chrome',expected='Main landmark produces no focus-reveal scroll; actual form controls retain clearance and native keyboard selection.',actual='3/3 passed: main scroll remained 600px with zero scrollBy calls; reflection and visible native-radio label clearance passed.',evidence=[str(p/f'shell-focus-{engine}-final.json'),str(Path.cwd()/'tests/helpers/mobile-ui/shell-focus.cases.txt')])
 shell['conditions']['state']=shell['scenario'];shell['conditions']['steps']=['Scroll to 600px, focus main with preventScroll, and assert scroll position is preserved.','Focus an obscured textarea and native radio; assert their visible boxes clear the fixed header/navigation; select radio with Space.'];shell['behavior']=shell['scenario']
 new_checks.append(shell)
 red=copy.deepcopy(shell);red.update(id=f'C-G-{short}-SHELL-RED',required=False,status='fail',build_id='B-F02-PRE',actual='Before the guard, main focus at 600px invoked scrollBy(-608) and reset to 0; two real-control clearance checks passed.',evidence=[str(p/f'shell-focus-{engine}-red.json'),str(p/'Shell.before.tsx')],reason='Retained expected pre-fix regression failure; current guard results are separate checks.')
 red['conditions']['build_id']='B-F02-PRE';red['covers']=[];new_checks.append(red)
 selection=clone_check(engine,'SELECT');selection['module']=4
 selection.update(scenario='Repeat original native-anchor band selection using mouse, synthetic touch and keyboard',expected='Mood 4 and Energy 3 remain selected; no focus-reveal scroll occurs with MAIN active; synthetic save/reload retains both bands and Unicode note.',actual='20/20 passed: 12 mouse, 4 synthetic touch, 4 keyboard; one synthetic save/reload per input method passed; no MAIN-triggered scrollBy or page errors.',evidence=[str(p/f'selection-{engine}.json'),str(p/'f02-selection.cases.txt')])
 selection['conditions']['state']=selection['scenario'];selection['conditions']['steps']=['Use the native Today Check-in anchor, immediately activate Mood 4 then Energy 3; keep each input method separate.','Run 12 fresh mouse contexts, 4 synthetic touch contexts and 4 keyboard contexts.','On the first trial per method, save one Unicode note against fixture services and reload; compare both bands and the complete note.'];selection['behavior']=selection['scenario'];new_checks.append(selection)
 route=clone_check(engine,'ROUTE');route.update(module=5,scenario='Rerun the existing seven route-focus regressions after the Shell guard',actual='7/7 passed; destination focus, REPLACE, initial/reload, same-page changes, refresh, Back/Forward drafts and menu/hash behavior retained.',evidence=[str(p/f'route-focus-{engine}.json'),str(Path.cwd()/'tests/helpers/mobile-ui/route-focus.cases.txt')],replaces_check_id=f'C-L-{short}-FOCUS')
 route['expected']='Retain all seven established route-focus behaviors after the guard.';route['conditions']['state']=route['scenario'];route['conditions']['steps']=['Run the existing seven route-focus cases in fresh contexts.'];route['behavior']=route['scenario'];route['covers']=[{'finding_id':'F-03','scope_id':f'{engine}-journal-focus'}];new_checks.append(route)
unit=copy.deepcopy(next(c for c in r['checks'] if c['id']=='C-L-UNIT'))
unit.update(id='C-G-UNIT',scenario='Run full existing application test command after the minimal guard',actual='1211 tests: 1207 pass, 0 fail, 4 skipped.',evidence=[str(p/'npm-test.txt'),str(p/'validation.json')],build_id='B-GUARD-SOURCE',replaces_check_id='C-L-UNIT')
unit['conditions']['build_id']='B-GUARD-SOURCE';unit['substitutions']['build']=copy.deepcopy(source['substitutions']);new_checks.append(unit)
old_device_ids=r['device_script'][:];new_device_ids=[]
for index,old_id in enumerate(old_device_ids,1):
 old=next(c for c in r['checks'] if c['id']==old_id);old['required']=False
 c=copy.deepcopy(old);c.update(id=f'C-GD{index:02}',required=True,build_id='B-PHONE-GUARD',replaces_check_id=old_id,status='not_run',actual='',evidence=[],reason='Physical-device verification explicitly unrun; current phone build/backend is unprovisioned.')
 c['conditions']['build_id']='B-PHONE-GUARD';c['substitutions']['build']=copy.deepcopy(phone['substitutions'])
 c['steps']=[s.replace('containing F-01 and F-03','containing F-01, F-02 and F-03') for s in c['steps']]
 if index<=4:
  c['steps'].append('Check F-02 guard explicitly: repeat native Mood 4 / Energy 3 activation three times in independent test states; compare each selection before saving. Move between the main landmark and actual fields/radio labels while scrolled. Main focus should not reset reading scroll; controls must still clear fixed chrome with keyboard open/closed, expanded/collapsed browser bars, portrait/short landscape and enlarged text. Record each state separately.')
  c['related_finding_ids']=sorted(set(c.get('related_finding_ids',[])+['F-02']))
 if index==10:
  c['scenario']='Repeat original F-02 mouse-label activation using a supported external pointer on iPhone Safari'
  c['behavior']=c['scenario'];c['configuration']={'browser':'Safari','device':'iPhone with supported external pointer','os':'record actual version','version':'record actual version','display':'Compact tabs; external mouse/pointer; record exact hardware and input mode'}
  c['conditions']['browser']='Safari';c['conditions']['device']='iPhone with supported external pointer';c['conditions']['state']='Compact tabs; external pointer; original rapid native-anchor mouse-label activation'
  c['steps']=['Confirm a non-production phone build containing F-01/F-02/F-03 matches source-identity.json; independently verify isolated backend/account routing, actual build/setup substitutions and external-pointer support. Record device, OS, Safari, pointer hardware/settings and CSS width.','With keyboard closed and Safari chrome expanded then collapsed, use the native Check-in anchor and rapidly click Mood 4 then Energy 3 with the external pointer. Run at least six fresh independent test states and record every result and pointer/scroll behavior; do not merge finger-tap outcomes.','Verify that focus on main does not reset scroll while actual radio labels and fields still reveal. Repeat keyboard open/closed, portrait/short landscape and enlarged text; enter a Unicode note and save once only against the confirmed test backend. Record selection, scroll, focus and persisted values for each state.']
  c['related_finding_ids']=['F-02'];c['covers']=[{'finding_id':'F-02','scope_id':'webkit-mouse-390'}]
 c['conditions']['steps']=c['steps'][:]
 new_checks.append(c);new_device_ids.append(c['id'])
r['checks'].extend(new_checks);r['device_script']=new_device_ids
r['beyond_budget']=[s for s in r['beyond_budget'] if 'external pointer' not in str(s)]+['Optimized reading performance trace on real iPhone hardware with Safari Web Inspector']
f=next(x for x in r['findings'] if x['id']=='F-02');prior_fix=copy.deepcopy(f['fix'])
f.setdefault('status_history',[]).append({'at':now,'previous_status':f['status'],'previous_fix':prior_fix,'operation':'User authorized exact minimal guard; local focused confirmation only'})
f['status']='implemented';f['location']='src/components/pattern/Shell.tsx:94-101; TodayCheckIn native BandPicker activation'
f['fix']={'applied':True,'device_dependent':True,'build_id':'B-F02-GUARD','evidence':[str(p/'changes.patch'),str(p/'source-identity.json'),str(p/'target-plan.json')],'required_check_ids':['C-G-CH-SHELL','C-G-WK-SHELL','C-G-CH-SELECT','C-G-WK-SELECT','C-GD01','C-GD02','C-GD03','C-GD04','C-GD10'],'proposal':'Applied only the main-landmark exclusion in revealFocus. All geometry, actual-control label targeting, native input, viewport and history behavior are retained.'}
f['current_result']='Exact minimal guard implemented. Six focus checks, forty band-activation trials and fourteen route-focus regressions pass across desktop Chromium/WebKit. Target physical-device checks remain explicitly not_run; no target Verified claim.'
f['reason']='Explicit new user authorization permits the formerly proposed guard; remaining five distinct guard target entries fit the reserved 5 of the unchanged 10-entry budget. Physical-device verification remains unrun.'
f['verification_ids'].extend(['C-G-CH-SHELL','C-G-WK-SHELL','C-G-CH-SELECT','C-G-WK-SELECT','C-GD01','C-GD02','C-GD03','C-GD04','C-GD10'])
f['evidence'].append({'ref':str(p/'shell-focus-webkit-red.json'),'level':'proxy','observation':'Main focus reproducibly resets scroll before guard; actual-control clearance passes.','scope_ids':['webkit-mouse-390']})
f['evidence'].append({'ref':str(p/'selection-webkit.json'),'level':'proxy','observation':'On guard source, 12 mouse, 4 synthetic-touch and 4 keyboard band trials pass without main-triggered scrollBy; physical conditions unrun.','scope_ids':['webkit-mouse-390']})
for cov in r['coverage']:
 if cov['id'] in [1,3,4,5,6,9,10]:
  cov['check_ids'].extend(c['id'] for c in new_checks if not c['id'].startswith('C-GD') and not c['id'].endswith('RED') and ((cov['id'] in [4,5,10] and c['id'].endswith('SHELL')) or (cov['id'] in [1,3,5,9] and c['id'].endswith('SELECT')) or (cov['id'] in [6,10] and c['id'].endswith('ROUTE')) or (cov['id']==9 and c['id']=='C-G-UNIT')))
  cov['reason']='Retained original audit scope; current focused checks added. F-02 now implemented with proxy passes; physical target verification remains unrun.'
 cov['remaining']=[s.replace('C-LD','C-GD') for s in cov['remaining']]
 if cov['id']==8:cov['remaining']=['C-GD09: optimized Android trace. iPhone trace remains unrun and beyond budget after applied-guard pointer coverage received priority. Field/production performance not measured.']
for rec in r['recommendations']:
 if rec['id']=='R-01':rec['checks']=['C-GD09'];rec['reason']+=' iPhone trace remains unrun, listed beyond the current budget.'
r['changes'].extend([{'path':'src/components/pattern/Shell.tsx','summary':'F-02: skip main itself when revealing focused descendants; retain existing control/label clearance','finding_ids':['F-02']},{'path':'tests/helpers/mobile-ui/shell-focus.cases.txt','summary':'Three real-browser scroll/focus regressions covering main, textarea and native radio label','finding_ids':['F-02']}])
r['commands'].extend([{'kind':'browser','command':'Focused Chromium/WebKit red-to-green focus regression, 40 repeated input trials including 6 synthetic saves/reloads, 14 route-focus checks','status':'completed','evidence':[str(p/'validation.json'),str(p/'shell-focus-chromium-red.json'),str(p/'shell-focus-webkit-red.json')]},{'kind':'shell','command':'npm test; TypeScript; scoped ESLint and Prettier; diff and preservation checks','status':'completed','evidence':[str(p/'validation.json'),str(p/'npm-test.txt'),str(p/'preservation.json')]}])
r['launch']={'status':'started','url':'http://127.0.0.1:4209/','pid':1216443,'evidence':[str(p/'server.log'),str(p/'cleanup.json')],'reason':'Owned isolated loopback fixture; fresh Vite cache and explicit entry','stopped':True,'log':str(p/'server.log'),'stop':'Verified exact owned Node command then SIGTERM; port closed'}
r['cleanup']={'status':'done','evidence':[str(p/'cleanup.json'),str(p/'preservation.json')],'reason':'Closed only owned browser sessions and verified fixture process; unrelated work retained.'}
for phase in r['phases'].values():phase.update(status='done',evidence=[str(p/'f02-guard-report.md'),str(p/'validation.json')],reason='Authorized minimal local guard and focused checks complete; target verification explicitly unrun.')
r['limitations']=['Ceiling proxy: Linux Chromium 149.0.7827.55 and desktop Playwright WebKit 26.6; no physical-device, OS keyboard/chrome, VoiceOver/TalkBack or simulator verification.','F-02 is implemented with passing local checks; all physical checks are not_run and no finding is promoted to target Verified.','Member-service and client-bootstrap substitutions remain; six save/reload checks establish synthetic fixture behavior only, not real backend persistence.','Original failures and prior-build passes remain historical. Only new checks ran for the guard; broader retained audit coverage was not rerun wholesale.','Existing F-01/F-03 source and unrelated settings/editorial work are preserved. No commit, push, deployment, dependency or plugin update.','The final formatter changed only whitespace after selection trials; shell-focus and route-focus checks were rerun on final bytes, with equivalence recorded in source-identity.json.','No production build was rerun for this focused guard change.']
r['next_steps']=['Physical-device verification remains explicitly unrun. If later pursued, use the ten-entry current-build script with independently confirmed test backend/build/setup.']
r['history'].append({'at':now,'event':'explicit_F02_guard_authorization','evidence':str(p/'authorization.json'),'mode':'audit_and_fix','device_dependent_fixes':'apply_and_hand_off'})
r['history'].append({'at':now,'event':'minimal_F02_guard_implemented','evidence':[str(p/'changes.patch'),str(p/'validation.json')],'physical_device_verification':'not_run','target_plan':str(p/'target-plan.json')})
(p/'run.json').write_text(json.dumps(r,indent=2)+'\n')
lines=['# Remaining physical-device script','', 'All ten entries are **not run**. No phone build/backend has been provisioned or deployed. Required build: B-PHONE-GUARD, containing F-01/F-02/F-03 and matching [source-identity.json](source-identity.json).', '', 'Build substitutions: **unknown** until inspected. Setup substitutions: **unknown** until independently confirmed on the actual device. The local Vite fixture aliases are not assumed to exist on a phone. Use only isolated test data/backend for writes.', '', 'The five F-02 guard target entries are C-GD01/C-GD02/C-GD03/C-GD04/C-GD10. The other entries preserve broader audit target gaps. Total budget remains ten; the prior unrun iPhone performance trace is retained historically and listed beyond budget to give the applied guard pointer check priority.','']
for cid in new_device_ids:
 c=next(c for c in r['checks'] if c['id']==cid);conf=c['configuration']
 lines += [f"## {cid}: {c['scenario']}",'',f"Device/browser: {conf['device']} / {conf['browser']} / {conf.get('display','')}. Record actual model, OS and browser versions. Replaces {c['replaces_check_id']}.",'',f"Setup: {c['setup']}",'']
 lines += [f'{n}. {step}' for n,step in enumerate(c['steps'],1)]
 lines += ['',f"Expected: {c['expected']}",'','Result per requested state: ___','','Build/source identity and build substitutions as tested (confirm independently): ___','','Setup/device/backend/CSS width and setup substitutions as tested (confirm independently): ___','','Notes, timing, missing states and discrepancies: ___','','Screenshot/trace evidence: ___','']
lines += ['## Beyond budget','']+[f'- {x}' for x in r['beyond_budget']]
(p/'device-script.md').write_text('\n'.join(lines)+'\n')
print('Created continuation ledger and current-build ten-entry unrun device script.')
