import type { Character, CharacterItem, CustomItem, RawCharacter } from '@/types';
import type { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { allItems, apparel } from '@/data';
import { applyEffect, getModdedItemData, isSameConfiguration, isType } from '@/features/item/utils.ts';
import { calculatePerks } from './feats/perks.ts';
import { calculateTraits } from './feats/traits.ts';
import { getGrantedItems, getWeaponItemEffects } from './feats/rules.ts';
import type { PerkId } from './feats/perks.ts';
import type { FeatSelection } from './feats/types.ts';
import { getOriginById } from './origins/registry.ts';
import { getSpecialFromSkill, type SkillType } from './skills/skills.ts';
import type { SpecialType } from './special/special.ts';
import type { WeaponCategory } from '@/types/item.ts';

type Currencies = Pick<RawCharacter, 'caps' | 'ncrDollars' | 'legionDenarius' | 'prewarMoney'>;
export type CurrencyDelta = Partial<Currencies>;

export function getCurrencyUpdate(
    character: Currencies,
    delta: CurrencyDelta | undefined,
    direction: 1 | -1,
): CurrencyDelta {
    return delta
        ? {
              caps: character.caps + direction * (delta.caps ?? 0),
              ncrDollars: character.ncrDollars + direction * (delta.ncrDollars ?? 0),
              legionDenarius: character.legionDenarius + direction * (delta.legionDenarius ?? 0),
              prewarMoney: character.prewarMoney + direction * (delta.prewarMoney ?? 0),
          }
        : {};
}

export function applyAddItem<T extends CharacterItem | CustomItem>(items: T[], itemToAdd: T): T[] {
    let found = false;
    const result = items.map(item => {
        if (isSameConfiguration(item, itemToAdd)) {
            found = true;
            return { ...item, quantity: item.quantity + itemToAdd.quantity };
        }
        return item;
    });
    if (!found) {
        result.push({ ...itemToAdd });
    }
    return result;
}

export function applyRemoveItem<T extends CharacterItem | CustomItem>(
    items: T[],
    itemToRemove: T,
): T[] {
    let remaining = itemToRemove.quantity;
    return items.flatMap(item => {
        if (remaining > 0 && isSameConfiguration(item, itemToRemove)) {
            const spent = Math.min(item.quantity, remaining);
            remaining -= spent;
            return item.quantity > spent ? { ...item, quantity: item.quantity - spent } : [];
        }
        return item;
    });
}

/**
 * Maps a weapon category to its corresponding skill.
 * Most categories map 1:1 to a skill of the same name,
 * but Bows use the Athletics skill (AGI + Athletics per DLC rules).
 */
export function getSkillForWeaponCategory(category: WeaponCategory): SkillType {
    return category === 'bows' ? 'athletics' : category;
}

/**
 * Maps a weapon category to its corresponding SPECIAL attribute.
 * Most categories use the default SPECIAL for their skill,
 * but Bows use Agility (instead of Strength, which is athletics' default).
 */
export function getSpecialForWeaponCategory(category: WeaponCategory): SpecialType {
    return category === 'bows'
        ? 'agility'
        : getSpecialFromSkill(getSkillForWeaponCategory(category));
}

export function getModifiedItemData(item: CharacterItem | null | undefined, perks: PerkId[] = []) {
    const data = getModdedItemData(item);
    if (!isType(data, 'weapon')) {
        return data;
    }
    return getWeaponItemEffects(data, perks).reduce(
        (modified, effect) => applyEffect(modified, effect),
        data,
    );
}

function getUnarmedStrike(selection: FeatSelection): CharacterItem | undefined {
    // Everyone except robots has an unarmed attack. Iron Fist replaces it.
    return selection.origin?.isRobot
        ? undefined
        : { id: 'weaponUnarmedStrike', quantity: 1, mods: [], equipped: false };
}

function getGrants(items: CharacterItem[], selection: FeatSelection) {
    // The humanoid's implicit attack can be replaced without persisting a virtual item.
    const unarmed = getUnarmedStrike(selection);
    const availableItems = unarmed ? [...items, unarmed] : items;
    return getGrantedItems({ ...selection, items: availableItems });
}

function getActiveInventory(items: CharacterItem[], selection: FeatSelection) {
    const grants = getGrants(items, selection);
    const replacedIds = new Set(grants.flatMap(item => item.replaces ?? []));
    const activeItems = items
        .filter(
            item =>
                !replacedIds.has(item.id) &&
                (!item.grantedBy ||
                    grants.some(
                        grant => grant.id === item.id && grant.grantedBy === item.grantedBy,
                    )),
        )
        .flatMap(item => {
            // If it's a robot part, remove it if you should not have it,
            // equip it if you should have it
            // TODO should we "hide" robot parts? aren't they dynamic?
            if (apparel[item.id]?.CATEGORY === 'robotPart') {
                if (
                    !selection.origin?.isRobot ||
                    ![...selection.origin.bodyParts].some(part => part === item.id)
                ) {
                    return [];
                }
                return { ...item, equipped: true };
            }
            return item;
        });
    return { items: activeItems, replacedIds };
}

/** Physical items drive stats; display items additionally include virtual attacks. */
export function getInventory(items: CharacterItem[], selection: FeatSelection) {
    const { items: activeItems, replacedIds } = getActiveInventory(items, selection);
    const unarmed = getUnarmedStrike(selection);
    return {
        items: activeItems,
        displayItems: addSpecialWeaponItems(
            activeItems,
            selection.perks,
            unarmed && !replacedIds.has(unarmed.id) ? unarmed : undefined,
        ),
    };
}

/**
 * Add special weapon items (unarmed strike, gun bash)
 */
function addSpecialWeaponItems(
    items: CharacterItem[],
    perks: PerkId[],
    unarmed: CharacterItem | undefined,
) {
    const resultItems = items.map(item => ({ ...item }));

    const addSpecialItem = (
        itemToCheck: CharacterItem,
        specialItemId: string,
        condition: boolean,
    ) => {
        if (condition) {
            const existingItem = resultItems.find(i => i.id === specialItemId);
            if (existingItem) {
                existingItem.quantity += itemToCheck.quantity;
            } else {
                resultItems.push({
                    id: specialItemId,
                    quantity: itemToCheck.quantity,
                    mods: [],
                    equipped: false,
                });
            }
        }
    };

    /** Condition used with addSpecialItem to add/update gun bash items.
     * @param twoHandedCondition if true, checks for two-handed weapons, if false, checks for one-handed weapons
     */
    const gunBashCondition = (twoHandedCondition: boolean, itemData: WeaponItem) => {
        const hasGunBash = ['bigGuns', 'smallGuns', 'energyWeapons'].includes(itemData.CATEGORY);
        const isTwoHanded = itemData.QUALITIES.includes('qualityTwoHanded');
        return hasGunBash && twoHandedCondition === isTwoHanded;
    };
    if (unarmed && !items.some(item => item.id === unarmed.id)) {
        resultItems.push(unarmed);
    }

    // Cycle over character items and add/update specialItems
    for (const item of items) {
        const data = getModifiedItemData(item, perks);
        if (!isType(data, 'weapon')) {
            continue;
        }
        addSpecialItem(item, 'weaponWeaponStockOneHanded', gunBashCondition(false, data));
        addSpecialItem(item, 'weaponWeaponStock', gunBashCondition(true, data));
        /** Condition used with addSpecialItem to add/update items based on a mod */
        addSpecialItem(item, 'weaponBayonet', item.mods.includes('modBayonet'));
        addSpecialItem(
            item,
            'weaponMissileLauncherBayonet',
            item.mods.includes('modMissileLauncherBayonet'),
        );
        addSpecialItem(item, 'weaponShredder', item.mods.includes('modShredder'));
    }
    return resultItems;
}

/**
 * Get ammo count for a weapon
 */
export const getWeaponAmmoCount = (
    weapon: WeaponItem,
    character: Character,
    usingItem: CharacterItem,
) => {
    // No ammo type = Infinite ammo (melee weapons can "fire" forever)
    if (weapon.AMMO_TYPE === 'na') {
        return Infinity;
    }
    return character.items.reduce(
        (total, item) => total + (isWeaponAmmo(item, weapon, usingItem) ? item.quantity : 0),
        0,
    );
};

function isWeaponAmmo(item: CharacterItem, weapon: WeaponItem, usingItem: CharacterItem) {
    return weapon.AMMO_TYPE === 'self'
        ? isSameConfiguration(item, usingItem)
        : item.id === weapon.AMMO_TYPE;
}

/**
 * Get ammo per shot for a weapon (10 for gatling, 1 for others)
 */
export const getWeaponAmmoPerShot = (weapon: WeaponItem) => {
    // TODO are we using all 3 values?
    if (['na', undefined, '-'].includes(weapon.AMMO_TYPE)) {
        return 0;
    }

    const isGatling = weapon.QUALITIES.includes('qualityGatling');
    const ammoHungryQuality = weapon.QUALITIES.find(q => q.startsWith('qualityAmmoHungry'));
    if (isGatling) {
        return 10;
    } else if (ammoHungryQuality) {
        const [, qualityOpt] = ammoHungryQuality.split(':');
        return Number(qualityOpt) || 1;
    }
    return 1;
};

/**
 * Check if weapon has enough ammo to attack
 */
export const hasEnoughAmmo = (
    weapon: WeaponItem,
    character: Character,
    usingItem: CharacterItem,
) => getWeaponAmmoCount(weapon, character, usingItem) >= getWeaponAmmoPerShot(weapon);

export function consumeAmmo(
    raw: RawCharacter,
    weapon: WeaponItem,
    quantity: number,
    usingItem: CharacterItem,
): CharacterItem[] {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
        throw new RangeError('Ammo cost must be a nonnegative integer');
    }
    if (quantity === 0 || !weapon.AMMO_TYPE || weapon.AMMO_TYPE === 'na') {
        return raw.items;
    }
    const origin = getOriginById(raw.origin);
    const { items } = getActiveInventory(raw.items, {
        origin,
        perks: calculatePerks(raw),
        traits: calculateTraits(raw, origin),
    });
    const available = new Set(items.filter(item => isWeaponAmmo(item, weapon, usingItem)));
    if ([...available].reduce((sum, item) => sum + item.quantity, 0) < quantity) {
        throw new RangeError('Not enough ammunition');
    }
    let remaining = quantity;
    return raw.items.flatMap(item => {
        if (!available.has(item) || remaining === 0) {
            return item;
        }
        const spent = Math.min(item.quantity, remaining);
        remaining -= spent;
        return item.quantity === spent ? [] : { ...item, quantity: item.quantity - spent };
    });
}

