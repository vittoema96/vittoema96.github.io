import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import {
    isSameConfiguration
} from '@/utils/itemUtils.ts'
import {
    hasApparelConflict
} from '@/utils/bodyLocations.ts'
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { CharacterItem, CustomItem } from '@/types';
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



    const removeItem = (
        characterItem: CharacterItem | CustomItem,
        quantity?: number | undefined,
        price = 0,
    ) => {
        quantity = quantity ?? characterItem.quantity;
        let update;
        if ('id' in characterItem) {
            // Remove sold quantity from inventory
            const updatedItems = character.items
                .map(item => {
                    if (isSameConfiguration(item, characterItem)) {
                        const newQuantity = item.quantity - quantity;
                        if (newQuantity <= 0) {
                            return null; // Will be filtered out
                        }
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
                .filter(item => item !== null);
            update = { items: updatedItems };
        } else {
            const jsonItem = JSON.stringify(characterItem);
            const updatedItems = character.customItems
                .map(item => {
                    if (JSON.stringify(item) === jsonItem) {
                        const newQuantity = item.quantity - quantity;
                        if (newQuantity <= 0) {
                            return null; // Will be filtered out
                        }
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
                .filter(item => item !== null);
            update = { customItems: updatedItems };
        }
        updateCharacter({
            ...update,
            caps: character.caps + Math.floor(quantity * price),
        });
    };

    const sellItem = (characterItem: CharacterItem | CustomItem) => {
        // Validate if item can be sold
        if("id" in characterItem && dataManager.isUnacquirable(characterItem.id)) {
            showAlert(t('cannotSellItem'))
            return
        }
        showTradeItemPopup({ characterItem: characterItem });
    }

    const deleteItem = (characterItem: CharacterItem | CustomItem) => {
        // Validate if item can be deleted
        if ("id" in characterItem && dataManager.isUnacquirable(characterItem.id)) {
            showAlert(t('cannotDeleteItem'))
            return
        }

        showConfirm(
            t('confirmDeleteItem', {
                quantity: characterItem.quantity,
                itemName: t(characterItem.customName ?? {id: '', ...characterItem}.id)
            }),
            () => {
                removeItem(characterItem)
                showAlert(t('itemDeleted'))
            }
        )
    }

    const equipItem = (characterItem: CharacterItem) => {
        // Robot parts cannot be unequipped
        const itemData = dataManager.getItem(characterItem.id)
        if(character.origin.isRobot) {
            showAlert(t('robotsCannotEquipApparel'))
            return
        } else if(itemData?.CATEGORY === 'robotPart'){
            showAlert(t('cannotEquipRobotParts'))
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
        showAlert(t('useFunctionalityComingSoon'))
    }

    const updateItemCustomName = (characterItem: CharacterItem | CustomItem, customName: string) => {
        if("id" in characterItem){
            const updatedItems = character.items.map(item => {
                if (isSameConfiguration(item, characterItem)) {
                    // If customName is empty, remove it from the item
                    if (customName.trim() === '') {
                        const { customName: _, ...rest } = item
                        return rest
                    }
                    return { ...item, customName: customName.trim() }
                }
                return item
            })
            updateCharacter({ items: updatedItems })
        } else {
            const jsonItem = JSON.stringify(characterItem)
            const updatedCustomItems = character.customItems.map(item => {
                if (JSON.stringify(item) === jsonItem) {
                    item.customName = customName
                }
                return item
            })
            updateCharacter({ customItems: updatedCustomItems })
        }
    }

    return {
        sellItem,
        deleteItem,
        equipItem,
        consumeItem,
        updateItemCustomName,
        removeItem
    }
}
