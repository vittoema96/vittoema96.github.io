import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { CharacterItem, CustomItem } from '@/types';
import { isSameConfiguration } from '@/features/item/utils.ts';
import { useCallback } from 'react';

export interface CurrencyDelta {
    caps?: number;
    ncrDollars?: number;
    legionDenarius?: number;
    prewarMoney?: number;
}

export function applyAddItem<T extends CharacterItem | CustomItem>(
    items: T[],
    itemToAdd: T
): T[] {
    let found = false;
    const result = items.reduce<T[]>((acc, item) => {
        if (isSameConfiguration(item, itemToAdd)) {
            found = true;
            acc.push({ ...item, quantity: item.quantity + itemToAdd.quantity });
        } else {
            acc.push(item);
        }
        return acc;
    }, []);

    if (!found) {
        result.push({ ...itemToAdd });
    }
    return result;
}

export function applyRemoveItem<T extends CharacterItem | CustomItem>(
    items: T[],
    itemToRemove: T,
): T[] {
    let quantityToRemove = itemToRemove.quantity;

    return items.reduce<T[]>((acc, item) => {
        if (quantityToRemove > 0 && isSameConfiguration(item, itemToRemove)) {
            if (item.quantity > quantityToRemove) {
                acc.push({ ...item, quantity: item.quantity - quantityToRemove });
                quantityToRemove = 0;
            } else {
                quantityToRemove -= item.quantity;
            }
        } else {
            acc.push(item);
        }
        return acc;
    }, []);
}


export const useItemManagement = () => {
    const { rawCharacter, character, updateCharacter } = useCharacter()
    const addItem = useCallback(
        (itemToAdd: CharacterItem | CustomItem, cost?: CurrencyDelta) => {
            const newItems = applyAddItem(
                isCustomItem(itemToAdd) ? rawCharacter.customItems : rawCharacter.items,
                itemToAdd
            );

            updateCharacter({
                ...(isCustomItem(itemToAdd) ? {customItems: newItems} : {items: newItems}),
                ...(cost
                    ? {
                        caps: character.caps - (cost.caps ?? 0),
                        ncrDollars: character.ncrDollars - (cost.ncrDollars ?? 0),
                        legionDenarius: character.legionDenarius - (cost.legionDenarius ?? 0),
                        prewarMoney: character.prewarMoney - (cost.prewarMoney ?? 0),
                    }
                    : {}),
            });
        },
        [rawCharacter.customItems, rawCharacter.items, updateCharacter, character.caps, character.ncrDollars, character.legionDenarius, character.prewarMoney],
    );

    const removeItem = useCallback(
        (itemToRemove: CharacterItem | CustomItem, price?: CurrencyDelta) => {
            const newItems = applyRemoveItem(
                isCustomItem(itemToRemove) ? rawCharacter.customItems : rawCharacter.items,
                itemToRemove
            );

            updateCharacter({
                ...(isCustomItem(itemToRemove) ? {customItems: newItems} : {items: newItems}),
                ...(price
                    ? {
                        caps: character.caps + (price.caps ?? 0),
                        ncrDollars: character.ncrDollars + (price.ncrDollars ?? 0),
                        legionDenarius: character.legionDenarius + (price.legionDenarius ?? 0),
                        prewarMoney: character.prewarMoney + (price.prewarMoney ?? 0),
                    }
                    : {}),
            });
        },
        [rawCharacter.customItems, rawCharacter.items, updateCharacter, character.caps, character.ncrDollars, character.legionDenarius, character.prewarMoney],
    );

    const editItem = useCallback(
        <T extends CharacterItem | CustomItem>(oldItem: T, newItem: T, cost?: CurrencyDelta) => {
            if(isCustomItem(oldItem) && isCustomItem(newItem)){
                const itemsAfterRemoval = applyRemoveItem(
                    rawCharacter.customItems,
                    oldItem
                );
                const finalItems = applyAddItem(itemsAfterRemoval, newItem);
                updateCharacter({
                    customItems: finalItems,
                    ...(cost ? {
                            caps: character.caps - (cost.caps ?? 0),
                            ncrDollars: character.ncrDollars - (cost.ncrDollars ?? 0),
                            legionDenarius: character.legionDenarius - (cost.legionDenarius ?? 0),
                            prewarMoney: character.prewarMoney - (cost.prewarMoney ?? 0),
                        }: {}
                    ),
                });
            }
            if(!isCustomItem(oldItem) && !isCustomItem(newItem)){
                const itemsAfterRemoval = applyRemoveItem(
                    rawCharacter.items,
                    oldItem
                );
                const finalItems = applyAddItem(itemsAfterRemoval, newItem);
                updateCharacter({
                    items: finalItems,
                    ...(cost ? {
                            caps: character.caps - (cost.caps ?? 0),
                            ncrDollars: character.ncrDollars - (cost.ncrDollars ?? 0),
                            legionDenarius: character.legionDenarius - (cost.legionDenarius ?? 0),
                            prewarMoney: character.prewarMoney - (cost.prewarMoney ?? 0),
                        }: {}
                    )
                });
            }
        },
        [character.caps, character.legionDenarius, character.ncrDollars, character.prewarMoney, rawCharacter.customItems, rawCharacter.items, updateCharacter],
    );

    const updateItemCustomName = (
        characterItem: CharacterItem | CustomItem,
        customName: string,
    ) => {
        customName = customName.trim()
        let newItem
        if(customName === '' && 'id' in characterItem) {
            const {customName: _, ...rest} = characterItem;
            newItem = rest
        } else {
            newItem = {...characterItem, customName};
        }
        editItem(characterItem, newItem);
    };

    return {
        addItem,
        removeItem,
        editItem,
        updateItemCustomName,
    }

}



function isCustomItem(item: CharacterItem | CustomItem): item is CustomItem {
    return !('id' in item);
}
