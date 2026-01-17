/**
 * Item utility functions for mod system
 * Handles item identification, grouping, and modification
 */

import {
    ApparelItem,
    Character,
    CharacterItem,
    DamageType,
    Item,
    Range,
    WeaponItem,
} from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase';
import type { TFunction } from 'i18next';

/**
 * Check if two items have the same configuration (id + mods)
 */
export function isSameConfiguration(item1: CharacterItem, item2: CharacterItem) {
    if (item1.id !== item2.id) {return false}
    const mods1 = new Set(item1.mods)
    const mods2 = new Set(item2.mods)
    if (mods1.size !== mods2.size) {return false}
    return mods1.isSubsetOf(mods2);
}

// Check if weapon has enough ammo
export function hasEnoughAmmo(itemData: Item, character: Character) {
    const dataManager = getGameDatabase()
    if (!dataManager.isType(itemData, "weapon")) {return true}
    const weaponType = itemData.CATEGORY
    if (weaponType === 'meleeWeapons' || weaponType === 'unarmed') {return true}

    let ammoId = itemData.AMMO_TYPE
    if (ammoId === 'self') {ammoId = itemData.ID}
    if (ammoId === 'na') {return true}

    const ammoItem = character.items.find(item => item.id === ammoId)
    const currentAmmo = ammoItem ? ammoItem.quantity : 0

    const isGatling = (itemData.QUALITIES || []).includes('qualityGatling')
    const ammoStep = isGatling ? 10 : 1

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
        case 'damageTypeChange':
            modifiedData.DAMAGE_TYPE = value as DamageType
            break
        case 'ammoChange':
            modifiedData.AMMO_TYPE = value
            break

        case 'rangeIncrease': {
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
        case 'damageReductionPhysicalAdd':
            modifiedData.PHYSICAL_RES = (Number(modifiedData.PHYSICAL_RES) || 0) + Number(value)
            break
        case 'energyResAdd':
        case 'damageReductionEnergyAdd':
            modifiedData.ENERGY_RES = (Number(modifiedData.ENERGY_RES) || 0) + Number(value)
            break
        case 'radiationResAdd':
        case 'damageReductionRadiationAdd':
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
export function applyEffect(modifiedData: Item, effect: string): typeof modifiedData {
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
 * Add item to inventory, grouping with existing items if same configuration
 * @param {Object[]} items - Current inventory items
 * @param {Object} newItem - Item to add
 * @returns {Object[]} Updated inventory
 */
export function addItemToInventory(items, newItem) {
    if (!newItem) {return items}

    // Find existing item with same configuration
    const existingIndex = items.findIndex(item =>
        isSameConfiguration(item, newItem)
    )

    const newItems = [...items]

    if (existingIndex === -1) {
        // New configuration, add as new entry
        newItems.push({
            ...newItem
        })
    } else {
        // Same configuration exists, increase quantity
        newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + newItem.quantity
        }
    }

    return newItems
}

/**
 * Remove item from inventory
 * @param {Object[]} items - Current inventory items
 * @param {Object} itemToRemove - Item to remove
 * @param {number} quantityToRemove - Quantity to remove (default: 1)
 * @returns {Object[]} Updated inventory
 */
export function removeItemFromInventory(items, itemToRemove, quantityToRemove = 1) {
    if (!itemToRemove) {return items}

    const existingIndex = items.findIndex(item =>
        isSameConfiguration(item, itemToRemove)
    )

    if (existingIndex === -1) {return items}

    const newItems = [...items]
    newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity - quantityToRemove
    }

    // Remove entry if quantity reaches 0
    if (newItems[existingIndex].quantity <= 0) {
        newItems.splice(existingIndex, 1)
    }

    return newItems
}

/**
 * Apply mod to an item
 * Removes 1 from original stack, adds 1 to modified stack
 * @param {Object[]} items - Current inventory items
 * @param {Object} itemToModify - Item to modify
 * @param {string} modId - Mod ID to apply
 * @returns {Object[]} Updated inventory
 */
export function applyModToItem(items, itemToModify, modId) {
    if (!itemToModify || !modId) {return items}

    // Remove 1 from original stack
    let newItems = removeItemFromInventory(items, itemToModify, 1)

    // Add 1 with new mod
    const modifiedItem = {
        ...itemToModify,
        mods: [...itemToModify.mods, modId],
        quantity: 1
    }

    newItems = addItemToInventory(newItems, modifiedItem)

    return newItems
}

/**
 * Remove mod from an item
 * Removes 1 from modified stack, adds 1 to unmodified stack
 */
export function removeModFromItem(items, itemToModify, modId) {
    if (!itemToModify || !modId) {return items}

    // Check if item has this mod
    if (!itemToModify.mods.includes(modId)) {
        return items
    }

    // Remove 1 from modified stack
    let newItems = removeItemFromInventory(items, itemToModify, 1)

    // Add 1 without the mod
    const unmodifiedItem = {
        ...itemToModify,
        mods: itemToModify.mods.filter(m => m !== modId),
        quantity: 1
    }

    newItems = addItemToInventory(newItems, unmodifiedItem)

    return newItems
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
    if (item.mods.length > 0) {
        return `${baseName} [+${item.mods.length}]`
    }

    // TODO i think we can keep this commented but keeping it just in case
    // Robot parts always have exactly one mod, so don't show [+1]
    //if (dataManager && dataManager.isUnacquirable(item.id))
    //    return baseName

    return baseName
}

/**
 * Check if item can be modified (has mod slots)
 * @param {Object} itemData - Item data from CSV
 * @returns {boolean} True if item can be modified
 */
export function canBeModified(itemData: Item) {
    const dataManager = getGameDatabase()
    if (!dataManager.isType(itemData, "weapon") && !dataManager.isType(itemData, "apparel")) {
        return false
    }

    // Check if item has AVAILABLE_MODS field and it's not empty
    return !!(itemData.AVAILABLE_MODS && Array.isArray(itemData.AVAILABLE_MODS) && itemData.AVAILABLE_MODS.length > 0);
}
