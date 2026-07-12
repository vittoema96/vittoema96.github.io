#!/usr/bin/env python3
"""Shared helpers for CSV -> JSON data pipeline."""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES_ROOT = ROOT / "data" / "sources"
OUT_ROOT = ROOT / "src" / "data"
MANIFEST_PATH = ROOT / "data" / "manifests" / "data.json"
INFINITY_NUMERIC_SENTINEL = "__CSV_INFINITY_AS_NUMERIC_LITERAL__"

def load_dataset_manifest() -> dict[str, list[str]]:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"Data manifest not found: {MANIFEST_PATH}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        raise ValueError("Data manifest root must be an object")

    normalized: dict[str, list[str]] = {}
    for dataset_key, files in manifest.items():
        if not isinstance(dataset_key, str) or not dataset_key.strip():
            raise ValueError("Data manifest contains an invalid dataset key")
        # Allow top-level manifest metadata such as `_what_is_this`.
        if dataset_key.startswith("_"):
            continue
        if not isinstance(files, list) or len(files) == 0 or not all(isinstance(file, str) and file.strip() for file in files):
            raise ValueError(f"Dataset '{dataset_key}' must be a non-empty string array")
        normalized[dataset_key] = files

    return normalized


DATASET_FILES: dict[str, list[str]] = load_dataset_manifest()

_INT_RE = re.compile(r"^[+-]?\d+$")
_FLOAT_RE = re.compile(r"^[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?$")


@dataclass
class DataIssue:
    severity: str
    kind: str
    dataset: str
    file: str
    line: int
    key: str
    detail: str


def coerce_csv_value(raw: str | None):
    if raw is None:
        return None

    value = raw.strip()
    if value == "":
        return None

    if value == "Infinity":
        # Defer conversion to JSON writer, where this sentinel becomes numeric literal 1e1000.
        return INFINITY_NUMERIC_SENTINEL

    lower = value.lower()
    if lower == "true":
        return True
    if lower == "false":
        return False

    if _INT_RE.match(value):
        try:
            return int(value)
        except ValueError:
            pass

    if _FLOAT_RE.match(value):
        try:
            return float(value)
        except ValueError:
            pass

    if (value.startswith("[") and value.endswith("]")) or (
        value.startswith("{") and value.endswith("}")
    ):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return raw

    return raw


def read_dataset_rows(dataset_key: str, relative_csv: str) -> tuple[dict[str, dict], list[DataIssue]]:
    issues: list[DataIssue] = []
    csv_path = SOURCES_ROOT / relative_csv
    merged: dict[str, dict] = {}

    if not csv_path.exists():
        issues.append(
            DataIssue(
                severity="error",
                kind="MISSING_CSV_FILE",
                dataset=dataset_key,
                file=relative_csv,
                line=1,
                key="-",
                detail=f"missing CSV file: {csv_path.as_posix()}",
            )
        )
        return merged, issues

    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []

        if "ID" not in headers:
            issues.append(
                DataIssue(
                    severity="error",
                    kind="MISSING_ID_COLUMN",
                    dataset=dataset_key,
                    file=relative_csv,
                    line=1,
                    key="-",
                    detail="CSV must contain ID column",
                )
            )
            return merged, issues

        for line_no, row in enumerate(reader, start=2):
            row_id = (row.get("ID") or "").strip()
            if not row_id:
                issues.append(
                    DataIssue(
                        severity="error",
                        kind="EMPTY_ID",
                        dataset=dataset_key,
                        file=relative_csv,
                        line=line_no,
                        key="-",
                        detail="row has empty ID",
                    )
                )
                continue

            transformed = {column: coerce_csv_value(value) for column, value in row.items()}
            transformed["ID"] = row_id

            if row_id in merged:
                issues.append(
                    DataIssue(
                        severity="warning",
                        kind="DUPLICATE_ID",
                        dataset=dataset_key,
                        file=relative_csv,
                        line=line_no,
                        key=row_id,
                        detail="duplicate ID detected, latest row overwrites previous one",
                    )
                )

            merged[row_id] = transformed

    return merged, issues


def collect_dataset(dataset_key: str, files: list[str]) -> tuple[dict[str, dict], list[DataIssue]]:
    merged: dict[str, dict] = {}
    issues: list[DataIssue] = []

    for relative_csv in files:
        rows, csv_issues = read_dataset_rows(dataset_key, relative_csv)
        issues.extend(csv_issues)
        merged.update(rows)

    return merged, issues


def format_issue(issue: DataIssue) -> str:
    return (
        f"[{issue.severity.upper()}][{issue.kind}] "
        f"dataset={issue.dataset} file={issue.file}:{issue.line} key={issue.key} -> {issue.detail}"
    )







