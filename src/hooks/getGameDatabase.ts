import { GameDatabase } from '@/services/data/GameDatabase.ts';
import { AidItem, AmmoItem, Item, ModItem } from '@/types';
import { ITEM_TYPE_MAP, ItemType } from '@/types/item.ts';
import { BaseItem } from '@/data/types.ts';
import { ApparelItem } from '@/data/item/apparel.schemas.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';

type ItemMap = {
    [K in ItemType]: K extends 'weapon'
        ? WeaponItem
        : K extends 'apparel'
          ? ApparelItem
          : K extends 'aid'
            ? AidItem
            : K extends 'ammo'
              ? AmmoItem
              : K extends 'mod'
                ? ModItem
                : BaseItem;
};
export function isType<T extends ItemType>(item: Item | null | undefined, type: T): item is ItemMap[T] {
    return item?.TYPE === type;
}

let cachedDataManager: ReturnType<typeof createGameDatabase> | null = null;
function createGameDatabase() {
    const db = GameDatabase.data;

    return {
        // Data Collections
        weapon: db.weapon,
        apparel: db.apparel,
        aid: db.aid,
        ammo: db.ammo,
        mod: db.mod,
        other: db.other,
        perks: db.perks,
        companionPerks: db.companionPerks,
        traits: db.traits,
        legendaryEffects: db.legendaryEffects,

        // Helpers
        getItem: GameDatabase.getItem.bind(GameDatabase),
        isUnacquirable: GameDatabase.isUnacquirable,
        getItemTypeMap: () => ITEM_TYPE_MAP,
    };
}

export const getGameDatabase = () => {
    cachedDataManager ??= createGameDatabase();
    return cachedDataManager;
};
