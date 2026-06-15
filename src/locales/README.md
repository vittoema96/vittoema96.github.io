# Locales — Bilingual String Management

This folder manages all text in the app in two languages: **English** and **Italian**.

## What is This?

The app displays text to users. That text needs to be in English and Italian. This folder automates keeping both languages in sync and making it easy for developers to add or update strings.

## How It Works

1. **You write bilingual JSON** in `source/` folder
   - One key, two languages (en + it)
   - Optional metadata: description, benefits, penalties

2. **The build system validates** your JSON
   - Checks both languages exist
   - Checks nothing is empty
   - Checks all CSV references are covered

3. **The build system generates** flat JSON files
   - `en.json` and `it.json` (in this folder)
   - These are read by the React app at runtime
   - You never edit them directly

4. **React app uses the strings via i18next**
   - `i18next.t("perkAcrobat")` → shows the right language
   - No hardcoded strings in components

## The Folders

- `source/` — Where you work (edit these files)
  - `traits.json`, `perks.json`, `skills.json`, etc.
  - Bilingual format: one key, English + Italian
  
- `en.json`, `it.json` — Generated files (don't touch)
  - Created by the build script
  - Rebuilt every time you run `npm run build`

## Example

In `source/traits.json`:
```json
{
  "traitGhoulAgeless": {
    "en": "Ageless",
    "it": "Senza Eta",
    "_description": {
      "en": "You age at a greatly reduced rate and are likely older than your non-mutated companions (you may have even survived the Great War of 2077), but you are sterile.",
      "it": "Invecchi a un ritmo molto ridotto e probabilmente sei piu vecchio dei compagni non mutati (potresti persino essere sopravvissuto alla Grande Guerra del 2077), ma sei sterile."
    }
  }
}
```

After running `npm run build:locales`, this becomes in `it.json`:
```json
{
  "traitGhoulAgeless": "Senza Eta",
  "traitGhoulAgelessDescription": "Invecchi a un ritmo molto ridotto e probabilmente sei piu vecchio dei compagni non mutati (potresti persino essere sopravvissuto alla Grande Guerra del 2077), ma sei sterile."
}
```

And in React:
```typescript
const label = i18next.t("traitGhoulAgeless");
const desc = i18next.t("traitGhoulAgelessDescription");
```

## The Rules

- **Never edit `en.json` or `it.json`** — they're generated
- **Always use both languages** in source files
- **Always include a `_description`** for every entry
- **Run validation before pushing**
  ```zsh
  npm run validate:locales:sources
  ```
- **The build runs automatically**
  ```zsh
  npm run build
  ```

## Common Commands

```zsh
# Validate (check for errors)
npm run validate:locales:sources

# Build (generate en.json and it.json)
npm run build:locales

# Both (validation + build)
npm run build
```

## Metadata Fields

Any field starting with `_` becomes a separate key in the output:

- `_description` → `keyDescription`
- `_benefit` → `keyBenefit`
- `_penalty` → `keyPenalty`
- `_foo_bar` → `keyFooBar` (follow the pattern)

Each must have both `en` and `it`.

## What to Do When You Add a String

1. Open the right source file (e.g., `source/perks.json`)
2. Add your entry with both languages and at least `_description`
3. Run `npm run validate:locales:sources` — it should pass
4. Run `npm run build:locales` — it should generate the files
5. Commit only the `source/` JSON files, not the generated ones
6. Use the key in your React component with `i18next.t("key")`

## If Validation Fails

The error message tells you what's wrong:
- `MISSING_LANGUAGE_KEY: it` → Missing Italian translation
- `EMPTY_LANGUAGE_VALUE: en` → English is empty or null
- `INVALID_JSON` → Your JSON has syntax errors
- `PARTIAL_TRANSLATION_BLOCK` → `_description` has en but not it

Fix the error in `source/` and try again.

## CI/CD

GitHub Actions runs validation + build before deploying. If validation fails, the build is blocked and deploy aborted.




