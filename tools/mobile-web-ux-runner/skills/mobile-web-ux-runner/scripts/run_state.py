#!/usr/bin/env python3
"""Maintain r2 audit evidence records; never execute or modify application code.

Python 3.9+, standard library. Evidence references are declarations, not authenticated
proof. Validation constrains claims made by the supplied records, not omitted work.
"""
from __future__ import annotations
import argparse
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import sys
from typing import Any
import uuid

VERSION = '2.0.1'
CONTRACT_REVISION = '2026-10-20-r2'
MODULES = ('Principal journey and mobile UX', 'Viewport, browser chrome and safe areas',
           'Virtual keyboard and forms', 'Touch targets, reach and feedback',
           'Overlays, navigation and data', 'Gestures and scrolling',
           'Performance, pending states and recovery')
AREAS = ('Reach and placement', 'Viewport and safe areas', 'Touch targets',
         'Forms and keyboard', 'Gestures and scrolling', 'Overlays, navigation and dense data',
         'Content priority', 'Performance', 'Errors and recovery', 'Accessibility on mobile')
PHASES = ('preflight', 'baseline', 'assessment', 'remediation', 'verification', 'handoff')
ENVIRONMENTS = {'static_review', 'automated_test', 'desktop_emulation', 'os_simulator',
                'physical_device', 'field_data'}
ACQUISITION = {'static_review': {'static'}, 'automated_test': {'automated'},
               'desktop_emulation': {'emulation'}, 'os_simulator': {'emulation'},
               'physical_device': {'physical_device'}, 'field_data': {'automated', 'manual'}}
SIMULATOR_TARGET = {'browser_ui', 'rendering', 'safe_area', 'software_keyboard', 'focus_zoom'}
CONDITION_FIELDS = ('build_id', 'browser', 'device', 'state', 'account_data', 'setup',
                    'steps', 'timing', 'substitutions')
MODES = {'audit': 'audit_only', 'run': 'audit_and_fix', 'audit_only': 'audit_only',
         'audit_and_fix': 'audit_and_fix', 'verify': 'verify'}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def nonblank(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def objects(value: Any) -> list:
    return [x for x in value if isinstance(x, dict)] if isinstance(value, list) else []


def evidence_ok(value: Any) -> bool:
    return isinstance(value, list) and bool(value) and all(
        nonblank(x) or isinstance(x, dict) and nonblank(x.get('ref')) for x in value)


def ids(value: Any) -> list:
    return value if isinstance(value, list) and all(isinstance(x, str) for x in value) else []


def substitution(status: str = 'unknown', reason: str = 'Not established') -> dict:
    return {'status': status, 'items': [], 'unknown_boundaries': ['*'] if status == 'unknown' else [],
            'evidence': [], 'reason': reason}


def git_read(project: Path, *args: str) -> str:
    try:
        r = subprocess.run(['git', '-C', str(project), *args], capture_output=True,
                           text=True, timeout=10, check=False)
        return r.stdout.strip() if r.returncode == 0 else ''
    except (OSError, subprocess.TimeoutExpired):
        return ''


def new_state(project: str, target: str, task: str, mode: str = 'audit_only',
              device_dependent_fixes: str = 'propose_only', device_check_budget: int = 10) -> dict:
    root = Path(project).expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f'Project directory does not exist: {root}')
    if not nonblank(target) or not nonblank(task):
        raise ValueError('Target and principal task must not be empty')
    if mode not in MODES:
        raise ValueError('Invalid mode')
    if device_dependent_fixes not in ('propose_only', 'apply_and_hand_off'):
        raise ValueError('Invalid device-dependent fix policy')
    if type(device_check_budget) is not int or device_check_budget < 0:
        raise ValueError('Device check budget must be a nonnegative integer')
    pending = lambda: {'status': 'pending', 'evidence': [], 'reason': ''}
    return {
        'schema_version': 2, 'skill_version': VERSION, 'contract_revision': CONTRACT_REVISION,
        'run_id': datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8],
        'created_at': now(), 'mode': MODES[mode], 'operation': 'audit',
        'device_dependent_fixes': device_dependent_fixes, 'device_check_budget': device_check_budget,
        'project': str(root), 'target': target, 'principal_task': task,
        'project_revision_before': git_read(root, 'rev-parse', 'HEAD'), 'project_revision_after': '',
        'dirty_before': git_read(root, 'status', '--porcelain=v1'),
        'scope': {'included': [target], 'excluded': [], 'browser_policy': 'unresolved'},
        'capabilities': [], 'builds': [], 'standing_substitutions': [], 'assumptions': [],
        'impeccable': {'status': 'not_run', 'version': '', 'evidence': [], 'reason': 'Preflight has not run'},
        'launch': {'status': 'not_run', 'url': '', 'evidence': [], 'reason': 'Runtime not inspected'},
        'phases': {name: pending() for name in PHASES},
        'modules': [{'id': i, 'name': name, **pending()} for i, name in enumerate(MODULES, 1)],
        'coverage': [{'id': i, 'name': name, 'disposition': 'not_tested', 'check_ids': [],
                      'finding_ids': [], 'remaining': [], 'reason': 'No checks completed'}
                     for i, name in enumerate(AREAS, 1)],
        'commands': [], 'findings': [], 'changes': [], 'checks': [], 'device_script': [],
        'beyond_budget': [], 'cleanup': pending(), 'limitations': [], 'next_steps': [], 'history': [],
    }


def index(rows: Any) -> dict:
    return {x['id']: x for x in objects(rows) if isinstance(x.get('id'), str)}


def covers(check: dict) -> set:
    return {(x.get('finding_id'), x.get('scope_id')) for x in objects(check.get('covers'))
            if isinstance(x.get('finding_id'), str) and isinstance(x.get('scope_id'), str)}


def scope_for(finding: dict, sid: str) -> dict:
    return next((x for x in objects(finding.get('affects')) if x.get('id') == sid), {})


def active_scopes(finding: dict) -> list:
    refuted = ids(finding.get('refuted_scopes', []))
    return [s for s in objects(finding.get('affects')) if s.get('id') not in refuted]


def outcome_for(check: dict, fid: str, sid: str) -> dict:
    rows = objects(check.get('scope_results'))
    if rows or 'scope_results' in check and regression_covers(check):
        return next((r for r in rows if r.get('finding_id') == fid and r.get('scope_id') == sid),
                    {'status': 'not_run', 'reason': 'This portion was not reported'})
    if regression_covers(check) and len(covers(check)) + len(regression_covers(check)) > 1:
        return {'status': 'not_run', 'reason': 'Separate scope/regression portions were not reported'}
    return check


def check_conditions(check: dict, fid: str, sid: str) -> dict:
    value = outcome_for(check, fid, sid).get('conditions', check.get('conditions', {}))
    return value if isinstance(value, dict) else {}


def match_conditions(claimed: Any, actual: Any, fixed: bool = False) -> list:
    if not isinstance(claimed, dict) or not isinstance(actual, dict):
        return ['conditions not reported']
    mismatches = []
    keys = set(CONDITION_FIELDS) | set(claimed)
    if fixed:
        keys -= {'build_id', 'substitutions'}
    for key in sorted(keys):
        if key not in claimed or key not in actual or claimed[key] in ('', None, []):
            mismatches.append(f'{key} unreported')
        elif claimed[key] != actual[key]:
            mismatches.append(f'{key} differs')
    return mismatches


def effective_substitutions(state: dict, check: dict) -> list:
    result = []
    override = check.get('build_substitution_override', {})
    if not (isinstance(override, dict) and nonblank(override.get('reason')) and evidence_ok(override.get('evidence'))):
        named_build = index(state.get('builds')).get(check.get('build_id'), {})
        result.append(named_build.get('substitutions', substitution('unknown', 'Named build wiring not established')))
    if check.get('driver') != 'person':
        for sub in objects(state.get('standing_substitutions')):
            envs, builds = ids(sub.get('environments')), ids(sub.get('build_ids'))
            if ('*' in envs or check.get('environment') in envs) and ('*' in builds or check.get('build_id') in builds):
                result.append(sub)
    explicit = check.get('substitutions')
    if isinstance(explicit, dict):
        for part in ('build', 'setup', 'additional'):
            result.append(explicit.get(part, substitution('not_reported', f'{part} not reported')))
    else:
        result.append(substitution('not_reported', 'Check substitutions not reported'))
    return result


def dependency_limits(state: dict, check: dict, dependencies: list) -> list:
    limits = []
    for sub in effective_substitutions(state, check):
        if not isinstance(sub, dict):
            limits.append('substitutions not reported')
            continue
        status = sub.get('status')
        unknown = ids(sub.get('unknown_boundaries'))
        if (status in ('unknown', 'not_reported') or unknown) and (not unknown or '*' in unknown or '*' in dependencies or set(unknown) & set(dependencies)):
            if dependencies:
                limits.append('unknown or unreported relevant dependency')
        for item in objects(sub.get('items')):
            if item.get('behavior', 'replaced') == 'replaced' and ('*' in dependencies or item.get('boundary') in dependencies):
                limits.append(f"replaced boundary: {item.get('boundary')}")
    return sorted(set(limits))


def target_valid(state: dict, check: dict) -> bool:
    if check.get('level') != 'target':
        return False
    env = check.get('environment')
    if env in ('static_review', 'automated_test', 'desktop_emulation'):
        return False
    if env == 'os_simulator' and check.get('behavior') not in SIMULATOR_TARGET:
        return False
    if env not in ('os_simulator', 'physical_device', 'field_data'):
        return False
    cap = index(state.get('capabilities')).get(check.get('capability_id'), {})
    return cap.get('status') == 'available' and cap.get('environment') == env


