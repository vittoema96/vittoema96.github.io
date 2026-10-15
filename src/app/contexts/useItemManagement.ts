import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { CharacterItem, CustomItem } from '@/types';
import { useCallback } from 'react';
import {
    applyAddItem,
    applyRemoveItem,
    getCurrencyUpdate,
    type CurrencyDelta,
} from '@/features/character/items.ts';

export const useItemManagement = () => {
    const { updateCharacter } = useCharacter();
    const addItem = useCallback(
        (itemToAdd: CharacterItem | CustomItem, cost?: CurrencyDelta) => {
            updateCharacter(prev => ({
                ...(isCustomItem(itemToAdd)
                    ? { customItems: applyAddItem(prev.customItems, itemToAdd) }
                    : { items: applyAddItem(prev.items, itemToAdd) }),
                ...getCurrencyUpdate(prev, cost, -1),
            }));
        },
        [updateCharacter],
    );

    const removeItem = useCallback(
        (itemToRemove: CharacterItem | CustomItem, price?: CurrencyDelta) => {
            updateCharacter(prev => ({
                ...(isCustomItem(itemToRemove)
                    ? { customItems: applyRemoveItem(prev.customItems, itemToRemove) }
                    : { items: applyRemoveItem(prev.items, itemToRemove) }),
                ...getCurrencyUpdate(prev, price, 1),
            }));
        },
        [updateCharacter],
    );

    const editItem = useCallback(
        <T extends CharacterItem | CustomItem>(oldItem: T, newItem: T, cost?: CurrencyDelta) => {
            updateCharacter(prev => {
                const currency = getCurrencyUpdate(prev, cost, -1);
                if (isCustomItem(oldItem) && isCustomItem(newItem)) {
                    return {
                        customItems: applyAddItem(
                            applyRemoveItem(prev.customItems, oldItem),
                            newItem,
                        ),
                        ...currency,
                    };
                }
                if (!isCustomItem(oldItem) && !isCustomItem(newItem)) {
                    return {
                        items: applyAddItem(applyRemoveItem(prev.items, oldItem), newItem),
                        ...currency,
                    };
                }
                throw new Error('Cannot change between standard and custom item types');
            });
        },
        [updateCharacter],
    );

    const updateItemCustomName = (
        characterItem: CharacterItem | CustomItem,
        customName: string,
    ) => {
        customName = customName.trim();
        let newItem;
        if (customName === '' && 'id' in characterItem) {
            const { customName: _, ...rest } = characterItem;
            newItem = rest;
        } else {
            newItem = { ...characterItem, customName };
        }
        editItem(characterItem, newItem);
    };

    return {
        addItem,
        removeItem,
        editItem,
        updateItemCustomName,
    };
};

function isCustomItem(item: CharacterItem | CustomItem): item is CustomItem {
    return !('id' in item);
}
