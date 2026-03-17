# Standardize Colors, Themes, and Project Structure — Checklist

## Phase 1: Theming and Color Hygiene
- [x] Create separate theme module: `src/styles/themes.css` (palettes + derived aliases)
- [x] Ensure styles are composed via `src/styles/index.css` in `main-react.tsx` (order: tokens → themes → base → components → features → styles)
- [x] Use canonical tokens only (no CSS var fallbacks across the repo)
- [x] Replace `--overlay-color` with `--shadow-color`
- [x] Use `rgba(from var(--token) r g b / xx)` for computed transparencies
- [x] Map "active/selected" UI to `var(--primary-color)` (not success)
- [x] Keep true success/failure to `--success-color` / `--failure-color`
- [x] Clarify in `tokens.css` that semantic color defaults may be overridden by themes
- [x] Inline `#loader { display: flex }` and remove `--loader-display` from `:root`

## Phase 2: Small Safe Refactors
- [x] Consolidate theme utils in `src/theme/themeUtils.ts` (THEMES, getCurrentTheme, applyTheme)
- [x] Update imports to `@/theme/themeUtils` (e.g., `main-react.tsx`, `SettingsTab.tsx`)
- [x] Remove bridge files: `src/theme/applyTheme.ts`, `src/app/tabs/settings/utils/themeUtils.ts`
- [x] Add `src/services/GameDataRepository.ts` re-export to fix typo gradually
- [x] Update imports to use `GameDataRepository` (then remove old `GameDataRepostory.ts`)

## Phase 3: Styles Organization (Optional, incremental)
- [ ] Split `styles.css` into:
  - [x] `tokens.css` (root non-theme tokens) and import it before themes/styles
  - [x] `base.css` (html/body/base elements)
  - [x] `components.css` (reusable UI patterns)
  - [x] `features/*.css` (feature-specific, if needed)
- [x] Import via a single `styles/index.css` to preserve order

## Phase 4: Structure and Barrels
- [x] Introduce barrels for smoother imports:
  - [x] `src/components/index.ts`
  - [x] `src/hooks/index.ts`
  - [x] `src/services/index.ts`
- [x] Move popups UI out of `contexts/` into shared or feature folders
  
Guidelines:
- Keep barrels only at domain boundaries (components/, hooks/, services/) and per-feature roots
- Prefer explicit re-exports (`export { X } from './X'`) over `export *` for better tree-shaking and DX
- Avoid micro-barrels that only re-export one file unless they provide a stable public API boundary

## Phase 5: Feature-first Layout
- [x] Rename `src/app/tabs/*` → `src/features/*` with consistent layout:
  - [x] Preserve internal structure for now; follow-up to normalize `components/`, `hooks/`, `utils/`, `styles/` per feature as needed
  - [x] Export feature index for clean imports

## Phase 6: Follow-ups & QA
- [x] Replace remaining literal black rgba in gradients/shadows where appropriate with `--shadow-color`
- [ ] Visual QA: verify dice colors, shadows, and popups across themes
- [ ] Optional: add Stylelint rule to disallow black color literals (value-disallowed-list), exempt tokens.css if desired

