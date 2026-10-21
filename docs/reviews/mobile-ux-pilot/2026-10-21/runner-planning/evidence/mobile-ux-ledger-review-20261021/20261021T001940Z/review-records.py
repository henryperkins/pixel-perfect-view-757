import copy,json,runpy,sys,hashlib
from pathlib import Path
from datetime import datetime,timezone
sys.dont_write_bytecode=True
p=Path(__file__).resolve().parent
source=Path.cwd()/'output/playwright/mobile-ux-f02-guard-20261021/20261021T000416Z/run.json'
helper=Path('/home/ubuntu/.codex/plugins/cache/created-by-me-remote/mobile-web-ux-runner/2.0.0/skills/mobile-web-ux-runner/scripts/run_state.py')
m=runpy.run_path(str(helper),run_name='ledger_record_inspection')
original=json.loads(source.read_text());f=next(f for f in original['findings'] if f['id']=='F-02');scope=f['affects'][0]
checks={c['id']:c for c in original['checks']}
diag={'source_ledger':str(source),'helper':str(helper),'helper_sha256':hashlib.sha256(helper.read_bytes()).hexdigest(),'scope':copy.deepcopy(scope),'fix_build_id':f['fix']['build_id'],'original_assessment':m['assess'](original),'required_entries':[]}
for cid in f['fix']['required_check_ids']:
 c=checks[cid]
 diag['required_entries'].append({'id':cid,'covers_original_scope':('F-02',scope['id']) in m['covers'](c),'related_finding_ids':c.get('related_finding_ids',[]),'status':c['status'],'level':c['level'],'planned_level_expected_by_helper':'target','check_build_id':c['build_id'],'fix_build_id':f['fix']['build_id'],'build_ids_match':c['build_id']==f['fix']['build_id'],'configuration_comparison':{k:{'original_scope':scope['conditions'][k],'planned_entry':c['configuration'].get(k),'matches':scope['conditions'][k]==c['configuration'].get(k)} for k in ['browser','device']},'condition_mismatches':m['match_conditions'](scope['conditions'],c['conditions'],fixed=True),'helper_planned_target_matches':m['planned_target_matches'](c,f,scope)})
(p/'diagnosis.json').write_text(json.dumps(diag,indent=2)+'\n')
corrected=copy.deepcopy(original);cf=next(f for f in corrected['findings'] if f['id']=='F-02')
regressions=['C-GD01','C-GD02','C-GD03','C-GD04','C-GD10']
previous={cid:copy.deepcopy(checks[cid]) for cid in original['device_script']}
cf['fix']['required_check_ids']=[]
cf['fix']['device_regression_check_ids']=regressions[:]
cf['fix']['scope_verification_plan']={'status':'unmapped','scope_id':scope['id'],'required_target_check_ids':[],'reason':'No existing physical-device entry matches the preserved Linux desktop Playwright WebKit scope. Phone follow-ups are related guard regressions, not direct scope verification. The original application-plan gate remains unsatisfied.'}
cf['verification_ids']=[cid for cid in cf['verification_ids'] if cid not in regressions]
cf['related_regression_check_ids']=regressions[:]
cf['reason']='The guard remains implemented from the prior authorized application. The earlier record conflated related physical-device regressions with direct coverage of the original desktop-WebKit scope. Count fitting the budget did not establish application-plan admission. The corrected original-scope target plan remains incomplete; no device test or target verification is claimed.'
for c in corrected['checks']:
 if c['id'] not in original['device_script']:continue
 # For an unrun entry, target describes intended acquisition, not an achieved result.
 c['level']='target'
 c['planned_only']=True
 c['achieved_level']='unestablished'
 c['level_basis']='Planned physical target acquisition only; status not_run, actual empty, evidence empty, capability not available. No target observation exists.'
 if c['id']=='C-GD10':c['covers']=[]
 if c['id'] in regressions:
  c['planning_role']='related_guard_regression'
  c['planning_limit']='This phone configuration is not direct coverage of preserved scope webkit-mouse-390 (Linux desktop Playwright WebKit).'
 else:c['planning_role']='broader_audit_follow_up'
