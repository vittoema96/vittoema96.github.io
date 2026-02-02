/**
 * Item utility functions for mod system
 * Handles item identification, grouping, and modification
 */

import { ApparelItem, Character, CharacterItem, DamageType, Item, ModdableItem, Range, WeaponItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase';
import type { TFunction } from 'i18next';
import { getWeaponAmmoPerShot } from '@/app/tabs/inv/utils/weaponUtils.ts';


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

// Check if weapon has enough ammo
export function hasEnoughAmmo(itemData: Item, character: Character) {
    const dataManager = getGameDatabase()
    if (!dataManager.isType(itemData, "weapon")) {return true}

    let ammoId = itemData.AMMO_TYPE
    if (ammoId === 'self') {ammoId = itemData.ID}
    if (ammoId === 'na') {return true}

    const ammoItem = character.items.find(item => item.id === ammoId)
    const currentAmmo = ammoItem ? ammoItem.quantity : 0

    const ammoStep = getWeaponAmmoPerShot(itemData)
    return currentAmmo >= ammoStep
}

/**
 * Generate unique key for item configuration
 */
export function getItemKey(item: CharacterItem) {
    return `${item.id}_${JSON.stringify(item.mods.toSorted((a, b) => a.localeCompare(b)))}`
}


// TODO should not be string, string, but defined fields
function applyWeaponEffect(modifiedData: WeaponItem, effectType: string, value: string) {
    switch (effectType) {
        case 'damageAdd':
            modifiedData.DAMAGE_RATING = (Number(modifiedData.DAMAGE_RATING) || 0) + Number(value)
            break
        case 'damageSet':
            modifiedData.DAMAGE_RATING = Number(value)
            break
        case 'fireRateAdd':
            modifiedData.FIRE_RATE = (Number(modifiedData.FIRE_RATE) || 0) + Number(value)
            break
        case 'damageTypeSet':
            modifiedData.DAMAGE_TYPE = value as DamageType
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
            modifiedData.QUALITIES ??= [];
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
            modifiedData.AMMO_CONSUMPTION = Number(value)
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
            modifiedData.PHYSICAL_RES = (Number(modifiedData.PHYSICAL_RES) || 0) + Number(value)
            break
        case 'energyResAdd':
            modifiedData.ENERGY_RES = (Number(modifiedData.ENERGY_RES) || 0) + Number(value)
            break
        case 'radiationResAdd':
            modifiedData.RADIATION_RES = (Number(modifiedData.RADIATION_RES) || 0) + Number(value)
            break
        case 'meleeResAdd': // TODO This column doesn't exist
            modifiedData.MELEE_RES = (Number(modifiedData.MELEE_RES) || 0) + Number(value)
            break
        case 'explosiveResAdd': // TODO This column doesn't exist
            modifiedData.EXPLOSIVE_RES = (Number(modifiedData.EXPLOSIVE_RES) || 0) + Number(value)
            break
        case 'fallDamageResAdd': // TODO This column doesn't exist
            modifiedData.FALL_DAMAGE_RES = (Number(modifiedData.FALL_DAMAGE_RES) || 0) + Number(value)
            break

        // Other effects
        case 'carryWeightAdd':
            modifiedData.CARRY_WEIGHT_BONUS = (Number(modifiedData.CARRY_WEIGHT_BONUS) || 0) + Number(value)
            break
        case 'unarmedDamageAdd': // TODO This column doesn't exist
            modifiedData.UNARMED_DAMAGE = (Number(modifiedData.UNARMED_DAMAGE) || 0) + Number(value)
            break
    }
    return modifiedData
}

/**
 * Parse and apply a single effect from mod EFFECTS array
 * @param {Object} modifiedData - Item data being modified
 * @param {string} effect - Effect string (e.g., "damageAdd:1", "qualityAdd:qualityMelee")
 */
export function applyEffect(modifiedData: ModdableItem, effect: string): typeof modifiedData {
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
            case 'effectAdd':
                modifiedData.EFFECTS ??= [];
                if (!modifiedData.EFFECTS.includes(value)) {
                    modifiedData.EFFECTS = [...modifiedData.EFFECTS, value]
                }
                break
            case 'effectRemove':
                if (modifiedData.EFFECTS) {
                    modifiedData.EFFECTS = modifiedData.EFFECTS.filter(e => e !== value && !e.startsWith(value + ':'))
                }
                break
        }
    }
    return modifiedData
}

/**
 * Get display name for item
 * @param item - Character item
 * @param t - Translation function from useTranslation hook
 */
export function getDisplayName(item: CharacterItem, t: TFunction) {
    if (!item) {return ''}

    // TODO custom name not implemented, but actually a good idea
    let baseName = t(item.id)

    if (item.variation) {
        baseName = `${baseName} (${t(item.variation)})`
    }

    // No mods, return base name
    const modsLength = item.mods.length - (item.mods.includes('modRobotPlatingStandard') ? 1 : 0)
    if (modsLength > 0) {
        return `${baseName} [+${modsLength}]`
    }

    // TODO i think we can keep this commented but keeping it just in case
    // Robot parts always have exactly one mod, so don't show [+1]
    //if (dataManager && dataManager.isUnacquirable(item.id))
    //    return baseName

    return baseName
}

/**
 * Check if item can be modified (has mod slots)
 */
export function canBeModified(itemData: Item) {
    const dataManager = getGameDatabase()
    if (!dataManager.isType(itemData, "weapon") && !dataManager.isType(itemData, "apparel")) {
        return false
    }
    // Check if item has AVAILABLE_MODS field and it's not empty
    return itemData.AVAILABLE_MODS.length > 0;
}
