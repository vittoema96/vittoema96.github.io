#!/usr/bin/env python3
"""Compile authoring CSV files into runtime JSON modules under src/data."""

from __future__ import annotations

import json
from pathlib import Path

from data_pipeline_common import (
    DATASET_FILES,
    INFINITY_NUMERIC_SENTINEL,
    OUT_ROOT,
    collect_dataset,
    format_issue,
)

ITEM_DATASET_KEYS = {"weapon", "apparel", "aid", "ammo", "other", "mod"}


def dataset_output_path(dataset_key: str) -> Path:
    if dataset_key in ITEM_DATASET_KEYS:
        return OUT_ROOT / "item" / f"{dataset_key}.json"
    return OUT_ROOT / f"{dataset_key}.json"


def write_json_dataset(dataset_key: str, rows: dict[str, dict]) -> None:
    ordered = {key: rows[key] for key in sorted(rows.keys())}
    out_path = dataset_output_path(dataset_key)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(ordered, ensure_ascii=False, indent=2)
    # Preserve Infinity semantics in runtime JSON using a numeric literal accepted by JS parsers.
    json_text = json_text.replace(f'"{INFINITY_NUMERIC_SENTINEL}"', '1e1000')
    out_path.write_text(json_text + "\n", encoding="utf-8")


def cleanup_legacy_item_json_files() -> None:
    for dataset_key in ITEM_DATASET_KEYS:
        legacy_path = OUT_ROOT / f"{dataset_key}.json"
        if legacy_path.exists():
            legacy_path.unlink()


def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    compiled: dict[str, dict[str, dict]] = {}
    all_issues = []

    for dataset_key, files in DATASET_FILES.items():
        rows, issues = collect_dataset(dataset_key, files)
        compiled[dataset_key] = rows
        all_issues.extend(issues)

    error_count = sum(1 for issue in all_issues if issue.severity == "error")
    warning_count = sum(1 for issue in all_issues if issue.severity == "warning")

    print("=== BUILD DATA FROM CSV ===")
    print(f"Datasets compiled: {len(DATASET_FILES)}")
    print(f"Issues found: {len(all_issues)} (errors: {error_count}, warnings: {warning_count})")

    if all_issues:
        for issue in all_issues[:50]:
            print(format_issue(issue))

    if error_count > 0:
        raise SystemExit(1)

    for dataset_key, rows in compiled.items():
        write_json_dataset(dataset_key, rows)

    cleanup_legacy_item_json_files()
    print(f"Wrote runtime data artifacts to {OUT_ROOT}")


if __name__ == "__main__":
    main()




