import { useMemo } from 'react';
import { getModifiedItemData } from '@/features/item/utils.ts';
import { isType } from '@/hooks/getGameDatabase.ts';
import { RawCharacter } from '@/types';
import { Origin } from '@/features/character/origin.ts';

import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';


export function useMaxWeight(raw: RawCharacter, origin: Origin, perks: PerkId[], traits: TraitId[]) {
    return useMemo(() => {
        let maxWeight = origin.calcMaxCarryWeight(raw.special.strength);

        if (traits.includes('traitSmallFrame')) {
            maxWeight = 75 + raw.special.strength * 2.5;
        }

        // Add carry weight bonuses from equipped items with mods
        raw.items.forEach(item => {
            if (!item.equipped) {
                return;
            }
            // TODO Carry weight bonus not currently fully implemented
            const itemData = getModifiedItemData(item, perks);
            const carryWeightBonus = isType(itemData, 'apparel')
                ? (itemData as typeof itemData & { CARRY_WEIGHT_BONUS?: number }).CARRY_WEIGHT_BONUS
                : undefined;
            if (carryWeightBonus) {
                maxWeight += Number(carryWeightBonus) || 0;
            }
        });
        return maxWeight;
    }, [origin, raw.special.strength, raw.items, perks, traits]);
}

export function useCurrentWeight(raw: RawCharacter, perks: PerkId[]){
    return useMemo(() => {
        let total = 0;
        total += raw.items.reduce((total, item) => {
            const itemData = getModifiedItemData(item, perks);
            const weight = Number(itemData?.WEIGHT) || 0;
            return total + weight * item.quantity;
        }, 0);
        total += raw.customItems.reduce((total, item) => {
            return total + item.WEIGHT * item.quantity;
        }, 0);
        return total;
    }, [raw.items, raw.customItems, perks]);
}
