import {
    AidItem,
    AmmoItem,
    CharacterItem,
    CustomItem,
    DamageType,
    Item,
    LegendaryEffect,
    ModItem,
} from '@/types';
import { Range, WeaponItem } from '@/data/item/weapon.schemas.ts';
import { ApparelItem } from '@/data/item/apparel.schemas.ts';
import { hasPerk, PerkId, perkRank } from '@/features/character/feats/perks/perks.ts';
import { allItems, apparel, legendaryEffects, weapon } from '@/data';
import type { TFunction } from 'i18next';
import { ItemCategory, ItemType, WeaponCategory } from '@/types/item.ts';
import { BaseItem } from '@/data/types.ts';
import { SpecialType } from '@/features/character/special/special.ts';
import { getSpecialFromSkill, SkillType } from '@/features/character/skills/skills.ts';

/**
 * Maps a weapon category to its corresponding skill.
 * Most categories map 1:1 to a skill of the same name,
 * but Bows use the Athletics skill (AGI + Athletics per DLC rules).
 */
export function getSkillForWeaponCategory(category: WeaponCategory): SkillType {
    if (category === 'bows') { return 'athletics'; }
    return category;
}

/**
 * Maps a weapon category to its corresponding SPECIAL attribute.
 * Most categories use the default SPECIAL for their skill,
 * but Bows use Agility (instead of Strength, which is athletics' default).
 */
export function getSpecialForWeaponCategory(category: WeaponCategory): SpecialType {
    if (category === 'bows') { return 'agility'; }
    return getSpecialFromSkill(getSkillForWeaponCategory(category));
}

export function removeItem(items: CharacterItem[], itemToRemove: CharacterItem) {
    return items.reduce<CharacterItem[]>((acc, item) => {
        if (isSameConfiguration(item, itemToRemove)) {
            if (item.quantity > itemToRemove.quantity) {
                acc.push({ ...item, quantity: item.quantity - itemToRemove.quantity });
            }
        } else {
            acc.push(item);
        }
        return acc;
    }, []);
}

export function addItem(items: CharacterItem[], itemToAdd: CharacterItem) {
    let foundItem = false
    const newItems = items.reduce<CharacterItem[]>((acc, item) => {
        if(isSameConfiguration(item, itemToAdd)) {
            foundItem = true
            acc.push({...item, quantity: item.quantity + itemToAdd.quantity})
        } else {
            acc.push(item);
        }
        return acc
    }, [])

    if(!foundItem) {
        newItems.push({...itemToAdd, quantity: itemToAdd.quantity})
    }
    return newItems
}

/**
 * Check if two items have the same configuration (id + mods)
 */
export function isSameConfiguration(item1: CharacterItem, item2: CharacterItem) {
    return getUniqueKey(item1) === getUniqueKey(item2);
}

const addValues: {
    (base: number, addition: string): number;
    (base: '-', addition: string): '-';
    (base: number | '-', addition: string): number | '-';
} = (base: number | '-', addition: string): any => {
    const baseValue = Number(base);
    if (Number.isNaN(baseValue)) {
        return '-';
    }
    return baseValue + (Number(addition) || 0);
}

// TODO should not be string, string, but defined fields
function applyWeaponEffect(modifiedData: WeaponItem, effectType: string, value: string) {
    switch (effectType) {
        case 'damageAdd':
            modifiedData.DAMAGE_RATING = addValues(modifiedData.DAMAGE_RATING, value)
            break
        case 'damageSet':
            modifiedData.DAMAGE_RATING = Number(value)
            break
        case 'fireRateAdd':
            modifiedData.FIRE_RATE = addValues(modifiedData.FIRE_RATE, value)
            break
        case 'damageTypeSet':
            modifiedData.DAMAGE_TYPES = [value] as DamageType[]
            break
        case 'ammoSet':
            modifiedData.AMMO_TYPE = value
            break

        case 'rangeAdd': {
            const rangeOrder: Range[] = ['rangeR', 'rangeC', 'rangeM', 'rangeL', 'rangeE']
            const currentIndex = rangeOrder.indexOf(modifiedData.RANGE)
            const newIndex = Math.max(0, Math.min(currentIndex + Number(value), rangeOrder.length - 1))
            if (rangeOrder[newIndex]) {
                modifiedData.RANGE = rangeOrder[newIndex]
            }
            break
        }

        case 'qualityAdd':
            if (!modifiedData.QUALITIES.includes(value)) {
                modifiedData.QUALITIES = [...modifiedData.QUALITIES, value]
            }
            break
        case 'qualityRemove':
            if (modifiedData.QUALITIES) {
                modifiedData.QUALITIES = modifiedData.QUALITIES.filter(q => q !== value && !q.startsWith(value + ':'))
            }
            break
        case 'ammoConsumption':
            modifiedData.AMMO_CONSUMPTION = Number(value) // TODO could use ammoHungry
            break
        case 'allowMuzzleMod':
            modifiedData.ALLOW_MUZZLE_MOD = value === 'true'
            break
        case 'rerollHitLocation':
            modifiedData.REROLL_HIT_LOCATION = value === 'true'
            break
    }
    return modifiedData
}

