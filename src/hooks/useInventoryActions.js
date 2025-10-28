import { useCharacter } from '../contexts/CharacterContext.jsx'
import { usePopup } from '../contexts/PopupContext.jsx'
import { useDataManager } from './useDataManager.js'
import {
    applyModToItem as applyModUtil,
    removeModFromItem as removeModUtil,
    getModifiedItemData,
    isSameConfiguration
} from '../utils/itemUtils.js'
import {
    canEquipItem,
    canUnequipItem,
    canSellItem,
    canDeleteItem
} from '../utils/itemValidation.js'
import {
    mapItemLocations,
    getItemLayer,
    hasLocationOverlap,
    hasLayerConflict
} from '../utils/bodyLocations.js'

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { character, updateCharacter } = useCharacter()
    const { showConfirm, showAlert, showTradeItemPopup } = usePopup()
    const dataManager = useDataManager()

    const sellItem = (characterItem, itemData) => {
        // Validate if item can be sold
        const validation = canSellItem(characterItem.id, dataManager)
        if (!validation.canSell) {
            showAlert(validation.reason)
            return
        }

        // Use modified data for price calculation
        const baseId = characterItem.id.split('_')[0]
        const modifiedData = getModifiedItemData(dataManager, baseId, characterItem.mods)

        showTradeItemPopup(characterItem, modifiedData, (quantity, price) => {
            const total = Math.floor(quantity * price)

            // Remove sold quantity from inventory
            const updatedItems = character.items?.map(item => {
                if (isSameConfiguration(item, characterItem)) {
                    const newQuantity = item.quantity - quantity
                    if (newQuantity <= 0) {
                        return null // Will be filtered out
                    }
                    return { ...item, quantity: newQuantity }
                }
                return item
            }).filter(item => item !== null) || []

            // Add caps to character
            const newCaps = (character.caps || 0) + total

            updateCharacter({
                items: updatedItems,
                caps: newCaps
            })

            showAlert(`Sold for ${total} caps!`)
        })
    }

    const deleteItem = (characterItem, itemData) => {
        // Validate if item can be deleted
        const validation = canDeleteItem(characterItem.id, dataManager)
        if (!validation.canDelete) {
            showAlert(validation.reason)
            return
        }

        showConfirm(
            `Delete ${characterItem.quantity}x ${itemData?.ID || characterItem.id}? This action cannot be undone.`,
            () => {
                // Remove item from inventory
                const updatedItems = character.items?.filter(item =>
                    !isSameConfiguration(item, characterItem)
                ) || []

                updateCharacter({
                    items: updatedItems
                })

                showAlert('Item deleted.')
            }
        )
    }

    const equipItem = (characterItem, itemData) => {
        // Validate if item can be equipped
        const validation = canEquipItem(character, characterItem, itemData)
        if (!validation.canEquip) {
            showAlert(validation.reason)
            return
        }

        const isCurrentlyEquipped = characterItem.equipped === true
        const [, side] = characterItem.id.split('_')
        const itemLayer = getItemLayer(characterItem.type)

        // Get locations this item covers
        const locations = mapItemLocations(itemData.LOCATIONS_COVERED, side)

        if (isCurrentlyEquipped) {
            // Validate if item can be unequipped
            const unequipValidation = canUnequipItem(characterItem.id, dataManager)
            if (!unequipValidation.canUnequip) {
                showAlert(unequipValidation.reason)
                return
            }

            // Unequip the item
            const updatedItems = character.items.map(item => {
                if (item.id === characterItem.id) {
                    return { ...item, equipped: false }
                }
                return item
            })
            updateCharacter({ items: updatedItems })
        } else {
            // Equip the item - first unequip any items in the same locations
            const updatedItems = character.items.map(item => {
                // Skip the item we're equipping
                if (item.id === characterItem.id) {
                    return { ...item, equipped: true }
                }

                // Check if this item conflicts with any of the locations
                const [otherItemId, otherSide] = item.id.split('_')
                const otherItemData = dataManager.getItem(otherItemId)
                if (!otherItemData || !otherItemData.LOCATIONS_COVERED || !item.equipped) {
                    return item
                }

                const otherItemLayer = getItemLayer(item.type)

                // Get locations covered by this other item
                const otherLocations = mapItemLocations(otherItemData.LOCATIONS_COVERED, otherSide)

                // Check for location conflicts
                if (!hasLocationOverlap(locations, otherLocations)) {
                    return item // No location conflict, keep as is
                }

                // There's a location conflict - check layer compatibility
                if (hasLayerConflict(itemLayer, otherItemLayer)) {
                    return { ...item, equipped: false }
                }

                return item
            })

            updateCharacter({ items: updatedItems })
        }
    }

    const useItem = (characterItem) => {
        // TODO: Implement use logic for consumables
        console.log('Use item:', characterItem.id)
        showAlert('Use functionality coming soon!')
    }

    const applyMod = (characterItem, modId) => {
        if (!characterItem || !modId) {
            showAlert('Invalid item or mod')
            return
        }

        // Apply mod using utility function
        const updatedItems = applyModUtil(character.items, characterItem, modId)

        updateCharacter({ items: updatedItems })
        showAlert('Mod applied successfully!')
    }

    const removeMod = (characterItem, modId) => {
        if (!characterItem || !modId) {
            showAlert('Invalid item or mod')
            return
        }

        // Check if item has this mod
        if (!characterItem.mods || !characterItem.mods.includes(modId)) {
            showAlert('Item does not have this mod')
            return
        }

        // Remove mod using utility function
        const updatedItems = removeModUtil(character.items, characterItem, modId)

        updateCharacter({ items: updatedItems })
        showAlert('Mod removed successfully!')
    }

    return {
        sellItem,
        deleteItem,
        equipItem,
        useItem,
        applyMod,
        removeMod
    }
}
