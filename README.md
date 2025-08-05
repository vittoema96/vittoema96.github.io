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

 
> ## ⚠️ AI generated README ⚠️
> As stated above, this is a WIP, I didn't care to write a REAL readme lol.
> When done developing I may write one (or not, don't expect anything from me hahaha)



# Pip-Boy 3000 - PWA Companion App

![Pip-Boy 3000](https://vittoema96.github.io/img/icons/512x512.png)

A responsive, installable Progressive Web App (PWA) designed as a companion for the Fallout-themed tabletop RPG. This app allows players to manage their character's stats, skills, inventory, and perform dice rolls directly from their browser or installed on their device.

The interface is heavily inspired by the iconic Pip-Boy 3000 from the Fallout series, featuring FO3 and FNV themes to match your favorite game.

---

## ✨ Features

* **PWA Ready:** Fully installable on desktop and mobile devices for an app-like experience, including offline support.
* **Character Stat Management:**
    * Track S.P.E.C.I.A.L. attributes.
    * Automatically calculates derived stats like Defense, Initiative, and Melee Damage.
    * View and manage all character skills (including specialties).
* **Comprehensive Inventory System:**
    * Organize items into categories: Weapons, Armor, Supplies, and Ammo.
    * Items are displayed on interactive cards showing stats, effects, cost, and weight.
    * Add or remove items from your inventory.
* **Integrated Dice Roller:**
    * **d20 Skill Checks:** A dedicated popup to handle skill checks, calculating target numbers based on skills and S.P.E.C.I.A.L. attributes.
    * **d6 Damage Rolls:** A popup to roll for weapon damage, including support for extra hits and damage effects.
* **Interactive Map:** A zoomable and pannable world map for your adventures (ONLY New Vegas Map, no locations yet).
* **Customization & Settings:**
    * **Theming:** Switch between the classic green "Fallout 3" theme and the amber "Fallout: New Vegas" theme.
    * **Localization:** Support for multiple languages (currently English [badly supported] and Italian [default]).
    * **Data Management:** Easily clear all character data from local storage to start fresh.
* **Themed UI:** A retro, CRT-style interface complete with scan lines, a boot-up animation, and thematic sound effects to immerse you in the Fallout universe.

---

## 📸 Screenshots

| STAT Screen | INV - Weapons |
| :---: | :---: |
| ![Stats Tab](https://vittoema96.github.io/docs/stat_tab.jpg) | ![Inventory Tab - Weapons](https://vittoema96.github.io/docs/inv_tab_weapons.jpg) |
| **INV - Supplies** | **New Vegas Theme** |
| ![Inventory Tab - Supplies](https://vittoema96.github.io/docs/inv_tab_supplies.jpg) | ![New Vegas Theme](https://vittoema96.github.io/docs/new_vegas_theme.jpg) |

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