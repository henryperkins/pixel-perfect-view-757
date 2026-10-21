"""Read-only independent probes; run with PYTHONDONTWRITEBYTECODE=1.

The baseline reviewed here had 104 tests. The implementer may fix these defects
in place; this script reports observed outcomes rather than asserting old bugs.
"""
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'source/skills/mobile-web-ux-runner'
SPEC = importlib.util.spec_from_file_location('independent_review_fixtures', ROOT / 'tests/test_run_state.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
RUNNER = MODULE.runner


def emit(name, value):
    print(json.dumps({'probe': name, **value}, indent=2))


def mixed_target(fixture):
    state, finding = fixture.proxy_device_fix()
    check = state['checks'][1]
    finding['fix']['build_id'] = 'B-phone'
    target = copy.deepcopy(check['conditions'])
    target['build_id'] = 'B-1'
    finding['affects'].append({'id': 'phone-original', 'conditions': target})
    finding['evidence'].append({'ref': 'fixture: prior target', 'level': 'target',
                               'observation': 'fail', 'scope_ids': ['phone-original']})
    check['covers'] = [{'finding_id': 'F-01', 'scope_id': 'phone-original'}]
    return state, finding, check


fixture = MODULE.RunnerTests()
fixture.setUp()
try:
    state, finding = fixture.proxy_device_fix()
    check = state['checks'][1]
    finding['affects'].append({'id': 'target-portrait', 'conditions': MODULE.conditions()})
    finding['evidence'].append({'ref': 'fixture: target failure', 'level': 'target',
                               'observation': 'fail', 'scope_ids': ['target-portrait']})
    check.update(driver='agent', capability_id='E-agent', build_id='B-2',
                 conditions=MODULE.conditions(build='B-2'),
                 covers=[{'finding_id': 'F-01', 'scope_id': 'target-portrait'}])
    state['capabilities'].append({'id': 'E-agent', 'environment': 'physical_device', 'driver': 'agent',
                                 'status': 'available', 'evidence': ['fixture: connected device'], 'reason': ''})
    state['device_script'] = []
    emit('mixed_agent_admission', {'requirement_matches': RUNNER.planned_regression_matches(
        state, check, finding, finding['fix']['device_regressions'][0]), 'assessment': RUNNER.assess(state)})

    state, finding = fixture.proxy_device_fix()
    second = copy.deepcopy(finding['fix']['device_regressions'][0])
    second['id'] = 'DR-2'
    finding['fix']['device_regressions'].append(second)
    state['checks'][1]['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
    payload = fixture.result(status='partial', regression_results=[{
        'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'fail', 'actual': 'Obscured',
        'evidence': ['fixture: failure'], 'conditions_confirmed': True}])
    updated = RUNNER.apply_results(state, payload)
    emit('partial_failure_classification', {'assessment': RUNNER.assess(updated)})

    for malformed in (['not a result'], 'not a result', None, []):
        state, finding = fixture.proxy_device_fix()
        updated = RUNNER.apply_results(state, fixture.result())
        updated['checks'][1]['regression_results'] = malformed
        emit('malformed_or_empty_results', {'raw': malformed, 'assessment': RUNNER.assess(updated)})

    for extra in ({}, {'regression_results': []}):
        state, finding = fixture.proxy_device_fix()
        updated = RUNNER.apply_results(state, fixture.result(**extra))
        emit('omitted_or_empty_payload', {'payload_fields': list(extra),
             'regression_results': updated['checks'][1]['regression_results'], 'assessment': RUNNER.assess(updated)})

    for family, reported in (
        ('regression_only', {'regression_results': [{'finding_id': 'F-01', 'regression_id': 'DR-1',
            'status': 'pass', 'actual': 'Visible', 'evidence': ['fixture: regression'], 'conditions_confirmed': True}]}),
        ('scope_only', {'scope_results': [{'finding_id': 'F-01', 'scope_id': 'phone-original',
            'status': 'pass', 'actual': 'Visible', 'evidence': ['fixture: scope'], 'conditions_confirmed': True}]}),
    ):
        state, finding, check = mixed_target(fixture)
        initial_errors = RUNNER.assess(state)['errors']
        updated = RUNNER.apply_results(state, fixture.result(status='partial', **reported))
        emit('mixed_partial_' + family, {'initial_errors': initial_errors, 'assessment': RUNNER.assess(updated),
             'scope_results': updated['checks'][1]['scope_results'],
             'regression_results': updated['checks'][1]['regression_results']})

    state, finding, check = mixed_target(fixture)
    updated = RUNNER.apply_results(state, fixture.result(status='pass', scope_results=[{
        'finding_id': 'F-01', 'scope_id': 'phone-original', 'status': 'pass', 'actual': 'Visible elsewhere',
        'evidence': ['fixture: original only'], 'conditions': MODULE.conditions(build='B-phone', state='other-state')}]))
    emit('mixed_original_only_aggregate_pass', {'assessment': RUNNER.assess(updated),
         'scope_results': updated['checks'][1]['scope_results'],
         'regression_results': updated['checks'][1]['regression_results']})

    state, finding = fixture.proxy_device_fix()
    check = state['checks'][1]
    second = copy.deepcopy(finding['fix']['device_regressions'][0])
    second['id'] = 'DR-2'
    second['conditions'].update(state='landscape', steps=['Rotate landscape', 'Focus final field'])
    finding['fix']['device_regressions'].append(second)
    check['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
    check['regression_results'] = [{'finding_id': 'F-01', 'regression_id': req['id'], 'status': 'not_run',
                                    'conditions': copy.deepcopy(req['conditions'])}
                                   for req in finding['fix']['device_regressions']]
    emit('distinct_conditions_shared_plan', {'assessment': RUNNER.assess(state)})
finally:
    fixture.doCleanups()
