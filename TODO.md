# TODO

# Main
- Implement qualityAccurate effect
- Implement choice for qualityThrown weapons

## Secondary
- Fix close popup button position
- Add body part to d6popup layout
- Add current luck/ammo to d20/d6 popups
- d6 icons to have secondary color
- Consumable items (maybe change icon?)
- Remove unrolled dice
 1. Make the change smoooth...
- Add Free rerolls display (to both d2 and d20)
- 

# Other TODOs 

## Weapons
- Implement mods on weapons

## Armor
- Implement armor dataset
- Implement VaultBoy image with body parts
- Implement armor inventory + equipping armor 
- Implement mods on armor

## Map
- Add map markers
- Add unlockable markers
- Add multiple map types
- General improvements...

## Data
- Add anything other than background textdata
  1. Allow loading of image.

## Language
- Remove english phrases in favor of dataLang
- Remove italian phrases in favor of dataLang
- Add english translations

### Other
- Serve images as webp instead of jpg
- Remove navigation bar from viewport (mobile, non-PWA mode (what did i mean?????) )
- Uniform all icons (https://maskable.app/)
- In webmanifest add "form_factor: narrow/wide" to allow screenshots only for mobile or desktop (also implement desktop screenshots and improve screenshots in general)


# AI TODOs

## Priority-Ordered Improvements

### 🔴 HIGH PRIORITY - Critical Modernization

1. **Adopt Modern JavaScript Module System (ES6 Modules)**
   - Currently using global variables and script tags
   - Should implement proper `import/export` statements
   - This will improve code organization, tree-shaking, and dependency management

2. **Implement a Build System**
   - Add a modern build tool (Vite, Webpack, or Parcel)
   - Enable code bundling, minification, and optimization
   - Automate asset optimization and cache busting

3. **Add Package Management**
   - Create `package.json` for dependency management
   - Replace CDN dependencies with npm packages for better version control
   - Currently using: PapaParse, PanZoom, Font Awesome via CDN

4. **Code Quality Tools**
   - Add ESLint for code linting
   - Add Prettier for code formatting
   - Implement TypeScript for better type safety

### 🟡 MEDIUM PRIORITY - Architecture & Performance

5. **Refactor Global State Management**
   - Replace global variables (`dataManager`, `translator`, `cardFactory`, etc.)
   - Implement a proper state management pattern (Redux-like or custom)
   - Better separation of concerns

6. **Improve Error Handling**
   - Add comprehensive try-catch blocks
   - Implement user-friendly error messages
   - Add fallback mechanisms for failed data loads

7. **Performance Optimizations**
   - Implement lazy loading for data files
   - Add image optimization (WebP format as noted in TODO)
   - Optimize CSS with PostCSS and autoprefixer

8. **Responsive Design Improvements**
   - Better desktop support (currently mobile-focused)
   - Implement proper breakpoints and container queries
   - Fix layout issues mentioned in README

### 🟢 MEDIUM-LOW PRIORITY - Features & UX

9. **Complete Internationalization**
   - Finish English translations (currently incomplete)
   - Remove hardcoded Italian text
   - Implement proper i18n system

10. **Accessibility Improvements**
    - Add proper ARIA labels and roles
    - Improve keyboard navigation
    - Ensure color contrast compliance
    - Add screen reader support

11. **Testing Infrastructure**
    - Add unit tests (Jest/Vitest)
    - Add integration tests
    - Add E2E tests (Playwright/Cypress)

### 🔵 LOW PRIORITY - Polish & Enhancement

12. **Code Organization**
    - Split large files into smaller, focused modules
    - Implement proper class inheritance patterns
    - Add JSDoc documentation

13. **PWA Enhancements**
    - Improve offline functionality
    - Add background sync capabilities
    - Implement push notifications for game sessions

14. **Security Improvements**
    - Add Content Security Policy (CSP)
    - Implement proper input validation
    - Sanitize user inputs

15. **Developer Experience**
    - Add hot reload for development
    - Implement source maps
    - Add development vs production configurations

## Immediate Next Steps

I'd recommend starting with:
1. **Setting up package.json and basic build tools**
2. **Converting to ES6 modules**
3. **Adding ESLint and Prettier**

Would you like me to help implement any of these improvements? I can start with the highest priority items like setting up the modern JavaScript toolchain and build system.