import { GameDatabase, ITEM_TYPE_MAP } from '@/services/GameDatabase';
import { ModdableItem, AidItem, ApparelItem, CharacterItem, GenericItem, Item, ItemType, ModItem, WeaponItem } from '@/types';
import { applyEffect } from '@/utils/itemUtils.ts';

type ItemMap = {
    [K in ItemType | 'moddable']: K extends 'weapon' ? WeaponItem :
                     K extends 'apparel' ? ApparelItem :
                     K extends 'aid' ? AidItem :
                     K extends 'mod' ? ModItem :
                     K extends 'moddable' ? ModdableItem :
                     GenericItem;
};
function isType<T extends ItemType | 'moddable'>(item: Item | null | undefined, type: T): item is ItemMap[T] {
    if(type === 'moddable'){
        return isType(item, 'weapon') || isType(item, 'apparel')
    }
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
        mod: db.mod,
        other: db.other,
        perks: db.perks,
        traits: db.traits,
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

const applyMods = (itemData: ModdableItem, modsData: ModItem[]): typeof itemData => {
    itemData.EFFECTS ??= []
    for (const handleRemove of [false, true]){
        modsData.forEach((mod) => {
            mod.EFFECTS?.forEach(effect => {
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
export function getModifiedItemData(characterItem: CharacterItem): ModdableItem | null {
    // TODO cyclic import of data manager. move getModifiedItemData inside
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, "moddable")) {return null}
    if (characterItem.mods.length === 0) {return itemData}


    const modsData = characterItem.mods.map(
        modId => dataManager.getItem(modId)
    ).filter(mod => dataManager.isType(mod, "mod"))

    const isApparel = isType(itemData, "apparel")
    let materialMultiplier = 1
    if(isApparel){
        const isTorsoArmor = itemData.LOCATIONS_COVERED.includes('torso') &&
            itemData.LOCATIONS_COVERED.length === 1
        materialMultiplier = isTorsoArmor ? 2 : 1
    }
    const getValue = (modData: ModItem, value: number) => {
        const isMaterialMod = modData.SLOT_TYPE === 'modSlotMaterial'
        const multiplier = isMaterialMod ? materialMultiplier : 1
        return value * multiplier
    }

    let modifiedData = {
        ...itemData,
        COST: modsData.reduce((total, mod) => total + getValue(mod, mod.COST), itemData.COST),
        WEIGHT: modsData.reduce((total, mod) => total + getValue(mod, mod.WEIGHT), itemData.WEIGHT),
    }

    modifiedData = applyMods(modifiedData, modsData)

    return modifiedData
}
