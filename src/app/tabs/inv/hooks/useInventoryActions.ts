import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { hasApparelConflict } from '@/utils/bodyLocations.ts';
import { CharacterItem, CustomItem, Side } from '@/types';
import { useTranslation } from 'react-i18next';
import { allItems } from '@/data';
import { getUniqueKey, isType, isUnacquirable } from '@/features/item/utils.ts';
import { canEquipApparel } from '@/features/character/inventory/equipment.ts';
import { useItemManagement } from '@/app/contexts/useItemManagement.ts';

/**
 * Custom hook for inventory actions (sell, delete, equip, use, etc.)
 * @returns {Object} Inventory action functions
 */
export const useInventoryActions = () => {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const { editItem } = useItemManagement();
    const { showAlert, showChoice, showTradeItemPopup, showDeleteItemPopup } = usePopup();

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

        showDeleteItemPopup({ characterItem });
    };

    const equipItem = (characterItem: CharacterItem) => {
        const itemData = allItems[characterItem.id];
        const isRobotPart = isType(itemData, 'apparel') && itemData.CATEGORY === 'robotPart';
        const isCurrentlyEquipped = characterItem.equipped === true;

        // Robot body parts are intrinsic equipment and cannot be unequipped.
        // The calculated inventory marks them equipped even when the saved
        // item is not, so handling this before editItem also avoids duplicating
        // the saved stack.
        if (isRobotPart && character.origin.isRobot) {
            return;
        }

        if (isCurrentlyEquipped) {
            // Unequip the item
            editItem(characterItem, { ...characterItem, equipped: false, side: undefined });
            return;
        }

        if (
            !canEquipApparel(itemData, {
                origin: character.origin,
                perks: character.perks,
                traits: character.traits,
            })
        ) {
            return;
        } else {
            // Equip the item - first unequip any items in the same locations

            const updateItems = (side?: Side | undefined) => {
                updateCharacter(prev => ({
                    items: prev.items.flatMap(otherItem => {
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

                        if (hasApparelConflict({ ...characterItem, side }, otherItem)) {
                            return [{ ...otherItem, equipped: false, side: undefined }];
                        }
                        return [otherItem];
                    }),
                }));
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
