# Locales Source

This folder is the source of truth for bilingual locale authoring.

## Input path used by build

- `src/locales/source/**`

## Output files generated at build time

- `src/locales/en.json`
- `src/locales/it.json`

## Data format

```json
{
  "someKey": {
    "en": "...",
    "it": "...",
    "_description": {
      "en": "...",
      "it": "..."
    },
    "_benefit": {
      "en": "...",
      "it": "..."
    },
    "_penalty": {
      "en": "...",
      "it": "..."
    }
  }
}
```

- Any metadata key that starts with `_` and has a bilingual block is expanded to
  `someKey` + `Suffix` in runtime locales.
- Suffix rule: remove leading `_`, split by `_`, uppercase each part, then join.
- Examples: `_description` -> `Description`, `_benefit` -> `Benefit`, `_foo_bar` -> `FooBar`.

## Build command

```zsh
npm run build:locales
```

`npm run build` runs locale generation automatically via `prebuild`.

