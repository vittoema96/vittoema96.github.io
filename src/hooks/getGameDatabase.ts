import { GameDatabase } from '@/services/GameDatabase';
import { AidItem, AmmoItem, CharacterItem, Item, LegendaryEffect, ModItem } from '@/types';
import { applyEffect } from '@/utils/itemUtils.ts';
import { WeaponItem } from '@/schemas/items/weaponSchemas.ts';
import { BaseItem } from '@/schemas/items/baseItemSchemas.ts';
import { ApparelItem } from '@/schemas/items/apparelSchemas.ts';
import { ITEM_TYPE_MAP, ItemType } from '@/types/item.ts';

type ItemMap = {
    [K in ItemType]: K extends 'weapon' ? WeaponItem :
                     K extends 'apparel' ? ApparelItem :
                     K extends 'aid' ? AidItem :
                     K extends 'ammo' ? AmmoItem :
                     K extends 'mod' ? ModItem :
                     BaseItem;
};
function isType<T extends ItemType>(item: Item | null | undefined, type: T): item is ItemMap[T] {
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
        traits: db.traits,
        legendaryEffects: db.legendaryEffects,
        allItems: db.allItems,

        // Helpers
        getItem: GameDatabase.getItem.bind(GameDatabase),
        isUnacquirable: GameDatabase.isUnacquirable,
        getItemTypeMap: () => ITEM_TYPE_MAP,
        isType,
    };
}

export const getGameDatabase = () => {
    cachedDataManager ??= createGameDatabase();
    return cachedDataManager
};

const applyMods = (itemData: WeaponItem | ApparelItem, modsData: (ModItem | LegendaryEffect)[]): typeof itemData => {
    for (const handleRemove of [false, true]){
        modsData.forEach((mod) => {
            mod.EFFECTS.forEach(effect => {
                if(handleRemove === ["effectRemove", "qualityRemove"].includes(effect)) {
                    itemData = applyEffect(itemData, effect);
                }
            })
        })
    }
    return itemData;
}


/**
 * Get item data with mods applied
 */
export function getModifiedItemData(characterItem: CharacterItem | null | undefined): WeaponItem | ApparelItem | null {
    if(!characterItem) { return null }
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, "weapon") && !dataManager.isType(itemData, "apparel")) {return null}
    if (characterItem.mods.length === 0) {return itemData}


    const modsData = [
        ...characterItem.mods.map(
                modId => dataManager.getItem(modId)
            ).filter(mod => dataManager.isType(mod, "mod")),
        ...characterItem.mods.map(
                modId => dataManager.legendaryEffects[modId]
            ).filter(e => e !== undefined)
    ]

    const isApparel = isType(itemData, "apparel")
    let materialMultiplier = 1
    if(isApparel){
        const isTorsoArmor = itemData.LOCATIONS_COVERED.includes('torso') &&
            itemData.LOCATIONS_COVERED.length === 1
        materialMultiplier = isTorsoArmor ? 2 : 1
    }
    const getValue = (modData: ModItem | LegendaryEffect, value: number | '-') => {
        const isMaterialMod = {SLOT_TYPE: null, ...modData}.SLOT_TYPE === 'modSlotMaterial'
        const multiplier = isMaterialMod ? materialMultiplier : 1
        return (Number(value) || 0) * multiplier
    }

    const COST = itemData.COST === '-' ? '-' : modsData.reduce(
        (total, mod) => total + getValue(mod, {COST: 0, ...mod}.COST),
        Number(itemData.COST) || 0
    )
    const WEIGHT = itemData.WEIGHT === '-' ? '-' : modsData.reduce(
        (total, mod) => total + getValue(mod, {WEIGHT: 0, ...mod}.WEIGHT),
        Number(itemData.WEIGHT) || 0
    )

    return applyMods({
        ...itemData,
        COST,
        WEIGHT
    }, modsData)
}
