import { GameDatabase, ITEM_TYPE_MAP } from '@/services/GameDatabase';
import {Item, WeaponItem, ApparelItem, ItemType, AidItem, ModItem, GenericItem} from "@/types";

type ItemMap = {
    [K in ItemType]: K extends 'weapon' ? WeaponItem :
                     K extends 'apparel' ? ApparelItem :
                     K extends 'aid' ? AidItem :
                     K extends 'mod' ? ModItem :
                     GenericItem;
};
function isType<T extends ItemType>(item: Item | null, type: T): item is ItemMap[T] {
    return item?.TYPE === type;
}

export const getGameDatabase = () => {
    // Direct access to the singleton.
    // No context overhead. No dependency arrays.
    const db = GameDatabase.data;

    return {
        // Data Collections
        weapon: db.weapon,
        apparel: db.apparel,
        aid: db.aid,
        mod: db.mod,
        other: db.other,
        perks: db.perks,
        allItems: db.allItems,

        // Helpers
        getItem: GameDatabase.getItem.bind(GameDatabase),
        isUnacquirable: GameDatabase.isUnacquirable,
        getItemTypeMap: () => ITEM_TYPE_MAP,
        isType,
    };
};
