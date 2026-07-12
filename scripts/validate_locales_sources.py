#!/usr/bin/env python3
"""Validate CSV/JSON locale sources inside data/sources using data/manifests/i18n.json."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
SOURCES_ROOT = ROOT / "data" / "sources"
I18N_MANIFEST_PATH = ROOT / "data" / "manifests" / "i18n.json"
SUPPORTED_LANGUAGES = ("it", "en")


@dataclass
class Issue:
    kind: str
    file: str
    line: int
    key: str
    detail: str


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_i18n_manifest() -> tuple[list[tuple[str, str]], list[str]]:
    data = read_json(I18N_MANIFEST_PATH)
    if not isinstance(data, dict):
        raise ValueError("i18n manifest root must be an object")

    raw_pairs = data.get("csvToJsonPairs")
    if not isinstance(raw_pairs, list):
        raise ValueError("i18n manifest key 'csvToJsonPairs' must be an array")

    pairs: list[tuple[str, str]] = []
    for entry in raw_pairs:
        if not isinstance(entry, dict):
            raise ValueError("every csvToJsonPairs entry must be an object")
        csv_rel = entry.get("csv")
        json_rel = entry.get("json")
        if not isinstance(csv_rel, str) or not csv_rel.strip():
            raise ValueError("every csvToJsonPairs entry must have non-empty 'csv'")
        if not isinstance(json_rel, str) or not json_rel.strip():
            raise ValueError("every csvToJsonPairs entry must have non-empty 'json'")
        pairs.append((csv_rel, json_rel))

    raw_standalone = data.get("standaloneJson", [])
    if not isinstance(raw_standalone, list) or not all(isinstance(path, str) and path.strip() for path in raw_standalone):
        raise ValueError("i18n manifest key 'standaloneJson' must be an array of non-empty strings")

    return pairs, raw_standalone


def read_csv_rows(path: Path) -> tuple[list[str], list[tuple[int, dict[str, str]]]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = [(idx, row) for idx, row in enumerate(reader, start=2)]
    return headers, rows


def has_non_empty_bilingual_block(block: object) -> bool:
    if not isinstance(block, dict):
        return False
    return all(isinstance(block.get(lang), str) and bool(block.get(lang, "").strip()) for lang in SUPPORTED_LANGUAGES)


def has_metadata_block(entry: dict) -> bool:
    for key, value in entry.items():
        if key.startswith("_") and has_non_empty_bilingual_block(value):
            return True
    return False


def has_specific_metadata(entry: dict, meta_key: str) -> bool:
    """Check if entry has a specific metadata key (e.g. '_descriptor') with a valid bilingual block."""
    return meta_key in entry and has_non_empty_bilingual_block(entry[meta_key])


def validate_translation_keys(entry: dict, rel_file: str, line_no: int, key: str) -> list[Issue]:
    issues: list[Issue] = []

    for lang in SUPPORTED_LANGUAGES:
        if lang not in entry:
            issues.append(
                Issue(
                    kind="MISSING_LANGUAGE_KEY",
                    file=rel_file,
                    line=line_no,
                    key=key,
                    detail=f"missing required language key: {lang}",
                )
            )
            continue

        val = entry.get(lang)
        if not isinstance(val, str) or not val.strip():
            issues.append(
                Issue(
                    kind="EMPTY_LANGUAGE_VALUE",
                    file=rel_file,
                    line=line_no,
                    key=key,
                    detail=f"{lang} must be a non-empty string",
                )
            )

    return issues


def validate_translation_block(block: dict, rel_file: str, json_path: str) -> list[Issue]:
    issues: list[Issue] = []
    present_languages = [lang for lang in SUPPORTED_LANGUAGES if lang in block]
    if not present_languages:
        return issues

    missing = [lang for lang in SUPPORTED_LANGUAGES if lang not in block]
    if missing:
        issues.append(
            Issue(
                kind="PARTIAL_TRANSLATION_BLOCK",
                file=rel_file,
                line=1,
                key=json_path,
                detail=f"missing languages in translation block: {', '.join(missing)}",
            )
        )

    for lang in present_languages:
        val = block.get(lang)
        if val is None:
            issues.append(
                Issue(
                    kind="NONE_VALUE",
                    file=rel_file,
                    line=1,
                    key=json_path,
                    detail=f"{lang} is None",
                )
            )
        elif isinstance(val, str) and not val.strip():
            issues.append(
                Issue(
                    kind="EMPTY_STRING_VALUE",
                    file=rel_file,
                    line=1,
                    key=json_path,
                    detail=f"{lang} is an empty string",
                )
            )

    return issues


def scan_json_values(rel_file: str, node: object, path: str = "$") -> list[Issue]:
    issues: list[Issue] = []

    if isinstance(node, dict):
        issues.extend(validate_translation_block(node, rel_file, path))
        for key, value in node.items():
            child_path = f"{path}.{key}" if path != "$" else f"$.{key}"
            issues.extend(scan_json_values(rel_file, value, child_path))
        return issues

    if isinstance(node, list):
        for idx, value in enumerate(node):
            issues.extend(scan_json_values(rel_file, value, f"{path}[{idx}]"))
        return issues

    if node is None:
        issues.append(
            Issue(
                kind="NONE_VALUE",
                file=rel_file,
                line=1,
                key=path,
                detail="value is None",
            )
        )
    elif isinstance(node, str) and not node.strip():
        issues.append(
            Issue(
                kind="EMPTY_STRING_VALUE",
                file=rel_file,
                line=1,
                key=path,
                detail="value is an empty string",
            )
        )

    return issues


def validate_all_source_json_files() -> list[Issue]:
    issues: list[Issue] = []
    for json_file in sorted(SOURCES_ROOT.rglob("*.json")):
        rel = json_file.relative_to(ROOT).as_posix()
        try:
            data = read_json(json_file)
        except json.JSONDecodeError as exc:
            issues.append(
                Issue(
                    kind="INVALID_JSON",
                    file=rel,
                    line=1,
                    key="$",
                    detail=f"invalid JSON: {exc}",
                )
            )
            continue

        if not isinstance(data, dict):
            issues.append(
                Issue(
                    kind="INVALID_SOURCE_JSON",
                    file=rel,
                    line=1,
                    key="$",
                    detail="source JSON root must be an object",
                )
            )
            continue

        issues.extend(scan_json_values(rel, data))

    return issues


def validate_one_pair(csv_rel: str, json_rel: str) -> list[Issue]:
    csv_path = SOURCES_ROOT / csv_rel
    source_path = SOURCES_ROOT / json_rel
    issues: list[Issue] = []

    if not csv_path.exists():
        issues.append(
            Issue(
                kind="MISSING_CSV_FILE",
                file=csv_rel,
                line=1,
                key="-",
                detail=f"missing CSV file: {csv_path.relative_to(ROOT).as_posix()}",
            )
        )
        return issues

    if not source_path.exists():
        issues.append(
            Issue(
                kind="MISSING_SOURCE_FILE",
                file=csv_rel,
                line=1,
                key="-",
                detail=f"missing source file: {source_path.relative_to(ROOT).as_posix()}",
            )
        )
        return issues

    headers, rows = read_csv_rows(csv_path)
    if "ID" not in headers:
        issues.append(
            Issue(
                kind="MISSING_ID_COLUMN",
                file=csv_rel,
                line=1,
                key="-",
                detail="CSV must contain an ID column",
            )
        )
        return issues

    source_data = read_json(source_path)
    if not isinstance(source_data, dict):
        issues.append(
            Issue(
                kind="INVALID_SOURCE_JSON",
                file=csv_rel,
                line=1,
                key="-",
                detail="source JSON root must be an object",
            )
        )
        return issues

    for line_no, row in rows:
        key = (row.get("ID") or "").strip()
        if not key:
            issues.append(
                Issue(
                    kind="EMPTY_ID",
                    file=csv_rel,
                    line=line_no,
                    key="-",
                    detail="empty ID",
                )
            )
            continue

        entry = source_data.get(key)
        if not isinstance(entry, dict):
            issues.append(
                Issue(
                    kind="MISSING_ENTRY",
                    file=csv_rel,
                    line=line_no,
                    key=key,
                    detail="entry not found in source JSON",
                )
            )
            continue

        issues.extend(validate_translation_keys(entry, csv_rel, line_no, key))

        if not has_metadata_block(entry):
            issues.append(
                Issue(
                    kind="MISSING_DESCRIPTION",
                    file=csv_rel,
                    line=line_no,
                    key=key,
                    detail="missing metadata bilingual block (any _* key)",
                )
            )

        # Mod entries (CSVs under mods/) must have a _descriptor bilingual block
        if Path(csv_rel).parts[0] == "mods" and not has_specific_metadata(entry, "_descriptor"):
            issues.append(
                Issue(
                    kind="MISSING_DESCRIPTOR",
                    file=csv_rel,
                    line=line_no,
                    key=key,
                    detail="mod entry missing _descriptor bilingual block",
                )
            )

    return issues


def format_issue(issue: Issue) -> str:
    return f"[{issue.kind}] {issue.file}:{issue.line} key={issue.key} -> {issue.detail}"


def summarize(issues: Iterable[Issue]) -> tuple[dict[str, int], list[Issue]]:
    counts: dict[str, int] = {}
    collected = list(issues)
    for issue in collected:
        counts[issue.kind] = counts.get(issue.kind, 0) + 1
    return counts, collected


def main() -> None:
    if not SOURCES_ROOT.exists():
        raise SystemExit(f"Missing sources root: {SOURCES_ROOT}")
    if not I18N_MANIFEST_PATH.exists():
        raise SystemExit(f"Missing i18n manifest: {I18N_MANIFEST_PATH}")

    try:
        pairs, _standalone = load_i18n_manifest()
    except ValueError as exc:
        raise SystemExit(f"Invalid i18n manifest: {exc}")

    all_issues: list[Issue] = []
    for csv_rel, json_rel in pairs:
        all_issues.extend(validate_one_pair(csv_rel, json_rel))

    all_issues.extend(validate_all_source_json_files())

    counts, issues = summarize(all_issues)

    print("=== VALIDATE LOCALES SOURCES ===")
    print(f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}")
    print(f"CSV files scanned: {len(pairs)}")
    print(f"Source JSON files scanned: {len(list(SOURCES_ROOT.rglob('*.json')))}")
    print(f"Total issues: {len(issues)}")

    if issues:
        print("\nIssue counts:")
        for kind in sorted(counts.keys()):
            print(f"- {kind}: {counts[kind]}")

        print("\nSample issues:")
        for issue in issues[:50]:
            print(format_issue(issue))

        raise SystemExit(1)

    print("OK: every CSV entry has translation and description in source JSON.")


if __name__ == "__main__":
    main()