def pass_for_scope(state: dict, check: dict, finding: dict, scope: dict, fixed: bool = True) -> bool:
    fid, sid = finding.get('id'), scope.get('id')
    out = outcome_for(check, fid, sid)
    if (fid, sid) not in covers(check) or out.get('status') != 'pass':
        return False
    if not evidence_ok(out.get('evidence')) or not nonblank(out.get('actual')) or not target_valid(state, check):
        return False
    if match_conditions(scope.get('conditions'), check_conditions(check, fid, sid), fixed=fixed):
        return False
    configuration = check.get('configuration', {})
    if not isinstance(configuration, dict) or any(configuration.get(k) != scope.get('conditions', {}).get(k)
                                                 for k in ('browser', 'device')):
        return False
    if check.get('environment') == 'field_data':
        claim, field = finding.get('metric_claim', {}), check.get('field_data', {})
        if not isinstance(claim, dict) or not isinstance(field, dict) or not all(claim.get(k) for k in ('scope', 'metrics', 'populations')):
            return False
        if claim['scope'] != field.get('scope') or not set(claim['metrics']) <= set(field.get('metrics', [])) or not set(claim['populations']) <= set(field.get('populations', [])):
            return False
    if dependency_limits(state, check, ids(finding.get('depends_on', []))):
        return False
    if fixed:
        fix = finding.get('fix', {})
        build = index(state.get('builds')).get(check.get('build_id'), {})
        if not fix.get('applied') or check.get('build_id') != fix.get('build_id') or fid not in ids(build.get('contains_fixes')):
            return False
        if check.get('driver') == 'person' and not check.get('build_confirmed'):
            return False
    return True


def planned_target_matches(check: dict, finding: dict, scope: dict) -> bool:
    """A future entry must describe the claimed configuration, not just carry its ID."""
    env = check.get('environment')
    if check.get('level') != 'target' or env not in ('physical_device', 'os_simulator', 'field_data'):
        return False
    if env == 'os_simulator' and check.get('behavior') not in SIMULATOR_TARGET:
        return False
    if check.get('build_id') != finding.get('fix', {}).get('build_id'):
        return False
    configuration = check.get('configuration', {})
    if not isinstance(configuration, dict) or any(configuration.get(k) != scope.get('conditions', {}).get(k)
                                                 for k in ('browser', 'device')):
        return False
    return not match_conditions(scope.get('conditions'), check_conditions(check, finding.get('id'), scope.get('id')), fixed=True)


def regression_covers(check: dict) -> set:
    return {(x.get('finding_id'), x.get('regression_id')) for x in objects(check.get('regression_covers'))
            if isinstance(x.get('finding_id'), str) and isinstance(x.get('regression_id'), str)}


def regression_for(finding: dict, rid: str) -> dict:
    return next((r for r in objects(finding.get('fix', {}).get('device_regressions')) if r.get('id') == rid), {})


def non_target_origin(finding: dict, sid: str) -> bool:
    """Only explicit scoped mechanism/proxy evidence permits independent device plans."""
    relevant = []
    for item in finding.get('evidence', []):
        if not isinstance(item, dict):
            return False  # Unclassified provenance cannot silently weaken the original gate.
        if item.get('scope_ids') and sid not in ids(item.get('scope_ids')):
            continue
        relevant.append(item)
    return bool(relevant) and all(item.get('level') in ('mechanism', 'proxy')
                                  and nonblank(item.get('observation')) for item in relevant)


def regression_outcome_for(check: dict, fid: str, rid: str) -> dict:
    rows = objects(check.get('regression_results'))
    if 'regression_results' in check:
        return next((r for r in rows if r.get('finding_id') == fid and r.get('regression_id') == rid),
                    {'status': 'not_run', 'reason': 'This regression portion was not reported'})
    if len(covers(check)) + len(regression_covers(check)) > 1:
        return {'status': 'not_run', 'reason': 'Separate regression portions were not reported'}
    return check


def regression_conditions_match(state: dict, check: dict, finding: dict, regression: dict, conditions: Any) -> bool:
    """Match the device requirement, never the source/proxy observation it protects."""
    if (check.get('level') != 'target' or check.get('environment') != regression.get('environment')
            or check.get('environment') not in ('physical_device', 'os_simulator')
            or check.get('behavior') != regression.get('behavior')):
        return False
    if check.get('environment') == 'os_simulator' and check.get('behavior') not in SIMULATOR_TARGET:
        return False
    expected = regression.get('conditions', {})
    build = index(state.get('builds')).get(check.get('build_id'), {})
    if (check.get('build_id') != expected.get('build_id')
            or finding.get('id') not in ids(build.get('contains_fixes'))):
        return False
    configuration = check.get('configuration', {})
    return isinstance(configuration, dict) and all(configuration.get(k) == expected.get(k)
            for k in ('browser', 'device')) and not match_conditions(expected, conditions)


def planned_regression_matches(state: dict, check: dict, finding: dict, regression: dict) -> bool:
    snapshot = next((r for r in objects(check.get('regression_conditions'))
                     if r.get('finding_id') == finding.get('id') and r.get('regression_id') == regression.get('id')), {})
    return regression_conditions_match(state, check, finding, regression, snapshot.get('conditions', check.get('conditions')))


def pass_for_regression(state: dict, check: dict, finding: dict, regression: dict) -> bool:
    fid, rid = finding.get('id'), regression.get('id')
    if (fid, rid) not in regression_covers(check):
        return False
    out = regression_outcome_for(check, fid, rid)
    if (out.get('status') != 'pass' or not nonblank(out.get('actual'))
            or not evidence_ok(out.get('evidence')) or not target_valid(state, check)):
        return False
    if not regression_conditions_match(state, check, finding, regression, out.get('conditions', check.get('conditions'))):
        return False
    if check.get('driver') == 'person' and not check.get('build_confirmed'):
        return False
    dependencies = ids(finding.get('depends_on', [])) + ids(regression.get('depends_on', []))
    return not dependency_limits(state, check, dependencies)


def contrary_qualification(state: dict, check: dict, finding: dict, scope: dict, reported: dict) -> tuple:
    fid, sid = finding.get('id'), scope.get('id')
    out = outcome_for(check, fid, sid)
    mismatch = match_conditions(scope.get('conditions'), check_conditions(check, fid, sid))
    if mismatch:
        return False, 'Not reproduced; unmatched conditions: ' + ', '.join(mismatch)
    if not pass_for_scope(state, check, finding, scope, fixed=False):
        return False, 'Not reproduced; target evidence or relevant dependencies are insufficient'
    if reported.get('relation') == 'cause_only':
        return False, 'Cause-only evidence does not refute the defect'
    if finding.get('independent_requirement') and not nonblank(reported.get('requirement_refutation')):
        return False, 'Successful interaction does not refute the independent requirement'
    prior_target_failure = any(isinstance(e, dict) and e.get('level') == 'target'
                               and e.get('observation') == 'fail'
                               and e.get('relation') not in ('unrelated', 'cause_only')
                               and (not e.get('scope_ids') or sid in e.get('scope_ids', []))
                               for e in finding.get('evidence', []))
    if finding.get('evidence_class') == 'observed' and any(not isinstance(e, dict) or not e.get('level') or not e.get('observation')
                                                        for e in finding.get('evidence', [])):
        prior_target_failure = True  # Unclassified Observed provenance must not be assumed to be proxy.
    if prior_target_failure and not (reported.get('explains_prior_observation') is True
                                    and nonblank(reported.get('contrary_explanation'))):
        return False, 'A prior target observation needs a reported discrepancy explanation'
    if finding.get('determinism', 'unknown') != 'deterministic':
        if not (type(reported.get('pass_count')) is int and reported['pass_count'] > 0
                and nonblank(reported.get('causal_explanation')) and reported.get('mechanism_ruled_out') is True):
            return False, 'Intermittent/unknown claim: record passes; no causal refutation supplied'
        return True, reported['causal_explanation']
    if prior_target_failure:
        return True, reported['contrary_explanation']
    if finding.get('independent_requirement'):
        return True, reported['requirement_refutation']
    if reported.get('relation') != 'prediction_contradicted':
        return False, 'Not reproduced; no contradiction of the claimed prediction reported'
    return True, reported.get('contrary_explanation') or (
        'Matched target result contradicts the predicted behavior: ' + str(finding.get('actual', finding.get('title', ''))) +
        '. Target observation: ' + str(out.get('actual', '')))


def failed_superseded(state: dict, check: dict, check_index: dict, findings: dict) -> bool:
    replacement = check_index.get(check.get('superseded_by'), {})
    old_covers = covers(check)
    if not old_covers or replacement.get('id') == check.get('id') or not old_covers <= covers(replacement):
        return False
    if check.get('configuration') != replacement.get('configuration'):
        return False
    for fid, sid in old_covers:
        finding = findings.get(fid, {})
        scope = scope_for(finding, sid)
        if not scope or not pass_for_scope(state, replacement, finding, scope):
            return False
    return True


