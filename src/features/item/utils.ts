import { CharacterItem, LegendaryEffect, ModItem } from '@/types';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { ApparelItem } from '@/data/item/apparel.schemas.ts';
import { applyEffect } from '@/utils/itemUtils.ts';
import { getGameDatabase, isType } from '@/hooks/getGameDatabase.ts';
import { hasPerk, PerkId, perkRank } from '@/features/character/feats/perks/perks.ts';

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
const applyPerks = (
    itemData: WeaponItem | ApparelItem,
    perks: PerkId[] = []
): typeof itemData => {
    if (!isType(itemData, 'weapon')) {
        return itemData
    }

    const incisorRank = perkRank(perks, 'perkIncisor')
    if (itemData.CATEGORY === 'meleeWeapons' && incisorRank > 0) {
        itemData = applyEffect(itemData, `effectAdd:effectPiercing:${Math.min(incisorRank, 2)}`)
    }

    const hasPiercingStrike = hasPerk(perks, 'perkPiercingStrike')
    const canUsePiercingStrike =
        itemData.CATEGORY === 'unarmed' ||
        (itemData.CATEGORY === 'meleeWeapons' && itemData.IS_BLADED === true)
    if (hasPiercingStrike && canUsePiercingStrike) {
        itemData = applyEffect(itemData, 'effectAdd:effectPiercing:1')
    }

    return itemData
}

/**
 * Get item data with mods applied
 */
export function getModifiedItemData(
    characterItem: CharacterItem | null | undefined,
    perks: PerkId[] = []
): WeaponItem | ApparelItem | null {
    if(!characterItem) { return null }
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!isType(itemData, "weapon") && !isType(itemData, "apparel")) {return null}

    const baseItemData = {
        ...itemData,
        EFFECTS: [...itemData.EFFECTS],
        ...(isType(itemData, 'weapon') ? { QUALITIES: [...itemData.QUALITIES] } : {}),
    }

    if (characterItem.mods.length === 0) {
        return applyPerks(baseItemData, perks)
    }

    const modsData = [
        ...characterItem.mods.map(
                modId => dataManager.getItem(modId)
            ).filter(mod => isType(mod, "mod")),
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

    return applyPerks(applyMods({
        ...baseItemData,
        COST,
        WEIGHT
    }, modsData), perks)
}
