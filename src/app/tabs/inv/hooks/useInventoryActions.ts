import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {
    isSameConfiguration
} from '@/utils/itemUtils.ts'
import {
    hasApparelConflict
} from '@/utils/bodyLocations.ts'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem } from '@/types';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { t } = useTranslation()
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
        let itemData = dataManager.getItem(characterItem.id)
        if(dataManager.isType(itemData, "moddable")){
            itemData = getModifiedItemData(characterItem)
        }
        if (!itemData) {
            console.error('Item data not found!')
            return
        }
        showTradeItemPopup(characterItem, itemData, (quantity, price) => {
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
            `Delete ${characterItem.quantity}x ${t(characterItem.id)}? This action cannot be undone.`,
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

    const equipItem = (characterItem: CharacterItem) => {
        // Robot parts cannot be unequipped
        const itemData = dataManager.getItem(characterItem.id)
        if(character.origin.isRobot) {
            showAlert("Robots cannot equip/unequip apparel.")
            return
        } else if(itemData?.CATEGORY === 'robotPart'){
            showAlert("Cannot equip robot parts on non-robots.")
            return
        }
        const isCurrentlyEquipped = characterItem.equipped === true

        if (isCurrentlyEquipped) {
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
            const updatedItems = character.items.map(otherItem => {
                // Skip the item we're equipping
                if (otherItem.id === characterItem.id && otherItem.variation === characterItem.variation) {
                    return { ...otherItem, equipped: true }
                }

                const otherItemData = dataManager.getItem(otherItem.id)
                if (!otherItem.equipped || !dataManager.isType(otherItemData, 'apparel')) {
                    return otherItem
                }

                if(hasApparelConflict(characterItem, otherItem)){
                    return {...otherItem, equipped: false}
                }
                return otherItem
            })

            updateCharacter({ items: updatedItems })
        }
    }

    const consumeItem = (characterItem: CharacterItem) => {
        // TODO: Implement use logic for consumables
        console.log('Use item:', characterItem.id)
        showAlert('Use functionality coming soon!')
    }

    return {
        sellItem,
        deleteItem,
        equipItem,
        consumeItem
    }
}
