import type { Character, CharacterItem, CustomItem, RawCharacter } from '@/types';
import type { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { allItems, apparel } from '@/data';
import { isSameConfiguration, isType } from '@/features/item/utils.ts';
import { getGrantedItems } from '../feats/rules.ts';
import { calculatePerks, type PerkId } from '../feats/perks.ts';
import { calculateTraits } from '../feats/traits.ts';
import type { FeatSelection } from '../feats/types.ts';
import { getOriginById } from '../origins/registry.ts';
import { getModifiedItemData, canEquipApparel } from './equipment.ts';

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

function getUnarmedStrike(selection: FeatSelection): CharacterItem | undefined {
    return selection.origin?.isRobot
        ? undefined
        : { id: 'weaponUnarmedStrike', quantity: 1, mods: [], equipped: false };
}

function getGrants(items: CharacterItem[], selection: FeatSelection) {
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

    const gunBashCondition = (twoHandedCondition: boolean, itemData: WeaponItem) => {
        const hasGunBash = ['bigGuns', 'smallGuns', 'energyWeapons'].includes(itemData.CATEGORY);
        const isTwoHanded = itemData.QUALITIES.includes('qualityTwoHanded');
        return hasGunBash && twoHandedCondition === isTwoHanded;
    };
    if (unarmed && !items.some(item => item.id === unarmed.id)) {
        resultItems.push(unarmed);
    }

    for (const item of items) {
        const data = getModifiedItemData(item, perks);
        if (!isType(data, 'weapon')) {
            continue;
        }
        addSpecialItem(item, 'weaponWeaponStockOneHanded', gunBashCondition(false, data));
        addSpecialItem(item, 'weaponWeaponStock', gunBashCondition(true, data));
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

export const getWeaponAmmoCount = (
    weapon: WeaponItem,
    character: Character,
    usingItem: CharacterItem,
) => {
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

export const getWeaponAmmoPerShot = (weapon: WeaponItem) => {
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

export const hasEnoughAmmo = (weapon: WeaponItem, character: Character, usingItem: CharacterItem) =>
    getWeaponAmmoCount(weapon, character, usingItem) >= getWeaponAmmoPerShot(weapon);

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

/**
 * Normalizes saved equipment when loading or updating a character.
 *
 * Incompatible ordinary apparel is unequipped without losing its configuration.
 * Intrinsic robot parts are equipped in the save while active; when hidden for
 * another origin, their saved state is preserved.
 */
export function reconcileItems(next: RawCharacter): RawCharacter;
/** @deprecated Pass only the character to reconcile. The first argument is retained for compatibility. */
export function reconcileItems(previous: RawCharacter, next: RawCharacter): RawCharacter;
export function reconcileItems(previous: RawCharacter, next = previous): RawCharacter {
    const origin = getOriginById(next.origin);
    const perks = calculatePerks(next);
    const traits = calculateTraits(next, origin);
    const selection = { origin, perks, traits };
    const intrinsicPartIds = new Set<string>(origin.isRobot ? origin.bodyParts : []);
    const items = next.items.map(item => {
        const data = allItems[item.id];
        if (isType(data, 'apparel') && data.CATEGORY === 'robotPart') {
            return intrinsicPartIds.has(item.id) && !item.equipped
                ? { ...item, equipped: true }
                : item;
        }
        if (item.equipped && isType(data, 'apparel') && !canEquipApparel(data, selection)) {
            return { ...item, equipped: false };
        }
        return item;
    });

    const grants = getGrants(items, selection);
    for (const grant of grants) {
        if (!items.some(item => item.id === grant.id && item.grantedBy === grant.grantedBy)) {
            const savedItem = { ...grant };
            delete savedItem.replaces;
            items.push(savedItem);
        }
    }

    for (const id of intrinsicPartIds) {
        if (!items.some(item => item.id === id)) {
            items.push({ id, quantity: 1, equipped: true, mods: ['modRobotPlatingStandard'] });
        }
    }
    return { ...next, items };
}
