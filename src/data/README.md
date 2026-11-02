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

### Apparel mod compatibility

The modification popup reads each item's `AVAILABLE_MODS`. The Brotherhood bomber jacket
(`armorBrotherhoodBomberJacket`) supports all five ballistic weave ranks, following
Wanderers DLC, page 86. Its base statistics and the mods' crafting requirements are unchanged.

Wanderers underarmor linings (page 87) are shared by Underarmor and Marine Wetsuits.
Protective and Shielded replace the base Underarmor's shared STR/PER reroll allowance
of one use per scene with two uses, shown as a rule reminder on the apparel card;
the app does not track scene uses. Marine materials (pages 88-89) apply to all four
Marine armor pieces, including the helmet. Source weights use the existing 2 lb = 1 kg
scale; only torso material weight and cost double, not resistance bonuses.
Legion materials (page 88) apply to Recruit, Legionary, Centurion, and Legatus Helmet
pieces. They use the standard torso material rule: weight and cost double on torso
pieces, while resistance bonuses remain unchanged. The Wanderers Legion section does
not repeat this rule; this apparent source omission is tracked in TODO.md. Wood Armor pieces and
Shrouded (page 91) use the same source weight scale; Shrouded's torso weight and cost
are doubled. Its recipe uses Survival and Armorer 1; the manuals do not resolve whether
the crafting check pairs Survival with END or the workbench's usual INT.
For these mod CSVs, the legacy `RARITY` column carries crafting complexity, as used
by the modification tooltip; `RARITY_TO_FIND` separately records Common/Uncommon.

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
