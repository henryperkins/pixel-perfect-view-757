"""Synthetic CLI contract checks; no browser, device, app or plugin installation."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

WORK = Path(__file__).resolve().parents[1]
ROOT = WORK / 'app-checkout/tools/mobile-web-ux-runner/skills/mobile-web-ux-runner'
SCRIPT = ROOT / 'scripts/run_state.py'
FIXTURES = WORK / 'validation/cli-fixtures'
FIXTURES.mkdir()
spec = importlib.util.spec_from_file_location('runner_cli_fixtures', ROOT / 'tests/test_run_state.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
test = module.RunnerTests()
test.setUp()
test.project = FIXTURES
test.s = module.runner.new_state(str(FIXTURES), '/checkout', 'Synthetic CLI fixture')
results = []

def call(name, args, expected):
    p = subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], capture_output=True, text=True)
    (FIXTURES / (name + '.stdout')).write_text(p.stdout)
    (FIXTURES / (name + '.stderr')).write_text(p.stderr)
    record = {'name': name, 'args': list(map(str, args)), 'expected_exit': expected, 'actual_exit': p.returncode}
    results.append(record)
    assert p.returncode == expected, (record, p.stdout, p.stderr)
    return json.loads(p.stdout) if p.stdout.strip().startswith('{') else None

def write(name, value):
    p = FIXTURES / name
    p.write_text(json.dumps(value, indent=2) + '\n')
    return p

try:
    initialized = call('01-init-default', ['init', '--project', FIXTURES, '--target', '/checkout', '--task', 'Synthetic CLI fixture', '--output-dir', FIXTURES / 'initialized'], 0)
    default = Path(initialized['run_file'])
    assert json.loads(default.read_text())['mode'] == 'audit_only'
    call('02-check-incomplete', ['check', default], 3)
    call('03-report-incomplete', ['report', default], 3)
    call('04-negative-budget', ['init', '--project', FIXTURES, '--target', '/checkout', '--task', 'Synthetic CLI fixture', '--device-check-budget', '-1'], 2)
    complete = write('complete.json', test.complete())
    call('05-check-complete-fixture', ['check', complete], 0)
    state, finding = test.proxy_device_fix(budget=2)
    second = json.loads(json.dumps(finding['fix']['device_regressions'][0]));second['id'] = 'DR-2'
    finding['fix']['device_regressions'].append(second)
    state['checks'][1]['regression_covers'].append({'finding_id': 'F-01', 'regression_id': 'DR-2'})
    proxy = write('proxy.json', state)
    prior_hash = hashlib.sha256(proxy.read_bytes()).hexdigest()
    a = call('06-check-proxy-plan', ['check', proxy], 3)
    assert a['errors'] == [] and a['verification_ceiling'] == 'proxy'
    call('07-report-proxy-plan', ['report', proxy], 3)
    reported = write('portrait-only.json', test.result(status='partial', regression_results=[{'finding_id': 'F-01', 'regression_id': 'DR-1', 'status': 'pass', 'actual': 'Synthetic portrait result', 'evidence': ['fixture only'], 'conditions_confirmed': True}]))
    partial = FIXTURES / 'partial.json'
    call('08-apply-partial', ['apply-results', '--input', proxy, '--results', reported, '--output', partial], 0)
    a = call('09-check-partial', ['check', partial], 3)
    assert [r['status'] for r in a['device_regressions']] == ['pass', 'not_run']
    wrong = write('wrong-result.json', test.result(regression_results=[{'finding_id': 'F-01', 'regression_id': 'MISSING', 'status': 'pass'}]))
    rejected = FIXTURES / 'rejected.json'
    call('10-reject-out-of-plan-result', ['apply-results', '--input', proxy, '--results', wrong, '--output', rejected], 2)
    assert not rejected.exists()
    partial_hash = hashlib.sha256(partial.read_bytes()).hexdigest()
    call('11-refuse-overwrite', ['apply-results', '--input', proxy, '--results', reported, '--output', partial], 2)
    assert hashlib.sha256(partial.read_bytes()).hexdigest() == partial_hash
    malformed = write('malformed.json', {'schema_version': 2, 'checks': 'not a list'})
    call('12-reject-malformed-ledger', ['check', malformed], 2)
    assert hashlib.sha256(proxy.read_bytes()).hexdigest() == prior_hash
    (WORK / 'validation/cli-results.json').write_text(json.dumps({'kind': 'synthetic_cli_checks', 'passed': len(results), 'failed': 0, 'input_preserved': True, 'physical_device_execution': 'not_run', 'checks': results}, indent=2) + '\n')
    print(json.dumps({'passed': len(results), 'failed': 0, 'physical_device_execution': 'not_run'}))
finally:
    test.doCleanups()