// TODO should not be string, string, but defined fields
function applyApparelEffect(modifiedData: ApparelItem, effectType: string, value: string) {
    switch (effectType) {
        // Resistances addition
        case 'physicalResAdd':
            modifiedData.PHYSICAL_RES = addValues(modifiedData.PHYSICAL_RES, value)
            break
        case 'energyResAdd':
            modifiedData.ENERGY_RES = addValues(modifiedData.ENERGY_RES, value)
            break
        case 'radiationResAdd':
            modifiedData.RADIATION_RES = addValues(modifiedData.RADIATION_RES, value)
            break
        case 'meleeResAdd': // TODO This column doesn't exist
            modifiedData.MELEE_RES = addValues(modifiedData.MELEE_RES, value)
            break
        case 'explosiveResAdd': // TODO This column doesn't exist
            modifiedData.EXPLOSIVE_RES = addValues(modifiedData.EXPLOSIVE_RES, value)
            break
        case 'fallDamageResAdd': // TODO This column doesn't exist
            modifiedData.FALL_DAMAGE_RES = addValues(modifiedData.FALL_DAMAGE_RES, value)
            break

        // Other effects
        case 'carryWeightAdd':
            modifiedData.CARRY_WEIGHT_BONUS = addValues(modifiedData.CARRY_WEIGHT_BONUS, value)
            break
        case 'unarmedDamageAdd': // TODO This column doesn't exist
            modifiedData.UNARMED_DAMAGE = addValues(modifiedData.UNARMED_DAMAGE, value)
            break
    }
    return modifiedData
}

type ItemMap = {
    [K in ItemType]: K extends 'weapon'
        ? WeaponItem
        : K extends 'apparel'
          ? ApparelItem
          : K extends 'aid'
            ? AidItem
            : K extends 'ammo'
              ? AmmoItem
              : K extends 'mod'
                ? ModItem
                : BaseItem;
};

export function isType<T extends ItemType>(item: Item | null | undefined, type: T): item is ItemMap[T] {
    return item?.TYPE === type;
}

/**
 * Parse and apply a single effect from mod EFFECTS array
 * @param {Object} modifiedData - Item data being modified
 * @param {string} effect - Effect string (e.g., "damageAdd:1", "qualityAdd:qualityMelee")
 */
export function applyEffect(modifiedData: WeaponItem | ApparelItem, effect: string): typeof modifiedData {
    const [effectType, ...valueParts] = effect.split(':')
    const value = valueParts.join(':') // Rejoin in case value contains ':'
    if(!effectType) {return modifiedData}

    if(isType(modifiedData, "weapon")){
        modifiedData = applyWeaponEffect(modifiedData, effectType, value)
    } else if(isType(modifiedData, "apparel")){
        modifiedData = applyApparelEffect(modifiedData, effectType, value)
    }
    if(isType(modifiedData, "apparel") || isType(modifiedData, "weapon")){
        // TODO adding and removing effects should be handled in a proper order, not how it comes
        //      there could be conflicts with mods adding and others removing effects
        switch (effectType) {
            // Quality/Effect additions
            case 'effectAdd': {
                // Check if the effect carries a numeric rating (e.g. effectPiercing:2)
                const colonIdx = value.lastIndexOf(':')
                const numericPart =
                    colonIdx === -1 ? Number.NaN : Number(value.slice(colonIdx + 1));
                if (!Number.isNaN(numericPart) && colonIdx !== -1) {
                    // Numeric effect: stack with any existing effect that shares the same prefix
                    const effectPrefix = value.slice(0, colonIdx + 1) // e.g. "effectPiercing:"
                    const existingIdx = modifiedData.EFFECTS.findIndex(e => e.startsWith(effectPrefix))
                    if (existingIdx === -1) {
                        modifiedData.EFFECTS = [...modifiedData.EFFECTS, value];
                    } else {
                        const existingNum =
                            Number(modifiedData.EFFECTS[existingIdx]!.slice(effectPrefix.length)) ||
                            0;
                        const newEffects = [...modifiedData.EFFECTS];
                        newEffects[existingIdx] =
                            `${value.slice(0, colonIdx)}:${existingNum + numericPart}`;
                        modifiedData.EFFECTS = newEffects;
                    }
                } else {
                    // Non-numeric effect: add if not already present
                    if (!modifiedData.EFFECTS.includes(value)) {
                        modifiedData.EFFECTS = [...modifiedData.EFFECTS, value]
                    }
                }
                break
            }
            case 'effectRemove':
                if (modifiedData.EFFECTS) {
                    modifiedData.EFFECTS = modifiedData.EFFECTS.filter(e => e !== value && !e.startsWith(value + ':'))
                }
                break
        }
    }
    return modifiedData
}

