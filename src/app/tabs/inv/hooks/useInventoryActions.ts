import { useCharacter } from '@/app/contexts/CharacterContext.tsx'
import { usePopup } from '@/app/contexts/PopupContext.tsx'
import {
    hasApparelConflict
} from '@/utils/bodyLocations.ts'
import { CharacterItem, CustomItem, Side } from '@/types';
import { useTranslation } from 'react-i18next';
import { allItems } from '@/data';
import { getUniqueKey, isSameConfiguration, isType, isUnacquirable } from '@/features/item/utils.ts';

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const { showConfirm, showAlert, showChoice, showTradeItemPopup } = usePopup()

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
        if("id" in characterItem && isUnacquirable(characterItem.id)) {
            showAlert(t('cannotSellItem'))
            return
        }
        showTradeItemPopup({ characterItem: characterItem });
    }

    const deleteItem = (characterItem: CharacterItem | CustomItem) => {
        // Validate if item can be deleted
        if ("id" in characterItem && isUnacquirable(characterItem.id)) {
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
        const itemData = allItems[characterItem.id]
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
                // TODO create and use a getId function to check ALL fields
                if (getUniqueKey(item) === getUniqueKey(characterItem)) {
                    return {
                        ...item,
                        equipped: false,
                        side: undefined,
                    }
                }
                return item
            })
            updateCharacter({ items: updatedItems })
        } else {
            // Equip the item - first unequip any items in the same locations

            const updateItems = (side?: Side | undefined) => {
                const updatedItems = character.items.flatMap(otherItem => {
                    // Skip the item we're equipping
                    if (getUniqueKey(otherItem) === getUniqueKey(characterItem)) {
                        if (otherItem.quantity > 1) {
                            const equippedItem = {
                                ...otherItem,
                                quantity: 1,
                                equipped: true,
                                side: side,
                            };

                            const remainingItem = {
                                ...otherItem,
                                quantity: otherItem.quantity - 1,
                                equipped: false,
                                side: undefined,
                            };

                            return [equippedItem, remainingItem];
                        }

                        // Single item, equip normally
                        return [{ ...otherItem, equipped: true, side: side }];
                    }

                    const otherItemData = allItems[otherItem.id]
                    if (!otherItem.equipped || !isType(otherItemData, 'apparel')) {
                        return [otherItem]
                    }

                    if(hasApparelConflict(characterItem, otherItem)){
                        return [{ ...otherItem, equipped: false, side: undefined }]
                    }
                    return [otherItem]
                })

                updateCharacter({ items: updatedItems })
            }

            if(isType(itemData, 'apparel')
                && (itemData.LOCATIONS_COVERED.includes('arm')
                    || itemData.LOCATIONS_COVERED.includes('leg'))
            ){
                showChoice(
                    t("equipSide"),
                    ['left', 'right'],
                    (side) => updateItems(side)
                )
            } else {
                updateItems()
            }


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
