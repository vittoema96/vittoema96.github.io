#!/usr/bin/env python3
"""
Build runtime locale files from authoring sources.

Source of truth: src/locales/source/**
Output: src/locales/en.json and src/locales/it.json

Authoring file format (bilingual):
  key -> { en: string, it: string, _description?: { en: string, it: string } }

Every field that starts with _ and contains a bilingual block is expanded
to key + Suffix in runtime output (for example: _description -> Description,
_benefit -> Benefit, _penalty -> Penalty, _foo_bar -> FooBar).
"""

from __future__ import annotations

import json
from pathlib import Path

LANGUAGES = ["it", "en"]

ROOT = Path(__file__).resolve().parents[1]
AUTHORING_DATA = ROOT / "src" / "locales" / "source"
OUT = ROOT / "src" / "locales"


def read_json(path: Path) -> dict:
    """ Read a JSON file from a path """
    return json.loads(path.read_text(encoding="utf-8"))


def to_runtime_suffix(meta_key: str) -> str:
    """ Transforms _xxx_yyy to XxxYyy """
    raw = meta_key.lstrip("_")
    parts = [p for p in raw.split("_") if p]
    return "".join(part[:1].upper() + part[1:] for part in parts)


def read_bilingual_block(value: object) -> dict[str, str | None]:
    """Return language values for supported languages, or None values if block is invalid."""
    if not isinstance(value, dict):
        return dict.fromkeys(LANGUAGES)

    return {lang: value.get(lang) if isinstance(value.get(lang), str) else None for lang in LANGUAGES}


def merge_base_entry(langs: dict[str, dict[str, str]], key: str, value: dict) -> None:
    for lang in LANGUAGES:
        val = value.get(lang)
        if isinstance(val, str):
            langs[lang][key] = val


def merge_metadata_entries(langs: dict[str, dict[str, str]], key: str, value: dict) -> None:
    for meta_key, meta_val in value.items():
        if not meta_key.startswith("_"):
            continue

        suffix = to_runtime_suffix(meta_key)
        if not suffix:
            continue

        meta_vals = read_bilingual_block(meta_val)
        for lang in LANGUAGES:
            if isinstance(meta_vals[lang], str):
                langs[lang][f"{key}{suffix}"] = meta_vals[lang]


def main() -> None:
    langs = {lang: {} for lang in LANGUAGES}

    if not AUTHORING_DATA.exists():
        raise FileNotFoundError(f"Authoring source folder not found: {AUTHORING_DATA}")

    # Merge all bilingual source files from src/locales/source/**
    for p in sorted(AUTHORING_DATA.rglob("*.json")):

        data = read_json(p)
        if not isinstance(data, dict):
            continue

        for key, value in data.items():
            if not isinstance(value, dict):
                continue
            merge_base_entry(langs, key, value)
            merge_metadata_entries(langs, key, value)

    # Write deterministic runtime files.
    OUT.mkdir(parents=True, exist_ok=True)
    ordered_locales = {lang: {k: langs[lang][k] for k in sorted(langs[lang].keys())} for lang in LANGUAGES}

    for lang in LANGUAGES:
        out_path = OUT / f"{lang}.json"
        out_path.write_text(json.dumps(ordered_locales[lang], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Built {out_path} ({len(ordered_locales[lang])} keys)")


if __name__ == "__main__":
    main()








