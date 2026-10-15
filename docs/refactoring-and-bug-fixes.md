# Refactoring and bug fixes: a maintainer's guide

**Snapshot: 2026-10-15.** This explains the character/feat refactoring and the related fixes, including the local-only commit and the uncommitted changes that followed it.

Git status and hashes below describe the snapshot **before committing and integrating the phone changes**, not the expected repository state afterward. A rebase can change the unpublished commit hashes without changing the implementation described here.

This is a walkthrough for maintaining the project, not a proposal for another rewrite. Examples explain the current implementation; the sections on limitations explicitly identify what it does **not** solve.

## Reading map

- [1. What work this document covers](#1-what-work-this-document-covers)
- [2. The main idea](#2-the-main-idea)
- [3. Who is responsible for what](#3-who-is-responsible-for-what)
- [4. Loading, editing, calculating, and HP](#4-loading-editing-calculating-and-hp)
- [5. How the feat system works](#5-how-the-feat-system-works)
- [6. Origins and character calculations](#6-origins-and-character-calculations)
- [7. Saved inventory, grants, and virtual attacks](#7-saved-inventory-grants-and-virtual-attacks)
- [8. Preparing weapons and applying bonuses](#8-preparing-weapons-and-applying-bonuses)
- [9. Editing inventory without losing other changes](#9-editing-inventory-without-losing-other-changes)
- [10. Ammunition, dice, and closing popups](#10-ammunition-dice-and-closing-popups)
- [11. Companion updates](#11-companion-updates)
- [12. Bug-fix reference](#12-bug-fix-reference)
- [13. Tests and what they actually prove](#13-tests-and-what-they-actually-prove)
- [14. How to extend the code now](#14-how-to-extend-the-code-now)
- [15. What remains imperfect or unfinished](#15-what-remains-imperfect-or-unfinished)
- [16. File map and terminology](#16-file-map-and-terminology)

## 1. What work this document covers

Git has three relevant layers here:

| Layer             | Snapshot                                                                      | Meaning                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared ancestor   | `27d5285da2c529e087b9cddbdc731bdda9146664`                                    | The starting point shared by local `main` and the locally recorded `origin/main`.                                                                     |
| Committed locally | `37662a184018835f46fbcde897b2a4c38b5549e2` - **More centralization of Feats** | One commit on local `main` that is not in the recorded upstream history. It began moving scattered rules into feat implementations.                   |
| Working tree      | Staged, unstaged, and relevant untracked files after that commit              | The origin/feat reorganization, character-state boundaries, persistent grants, fixes discovered during review, simplifications, and regression tests. |

At this snapshot, local `main` is **ahead by one commit and behind by three** relative to the local `origin/main` reference. The remote-only commits concern Thermic Lance data and an armor-side assignment fix. They are not local changes authored by this refactoring.

No fetch, merge, rebase, commit, or push was performed to write this guide. These statements describe the available remote-tracking reference, not a fresh query of GitHub.

This distinction matters: `git diff origin/main` would mix our work with the absence of those remote-only changes. It is not a clean explanation of this refactor.

Useful read-only commands are:

```bash
git log --oneline origin/main..HEAD   # local-only commits
git log --oneline HEAD..origin/main   # remote-only commits
git diff HEAD                       # tracked uncommitted changes
git diff --cached                   # the staged subset
git ls-files --others --exclude-standard
```

The last command is important: **new untracked files do not appear in `git diff HEAD`**. Many replacement modules and the two test scripts are currently untracked.

There is also an intermediate staged rename from `feats/index.ts` to `feats/feats.ts`, followed by deletion of `feats/feats.ts` in the working tree. The intended final architecture uses `types.ts`, `registry.ts`, and `rules.ts`; the deleted intermediate file is not a missing engine that should be restored.

### The sequence of work

1. **Centralize rules.** The local commit moved many hardcoded perk/trait checks into shared capabilities.
2. **Separate responsibilities.** Subsequent work separated character loading, edits, calculations, inventory projections, and React adapters.
3. **Make grants real saved objects.** Feat weapons stopped being temporary objects recreated by inventory UI code.
4. **Audit the interactions.** Reviews and browser reproduction exposed problems in companion editing, self-ammunition, and deferred popup payments. These were corrected.
5. **Simplify the touched areas.** Repeated currency and companion updates were consolidated, and rank helpers were detached from heavier selection modules.

Not every new implementation file represents a new gameplay feature. Several contain rules that already existed elsewhere.

The untracked `plan-centralizeFeatsDiceAndCharacterContext.prompt.md` describes a broader possible direction. Its proposed dice-session reducer, new session hook, and extensive popup decomposition were **not** implemented by this work. A plan is not evidence that the planned architecture exists.

## 2. The main idea

**Save the player's choices and editable state. Calculate the consequences. Apply changes through one consistent update path.**

For example:

- Save which perks the player selected, not a permanently modified copy of every affected weapon.
- Save a granted weapon's name and mods, because the player can edit them.
- Calculate whether that granted weapon is currently available.
- Calculate Vicious from Iron Fist's current rank instead of adding a permanent receiver mod to simulate it.
- Display gun-bash attacks without saving extra physical weapons.

The old implementation mixed these responsibilities across Context, calculation hooks, item utilities, inventory components, and dice popups. A rule could be correct in one place and missing or duplicated in another.

The refactor does not remove the complexity of the game rules. It gives that complexity more predictable places to live.

## 3. Who is responsible for what

### The important files

| File                                                               | Responsibility                                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CharacterContext.tsx`](../src/app/contexts/CharacterContext.tsx) | Make the current raw save, calculated view, and actions available to React. Memoize calculation.                                                                 |
| [`useSaveStore.ts`](../src/hooks/useSaveStore.ts)                  | Own save slots, active-slot changes, persistence, import/reset, and execution of updates against the latest save.                                                |
| [`character/update.ts`](../src/features/character/update.ts)       | Define loading versus editing, merge supported patches, apply HP transition rules, reconcile persistent items, and construct companion updaters.                 |
| [`character/calculate.ts`](../src/features/character/calculate.ts) | Turn a raw save into the character view used by the UI. It does not save its result.                                                                             |
| [`character/items.ts`](../src/features/character/items.ts)         | Reconcile grants, select active physical items, project virtual attacks, prepare character-aware item data, and provide pure inventory/ammo/currency operations. |
| [`useItemManagement.ts`](../src/app/contexts/useItemManagement.ts) | Adapt item operations to React's character update API.                                                                                                           |
| [`feats/`](../src/features/character/feats)                        | Declare and combine origin/perk/trait behavior.                                                                                                                  |
| [`origins/`](../src/features/character/origins)                    | Describe individual origins and discover them through a registry.                                                                                                |
| [`characterSchemas.ts`](../src/schemas/characterSchemas.ts)        | Validate save shapes, supply defaults, and retain targeted compatibility transformations.                                                                        |

### The update path

```text
UI event
  -> updateCharacter(patch or updater)
  -> store reads the latest active RawCharacter
  -> applyUpdate(previous, patch)
       -> merge supported nested fields
       -> validate with Zod
       -> apply HP transition policy
       -> reconcile saved grants and robot parts
  -> store persists the resulting RawCharacter
  -> Context memoizes calculateCharacter(raw)
  -> React renders the calculated Character
```

Loading takes a different path:

```text
Import / saved slot / rehydration
  -> loadCharacter(input)
       -> validate and migrate
       -> reconcile persistent items
  -> store holds the raw character
  -> calculateCharacter(raw)
```

Previously, Context itself performed substantial merging, HP adjustment, and origin-related equipment changes. That made React's provider part of the rules implementation. Store operations such as import were a separate route.

Now Context delegates those rules. A domain test can exercise them without mounting React. Removing `useCalculatedCharacter.ts` did not remove calculation: its useful logic became the plain `calculateCharacter` function, with `useMemo` remaining in the React adapter.

**Pure** here means that a function produces a result without writing storage, opening a popup, or changing its input. These functions still read the application's game definitions; purity does not mean every possible dependency is passed as an argument.

## 4. Loading, editing, calculating, and HP

These are three different operations:

| Operation                      | Purpose                                             | May grant HP from a maximum-HP increase?                    |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------- |
| `loadCharacter(input)`         | Accept and normalize an existing save.              | No. Loading is not a gameplay transition.                   |
| `applyUpdate(previous, patch)` | Apply an intentional edit to an existing character. | Yes, according to the transition policy below.              |
| `calculateCharacter(raw)`      | Build a display/calculation view.                   | No persisted healing. It derives display values and limits. |

Loading can still add a missing required grant through reconciliation. "No transition healing" does not mean "return the input byte-for-byte unchanged."

### Patches are not whole-character replacements

A patch contains the fields being changed:

```ts
updateCharacter({ name: 'Mojave Courier' });
updateCharacter({ special: { strength: 7 } });
```

`CharacterUpdate` explicitly supports partial `special` and `skills` maps. `applyUpdate` also merges the companion map so editing one companion does not discard the others.

This is **not a generic deep merge**. A supplied companion value must preserve the companion fields that are not changing; `updateCompanion` handles that. Arrays such as `items` are replacement values when supplied.

A missing property and a property explicitly set to `undefined` are not interchangeable. Supplied values are processed by the schema. In particular, HP edits are identified by the presence of `currentHp` in the patch: `{ currentHp: undefined }` is not an appropriate way to say "leave HP alone."

### Use an updater when the result depends on existing state

```ts
updateCharacter(prev => ({ caps: prev.caps + 10 }));
```

The function is called inside the store's update against its current state. It is not evaluated from the character object captured by an earlier render.

Imagine two additions starting from 100 caps. Two patches built from the same old value can both write 110. Two functional updates read 100 and then 110, producing 120.

This is a **lost update** problem, not necessarily a multithreading problem. React renders and deferred callbacks are enough to create it.

### The HP policy

[`hp.ts`](../src/features/character/hp.ts) applies these rules to edits:

- If maximum HP increases, add the positive difference to current HP.
- If maximum HP decreases, do not subtract the difference as damage; only clamp current HP if it exceeds the new maximum.
- If the patch explicitly edits current HP, respect that edit, subject to the upper limit.
- Determine old and new maxima using the corresponding origins and effective, requirement-valid feats.

For example, going from maximum 20/current 8 to maximum 25 grants 5 HP, resulting in 13. Going from maximum 25/current 8 to maximum 20 leaves current HP at 8.

An uninitialized previous HP value uses the **previous** maximum as its transition baseline. Using the new maximum there would risk counting an increase twice.

Radiation is applied when calculating the view: visible current HP is limited by `maxHp - cappedRads`. This is separate from the edit-time maximum-HP delta. The refactor did not redesign radiation as a new persistent HP system.

Importing, opening a slot, rehydrating, or repeatedly calculating a character must not masquerade as an edit that grants healing.

## 5. How the feat system works

In this code, **feat** is an umbrella term for behavior contributed by origins, perks, and traits. It does not mean those three concepts are identical.

### The folder layout

```text
src/features/character/feats/
  types.ts             shared contracts
  registry.ts          discover implementations and select active ones
  rules.ts             combine the selected implementations' results
  utils.ts             small rank/membership helpers
  weaponEffects.ts     merge displayed weapon effects and bonuses
  perks.ts             perk IDs, requirements, and effective selection
  traits.ts            trait IDs, origin validity, and fixed traits
  perks/perk*.ts       individual perk implementations
  traits/trait*.ts     individual trait implementations
```

`perks.ts` answers questions about the perk dataset and selection. `perks/perkLifeGiver.ts` answers what Life Giver does. They have different responsibilities despite the similar names.

The old `implementations/` nesting was removed. The old large `feats/index.ts`, and the temporary `feats.ts` replacement, are not the final public API. Consumers import the specific module they need.

### A capability is just an optional function

`FeatImplementation` declares supported questions such as:

```ts
getMaxHpBonus?: (...)
getGrantedItems?: (...)
getDamageRatingBonus?: (...)
getRollComplicationModifiers?: (...)
```

A feat implements only the questions relevant to its behavior. Life Giver does not need empty ammunition or companion methods.

The important distinction is between **declaring a function in the type** and **actually calling it in a calculation path**. Adding a capability without wiring a consumer does nothing. Obsolete generic lifecycle hooks from the earlier interface were not retained as an imaginary event system.

### Discovery and active selection are separate from validation

The registry uses Vite's eager `import.meta.glob`:

- `./perks/perk*.ts`
- `./traits/trait*.ts`

Matching files must default-export an implementation with an ID. Missing IDs and duplicate implementation IDs fail explicitly.

Files beginning with `_` do not match. `_perkMysteriousStranger.ts` remains a special-case helper used directly by UI code, not a normal registered perk module.

`calculatePerks(raw)` checks requirements; `calculateTraits(raw, origin)` combines valid selected traits with the origin's fixed traits. A selected ID saved in raw data is not proof that its effect is currently valid.

The registry itself is not another requirement validator. Callers must pass the appropriate effective selection.

### Order and ranks

Active implementations are evaluated in this family order:

```text
Origin -> Perks -> Traits
```

Each implementation is selected once, but the original perk ID array still contains repeated IDs representing ranks.

For example, two occurrences of `perkLifeGiver` mean rank 2. Its implementation runs once and reads rank 2. Running that same implementation twice while each invocation also reads rank 2 would double the intended contribution.

Do not "simplify" the saved perk list by deduplicating it. Deduplicating implementations and deduplicating rank data are different operations.

### Not every modifier combines the same way

| Kind                      | Combination                                                     | Example                                                             |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Additive number           | Sum contributions.                                              | HP, Luck, skill points, resistance bonuses.                         |
| Collected choices         | Collect returned values.                                        | Available companions, required/forbidden specialties, roll actions. |
| Formula replacement       | Use the active override; multiple carry-weight overrides throw. | Small Frame's weight formula.                                       |
| Sequential transformation | Feed the current result through each modifier in order.         | Strong Back modifying the chosen carry-weight base.                 |
| Contextual modifier       | Ask using the current weapon/roll conditions.                   | Aiming, sneak attack, prepared handedness, complication modifiers.  |

`rules.ts` centralizes these combination mechanisms. The individual modules retain the actual rules.

### What the local commit centralized

Many of these behaviors existed before as named checks in generic calculations. The commit made their ownership explicit:

| Module(s)                      | Behavior moved behind capabilities                                    |
| ------------------------------ | --------------------------------------------------------------------- |
| Intense Training, Skilled, Tag | Extra SPECIAL allocation, skill points, and specialty points by rank. |
| Life Giver                     | Endurance-based maximum-HP bonus by rank.                             |
| Gifted, Extra Perk             | SPECIAL/Luck changes and additional perk slots.                       |
| Good Natured                   | Restricted specialty bonuses and affected non-specialty skill limits. |
| Nomad                          | Science specialty prohibition; its other TODOs remain unfinished.     |
| Small Frame                    | Alternative carry-weight base formula.                                |
| Heavy Handed, Grunt            | Melee/weapon bonuses and skill-check complications.                   |
| Incisor, Piercing Strike       | Weapon Piercing effects.                                              |

The later working-tree changes made origins participate in the shared capabilities and added the persistent-grant, Iron Fist, and Strong Back behavior described below.

### Why rank helpers moved again

`hasPerk`, `perkRank`, and `hasTrait` now live in `utils.ts`, with type-only imports for IDs.

Previously a perk could import `perkRank` from `perks.ts`, which also imported SPECIAL calculation code, which imported rules, which imported the registry that was loading the perk.

Moving tiny helpers into a dependency-light module breaks that rank-helper feedback path. It does **not** mean every possible dependency cycle in the project has been eliminated.

## 6. Origins and character calculations

The large `origin.ts` object became one definition per origin under [`origins/`](../src/features/character/origins), plus:

- `types.ts`: stable origin IDs and the `Origin` contract.
- `defaultOrigin.ts`: shared defaults and the no-origin fallback.
- `registry.ts`: discovery, lookup, and checks for missing, unexpected, or duplicate origin IDs.

An origin extends the shared feat capabilities while retaining origin-specific properties: body parts, immunities, SPECIAL bounds, trait count, equipment restrictions, and the base weight formula.

This replaces checks such as "if this is the Ghoul object, add Survival" with "collect the required specialties contributed by the origin."

Stable IDs matter for saves. Moving `originGhoul.ts` is a code organization change; renaming the saved ID `ghoul` would be a compatibility change.

The fallback origin intentionally has `id: undefined`. Normal registered origins and perk/trait implementations have IDs. The shared capability interface therefore does not force every possible default behavior object to pretend to be a named feat.

### Examples of equivalent rules expressed differently

**Ghoul:** the origin supplies Survival as a required specialty and one extra specialty point. That point accounts for the mandatory choice without taking away a normal choice.

**Brotherhood Initiate:** the origin supplies its restricted bonus specialty pool for Energy Weapons, Science, and Repair.

**Super Mutant:** the origin supplies its higher Strength/Endurance minima, altered maxima, and four extra allocation points. The generic allocation calculation no longer hardcodes that origin.

At the minimum Super Mutant allocation, the SPECIAL sum is 32:

```text
Old accounting: 12 - (32 - 32) = 12 remaining
New accounting: 12 + 4 - (32 - 28) = 12 remaining
```

The changed expression does not grant an extra four usable points relative to the old behavior; the origin capability replaces the old special-case baseline.

`StatGear` now obtains player minima/maxima from the shared helpers. Skill calculations also apply the feat-provided limits used for Good Natured, instead of applying only the generic origin cap.

### Carry capacity has an explicit order

```text
Origin base formula, or one active override
  -> sequential maximum-weight modifiers
  -> carry bonuses from equipped apparel mods
```

For a normal character with Strength 8, before equipment bonuses:

| Conditions                         | Capacity               |
| ---------------------------------- | ---------------------- |
| Normal base                        | `75 + 8 * 5 = 115`     |
| Strong Back rank 2                 | `115 + 2 * 12.5 = 140` |
| Small Frame                        | `75 + 8 * 2.5 = 95`    |
| Small Frame and Strong Back rank 2 | `95 + 25 = 120`        |

Strong Back is now an actual implementation, not merely an unhandled data entry. It modifies the selected base rather than replacing other formulas accidentally.

**Mr. Handy is an intentional exception:** its `allowsPerkAndTraitWeightModifiers` is false. Its 75 kg base is not increased by those perk/trait contributions, but legitimate equipped storage mods still count. A +10 kg robot storage mod produces 85 kg.

This was an explicit rule decision made during the work. It is not an accidental preservation of an old early return, and it does not apply the same exclusion to every robot origin.

Carry-weight mod accumulation also starts from zero when the field is absent. `CARRY_WEIGHT_BONUS` was added to the apparel interface/schema, avoiding undefined-based arithmetic.

Splitting origin files does not complete every DLC origin or the unfinished specialized armor datasets.

## 7. Saved inventory, grants, and virtual attacks

This is the most important distinction to remember when changing inventory code.

### There are three views, not three interchangeable arrays

| View                      | Contents                                                                     | Used for                                                           |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Raw saved inventory       | Manual items and persistent grants, including currently hidden grants.       | Persistence and the base of item updates.                          |
| Active physical inventory | Saved physical items retained by grant/replacement and robot-part filtering. | Weight, equipment bonuses, resistances, and active ammo selection. |
| Display inventory         | Active physical inventory plus virtual attacks.                              | Inventory UI and attack choices.                                   |

`getInventory` returns `{ items, displayItems }`, where `items` means the physical list. `calculateCharacter` uses the physical list for stats but exposes the display list as **`character.items`**.

Consequently, `character.items` is **not** a safe replacement for `rawCharacter.items`.

```ts
// Do not do this: it can discard hidden grants and save virtual attacks.
updateCharacter({ items: character.items.filter(item => item.quantity > 0) });
```

Start writes from the latest raw save, or use the shared item/ammo operations. The distinction is architectural; the shared `CharacterItem` type does not make every wrong write a TypeScript error.

### Grants now have provenance

A granted item records why it exists:

```ts
{
    id: 'weaponMrHandyCircularSaw',
    grantedBy: 'traitMrHandyCircularSaw',
    quantity: 1,
    mods: [],
    equipped: false,
}
```

The collector supplies `grantedBy` from the granting implementation. Individual feat implementations do not need to repeat that bookkeeping.

`reconcileItems` adds a missing grant only when no saved item with the same **`id + grantedBy`** exists. It does not replace a customized saved grant with a fresh default object on each update.

The five Mr. Handy weapon grants are:

| Granting trait                | Saved weapon                   |
| ----------------------------- | ------------------------------ |
| `traitMrHandyCircularSaw`     | `weaponMrHandyCircularSaw`     |
| `traitMrHandyFlamethrower`    | `weaponMrHandyFlamethrower`    |
| `traitMrHandyPliers`          | `weaponMrHandyPliers`          |
| `traitMrHandyAutomaticPistol` | `weaponMrHandyAutomaticPistol` |
| `traitMrHandyLaserEmitter`    | `weaponMrHandyLaserEmitter`    |

Disabling a trait hides its grant; re-enabling it exposes the same saved object and its configuration. The grant is not deleted and recreated.

This removes the old `InventoryList` behavior that interpreted trait `weaponAdd` effects and manufactured temporary weapons during rendering.

### Temporary save migration: added 2026-10-15

Older saves have no `grantedBy`, including customized weapons that originally came from a feat. Merely adding a fresh tagged grant would leave the old configuration active as a manual copy.

`loadCharacter` now treats a missing `saveVersion` as version 0. Before reconciling grants, it adopts untagged copies of the five Mr. Handy weapons above and `weaponIronFist`, assigning their corresponding trait/perk as `grantedBy`. It then validates again, which also removes the obsolete Iron Fist `modCalibrated` bonus, and records `saveVersion: 1`.

Names, quantities, equipped state, and other mods are preserved. Existing provenance is not overwritten. Adoption also applies when the original feat or origin is inactive: those items remain saved but hidden until eligible again. Loading does not grant transition healing.

**Intentional legacy policy:** the old format cannot distinguish granted copies from manually added copies with the same ID. We explicitly chose to adopt all matching untagged copies in version-0 saves, including indistinguishable manual copies. This is a compatibility decision, not reliable recovery of missing ownership information.

New characters also receive version 1. Once a character has that marker, later manual copies are not adopted, including after export/import. The marker is per character, separate from Zustand's unchanged storage-envelope `version: 0`. Imports, rehydration of all occupied slots, and the old `character_slot_*` migration all use the same loader.

**Future removal:** the temporary block in `loadCharacter` is dated `2026-10-15`. Remove it only when support for pre-version-1 saves **and old exported files** is deliberately retired; the date alone is not a safe automatic expiry. At that point, change the schema's default version from 0 to 1 so new characters do not advertise the retired format. Keep accepting existing version-1 saves, and retain the tagged Iron Fist cleanup for as long as intermediate tagged legacy saves need support.

### There are two relevant kinds of identity

| Question                                                                             | Identity used                                                                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Has this grant already been saved?                                                   | Item ID plus `grantedBy`.                                                                                                      |
| Can these items stack, or does this self-ammo item match the selected configuration? | The configuration key: ID, mods, name, side/equipped state, provenance, and relevant custom-item fields. Quantity is excluded. |

A manually acquired copy and a granted copy must not merge just because they have the same weapon ID. Both the save-schema stacking logic and item configuration identity now account for provenance.

A configuration key is not a new globally unique instance ID. Identical configurations can still be treated as matching stacks.

### Replacement is a generic grant rule

Iron Fist declares:

```ts
replaces: ['weaponUnarmedStrike', 'weaponMrHandyPliers'];
```

This means **any valid target is enough**, not that both must exist.

The collector starts with eligible non-granted targets, then accepts grants whose prerequisites are available. Accepted grants can make later replacement targets available. It repeats until no more grants can be accepted.

An inactive saved grant is not proof that its weapon is available. A replacement chain with no valid starting target remains rejected. A cycle without a starting target cannot bootstrap itself, and the collector stops when no progress is possible.

`replaces` is a rule declaration, not user equipment data. Reconciliation does not save that field onto the item.

### Iron Fist's complete lifecycle

For a humanoid, the implicit Unarmed Strike is a valid target even though it is not saved as a physical object.

For a robot, there is no automatic humanoid Unarmed Strike. Iron Fist can replace an available Mr. Handy Pliers attack, but merely having an inactive pliers grant in the save does not qualify.

When replacement is active, the target is filtered from active/display inventory, not deleted from raw saves. Disabling Iron Fist restores the appropriate target and its configuration.

At rank 2 or higher, `getWeaponItemEffects` adds Vicious to Iron Fist's prepared data. Dropping to rank 1 removes that feat contribution automatically. The saved `mods` array is not used as a permanent cache of perk rank.

A narrow schema transformation removes the old `modCalibrated` workaround **only** from `weaponIronFist` marked `grantedBy: 'perkIronFist'`. It does not strip that mod from arbitrary manual weapons.

### Virtual attacks stay virtual

Unarmed Strike, one/two-handed gun bash, bayonets, and shredder attacks are projected when building the display list.

They do not become additional saved equipment, weight, or armor bonuses. Projection copies the item records it adjusts, so repeated calculation does not increase the quantities of saved objects through shared references.

Gun-bash handedness uses the modified weapon qualities. Changing a weapon's handedness through a mod must change the projected attack too.

Robot parts remain persistent equipment: reconciliation adds each missing required part individually. Active projection hides parts that do not belong to the current origin and treats valid parts as equipped. Origin changes can unequip incompatible specialized armor without deleting saved equipment.

## 8. Preparing weapons and applying bonuses

The pipeline is now:

```text
Base dataset entry
  -> selected physical/legendary mods
  -> feat-provided item effects
  -> contextual character/attack bonuses
```

The two similarly named functions have deliberately different scopes:

| Function                           | Module                        | Knows about character feats?                              |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------- |
| `getModdedItemData(item)`          | `features/item/utils.ts`      | No. Applies the item's own mods.                          |
| `getModifiedItemData(item, perks)` | `features/character/items.ts` | Yes. Builds on modded data and applies feat item effects. |

The generic item utility no longer imports the feat registry to apply character rules.

Notice the arguments: the current item-effect stage receives perks, not a complete character selection. It does not automatically apply trait/origin item effects just because the shared interface allows that method. A future rule needing those inputs must wire them into the consumer too.

`getDamageRatingBonus` receives both the saved item and prepared weapon data. Those are not redundant:

- **Prepared data** answers what the weapon is now: category, qualities, effects, and other modified values.
- **The saved item** identifies the selected configuration and its actual mod IDs.
- **Attack context** answers things such as whether this is a sneak attack.

Concrete examples:

| Rule                      | Information that must be correct                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Gladiator                 | Uses prepared `qualityTwoHanded`, not just the dataset's original handedness.                                |
| Laser Commander           | Uses the prepared weapon category.                                                                           |
| Mister Sandman            | Needs the selected item's suppressor configuration, sneak status, and the character's power-armor condition. |
| Grunt                     | Needs the selected weapon's identity.                                                                        |
| Iron Fist                 | Vicious depends on current effective rank, not a saved receiver mod.                                         |
| Incisor / Piercing Strike | Add their Piercing item effects in the feat stage.                                                           |

`useWeaponStats`, inventory summaries, cards, trade/modification views, and resistances were updated to use the appropriate preparation API. Merely moving the helper without updating its consumers would have left inconsistent displays.

`weaponEffects.ts` separately merges base effects and contextual bonuses for display/damage use. It does not mean every effect string in every subsystem is interchangeable.

Treat dataset entries and origin definitions as shared read-only values. Build modified results from copies rather than changing `allItems` or an origin's bounds in place.

There is also a small mod-display addition: a `rerollHitLocation:true` effect sets `REROLL_HIT_LOCATION` and adds `qualityRerollHitLocation`, with English/Italian source labels and a schema field. This makes the capability visible in quality tags; it is not a new generalized dice-reroll engine.

## 9. Editing inventory without losing other changes

Pure `applyAddItem` and `applyRemoveItem` moved out of the React hook into `character/items.ts`.

- Add stacks only matching configurations.
- Remove spends one requested quantity across matching stacks.
- Neither modifies its input array or item records.
- Standard and custom items keep their separate storage arrays.

`useItemManagement` now uses functional updates for adds, removals, and edits. Shared `getCurrencyUpdate` handles caps, NCR dollars, Legion denarii, and pre-war money instead of repeating the same arithmetic in each branch.

Editing removes the specified old quantity/configuration and adds the new one against the latest saved array. Trying to change a standard item into a custom item, or vice versa, is explicitly rejected rather than silently doing nothing.

Two deferred UI operations were updated too:

**Choosing an equipment side:** the callback may run after opening a choice popup. It now transforms `prev.items`, preserving intervening additions, hidden grants, stack quantities, and armor on the opposite side.

**Confirming robot plating:** confirmation now transforms the latest raw parts and subtracts the cost from the latest caps. It updates plating across the current origin's parts while retaining other parts' non-plating mods and configuration.

This is a focused stale-state fix, not a new transaction framework or a complete rewrite of every purchase/affordability rule. In particular, the plating popup's earlier affordability check still uses its rendered character view.

## 10. Ammunition, dice, and closing popups

### One ammunition implementation

The count/availability helpers and `consumeAmmo` live in `character/items.ts`, rather than being split between a React hook and several popup mutations.

`consumeAmmo` works from raw data, selects eligible active ammunition, checks the total first, and consumes one total across stacks. It retains hidden grants and unrelated objects.

For stacks of 2 and 5 rounds, consuming 4 leaves a total of 3. It must not subtract 4 from both stacks or reconstruct the save from the filtered display list.

Invalid costs are rejected explicitly; insufficient ammunition is not a successful partial consumption. Zero-cost/no-ammo operations do not invent an inventory change.

### Special ammunition cases

| Case                | Behavior                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| `AMMO_TYPE: 'na'`   | No ammunition consumption; availability is unlimited.                        |
| Ordinary ammo ID    | Count and consume active stacks of that ammo ID.                             |
| `AMMO_TYPE: 'self'` | Match the selected weapon configuration, not every item with that weapon ID. |
| Gatling             | Uses the existing 10-round-per-shot rule.                                    |
| Ammo Hungry         | Uses the quality's configured per-shot amount.                               |

The selected `CharacterItem` is now required by count/availability/consumption APIs. If a player throws a renamed or modified grenade, a different grenade configuration must not be spent simply because it appears first in the array.

Reference equality is unsuitable: schema parsing and updates can create new objects. The shared configuration comparison survives those transformations.

### D6 resource spending

D6 spending checks current resources inside the functional update and returns a single patch for ammunition and Luck. Dice/action success is not advanced when the check fails.

The popup distinguishes:

- Base attack ammunition and selected extra-dice cost.
- Later reroll Luck costs.
- Perk action costs.
- Burst ammunition reserved for payment when closing.

Reservations are not imaginary extra ammo. While burst rounds are reserved, another perk action cannot spend them. Deferred confirmations check again against the latest resources, including the reservation.

The final burst payment does not include the same reservation a second time in its availability check. Repeated close requests must not charge it twice.

In `roller` mode, player ammunition is not consumed and feat action buttons are not offered. This work did not unify all player, companion, and special-roller resource rules into one new abstraction.

### Why `beforeClose` exists

This was a real lifecycle issue, not just a naming preference.

The earlier order was:

```text
finish close animation
  -> native dialog.close()
  -> confirmation callback, if any
  -> onClose()
```

Rejecting a payment in `onClose` was too late: the native dialog was already invisible. Keeping its React component mounted did not reopen it.

The guarded order is:

```text
finish close animation
  -> run latest beforeClose(), if present
       false: leave the dialog open; do not confirm or remove it
       true: continue
  -> native dialog.close()
  -> confirmation callback, if any
  -> onClose() cleanup / popup removal
```

`beforeClose` means "may closing proceed?" while `onClose` retains its existing completion/cleanup meaning. A cancellable `onClose` could be another API design, but changing its contract and callback order would affect other popup consumers.

The guard is optional, not a requirement for every popup. A ref supplies the latest guard when state changes during the animation. The closing-class check blocks duplicate close requests. Escape is routed through the same guarded path rather than bypassing it.

If burst payment is no longer affordable, the popup stays visible with the unpaid selection. The player can reduce/cancel that selection instead of being trapped behind a mounted but invisible popup.

### D20 remains a different domain

D20 now asks feat capabilities for complication modifiers instead of directly checking Heavy Handed and Grunt in the popup.

The contract distinguishes changes to the complication threshold from additional complication faces. That preserves the distinction in the rule declarations; a TODO remains about more complex combinations.

D20 skill checks and D6 damage rolls still have different rules and UI. This refactor did not force them into one configurable "universal" popup.

## 11. Companion updates

The existing save format is a map keyed by companion ID plus `activeCompanionId`. The legacy `companion` to `companions` schema migration was retained and tested; it was not invented by this refactor.

The audit found a concrete problem: duplicated local selected-perk state could overwrite saved perks after changing companion or character. Name, HP, and SPECIAL edits could also spread a rendered companion snapshot over newer values.

The fix removes that redundant perk-selection state and introduces one updater:

```ts
updateCharacter(updateCompanion('dog', { name: 'Dogmeat' }));

updateCharacter(
    updateCompanion('dog', current => ({
        special: {
            ...current.special,
            body: current.special.body + 1,
        },
    })),
);
```

`updateCompanion(id, changes)` returns a function for `updateCharacter`. That function reads the latest companion and returns a patch for only that map entry. The store's normal map merge keeps other companions.

The callback form is useful for increments and perk-slot edits. Simple field assignments can use an object.

There is no arbitrary deep merge: when changing SPECIAL, the caller explicitly copies `current.special`. This makes the nested update visible instead of hiding it in a generic merging utility.

### The first-edit edge case

A perk can unlock a companion before any companion entry has been saved. `calculateCharacter` can display that companion's defaults.

A raw-only existence check would incorrectly reject its first edit. The updater therefore falls back to the currently calculated default when no saved entry exists, and verifies that it is the requested companion.

It does not silently create an unavailable companion or use another active companion's defaults.

The companion schema now accepts SPECIAL values below the player's minimum: its range is 1-10. Current Dogmeat defaults have MIND 3, which the old minimum of 4 rejected. The player SPECIAL rules were not lowered with it.

## 12. Bug-fix reference

Some fixes address older behavior; others correct regressions or edge cases found while building the new flow. This table describes the problem and final handling, not a claim that every bug began in the same commit.

| Problem                                                                  | Consequence                                                                                     | Final handling                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Grants recreated by UI code                                              | Customized names/mods could not reliably survive disable/re-enable cycles.                      | Persistent provenance-tagged grants; inactive ones are hidden, not deleted.  |
| Manual and granted copies treated alike                                  | Stacking/removal could confuse ownership.                                                       | Grant provenance participates in saved stacking and configuration identity.  |
| Replacement checked against inactive saved grants                        | A robot could gain Iron Fist without an available replacement target.                           | Only eligible targets and accepted grants ground replacement chains.         |
| Rank bonus encoded as `modCalibrated`                                    | Vicious could outlive the rank that granted it or overwrite equipment configuration.            | Derived rank effect and targeted legacy cleanup.                             |
| Display lists used as save input                                         | Hidden items could disappear and synthetic attacks could become saved equipment.                | Raw-based mutations and one inventory projection path.                       |
| Projection adjusted shared item objects                                  | Repeated calculation could change quantities outside the projection.                            | Copy records before building/aggregating display attacks.                    |
| Ammo operations did not preserve the full raw inventory or one total     | Hidden data or stack totals could be wrong.                                                     | Active selection with raw-preserving, total-based consumption.               |
| Self-ammo selected by ID alone                                           | The wrong renamed/modded/granted configuration could be consumed.                               | Shared selected-configuration predicate for counting and spending.           |
| Burst and actions competed for the same rounds                           | An action could spend ammunition already needed by a pending burst.                             | Reservation-aware buttons, confirmation checks, and one final settlement.    |
| Payment rejection after native close                                     | Popup remained mounted but invisible.                                                           | Pre-close veto, latest callback, and duplicate-close guard.                  |
| Companion edits used duplicated/stale state                              | Earlier perks or other edited fields could be overwritten.                                      | Latest-state companion updater and removal of redundant selected-perk state. |
| First companion save used invalid/default assumptions                    | Legitimate default stats or the first edit could be rejected.                                   | Companion-specific schema bounds and guarded default fallback.               |
| Item edits and deferred equipment/mod callbacks used old arrays/currency | Intervening purchases, equipment, or currency changes could be lost.                            | Functional raw updates and shared arithmetic.                                |
| HP calculations used inconsistent transition inputs                      | Explicit HP edits, changed prerequisites, or uninitialized HP could produce unintended healing. | Separate loading/editing paths and consistent effective selections.          |
| Weapon checks read base data after mods changed it                       | Damage/handedness decisions could disagree with the modified weapon.                            | Prepared data plus original item/context passed to the appropriate rule.     |
| Carry bonuses started from an absent numeric field                       | Modded capacity could become invalid.                                                           | Typed/defaulted bonus field and zero-based accumulation.                     |
| UI and calculation did not both apply affected skill limits              | Good Natured's calculated skills could disagree with its limit rules.                           | Shared capability consumed by the calculation path as well.                  |

Useful specialized-armor and other unfinished-rule TODOs were retained/restored during review. Moving code was not treated as permission to discard still-relevant information.

## 13. Tests and what they actually prove

`npm test` previously printed "No tests yet" and exited successfully. It now runs two real scripts without adding a new test framework dependency.

### Domain, store, and hook checks

[`scripts/test_granted_items.mjs`](../scripts/test_granted_items.mjs) uses Node's test runner and Vite SSR to import the actual TypeScript modules.

Despite its original name, its scope now includes grants, replacement cycles, save import/rehydration, HP transitions, nested updates, companion defaults, currencies, virtual attacks, prepared weapon checks, discovery/ranks, and ammo.

Some checks render React statically. Those checks help verify rendered output, but do not exercise animation events, effects, or a real native dialog.

### Real browser integration checks

[`scripts/test_ui_regressions.mjs`](../scripts/test_ui_regressions.mjs) mounts real providers/components in an isolated Vite fixture and runs Chrome/Chromium.

Its ten scenarios exercise companion/character switching, selected self-ammo, burst reservations, rejected close payment, deferred resource changes, state changes during close animation, sequential item/currency operations, side selection, robot plating, and first companion edits.

The temporary browser profile and test storage are separate from real saves. The fixture is not a full deployed-PWA/offline test.

If no browser is found, browser coverage is **explicitly skipped**. A successful command with a skip is not equivalent to a successful browser run. `CHROME_PATH` can point to an installed browser.

### Last recorded implementation checks

These are implementation validation results, most recently repeated for the **2026-10-15 compatibility migration**, not proof that every possible historical player save has been exercised:

| Check                                    | Recorded result                | Interpretation                                                                                             |
| ---------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `npm test`                               | 59 passed, 0 failed, 0 skipped | 48 domain/store/hook checks, 10 browser cases, and the browser parent test.                                |
| `npm run lint`                           | 0 errors, 13 warnings          | Existing warnings remain.                                                                                  |
| `npm run type-check`                     | 13 errors                      | Diagnostics exactly matched the pre-migration baseline; the project is not type-check clean.               |
| `npm run build`                          | Passed                         | Data/localization validation, generation, and Vite/PWA build ran in a separate copy, not the working tree. |
| `git diff --check` and staged equivalent | Passed                         | No whitespace errors in the checked diffs.                                                                 |

The recorded toolchain used Node 24.8.0 and Vite 7.3.6. A successful Vite build is **not** a successful TypeScript type-check: they are separate commands here.

The ten added migration regressions include truly untagged old-format fixtures, all five Mr. Handy weapons, Iron Fist rank changes, inactive grants, preservation of other character data and HP, manual copies created after migration, imports, every occupied persisted slot, and legacy storage keys. The earlier tagged-receiver test was renamed because it did not, on its own, cover pre-provenance saves.

The remaining TypeScript diagnostics concern existing model/schema mismatches: mod category data, apparel locations, item-effect properties absent from their interfaces, and the `"mods"` category. They were not hidden with broad casts or reported as a clean check.

The build also retained large-chunk and stale Browserslist warnings. A complete repository-wide formatting pass was not part of this targeted simplification.

The earlier read-only audit additionally compared 4,095 character fixtures and 830 weapon/base/single-mod cases between snapshots. These comparisons helped distinguish intentional Strong Back and hit-location-quality changes from regressions. They are historical diagnostic evidence, not 4,925 additional permanent tests or proof of every possible combination.

### What remains outside that coverage

The suite does not prove every device layout, all accessibility interactions, every combination of mods/feats, every malformed historical save, all popup timing sequences, or service-worker/offline behavior.

The browser tests were added precisely because passing pure helper tests alone did not establish correct popup behavior.

## 14. How to extend the code now

### Add or change a perk/trait

1. Add/update its source data and bilingual text if required; rebuild data/locales rather than editing generated JSON directly.
2. Put a default-exported implementation in `feats/perks/perkName.ts` or `feats/traits/traitName.ts`.
3. Use its existing stable dataset ID and implement only the needed capabilities.
4. Import rank helpers from `feats/utils.ts`, and contracts with `import type`.
5. If a genuinely new capability is needed, add its type, aggregation, actual consumer, and tests. A type declaration alone is not integration.
6. Test activation, deactivation, rank changes, and relevant interactions.

Strong Back is a small real example:

```ts
import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkStrongBack: PerkImplementation = {
    id: 'perkStrongBack',
    modifyMaxWeight: (currentMaxWeight, _, perks) =>
        currentMaxWeight + 12.5 * perkRank(perks, 'perkStrongBack'),
};

export default perkStrongBack;
```

Do not add a matching `if (perkId === ...)` to Context, inventory filters, and every popup. Use the existing capability when it expresses the rule correctly.

### Add a grant

Return the initial item from `getGrantedItems`; use `replaces` only when a valid target must exist.

Let the collector attach provenance and reconciliation add missing saved entries. Do not also manufacture the same item in a component.

Keep temporary rank bonuses out of the saved `mods` array. Test disable/re-enable with a renamed/modded grant and a manual copy of the same weapon.

### Add or change an origin

Use an `origin*.ts` default export, declare its stable ID in `ORIGIN_IDS`, and override defaults deliberately. Add source text/data where needed.

The registry checks consistency, but does not invent origin rules. Review immunities, body parts, restrictions, minimum/maximum SPECIAL, and any capabilities instead of assuming the defaults are correct for the new origin.

### Change an item operation

Use `useItemManagement` from UI code. Put reusable array arithmetic in the domain module.

Base a new write on `prev.items` or `prev.customItems`, never on the display list. Include a hidden grant and a second unrelated item in regression fixtures so accidental filtering is visible.

### Change a weapon rule

Decide whether the rule changes the item itself or only an attack's contextual bonus.

Use prepared weapon data for modified characteristics and retain the original item when configuration identity matters. Include a mod that changes the relevant characteristic in the test, not just an unmodified weapon.

### Change a deferred popup action

Recheck resources at confirmation time. A button that was enabled earlier is not a guarantee that its callback is still affordable.

Use a pre-close guard only when closure can legitimately be rejected. Keep cleanup in `onClose`. Exercise a real browser if native dialog state, Escape, animation, or delayed callbacks are involved.

### Before committing or integrating upstream

Review both tracked diffs and untracked source/test files. The staged subset alone does not currently represent the whole implementation.

Review the intermediate deleted feat engine deliberately, and do not commit a stale duplicate engine by accident. Integrate remote-only changes with care, especially where both sides touch inventory equipment behavior; do not blindly choose all of one side.

An unrelated Python `__pycache__` artifact and the draft planning prompt are not runtime features. Their presence in the working tree does not make them part of the refactor's deliverable.

Use the project's existing checks, while remembering the known TypeScript baseline and explicit browser skips. This guide does not authorize automatic staging, deletion, merging, or pushing.

## 15. What remains imperfect or unfinished

The resulting architecture is more explicit, but it is not a claim of architectural completion.

**Implementation indicators are coarse.** Perk/trait lists and selection popups use the same registry-presence check for strikethrough. That means "a module is registered," not "every paragraph of the rule is implemented." `traitMrHandy` currently has an ID-only module specifically to avoid strikethrough; some other modules contain meaningful partial behavior and TODOs. The Mysterious Stranger special-case UI can exist even while its underscore-prefixed module is absent from normal discovery.

**Some UI actions remain special cases.** Perk/trait action maps, Mysterious Stranger wiring, and Meltdown's modal behavior were not all converted into a universal action system.

**Rule precedence still needs domain decisions.** TODOs remain around combinations of SPECIAL replacements/additions, overlapping specialty bonus pools, and ranked versus unranked weapon effects. Those are not safely resolved by choosing a design pattern.

**Types do not enforce every boundary.** Raw, physical, and display items still share item shapes. Developers must respect which list they write back. The explicit helpers reduce risk but do not make misuse impossible.

**Thin Context does not imply zero rerenders.** Its calculated value is memoized, but the store/context subscription architecture was not comprehensively optimized.

**The files are not maximally split.** `items.ts` is a cohesive home for character-related inventory behavior, but it is not tiny. D6 still contains substantial roll/UI logic. Splitting either solely to reduce file length would not automatically simplify the project.

**The companion default fallback is a deliberate trade-off.** Its updater may call the full pure calculation when the saved entry is missing. That reuses the canonical availability/default logic rather than duplicating it; normal edits of an existing saved companion do not need the fallback.

**Not all original behavior was redesigned.** Resource schema TODOs, legacy storage handling, unfinished power armor/specialized armor, partial DLC rules, and broader purchase validation remain their own work. "Active inventory" does not mean every rulebook equipment restriction is fully enforced. Power armor was excluded from the inventory category map while unsupported; that is not a completed power-armor feature.

The practical standard for another refactor should be: does it remove a demonstrated duplication, prevent an actual invalid state, or make an existing rule easier to locate and test? "More layers" is not a goal.

## 16. File map and terminology

### Where to look first

| Task or symptom                                    | Starting point                                                                                                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save loads differently from an edit                | [`update.ts`](../src/features/character/update.ts), [`useSaveStore.ts`](../src/hooks/useSaveStore.ts), [`characterSchemas.ts`](../src/schemas/characterSchemas.ts)                |
| Wrong character calculation                        | [`calculate.ts`](../src/features/character/calculate.ts), then the relevant HP/skill/weight/etc. calculator                                                                       |
| Feat not discovered or repeated                    | [`registry.ts`](../src/features/character/feats/registry.ts), filename pattern, stable ID/default export                                                                          |
| Wrong rule combination                             | [`rules.ts`](../src/features/character/feats/rules.ts), then the individual implementation                                                                                        |
| Grant missing, duplicated, or losing configuration | [`items.ts`](../src/features/character/items.ts), schema provenance and stacking                                                                                                  |
| Wrong item mod result                              | [`features/item/utils.ts`](../src/features/item/utils.ts)                                                                                                                         |
| Wrong character-aware weapon result                | [`character/items.ts`](../src/features/character/items.ts), [`useWeaponStats.ts`](../src/features/character/hooks/useWeaponStats.ts)                                              |
| Item/currency edit overwrites another action       | [`useItemManagement.ts`](../src/app/contexts/useItemManagement.ts)                                                                                                                |
| Deferred side/plating edit loses changes           | [`useInventoryActions.ts`](../src/app/tabs/inv/hooks/useInventoryActions.ts), [`ModifyItemPopup.tsx`](../src/app/components/popup/ModifyItemPopup.tsx)                            |
| Ammo/action/burst payment wrong                    | [`D6Popup.tsx`](../src/app/components/popup/dice/D6Popup.tsx), shared ammo helpers                                                                                                |
| Popup invisible but still mounted                  | [`useDialog.ts`](../src/hooks/useDialog.ts), [`BasePopup.tsx`](../src/app/components/popup/common/BasePopup.tsx)                                                                  |
| Companion edit loses another field                 | [`updateCompanion`](../src/features/character/update.ts), [`CompanionTab.tsx`](../src/app/tabs/companion/CompanionTab.tsx), [`StatGear.tsx`](../src/app/components/StatGear.tsx)  |
| Lists and popup implementation markings disagree   | [`TraitPerkItem.tsx`](../src/app/tabs/data/components/TraitPerkItem.tsx), [`FeatSelectionPopup.tsx`](../src/app/tabs/data/components/FeatSelectionPopup.tsx), registry predicates |
| Translation missing for the new quality            | [`qualities.json`](../data/sources/item-features/qualities.json), then the locale generation pipeline                                                                             |

The other inventory card/content and damage-resistance files mainly changed imports or call signatures so they participate in the same preparation pipeline. The unused `src/app/tabs/stat/index.ts` re-export was removed; `StatTab` itself was not removed.

This walkthrough is intentionally separate from [`engineering-notes.md`](engineering-notes.md), which tracks open cross-cutting proposals, and [`TODO.md`](../TODO.md), which remains the backlog. It describes the implemented state, not a second backlog.

### Small glossary

| Term                       | Meaning here                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Raw state                  | The validated, editable save data; not necessarily the original unparsed JSON.                                |
| Derived state / projection | A view calculated from saved inputs, such as current weapon effects or display attacks.                       |
| Patch                      | The subset of fields an update intends to change.                                                             |
| Functional updater         | A callback that calculates a patch using the latest stored value.                                             |
| Stale closure              | A callback still reading values captured by an older render.                                                  |
| Reconciliation             | Adding required saved objects and adjusting persistent equipment state without recreating customized entries. |
| Provenance                 | The origin of an item; `grantedBy` records which feat granted it.                                             |
| Capability                 | An optional typed function declaring one kind of behavior a feat can contribute.                              |
| Aggregator                 | A function combining the active implementations' contributions according to that rule's semantics.            |
| Registry                   | The discovered mapping from IDs to implementation modules.                                                    |
| Adapter                    | A thin connection between systems, such as React and domain functions.                                        |
| Migration                  | A targeted conversion from an older saved shape to the currently accepted shape.                              |
| Regression                 | Previously working behavior broken by a later change. A passing build alone cannot rule one out.              |
