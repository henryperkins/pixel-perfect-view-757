"""Read-only comparison with the inventories taken before runner work."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
APP = Path('/home/ubuntu/pixel-perfect-view-757')
results = {}
for name in ('pattern-before.json', 'pattern-evidence-before.json', 'installed-before.json'):
    before = json.loads((ROOT / name).read_text())
    changed = [path for path, digest in before.items() if not Path(path).is_file() or hashlib.sha256(Path(path).read_bytes()).hexdigest() != digest]
    assert not changed, (name, changed)
    results[name] = {'files_checked': len(before), 'changed': changed}
for command, snapshot in [(['git', 'status', '--porcelain=v1', '--untracked-files=all'], 'pattern-status-before.txt'), (['git', 'rev-parse', 'HEAD'], 'pattern-head-before.txt'), (['git', 'diff', '--cached', '--binary'], 'pattern-index-before.patch')]:
    current = subprocess.run(command, cwd=APP, capture_output=True, check=True).stdout
    assert current == (ROOT / snapshot).read_bytes(), snapshot
    results[snapshot] = 'unchanged'
results['physical_device_execution'] = 'not_run'
results['app_changes'] = False
results['installed_plugin_changes'] = False
(ROOT / 'validation/preservation.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps(results, indent=2))