def assess(state: Any) -> dict:
    errors, gaps = [], []
    result = {'errors': errors, 'gaps': gaps, 'coverage': 'incomplete', 'assessment_complete': False,
              'verification': 'incomplete', 'verification_ceiling': 'none', 'impeccable': 'not_run',
              'open_p0_p1': [], 'applied_device_entries': [], 'device_regressions': [], 'claimable_complete': False}
    if not isinstance(state, dict):
        errors.append('The ledger must be an object')
        return result
    if type(state.get('schema_version')) is not int or state.get('schema_version') != 2:
        errors.append('schema_version must be integer 2; use migrate for legacy ledgers')
    mode = state.get('mode')
    if mode not in ('audit_only', 'audit_and_fix', 'verify'):
        errors.append('mode must be audit_only, audit_and_fix, or verify')
    budget = state.get('device_check_budget')
    if type(budget) is not int or budget < 0:
        errors.append('device_check_budget must be a nonnegative integer')
        budget = 0
    if state.get('device_dependent_fixes') not in ('propose_only', 'apply_and_hand_off'):
        errors.append('Invalid device-dependent fix policy')
    for name in ('run_id', 'project', 'target', 'principal_task'):
        if not nonblank(state.get(name)):
            errors.append(f'{name} requires nonempty text')

    # Admission to application is checked before results arrive. A reported
    # failure or an unconfirmed build must remain recordable afterward; it
    # must not make an already-applied fix retroactively fail its entry gate.
    application_basis = state.get('application_basis')
    historical_application = False
    basis_entries = set()
    if application_basis is not None:
        if (state.get('operation') != 'results' or not isinstance(application_basis, dict)
                or application_basis.get('operation') == 'results'
                or 'application_basis' in application_basis):
            errors.append('application_basis must be a nonrecursive pre-results ledger')
        else:
            prior_assessment = assess(application_basis)
            if prior_assessment['errors']:
                errors.append('Pre-results application basis is invalid: ' + '; '.join(prior_assessment['errors']))
            for field in ('mode', 'device_dependent_fixes', 'device_check_budget', 'changes'):
                if state.get(field) != application_basis.get(field):
                    errors.append(f'Results-only update changed application authorization or source edits: {field}')
            prior_findings = index(application_basis.get('findings'))
            current_findings = index(state.get('findings'))
            if set(prior_findings) != set(current_findings):
                errors.append('Results-only update cannot add or remove application findings')
            for fid, finding in current_findings.items():
                prior = prior_findings.get(fid, {})
                if finding.get('fix') != prior.get('fix') or finding.get('affects') != prior.get('affects'):
                    errors.append(f'{fid}: results-only update changed the applied fix or its original scope')
            historical_application = True
            basis_entries = set(prior_assessment['applied_device_entries'])

    def rows(name):
        value = state.get(name)
        if not isinstance(value, list) or any(not isinstance(x, dict) for x in value):
            errors.append(f'{name} must be a list of objects')
        return objects(value)

    def record(obj, label, allowed, successful):
        if not isinstance(obj, dict):
            errors.append(f'{label} must be an object')
            return 'invalid'
        status = obj.get('status')
        if status not in allowed:
            errors.append(f'{label}: invalid status')
        if status in successful and not evidence_ok(obj.get('evidence')):
            errors.append(f'{label}: {status} requires evidence')
        if status in ('not_run', 'not_applicable', 'blocked', 'failed', 'partial', 'unavailable') and not nonblank(obj.get('reason')):
            errors.append(f'{label}: {status} requires a reason')
        return status

    def validate_sub(sub, label):
        if not isinstance(sub, dict) or sub.get('status') not in ('none_checked', 'known', 'unknown', 'not_reported'):
            errors.append(f'{label}: invalid substitution record')
            return
        if sub['status'] == 'none_checked' and not evidence_ok(sub.get('evidence')):
            errors.append(f'{label}: none_checked requires evidence')
        if sub['status'] in ('unknown', 'not_reported') and not nonblank(sub.get('reason')):
            errors.append(f'{label}: unknown/not_reported requires a limit')
        if not isinstance(sub.get('items'), list) or any(not isinstance(x, dict) for x in sub.get('items', [])):
            errors.append(f'{label}: items must be objects')
        if sub['status'] == 'known' and not objects(sub.get('items')):
            errors.append(f'{label}: known requires replacement/passthrough details')
        if sub['status'] == 'none_checked' and (sub.get('items') or sub.get('unknown_boundaries')):
            errors.append(f'{label}: none_checked cannot contain substitutions or unknowns')
        for item in objects(sub.get('items')):
            for field in ('boundary', 'description', 'configured_response', 'real_components', 'untested'):
                if not nonblank(item.get(field)):
                    errors.append(f'{label}: each substitution requires {field}')
            if item.get('behavior') not in ('replaced', 'passthrough'):
                errors.append(f'{label}: behavior must be replaced or passthrough')

    capabilities = rows('capabilities')
    capids = [c.get('id') for c in capabilities]
    if any(not nonblank(x) for x in capids) or len(set(map(str, capids))) != len(capids):
        errors.append('Capabilities require unique IDs')
    for c in capabilities:
        if c.get('environment') not in ENVIRONMENTS or c.get('driver') not in ('agent', 'person'):
            errors.append(f"{c.get('id')}: invalid capability environment/driver")
        record(c, f"capability {c.get('id')}", {'available', 'unavailable', 'declared', 'not_checked'}, {'available'})
    if not any(c.get('status') == 'available' for c in capabilities):
        gaps.append('No environment has a successful capability probe or reported execution')
    builds = rows('builds')
    build_index = index(builds)
    buildids = [b.get('id') for b in builds]
    if any(not nonblank(x) for x in buildids) or len(set(map(str, buildids))) != len(buildids):
        errors.append('Builds require unique IDs')
    for b in builds:
        validate_sub(b.get('substitutions'), f"build {b.get('id')}")
        if not isinstance(b.get('contains_fixes'), list):
            errors.append(f"build {b.get('id')}: contains_fixes must be a list")
    for s in rows('standing_substitutions'):
        validate_sub(s, f"standing substitution {s.get('id')}")
        if not ids(s.get('environments')) or not ids(s.get('build_ids')):
            errors.append('Standing substitutions require environment and build scopes')

    modules = rows('modules')
    if sorted([m.get('id') for m in modules if type(m.get('id')) is int]) != list(range(1, 8)) or len(modules) != 7:
        errors.append('modules must contain integer IDs 1 through 7 exactly once')
    for m in modules:
        status = record(m, f"module {m.get('id')}", {'pending', 'reviewed', 'not_applicable', 'blocked'}, {'reviewed'})
        if status not in ('reviewed', 'not_applicable'):
            gaps.append(f"module {m.get('id')}: {status}")
    phases = state.get('phases', {})
    if not isinstance(phases, dict):
        errors.append('phases must be an object')
        phases = {}
    for p in PHASES:
        status = record(phases.get(p), f'phase {p}', {'pending', 'done', 'not_applicable', 'blocked'}, {'done'})
        if status == 'not_applicable' and p != 'remediation':
            errors.append(f'phase {p} cannot be not_applicable')
        if status not in ('done', 'not_applicable'):
            gaps.append(f'phase {p}: {status}')
    result['impeccable'] = record(state.get('impeccable'), 'impeccable', {'not_run', 'executed', 'partial', 'failed'}, {'executed', 'partial'})
    if result['impeccable'] != 'executed':
        gaps.append('Impeccable execution: ' + result['impeccable'])
    elif not nonblank(state.get('impeccable', {}).get('version')):
        errors.append('Impeccable executed requires its observed version')
    ls = record(state.get('launch'), 'launch', {'not_run', 'started', 'reused', 'blocked', 'not_applicable'}, {'started', 'reused'})
    if ls not in ('started', 'reused'):
        gaps.append('Application runtime: ' + ls)
    cs = record(state.get('cleanup'), 'cleanup', {'pending', 'done', 'blocked', 'not_applicable'}, {'done'})
    if cs not in ('done', 'not_applicable'):
        gaps.append('Cleanup: ' + cs)

    checks = rows('checks')
    check_index = index(checks)
    if len(check_index) != len(checks):
        errors.append('Checks require unique nonempty IDs')
    for c in checks:
        cid = c.get('id')
        if not isinstance(cid, str) or not re.fullmatch(r'C-[A-Za-z0-9][A-Za-z0-9_-]*', cid):
            errors.append('Check IDs need a stable C- prefixed token')
        for key in ('scenario', 'expected'):
            if not nonblank(c.get(key)):
                errors.append(f'{cid}: {key} is required')
        if type(c.get('required')) is not bool:
            errors.append(f'{cid}: required must be boolean')
        if type(c.get('module')) is not int or c.get('module') not in range(1, 8):
            errors.append(f'{cid}: module must be an integer 1 through 7')
        env = c.get('environment')
        if env not in ENVIRONMENTS or c.get('evidence_type') not in ACQUISITION.get(env, set()):
            errors.append(f'{cid}: environment/acquisition mismatch')
        if c.get('driver') not in ('agent', 'person') or c.get('level') not in ('mechanism', 'proxy', 'target', 'unestablished'):
            errors.append(f'{cid}: invalid driver/level')
        if c.get('level') == 'target' and (env in ('static_review', 'automated_test', 'desktop_emulation') or
                env == 'os_simulator' and c.get('behavior') not in SIMULATOR_TARGET):
            errors.append(f'{cid}: environment cannot establish target for this behavior')
        if env == 'field_data':
            field = c.get('field_data', {})
            if not isinstance(field, dict) or any(not field.get(k) for k in ('source', 'collection_window', 'scope', 'populations', 'metrics')):
                errors.append(f'{cid}: field data requires source/window/scope/populations/metrics')
        status = c.get('status')
        if status not in ('pass', 'fail', 'not_run', 'partial', 'not_applicable'):
            errors.append(f'{cid}: invalid check status')
        if status in ('pass', 'fail') and (not nonblank(c.get('actual')) or not evidence_ok(c.get('evidence'))):
            errors.append(f'{cid}: executed result requires actual and evidence')
        if status in ('not_run', 'not_applicable', 'partial') and not nonblank(c.get('reason')):
            errors.append(f'{cid}: incomplete/inapplicable result requires a reason')
        if status in ('pass', 'fail', 'partial'):
            cap = index(capabilities).get(c.get('capability_id'), {})
            if cap.get('status') != 'available' or cap.get('environment') != env:
                errors.append(f'{cid}: executed check requires an available matching capability')
        if c.get('level') == 'target' and status in ('pass', 'fail', 'partial') and not target_valid(state, c):
            errors.append(f'{cid}: unsupported target claim')
        if c.get('driver') == 'person' and c.get('level') == 'target' and status in ('pass', 'fail', 'partial'):
            if not isinstance(c.get('configuration'), dict) or not all(nonblank(c['configuration'].get(k)) for k in ('browser', 'device')):
                errors.append(f'{cid}: a device result needs the reported browser and device')
        if not isinstance(c.get('substitutions'), dict):
            errors.append(f'{cid}: build/setup/additional substitution records required')
        else:
            for part in ('build', 'setup', 'additional'):
                validate_sub(c['substitutions'].get(part), f'{cid} {part}')
        if 'build_substitution_override' in c:
            override = c['build_substitution_override']
            if not isinstance(override, dict) or not nonblank(override.get('reason')) or not evidence_ok(override.get('evidence')):
                errors.append(f'{cid}: a build-wiring override needs its reported reason and evidence')
        raw_portions = c.get('scope_results', [])
        if regression_covers(c) and (not isinstance(raw_portions, list) or len(objects(raw_portions)) != len(raw_portions)):
            errors.append(f'{cid}: scope results must be a list of reported portions')
        seen = set()
        for o in objects(c.get('scope_results')):
            key = (o.get('finding_id'), o.get('scope_id'))
            if key in seen or key not in covers(c):
                errors.append(f'{cid}: duplicate or out-of-scope portion')
            seen.add(key)
            if o.get('status') not in ('pass', 'fail', 'not_run'):
                errors.append(f'{cid}: invalid portion status')
            if o.get('status') in ('pass', 'fail') and (not nonblank(o.get('actual')) or not evidence_ok(o.get('evidence'))):
                errors.append(f'{cid}: executed portion needs actual and evidence')
        if status == 'pass' and (any(o.get('status') != 'pass' for o in objects(raw_portions))
                                 or regression_covers(c) and 'scope_results' in c and seen != covers(c)):
            errors.append(f'{cid}: whole pass cannot contain nonpassing portions')
        if c.get('replaces_check_id'):
            prior = check_index.get(c['replaces_check_id'])
            if not prior or prior['id'] == cid:
                errors.append(f'{cid}: replacement must reference an existing different check')
        if c.get('status') in ('pass', 'fail', 'partial'):
            rank = {'none': 0, 'unestablished': 0, 'mechanism': 1, 'proxy': 2, 'target': 3}
            if rank.get(c.get('level'), 0) > rank[result['verification_ceiling']]:
                result['verification_ceiling'] = c['level']

    findings = rows('findings')
    finding_index = index(findings)
    if len(finding_index) != len(findings):
        errors.append('Findings require unique nonempty IDs')
    script = state.get('device_script')
    if not isinstance(script, list) or any(not isinstance(c, str) for c in script):
        errors.append('device_script must be a list of check IDs')
        script = []
    if len(script) != len(set(script)) or len(script) > budget:
        errors.append('device_script IDs must be distinct and within total budget')
    for cid in script:
        c = check_index.get(cid, {})
        if not c or c.get('driver') != 'person' or c.get('status') not in ('not_run', 'partial'):
            errors.append(f'{cid}: script must reference an outstanding human check')
        if c.get('environment') not in ('physical_device', 'os_simulator'):
            errors.append(f'{cid}: device script is for a simulator/device; missing field data belongs in open questions')
        conf = c.get('configuration', {})
        if not isinstance(conf, dict) or not all(nonblank(conf.get(k)) for k in ('browser', 'device')):
            errors.append(f'{cid}: each script entry needs one browser/device configuration')
        if not nonblank(c.get('build_id')) or not c.get('steps'):
            errors.append(f'{cid}: script requires named build and actionable steps')
    applied_entries = set()
    for f in findings:
        fid = f.get('id')
        if not isinstance(fid, str) or not re.fullmatch(r'F-[A-Za-z0-9][A-Za-z0-9_-]*', fid):
            errors.append('Finding IDs need a stable F- prefixed token')
        for key in ('title', 'location'):
            if not nonblank(f.get(key)):
                errors.append(f'{fid}: {key} is required')
        if f.get('severity') not in ('P0', 'P1', 'P2', 'P3'):
            errors.append(f'{fid}: invalid severity')
        if f.get('evidence_class') not in ('observed', 'code_supported', 'recommendation', 'hypothesis'):
            errors.append(f'{fid}: invalid evidence class')
        if f.get('evidence_class') in ('observed', 'code_supported') and not evidence_ok(f.get('evidence')):
            errors.append(f'{fid}: confirmed finding requires evidence')
        fs = f.get('status')
        if fs not in ('open', 'implemented', 'verified', 'deferred', 'blocked', 'not_an_issue'):
            errors.append(f'{fid}: invalid status')
        if fs in ('blocked', 'deferred') and (f.get('status_assigned_by') not in ('user', 'supplied_audit') or not nonblank(f.get('reason'))):
            errors.append(f'{fid}: blocked/deferred requires explicit user or supplied-audit assignment and reason')
        if f.get('determinism', 'unknown') not in ('deterministic', 'intermittent', 'unknown'):
            errors.append(f'{fid}: invalid determinism')
        scopes = objects(f.get('affects'))
        scopeids = [s.get('id') for s in scopes]
        if not scopes or any(not nonblank(s) for s in scopeids) or len(set(map(str, scopeids))) != len(scopes):
            errors.append(f'{fid}: affects requires unique nonempty scope IDs')
        for s in scopes:
            if not isinstance(s.get('conditions'), dict):
                errors.append(f'{fid}/{s.get("id")}: scope requires conditions')
        if any(s not in scopeids for s in ids(f.get('refuted_scopes', []))):
            errors.append(f'{fid}: unknown refuted scope')
        fix = f.get('fix', {})
        if not isinstance(fix, dict) or type(fix.get('applied')) is not bool or type(fix.get('device_dependent')) is not bool:
            errors.append(f'{fid}: fix requires applied/device_dependent booleans')
            fix = {}
        if fs in ('implemented', 'verified') and not fix.get('applied'):
            errors.append(f'{fid}: implemented/verified requires an applied fix')
        if fix.get('applied') and not evidence_ok(fix.get('evidence')):
            errors.append(f'{fid}: applied fix needs edit evidence')
        if fix.get('applied') and not fix.get('applied_before_run') and mode != 'audit_and_fix':
            errors.append(f'{fid}: this mode cannot apply a new fix')
        vids = ids(f.get('verification_ids', []))
        if not isinstance(f.get('verification_ids', []), list) or any(v not in check_index for v in vids):
            errors.append(f'{fid}: invalid verification IDs')
        if fs == 'verified':
            if not active_scopes(f) or not vids or any(not any(pass_for_scope(state, check_index.get(v, {}), f, s) for v in vids) for s in active_scopes(f)):
                errors.append(f'{fid}: verified needs target passes on the fix build for every affected scope and relevant real dependency')
        if fs == 'not_an_issue':
            if fix.get('applied'):
                errors.append(f'{fid}: implemented fixes use verified, not not_an_issue')
            if active_scopes(f):
                errors.append(f'{fid}: not_an_issue requires full qualifying contrary evidence')
        for sid in ids(f.get('refuted_scopes', [])):
            records = [r for r in objects(f.get('contrary_evidence')) if sid in ids(r.get('scope_ids'))]
            valid = False
            for rec in records:
                ch = rec.get('check_snapshot', check_index.get(rec.get('check_id'), {}))
                if not isinstance(ch, dict) or ch.get('id') != rec.get('check_id') or rec.get('check_id') not in check_index:
                    continue
                qualified, _ = contrary_qualification(state, ch, f, scope_for(f, sid), rec.get('reported', {}))
                if qualified and nonblank(rec.get('explanation')):
                    valid = True
            if not valid:
                errors.append(f'{fid}/{sid}: refuted scope lacks qualifying contrary evidence')
        if fs not in ('verified', 'not_an_issue') and f.get('severity') in ('P0', 'P1') and f.get('evidence_class') != 'recommendation':
            result['open_p0_p1'].append(fid)
        if mode == 'audit_and_fix' and f.get('severity') in ('P0', 'P1', 'P2') and f.get('evidence_class') in ('observed', 'code_supported') and fs not in ('verified', 'not_an_issue'):
            gaps.append(f'{fid}: confirmed finding is {fs}')
        independent_plan = 'device_regressions' in fix
        regressions = objects(fix.get('device_regressions'))
        origin_finding = index(application_basis.get('findings')).get(fid, f) if historical_application else f
        if independent_plan:
            raw_regressions = fix.get('device_regressions')
            if not isinstance(raw_regressions, list) or not regressions or len(regressions) != len(raw_regressions):
                errors.append(f'{fid}: device_regressions requires a nonempty list of requirements')
            rids = [r.get('id') for r in regressions]
            if any(not nonblank(rid) for rid in rids) or len(set(map(str, rids))) != len(rids):
                errors.append(f'{fid}: device regression IDs must be unique and nonempty')
            for regression in regressions:
                rid = regression.get('id')
                origins = ids(regression.get('source_scope_ids'))
                if not origins or len(set(origins)) != len(origins) or any(sid not in scopeids for sid in origins):
                    errors.append(f'{fid}/{rid}: device regression requires existing source scope IDs')
                elif any(not non_target_origin(origin_finding, sid) for sid in origins):
                    errors.append(f'{fid}/{rid}: independent device regression requires explicit non-target origin evidence')
                env, behavior = regression.get('environment'), regression.get('behavior')
                if (env not in ('physical_device', 'os_simulator') or not nonblank(behavior)
                        or env == 'os_simulator' and behavior not in SIMULATOR_TARGET):
                    errors.append(f'{fid}/{rid}: unsupported device regression environment/behavior')
                if not nonblank(regression.get('expected')):
                    errors.append(f'{fid}/{rid}: device regression needs expected behavior')
                rc = regression.get('conditions')
                if (not isinstance(rc, dict) or any(not rc.get(key) for key in CONDITION_FIELDS)
                        or not isinstance(rc.get('steps'), list) or not all(nonblank(x) for x in rc.get('steps', []))):
                    errors.append(f'{fid}/{rid}: device regression requires complete planned conditions')
                elif fid not in ids(build_index.get(rc.get('build_id'), {}).get('contains_fixes')):
                    errors.append(f'{fid}/{rid}: planned device build must contain the fix')
                if not isinstance(regression.get('depends_on', []), list) or any(not nonblank(x) for x in regression.get('depends_on', [])):
                    errors.append(f'{fid}/{rid}: invalid device regression dependencies')
                linked = [c for c in checks if (fid, rid) in regression_covers(c)]
                passed = any(pass_for_regression(state, c, f, regression) for c in linked)
                raw_statuses = {regression_outcome_for(c, fid, rid).get('status') for c in linked}
                status = 'pass' if passed else 'fail' if 'fail' in raw_statuses else 'unestablished' if raw_statuses & {'pass', 'partial'} else 'not_run'
                result['device_regressions'].append({'finding_id': fid, 'regression_id': rid,
                    'source_scope_ids': origins, 'check_ids': [c.get('id') for c in linked], 'status': status})
                if not passed:
                    gaps.append(f'{fid}/{rid}: device regression target verification {status}')
        if fix.get('applied') and fix.get('device_dependent') and not fix.get('applied_before_run') and not historical_application:
            if state.get('device_dependent_fixes') != 'apply_and_hand_off':
                errors.append(f'{fid}: device-dependent application is not authorized')
            required_ids = ids(fix.get('required_check_ids'))
            if not required_ids or any(c not in check_index for c in required_ids):
                errors.append(f'{fid}: applied device fix requires its complete target-check plan')
            for scope in active_scopes(f):
                if independent_plan and non_target_origin(origin_finding, scope['id']):
                    if not any(scope['id'] in ids(r.get('source_scope_ids')) for r in regressions):
                        errors.append(f'{fid}/{scope["id"]}: applied device fix omits source scope regression requirements')
                    continue
                relevant = [check_index[c] for c in required_ids if c in check_index and (fid, scope['id']) in covers(check_index[c])]
                if not relevant:
                    errors.append(f'{fid}/{scope["id"]}: applied device fix omits affected scope')
                elif not any(pass_for_scope(state, c, f, scope) for c in relevant):
                    remaining = [c for c in relevant if c.get('driver') == 'person' and c.get('id') in script
                                 and planned_target_matches(c, f, scope)]
                    runnable = any(c.get('driver') == 'agent' and target_valid(state, c) and planned_target_matches(c, f, scope) for c in relevant)
                    if not remaining and not runnable:
                        errors.append(f'{fid}/{scope["id"]}: required remaining target entry must fit the script before application')
                    elif remaining:
                        applied_entries.add(remaining[0]['id'])
            for required_id in required_ids:
                planned = check_index.get(required_id, {})
                planned_scopes = [s for s in active_scopes(f) if (fid, s['id']) in covers(planned)]
                planned_regressions = [r for r in regressions if (fid, r.get('id')) in regression_covers(planned)]
                if not planned_scopes and not planned_regressions:
                    errors.append(f'{fid}/{required_id}: required fix check does not cover an affected scope or device regression')
                if planned_scopes and not all(pass_for_scope(state, planned, f, s) for s in planned_scopes):
                    matches = all(planned_target_matches(planned, f, s) for s in planned_scopes)
                    runnable = planned.get('driver') == 'agent' and target_valid(state, planned) and matches
                    if not runnable and (planned.get('driver') != 'person' or required_id not in script or not matches):
                        errors.append(f'{fid}/{required_id}: every required remaining entry must fit before application')
                    elif not runnable:
                        applied_entries.add(required_id)
                for regression in planned_regressions:
                    if pass_for_regression(state, planned, f, regression):
                        continue
                    matches = planned_regression_matches(state, planned, f, regression)
                    if planned.get('driver') == 'agent' and target_valid(state, planned) and matches:
                        continue
                    if planned.get('driver') != 'person' or required_id not in script or not matches:
                        errors.append(f'{fid}/{required_id}: required device regression must match a runnable target plan')
                    else:
                        applied_entries.add(required_id)
            for regression in regressions:
                if not any((fid, regression.get('id')) in regression_covers(check_index.get(cid, {})) for cid in required_ids):
                    errors.append(f'{fid}/{regression.get("id")}: device regression has no required check')
    if historical_application:
        applied_entries = basis_entries.intersection(script)
    result['applied_device_entries'] = sorted(applied_entries)
    if len(applied_entries) > budget // 2:
        errors.append('Applied device-dependent fixes exceed floor(device_check_budget / 2) entries')
    if applied_entries and set(script[:len(applied_entries)]) != applied_entries:
        errors.append('Applied device-dependent entries must receive reserved script priority')
    for c in checks:
        raw_links = c.get('regression_covers', [])
        links = regression_covers(c)
        if not isinstance(raw_links, list) or len(links) != len(raw_links):
            errors.append(f'{c.get("id")}: device regression links must be well formed and unique')
        for fid, rid in links:
            if not regression_for(finding_index.get(fid, {}), rid):
                errors.append(f'{c.get("id")}: unknown covered finding/device regression')
        raw_snapshots = c.get('regression_conditions', [])
        if not isinstance(raw_snapshots, list) or len(objects(raw_snapshots)) != len(raw_snapshots):
            errors.append(f'{c.get("id")}: regression conditions must be a list of planned snapshots')
        seen_snapshots = set()
        for snapshot in objects(raw_snapshots):
            key = (snapshot.get('finding_id'), snapshot.get('regression_id'))
            if key not in links or key in seen_snapshots:
                errors.append(f'{c.get("id")}: duplicate or out-of-plan regression conditions')
            seen_snapshots.add(key)
            requirement = regression_for(finding_index.get(key[0], {}), key[1])
            if not requirement or match_conditions(requirement.get('conditions'), snapshot.get('conditions')):
                errors.append(f'{c.get("id")}: planned regression conditions must match their requirement')
        raw_results = c.get('regression_results', [])
        if not isinstance(raw_results, list) or len(objects(raw_results)) != len(raw_results):
            errors.append(f'{c.get("id")}: regression results must be a list of reported portions')
        seen_regressions = set()
        for out in objects(c.get('regression_results')):
            key = (out.get('finding_id'), out.get('regression_id'))
            if key not in links or key in seen_regressions:
                errors.append(f'{c.get("id")}: duplicate or out-of-plan regression result')
            seen_regressions.add(key)
            if out.get('status') not in ('pass', 'fail', 'not_run'):
                errors.append(f'{c.get("id")}: invalid regression portion status')
            if out.get('status') in ('pass', 'fail') and (not nonblank(out.get('actual')) or not evidence_ok(out.get('evidence'))):
                errors.append(f'{c.get("id")}: executed regression portion needs actual and evidence')
        if c.get('status') == 'pass' and 'regression_results' in c and (seen_regressions != links or any(o.get('status') != 'pass' for o in objects(raw_results))):
            errors.append(f'{c.get("id")}: whole pass cannot contain nonpassing regressions')
        for fid, sid in covers(c):
            if fid not in finding_index or not scope_for(finding_index[fid], sid):
                errors.append(f"{c.get('id')}: unknown covered finding/scope")
        if c.get('superseded_by') and not failed_superseded(state, c, check_index, finding_index):
            errors.append(f"{c.get('id')}: historical failure supersession is not supported by a matching passing fix check")

    coverage = rows('coverage')
    if sorted([a.get('id') for a in coverage if type(a.get('id')) is int]) != list(range(1, 11)) or len(coverage) != 10:
        errors.append('coverage must contain the ten master areas exactly once')
    dispositions = []
    for a in coverage:
        aid, disp = a.get('id'), a.get('disposition')
        dispositions.append(disp)
        relevant = [check_index[c] for c in ids(a.get('check_ids')) if c in check_index]
        if any(c not in check_index for c in ids(a.get('check_ids'))):
            errors.append(f'area {aid}: unknown check reference')
        defects = [finding_index[f] for f in ids(a.get('finding_ids')) if f in finding_index and
                   finding_index[f].get('evidence_class') in ('observed', 'code_supported') and
                   finding_index[f].get('status') not in ('verified', 'not_an_issue')]
        executed = any(c.get('status') in ('pass', 'fail', 'partial') for c in relevant)
        if disp not in ('defects_found', 'no_defect_found', 'not_applicable', 'not_tested'):
            errors.append(f'area {aid}: invalid disposition')
        if disp == 'defects_found' and not defects:
            errors.append(f'area {aid}: defects_found requires an observed/code-supported unresolved defect')
        if disp == 'no_defect_found' and (not executed or defects):
            errors.append(f'area {aid}: no_defect_found needs executed checks and no confirmed defect')
        if disp == 'not_applicable' and not nonblank(a.get('reason')):
            errors.append(f'area {aid}: not_applicable needs a reason')
        if disp == 'not_tested':
            gaps.append(f'area {aid}: not tested')
    if len(coverage) == 10 and all(d in ('defects_found', 'no_defect_found', 'not_applicable') for d in dispositions):
        result['coverage'] = 'complete'
        result['assessment_complete'] = True

    active_failures, pending = [], []
    for c in checks:
        statuses = [c.get('status')] + [o.get('status') for o in objects(c.get('scope_results')) + objects(c.get('regression_results'))]
        resolved = bool(c.get('superseded_by')) and failed_superseded(state, c, check_index, finding_index)
        if 'fail' in statuses and not resolved:
            active_failures.append(c.get('id'))
        if c.get('required') and not resolved and (c.get('status') not in ('pass', 'not_applicable') or any(s != 'pass' for s in statuses)):
            pending.append(c.get('id'))
    if active_failures:
        result['verification'] = 'failed'
        gaps.extend(f'{c}: current recorded failure' for c in active_failures)
    elif checks and any(c.get('required') for c in checks) and not pending:
        result['verification'] = 'checks_passed_within_recorded_scope'
    else:
        gaps.append('Required checks remain unrun or no required checks were recorded')
    gaps.extend(f'{c}: required verification incomplete' for c in pending)
    changes = rows('changes')
    if changes and mode != 'audit_and_fix':
        errors.append(f'{mode} cannot contain source changes from this run')
    for change in changes:
        if not nonblank(change.get('path')) or not nonblank(change.get('summary')) or not ids(change.get('finding_ids')) or any(f not in finding_index for f in ids(change.get('finding_ids'))):
            errors.append('Source changes need path, summary and existing finding IDs')
    for cmd in rows('commands'):
        stat = record(cmd, 'command', {'completed', 'failed', 'not_run'}, {'completed', 'failed'})
        if not nonblank(cmd.get('command')) or cmd.get('kind') not in ('workflow', 'shell', 'browser', 'connector'):
            errors.append('Commands need text and workflow/shell/browser/connector kind')
        if stat == 'failed' and not cmd.get('resolved_by'):
            gaps.append('Unresolved failed command: ' + str(cmd.get('command')))
    result['claimable_complete'] = not errors and not gaps
    return result


