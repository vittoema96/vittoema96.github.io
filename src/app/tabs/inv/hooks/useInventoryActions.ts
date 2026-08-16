import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { hasApparelConflict } from '@/utils/bodyLocations.ts';
import { CharacterItem, CustomItem, Side } from '@/types';
import { useTranslation } from 'react-i18next';
import { allItems } from '@/data';
import {
    getUniqueKey,
    isType,
    isUnacquirable,
} from '@/features/item/utils.ts';
import { useItemManagement } from '@/app/contexts/useItemManagement.ts';

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { t } = useTranslation();
    const { rawCharacter, character, updateCharacter } = useCharacter();
    const { removeItem, editItem } = useItemManagement()
    const { showConfirm, showAlert, showChoice, showTradeItemPopup } = usePopup();

    const sellItem = (characterItem: CharacterItem | CustomItem) => {
        // Validate if item can be sold
        if ('id' in characterItem && isUnacquirable(characterItem.id)) {
            showAlert(t('cannotSellItem'));
            return;
        }
        showTradeItemPopup({ characterItem: characterItem });
    };

    const deleteItem = (characterItem: CharacterItem | CustomItem) => {
        // Validate if item can be deleted
        if ('id' in characterItem && isUnacquirable(characterItem.id)) {
            showAlert(t('cannotDeleteItem'));
            return;
        }

        showConfirm(
            t('confirmDeleteItem', {
                quantity: characterItem.quantity,
                itemName: t(characterItem.customName ?? { id: '', ...characterItem }.id),
            }),
            () => {
                removeItem(characterItem);
                showAlert(t('itemDeleted'));
            },
        );
    };

    const equipItem = (characterItem: CharacterItem) => {
        // Robot parts cannot be unequipped
        const itemData = allItems[characterItem.id];
        if (character.origin.isRobot) {
            showAlert(t('robotsCannotEquipApparel'));
            return;
        } else if (itemData?.CATEGORY === 'robotPart') {
            showAlert(t('cannotEquipRobotParts'));
            return;
        }
        const isCurrentlyEquipped = characterItem.equipped === true;

        if (isCurrentlyEquipped) {
            // Unequip the item
            editItem(characterItem, {...characterItem, equipped: false, side: undefined});
        } else {
            // Equip the item - first unequip any items in the same locations

            const updateItems = (side?: Side | undefined) => {
                const updatedItems = rawCharacter.items.flatMap(otherItem => {
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

                    const otherItemData = allItems[otherItem.id];
                    if (!otherItem.equipped || !isType(otherItemData, 'apparel')) {
                        return [otherItem];
                    }

                    if (hasApparelConflict(characterItem, otherItem)) {
                        return [{ ...otherItem, equipped: false, side: undefined }];
                    }
                    return [otherItem];
                });

                updateCharacter({ items: updatedItems });
            };

            if (
                isType(itemData, 'apparel') &&
                (itemData.LOCATIONS_COVERED.includes('arm') ||
                    itemData.LOCATIONS_COVERED.includes('leg'))
            ) {
                showChoice(t('equipSide'), ['left', 'right'], side => updateItems(side));
            } else {
                updateItems();
            }
        }
    };

    const consumeItem = (characterItem: CharacterItem) => {
        // TODO: Implement use logic for consumables
        console.log('Use item:', characterItem.id);
        showAlert(t('useFunctionalityComingSoon'));
    };

    return {
        sellItem,
        deleteItem,
        equipItem,
        consumeItem,
    };
};
