"""Records-only adaptation; writes a new ledger, never the application or old evidence."""
import copy
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = Path('/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-ledger-review-20261021/20261021T001940Z/run.json')
HELPER = ROOT / 'source/skills/mobile-web-ux-runner/scripts/run_state.py'
spec = importlib.util.spec_from_file_location('runner_candidate', HELPER)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
before = json.loads(SOURCE.read_text())
state = copy.deepcopy(before)
finding = next(f for f in state['findings'] if f['id'] == 'F-02')
checks = {c['id']: c for c in state['checks']}
mapping = [
    ('C-GD01', 'DR-F02-SAFARI-COMPACT'),
    ('C-GD02', 'DR-F02-SAFARI-BOTTOM'),
    ('C-GD03', 'DR-F02-SAFARI-TOP'),
    ('C-GD04', 'DR-F02-ANDROID'),
    ('C-GD10', 'DR-F02-SAFARI-POINTER'),
]
state['history'].append({
    'at': datetime.now(timezone.utc).isoformat(),
    'event': 'independent_device_regression_plan_adaptation',
    'source_ledger': str(SOURCE),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'prior_F02_fix': copy.deepcopy(finding['fix']),
    'prior_F02_reason': finding.get('reason'),
    'prior_tooling_limitations': copy.deepcopy(state['tooling_limitations']),
    'prior_next_steps': copy.deepcopy(state['next_steps']),
    'prior_device_planning_metadata': {cid: {k: checks[cid].get(k) for k in ('planning_role', 'planning_limit')} for cid, _ in mapping},
    'detail': 'Local runner candidate 2.0.1 introduces separate device regression requirements. Original admission was not valid under installed 2.0.0; this new representation is validated by the local candidate only. No original scope, observation, applied fact, runtime result or achieved level changed. Physical-device execution remains not_run.',
})
finding['fix']['device_regressions'] = []
for cid, rid in mapping:
    c = checks[cid]
    finding['fix']['device_regressions'].append({
        'id': rid,
        'source_scope_ids': ['webkit-mouse-390'],
        'environment': c['environment'],
        'behavior': c['behavior'],
        'expected': 'Main-landmark focus must not reset reading scroll; actual fields and radio labels must remain reachable and clear fixed chrome in every listed state. ' + c['expected'],
        'conditions': copy.deepcopy(c['conditions']),
        'depends_on': copy.deepcopy(c['depends_on']),
    })
    c['regression_covers'] = [{'finding_id': 'F-02', 'regression_id': rid}]
    c['planning_role'] = 'independent_guard_regression'
    c['planning_limit'] = 'Independent device regression requirement for the F-02 guard. No original-scope covers link: this phone configuration is not direct coverage of webkit-mouse-390 (Linux desktop Playwright WebKit). Planned only; physical execution remains not_run.'
finding['fix']['required_check_ids'] = [cid for cid, _ in mapping]
finding['fix']['scope_verification_plan'] = {
    'status': 'separate_regression_plan',
    'scope_id': 'webkit-mouse-390',
    'required_target_check_ids': [],
    'device_regression_check_ids': [cid for cid, _ in mapping],
    'reason': 'Original desktop proxy scope and evidence are unchanged. The phone checks satisfy separate fix regression requirements under local runner 2.0.1; they do not verify/refute the original scope. No target observation has been established.',
}
finding['reason'] = 'Minimal guard remains implemented with retained local proxy confirmation. Five independent device regression entries are now explicitly planned under the local 2.0.1 model and fit the unchanged five-of-ten reservation. Original webkit-mouse-390 scope/evidence and all physical not_run statuses are preserved; no target Verified claim.'
state['skill_version'] = runner.VERSION
state['record_revision'] = before['record_revision'] + 1
state['tooling_limitations'] = [
    'The installed 2.0.0 helper could not represent the separate proxy-origin/device-regression plan; its original invalid outcome and correction remain in history and the unchanged earlier artifacts.',
    'This copied ledger uses the local unpublished 2.0.1 candidate. Five independent requirements reference the original proxy scope, a separate planned phone build, and unchanged phone conditions. Validation of this representation does not retroactively establish device execution or alter the earlier helper result.',
    'The helper validates submitted records, not evidence authenticity or omitted scenarios. The phone build/backend remains unprovisioned and wiring unknown; no original-scope target verification is claimed.',
]
state['limitations'].append('This continuation changes only local runner source/tests/docs and a copied ledger. The preceding no-plugin-update statement records the earlier app-fix boundary; no installed package, cloud plugin, application file or release was changed here.')
state['next_steps'] = [
    'No additional action is authorized by this handoff. Retain the valid-incomplete ledger, proxy ceiling and original scope/evidence.',
    'All ten current physical checks and twenty earlier physical plans remain not_run. Any future execution requires separately authorized actual device/build/setup evidence; the phone build/backend is still unprovisioned.',
]
state['runner_planning_revalidation'] = {
    'at': datetime.now(timezone.utc).isoformat(),
    'source_ledger': str(SOURCE),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'helper': str(HELPER),
    'helper_sha256': hashlib.sha256(HELPER.read_bytes()).hexdigest(),
    'local_candidate_version': runner.VERSION,
    'installed_version_unchanged': '2.0.0',
    'new_runtime_checks': False,
    'physical_device_verification': 'not_run',
    'app_changes': False,
    'release_actions': [],
}

# These assertions protect the submitted evidence rather than mirroring the new model.
for key in ('scope', 'project', 'target', 'principal_task', 'mode', 'operation', 'device_dependent_fixes', 'device_check_budget', 'changes', 'commands', 'capabilities', 'builds', 'standing_substitutions', 'device_script', 'coverage', 'local_source_identity'):
    assert state[key] == before[key], key
for old, new in zip(before['findings'], state['findings']):
    for key in ('affects', 'evidence', 'status', 'verification_ids', 'refuted_scopes', 'contrary_evidence'):
        assert old.get(key) == new.get(key), (old['id'], key)
    if old['id'] != 'F-02':
        assert old == new, old['id']
for old, new in zip(before['checks'], state['checks']):
    if old['status'] != 'not_run' or old['id'] not in dict(mapping):
        assert old == new, old['id']
    else:
        for key in old:
            if key not in ('planning_role', 'planning_limit'):
                assert old[key] == new[key], (old['id'], key)
physical = [c for c in state['checks'] if c['environment'] == 'physical_device']
assert len(physical) == 30
assert all(c['status'] == 'not_run' and c['actual'] == '' and c['evidence'] == [] for c in physical)
assert 'application_basis' not in state
assert not finding['fix'].get('applied_before_run')
out = ROOT / 'pattern/run.json'
assert not out.exists(), 'Preserve every generated record; choose a new output if repeating'
out.write_text(json.dumps(state, indent=2, ensure_ascii=False) + '\n')
assessment = runner.assess(state)
assert assessment['errors'] == [], assessment['errors']
assert assessment['verification_ceiling'] == 'proxy'
assert assessment['applied_device_entries'] == sorted(cid for cid, _ in mapping)
assert len(assessment['device_regressions']) == 5
assert all(r['status'] == 'not_run' for r in assessment['device_regressions'])
print(json.dumps({'run_file': str(out), 'errors': assessment['errors'], 'claimable_complete': assessment['claimable_complete'], 'verification': assessment['verification'], 'verification_ceiling': assessment['verification_ceiling'], 'applied_device_entries': assessment['applied_device_entries'], 'physical_not_run': len(physical), 'preservation_assertions': 'passed'}, indent=2))