def refresh_coverage(state: dict) -> None:
    check_index, finding_index = index(state.get('checks')), index(state.get('findings'))
    for a in objects(state.get('coverage')):
        if a.get('disposition') == 'not_applicable':
            continue
        fids = ids(a.get('finding_ids'))
        defects = any(finding_index.get(f, {}).get('evidence_class') in ('observed', 'code_supported')
                      and finding_index.get(f, {}).get('status') not in ('verified', 'not_an_issue') for f in fids)
        executed = any(check_index.get(c, {}).get('status') in ('pass', 'fail', 'partial') for c in ids(a.get('check_ids')))
        a['disposition'] = 'defects_found' if defects else ('no_defect_found' if executed else 'not_tested')


def apply_results(state: dict, payload: dict) -> dict:
    if state.get('schema_version') != 2:
        raise ValueError('Migrate the legacy ledger before applying results')
    if not isinstance(payload, dict) or not isinstance(payload.get('results'), list):
        raise ValueError('Results input must contain a results list')
    updated = copy.deepcopy(state)
    if 'application_basis' not in updated and any(
            f.get('fix', {}).get('applied') and f.get('fix', {}).get('device_dependent')
            and not f.get('fix', {}).get('applied_before_run') for f in objects(state.get('findings'))):
        basis = copy.deepcopy(state)
        basis['operation'] = 'audit'
        basis['history'] = []
        updated['application_basis'] = basis
    updated['operation'] = 'results'
    updated.setdefault('history', []).append({'at': now(), 'event': 'device_results', 'reported': copy.deepcopy(payload)})
    checks, findings = index(updated.get('checks')), index(updated.get('findings'))
    seen = set()
    for reported in payload['results']:
        if not isinstance(reported, dict) or reported.get('check_id') not in checks:
            raise ValueError('Each result must identify an existing check')
        cid = reported['check_id']
        if cid in seen:
            raise ValueError('Duplicate check results must be consolidated with a pass count or separate history update')
        seen.add(cid)
        planned = checks[cid]
        c = planned
        if reported.get('build_id') and reported['build_id'] != planned.get('build_id') or reported.get('scenario') and reported['scenario'] != planned.get('scenario'):
            new_id = reported.get('new_check_id')
            if not isinstance(new_id, str) or not re.fullmatch(r'C-[A-Za-z0-9][A-Za-z0-9_-]*', new_id) or new_id in checks:
                raise ValueError('A changed build/scenario requires a new_check_id; the original check is retained')
            c = copy.deepcopy(planned)
            c.update(id=new_id, replaces_check_id=cid, build_id=reported.get('build_id', planned.get('build_id')),
                     scenario=reported.get('scenario', planned.get('scenario')))
            updated['checks'].append(c)
            checks[new_id] = c
        c.setdefault('result_history', []).append({'at': now(), 'prior': {k: copy.deepcopy(c.get(k)) for k in
             ('status', 'actual', 'evidence', 'scope_results', 'regression_results', 'build_id', 'substitutions', 'conditions')}, 'reported': copy.deepcopy(reported)})
        if reported.get('relation') == 'cause_only':
            for fid, sid in covers(c):
                f = findings.get(fid)
                if f is not None:
                    if nonblank(reported.get('cause')):
                        f['cause'] = reported['cause']
                    f.setdefault('evidence', []).append({'ref': c['id'] + ': cause-only report',
                        'environment': c.get('environment'), 'level': c.get('level'), 'observation': 'cause_only',
                        'scope_ids': [sid], 'evidence': copy.deepcopy(reported.get('evidence', [])),
                        'note': reported.get('actual', '')})
            continue  # A causal disagreement is not a new pass/fail of the defect's behavior.
        prior_record = copy.deepcopy(c)
        prior_portions = [{**copy.deepcopy(outcome_for(prior_record, fid, sid)), 'finding_id': fid, 'scope_id': sid}
                          for fid, sid in covers(prior_record)]
        c['driver'] = 'person'
        c['build_confirmed'] = reported.get('build_confirmed') is True and reported.get('build_id', c.get('build_id')) == c.get('build_id')
        c['setup_confirmed'] = reported.get('setup_confirmed') is True
        c['substitutions'] = copy.deepcopy(c.get('substitutions', {}))
        for part, confirmed in (('build', c['build_confirmed']), ('setup', c['setup_confirmed'])):
            explicit = reported.get('substitutions', {}).get(part) if isinstance(reported.get('substitutions'), dict) else None
            if explicit is not None:
                c['substitutions'][part] = copy.deepcopy(explicit)
            elif not confirmed:
                c['substitutions'][part] = substitution('not_reported', f'Tester did not confirm {part}')
        c['substitutions'].setdefault('additional', substitution('not_reported', 'Additional substitutions not reported'))
        if isinstance(reported.get('substitutions'), dict) and 'additional' in reported['substitutions']:
            c['substitutions']['additional'] = copy.deepcopy(reported['substitutions']['additional'])
        if 'build_substitution_override' in reported:
            c['build_substitution_override'] = copy.deepcopy(reported['build_substitution_override'])
        if isinstance(reported.get('configuration'), dict):
            c['configuration'] = copy.deepcopy(reported['configuration'])
        if isinstance(reported.get('conditions'), dict):
            c['conditions'] = copy.deepcopy(reported['conditions'])
        elif reported.get('conditions_confirmed') is not True:
            c['conditions'] = {'build_id': c.get('build_id')} if c['build_confirmed'] else {}
        if c['build_confirmed']:
            c.setdefault('conditions', {})['build_id'] = c.get('build_id')
        else:
            c.setdefault('conditions', {}).pop('build_id', None)
        expected_covers = covers(c)
        expected_regressions = regression_covers(c)
        aggregate_allowed = (reported.get('status', 'not_run') in ('pass', 'fail', 'not_run')
                             and (len(expected_covers) + len(expected_regressions) <= 1
                                  or reported.get('all_steps_confirmed') is True))
        raw_scopes = reported.get('scope_results', [])
        if expected_regressions and (not isinstance(raw_scopes, list) or len(objects(raw_scopes)) != len(raw_scopes)):
            raise ValueError('Scope results must be a list of reported portions')
        provided = objects(raw_scopes)
        if provided or expected_regressions and 'scope_results' in reported:
            if any((o.get('finding_id'), o.get('scope_id')) not in expected_covers for o in provided):
                raise ValueError('Reported portion is outside the planned check scope')
            portions = copy.deepcopy(provided)
        elif aggregate_allowed:
            portions = [dict(finding_id=fid, scope_id=sid, status=reported.get('status', 'not_run'),
                             actual=reported.get('actual', ''), evidence=copy.deepcopy(reported.get('evidence', [])))
                        for fid, sid in sorted(expected_covers)]
        else:
            portions = []
        reported_keys = {(o.get('finding_id'), o.get('scope_id')) for o in portions}
        can_retain = (c is planned and c['build_confirmed'] and c['setup_confirmed']
                      and (reported.get('conditions_confirmed') is True or c.get('conditions') == prior_record.get('conditions'))
                      and c.get('configuration') == prior_record.get('configuration')
                      and c.get('substitutions') == prior_record.get('substitutions')
                      and c.get('build_id') == prior_record.get('build_id'))
        for fid, sid in sorted(expected_covers - reported_keys):
            prior = next((p for p in prior_portions if p.get('finding_id') == fid and p.get('scope_id') == sid), {})
            if can_retain and prior.get('status') in ('pass', 'fail') and evidence_ok(prior.get('evidence')):
                retained = copy.deepcopy(prior)
                retained['retained_from_prior_result'] = True
                portions.append(retained)
            else:
                portions.append({'finding_id': fid, 'scope_id': sid, 'status': 'not_run', 'actual': '',
                                 'evidence': [], 'reason': 'This portion was not reported'})
        for o in portions:
            if o.get('conditions_confirmed') is True or reported.get('all_steps_confirmed') is True and reported.get('conditions_confirmed') is True:
                planned_scope = scope_for(findings.get(o.get('finding_id'), {}), o.get('scope_id'))
                o.setdefault('conditions', copy.deepcopy(planned_scope.get('conditions', {})))
                if c['build_confirmed']:
                    o['conditions']['build_id'] = c.get('build_id')
                else:
                    o['conditions'].pop('build_id', None)
            o.setdefault('conditions', copy.deepcopy(c.get('conditions', {})))
        raw_regressions = reported.get('regression_results', [])
        if not isinstance(raw_regressions, list) or len(objects(raw_regressions)) != len(raw_regressions):
            raise ValueError('Regression results must be a list of reported portions')
        provided_regressions = objects(raw_regressions)
        if any((o.get('finding_id'), o.get('regression_id')) not in expected_regressions for o in provided_regressions):
            raise ValueError('Reported regression portion is outside the planned check')
        if len({(o.get('finding_id'), o.get('regression_id')) for o in provided_regressions}) != len(provided_regressions):
            raise ValueError('Duplicate regression results must be consolidated')
        if 'regression_results' in reported:
            regression_portions = copy.deepcopy(provided_regressions)
        elif aggregate_allowed:
            regression_portions = [dict(finding_id=fid, regression_id=rid, status=reported.get('status', 'not_run'),
                actual=reported.get('actual', ''), evidence=copy.deepcopy(reported.get('evidence', [])))
                for fid, rid in sorted(expected_regressions)]
        else:
            regression_portions = []
        reported_regressions = {(o.get('finding_id'), o.get('regression_id')) for o in regression_portions}
        for fid, rid in sorted(expected_regressions - reported_regressions):
            prior = regression_outcome_for(prior_record, fid, rid)
            if can_retain and prior.get('status') in ('pass', 'fail') and evidence_ok(prior.get('evidence')):
                retained = {**copy.deepcopy(prior), 'finding_id': fid, 'regression_id': rid, 'retained_from_prior_result': True}
                regression_portions.append(retained)
            else:
                regression_portions.append({'finding_id': fid, 'regression_id': rid, 'status': 'not_run',
                    'actual': '', 'evidence': [], 'reason': 'This regression portion was not reported'})
        for out in regression_portions:
            if out.get('conditions_confirmed') is True or reported.get('all_steps_confirmed') is True and reported.get('conditions_confirmed') is True:
                requirement = regression_for(findings.get(out.get('finding_id'), {}), out.get('regression_id'))
                out.setdefault('conditions', copy.deepcopy(requirement.get('conditions', {})))
                if c['build_confirmed']:
                    out['conditions']['build_id'] = c.get('build_id')
                else:
                    out['conditions'].pop('build_id', None)
            out.setdefault('conditions', copy.deepcopy(c.get('conditions', {})))
        if expected_regressions:
            c['regression_results'] = regression_portions
        c['scope_results'] = portions
        all_portions = portions + regression_portions
        statuses = {o.get('status') for o in all_portions} if all_portions else {reported.get('status', 'not_run')}
        c['status'] = next(iter(statuses)) if len(statuses) == 1 else 'partial'
        c['actual'] = reported.get('actual', '') or '; '.join(o.get('actual', '') for o in all_portions if o.get('actual'))
        c['evidence'] = copy.deepcopy(reported.get('evidence', [])) or [e for o in all_portions for e in o.get('evidence', [])]
        c['reason'] = reported.get('reason', '') or ('Some portions were missing or mixed; rerun only those portions' if c['status'] == 'partial'
                                                   else 'Tester did not run/report this check' if c['status'] == 'not_run' else '')
        c['notes'] = reported.get('notes', '')
        if c['status'] in ('pass', 'fail', 'partial'):
            capid = c.get('capability_id') or 'human-' + c['id']
            c['capability_id'] = capid
            cap = index(updated.get('capabilities')).get(capid)
            if cap is None:
                cap = {'id': capid, 'environment': c.get('environment'), 'driver': 'person'}
                updated['capabilities'].append(cap)
            cap.update(status='available', evidence=copy.deepcopy(c['evidence']), reason='Reported execution')
        for fid, sid in sorted(expected_covers):
            f = findings.get(fid)
            if f is None:
                continue
            out = outcome_for(c, fid, sid)
            if out.get('status') not in ('pass', 'fail'):
                continue
            if out.get('retained_from_prior_result'):
                continue
            relation = out.get('relation', reported.get('relation'))
            old_status = f.get('status')
            observation = {'ref': f"{c['id']}: " + str(out.get('actual')), 'environment': c.get('environment'),
                           'level': c.get('level'), 'scope_ids': [sid], 'observation': out.get('status'),
                           'relation': relation,
                           'substitutions': copy.deepcopy(c['substitutions']), 'evidence': copy.deepcopy(out.get('evidence', []))}
            if relation == 'cause_only':
                if nonblank(out.get('cause', reported.get('cause'))):
                    f['cause'] = out.get('cause', reported.get('cause'))
                observation['note'] = 'Cause-only evidence; disposition unchanged'
            elif out.get('status') == 'fail' and relation == 'defect_reproduced':
                f['evidence_class'] = 'observed'
                f['status'] = 'open'
                f['refuted_scopes'] = [x for x in ids(f.get('refuted_scopes', [])) if x != sid]
                f['reason'] = f'Defect reported at {sid} in {c["id"]}; preserve prior fix/evidence'
            elif out.get('status') == 'pass':
                if not f.get('fix', {}).get('applied'):
                    reported_for_scope = {**reported, **out, 'relation': relation}
                    qualified, explanation = contrary_qualification(updated, c, f, scope_for(f, sid), reported_for_scope)
                    observation['note'] = explanation if qualified else 'Not reproduced in this run. ' + explanation
                    observation['pass_count'] = out.get('pass_count', reported.get('pass_count', 1))
                    if qualified:
                        f.setdefault('refuted_scopes', [])
                        if sid not in f['refuted_scopes']:
                            f['refuted_scopes'].append(sid)
                        f.setdefault('contrary_evidence', []).append({'scope_ids': [sid], 'check_id': c['id'],
                            'check_snapshot': {k: copy.deepcopy(v) for k, v in c.items() if k != 'result_history'},
                            'explanation': explanation, 'reported': reported_for_scope})
                        if not active_scopes(f):
                            f['status'] = 'not_an_issue'
                            f['reason'] = 'Qualifying contrary evidence covers the full claimed scope'
                else:
                    vids = f.setdefault('verification_ids', [])
                    if c['id'] not in vids:
                        vids.append(c['id'])
            f.setdefault('evidence', []).append(observation)
            if f.get('status') != old_status:
                f.setdefault('status_history', []).append({'at': now(), 'from': old_status, 'to': f['status'], 'check_id': c['id'], 'scope_id': sid})
    for f in findings.values():
        if f.get('fix', {}).get('applied') and f.get('status') != 'open':
            vids = ids(f.get('verification_ids', []))
            if active_scopes(f) and all(any(pass_for_scope(updated, checks.get(cid, {}), f, s) for cid in vids) for s in active_scopes(f)):
                f['status'] = 'verified'
            elif f.get('status') == 'verified':
                f.setdefault('status_history', []).append({'at': now(), 'from': 'verified', 'to': 'implemented',
                    'reason': 'Current records no longer establish whole-scope verification; earlier observations retained'})
                f['status'] = 'implemented'
                f['reason'] = 'Current records need missing target/build/condition/dependency evidence; no recurrence inferred'
    updated['device_script'] = [cid for cid in ids(updated.get('device_script')) if checks.get(cid, {}).get('status') in ('not_run', 'partial')]
    refresh_coverage(updated)
    return updated


