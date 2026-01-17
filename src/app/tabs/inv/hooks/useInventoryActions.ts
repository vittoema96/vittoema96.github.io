import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {
    applyModToItem as applyModUtil,
    removeModFromItem as removeModUtil,
    isSameConfiguration
} from '@/utils/itemUtils.ts'
import {
    canEquipItem,
    canUnequipItem,
    canSellItem,
    canDeleteItem
} from '@/app/tabs/inv/utils/itemValidation.ts'
import {
    hasApparelConflict
} from '@/utils/bodyLocations.ts'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, Item, MR_HANDY_PARTS } from '@/types';

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
        const validation = canSellItem(characterItem.id)
        if (!validation.canSell) {
            showAlert(validation.reason)
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
        const validation = canDeleteItem(characterItem.id)
        if (!validation.canDelete) {
            showAlert(validation.reason)
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
        const validation = canEquipItem(character, itemData)
        if (!validation.canEquip) {
            showAlert(validation.reason)
            return
        }

        const isCurrentlyEquipped = characterItem.equipped === true

        if (isCurrentlyEquipped) {
            // Validate if item can be unequipped
            const unequipValidation = canUnequipItem(characterItem.id)
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

    const applyMod = (characterItem: CharacterItem, modId: string) => {

        // Apply mod using utility function
        let updatedItems = applyModUtil(character.items, characterItem, modId)

        // Check if this is a robot plating mod being applied to a robot part
        const modData = dataManager.getItem(modId)
        const itemData = dataManager.getItem(characterItem.id)
        if(!itemData || !dataManager.isType(modData, "mod")) {return}
        const isRobotPart = itemData.CATEGORY === 'robotPart'
        const isPlatingMod = modData.SLOT_TYPE === 'modSlotRobotPlating'

        if (isRobotPart && isPlatingMod) {
            // Sync plating across all robot parts (preserve armor mods)
            updatedItems = updatedItems.map(item => {
                if (MR_HANDY_PARTS.has(item.id) && item.id !== characterItem.id) {
                    // Update plating (slot 0) on other robot parts, keep armor (slot 1)
                    const armorMod = item.mods?.[1] ? item.mods[1] : null;
                    const newMods = armorMod ? [modId, armorMod] : [modId]
                    return { ...item, mods: newMods }
                }
                return item
            })
        }

        updateCharacter({ items: updatedItems })
        showAlert('Mod applied successfully!')
    }

    const removeMod = (characterItem, modId) => {
        if (!characterItem || !modId) {
            showAlert('Invalid item or mod')
            return
        }

        // Check if item has this mod
        if (!characterItem.mods.includes(modId)) {
            showAlert('Item does not have this mod')
            return
        }

        // Check if this is a robot plating mod being removed from a robot part
        const modData = dataManager.getItem(modId)
        const isRobotPart = characterItem.type === 'robotPart'
        const isPlatingMod = modData && modData.SLOT_TYPE === 'modSlotRobotPlating'

        if (isRobotPart && isPlatingMod) {
            showAlert('Cannot remove plating mod. Replace it with another plating instead.')
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
