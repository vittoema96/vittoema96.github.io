/**
 * Item utility functions for mod system
 * Handles item identification, grouping, and modification
 */

/**
 * Check if two items have the same configuration (id + mods)
 * @param {Object} item1 - First item
 * @param {Object} item2 - Second item
 * @returns {boolean} True if items have same configuration
 */
export function isSameConfiguration(item1, item2) {
    if (!item1 || !item2) return false
    if (item1.id !== item2.id) return false
    
    const mods1 = item1.mods || []
    const mods2 = item2.mods || []
    
    if (mods1.length !== mods2.length) return false
    
    // Sort and compare to handle different order
    const sorted1 = [...mods1].sort()
    const sorted2 = [...mods2].sort()
    
    return sorted1.every((mod, i) => mod === sorted2[i])
}

/**
 * Generate unique key for item configuration
 * @param {Object} item - Item object
 * @returns {string} Unique key
 */
export function getItemKey(item) {
    if (!item) return ''
    const mods = item.mods || []
    return `${item.id}_${JSON.stringify(mods.sort())}`
}

/**
 * Parse and apply a single effect from mod EFFECTS array
 * @param {Object} modifiedData - Item data being modified
 * @param {string} effect - Effect string (e.g., "damageAdd:1", "qualityAdd:qualityMelee")
 */
function applyEffect(modifiedData, effect) {
    const [effectType, ...valueParts] = effect.split(':')
    const value = valueParts.join(':') // Rejoin in case value contains ':'

    switch (effectType) {
        // Numeric additions
        case 'damageAdd':
            modifiedData.DAMAGE_RATING = (Number(modifiedData.DAMAGE_RATING) || 0) + Number(value)
            break
        case 'fireRateAdd':
            modifiedData.FIRE_RATE = (Number(modifiedData.FIRE_RATE) || 0) + Number(value)
            break
        case 'physicalResAdd':
            modifiedData.PHYSICAL_RES = (Number(modifiedData.PHYSICAL_RES) || 0) + Number(value)
            break
        case 'energyResAdd':
            modifiedData.ENERGY_RES = (Number(modifiedData.ENERGY_RES) || 0) + Number(value)
            break
        case 'radiationResAdd':
            modifiedData.RADIATION_RES = (Number(modifiedData.RADIATION_RES) || 0) + Number(value)
            break
        case 'carryWeightAdd':
            modifiedData.CARRY_WEIGHT_BONUS = (Number(modifiedData.CARRY_WEIGHT_BONUS) || 0) + Number(value)
            break
        case 'explosiveResAdd':
            modifiedData.EXPLOSIVE_RES = (Number(modifiedData.EXPLOSIVE_RES) || 0) + Number(value)
            break
        case 'fallDamageResAdd':
            modifiedData.FALL_DAMAGE_RES = (Number(modifiedData.FALL_DAMAGE_RES) || 0) + Number(value)
            break
        case 'unarmedDamageAdd':
            modifiedData.UNARMED_DAMAGE = (Number(modifiedData.UNARMED_DAMAGE) || 0) + Number(value)
            break
        case 'meleeResAdd':
            modifiedData.MELEE_RES = (Number(modifiedData.MELEE_RES) || 0) + Number(value)
            break

        // Range modifications
        case 'rangeIncrease':
            // Range is stored as string (rangeC, rangeM, rangeL, rangeE)
            const rangeOrder = ['rangeR', 'rangeC', 'rangeM', 'rangeL', 'rangeE']
            const currentIndex = rangeOrder.indexOf(modifiedData.RANGE)
            if (currentIndex !== -1) {
                const newIndex = Math.min(currentIndex + Number(value), rangeOrder.length - 1)
                modifiedData.RANGE = rangeOrder[newIndex]
            }
            break
        case 'rangeDecrease':
            const rangeOrder2 = ['rangeR', 'rangeC', 'rangeM', 'rangeL', 'rangeE']
            const currentIndex2 = rangeOrder2.indexOf(modifiedData.RANGE)
            if (currentIndex2 !== -1) {
                const newIndex2 = Math.max(currentIndex2 - Number(value), 0)
                modifiedData.RANGE = rangeOrder2[newIndex2]
            }
            break

        // Set operations (replace value)
        case 'damageSet':
            modifiedData.DAMAGE_RATING = Number(value)
            break
        case 'damageTypeChange':
            modifiedData.DAMAGE_TYPE = value
            break
        case 'ammoChange':
            modifiedData.AMMO_TYPE = value
            break

        // Quality/Effect additions
        case 'qualityAdd':
            if (!modifiedData.QUALITIES) modifiedData.QUALITIES = []
            if (!modifiedData.QUALITIES.includes(value)) {
                modifiedData.QUALITIES = [...modifiedData.QUALITIES, value]
            }
            break
        case 'qualityRemove':
            if (modifiedData.QUALITIES) {
                modifiedData.QUALITIES = modifiedData.QUALITIES.filter(q => q !== value && !q.startsWith(value + ':'))
            }
            break
        case 'effectAdd':
            if (!modifiedData.EFFECTS) modifiedData.EFFECTS = []
            if (!modifiedData.EFFECTS.includes(value)) {
                modifiedData.EFFECTS = [...modifiedData.EFFECTS, value]
            }
            break
        case 'effectRemove':
            if (modifiedData.EFFECTS) {
                modifiedData.EFFECTS = modifiedData.EFFECTS.filter(e => e !== value && !e.startsWith(value + ':'))
            }
            break

        // Special cases
        case 'meleeDamage':
            modifiedData.MELEE_DAMAGE = Number(value)
            break
        case 'rerollHitLocation':
            modifiedData.REROLL_HIT_LOCATION = value === 'true'
            break
        case 'ammoConsumption':
            modifiedData.AMMO_CONSUMPTION = Number(value)
            break
        case 'allowMuzzleMod':
            modifiedData.ALLOW_MUZZLE_MOD = value === 'true'
            break

        default:
            // Unknown effect type - log for debugging
            console.warn(`Unknown effect type: ${effectType} with value: ${value}`)
            break
    }
}