def migrate_state(old: dict) -> dict:
    if not isinstance(old, dict) or old.get('schema_version') not in (1, 2):
        raise ValueError('Only schema 1 or 2 ledgers can be migrated')
    if old.get('schema_version') == 2:
        result = copy.deepcopy(old)
        result.setdefault('history', []).append({'at': now(), 'event': 'migration_noop', 'reason': 'Already schema 2'})
        return result
    project = old.get('project')
    available_project = isinstance(project, str) and Path(project).is_dir()
    result = new_state(project if available_project else str(Path.cwd()), old.get('target') or 'Legacy target not reported', old.get('principal_task') or 'Legacy task not reported')
    if not available_project:
        result['project'] = project if nonblank(project) else 'Legacy project not reported'
        result['limitations'].append('Original project is unavailable or unreported; migration did not retarget the audit')
    result['run_id'] = str(old.get('run_id', result['run_id'])) + '-r2'
    result['operation'] = 'migrate'
    result['legacy_snapshot'] = copy.deepcopy(old)
    result['history'].append({'at': now(), 'event': 'schema_migration', 'from': 1, 'to': 2,
                              'reason': 'Old passes lack r2 scope/build/substitution proof; no editing authorization inherited'})
    result['limitations'].append('Legacy evidence is retained in legacy_snapshot; no legacy pass establishes r2 verification without revalidation')
    for key in ('project_revision_before', 'project_revision_after', 'dirty_before', 'scope', 'assumptions'):
        if key in old:
            result[key] = copy.deepcopy(old[key])
    result['migration_ids'] = {'checks': [], 'findings': []}
    reserved_checks = {c.get('id') for c in objects(old.get('checks')) if isinstance(c.get('id'), str) and re.fullmatch(r'C-[A-Za-z0-9][A-Za-z0-9_-]*', c['id'])}
    reserved_findings = {f.get('id') for f in objects(old.get('findings')) if isinstance(f.get('id'), str) and re.fullmatch(r'F-[A-Za-z0-9][A-Za-z0-9_-]*', f['id'])}
    used_checks, used_findings = set(), set()

    def migrated_id(original, prefix, reserved, used):
        if isinstance(original, str) and re.fullmatch(prefix + r'-[A-Za-z0-9][A-Za-z0-9_-]*', original) and original not in used:
            chosen = original
        else:
            n = 1
            while f'{prefix}-{n:02d}' in reserved or f'{prefix}-{n:02d}' in used:
                n += 1
            chosen = f'{prefix}-{n:02d}'
        used.add(chosen)
        return chosen

    for n, c in enumerate(objects(old.get('checks')), 1):
        cid = migrated_id(c.get('id'), 'C', reserved_checks, used_checks)
        result['migration_ids']['checks'].append({'old': c.get('id'), 'new': cid})
        env = {'static': 'static_review', 'automated': 'automated_test', 'emulation': 'desktop_emulation',
               'physical_device': 'physical_device', 'manual': 'static_review'}.get(c.get('evidence_type'), 'static_review')
        result['checks'].append({'id': cid, 'module': c.get('module', 1), 'required': bool(c.get('required', True)),
            'scenario': c.get('scenario') or 'Legacy check', 'expected': c.get('expected') or 'Not established',
            'actual': '', 'evidence': [], 'reason': 'Legacy result needs r2 environment/build/scope/substitution revalidation',
            'status': 'not_run', 'legacy_check_id': c.get('id'), 'legacy_status': c.get('status'),
            'environment': env, 'evidence_type': next(iter(ACQUISITION[env])), 'level': 'unestablished',
            'driver': 'agent', 'behavior': 'other', 'build_id': '', 'configuration': {}, 'conditions': {},
            'covers': [], 'substitutions': {p: substitution() for p in ('build', 'setup', 'additional')}})
    for n, f in enumerate(objects(old.get('findings')), 1):
        fid = migrated_id(f.get('id'), 'F', reserved_findings, used_findings)
        result['migration_ids']['findings'].append({'old': f.get('id'), 'new': fid})
        edits = [c for c in objects(old.get('changes')) if f.get('id') in ids(c.get('finding_ids'))]
        applied = bool(edits)
        status = 'implemented' if applied else 'open'
        reason = 'Legacy disposition retained in legacy_snapshot; r2 evidence gates require revalidation'
        result['findings'].append({**copy.deepcopy(f), 'id': fid, 'status': status, 'reason': reason,
            'determinism': 'unknown', 'depends_on': ['*'], 'affects': [{'id': 'legacy-scope', 'conditions': {}}],
            'refuted_scopes': [], 'contrary_evidence': [], 'verification_ids': [],
            'fix': {'applied': applied, 'applied_before_run': applied, 'device_dependent': True,
                    'build_id': '', 'evidence': [c.get('path', '') + ': ' + c.get('summary', '') for c in edits], 'required_check_ids': []}})
    return result


