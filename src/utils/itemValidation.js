import { isMrHandyWeapon, isWeapon, isApparel } from '../js/gameRules.js'

/**
 * Item validation and restriction utilities
 * Centralized logic for checking item equip restrictions and validations
 */

/**
 * Check if an item can be equipped by a character
 * @param {Object} character - Character object
 * @param {Object} characterItem - Character's item instance
 * @param {Object} itemData - Item data from data manager
 * @returns {Object} {canEquip: boolean, reason: string}
 */
export const canEquipItem = (character, characterItem, itemData) => {
    if (!itemData?.LOCATIONS_COVERED) {
        return { canEquip: false, reason: 'This item cannot be equipped.' }
    }

    const isMrHandy = character.origin === 'mrHandy'
    const itemIsMrHandyWeapon = isMrHandyWeapon(characterItem.id)
    const itemIsWeapon = isWeapon(characterItem.type)
    const itemIsApparel = isApparel(characterItem.type)
    const itemIsRobotPart = characterItem.type === 'robotParts'

    // Mr Handy restrictions
    if (isMrHandy) {
        // Mr Handy can only equip Mr Handy exclusive weapons
        if (itemIsWeapon && !itemIsMrHandyWeapon) {
            return {
                canEquip: false,
                reason: 'Mr Handy cannot equip regular weapons. Only Mr Handy exclusive weapons can be used.'
            }
        }
        // Mr Handy cannot equip any apparel except robot parts
        if (itemIsApparel && !itemIsRobotPart) {
            return {
                canEquip: false,
                reason: 'Mr Handy cannot equip armor or clothing.'
            }
        }
    } else {
        // Non-Mr Handy restrictions
        // Non-Mr Handy characters cannot equip Mr Handy exclusive weapons
        if (itemIsMrHandyWeapon) {
            return {
                canEquip: false,
                reason: 'Only Mr Handy can use this weapon.'
            }
        }
        // Non-Mr Handy characters cannot equip robot parts
        if (itemIsRobotPart) {
            return {
                canEquip: false,
                reason: 'Only Mr Handy can equip robot parts.'
            }
        }
    }

    return { canEquip: true, reason: '' }
}

/**
 * Check if an item can be unequipped
 * @param {string} itemId - Item ID (base ID without side suffix)
 * @param {Object} dataManager - Data manager instance
 * @returns {Object} {canUnequip: boolean, reason: string}
 */
export const canUnequipItem = (itemId, dataManager) => {
    const [baseId] = itemId.split('_')
    
    if (dataManager.isUnacquirable(baseId)) {
        return {
            canUnequip: false,
            reason: 'Cannot unequip this item!'
        }
    }

    return { canUnequip: true, reason: '' }
}

/**
 * Check if an item can be sold
 * @param {string} itemId - Item ID (base ID without side suffix)
 * @param {Object} dataManager - Data manager instance
 * @returns {Object} {canSell: boolean, reason: string}
 */
export const canSellItem = (itemId, dataManager) => {
    const [baseId] = itemId.split('_')
    
    if (dataManager.isUnacquirable(baseId)) {
        return {
            canSell: false,
            reason: 'Cannot sell this item!'
        }
    }

    return { canSell: true, reason: '' }
}

/**
 * Check if an item can be deleted
 * @param {string} itemId - Item ID (base ID without side suffix)
 * @param {Object} dataManager - Data manager instance
 * @returns {Object} {canDelete: boolean, reason: string}
 */
export const canDeleteItem = (itemId, dataManager) => {
    const [baseId] = itemId.split('_')
    
    if (dataManager.isUnacquirable(baseId)) {
        return {
            canDelete: false,
            reason: 'Cannot delete this item!'
        }
    }

    return { canDelete: true, reason: '' }
}

/**
 * Get SPECIAL stat maximum based on character origin
 * @param {string} specialStat - SPECIAL stat name
 * @param {string} origin - Character origin
 * @returns {number} Maximum value for the stat
 */
export const getSpecialMax = (specialStat, origin) => {
    if (origin === 'superMutant') {
        // Super Mutant has different maximums
        if (specialStat === 'strength' || specialStat === 'endurance') {
            return 12
        } else if (specialStat === 'intelligence' || specialStat === 'charisma') {
            return 6
        } else {
            return 10 // Perception, Agility, Luck
        }
    }
    
    // All other origins: max 10 for all SPECIAL
    return 10
}

