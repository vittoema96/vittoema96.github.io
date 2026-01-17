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
function isType<T extends ItemType | 'moddable'>(item: Item | null, type: T): item is ItemMap[T] {
    if(type === 'moddable'){
        return isType(item, 'weapon') || isType(item, 'apparel')
    }
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


const applyMod = (itemData: Item, modData: ModItem) => {

    const isApparel = isType(itemData, "apparel")
    let materialMultiplier = 1
    if(isApparel){
        const isTorsoArmor = itemData.LOCATIONS_COVERED.includes('torso') &&
            itemData.LOCATIONS_COVERED.length === 1
        materialMultiplier = isTorsoArmor ? 2 : 1
    }

    let resultItem = {...itemData}

    // Check if Material mod applied to Torso (double weight and cost)
    const isMaterialMod = modData.SLOT_TYPE === 'modSlotMaterial'
    const multiplier = isMaterialMod ? materialMultiplier : 1

    // Add weight from mod (doubled for Material mods on Torso)
    // TODO isn't WEIGHT ALWAYS a number? maybe we should ch
    if (modData.WEIGHT) {
        resultItem.WEIGHT =
            (Number(resultItem.WEIGHT) || 0) +
            (Number(modData.WEIGHT) || 0) * multiplier
    }

    // Add cost from mod (doubled for Material mods on Torso)
    if (modData.COST) {
        resultItem.COST =
            (Number(resultItem.COST) || 0) +
            (Number(modData.COST) || 0) * multiplier
    }

    // Apply effects from EFFECTS array
    if (modData.EFFECTS) {
        modData.EFFECTS.forEach(effect => {
            resultItem = applyEffect(resultItem, effect)
        })
    }
    return resultItem
}


/**
 * Get item data with mods applied
 */
export function getModifiedItemData(characterItem: CharacterItem): Item | null {
    // TODO cyclic import of data manager. move getModifiedItemData inside
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!itemData) {return null}
    if (characterItem.mods.length === 0) {return itemData}

    let modifiedData = {
        ...itemData
    }

    // Apply each mod
    characterItem.mods.forEach(modId => {
        const modData = dataManager.getItem(modId)
        if (!isType(modData, "mod"))  {return}
        modifiedData = applyMod(modifiedData, modData)
    })

    return modifiedData
}
