import { useCharacter } from '../contexts/CharacterContext.jsx'
import { usePopup } from '../contexts/PopupContext.jsx'
import { useDataManager } from './useDataManager.js'

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { character, updateCharacter } = useCharacter()
    const { showConfirm, showAlert, showTradeItemPopup } = usePopup()
    const dataManager = useDataManager()

    const sellItem = (characterItem, itemData) => {
        showTradeItemPopup(characterItem, itemData, (quantity, price) => {
            const total = Math.floor(quantity * price)

            // Remove sold quantity from inventory
            const updatedItems = character.items?.map(item => {
                if (item.id === characterItem.id) {
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

    // Helper function to determine item layer
    const getItemLayer = (itemType) => {
        if (itemType === 'clothing') {
            return 'under'
        }
        if (itemType === 'outfit') {
            return 'both'
        }
        if (itemType === 'headgear' || itemType.endsWith('Armor')) {
            return 'over'
        }
        return 'both' // Default to both for safety
    }

    // Helper function to convert location strings to specific body parts (DRY principle)
    const getSpecificLocations = (locationsCovered, side) => {
        const locations = []
        for (const location of locationsCovered) {
            if (location === 'arm') {
                // Handle side-specific arms
                if (side === 'left') {
                    locations.push('leftArm')
                } else if (side === 'right') {
                    locations.push('rightArm')
                } else {
                    locations.push('leftArm', 'rightArm')
                }
            } else if (location === 'leg') {
                // Handle side-specific legs
                if (side === 'left') {
                    locations.push('leftLeg')
                } else if (side === 'right') {
                    locations.push('rightLeg')
                } else {
                    locations.push('leftLeg', 'rightLeg')
                }
            } else if (location === 'torso') {
                locations.push('torso')
            } else if (location === 'head') {
                locations.push('head')
            } else {
                locations.push(location)
            }
        }
        return locations
    }

    const equipItem = (characterItem, itemData) => {
        if (!itemData || !itemData.LOCATIONS_COVERED) {
            showAlert('This item cannot be equipped.')
            return
        }

        const isCurrentlyEquipped = characterItem.equipped === true
        const [, side] = characterItem.id.split('_')
        const itemLayer = getItemLayer(characterItem.type)

        // Get locations this item covers
        const locations = getSpecificLocations(itemData.LOCATIONS_COVERED, side)

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
                const otherLocations = getSpecificLocations(otherItemData.LOCATIONS_COVERED, otherSide)

                // Check for location conflicts
                const hasLocationConflict = locations.some(loc => otherLocations.includes(loc))
                if (!hasLocationConflict) {
                    return item // No location conflict, keep as is
                }

                // There's a location conflict - check layer compatibility
                // clothing (under) + armor (over) = OK, no conflict
                // outfit (both) + anything = CONFLICT
                // armor (over) + armor (over) = CONFLICT
                const layerConflict =
                    itemLayer === 'both' || // outfit conflicts with everything
                    otherItemLayer === 'both' || // outfit conflicts with everything
                    (itemLayer === 'over' && otherItemLayer === 'over') // two armors conflict

                if (layerConflict) {
                    return { ...item, equipped: false }
                }

                return item
            })

            updateCharacter({ items: updatedItems })
        }
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
