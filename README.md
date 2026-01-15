# General warnings:

> # ⚠️ Fan Project ⚠️
> I'm an inexperienced Programmer / Game master and a forever Fallout fan.
> This is a fan project made:
> - Mainly for my group
> - By a non-native english speaker
> - To learn stuff: there may be bugs, shitty code, etc.
> - By only me, in my free time, so updates may be frequent or stop altogether.

> # ⚠️ **WORK IN PROGRESS** ⚠️
>
> This project is currently under active development. Many features are incomplete, and you may encounter bugs.
>
> It has not been tested on all devices or screen sizes. It is primarily designed for mobile devices and tested on a screen size of approximately **412x915px** (though generally any "normal" mobile device should be ok and desktop "should" work, but it still has some funky layouts).



# Pip-Boy 3000 - PWA Companion App

![Pip-Boy 3000](https://vittoema96.github.io/img/icons/512x512.png)

A responsive, installable Progressive Web App (PWA) designed as a companion for the Fallout-themed tabletop RPG. This app allows players to manage their character's stats, skills, inventory, and perform dice rolls directly from their browser or installed on their device.

The interface is heavily inspired by the iconic Pip-Boy 3000 from the Fallout series, featuring FO3 and FNV themes to match your favorite game.

---

## ✨ Features

* **Modern React Architecture:** Built with React 18 and hooks for optimal performance and maintainability.
* **PWA Ready:** Fully installable on desktop and mobile devices for an app-like experience, including offline support.
* **Character Stat Management:**
    * Track S.P.E.C.I.A.L. attributes with reactive updates.
    * Automatically calculates derived stats like Defense, Initiative, and Melee Damage.
    * View and manage all character skills (including specialties).
    * Persistent character data saved to localStorage.
* **Comprehensive Inventory System:**
    * Organize items into categories: Weapons, Armor, Supplies, and Ammo.
    * Interactive accordion-style inventory with expandable cards.
    * Long-press to sell/delete items with confirmation dialogs.
    * Smart equipment system with layer conflict detection.
* **Integrated Dice Roller:**
    * **d20 Skill Checks:** Dedicated popup for skill checks with automatic target number calculation.
    * **d6 Damage Rolls:** Weapon damage rolls with support for extra hits and damage effects.
    * Luck point system for rerolls and bonuses.
* **Interactive Map:** Zoomable and pannable New Vegas world map (locations coming soon).
* **Customization & Settings:**
    * **Theming:** Switch between Fallout 3 (green) and New Vegas (amber) themes.
    * **Localization:** Full i18n support (Italian and English).
    * **Data Management:** Export/import character data as JSON, reset to defaults.
* **Themed UI:** Retro CRT-style interface with scan lines, boot-up animation, and authentic Fallout aesthetics.

---

## 📸 Screenshots

|                                   **STAT Screen**                                   |                                 **INV - Weapons**                                 |
|:-----------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------:|
|            ![Stats Tab](https://vittoema96.github.io/docs/stat_tab.jpg)             | ![Inventory Tab - Weapons](https://vittoema96.github.io/docs/inv_tab_weapons.jpg) |
|                                 **INV - Supplies**                                  |                                **New Vegas Theme**                                |
| ![Inventory Tab - Supplies](https://vittoema96.github.io/docs/inv_tab_supplies.jpg) |     ![New Vegas Theme](https://vittoema96.github.io/docs/new_vegas_theme.jpg)     |

---

## 📝 Usage

* **Navigate Tabs:** Use the main tabs (STAT, INV, DATA, MAP) to switch between screens.
* **Change Themes/Language:** Go to the Settings tab (the gear icon) to customize your experience.
* **Add Items:** In the INV tab, click the `+` button next to a category header to open a modal and add items to your inventory.
* **Perform a Skill Check:** On the STAT screen, click on a skill to open the d20 dice roller.
* **Roll for Damage:** In your inventory, click the crosshair icon on a weapon card to open the d6 damage roller.

---

## 📲 PWA Installation

This application is an installable PWA.

* **On Desktop (Chrome/Edge):** An "Install" icon will appear in the address bar. Click it to add the app to your desktop.
* **On Mobile (Android/iOS):** Use your browser's menu and select "Add to Home Screen" or "Install App" to get a native-like app experience.

---

## 🛠️ Development

If you want to mess with the code (good luck lol):

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm run quality  # Check code quality (lint + format + types)
```

**Version management** (because I got fancy with semantic versioning):
```bash
npm run version:show        # Show current version
npm run version:next-alpha  # Bump to next alpha milestone
```

## 🏗️ How it's built

**Tech stack**: React 18, Vite, i18next, PapaParse
**Structure**:
```
src/
├── components/      # React components (tabs, inventory, popups, etc.)
├── contexts/        # React contexts (Character, Popup, Tooltip)
├── hooks/           # Custom React hooks (useI18n, useDataManager, etc.)
├── js/              # Shared utilities (constants, gameRules, i18n)
├── locales/         # i18n translation files (en.json, it.json)
├── styles/          # CSS styles
└── utils/           # Utility functions (itemUtils, etc.)

public/
├── data/            # Game data in CSV files
└── img/             # Images and icons
```

**Key architecture**:
- **React Components**: Modular UI components with hooks
- **Context API**: Global state management (character, popups, tooltips)
- **Custom Hooks**: Reusable logic (data loading, i18n, inventory actions)
- **CSV Data**: Game content loaded dynamically with PapaParse

## 🎲 Game mechanics

Implements proper Fallout 2d20 rules:
- **D20 rolls**: Skill + SPECIAL vs difficulty, count successes
- **D6 damage**: Multiple dice, reroll 1s and 2s, count effects/damage
- **Combat**: Attack rolls consume ammo, armor reduces damage
- **Character origins**: Different stat caps (Super Mutants, etc.)

## 📊 Data format

Game data is in CSV files for easy editing:
- `public/data/weapon/` - Weapons with damage, range, ammo type
- `public/data/apparel/` - Armor with DR values and protection areas
- `public/data/aid/` - Consumables with effects

## 📈 Versioning

Uses semantic versioning: `0.0.3-alpha.0`
- `0.0.x` = Alpha milestone (patch = milestone number)
- `0.1.0` = Beta phase
- `1.0.0` = Stable release

GitHub Actions automatically increments build numbers on deploy.

## 🤝 Contributing

Just follow the existing code style. Run `npm run quality` to check everything is good.

See [TODO.md](TODO.md) for what needs to be done.