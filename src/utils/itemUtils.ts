/**
 * Item utility functions for mod system
 * Handles item identification, grouping, and modification
 */

import {CharacterItem, Item, ModItem, Range} from "@/types";
import {useGameDatabase} from "@/hooks/useGameDatabase.ts";
import type { TFunction } from 'i18next';

/**
 * Check if two items have the same configuration (id + mods)
 */
export function isSameConfiguration(item1: CharacterItem, item2: CharacterItem) {
    if (item1.id !== item2.id) {return false}

    if (item1.mods.length !== item2.mods.length) {return false}

    // TODO might improve??
    // Sort and compare to handle different order
    const sorted1 = [...item1.mods].toSorted((a, b) => a.localeCompare(b))
    const sorted2 = [...item2.mods].toSorted((a, b) => a.localeCompare(b))

    return sorted1.every((mod, i) => mod === sorted2[i])
}

/**
 * Generate unique key for item configuration
 */
export function getItemKey(item: CharacterItem) {
    return `${item.id}_${JSON.stringify(item.mods.toSorted((a, b) => a.localeCompare(b)))}`
}

/**
 * Parse and apply a single effect from mod EFFECTS array
 * @param {Object} modifiedData - Item data being modified
 * @param {string} effect - Effect string (e.g., "damageAdd:1", "qualityAdd:qualityMelee")
 */
function applyEffect(modifiedData: Item, effect: string) {
    const dataManager = useGameDatabase()
    const [effectType, ...valueParts] = effect.split(':')
    const value = valueParts.join(':') // Rejoin in case value contains ':'
    if(dataManager.isType(modifiedData, "weapon")){
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
                modifiedData.DAMAGE_TYPE = value
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

            default:
                // Unknown effect type - log for debugging
                console.warn(`Unknown effect type: ${effectType} with value: ${value}`)
                break
        }
    } else if (dataManager.isType(modifiedData, "apparel")){
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

            default:
                // Unknown effect type - log for debugging
                console.warn(`Unknown effect type: ${effectType} with value: ${value}`)
                break
        }
    }

    if(dataManager.isType(modifiedData, "apparel") || dataManager.isType(modifiedData, "weapon")) {
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
    switch (effectType) {

        // Special cases
        case 'meleeDamage':
            // meleeDamage is handled separately by creating a melee weapon item
            // See modCreatesMeleeWeapon() and getMeleeWeaponForMod()
            // This effect is ignored here
            break

        default:
            // Unknown effect type - log for debugging
            console.warn(`Unknown effect type: ${effectType} with value: ${value}`)
            break
    }
}

/**
 * Get item data with mods applied
 */
// FIXME this method is all wrong. we should provide an id and get the item data from there (i think)
//          Conduct an investigation on where and why it is used and decide from there
export function getModifiedItemData(characterItem: CharacterItem): Item | null {
    const dataManager = useGameDatabase()
    const baseData = dataManager.getItem(characterItem.id)
    // TODO i do not like this
    if(!baseData)
        return null

    // No mods, return base data
    if (characterItem.mods.length === 0) {
        return baseData
    }

    // Clone base data
    const modifiedData = {
        ...baseData,
        MOD_NAMES: [] as string[],
        MOD_EFFECTS: [] as string[],
    }

    const isApparel = dataManager.isType(baseData, "apparel")
    let materialMultiplier = 1

    if(isApparel) {
        // Check if this is a torso armor piece
        const isTorsoArmor = baseData.LOCATIONS_COVERED?.length === 1 &&
                                      baseData.LOCATIONS_COVERED[0] === 'torso'
        materialMultiplier = isTorsoArmor ? 2 : 1
    }
    // Apply each mod
    characterItem.mods.forEach(modId => {
        const modData = dataManager.getItem(modId) as ModItem
        if (!modData) {return}

        // Add mod ID to MOD_NAMES for display as tag
        modifiedData.MOD_NAMES.push(modId)

        // Check if this is a Material mod applied to Torso armor
        // Material mods on Torso have doubled weight and cost
        const isMaterialMod = modData.SLOT_TYPE === 'modSlotMaterial'
        const multiplier = isMaterialMod ? materialMultiplier : 1

        // Add weight from mod (doubled for Material mods on Torso)
        if (modData.WEIGHT) {
            modifiedData.WEIGHT =
                (Number(modifiedData.WEIGHT) || 0) +
                (Number(modData.WEIGHT) || 0) * multiplier
        }

        // Add cost from mod (doubled for Material mods on Torso)
        if (modData.COST) {
            modifiedData.COST =
                (Number(modifiedData.COST) || 0) +
                (Number(modData.COST) || 0) * multiplier
        }

        // Apply effects from EFFECTS array
        if (modData.EFFECTS) {
            modData.EFFECTS.forEach(effect => {
                applyEffect(modifiedData, effect)

                // Track effects added via effectAdd/qualityAdd for display
                const [effectType, ...valueParts] = effect.split(':')
                const value = valueParts.join(':')

                if (effectType === 'effectAdd' || effectType === 'qualityAdd') {
                    // Add to MOD_EFFECTS for display purposes
                    if (!modifiedData.MOD_EFFECTS.includes(value)) {
                        modifiedData.MOD_EFFECTS.push(value)
                    }
                }
            })
        }
    })

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
    const baseName = t(item.id)

    // No mods, return base name
    if (item.mods.length === 0) {
        return baseName
    }

    // TODO i think we can keep this commented but keeping it just in case
    // Robot parts always have exactly one mod, so don't show [+1]
    //if (dataManager && dataManager.isUnacquirable(item.id))
    //    return baseName

    // Show mod count
    return `${baseName} [+${item.mods.length}]`
}

/**
 * Check if item can be modified (has mod slots)
 * @param {Object} itemData - Item data from CSV
 * @returns {boolean} True if item can be modified
 */
export function canBeModified(itemData: Item) {
    if (!itemData) {return false}

    // Check if item has AVAILABLE_MODS field and it's not empty
    // TODO should work as is, but we could fix the error...
    return !!(itemData.AVAILABLE_MODS && Array.isArray(itemData.AVAILABLE_MODS) && itemData.AVAILABLE_MODS.length > 0);
}
