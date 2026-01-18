import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {
    isSameConfiguration
} from '@/utils/itemUtils.ts'
import {
    hasApparelConflict
} from '@/utils/bodyLocations.ts'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, Item } from '@/types';
import { ORIGINS } from '@/utils/characterSheet.ts';

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { character, updateCharacter } = useCharacter()
    const { showConfirm, showAlert, showTradeItemPopup } = usePopup()
    const dataManager = getGameDatabase()

    const sellItem = (characterItem: CharacterItem) => {
        // Validate if item can be sold
        if (dataManager.isUnacquirable(characterItem.id)) {
            showAlert("Cannot sell this item!")
            return
        }

        // Use modified data for price calculation
        const modifiedData = getModifiedItemData(characterItem)
        if (!modifiedData) {
            console.error('Item data not found!')
            return
        }
        showTradeItemPopup(characterItem, modifiedData, (quantity, price) => {
            const total = Math.floor(quantity * price)

            // Remove sold quantity from inventory
            const updatedItems = character.items.map(item => {
                if (isSameConfiguration(item, characterItem)) {
                    const newQuantity = item.quantity - quantity
                    if (newQuantity <= 0) {
                        return null // Will be filtered out
                    }
                    return { ...item, quantity: newQuantity }
                }
                return item
            }).filter(item => item !== null)

            // Add caps to character
            const newCaps = character.caps + total

            updateCharacter({
                items: updatedItems,
                caps: newCaps
            })

            showAlert(`Sold for ${total} caps!`)
        })
    }

    const deleteItem = (characterItem: CharacterItem) => {
        // Validate if item can be deleted
        if (dataManager.isUnacquirable(characterItem.id)) {
            showAlert("Cannot delete this item!")
            return
        }

        showConfirm(
            `Delete ${characterItem.quantity}x ${characterItem.id}? This action cannot be undone.`,
            () => {
                // Remove item from inventory
                const updatedItems = character.items.filter(item =>
                    !isSameConfiguration(item, characterItem)
                )

                updateCharacter({
                    items: updatedItems
                })

                showAlert('Item deleted.')
            }
        )
    }

    const equipItem = (characterItem: CharacterItem, itemData: Item) => {
        // Validate if item can be equipped
        if (!dataManager.isType(itemData, 'apparel')) {
            showAlert("Cannot equip non-apparel items!")
            return
        }
        if(character.origin === ORIGINS.MR_HANDY) {
            showAlert("Robots cannot equip/unequip apparel.")
            return
        }

        const isCurrentlyEquipped = characterItem.equipped === true

        if (isCurrentlyEquipped) {
            // Validate if item can be unequipped
            if (dataManager.isUnacquirable(characterItem.id)) {
                showAlert("Cannot unequip this item!")
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

                const otherItemData = dataManager.getItem(item.id)
                if (!item.equipped || !dataManager.isType(otherItemData, 'apparel')) {
                    return item
                }

                if(hasApparelConflict(characterItem, item)){
                    return {...item, equipped: false}
                }
                return item
            })

            updateCharacter({ items: updatedItems })
        }
    }

    const useItem = (characterItem: CharacterItem) => {
        // TODO: Implement use logic for consumables
        console.log('Use item:', characterItem.id)
        showAlert('Use functionality coming soon!')
    }

    return {
        sellItem,
        deleteItem,
        equipItem,
        useItem
    }
}