def md(value: Any) -> str:
    return str(value).replace('|', '\\|').replace('\n', ' ')


def json_block(value: Any) -> list:
    return ['```json', json.dumps(value, ensure_ascii=False, indent=2), '```']


def render_report(state: dict, assessment: dict) -> str:
    checks = index(state.get('checks'))
    used = sorted({c.get('environment', 'unreported') for c in checks.values() if c.get('status') in ('pass', 'fail', 'partial')})
    target_limits = sorted({c.get('environment', 'unreported') + ' ' + c.get('status', 'not_checked')
                            for c in objects(state.get('capabilities')) if c.get('environment') in ('physical_device', 'os_simulator', 'field_data')
                            and c.get('status') != 'available'})
    if not any(c.get('status') == 'available' and c.get('environment') in ('physical_device', 'os_simulator') for c in objects(state.get('capabilities'))):
        target_limits.append('no available simulator or physical device')
    lines = [f"Ceiling: {assessment['verification_ceiling']} ({', '.join(used) or 'no executed checks'}); " +
             (f"limits: {', '.join(target_limits)}; " if target_limits else '') +
             f"assessment {assessment['coverage']}; verification {assessment['verification']}.",
             '', '# Mobile UX audit — ' + str(state.get('run_id')), '', '## 1. Verdict', '',
             f"Mode: {state.get('mode')}. Principal task: {state.get('principal_task')}.",
             'Open P0/P1: ' + (', '.join(assessment['open_p0_p1']) or 'none recorded') + '.',
             'Evidence declarations are not independently authenticated by the helper.', '', '## 2. Coverage', '',
             'Standing substitutions (scoped to environment/build):']
    lines += json_block(state.get('standing_substitutions', []))
    lines += ['', '| Area | Disposition | Environments used | Highest level | What remains |', '| --- | --- | --- | --- | --- |']
    rank = {'unestablished': 0, 'mechanism': 1, 'proxy': 2, 'target': 3}
    for a in objects(state.get('coverage')):
        relevant = [checks[c] for c in ids(a.get('check_ids')) if c in checks and checks[c].get('status') in ('pass', 'fail', 'partial')]
        level = max((c.get('level', 'unestablished') for c in relevant), key=lambda x: rank.get(x, 0), default='none')
        lines.append(f"| {md(a.get('id'))}. {md(a.get('name'))} | {md(a.get('disposition'))} | {md(', '.join(sorted({c.get('environment', '') for c in relevant})))} | {level} | {md('; '.join(map(str, a.get('remaining', []))) or a.get('reason', ''))} |")
    lines += ['', '## 3. Findings by severity', '']
    findings = sorted(objects(state.get('findings')), key=lambda f: (str(f.get('severity')), str(f.get('id'))))
    for f in findings:
        if f.get('evidence_class') == 'recommendation':
            continue
        lines += [f"### {f.get('id')}: {f.get('title')}", '',
                  f"{f.get('severity')} · {f.get('evidence_class')} · **{f.get('status')}**", '',
                  f"Where: {f.get('location')}. Expected: {f.get('expected', 'not recorded')}. Actual: {f.get('actual', 'not recorded')}.",
                  f"Cause: {f.get('cause', 'unestablished')}. Disposition reason: {f.get('reason', '')}", '',
                  'Affected scope, retained evidence, fix and history:']
        lines += json_block({k: f.get(k) for k in ('affects', 'refuted_scopes', 'evidence', 'fix', 'contrary_evidence', 'status_history')})
        if f.get('fix', {}).get('device_regressions'):
            lines += ['', 'Device regression requirements (independent of observed scope):']
            lines += json_block({'requirements': f['fix']['device_regressions'],
                'qualification': [r for r in assessment.get('device_regressions', []) if r.get('finding_id') == f.get('id')],
                'note': 'Regression results do not verify or refute the original observed scopes.'})
        related = [c for c in checks.values() if any(fid == f.get('id') for fid, _ in covers(c) | regression_covers(c))]
        lines += ['', 'Checks (environment, level, substitutions, expected and actual):'] + json_block(related) + ['']
    if not findings:
        lines += ['None recorded.', '']
    lines += ['## 4. Recommendations', ''] + json_block([f for f in findings if f.get('evidence_class') == 'recommendation'])
    lines += ['', '## 5. Changes made', '']
    lines += json_block(state.get('changes', [])) if state.get('mode') == 'audit_and_fix' else ['No source edits authorized in this mode.']
    lines += ['', '## 6. Device check script', '', f"Budget: {state.get('device_check_budget')} entries. Applied device-fix reservation: {len(assessment['applied_device_entries'])}/{state.get('device_check_budget', 0) // 2}.", '']
    for cid in ids(state.get('device_script')):
        c = checks.get(cid, {})
        lines += [f"### {cid} [{', '.join(sorted({fid for fid, _ in covers(c) | regression_covers(c)}))}] {md(c.get('configuration', {}))}", '',
                  f"Build: {c.get('build_id')}", 'Substitutions active in this check (build/setup/additional):']
        lines += json_block(c.get('substitutions', {}))
        if regression_covers(c):
            lines += ['', 'Device regression links (not original-scope coverage):'] + json_block(c.get('regression_covers'))
        lines += ['', f"Setup: {c.get('setup', c.get('conditions', {}).get('setup', 'not reported'))}", '', 'Steps:']
        lines += [f'{i}. {step}' for i, step in enumerate(c.get('steps', []), 1)]
        lines += ['', f"Expected: {c.get('expected')}", '', 'Result: ___', 'Build and setup as tested (confirm each, or note differences): ___', 'Notes: ___', 'Screenshot: ___', '']
    if not state.get('device_script'):
        lines += ['No entries scheduled.', '']
    lines += ['Beyond budget (titles only):', '']
    lines += ['- ' + (str(x.get('title')) if isinstance(x, dict) else str(x)) for x in state.get('beyond_budget', [])] or ['None.']
    lines += ['', '## 7. Open questions', '']
    questions = state.get('limitations', []) + state.get('next_steps', []) + assessment['errors'] + assessment['gaps']
    lines += ['- ' + str(q) for q in questions] or ['None recorded.']
    lines += ['', '## Run provenance', ''] + json_block({k: state.get(k) for k in ('capabilities', 'builds', 'modules', 'commands', 'cleanup', 'history')})
    return '\n'.join(lines) + '\n'


