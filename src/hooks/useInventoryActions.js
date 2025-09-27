import { useCharacter } from '../contexts/CharacterContext.jsx'
import { usePopup } from '../contexts/PopupContext.jsx'

/**
 * Custom hook for inventory actions (sell, delete, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { character, updateCharacter } = useCharacter()
    const { showConfirm, showAlert } = usePopup()

    const sellItem = (characterItem, itemData) => {
        const sellValue = Math.floor((itemData?.COST || 0) * 0.5) // Sell for 50% of cost
        
        showConfirm(
            `Sell ${characterItem.quantity}x ${itemData?.ID || characterItem.id} for ${sellValue * characterItem.quantity} caps?`,
            () => {
                // Remove item from inventory
                const updatedItems = character.items?.filter(item => item.id !== characterItem.id) || []
                
                // Add caps to character
                const newCaps = (character.caps || 0) + (sellValue * characterItem.quantity)
                
                updateCharacter({
                    items: updatedItems,
                    caps: newCaps
                })
                
                showAlert(`Sold for ${sellValue * characterItem.quantity} caps!`)
            }
        )
    }

    const deleteItem = (characterItem, itemData) => {
        showConfirm(
            `Delete ${characterItem.quantity}x ${itemData?.ID || characterItem.id}? This action cannot be undone.`,
            () => {
                // Remove item from inventory
                const updatedItems = character.items?.filter(item => item.id !== characterItem.id) || []
                
                updateCharacter({
                    items: updatedItems
                })
                
                showAlert('Item deleted.')
            }
        )
    }

    const equipItem = (characterItem, itemData) => {
        // TODO: Implement equip logic based on item type
        console.log('Equip item:', characterItem.id, itemData)
        showAlert('Equip functionality coming soon!')
    }

    const useItem = (characterItem, itemData) => {
        // TODO: Implement use logic for consumables
        console.log('Use item:', characterItem.id, itemData)
        showAlert('Use functionality coming soon!')
    }

    return {
        sellItem,
        deleteItem,
        equipItem,
        useItem
    }
}