/** Sentinel returned by t() when a descriptor key doesn't exist */
const DESCRIPTOR_MISSING = '__NO_DESCRIPTOR__'

/**
 * Core logic for building a display name with stock rename + mod descriptors.
 * @param baseName - Starting name (already resolved)
 * @param mods - Array of mod IDs
 * @param side - Optional side key
 * @param t - Translation function
 */
function buildModdedDisplayName(
    baseName: string,
    id: string,
    mods: string[],
    side: string | undefined,
    t: TFunction
): string {
    let name = baseName

    // Stock mod rename
    const hasStockMod = mods.some(m => {
        const modData = allItems[m]
        return modData && 'SLOT_TYPE' in modData && modData.SLOT_TYPE === 'modSlotStock'
    })
    if (hasStockMod && id) {
        const stockNameKey = `${id}StockName`
        const stockName = t(stockNameKey, { defaultValue: DESCRIPTOR_MISSING, postProcess: false } as any) as string
        if (stockName !== DESCRIPTOR_MISSING) {
            name = stockName
        }
    }

    if (side) {
        name = `${name} (${t(side)})`
    }

    // Apply mod descriptors
    let displayName = name
    let modsWithoutDescriptor = 0

    for (const modId of mods) {
        if (modId === 'modRobotPlatingStandard') { continue }

        const descriptorKey = `${modId}Descriptor`
        const descriptor = t(descriptorKey, {
            name: displayName,
            defaultValue: DESCRIPTOR_MISSING,
            postProcess: false,
        } as any) as string

        if (descriptor === DESCRIPTOR_MISSING) {
            modsWithoutDescriptor++
        } else {
            displayName = descriptor
        }
    }

    if (modsWithoutDescriptor > 0) {
        return `${displayName} [+${modsWithoutDescriptor}]`
    }

    return displayName
}

/**
 * Get display name for item, applying mod descriptor templates.
 * Uses custom name if set — in that case descriptors are NOT applied,
 * only a `[+N]` suffix for equipped mods.
 */
export function getDisplayName(item: CharacterItem | CustomItem, t: TFunction) {
    if (!item) {return ''}
    const filledItem = {
        id: '',
        side: undefined,
        mods: [] as string[],
        ...item
    }

    // Custom name: show as-is with [+N] for mods
    if (filledItem.customName) {
        return filledItem.customName
    }

    return buildModdedDisplayName(
        t(filledItem.id),
        filledItem.id,
        filledItem.mods,
        filledItem.side,
        t
    )
}

/**
 * Returns the canonical display name of an item, ignoring any custom name.
 * Always applies stock rename + mod descriptors.
 * For pure custom items (no database id), returns the i18n key "customItem".
 */
export function getCanonicalDisplayName(item: CharacterItem | CustomItem, t: TFunction) {
    if (!item) {return ''}

    if (!('id' in item) || !item.id) {
        return t('customItem')
    }

    const filledItem = {
        side: undefined,
        ...item
    }

    return buildModdedDisplayName(
        t(filledItem.id),
        filledItem.id,
        filledItem.mods,
        filledItem.side,
        t
    )
}

export function isCloseCombat(category: ItemCategory) {
    return category === 'meleeWeapons' || category === 'unarmed'
}

