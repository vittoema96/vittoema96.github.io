# TODO & Project Status

## Developer Notes
Things to fix:
- FIRE_RATE is number | - ... can we do at least number | undefined?
- Don't allow same customName for 2 different CustomItems (customName is object ID)
- modLargeMagazine requires either perkGunNut 1 or 2 (different values on different tables)
- `type-check` still reports pre-existing generated-data/schema typing issues; keep separate from the data audit.

## To check
- [x] Confirm mod IDs are unique across the source catalog. Similar names remain distinct where the manuals or item compatibility make them distinct.
- [x] Confirmed `modFlashHider` and `modMuzzleBreak` represent the same manual mod. The obsolete ID was removed and existing saves migrate idempotently to `modMuzzleBreak`.
- [ ] Reconcile the remaining same-name/different-item pairs below against each manual and document whether they are intentionally distinct:
  - `modFullStock` / `modFullStockEnergy`
  - `modFullStock` / `modFullStockM79`
  - `modMarksmanGrip` / `modMarksmanGripEnergy`
  - `modShortScope` / `modShortScopeEnergy`
  - `modShortNightVisionScope` / `modShortNightVisionScopeEnergy`
  - `modReconScope` / `modReconScopeEnergy`
  - `modLongScope` / `modLongScopeEnergy`
  - `modLongNightVisionScope` / `modLongNightVisionScopeEnergy`
  - `modReflexSight` / `modReflexSightEnergy`
  - `modSpikedCane` / `modBarbedCane`
  - `modElectrified` / `modElectrifiedBlade`

# Data Validation

