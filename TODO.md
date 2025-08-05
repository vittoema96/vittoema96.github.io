# TODO

# Main
- Finish fixing svgs for themes (gear, gear-luck and attack)
- Implement multiple items of the same type
- Consumable items (maybe change icon?)
- There is something wrong in how cards scroll, check it out
## D6Popup
- Implement ammo (in inventory) 
- Add Ammo/AP/Luck displays and checks for D6Popup
- ...
## Armor
- Implement armor dataset
- Implement VaultBoy image with body parts
- Implement armor inventory + equipping armor 
- Implement mods on armor
## Weapons
- Implement mods on weapons
- Add Unarmed "Weapon" by default

## Map
- Add map markers
- Add unlockable markers
- Add multiple map types
- General improvements...

## Data
- Add anything other than background textdata

## Language
- Remove english phrases in favor of dataLang
- Remove italian phrases in favor of dataLang
- Add english translations

### Other
- Implement popup with weapon tags description 
- Remove navigation bar from viewport (mobile, non-PWA mode)
- Uniform all icons (https://maskable.app/)
- In webmanifest add "form_factor: narrow/wide" to allow screenshots only for mobile or desktop (also implement desktop screenshots and improve screenshots in general)
- Implement templates in html instead of directly in app.js
  1. `<template id="generic-card-template">`
  2. ```
     function createGenericCard(genericItem, customCardContent, itemType) {
        if (!genericItem) { /* ... */ }

        const template = document.getElementById('generic-card-template');
        const cardDiv = template.content.cloneNode(true).firstElementChild;

        cardDiv.dataset.itemId = genericItem.ID;
        cardDiv.dataset.itemType = itemType;

        cardDiv.querySelector('.card-name').dataset.langId = genericItem.ID;
        ...
     ```
- Adopt ES6 Modules
  1.  `_export async function functionName() {...}`
  2. `<script src="js/javascript_file.js" type="module">`
  3. `_import { functionName } from './javascript_file.js';`
- ...