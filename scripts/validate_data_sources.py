#!/usr/bin/env python3
"""Validate CSV sources used by the runtime data compiler."""

from __future__ import annotations

from collections import Counter

from data_pipeline_common import DATASET_FILES, collect_dataset, format_issue


def main() -> None:
    all_issues = []
    for dataset_key, files in DATASET_FILES.items():
        _, issues = collect_dataset(dataset_key, files)
        all_issues.extend(issues)

    error_count = sum(1 for issue in all_issues if issue.severity == "error")
    warning_count = sum(1 for issue in all_issues if issue.severity == "warning")

    print("=== VALIDATE DATA SOURCES ===")
    print(f"Datasets scanned: {len(DATASET_FILES)}")
    print(f"Total issues: {len(all_issues)} (errors: {error_count}, warnings: {warning_count})")

    if all_issues:
        by_kind = Counter(issue.kind for issue in all_issues)
        print("\nIssue counts:")
        for kind in sorted(by_kind.keys()):
            print(f"- {kind}: {by_kind[kind]}")

        print("\nSample issues:")
        for issue in all_issues[:50]:
            print(format_issue(issue))

    if error_count > 0:
        raise SystemExit(1)

    print("OK: CSV data sources are structurally valid.")


if __name__ == "__main__":
    main()