corrected['device_script']=regressions+[cid for cid in original['device_script'] if cid not in regressions]
corrected['tooling_limitations']=['Original record error: related phone regressions were listed as exact verification of a desktop-emulation scope; the pointer entry also had an unsupported direct covers link. Those associations are corrected.','Remaining contract/model gap: the original scope names desktop emulation, which the helper cannot accept as target. The planned phone browser/device, future build, states, steps and setup legitimately differ. Preserving these facts prevents complete original-scope target-plan admission under the installed helper.','An unrun phone check now has planned level target with achieved_level unestablished, unchanged not_run/empty result/evidence and unavailable or declared capability. This is a plan correction, not an observed device result.']
corrected['record_revision']=original.get('record_revision',1)+1
corrected['record_review']={'at':datetime.now(timezone.utc).isoformat(),'operation':'records_only','source_ledger':str(source),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'new_app_or_plugin_changes':False,'new_runtime_or_device_checks':False,'outcome':'records corrected; original application planning remains invalid/incomplete','preserved_fields':['scope','all finding affects and evidence','all executed check records','all check statuses, actual results and evidence','original mode, operation, applied fix facts, device policy and budget'],'prior_required_check_ids':f['fix']['required_check_ids'],'prior_device_script':original['device_script'],'diagnosis':str(p/'diagnosis.json')}
corrected['history'].append({'event':'record_planning_correction','at':corrected['record_review']['at'],'source_ledger':str(source),'source_sha256':corrected['record_review']['source_sha256'],'prior_F02_fix':copy.deepcopy(f['fix']),'prior_F02_verification_ids':copy.deepcopy(f['verification_ids']),'prior_F02_reason':f['reason'],'prior_device_checks':previous,'prior_tooling_limitations':original.get('tooling_limitations',[]),'detail':'Corrected false direct-coverage and required-target associations; preserved original scope/evidence and applied history. All device entries remain unrun. No applied_before_run flag, fabricated application basis, reclassification or source edit was used to bypass the original gate.'})
corrected['limitations'].append('Record correction does not retroactively validate the original application plan. Physical-device checks are still unrun; planned target levels do not raise the achieved proxy ceiling.')
corrected['next_steps']=['Retain the original-scope planning gap explicitly. The existing phone entries can support future related guard regression checks only; they cannot close the preserved desktop-emulation scope under the current helper.','Keep all physical-device checks unrun until separately executed with actual device/build/setup evidence; no such execution occurred in this records-only review.']
# Invariants checked independently against the input, including original claims and all outcomes.
assert corrected['scope']==original['scope']
assert [x['affects'] for x in corrected['findings']]==[x['affects'] for x in original['findings']]
assert [x['evidence'] for x in corrected['findings']]==[x['evidence'] for x in original['findings']]
assert all(a['id']==b['id'] and a['status']==b['status'] and a['actual']==b['actual'] and a['evidence']==b['evidence'] for a,b in zip(original['checks'],corrected['checks']))
assert all(a==b for a,b in zip(original['checks'],corrected['checks']) if a['status'] in ['pass','fail','partial'])
assert all(next(f for f in corrected['findings'] if f['id']==of['id'])['status']==of['status'] for of in original['findings'])
assert 'applied_before_run' not in cf['fix'] and corrected.get('application_basis')==original.get('application_basis')
assert all(corrected[k]==original[k] for k in ['mode','operation','device_dependent_fixes','device_check_budget','changes','builds','capabilities'])
(p/'run.json').write_text(json.dumps(corrected,indent=2)+'\n')
(p/'original-assessment.json').write_text(json.dumps(diag['original_assessment'],indent=2)+'\n')
plan={'status':'incomplete_original_scope_mapping','original_scope':copy.deepcopy(scope),'original_scope_target_check_ids':[],'device_regression_check_ids':regressions,'planned_device_count':10,'guard_regression_count':5,'budget':10,'count_fits_half_budget':True,'application_plan_admitted':False,'physical_device_verification':'not_run','reason':'Count fits capacity, but no plan entry qualifies for the original scope; count alone is not admission.'}
(p/'target-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
print(json.dumps({'original_errors':diag['original_assessment']['errors'],'corrected_errors':m['assess'](corrected)['errors'],'original_scope_preserved':True,'findings_evidence_preserved':True,'executed_checks_preserved':True,'physical_checks':'all not_run'},indent=2))