/**
 * Get item data with mods applied
 * @param {Object} dataManager - Data manager instance
 * @param {string} baseId - Base item ID
 * @param {string[]} mods - Array of mod IDs
 * @returns {Object} Item data with mods applied
 */
export function getModifiedItemData(dataManager, baseId, mods) {
    const baseData = dataManager.getItem(baseId)
    if (!baseData) return null

    // No mods, return base data
    if (!mods || mods.length === 0) {
        return baseData
    }

    // Clone base data
    const modifiedData = { ...baseData }

    // Apply each mod
    mods.forEach(modId => {
        const modData = dataManager.getItem(modId)
        if (!modData) return

        // Add weight from mod
        if (modData.WEIGHT) {
            modifiedData.WEIGHT =
                (Number(modifiedData.WEIGHT) || 0) +
                (Number(modData.WEIGHT) || 0)
        }

        // Add cost from mod
        if (modData.COST) {
            modifiedData.COST =
                (Number(modifiedData.COST) || 0) +
                (Number(modData.COST) || 0)
        }

        // Apply effects from EFFECTS array
        if (modData.EFFECTS && Array.isArray(modData.EFFECTS)) {
            modData.EFFECTS.forEach(effect => {
                applyEffect(modifiedData, effect)
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
    if (!newItem) return items
    
    // Find existing item with same configuration
    const existingIndex = items.findIndex(item => 
        isSameConfiguration(item, newItem)
    )
    
    const newItems = [...items]
    
    if (existingIndex !== -1) {
        // Same configuration exists, increase quantity
        newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + (newItem.quantity || 1)
        }
    } else {
        // New configuration, add as new entry
        newItems.push({
            ...newItem,
            quantity: newItem.quantity || 1
        })
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
    if (!itemToRemove) return items
    
    const existingIndex = items.findIndex(item => 
        isSameConfiguration(item, itemToRemove)
    )
    
    if (existingIndex === -1) return items
    
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
    if (!itemToModify || !modId) return items
    
    // Remove 1 from original stack
    let newItems = removeItemFromInventory(items, itemToModify, 1)
    
    // Add 1 with new mod
    const modifiedItem = {
        ...itemToModify,
        mods: [...(itemToModify.mods || []), modId],
        quantity: 1
    }
    
    newItems = addItemToInventory(newItems, modifiedItem)
    
    return newItems
}

/**
 * Remove mod from an item
 * Removes 1 from modified stack, adds 1 to unmodified stack
 * @param {Object[]} items - Current inventory items
 * @param {Object} itemToModify - Item to modify
 * @param {string} modId - Mod ID to remove
 * @returns {Object[]} Updated inventory
 */
export function removeModFromItem(items, itemToModify, modId) {
    if (!itemToModify || !modId) return items
    
    // Check if item has this mod
    if (!itemToModify.mods || !itemToModify.mods.includes(modId)) {
        return items
    }
    
    // Remove 1 from modified stack
    let newItems = removeItemFromInventory(items, itemToModify, 1)
    
    // Add 1 without the mod
    const unmodifiedItem = {
        ...itemToModify,
        mods: (itemToModify.mods || []).filter(m => m !== modId),
        quantity: 1
    }
    
    newItems = addItemToInventory(newItems, unmodifiedItem)
    
    return newItems
}

/**
 * Get display name for item
 * @param {Object} item - Item object
 * @param {Function} t - Translation function
 * @returns {string} Display name
 */
export function getDisplayName(item, t) {
    if (!item) return ''
    
    // Use custom name if available
    if (item.customName) {
        return item.customName
    }
    
    // Get base name
    const baseId = item.id.split('_')[0]
    const baseName = t(baseId)
    
    // No mods, return base name
    if (!item.mods || item.mods.length === 0) {
        return baseName
    }
    
    // Show mod count
    return `${baseName} [+${item.mods.length}]`
}

/**
 * Check if item has mods applied
 * @param {Object} item - Item object
 * @returns {boolean} True if item has mods
 */
export function hasMods(item) {
    return item && item.mods && item.mods.length > 0
}

/**
 * Get available mods for an item
 * @param {Object} itemData - Item data from CSV
 * @returns {string[]} Array of available mod IDs
 */
export function getAvailableModsForItem(itemData) {
    if (!itemData || !itemData.AVAILABLE_MODS) return []
    return itemData.AVAILABLE_MODS
}

/**
 * Check if mod can be applied to item (slot validation)
 * @param {Object} item - Item object
 * @param {Object} modData - Mod data from CSV
 * @returns {boolean} True if mod can be applied
 */
export function canApplyMod(item, modData) {
    if (!item || !modData) return false

    // Check if item already has a mod in the same slot
    const modSlot = modData.SLOT
    if (!modSlot) return true // No slot restriction

    const itemMods = item.mods || []

    // TODO: Check if any existing mod uses the same slot
    // This requires loading all mod data, which we'll implement later

    return true
}

/**
 * Check if item can be modified (has mod slots)
 * @param {Object} itemData - Item data from CSV
 * @returns {boolean} True if item can be modified
 */
export function canBeModified(itemData) {
    if (!itemData) return false

    // Check if item has AVAILABLE_MODS field and it's not empty
    if (itemData.AVAILABLE_MODS && Array.isArray(itemData.AVAILABLE_MODS) && itemData.AVAILABLE_MODS.length > 0) {
        return true
    }

    return false
}

