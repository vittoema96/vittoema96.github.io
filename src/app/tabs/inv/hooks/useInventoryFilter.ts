import { useMemo } from 'react';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { ItemType } from '@/types/item.ts';
import { allItems } from '@/data';

/**
 * Custom hook for filtering and organizing inventory items
 */
export const useInventoryFilter = (itemType: ItemType) => {
    const { character } = useCharacter();

    return useMemo(() => {
        return character.items.filter(item => {
            // Filter by item type
            const itemData = allItems[item.id];
            return itemData?.TYPE === itemType;
        });
    }, [character, itemType]);
};
