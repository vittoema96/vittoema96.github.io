/**
 * Item utility functions for mod system
 * Handles item identification, grouping, and modification
 */

import { CharacterItem, CustomItem, DamageType } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase';
import { GameDatabase } from '@/services/GameDatabase';
import type { TFunction } from 'i18next';
import { Range, WeaponItem } from '@/schemas/items/weaponSchemas.ts';
import { ApparelItem } from '@/schemas/items/apparelSchemas.ts';
import { ItemCategory, WeaponCategory } from '@/types/item.ts';
import { getSpecialFromSkill, SkillType, SpecialType } from '@/services/character/utils.ts';


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
    if (item1.id !== item2.id) {return false}
    if(item1.variation !== item2.variation) {return false}
    const mods1 = new Set(item1.mods)
    const mods2 = new Set(item2.mods)
    if (mods1.size !== mods2.size) {return false}
    return mods1.isSubsetOf(mods2);
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

/**
 * Parse and apply a single effect from mod EFFECTS array
 * @param {Object} modifiedData - Item data being modified
 * @param {string} effect - Effect string (e.g., "damageAdd:1", "qualityAdd:qualityMelee")
 */
export function applyEffect(modifiedData: WeaponItem | ApparelItem, effect: string): typeof modifiedData {
    const dataManager = getGameDatabase()
    const [effectType, ...valueParts] = effect.split(':')
    const value = valueParts.join(':') // Rejoin in case value contains ':'
    if(!effectType) {return modifiedData}

    if(dataManager.isType(modifiedData, "weapon")){
        modifiedData = applyWeaponEffect(modifiedData, effectType, value)
    } else if(dataManager.isType(modifiedData, "apparel")){
        modifiedData = applyApparelEffect(modifiedData, effectType, value)
    }
    if(dataManager.isType(modifiedData, "apparel") || dataManager.isType(modifiedData, "weapon")){
        // TODO adding and removing effects should be handled in a proper order, not how it comes
        //      there could be conflicts with mods adding and others removing effects
        switch (effectType) {
            // Quality/Effect additions
            case 'effectAdd': {
                // Check if the effect carries a numeric rating (e.g. effectPiercing:2)
                const colonIdx = value.lastIndexOf(':')
                const numericPart = colonIdx === -1 ? NaN : Number(value.slice(colonIdx + 1));
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
 * Get display name for item, applying mod descriptor templates.
 *
 * Mod descriptors are i18next templates with `{{name}}` interpolation
 * (e.g. EN: "Advanced {{name}}", IT: "{{name}} Avanzato").
 * Descriptors are applied sequentially — each mod's template receives
 * the result of the previous one as `{{name}}`.
 *
 * Mods without a descriptor (key missing in locale) are counted and
 * shown as `[+N]` suffix.
 *
 * @param item - Character item
 * @param t - Translation function from useTranslation hook
 */
export function getDisplayName(item: CharacterItem | CustomItem, t: TFunction) {
    if (!item) {return ''}
    const filledItem = {
        id: '',
        variation: undefined,
        mods: [] as string[],
        ...item
    }

    // Use custom name if set, otherwise use translated name
    let baseName = filledItem.customName || t(filledItem.id)

    // Stock mod rename: certain pistols change name when a stock mod is applied
    // (e.g. "Laser Pistol" → "Laser Rifle" when a mod with SLOT_TYPE "modSlotStock" is equipped)
    if (!filledItem.customName) {
        const hasStockMod = filledItem.mods.some(m => {
            const modData = GameDatabase.getItem(m)
            return modData && 'SLOT_TYPE' in modData && modData.SLOT_TYPE === 'modSlotStock'
        })
        if (hasStockMod) {
            const stockNameKey = `${filledItem.id}StockName`
            const stockName = t(stockNameKey, { defaultValue: DESCRIPTOR_MISSING, postProcess: false } as any) as string
            if (stockName !== DESCRIPTOR_MISSING) {
                baseName = stockName
            }
        }
    }

    if (filledItem.variation && !filledItem.customName) {
        baseName = `${baseName} (${t(filledItem.variation)})`
    }

    // Apply mod descriptors to progressively build the display name.
    // Descriptors are skipped when the item has a custom name — the user
    // chose that name explicitly and it should not be altered by mods.
    let displayName = baseName
    let modsWithoutDescriptor = 0

    if (!filledItem.customName) {
        for (const modId of filledItem.mods) {
            if (modId === 'modRobotPlatingStandard') {
                continue;
            }

            const descriptorKey = `${modId}Descriptor`;
            const descriptor = t(descriptorKey, {
                name: displayName,
                defaultValue: DESCRIPTOR_MISSING,
                postProcess: false,
            } as any) as string;

            if (descriptor === DESCRIPTOR_MISSING) {
                modsWithoutDescriptor++;
            } else {
                displayName = descriptor;
            }
        }
    }

    if (modsWithoutDescriptor > 0) {
        return `${displayName} [+${modsWithoutDescriptor}]`
    }

    return displayName
}

export function isCloseCombat(category: ItemCategory) {
    return category === 'meleeWeapons' || category === 'unarmed'
}