Official errata (Errata Log V6, 2026) are applied and take precedence over the manuals: see `docs/errata-applied.md` before reverting a value that differs from a guidebook.
Data was imported using AI tools, so values remain subject to manual guidebook verification.
### Small Guns
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC 
- [ ] Verify the placeholder descriptions, mod availability/effects, rarity, `RARITY_TO_FIND`, and ammo type for these New Vegas DLC items against the physical manual: `.45 Auto Pistol`, `.45 Auto SMG`, `10mm SMG`, `9mm SMG`, `Brush Gun`, `Caravan Shotgun`, `Lever-Action Shotgun`, `Marksman Carbine`, `Pump-Action Grenade Launcher`, `Ranger Sequoia`, `Riot Shotgun`, `Service Rifle`, `Silenced .22 Pistol`, `Single Shotgun`, `Trail Carbine`, `Varmint Rifle`, and `.22 Ammo`.
- [ ] TODO decide what to do about Smoke Claw
- [ ] TODO decide what to do with MrHandy's Automatic 10mm
### Big Guns
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC
- [ ] TODO decide what to do with MrHandy's Flamethrower
### Energy Weapons
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC
- [ ] TODO decide what to do with MrHandy's Laser Emitter
- [ ] TODO decide what to do with Assaultron Head (present in 2 manuals, currently -1DC, +1FR)
- [x] Tesla Rifle (present in 2 manuals): uses Wanderers stats, documented in README
### Melee Weapons
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC (No weapons except for Automatron's)
- [ ] TODO aluminum bat should install mods only with Blacksmith 1
- [ ] TODO decide what to do with MrHandy's Pliers and Circular Saw
- [ ] TODO decide what to do with Automatron's Weapons (Settlers DLC)
- [ ] TODO decide what to do with mod and unacquirable weapons
### Throwing Weapons
- [x] Corebook
- [x] Wanderer DLC (No weapons)
- [x] Settlers DLC (No weapons)
### Explosives
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC (No weapons)
- [ ] TODO Detonator, Flash Bang and Smoke Granade should be Special DC and not 0
- [ ] TODO Flash bang wrong effect, detonator wrong range
- [ ] TODO check ammo type for detonator
### Bows
- [x] Corebook (No weapons)
- [x] Wanderer DLC
- [x] Settlers DLC (No weapons)

## Mods
The source catalog has been audited in stages. A checked category means names, values, availability, IDs and guidebook references were reviewed; it does not mean every rule effect is implemented in the application.

- [x] Corebook mods: small guns, energy weapons and melee weapons
- [x] Royal Flush melee mods
- [x] Corebook robot armor and module catalog, including robot-part availability and duplicate-reference checks
- [ ] Complete the manual audit of all apparel mods outside robot parts
- [ ] Complete the manual audit of explosive, big-gun and remaining DLC mod values and availability

- [x] **Wanderers Legion and Wood materials** - Added the source-backed Legion and Wood pieces/materials. Legion torso materials currently use the same weight/cost multiplier as other torso material mods, following the general Corebook rule. Wanderers p. 88 does not repeat that clause for Legion Armor; verify whether this is an editorial omission or an intentional exception. The Survival SPECIAL pairing remains unresolved.

- [x] **Royal Flush weapon mods** - Added source-backed CSV definitions and bilingual localization for `modSpikedPuncturing` (Golf Club, Weighted Rubber Chicken), `modBladedSharp` (Golf Club, Juggling Pin), `modHeavyClub` (Golf Club), `modExtraWeighty` (Weighted Rubber Chicken), and `modPartyFavor` (Juggling Pin). Party Favor now changes the calculated weapon category to Explosives and adds Blast/Thrown.

- [x] **Missing mod availability** - Added the Corebook Muzzle Break definition and exposed the existing Hacking Module and Shadowed Metal Robot definitions on the robot body, eliminating unresolved `AVAILABLE_MODS` references.

- [x] **Robot names and descriptions** - English names and narrative descriptions were aligned with the English Corebook. Italian names/descriptions were checked against `Corebook ITA.md` and preserved where the Italian manual uses different terminology.

- [x] **Mod weights** - Newly added/changed English-manual weights use the project's halved-weight convention.

- [x] **Saved-character compatibility** - Added the Flash Hider → Muzzle Break migration without changing stable IDs for the other existing mods.

- [ ] **Unsupported mod effects** - `meleeResAdd`, `explosiveResAdd`, `fallDamageResAdd`, and `unarmedDamageAdd` remain explicit source effects but need dedicated character schema/calculation fields. Robot effects such as `effectActivationArms`, `effectActivationThrusters`, `effectAimDamageBonus`, `effectHydraulic`, `effectKnurled`, `effectMeleeBonusAP`, `effectPersistentImmunity`, `effectStunResistance`, and `effectVoltaic` are retained/displayed as tokens but do not yet have complete gameplay consumers.

- [ ] **Robot effect model** - Before implementation, define separate semantics for item-local effects, part-conditional effects, robot-wide aggregate effects, auras, attack-context rules and turn/scene rules. Decide whether unsupported rules should use localized `_effect` text and/or a typed capability model rather than unrestricted `ifArms:` strings.

## 🔥 High Priority
- [ ] **CryoJet** - Cryojet is a robot only weapon, should not be visible to normal users

### Game Features
- [ ] **qualityAccurate effect** - Implement accurate weapon quality
- [ ] **Weapon mods** - Finish implementing mods (some effects currently do nothing) 
- [ ] **Consumable items** - Proper aid item consumption mechanics
- [ ] **Traits** - Keep adding traits (some traits missing and some need implementation)
- [ ] **Poison rules integration** - Decide how poison immunity and level-scaled poison resistance should be represented in damage calculations and exposed in the character UI. `hasPoisonImmunity` and `poisonResistance` currently have no complete consumer path. Apparel and legendaries that give Poison DR (e.g. Poisoner's armor, +4 Poison DR, currently written as the non-existent `drPoisonAdd:4`) need a poison DR operation and must add to the character's poison resistance.
- [ ] **Incomplete origin trait mechanics** - Implement the remaining rules for Hidden & Hunted (supply caches, identity exposure, faction hostility, and bounty hunters), Trying to Make a Difference (Speech rerolls, intimidation difficulty, and non-lethal/Luck rules), The Winding Way of the Great Snake (poison crafting), Come Rain or Shine (travel AP and complications), and Part of the Family (family selection and family-specific benefits)
- [ ] **Perks** - Keep adding perks (some perks missing (dlc) and some need implementation)
- [ ] **Effects and Qualities** - Check that all Effects and Qualities are implemented (some may not be)

### UI/UX Fixes
- [ ] **Remove unrolled dice** - Make the change smooth
- [ ] **Weight unit setting** - Add a persisted kg/lb setting and format all weight values, inputs, calculations, and localized descriptions consistently. Decide whether to use real conversion (1 kg = 2.20462 lb) or the game's current 2:1 weight scale before implementation.

## 🎯 Medium Priority

### Armor System
- [ ] **Armor dataset** - Complete armor data implementation (names for synthetic pieces + power armor)
- [ ] **Robot apparel rules audit** - Verify remaining origin-specific anatomy and armor restrictions against the manuals, particularly for robot origins other than Mr. Handy. Intrinsic parts are already non-removable, hidden without clearing their saved configuration after an origin change, and normalized to equipped when active.

### Map System
- [ ] **Map markers** - Improve + add all markers
- [ ] **Non-Mojave locations** - Complete and verify Commonwealth marker coordinates, add Capital Wasteland locations, and enable region-specific location unlocking once those datasets are ready. Non-Mojave unlocking is intentionally unavailable for now.
- [x] **Reactive map-region settings** - Share persisted settings through `useSyncExternalStore` so mounted maps and region selectors react to same-window and cross-window changes without duplicating settings state. Keep the map and unlock controls within a non-scrolling panel.
- [ ] **General map improvements** - Polish and features

## 🔮 Low Priority / Future

### Syringer ammo
Syringer does not have all ammo implemented. The Corebook lists 9 Syringer rounds with full stats and official IT names: add them to `data/sources/other/ammo.*`.

### Special qualities (`qualitySpecial*`)
New Vegas specials are shown as text-only qualities: Figaro, Maria, Golden Gloves, Greased Lightning, Riot Gear helmet, Boomer Jumpsuit, Great Khan Armor, Powder Ganger Outfit. Their rules are readable in the tag tooltip, but the effects are not applied automatically yet: implement them.

### Mods pass: text vs EFFECTS mismatches (found 2026-11-28)
Still open (manual references in brackets):
- `modTurbo`: `effectTurbo` (+2 CD per AP instead of +1) has a tooltip but is not applied to damage yet.
- `legendaryPoisonerArmor`: see Poison rules integration.
- Raider armor materials Welded/Annealed/Tempered/Hardened vs manual Welded/Tempered/Hardened/Buttressed [Corebook 8231-8234].

Intended, do not change: Laser Musket and Assaultron capacitors (`fireRateAdd`), Burst on the Wanderers automatic receivers (errata), Two-Handed on the Full Stock (errata).

### Shredder damage
The Shredder deals damage equal to the minigun's Fire Rate, which mods can change. `weaponShredder` has a fixed 5 CD (the base minigun Fire Rate): derive it from the host weapon's modified Fire Rate in code.

### Rare perks (Wanderers DLC)
The Wanderers DLC "Rare book" / "Rare perk" perks (Ammo Factory, Blood Sacrifice!, Detonation Contagion, What Rads? and the others from the rare perks chapter) are not in the data yet. They need a requirement type for "rare book / rare perk" before they can be added.

### Polish & Enhancement
- [ ] **Image optimization** - Serve images as WebP instead of JPG
- [ ] **Icon uniformity** - Make all icons uniform (https://maskable.app/)
- [ ] **Desktop screenshots** - Add desktop PWA screenshots
- [ ] **Form factor** - Add "form_factor: narrow/wide" to manifest for mobile/desktop screenshots
- [ ] **Navigation bar** - Remove from viewport in mobile non-PWA mode (?)

### Language & Accessibility
- [ ] **Complete English translations** - Finish incomplete translations
- [ ] **Remove hardcoded text** - Any remaining Italian/English phrases
- [ ] **Keyboard navigation** - Full keyboard support

### Advanced Features
- [ ] **Character progression** - Leveling system, perk selection
- [ ] **Campaign management** - Multiple campaigns/sessions
- [ ] **Statistics tracking** - Roll history, character stats
