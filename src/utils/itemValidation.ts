import {ORIGINS} from "@/utils/characterSheet.ts";
import {Character, Item} from "@/types";
import {getGameDatabase} from "@/hooks/getGameDatabase.ts";

/**
 * Item validation and restriction utilities
 * Centralized logic for checking item equip restrictions and validations
 */

/**
 * Check if an item can be equipped by a character
 */
export const canEquipItem = (character: Character, itemData: Item) => {
    const dataManager = getGameDatabase()
    if(dataManager.isType(itemData, "apparel")) {
        const isMrHandy = character.origin === ORIGINS.MR_HANDY
        const itemIsRobotPart = itemData.CATEGORY === 'robotPart'

        if(itemIsRobotPart && !isMrHandy){
            return { canEquip: false, reason: isMrHandy ?
                    'Mr Handy cannot equip armor or clothing.'
                    : 'Only Mr Handy can equip robot parts.' }
        }

        return { canEquip: true, reason: '' }
    }
    return { canEquip: false, reason: 'Cannot equip this item!' }

}

/**
 * Check if an item can be unequipped
 */
export const canUnequipItem = (itemId: string) => {
    const dataManager = getGameDatabase()
    if (dataManager.isUnacquirable(itemId)) {
        return {
            canUnequip: false,
            reason: 'Cannot unequip this item!'
        }
    }

    return { canUnequip: true, reason: '' }
}

/**
 * Check if an item can be sold
 */
export const canSellItem = (itemId: string) => {
    const dataManager = getGameDatabase()
    if (dataManager.isUnacquirable(itemId)) {
        return {
            canSell: false,
            reason: 'Cannot sell this item!'
        }
    }

    return { canSell: true, reason: '' }
}

/**
 * Check if an item can be deleted
 */
export const canDeleteItem = (itemId: string) => {
    const dataManager = getGameDatabase()
    if (dataManager.isUnacquirable(itemId)) {
        return {
            canDelete: false,
            reason: 'Cannot delete this item!'
        }
    }

    return { canDelete: true, reason: '' }
}

