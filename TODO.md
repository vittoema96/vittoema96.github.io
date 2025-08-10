# TODO

# Main
- Fix close popup button position
- Fix d6popup layout (add bodyPart)
- Implement weapon property popups
- Refactor Display + Character (use #render())
- Implement notification popup
- Fix Unarmed "Weapon" by default

## Secondary
- Add current luck/ammo to d20/d6 popups
- d6 icons to have secondary color
- Fix card layout
- Finish templating cards
- Consumable items (maybe change icon?)
- There is something wrong in how cards scroll, check it out

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
- Remove navigation bar from viewport (mobile, non-PWA mode (what did i mean?????) )
- Uniform all icons (https://maskable.app/)
- In webmanifest add "form_factor: narrow/wide" to allow screenshots only for mobile or desktop (also implement desktop screenshots and improve screenshots in general)
- Adopt ES6 Modules
  1.  `_export async function functionName() {...}`
  2. `<script src="js/javascript_file.js" type="module">`
  3. `_import { functionName } from './javascript_file.js';`
- ...