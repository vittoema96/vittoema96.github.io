import { GameDatabase, ITEM_TYPE_MAP } from '@/services/GameDatabase';
import {Item, WeaponItem, ApparelItem, ItemType, AidItem, ModItem, GenericItem} from "@/types";


function isType(item: Item | null, type: 'weapon'): item is WeaponItem;
function isType(item: Item | null, type: 'apparel'): item is ApparelItem;
function isType(item: Item | null, type: 'aid'): item is AidItem;
function isType(item: Item | null, type: 'mod'): item is ModItem;
function isType(item: Item | null, type: 'other'): item is GenericItem;
function isType(item: Item | null, type: ItemType): boolean;
function isType(item: Item | null, type: ItemType): boolean {
    return item?.TYPE === type;
}

export const useGameDatabase = () => {
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
