# Runtime Data - CSV to JSON Pipeline

This folder contains generated runtime data used by the React app.

## What Is This?

Game content is authored in CSV for easy editing (`data/sources/**`).
At build time, those CSV files are validated and compiled into JSON artifacts inside this folder.

The app imports JSON from this folder at runtime. It does not parse CSV in the browser.

## How It Works

1. Edit CSV files in `data/sources/`.
2. Validate source files.
3. Build JSON artifacts in `src/data/`.
4. App imports from `@/data`.

Pipeline:

```text
data/sources/*.csv -> validate:data:sources -> build:data -> src/data/*.json -> app runtime imports
```

## Folder Contents

- `*.json` - generated dataset files (`weapon.json`, `apparel.json`, etc.)
- `index.ts` - generated typed exports used by the app
- `../../data/manifests/data.json` - dataset -> CSV mapping used by data compiler
- `../../data/manifests/i18n.json` - CSV/JSON pairing and standalone locale JSON entries
- `README.md` - this file

## Rules

- Do not edit generated JSON files manually.
- Do not edit `index.ts` manually.
- Always edit CSV source files in `data/sources/`.
- Run validation before build.

## Commands

```zsh
# Validate data source CSV files
npm run validate:data:sources

# Build runtime JSON artifacts
npm run build:data

# Standard app build (runs data + locales pipelines first)
npm run build
```

## Typical Workflow

1. Update one or more CSV files in `data/sources/`.
2. Run `npm run validate:data:sources`.
3. Run `npm run build:data`.
4. Start dev server or build app.

## Error Examples

- `MISSING_CSV_FILE` - manifest references a CSV that does not exist
- `MISSING_ID_COLUMN` - CSV has no `ID` header
- `EMPTY_ID` - a row has empty `ID`
- `DUPLICATE_ID` - multiple rows share the same `ID` (latest wins)

Warnings are reported, errors fail the command.




