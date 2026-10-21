#!/usr/bin/env python3
"""Export raw behavioral task packets without their separate grading criteria.

This utility prepares inputs; it does not run an agent or grade outcomes.
"""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--batch-size', type=int, default=7)
    args = parser.parse_args()
    if args.batch_size < 1:
        parser.error('--batch-size must be positive')
    source = Path(__file__).with_name('eval_scenarios.json')
    catalog = json.loads(source.read_text(encoding='utf-8'))
    destination = Path(args.output_dir).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    cases = catalog['cases']
    for start in range(0, len(cases), args.batch_size):
        raw = [{key: case[key] for key in ('case_id', 'facts', 'request')}
               for case in cases[start:start + args.batch_size]]
        packet = {'common_context': catalog['common_context'],
                  'response_shape': catalog['response_shape'], 'records': raw,
                  'response_shape_note': catalog['response_shape_note']}
        path = destination / ('work-packet-%02d.json' % (start // args.batch_size + 1))
        with path.open('x', encoding='utf-8') as stream:
            json.dump(packet, stream, indent=2, ensure_ascii=False)
            stream.write('\n')
        print(path)


if __name__ == '__main__':
    main()