export function reconcileItems(prev: RawCharacter, next: RawCharacter): RawCharacter {
    const origin = getOriginById(next.origin);
    const changedArmor =
        prev.origin !== next.origin &&
        (getOriginById(prev.origin).needsSpecializedArmor || origin.needsSpecializedArmor);
    // TODO add the missing superMutantArmor category/data to complete specialized armor support.
    const categories = origin.isRobot
        ? ['robotPart']
        : origin.id === 'superMutant'
          ? ['superMutantArmor']
          : ['robotPart', 'superMutantArmor'];
    const specialized = origin.isRobot || origin.id === 'superMutant';
    const items = next.items.map(item => {
        const data = allItems[item.id];
        if (changedArmor && item.equipped && isType(data, 'apparel')) {
            if (categories.includes(data.CATEGORY) !== specialized) {
                return { ...item, equipped: false };
            }
        }
        return item;
    });

    const grants = getGrants(items, {
        origin,
        perks: calculatePerks(next),
        traits: calculateTraits(next, origin),
    });
    for (const grant of grants) {
        if (!items.some(item => item.id === grant.id && item.grantedBy === grant.grantedBy)) {
            const savedItem = { ...grant };
            delete savedItem.replaces;
            items.push(savedItem);
        }
    }

    if (origin.isRobot) {
        for (const id of origin.bodyParts) {
            if (!items.some(item => item.id === id)) {
                items.push({ id, quantity: 1, equipped: true, mods: ['modRobotPlatingStandard'] });
            }
        }
    }
    return { ...next, items };
}