def write_new(path: str, value: dict) -> Path:
    dest = Path(path).expanduser().resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open('x', encoding='utf-8') as out:
        json.dump(value, out, ensure_ascii=False, indent=2)
        out.write('\n')
    return dest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    p = sub.add_parser('init', help='Create an audit-only ledger unless edit mode is explicit')
    p.add_argument('--project', required=True)
    p.add_argument('--target', required=True)
    p.add_argument('--task', required=True)
    p.add_argument('--mode', choices=tuple(MODES), default='audit_only')
    p.add_argument('--device-dependent-fixes', choices=('propose_only', 'apply_and_hand_off'), default='propose_only')
    p.add_argument('--device-check-budget', type=int, default=10)
    p.add_argument('--output-dir')
    for verb in ('check', 'report'):
        p = sub.add_parser(verb)
        p.add_argument('run_file')
    for verb in ('migrate', 'apply-results'):
        p = sub.add_parser(verb)
        p.add_argument('--input', required=True)
        p.add_argument('--output', required=True)
        if verb == 'apply-results':
            p.add_argument('--results', required=True)
    args = parser.parse_args(argv)
    try:
        if args.action == 'init':
            state = new_state(args.project, args.target, args.task, args.mode, args.device_dependent_fixes, args.device_check_budget)
            parent = Path(args.output_dir).expanduser().resolve() if args.output_dir else Path(state['project']) / '.mobile-ux' / 'runs'
            folder = parent / state['run_id']
            folder.mkdir(parents=True, exist_ok=False)
            (folder / 'evidence').mkdir()
            file = write_new(str(folder / 'run.json'), state)
            print(json.dumps({'run_file': str(file), 'run_id': state['run_id']}))
            return 0
        if args.action in ('migrate', 'apply-results'):
            source = Path(args.input).expanduser().resolve(strict=True)
            if source == Path(args.output).expanduser().resolve():
                raise ValueError('Write a new output ledger; do not replace the input history')
            state = json.loads(source.read_text(encoding='utf-8'))
            if args.action == 'migrate':
                updated = migrate_state(state)
            else:
                payload = json.loads(Path(args.results).read_text(encoding='utf-8'))
                updated = apply_results(state, payload)
            assessment = assess(updated)
            if assessment['errors']:
                print(json.dumps(assessment, indent=2))
                return 2
            dest = write_new(args.output, updated)
            print(json.dumps({'run_file': str(dest), 'assessment': assessment}, ensure_ascii=False, indent=2))
            return 0
        file = Path(args.run_file).expanduser().resolve(strict=True)
        state = json.loads(file.read_text(encoding='utf-8'))
        assessment = assess(state)
        print(json.dumps(assessment, ensure_ascii=False, indent=2))
        if args.action == 'report' and not assessment['errors']:
            (file.parent / 'report.md').write_text(render_report(state, assessment), encoding='utf-8')
            (file.parent / 'summary.json').write_text(json.dumps(assessment, indent=2) + '\n', encoding='utf-8')
        return 2 if assessment['errors'] else (0 if assessment['claimable_complete'] else 3)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
