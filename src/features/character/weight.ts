import { getModifiedItemData } from '@/features/character/items.ts';
import { isType } from '@/features/item/utils.ts';
import { RawCharacter } from '@/types';
import type { Origin } from '@/features/character/origins/types';

import { PerkId } from '@/features/character/feats/perks.ts';
import { TraitId } from '@/features/character/feats/traits.ts';
import {
    applyMaxWeightModifiers,
    getItemWeightMultiplier,
    getMaxWeightOverride,
} from '@/features/character/feats/rules';

export function calculateMaxWeight(
    raw: RawCharacter,
    origin: Origin,
    perks: PerkId[],
    traits: TraitId[],
) {
    const weightPerks = origin.allowsPerkAndTraitWeightModifiers ? perks : [];
    const weightTraits = origin.allowsPerkAndTraitWeightModifiers ? traits : [];
    const baseWeight =
        getMaxWeightOverride(raw.special, weightPerks, weightTraits, origin) ??
        origin.getMaxWeightBase(raw.special.strength);
    let maxWeight = applyMaxWeightModifiers(
        baseWeight,
        raw.special,
        weightPerks,
        weightTraits,
        origin,
    );

    // Add carry weight bonuses from equipped items with mods
    raw.items.forEach(item => {
        if (!item.equipped) {
            return;
        }
        const itemData = getModifiedItemData(item, perks);
        if (isType(itemData, 'apparel')) {
            maxWeight += itemData.CARRY_WEIGHT_BONUS ?? 0;
        }
    });
    return maxWeight;
}

export function calculateCurrentWeight(
    raw: RawCharacter,
    origin: Origin,
    perks: PerkId[],
    traits: TraitId[],
) {
    const weightPerks = origin.allowsPerkAndTraitWeightModifiers ? perks : [];
    const weightTraits = origin.allowsPerkAndTraitWeightModifiers ? traits : [];
    let total = 0;
    total += raw.items.reduce((total, item) => {
        const itemData = getModifiedItemData(item, perks);
        const weight = Number(itemData?.WEIGHT) || 0;
        const multiplier = itemData
            ? getItemWeightMultiplier(itemData, weightPerks, weightTraits, origin)
            : 1;
        return total + weight * multiplier * item.quantity;
    }, 0);
    total += raw.customItems.reduce((total, item) => {
        const multiplier = getItemWeightMultiplier(item, weightPerks, weightTraits, origin);
        return total + item.WEIGHT * multiplier * item.quantity;
    }, 0);
    return total;
}
