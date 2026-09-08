# TODO & Project Status

## Developer Notes
Things to fix:
- FIRE_RATE is number | - ... can we do at least number | undefined?
- Don't allow same customName for 2 different CustomItems (customName is object ID)

## To check
- [ ] modFullStock == modFullStockEnergy? cost and effects seem to differ
- [ ] modFullStock == modFullStockM79?
- [ ] modMarksmanGrip == modMarksmanGripEnergy?
- [ ] modShortScope == modShortScopeEnergy?
- [ ] modShortNightVisionScope == modShortNightVisionScopeEnergy?
- [ ] modReconScope == modReconScopeEnergy?
- [ ] modLongScope == modLongScopeEnergy?
- [ ] modLongNightVisionScope == modLongNightVisionScopeEnergy?
- [ ] modReflexSight == modReflexSightEnergy?
- [ ] modSpikedCane == modBarbedCane?
- [ ] modElectrified == modElectrifiedBlade?

# Data Validation
Data was imported using AI tools, actual values must be manually checked.
### Small Guns
- [x] Corebook
- [x] Wanderer DLC
- [x] Settlers DLC 
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
- [ ] TODO decide what to do with Tesla Rifle (present in 2 manuals)
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

## 🔥 High Priority
- [ ] **CryoJet** - Cryojet is a robot only weapon, should not be visible to normal users

### Game Features
- [ ] **qualityAccurate effect** - Implement accurate weapon quality
- [ ] **Weapon mods** - Finish implementing mods (some effects currently do nothing) 
- [ ] **Consumable items** - Proper aid item consumption mechanics
- [ ] **Traits** - Keep adding traits (some traits missing and some need implementation)
- [ ] **Perks** - Keep adding perks (some perks missing (dlc) and some need implementation)
- [ ] **Effects and Qualities** - Check that all Effects and Qualities are implemented (some may not be)

### UI/UX Fixes
- [ ] **Remove unrolled dice** - Make the change smooth

## 🎯 Medium Priority

### Armor System
- [ ] **Armor dataset** - Complete armor data implementation (names for synthetic pieces + power armor)

### Map System
- [ ] **Map markers** - Improve + add all markers
- [ ] **Multiple map types** - Different map variants
- [ ] **General map improvements** - Polish and features

## 🔮 Low Priority / Future

### Syringer ammo
Syringer does not have all ammo implemented

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
