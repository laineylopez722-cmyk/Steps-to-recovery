#!/usr/bin/env python3
"""Grade recovery-data-hook eval outputs deterministically."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ExpectationResult = dict[str, object]


def read_text(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def line_number(text: str, index: int) -> int:
    return text.count('\n', 0, index) + 1


def line_at(text: str, number: int) -> str:
    lines = text.splitlines()
    if 1 <= number <= len(lines):
        return lines[number - 1].strip()
    return ''


def format_match(path: Path, text: str, match: re.Match[str]) -> str:
    number = line_number(text, match.start())
    return f'{path.name}:{number} -> {line_at(text, number)}'


def find_match(text: str, pattern: str, *, flags: int = 0) -> re.Match[str] | None:
    return re.search(pattern, text, flags)


def get_hook_and_test_paths(outputs_dir: Path) -> tuple[Path | None, Path | None]:
    hook_path: Path | None = None
    test_path: Path | None = None

    for path in sorted(outputs_dir.iterdir()):
        if path.name.endswith('.test.tsx'):
            test_path = path
        elif path.name.endswith('.ts') and not path.name.endswith('.d.ts'):
            hook_path = path

    return hook_path, test_path


def detect_table_name(hook_text: str) -> str | None:
    match = re.search(r'\b(?:FROM|INTO|UPDATE)\s+([a-z_]+)\b', hook_text, re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def build_result(text: str, passed: bool, evidence: str) -> ExpectationResult:
    return {
        'text': text,
        'passed': passed,
        'evidence': evidence,
    }


def check_encrypt_before_write(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    lines = hook_text.splitlines()
    write_checks: list[str] = []

    for index, line in enumerate(lines):
        if 'db.runAsync' not in line:
            continue

        block = '\n'.join(lines[index : index + 12])
        if not re.search(r'\b(INSERT|UPDATE)\b', block):
            continue

        lookback_start = max(0, index - 100)
        lookback = '\n'.join(lines[lookback_start:index])
        encrypt_match = re.search(r'\bencrypt[A-Za-z0-9_]*\(', lookback)
        write_line = index + 1

        if encrypt_match is None:
            return build_result(
                expectation,
                False,
                f'{hook_path.name}:{write_line} -> write call has no encryptContent() in the preceding 100 lines.',
            )

        encrypt_line = lookback_start + line_number(lookback, encrypt_match.start())
        write_checks.append(f'{hook_path.name}:{encrypt_line} before {hook_path.name}:{write_line}')

    if not write_checks:
        return build_result(
            expectation,
            False,
            f'{hook_path.name} -> no INSERT or UPDATE db.runAsync call found.',
        )

    return build_result(expectation, True, '; '.join(write_checks))


def check_delete_before_delete(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    delete_queue_match = find_match(hook_text, r'addDeleteToSyncQueue\s*\(')
    delete_sql_match = find_match(hook_text, r'\bDELETE\s+FROM\b', flags=re.IGNORECASE)

    if delete_queue_match is None or delete_sql_match is None:
        return build_result(
            expectation,
            False,
            f'{hook_path.name} -> missing addDeleteToSyncQueue() or DELETE FROM.',
        )

    delete_queue_line = line_number(hook_text, delete_queue_match.start())
    delete_sql_line = line_number(hook_text, delete_sql_match.start())

    if delete_queue_line < delete_sql_line:
        return build_result(
            expectation,
            True,
            (
                f'{hook_path.name}:{delete_queue_line} addDeleteToSyncQueue() '
                f'before {hook_path.name}:{delete_sql_line} DELETE FROM'
            ),
        )

    return build_result(
        expectation,
        False,
        (
            f'{hook_path.name}:{delete_queue_line} addDeleteToSyncQueue() '
            f'is not before {hook_path.name}:{delete_sql_line} DELETE FROM'
        ),
    )


def check_all_settled(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    settled_match = find_match(hook_text, r'Promise\.allSettled\s*\(')
    plain_all_match = find_match(hook_text, r'Promise\.all\s*\(\s*\w+\.map\s*\(')

    if settled_match is None:
        return build_result(expectation, False, f'{hook_path.name} -> Promise.allSettled() not found.')

    if plain_all_match is not None:
        return build_result(
            expectation,
            False,
            f'{format_match(hook_path, hook_text, plain_all_match)}; {format_match(hook_path, hook_text, settled_match)}',
        )

    return build_result(expectation, True, format_match(hook_path, hook_text, settled_match))


def check_query_key_root(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    table_name = detect_table_name(hook_text)
    if table_name is None:
        return build_result(expectation, False, f'{hook_path.name} -> could not infer a SQL table name.')

    root_match = re.search(
        rf"(?:all\s*:\s*\[\s*'{re.escape(table_name)}'|queryKey:\s*\[\s*'{re.escape(table_name)}')",
        hook_text,
    )
    if root_match is None:
        return build_result(
            expectation,
            False,
            f'{hook_path.name} -> inferred table \"{table_name}\" does not appear as the query key root.',
        )

    return build_result(expectation, True, format_match(hook_path, hook_text, root_match))


def check_mock_definitions(expectation: str, test_path: Path, test_text: str) -> ExpectationResult:
    first_jest_mock = find_match(test_text, r'jest\.mock\s*\(')
    first_mock_definition = find_match(test_text, r'(?:const|let)\s+mock[A-Za-z0-9_]*\s*=')

    if first_jest_mock is None:
        return build_result(expectation, False, f'{test_path.name} -> no jest.mock() call found.')

    if first_mock_definition is None:
        return build_result(
            expectation,
            False,
            f'{test_path.name} -> no mock variable definition found before jest.mock().',
        )

    if first_mock_definition.start() < first_jest_mock.start():
        return build_result(
            expectation,
            True,
            (
                f'{format_match(test_path, test_text, first_mock_definition)} before '
                f'{format_match(test_path, test_text, first_jest_mock)}'
            ),
        )

    return build_result(
        expectation,
        False,
        (
            f'{format_match(test_path, test_text, first_mock_definition)} is not before '
            f'{format_match(test_path, test_text, first_jest_mock)}'
        ),
    )


def check_import_order(expectation: str, test_path: Path, test_text: str) -> ExpectationResult:
    jest_matches = list(re.finditer(r'jest\.mock\s*\(', test_text))
    hook_import = re.search(r"from\s+'(?:\.\./|\./)[^']*use[^']+';", test_text)

    if not jest_matches:
        return build_result(expectation, False, f'{test_path.name} -> no jest.mock() call found.')

    if hook_import is None:
        return build_result(expectation, False, f'{test_path.name} -> hook import not found.')

    last_jest_match = jest_matches[-1]
    if hook_import.start() > last_jest_match.start():
        return build_result(
            expectation,
            True,
            (
                f'{test_path.name}:{line_number(test_text, hook_import.start())} hook import after '
                f'{test_path.name}:{line_number(test_text, last_jest_match.start())} last jest.mock()'
            ),
        )

    return build_result(
        expectation,
        False,
        (
            f'{test_path.name}:{line_number(test_text, hook_import.start())} hook import is before '
            f'{test_path.name}:{line_number(test_text, last_jest_match.start())} last jest.mock()'
        ),
    )


def check_logger_no_console(
    expectation: str, hook_path: Path, hook_text: str, test_path: Path, test_text: str
) -> ExpectationResult:
    hook_console = re.search(r'console\.', hook_text)
    test_console = re.search(r'console\.', test_text)
    hook_logger = re.search(r'logger\.', hook_text)
    test_logger = re.search(r'logger\.', test_text)

    if hook_console is not None:
        return build_result(expectation, False, format_match(hook_path, hook_text, hook_console))

    if test_console is not None:
        return build_result(expectation, False, format_match(test_path, test_text, test_console))

    if hook_logger is not None:
        return build_result(expectation, True, format_match(hook_path, hook_text, hook_logger))

    if test_logger is not None:
        return build_result(expectation, True, format_match(test_path, test_text, test_logger))

    return build_result(
        expectation,
        False,
        f'{hook_path.name} / {test_path.name} -> no logger usage found.',
    )


def check_no_any(expectation: str, hook_path: Path, hook_text: str, test_path: Path, test_text: str) -> ExpectationResult:
    any_type_pattern = r'(?::\s*any\b|\bas\s+any\b|<any\b|\bArray<any>\b|\bany\[\])'

    hook_match = re.search(any_type_pattern, hook_text)
    if hook_match is not None:
        return build_result(expectation, False, format_match(hook_path, hook_text, hook_match))

    test_match = re.search(any_type_pattern, test_text)
    if test_match is not None:
        return build_result(expectation, False, format_match(test_path, test_text, test_match))

    return build_result(expectation, True, f'{hook_path.name} and {test_path.name} contain no any types.')


def check_read_update_only(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    bad_patterns = {
        'export function useCreate': r'export\s+function\s+useCreate',
        'export function useDelete': r'export\s+function\s+useDelete',
        'addDeleteToSyncQueue': r'addDeleteToSyncQueue\s*\(',
        'DELETE FROM': r'\bDELETE\s+FROM\b',
    }

    for label, pattern in bad_patterns.items():
        match = re.search(pattern, hook_text, re.IGNORECASE)
        if match is not None:
            return build_result(expectation, False, f'{label} found at {format_match(hook_path, hook_text, match)}')

    use_query_match = re.search(r'useQuery\s*\(', hook_text)
    if use_query_match is None:
        return build_result(
            expectation,
            False,
            f'{hook_path.name} -> expected a useQuery() read hook.',
        )

    return build_result(
        expectation,
        True,
        format_match(hook_path, hook_text, use_query_match),
    )


def check_category_plaintext(expectation: str, hook_path: Path, hook_text: str) -> ExpectationResult:
    bad_patterns = [
        r'encrypted_category',
        r'encryptContent\s*\(\s*category\s*\)',
        r'encryptContent\s*\(\s*[^)]*category[^)]*\)',
    ]

    for pattern in bad_patterns:
        match = re.search(pattern, hook_text)
        if match is not None:
            return build_result(expectation, False, format_match(hook_path, hook_text, match))

    category_mentions = list(re.finditer(r'\bcategory\b', hook_text))
    if len(category_mentions) < 2:
        return build_result(
            expectation,
            False,
            f'{hook_path.name} -> category does not appear often enough to verify plaintext mapping.',
        )

    return build_result(
        expectation,
        True,
        (
            f'Examples: {format_match(hook_path, hook_text, category_mentions[0])}; '
            f'{format_match(hook_path, hook_text, category_mentions[1])}'
        ),
    )


def evaluate_expectation(
    expectation: str, hook_path: Path, hook_text: str, test_path: Path, test_text: str
) -> ExpectationResult:
    if expectation.startswith('Sensitive fields are encrypted before'):
        return check_encrypt_before_write(expectation, hook_path, hook_text)
    if expectation.startswith('The delete path calls addDeleteToSyncQueue'):
        return check_delete_before_delete(expectation, hook_path, hook_text)
    if expectation.startswith('The read path uses Promise.allSettled'):
        return check_all_settled(expectation, hook_path, hook_text)
    if expectation.startswith('The query key root uses the table name'):
        return check_query_key_root(expectation, hook_path, hook_text)
    if expectation.startswith('The test file defines mock functions before'):
        return check_mock_definitions(expectation, test_path, test_text)
    if expectation.startswith('The test file imports the hook only after'):
        return check_import_order(expectation, test_path, test_text)
    if expectation.startswith('The generated hook and test use logger'):
        return check_logger_no_console(expectation, hook_path, hook_text, test_path, test_text)
    if expectation.startswith('The generated hook and test contain no any'):
        return check_no_any(expectation, hook_path, hook_text, test_path, test_text)
    if expectation.startswith('The output defines read and update operations only'):
        return check_read_update_only(expectation, hook_path, hook_text)
    if expectation.startswith('The category field remains plaintext'):
        return check_category_plaintext(expectation, hook_path, hook_text)

    return build_result(expectation, False, 'No handler registered for this expectation.')


def collect_metrics(outputs_dir: Path) -> dict[str, object]:
    output_chars = 0
    files_created: list[str] = []

    for path in sorted(outputs_dir.iterdir()):
        if path.is_file():
            files_created.append(path.name)
            output_chars += len(read_text(path))

    return {
        'tool_calls': {},
        'total_tool_calls': 0,
        'total_steps': 0,
        'files_created': files_created,
        'errors_encountered': 0,
        'output_chars': output_chars,
        'transcript_chars': 0,
    }


def grade_run(run_dir: Path, expectations: list[str]) -> None:
    outputs_dir = run_dir / 'outputs'
    hook_path, test_path = get_hook_and_test_paths(outputs_dir)

    if hook_path is None or test_path is None:
        raise RuntimeError(f'Missing hook/test file in {outputs_dir}')

    hook_text = read_text(hook_path)
    test_text = read_text(test_path)

    expectation_results = [
        evaluate_expectation(expectation, hook_path, hook_text, test_path, test_text)
        for expectation in expectations
    ]

    passed = sum(1 for result in expectation_results if result['passed'] is True)
    total = len(expectation_results)
    failed = total - passed
    pass_rate = round((passed / total) if total else 0.0, 2)

    timing_path = run_dir / 'timing.json'
    timing: dict[str, object] = {}
    if timing_path.exists():
        timing = json.loads(read_text(timing_path))

    grading = {
        'expectations': expectation_results,
        'summary': {
            'passed': passed,
            'failed': failed,
            'total': total,
            'pass_rate': pass_rate,
        },
        'execution_metrics': collect_metrics(outputs_dir),
        'timing': timing,
        'claims': [],
        'user_notes_summary': {
            'uncertainties': [],
            'needs_review': [],
            'workarounds': [],
        },
        'eval_feedback': {
            'overall': 'No additional eval feedback.',
            'suggestions': [],
        },
    }

    grading_path = run_dir / 'grading.json'
    grading_path.write_text(json.dumps(grading, indent=2) + '\n', encoding='utf-8')


def main() -> int:
    workspace = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()

    for eval_dir in sorted(workspace.glob('eval-*')):
        metadata_path = eval_dir / 'eval_metadata.json'
        metadata = json.loads(read_text(metadata_path))
        expectations = metadata.get('assertions', [])

        for configuration in ('with_skill', 'without_skill'):
            config_dir = eval_dir / configuration
            for run_dir in sorted(config_dir.glob('run-*')):
                grade_run(run_dir, expectations)

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
