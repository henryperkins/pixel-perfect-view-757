"""Mechanical contract tests. These do not execute an agent or inspect a real app."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts' / 'run_state.py'
spec = importlib.util.spec_from_file_location('run_state', SCRIPT)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


def none():
    return {'status': 'none_checked', 'items': [], 'unknown_boundaries': [],
            'evidence': ['fixture: wiring inspected'], 'reason': ''}


def mock(boundary='share'):
    return {'status': 'known', 'items': [{'boundary': boundary, 'description': 'fixture replacement',
            'behavior': 'replaced', 'configured_response': 'resolved success', 'real_components': 'app rendering',
            'untested': 'real boundary'}], 'unknown_boundaries': [], 'evidence': ['fixture: configuration'], 'reason': ''}


def conditions(build='B-1', browser='Safari', device='iPhone', state='portrait'):
    return {'build_id': build, 'browser': browser, 'device': device, 'state': state,
            'account_data': 'seeded test account A', 'setup': 'open /checkout', 'steps': ['Focus final field'],
            'timing': 'after layout settles', 'substitutions': 'test fixture A'}


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.project = Path(self.tmp.name)
        self.s = runner.new_state(str(self.project), '/checkout', 'Complete checkout')

    def complete(self, mode='audit_only'):
        s = self.s
        s['mode'] = mode
        for phase in s['phases'].values():
            phase.update(status='done', evidence=['fixture: phase complete'])
        for module in s['modules']:
            module.update(status='reviewed', evidence=['fixture: reviewed'])
        s['impeccable'] = {'status': 'executed', 'version': '4.7.0', 'evidence': ['fixture: workflow executed'], 'reason': ''}
        s['launch'] = {'status': 'reused', 'url': 'http://localhost:3000', 'evidence': ['fixture: route loaded'], 'reason': ''}
        s['cleanup'] = {'status': 'done', 'evidence': ['fixture: no owned processes remain'], 'reason': ''}
        s['capabilities'] = [{'id': 'E-1', 'environment': 'physical_device', 'driver': 'person',
                              'status': 'available', 'evidence': ['fixture: reported device execution'], 'reason': ''}]
        s['builds'] = [{'id': 'B-1', 'description': 'baseline', 'contains_fixes': [], 'substitutions': none()},
                       {'id': 'B-2', 'description': 'fixed', 'contains_fixes': ['F-01'], 'substitutions': none()}]
        c = self.check()
        c['covers'] = []
        s['checks'] = [c]
        for area in s['coverage']:
            area.update(disposition='no_defect_found', check_ids=['C-01'], reason='Checked fixture scenario')
        return s

    def check(self, cid='C-01', sid='portrait', build='B-2', status='pass', browser='Safari', device='iPhone'):
        return {'id': cid, 'module': 2, 'required': True, 'scenario': 'Keyboard visibility',
                'environment': 'physical_device', 'evidence_type': 'physical_device', 'driver': 'person',
                'capability_id': 'E-1', 'level': 'target', 'behavior': 'software_keyboard', 'build_id': build,
                'build_confirmed': True, 'setup_confirmed': True,
                'configuration': {'browser': browser, 'device': device, 'os': 'iOS 26', 'version': '26.1'},
                'conditions': conditions(build, browser, device, sid), 'expected': 'CTA remains visible',
                'actual': 'CTA remains visible' if status == 'pass' else 'CTA hidden' if status == 'fail' else '',
                'status': status, 'evidence': ['fixture: screenshot'] if status != 'not_run' else [],
                'reason': 'Awaiting human check' if status == 'not_run' else '', 'depends_on': [],
                'substitutions': {'build': none(), 'setup': none(), 'additional': none()},
                'covers': [{'finding_id': 'F-01', 'scope_id': sid}], 'steps': ['Focus final field'], 'setup': 'Test account'}

    def finding(self, applied=True, status='implemented', deterministic=True):
        return {'id': 'F-01', 'module': 2, 'area_ids': [2], 'severity': 'P1', 'evidence_class': 'code_supported',
                'status': status, 'title': 'CTA may be hidden', 'location': 'form.css:10', 'evidence': ['fixture: source'],
                'expected': 'CTA visible', 'actual': 'CTA predicted hidden', 'cause': 'Fixed sizing',
                'determinism': 'deterministic' if deterministic else 'intermittent', 'depends_on': [],
                'affects': [{'id': 'portrait', 'conditions': conditions()}], 'refuted_scopes': [],
                'contrary_evidence': [], 'verification_ids': ['C-01'] if applied else [],
                'fix': {'applied': applied, 'applied_before_run': True, 'device_dependent': False,
                        'build_id': 'B-2' if applied else '', 'evidence': ['fixture: diff'] if applied else [], 'required_check_ids': []}}

    def with_finding(self, applied=True, status='implemented', deterministic=True):
        s = self.complete()
        f = self.finding(applied, status, deterministic)
        s['findings'] = [f]
        s['checks'][0] = self.check(build='B-2' if applied else 'B-1')
        s['coverage'][1].update(disposition='no_defect_found' if status == 'verified' else 'defects_found', finding_ids=['F-01'])
        return s, f

    def result(self, **overrides):
        r = {'check_id': 'C-01', 'status': 'pass', 'actual': 'CTA visible', 'evidence': ['fixture: human result'],
             'build_confirmed': True, 'setup_confirmed': True, 'conditions_confirmed': True,
             'relation': 'prediction_contradicted'}
        r.update(overrides)
        return {'results': [r]}

    def assert_valid(self, state=None):
        a = runner.assess(state or self.s)
        self.assertEqual(a['errors'], [], a['errors'])
        return a

    def device_result_fixture(self):
        state, finding = self.with_finding(status='implemented')
        state.update(mode='audit_and_fix', device_dependent_fixes='apply_and_hand_off', device_check_budget=2)
        finding['fix'].update(applied_before_run=False, device_dependent=True, required_check_ids=['C-01'])
        state['checks'][0].update(status='not_run', actual='', evidence=[], reason='Awaiting human result')
        state['device_script'] = ['C-01']
        runner.refresh_coverage(state)
        self.assert_valid(state)
        return state

    def test_failed_applied_device_fix_result_remains_recordable(self):
        state = self.device_result_fixture()
        result = runner.apply_results(state, self.result(status='fail', actual='CTA hidden', relation='defect_reproduced'))
        self.assertEqual(result['findings'][0]['status'], 'open')
        self.assertEqual(result['checks'][0]['status'], 'fail')
        self.assert_valid(result)
        self.assertFalse(runner.assess(result)['claimable_complete'])
        self.assertEqual(result['application_basis']['device_script'], ['C-01'])

    def test_unconfirmed_device_fix_build_result_remains_recordable(self):
        state = self.device_result_fixture()
        result = runner.apply_results(state, self.result(build_confirmed=False))
        self.assertEqual(result['findings'][0]['status'], 'implemented')
        self.assertEqual(result['checks'][0]['status'], 'pass')
        self.assert_valid(result)
        self.assertFalse(runner.assess(result)['claimable_complete'])

    def test_results_application_basis_cannot_authorize_new_fix_or_changes(self):
        result = runner.apply_results(self.device_result_fixture(), self.result())
        self.assert_valid(result)
        result['findings'][0]['fix']['build_id'] = 'B-new'
        self.assertTrue(runner.assess(result)['errors'])
        result = runner.apply_results(self.device_result_fixture(), self.result())
        result['changes'].append({'path': 'form.css', 'summary': 'new edit', 'finding_ids': ['F-01']})
        self.assertTrue(runner.assess(result)['errors'])

    def test_invalid_application_plan_is_not_laundered_by_result(self):
        state = self.device_result_fixture()
        state['device_check_budget'] = 0
        result = runner.apply_results(state, self.result())
        self.assertTrue(runner.assess(result)['errors'])

    def proxy_device_fix(self, budget=6, requirements=1):
        s, f = self.with_finding()
        s.update(mode='audit_and_fix', device_dependent_fixes='apply_and_hand_off', device_check_budget=budget)
        proxy_conditions = conditions(browser='Playwright WebKit 26.6', device='Linux desktop emulation', state='mouse at 390px')
        f['affects'] = [{'id': 'proxy-mouse', 'conditions': proxy_conditions}]
        f['evidence_class'] = 'observed'
        f['evidence'] = [{'ref': 'fixture: mouse trace', 'level': 'proxy', 'observation': 'fail', 'scope_ids': ['proxy-mouse']}]
        f['fix'].update(applied_before_run=False, device_dependent=True)
        f['fix']['device_regressions'] = []
        s['builds'].append({'id': 'B-phone', 'description': 'planned fixed phone build', 'contains_fixes': ['F-01'], 'substitutions': none()})
        s['capabilities'][0].update(status='declared', evidence=[], reason='Phone not run')
        s['capabilities'].append({'id': 'E-proxy', 'environment': 'desktop_emulation', 'driver': 'agent', 'status': 'available', 'evidence': ['fixture: proxy trace'], 'reason': ''})
        proxy = self.check(cid='C-PROXY', build='B-2', browser='Playwright WebKit 26.6', device='Linux desktop emulation')
        proxy.update(environment='desktop_emulation', driver='agent', evidence_type='emulation', level='proxy', capability_id='E-proxy', conditions={**proxy_conditions, 'build_id': 'B-2'}, covers=[{'finding_id': 'F-01', 'scope_id': 'proxy-mouse'}])
        s['checks'] = [proxy]
        for i in range(requirements):
            c = self.check(cid=f'C-{i+1:02}', sid=f'phone-state-{i}', build='B-phone', status='not_run')
            c.update(build_confirmed=False, setup_confirmed=False, covers=[], regression_covers=[{'finding_id': 'F-01', 'regression_id': f'DR-{i+1}'}])
            f['fix']['device_regressions'].append({'id': f'DR-{i+1}', 'source_scope_ids': ['proxy-mouse'], 'environment': 'physical_device', 'behavior': 'software_keyboard', 'expected': 'Focused controls remain visible without a main-landmark scroll reset', 'conditions': copy.deepcopy(c['conditions']), 'depends_on': []})
            s['checks'].append(c)
        f['fix']['required_check_ids'] = [c['id'] for c in s['checks'][1:]]
        f['verification_ids'] = ['C-PROXY']
        s['device_script'] = f['fix']['required_check_ids'][:]
        for area in s['coverage']:
            area.update(check_ids=['C-PROXY'], disposition='no_defect_found')
        s['coverage'][1].update(disposition='defects_found', finding_ids=['F-01'])
        return s, f

    def test_proxy_plan_admits_distinct_phone_build_without_rewriting_scope(self):
        s, f = self.proxy_device_fix()
        before = copy.deepcopy(s)
        a = self.assert_valid(s)
        self.assertEqual(a['applied_device_entries'], ['C-01'])
        self.assertEqual(a['verification_ceiling'], 'proxy')
        self.assertFalse(a['claimable_complete'])
        self.assertEqual(s, before)
        self.assertEqual(f['status'], 'implemented')
        self.assertEqual(s['checks'][1]['status'], 'not_run')

    def test_proxy_plan_rejects_missing_origin_requirement(self):
        s, f = self.proxy_device_fix()
        self.assert_valid(s)
        f['affects'].append({'id': 'another-proxy', 'conditions': conditions(state='another')})
        f['evidence'].append({'ref': 'fixture: another trace', 'level': 'proxy', 'observation': 'fail', 'scope_ids': ['another-proxy']})
        self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_target_or_unclassified_observation_shortcut(self):
        for evidence in [[{'ref': 'fixture: real failure', 'level': 'target', 'observation': 'fail', 'scope_ids': ['proxy-mouse']}], ['fixture: unclassified observed failure']]:
            s, f = self.proxy_device_fix()
            self.assert_valid(s)
            f['evidence'] = evidence
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_missing_required_entry(self):
        s, f = self.proxy_device_fix(requirements=2)
        self.assert_valid(s)
        f['fix']['required_check_ids'] = ['C-01']
        self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_wrong_regression_configuration(self):
        for field in ['browser', 'device']:
            s, f = self.proxy_device_fix()
            self.assert_valid(s)
            s['checks'][1]['configuration'][field] = 'different'
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_wrong_regression_build_or_missing_fix(self):
        for mutation in ['wrong-build', 'missing-fix']:
            s, f = self.proxy_device_fix()
            self.assert_valid(s)
            if mutation == 'wrong-build': s['checks'][1]['build_id'] = 'B-2'
            else: s['builds'][-1]['contains_fixes'] = []
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_incomplete_regression_conditions(self):
        for field in ['steps', 'timing', 'account_data', 'setup', 'substitutions']:
            s, f = self.proxy_device_fix()
            self.assert_valid(s)
            f['fix']['device_regressions'][0]['conditions'].pop(field)
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_rejects_empty_duplicate_and_unknown_links(self):
        for mutation in ['empty', 'duplicate', 'unknown-origin', 'unknown-regression', 'duplicate-link']:
            s, f = self.proxy_device_fix()
            self.assert_valid(s)
            if mutation == 'empty': f['fix']['device_regressions'] = []
            elif mutation == 'duplicate': f['fix']['device_regressions'].append(copy.deepcopy(f['fix']['device_regressions'][0]))
            elif mutation == 'unknown-origin': f['fix']['device_regressions'][0]['source_scope_ids'] = ['missing']
            elif mutation == 'unknown-regression': s['checks'][1]['regression_covers'][0]['regression_id'] = 'missing'
            else: s['checks'][1]['regression_covers'].append(copy.deepcopy(s['checks'][1]['regression_covers'][0]))
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_keeps_authorization_budget_and_priority_guards(self):
        for mutation in ['policy', 'budget', 'priority']:
            s, f = self.proxy_device_fix(budget=3)
            self.assert_valid(s)
            if mutation == 'policy': s['device_dependent_fixes'] = 'propose_only'
            elif mutation == 'budget': s['device_check_budget'] = 1
            else:
                extra = self.check(cid='C-extra', status='not_run')
                extra['covers'] = []
                s['checks'].append(extra)
                s['device_script'].insert(0, 'C-extra')
            self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_shared_entry_counts_once(self):
        s, f = self.proxy_device_fix(budget=2)
        g = copy.deepcopy(f)
        g['id'] = 'F-02'
        s['findings'].append(g)
        s['builds'][1]['contains_fixes'].append('F-02')
        s['builds'][-1]['contains_fixes'].append('F-02')
        s['checks'][1]['regression_covers'].append({'finding_id': 'F-02', 'regression_id': 'DR-1'})
        self.assertEqual(self.assert_valid(s)['applied_device_entries'], ['C-01'])

    def test_proxy_plan_simulator_cannot_stand_in_for_hardware(self):
        s, f = self.proxy_device_fix()
        self.assert_valid(s)
        r = f['fix']['device_regressions'][0]
        r.update(environment='os_simulator', behavior='performance')
        s['checks'][1].update(environment='os_simulator', evidence_type='emulation', behavior='performance')
        self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_phone_pass_is_not_original_scope_verification(self):
        s, f = self.proxy_device_fix()
        before_scope, before_evidence = copy.deepcopy(f['affects']), copy.deepcopy(f['evidence'])
        result = runner.apply_results(s, self.result())
        self.assert_valid(result)
        self.assertEqual(result['findings'][0]['status'], 'implemented')
        self.assertEqual(result['findings'][0]['affects'], before_scope)
        self.assertEqual(result['findings'][0]['evidence'], before_evidence)
        self.assertEqual(result['checks'][0], s['checks'][0])
        self.assertEqual(result['application_basis']['findings'][0]['fix'], f['fix'])

    def test_proxy_plan_failure_and_unconfirmed_build_remain_recordable(self):
        for payload in [self.result(status='fail', actual='Control obscured', relation='unrelated'), self.result(build_confirmed=False)]:
            s, f = self.proxy_device_fix()
            result = runner.apply_results(s, payload)
            self.assert_valid(result)
            self.assertFalse(runner.assess(result)['claimable_complete'])
            self.assertEqual(result['findings'][0]['status'], 'implemented')

    def test_proxy_plan_results_cannot_launder_invalid_admission_or_rewrite_plan(self):
        s, f = self.proxy_device_fix()
        s['device_check_budget'] = 0
        self.assertTrue(runner.assess(runner.apply_results(s, self.result()))['errors'])
        s, f = self.proxy_device_fix()
        result = runner.apply_results(s, self.result())
        self.assert_valid(result)
        result['findings'][0]['fix']['device_regressions'][0]['conditions']['device'] = 'other'
        self.assertTrue(runner.assess(result)['errors'])

    def test_proxy_plan_partial_shared_result_does_not_invent_second_pass(self):
        s, f = self.proxy_device_fix(budget=2)
        second = copy.deepcopy(f['fix']['device_regressions'][0]);second['id'] = 'DR-2'
        f['fix']['device_regressions'].append(second)
        s['checks'][1]['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
        self.assert_valid(s)
        payload = self.result(status='partial', regression_results=[{'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'pass', 'actual': 'Visible', 'evidence': ['fixture: partial target'], 'conditions_confirmed': True}])
        result = runner.apply_results(s, payload)
        self.assert_valid(result)
        record = result['checks'][1]
        self.assertEqual(record['status'], 'partial')
        self.assertEqual({x['regression_id']: x['status'] for x in record['regression_results']}, {'DR-1': 'pass', 'DR-2': 'not_run'})
        self.assertEqual(result['findings'][0]['status'], 'implemented')

    def test_proxy_plan_rejects_out_of_plan_regression_result(self):
        s, f = self.proxy_device_fix()
        with self.assertRaises(ValueError):
            runner.apply_results(s, self.result(regression_results=[{'finding_id': 'F-01', 'regression_id': 'missing', 'status': 'pass'}]))

    def test_proxy_plan_render_separates_observed_scope_from_device_regressions(self):
        s, f = self.proxy_device_fix()
        report = runner.render_report(s, runner.assess(s))
        self.assertIn('Device regression requirements', report)
        self.assertIn('DR-1', report)
        self.assertIn('C-01 [F-01]', report)
        self.assertEqual(f['affects'][0]['conditions']['device'], 'Linux desktop emulation')

    def test_proxy_plan_cli_valid_incomplete_generates_reports_without_device_pass(self):
        s, f = self.proxy_device_fix()
        file = self.project / 'proxy-plan.json';file.write_text(json.dumps(s))
        out = subprocess.run([sys.executable, str(SCRIPT), 'report', str(file)], capture_output=True, text=True)
        self.assertEqual(out.returncode, 3, out.stdout + out.stderr)
        data = json.loads(out.stdout)
        self.assertEqual(data['errors'], [])
        self.assertEqual(data['verification_ceiling'], 'proxy')
        self.assertEqual(data['applied_device_entries'], ['C-01'])
        self.assertEqual(json.loads(file.read_text()), s)
        self.assertTrue((self.project / 'report.md').exists())
        self.assertTrue((self.project / 'summary.json').exists())

    def test_proxy_plan_mixed_legacy_agent_entry_still_validates_regressions(self):
        s, f = self.proxy_device_fix()
        c = s['checks'][1]
        # The entry also covers a real target-origin scope; its agent acquisition
        # must not skip an independent, mismatching regression requirement.
        target_scope = {'id': 'target-portrait', 'conditions': copy.deepcopy(c['conditions'])}
        f['affects'].append(target_scope)
        f['evidence'].append({'ref': 'fixture: device failure', 'level': 'target', 'observation': 'fail', 'scope_ids': ['target-portrait']})
        c['covers'] = [{'finding_id': 'F-01', 'scope_id': 'target-portrait'}]
        c['driver'] = 'agent'
        c['capability_id'] = 'E-1'
        s['capabilities'][0].update(status='available', evidence=['fixture: agent phone probe'], reason='')
        # Legacy matching uses the local fix build; keep both requirements initially valid.
        c['build_id'] = 'B-2';c['conditions']['build_id'] = 'B-2'
        f['affects'][-1]['conditions']['build_id'] = 'B-2'
        f['fix']['device_regressions'][0]['conditions']['build_id'] = 'B-2'
        s['device_script'] = []
        self.assert_valid(s)
        f['fix']['device_regressions'][0]['conditions']['state'] = 'a different phone state'
        self.assertTrue(runner.assess(s)['errors'])

    def test_proxy_plan_partial_recorded_failure_is_failed_verification(self):
        s, f = self.proxy_device_fix()
        second = copy.deepcopy(f['fix']['device_regressions'][0]);second['id'] = 'DR-2'
        f['fix']['device_regressions'].append(second)
        s['checks'][1]['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
        payload = self.result(status='partial', actual='One state failed, another missing', regression_results=[{'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'fail', 'actual': 'Obscured', 'evidence': ['fixture: failure'], 'conditions_confirmed': True}])
        updated = runner.apply_results(s, payload)
        self.assert_valid(updated)
        self.assertEqual(runner.assess(updated)['verification'], 'failed')
        self.assertEqual(updated['findings'][0]['status'], 'implemented')

    def test_proxy_plan_assessment_rejects_malformed_or_empty_explicit_results(self):
        for malformed in [['not a result'], {'status': 'pass'}, []]:
            s, f = self.proxy_device_fix()
            updated = runner.apply_results(s, self.result())
            self.assert_valid(updated)
            updated['checks'][1]['regression_results'] = malformed
            self.assertTrue(runner.assess(updated)['errors'])

    def mixed_proxy_device_fix(self):
        s, f = self.proxy_device_fix()
        c = s['checks'][1]
        c['build_id'] = 'B-2';c['conditions']['build_id'] = 'B-2'
        f['fix']['device_regressions'][0]['conditions']['build_id'] = 'B-2'
        f['affects'].append({'id': 'target-portrait', 'conditions': copy.deepcopy(c['conditions'])})
        f['evidence'].append({'ref': 'fixture: device failure', 'level': 'target', 'observation': 'fail', 'scope_ids': ['target-portrait']})
        c['covers'] = [{'finding_id': 'F-01', 'scope_id': 'target-portrait'}]
        self.assert_valid(s)
        return s, f

    def test_mixed_plan_scope_only_pass_does_not_invent_regression_pass(self):
        s, f = self.mixed_proxy_device_fix()
        payload = self.result(scope_results=[{'finding_id': 'F-01', 'scope_id': 'target-portrait', 'status': 'pass', 'actual': 'Visible in another state', 'evidence': ['fixture: scope result'], 'conditions': {**s['checks'][1]['conditions'], 'state': 'other'}}])
        updated = runner.apply_results(s, payload)
        self.assert_valid(updated)
        self.assertEqual(updated['checks'][1]['status'], 'partial')
        self.assertEqual(updated['checks'][1]['regression_results'][0]['status'], 'not_run')

    def test_mixed_plan_partial_reports_in_either_family_remain_recordable(self):
        for family, id_key, portion_id, missing_family in [('scope_results', 'scope_id', 'target-portrait', 'regression_results'), ('regression_results', 'regression_id', 'DR-1', 'scope_results')]:
            s, f = self.mixed_proxy_device_fix()
            portion = {'finding_id': 'F-01', id_key: portion_id, 'status': 'pass', 'actual': 'Visible', 'evidence': ['fixture: portion result'], 'conditions_confirmed': True}
            updated = runner.apply_results(s, self.result(status='partial', **{family: [portion]}))
            self.assert_valid(updated)
            self.assertEqual(updated['checks'][1]['status'], 'partial')
            self.assertEqual(updated['checks'][1][family][0]['status'], 'pass')
            self.assertEqual(updated['checks'][1][missing_family][0]['status'], 'not_run')

    def test_proxy_plan_explicit_empty_results_do_not_inherit_whole_pass(self):
        s, f = self.proxy_device_fix()
        updated = runner.apply_results(s, self.result(regression_results=[]))
        self.assert_valid(updated)
        self.assertEqual(updated['checks'][1]['regression_results'][0]['status'], 'not_run')
        self.assertEqual(runner.assess(updated)['device_regressions'][0]['status'], 'not_run')

    def test_mixed_plan_raw_aggregate_pass_cannot_qualify_unreported_portions(self):
        s, f = self.mixed_proxy_device_fix()
        c = s['checks'][1]
        c.update(status='pass', actual='Unpartitioned report', evidence=['fixture: aggregate'], build_confirmed=True)
        s['capabilities'][0].update(status='available', evidence=['fixture: device report'], reason='')
        s['device_script'] = []
        self.assertFalse(runner.pass_for_scope(s, c, f, f['affects'][1]))
        self.assertFalse(runner.pass_for_regression(s, c, f, f['fix']['device_regressions'][0]))

    def grouped_regression_fix(self):
        s, f = self.proxy_device_fix(budget=2)
        c = s['checks'][1]
        first = f['fix']['device_regressions'][0]
        second = copy.deepcopy(first);second['id'] = 'DR-2'
        second['conditions']['state'] = 'landscape'
        second['conditions']['steps'] = ['Rotate to landscape', 'Focus final field']
        f['fix']['device_regressions'].append(second)
        c['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
        c['regression_conditions'] = [{'finding_id': 'F-01', 'regression_id': r['id'], 'conditions': copy.deepcopy(r['conditions'])} for r in (first, second)]
        c['conditions']['state'] = 'portrait then landscape'
        c['steps'] = ['Focus final field', 'Rotate to landscape', 'Focus final field']
        return s, f

    def test_proxy_plan_shared_states_use_separate_planned_snapshots_and_partial_results(self):
        s, f = self.grouped_regression_fix()
        self.assertEqual(self.assert_valid(s)['applied_device_entries'], ['C-01'])
        updated = runner.apply_results(s, self.result(status='partial', regression_results=[{'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'pass', 'actual': 'Portrait visible', 'evidence': ['fixture: portrait'], 'conditions_confirmed': True}]))
        summary = self.assert_valid(updated)
        self.assertEqual([r['status'] for r in summary['device_regressions']], ['pass', 'not_run'])
        self.assertEqual(updated['device_script'], ['C-01'])

    def test_proxy_plan_planned_snapshots_never_override_actual_mismatches(self):
        s, f = self.grouped_regression_fix()
        self.assert_valid(s)
        actual = {**f['fix']['device_regressions'][0]['conditions'], 'state': 'other'}
        updated = runner.apply_results(s, self.result(status='partial', regression_results=[{'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'pass', 'actual': 'Visible in other state', 'evidence': ['fixture: wrong state'], 'conditions': actual}]))
        self.assertEqual(self.assert_valid(updated)['device_regressions'][0]['status'], 'unestablished')

    def test_proxy_plan_rejects_invalid_planned_regression_snapshots(self):
        for mutation in ['duplicate', 'unknown', 'malformed', 'wrong-state']:
            s, f = self.proxy_device_fix()
            row = {'finding_id': 'F-01', 'regression_id': 'DR-1', 'conditions': copy.deepcopy(f['fix']['device_regressions'][0]['conditions'])}
            s['checks'][1]['regression_conditions'] = [row]
            self.assert_valid(s)
            if mutation == 'duplicate': s['checks'][1]['regression_conditions'].append(copy.deepcopy(row))
            elif mutation == 'unknown': row['regression_id'] = 'missing'
            elif mutation == 'malformed': s['checks'][1]['regression_conditions'] = ['bad snapshot']
            else: row['conditions']['state'] = 'wrong'
            self.assertTrue(runner.assess(s)['errors'])

    def test_legacy_target_plan_retains_empty_scope_results_compatibility(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0]['scope_results'] = []
        self.assertTrue(self.assert_valid(s)['claimable_complete'])
        updated = runner.apply_results(s, self.result(scope_results=[]))
        self.assert_valid(updated)
        self.assertEqual(updated['checks'][0]['status'], 'pass')

    def test_defaults_are_audit_only_and_propose(self):
        self.assertEqual((self.s['mode'], self.s['device_dependent_fixes'], self.s['device_check_budget']), ('audit_only', 'propose_only', 10))
        self.assert_valid()
        self.assertFalse(runner.assess(self.s)['claimable_complete'])

    def test_seven_modules_ten_areas(self):
        self.assertEqual(len(self.s['modules']), 7)
        self.assertEqual(len(self.s['coverage']), 10)

    def test_explicit_legacy_run_alias(self):
        self.assertEqual(runner.new_state(str(self.project), '/x', 'x', 'run')['mode'], 'audit_and_fix')

    def test_negative_and_boolean_budgets_rejected(self):
        for budget in (-1, True):
            with self.assertRaises(ValueError):
                runner.new_state(str(self.project), '/x', 'x', device_check_budget=budget)

    def test_fully_recorded_fixture_can_complete(self):
        a = self.assert_valid(self.complete())
        self.assertTrue(a['claimable_complete'])
        self.assertEqual(a['verification_ceiling'], 'target')

    def test_missing_module_rejected(self):
        self.s['modules'].pop()
        self.assertTrue(runner.assess(self.s)['errors'])

    def test_missing_area_rejected(self):
        self.s['coverage'].pop()
        self.assertTrue(runner.assess(self.s)['errors'])

    def test_unavailable_capability_cannot_claim_execution(self):
        s = self.complete()
        s['capabilities'][0].update(status='unavailable', reason='Route failed')
        self.assertTrue(runner.assess(s)['errors'])

    def test_pass_without_actual_or_evidence_rejected(self):
        s = self.complete()
        s['checks'][0].update(actual='', evidence=[])
        self.assertTrue(runner.assess(s)['errors'])

    def test_audit_source_changes_rejected(self):
        s, f = self.with_finding()
        s['changes'] = [{'path': 'form.css', 'summary': 'edited', 'finding_ids': ['F-01']}]
        self.assertTrue(runner.assess(s)['errors'])

    def test_verified_target_fix_accepted(self):
        s, f = self.with_finding(status='verified')
        self.assert_valid(s)

    def test_unfixed_verified_rejected(self):
        s, f = self.with_finding(applied=False, status='verified')
        self.assertTrue(runner.assess(s)['errors'])

    def test_static_only_verified_rejected(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0].update(level='mechanism', environment='static_review', evidence_type='static')
        s['capabilities'][0]['environment'] = 'static_review'
        self.assertTrue(runner.assess(s)['errors'])

    def test_desktop_proxy_verified_rejected(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0].update(level='proxy', environment='desktop_emulation', evidence_type='emulation')
        s['capabilities'][0]['environment'] = 'desktop_emulation'
        self.assertTrue(runner.assess(s)['errors'])

    def test_desktop_cannot_relabel_target(self):
        s = self.complete()
        s['checks'][0].update(environment='desktop_emulation', evidence_type='emulation')
        s['capabilities'][0]['environment'] = 'desktop_emulation'
        self.assertTrue(runner.assess(s)['errors'])

    def test_simulator_keyboard_target_allowed(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0].update(environment='os_simulator', evidence_type='emulation')
        s['capabilities'][0]['environment'] = 'os_simulator'
        self.assert_valid(s)

    def test_simulator_performance_target_rejected(self):
        s = self.complete()
        s['checks'][0].update(environment='os_simulator', evidence_type='emulation', behavior='performance')
        s['capabilities'][0]['environment'] = 'os_simulator'
        self.assertTrue(runner.assess(s)['errors'])

    def test_build_without_fix_rejected(self):
        s, f = self.with_finding(status='verified')
        s['builds'][1]['contains_fixes'] = []
        self.assertTrue(runner.assess(s)['errors'])

    def test_wrong_build_rejected(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0]['build_id'] = 'B-1'
        self.assertTrue(runner.assess(s)['errors'])

    def test_wrong_actual_configuration_rejected(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0]['configuration']['browser'] = 'Chrome'
        self.assertTrue(runner.assess(s)['errors'])

    def test_wrong_state_rejected(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0]['conditions']['state'] = 'landscape'
        self.assertTrue(runner.assess(s)['errors'])

    def test_unknown_dependency_blocks_verified(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['backend']
        s['checks'][0]['substitutions']['build'] = runner.substitution()
        self.assertTrue(runner.assess(s)['errors'])

    def test_unrelated_unknown_preserves_geometry(self):
        s, f = self.with_finding(status='verified')
        s['checks'][0]['substitutions']['build'] = runner.substitution()
        self.assert_valid(s)

    def test_stub_blocks_real_share_claim(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['share']
        s['checks'][0]['substitutions']['setup'] = mock()
        self.assertTrue(runner.assess(s)['errors'])

    def test_passthrough_not_replacement(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['share']
        sub = mock()
        sub['items'][0]['behavior'] = 'passthrough'
        s['checks'][0]['substitutions']['setup'] = sub
        self.assert_valid(s)

    def test_none_checked_requires_evidence(self):
        s = self.complete()
        s['checks'][0]['substitutions']['build']['evidence'] = []
        self.assertTrue(runner.assess(s)['errors'])

    def test_human_does_not_inherit_local_harness(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['share']
        s['standing_substitutions'] = [{**mock(), 'id': 'S-1', 'environments': ['*'], 'build_ids': ['*']}]
        self.assert_valid(s)
        s['checks'][0]['driver'] = 'agent'
        self.assertTrue(runner.assess(s)['errors'])

    def test_blocked_requires_explicit_assignment(self):
        s, f = self.with_finding(applied=False, status='blocked')
        f['reason'] = 'No phone'
        self.assertTrue(runner.assess(s)['errors'])
        f['status_assigned_by'] = 'user'
        self.assert_valid(s)

    def test_script_total_budget(self):
        s, f = self.with_finding()
        s['checks'][0] = self.check(status='not_run')
        s['device_script'] = ['C-01']
        s['device_check_budget'] = 0
        self.assertTrue(runner.assess(s)['errors'])

    def device_fix(self, budget=6, scopes=2):
        s, f = self.with_finding()
        s.update(mode='audit_and_fix', device_dependent_fixes='apply_and_hand_off', device_check_budget=budget)
        f['fix'].update(applied_before_run=False, device_dependent=True)
        f['affects'] = [{'id': f'state-{i}', 'conditions': conditions(state=f'state-{i}')} for i in range(scopes)]
        s['checks'] = [self.check(cid=f'C-{i+1:02d}', sid=f'state-{i}', status='not_run') for i in range(scopes)]
        f['verification_ids'] = []
        f['fix']['required_check_ids'] = [c['id'] for c in s['checks']]
        s['device_script'] = f['fix']['required_check_ids'][:]
        for a in s['coverage']:
            a.update(disposition='not_tested', check_ids=[c['id'] for c in s['checks']])
        s['coverage'][1]['disposition'] = 'defects_found'
        return s, f

    def test_two_entries_fit_three_entry_reservation(self):
        s, f = self.device_fix()
        a = self.assert_valid(s)
        self.assertEqual(a['applied_device_entries'], ['C-01', 'C-02'])

    def test_odd_budget_floors(self):
        s, f = self.device_fix(budget=3)
        self.assertTrue(runner.assess(s)['errors'])

    def test_missing_required_device_entry_rejected(self):
        s, f = self.device_fix()
        s['device_script'] = ['C-01']
        self.assertTrue(runner.assess(s)['errors'])

    def test_cannot_shrink_fix_check_scope(self):
        s, f = self.device_fix()
        f['fix']['required_check_ids'] = ['C-01']
        self.assertTrue(runner.assess(s)['errors'])

    def test_default_policy_forbids_device_fix(self):
        s, f = self.device_fix()
        s['device_dependent_fixes'] = 'propose_only'
        self.assertTrue(runner.assess(s)['errors'])

    def test_available_agent_target_check_does_not_consume_human_cap(self):
        s, f = self.device_fix(budget=2, scopes=2)
        s['checks'][1]['driver'] = 'agent'
        s['device_script'] = ['C-01']
        self.assertEqual(self.assert_valid(s)['applied_device_entries'], ['C-01'])

    def test_wrong_configuration_cannot_fill_applied_fix_plan(self):
        s, f = self.device_fix()
        s['checks'][1]['configuration']['browser'] = 'Wrong browser'
        self.assertTrue(runner.assess(s)['errors'])

    def test_missing_field_data_is_not_a_device_script_entry(self):
        s, f = self.device_fix(scopes=1)
        s['checks'][0].update(environment='field_data', evidence_type='manual',
                             field_data={'source': 'dashboard', 'collection_window': 'last 28 days',
                                         'scope': '/checkout', 'populations': ['Safari iOS'], 'metrics': ['LCP']})
        self.assertTrue(runner.assess(s)['errors'])

    def test_shared_entry_counts_once(self):
        s, f = self.device_fix(budget=2, scopes=1)
        g = copy.deepcopy(f)
        g['id'] = 'F-02'
        s['findings'].append(g)
        s['checks'][0]['covers'].append({'finding_id': 'F-02', 'scope_id': 'state-0'})
        s['builds'][1]['contains_fixes'].append('F-02')
        self.assertEqual(self.assert_valid(s)['applied_device_entries'], ['C-01'])

    def test_ordinary_edits_do_not_consume_reservation(self):
        s, f = self.with_finding()
        s['device_check_budget'] = 0
        self.assertEqual(self.assert_valid(s)['applied_device_entries'], [])

    def test_optional_current_failure_still_blocks(self):
        s = self.complete()
        s['checks'][0].update(status='fail', required=False)
        a = self.assert_valid(s)
        self.assertFalse(a['claimable_complete'])
        self.assertEqual(a['verification'], 'failed')

    def test_supported_baseline_supersession_keeps_history(self):
        s, f = self.with_finding(status='verified')
        baseline = self.check(cid='C-02', build='B-1', status='fail')
        baseline['superseded_by'] = 'C-01'
        s['checks'].append(baseline)
        a = self.assert_valid(s)
        self.assertNotEqual(a['verification'], 'failed')
        self.assertEqual(s['checks'][1]['status'], 'fail')

    def test_wrong_scope_supersession_rejected(self):
        s, f = self.with_finding(status='verified')
        baseline = self.check(cid='C-02', build='B-1', status='fail', browser='Chrome', device='Pixel')
        baseline['superseded_by'] = 'C-01'
        s['checks'].append(baseline)
        self.assertTrue(runner.assess(s)['errors'])

    def test_recommendation_is_not_defect(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence_class'] = 'recommendation'
        self.assertTrue(runner.assess(s)['errors'])
        s['coverage'][1]['disposition'] = 'no_defect_found'
        self.assert_valid(s)

    def test_untested_hypothesis_not_no_defect(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence_class'] = 'hypothesis'
        s['coverage'][1].update(disposition='no_defect_found', check_ids=[])
        self.assertTrue(runner.assess(s)['errors'])
        s['coverage'][1]['disposition'] = 'not_tested'
        self.assert_valid(s)

    def test_unfixed_bare_pass_stays_open(self):
        s, f = self.with_finding(applied=False, status='open')
        out = runner.apply_results(s, self.result(relation=None))
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assertIn('Not reproduced', out['findings'][0]['evidence'][-1]['note'])
        self.assert_valid(out)

    def test_matched_deterministic_prediction_can_close(self):
        s, f = self.with_finding(applied=False, status='open')
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['findings'][0]['status'], 'not_an_issue')
        self.assert_valid(out)

    def test_bare_pass_after_target_failure_stays_open(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence'].append({'ref': 'fixture: earlier real failure', 'level': 'target', 'observation': 'fail', 'scope_ids': ['portrait']})
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assert_valid(out)

    def test_reported_explanation_can_refute_earlier_target_observation(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence'].append({'ref': 'fixture: earlier real failure', 'level': 'target', 'observation': 'fail', 'scope_ids': ['portrait']})
        out = runner.apply_results(s, self.result(explains_prior_observation=True, contrary_explanation='Earlier screenshot used a stale stylesheet outside the claimed conditions'))
        self.assertEqual(out['findings'][0]['status'], 'not_an_issue')
        self.assert_valid(out)

    def test_intermittent_ten_passes_do_not_narrow_or_downgrade(self):
        s, f = self.with_finding(applied=False, status='open', deterministic=False)
        out = runner.apply_results(s, self.result(pass_count=10))
        g = out['findings'][0]
        self.assertEqual((g['status'], g['severity'], g['refuted_scopes']), ('open', 'P1', []))
        self.assertEqual(g['evidence'][-1]['pass_count'], 10)
        self.assert_valid(out)

    def test_unknown_determinism_is_intermittent(self):
        s, f = self.with_finding(applied=False, status='open')
        f.pop('determinism')
        self.assertEqual(runner.apply_results(s, self.result())['findings'][0]['status'], 'open')

    def test_interaction_does_not_refute_independent_requirement(self):
        s, f = self.with_finding(applied=False, status='open')
        f['independent_requirement'] = True
        self.assertEqual(runner.apply_results(s, self.result())['findings'][0]['status'], 'open')

    def test_different_account_does_not_close(self):
        s, f = self.with_finding(applied=False, status='open')
        changed = conditions()
        changed['account_data'] = 'other account'
        out = runner.apply_results(s, self.result(conditions=changed))
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assertIn('account_data differs', out['findings'][0]['evidence'][-1]['note'])

    def test_refuted_scope_cannot_be_prefilled(self):
        s, f = self.with_finding(applied=False, status='not_an_issue')
        f['refuted_scopes'] = ['portrait']
        self.assertTrue(runner.assess(s)['errors'])

    def test_cause_only_keeps_disposition(self):
        s, f = self.with_finding(status='verified')
        out = runner.apply_results(s, self.result(status='fail', relation='cause_only', actual='Cause was padding, not height', cause='Padding'))
        self.assertEqual(out['findings'][0]['status'], 'verified')
        self.assertEqual(out['findings'][0]['cause'], 'Padding')
        self.assert_valid(out)

    def test_recurring_defect_reopens_verified(self):
        s, f = self.with_finding(status='verified')
        out = runner.apply_results(s, self.result(status='fail', relation='defect_reproduced', actual='CTA hidden'))
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assertEqual(out['findings'][0]['evidence_class'], 'observed')
        self.assert_valid(out)

    def test_partial_portrait_preserved_landscape_not_run(self):
        s, f = self.with_finding(status='implemented')
        s['checks'][0] = self.check(status='not_run')
        f['affects'].append({'id': 'landscape', 'conditions': conditions(state='landscape')})
        s['checks'][0]['covers'].append({'finding_id': 'F-01', 'scope_id': 'landscape'})
        p = {'finding_id': 'F-01', 'scope_id': 'portrait', 'status': 'pass', 'actual': 'CTA visible', 'evidence': ['fixture: portrait']}
        out = runner.apply_results(s, self.result(scope_results=[p]))
        self.assertEqual(out['checks'][0]['status'], 'partial')
        self.assertEqual([p['status'] for p in out['checks'][0]['scope_results']], ['pass', 'not_run'])
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assert_valid(out)

    def test_changed_build_requires_new_check_id(self):
        s, f = self.with_finding()
        s['checks'][0] = self.check(status='not_run')
        with self.assertRaises(ValueError):
            runner.apply_results(s, self.result(build_id='B-1'))
        out = runner.apply_results(s, self.result(build_id='B-1', new_check_id='C-02'))
        self.assertEqual(len(out['checks']), 2)
        self.assertEqual(out['checks'][0]['build_id'], 'B-2')
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assert_valid(out)

    def test_unknown_build_stays_unknown_when_confirmed(self):
        s, f = self.with_finding()
        f['depends_on'] = ['backend']
        s['checks'][0]['substitutions']['build'] = runner.substitution()
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['checks'][0]['substitutions']['build']['status'], 'unknown')
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assert_valid(out)

    def test_unconfirmed_build_stays_limited(self):
        s, f = self.with_finding()
        out = runner.apply_results(s, self.result(build_confirmed=False))
        self.assertEqual(out['checks'][0]['substitutions']['build']['status'], 'not_reported')
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assert_valid(out)

    def test_build_confirmation_does_not_confirm_setup(self):
        s, f = self.with_finding()
        f['depends_on'] = ['share']
        s['checks'][0]['substitutions']['setup'] = mock()
        out = runner.apply_results(s, self.result(setup_confirmed=False))
        self.assertEqual(out['checks'][0]['substitutions']['setup']['status'], 'not_reported')
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assert_valid(out)

    def test_partial_refutation_keeps_remaining_scope(self):
        s, f = self.with_finding(applied=False, status='open')
        f['affects'].append({'id': 'landscape', 'conditions': conditions(state='landscape')})
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assertEqual(out['findings'][0]['refuted_scopes'], ['portrait'])
        self.assertEqual(len(out['findings'][0]['affects']), 2)
        self.assert_valid(out)

    def test_results_do_not_mutate_input(self):
        s, f = self.with_finding(applied=False, status='open')
        snapshot = copy.deepcopy(s)
        runner.apply_results(s, self.result())
        self.assertEqual(s, snapshot)

    def test_existing_alphanumeric_ids_survive_result_update(self):
        s, f = self.with_finding()
        f['id'] = 'F-05A'
        f['verification_ids'] = ['C-05A']
        s['builds'][1]['contains_fixes'] = ['F-05A']
        s['checks'][0]['id'] = 'C-05A'
        s['checks'][0]['covers'][0]['finding_id'] = 'F-05A'
        for area in s['coverage']:
            area['check_ids'] = ['C-05A']
            area['finding_ids'] = ['F-05A'] if area['id'] == 2 else []
        out = runner.apply_results(s, self.result(check_id='C-05A'))
        self.assertEqual(out['findings'][0]['id'], 'F-05A')
        self.assertEqual(out['checks'][0]['id'], 'C-05A')
        self.assertEqual(out['findings'][0]['status'], 'verified')
        self.assert_valid(out)

    def test_renderer_has_seven_numbered_outputs_and_findings(self):
        s, f = self.with_finding()
        report = runner.render_report(s, runner.assess(s))
        self.assertTrue(report.startswith('Ceiling:'))
        for title in ('## 1. Verdict', '## 2. Coverage', '## 3. Findings', '## 4. Recommendations', '## 5. Changes', '## 6. Device', '## 7. Open'):
            self.assertIn(title, report)
        self.assertIn('F-01', report)

    def test_legacy_migration_preserves_snapshot_without_authorization_upgrade(self):
        old = {'schema_version': 1, 'run_id': 'old', 'project': str(self.project), 'target': '/checkout', 'principal_task': 'buy',
               'mode': 'run', 'checks': [{'id': 'T-001', 'module': 2, 'required': True, 'scenario': 'resize', 'expected': 'visible',
                                         'status': 'pass', 'evidence_type': 'emulation', 'evidence': ['oldtrace']}],
               'findings': [self.finding(status='verified')], 'changes': [{'path': 'form.css', 'summary': 'old edit', 'finding_ids': ['F-01']}]}
        migrated = runner.migrate_state(old)
        self.assertEqual(migrated['legacy_snapshot'], old)
        self.assertEqual(migrated['mode'], 'audit_only')
        self.assertEqual(migrated['checks'][0]['status'], 'not_run')
        self.assertEqual(migrated['findings'][0]['status'], 'implemented')
        self.assert_valid(migrated)

    def test_field_acquisition_and_scope_metadata(self):
        s = self.complete()
        c = s['checks'][0]
        c.update(environment='field_data', evidence_type='automated', behavior='performance',
                 field_data={'source': 'CrUX API', 'collection_window': '28 days', 'scope': 'https://example.test',
                             'populations': ['Chrome Android'], 'metrics': ['LCP']})
        s['capabilities'][0]['environment'] = 'field_data'
        self.assert_valid(s)
        c['evidence_type'] = 'manual'
        self.assert_valid(s)
        c['field_data'].pop('collection_window')
        self.assertTrue(runner.assess(s)['errors'])

    def test_field_target_cannot_verify_uncovered_population(self):
        s, f = self.with_finding(status='verified')
        c = s['checks'][0]
        c.update(environment='field_data', evidence_type='automated', behavior='performance',
                 field_data={'source': 'CrUX API', 'collection_window': '28 days', 'scope': 'https://example.test',
                             'populations': ['Chrome Android'], 'metrics': ['LCP']})
        s['capabilities'][0]['environment'] = 'field_data'
        f['metric_claim'] = {'scope': 'https://example.test', 'metrics': ['LCP'], 'populations': ['Safari iOS']}
        self.assertTrue(runner.assess(s)['errors'])

    def test_named_build_unknown_cannot_be_erased_by_check(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['backend']
        s['builds'][1]['substitutions'] = runner.substitution()
        self.assertTrue(runner.assess(s)['errors'])

    def test_reported_wiring_override_requires_evidence(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['backend']
        s['builds'][1]['substitutions'] = runner.substitution()
        s['checks'][0]['build_substitution_override'] = {'reason': 'Tester inspected deployment configuration', 'evidence': ['fixture: config export']}
        self.assert_valid(s)
        s['checks'][0]['build_substitution_override']['evidence'] = []
        self.assertTrue(runner.assess(s)['errors'])

    def test_dependency_wildcard_blocks_any_replacement(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['*']
        s['checks'][0]['substitutions']['setup'] = mock('backend')
        self.assertTrue(runner.assess(s)['errors'])

    def test_dependency_wildcard_blocks_specific_unknown(self):
        s, f = self.with_finding(status='verified')
        f['depends_on'] = ['*']
        sub = runner.substitution()
        sub['unknown_boundaries'] = ['backend']
        s['checks'][0]['substitutions']['setup'] = sub
        self.assertTrue(runner.assess(s)['errors'])

    def test_unclassified_observed_failure_is_not_assumed_proxy(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence_class'] = 'observed'
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['findings'][0]['status'], 'open')
        self.assert_valid(out)

    def test_explicit_proxy_observation_can_be_refuted(self):
        s, f = self.with_finding(applied=False, status='open')
        f['evidence_class'] = 'observed'
        f['evidence'] = [{'ref': 'fixture: desktop observation', 'level': 'proxy', 'observation': 'fail', 'scope_ids': ['portrait']}]
        out = runner.apply_results(s, self.result())
        self.assertEqual(out['findings'][0]['status'], 'not_an_issue')
        self.assert_valid(out)

    def test_complementary_results_retain_prior_clear_portion(self):
        s, f = self.with_finding()
        s['checks'][0] = self.check(status='not_run')
        f['affects'].append({'id': 'landscape', 'conditions': conditions(state='landscape')})
        s['checks'][0]['covers'].append({'finding_id': 'F-01', 'scope_id': 'landscape'})
        portrait = {'finding_id': 'F-01', 'scope_id': 'portrait', 'status': 'pass', 'actual': 'Portrait visible',
                    'evidence': ['fixture: portrait'], 'conditions_confirmed': True}
        landscape = {'finding_id': 'F-01', 'scope_id': 'landscape', 'status': 'pass', 'actual': 'Landscape visible',
                     'evidence': ['fixture: landscape'], 'conditions_confirmed': True}
        first = runner.apply_results(s, self.result(scope_results=[portrait]))
        self.assertEqual(first['findings'][0]['status'], 'implemented')
        second = runner.apply_results(first, self.result(scope_results=[landscape]))
        self.assertEqual(second['findings'][0]['status'], 'verified')
        self.assertEqual([o['status'] for o in second['checks'][0]['scope_results']], ['pass', 'pass'])
        self.assert_valid(second)

    def test_explicit_missing_portion_does_not_invent_pass(self):
        s, f = self.with_finding()
        s['checks'][0] = self.check(status='not_run')
        f['affects'].append({'id': 'landscape', 'conditions': conditions(state='landscape')})
        s['checks'][0]['covers'].append({'finding_id': 'F-01', 'scope_id': 'landscape'})
        portrait = {'finding_id': 'F-01', 'scope_id': 'portrait', 'status': 'pass', 'actual': 'Portrait visible', 'evidence': ['fixture: portrait']}
        landscape = {'finding_id': 'F-01', 'scope_id': 'landscape', 'status': 'not_run', 'reason': 'Not tested'}
        out = runner.apply_results(s, self.result(scope_results=[portrait, landscape], all_steps_confirmed=True))
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assertEqual(out['checks'][0]['scope_results'][1]['status'], 'not_run')
        self.assert_valid(out)

    def test_lost_verification_support_demotes_without_inventing_recurrence(self):
        s, f = self.with_finding(status='verified')
        out = runner.apply_results(s, self.result(build_confirmed=False))
        self.assertEqual(out['findings'][0]['status'], 'implemented')
        self.assertIn('no recurrence inferred', out['findings'][0]['reason'])
        self.assert_valid(out)

    def test_migration_preserves_unavailable_project_identity(self):
        old = {'schema_version': 1, 'project': '/fixture/missing-original-project', 'mode': 'run', 'target': '/old',
               'principal_task': 'old task', 'checks': [], 'findings': [], 'changes': []}
        out = runner.migrate_state(old)
        self.assertEqual(out['project'], '/fixture/missing-original-project')
        self.assert_valid(out)

    def test_migration_preserves_valid_ids_and_avoids_generated_collisions(self):
        old = {'schema_version': 1, 'project': str(self.project), 'target': '/old', 'principal_task': 'old task', 'checks': [],
               'findings': [self.finding(applied=False, status='open'), self.finding(applied=False, status='open')], 'changes': []}
        old['findings'][0]['id'] = 'legacy-invalid'
        old['checks'] = [self.check(cid='C-01'), self.check(cid='legacy-invalid')]
        out = runner.migrate_state(old)
        self.assertEqual([f['id'] for f in out['findings']], ['F-02', 'F-01'])
        self.assertEqual([c['id'] for c in out['checks']], ['C-01', 'C-02'])
        self.assert_valid(out)

    def test_unrelated_failure_does_not_erase_valid_prior_refutation(self):
        s, f = self.with_finding(applied=False, status='open')
        closed = runner.apply_results(s, self.result())
        later = runner.apply_results(closed, self.result(status='fail', relation='unrelated', actual='Separate network error'))
        self.assertEqual(later['findings'][0]['status'], 'not_an_issue')
        self.assert_valid(later)

    def test_ceiling_names_actual_environment_and_target_limit(self):
        s = self.complete()
        s['checks'][0].update(environment='desktop_emulation', evidence_type='emulation', level='proxy')
        s['capabilities'][0]['environment'] = 'desktop_emulation'
        first = runner.render_report(s, runner.assess(s)).splitlines()[0]
        self.assertIn('desktop_emulation', first)
        self.assertIn('no available simulator or physical device', first)

    def test_cli_default_and_new_file_output(self):
        out = subprocess.run([sys.executable, str(SCRIPT), 'init', '--project', str(self.project), '--target', '/x', '--task', 'x',
                              '--output-dir', str(self.project / 'runs')], capture_output=True, text=True)
        self.assertEqual(out.returncode, 0, out.stderr)
        run_file = Path(json.loads(out.stdout)['run_file'])
        state = json.loads(run_file.read_text())
        self.assertEqual(state['mode'], 'audit_only')
        check = subprocess.run([sys.executable, str(SCRIPT), 'check', str(run_file)], capture_output=True, text=True)
        self.assertEqual(check.returncode, 3, check.stderr)
        with self.assertRaises(FileExistsError):
            runner.write_new(str(run_file), state)

    def test_cli_migrate_results_report_round_trip(self):
        s, f = self.with_finding()
        s['checks'][0] = self.check(status='not_run')
        s['device_script'] = ['C-01']
        source = self.project / 'run.json'
        results = self.project / 'results.json'
        updated = self.project / 'updated.json'
        source.write_text(json.dumps(s))
        results.write_text(json.dumps(self.result()))
        applied = subprocess.run([sys.executable, str(SCRIPT), 'apply-results', '--input', str(source), '--results', str(results),
                                  '--output', str(updated)], capture_output=True, text=True)
        self.assertEqual(applied.returncode, 0, applied.stdout + applied.stderr)
        self.assertEqual(json.loads(updated.read_text())['findings'][0]['status'], 'verified')
        report = subprocess.run([sys.executable, str(SCRIPT), 'report', str(updated)], capture_output=True, text=True)
        self.assertEqual(report.returncode, 0, report.stdout + report.stderr)
        self.assertIn('## 3. Findings', (self.project / 'report.md').read_text())
        legacy = self.project / 'legacy.json'
        migrated = self.project / 'migrated.json'
        legacy_state = {'schema_version': 1, 'project': str(self.project), 'mode': 'run', 'target': '/old',
                        'principal_task': 'old task', 'checks': [], 'findings': [], 'changes': []}
        legacy.write_text(json.dumps(legacy_state))
        migration = subprocess.run([sys.executable, str(SCRIPT), 'migrate', '--input', str(legacy), '--output', str(migrated)],
                                   capture_output=True, text=True)
        self.assertEqual(migration.returncode, 0, migration.stdout + migration.stderr)
        self.assertEqual(json.loads(migrated.read_text())['legacy_snapshot'], legacy_state)


if __name__ == '__main__':
    unittest.main(verbosity=2)