export const UNACQUIRABLE_IDS: (keyof typeof weapon | keyof typeof apparel)[] = [
    'weaponUnarmedStrike',
    'weaponIronFist',
    'weaponWeaponStock',
    'weaponWeaponStockOneHanded',
    'weaponBayonet',
    'weaponMissileLauncherBayonet',
    'weaponShredder',
    'robotPartSensors',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters',
] as const;

export function isUnacquirable(target: string | { ID: string }): boolean {
    const id = typeof target === 'string' ? target : target.ID;
    return UNACQUIRABLE_IDS.includes(id as any);
}

const applyMods = (itemData: WeaponItem | ApparelItem, modsData: (ModItem | LegendaryEffect)[]): typeof itemData => {
    for (const handleRemove of [false, true]){
        modsData.forEach((mod) => {
            mod.EFFECTS.forEach(effect => {
                if(handleRemove === ["effectRemove", "qualityRemove"].includes(effect)) {
                    itemData = applyEffect(itemData, effect);
                }
            })
        })
    }
    return itemData;
}
const applyPerks = (
    itemData: WeaponItem | ApparelItem,
    perks: PerkId[] = []
): typeof itemData => {
    if (!isType(itemData, 'weapon')) {
        return itemData
    }

    const incisorRank = perkRank(perks, 'perkIncisor')
    if (itemData.CATEGORY === 'meleeWeapons' && incisorRank > 0) {
        itemData = applyEffect(itemData, `effectAdd:effectPiercing:${Math.min(incisorRank, 2)}`)
    }

    const hasPiercingStrike = hasPerk(perks, 'perkPiercingStrike')
    const canUsePiercingStrike =
        itemData.CATEGORY === 'unarmed' ||
        (itemData.CATEGORY === 'meleeWeapons' && itemData.IS_BLADED === true)
    if (hasPiercingStrike && canUsePiercingStrike) {
        itemData = applyEffect(itemData, 'effectAdd:effectPiercing:1')
    }

    return itemData
}

/**
 * Get item data with mods applied
 */
export function getModifiedItemData(
    characterItem: CharacterItem | null | undefined,
    perks: PerkId[] = []
): WeaponItem | ApparelItem | null {
    if(!characterItem) { return null }
    const itemData = allItems[characterItem.id]
    if (!isType(itemData, "weapon") && !isType(itemData, "apparel")) {return null}

    const baseItemData = {
        ...itemData,
        EFFECTS: [...itemData.EFFECTS],
        ...(isType(itemData, 'weapon') ? { QUALITIES: [...itemData.QUALITIES] } : {}),
    }

    if (characterItem.mods.length === 0) {
        return applyPerks(baseItemData, perks)
    }

    const modsData = [
        ...characterItem.mods.map(
                modId => allItems[modId]
            ).filter(mod => isType(mod, "mod")),
        ...characterItem.mods.map(
                modId => legendaryEffects[modId]
            ).filter(e => e !== undefined)
    ]

    const isApparel = isType(itemData, "apparel")
    let materialMultiplier = 1
    if(isApparel){
        const isTorsoArmor = itemData.LOCATIONS_COVERED.includes('torso') &&
            itemData.LOCATIONS_COVERED.length === 1
        materialMultiplier = isTorsoArmor ? 2 : 1
    }
    const getValue = (modData: ModItem | LegendaryEffect, value: number | '-') => {
        const isMaterialMod = {SLOT_TYPE: null, ...modData}.SLOT_TYPE === 'modSlotMaterial'
        const multiplier = isMaterialMod ? materialMultiplier : 1
        return (Number(value) || 0) * multiplier
    }

    const COST = itemData.COST === '-' ? '-' : modsData.reduce(
        (total, mod) => total + getValue(mod, {COST: 0, ...mod}.COST),
        Number(itemData.COST) || 0
    )
    const WEIGHT = itemData.WEIGHT === '-' ? '-' : modsData.reduce(
        (total, mod) => total + getValue(mod, {WEIGHT: 0, ...mod}.WEIGHT),
        Number(itemData.WEIGHT) || 0
    )

    return applyPerks(applyMods({
        ...baseItemData,
        COST,
        WEIGHT
    }, modsData), perks)
}

export function getUniqueKey(i: CharacterItem | CustomItem){
    const item = {
        id: 'customItem',
        side: undefined,
        equipped: undefined,
        mods: [],
        ...i
    }
    return [
        item.id,
        item.side,
        item.customName,
        item.mods.sort()
    ].filter(v => v!== undefined).join("|")

}
