// SPECIAL
import type { Origin } from '@/features/character/origins/types';
import { TraitId } from '@/features/character/feats/traits.ts';
import { PerkId } from '@/features/character/feats/perks.ts';
import {
    getMaxSpecialValueModifier,
    getSpecialAllocationPointsBonus,
} from '@/features/character/feats/rules';

export const SPECIAL = [
    'strength',
    'perception',
    'endurance',
    'charisma',
    'intelligence',
    'agility',
    'luck',
] as const;
export type SpecialType = (typeof SPECIAL)[number];
export type SpecialMap = Record<SpecialType, number>;


export function isCharacterSpecial(special: any): special is SpecialType {
    return SPECIAL.includes(special);
}

export function getMaxSpecialValues(
    origin: Origin,
    perks: PerkId[] = [],
    traits: TraitId[] = [],
): SpecialMap {
    return SPECIAL.reduce((values, special) => {
        values[special] = origin.specialMaxValues[special]
            + getMaxSpecialValueModifier(special, perks, traits, origin);
        return values;
    }, { ...origin.specialMaxValues });
}

export function getMinSpecialValue(origin: Origin, special: SpecialType): number {
    return origin.specialMinValues[special];
}

export function calculateSpecialPoints(special: SpecialMap, origin: Origin, perks: PerkId[], traits: TraitId[]){
    // Points can't go lower than 4 on all 7 special stats
    // Supermutants have 6 minimum in STR and END
    const baseSpecialSum = 7 * 4;
    const specialSum = Object.values(special).reduce(
        (total, value) => total + value,
        0,
    );
    const usedPoints = specialSum - baseSpecialSum;
    return 12 + getSpecialAllocationPointsBonus(perks, traits, origin) - usedPoints;
}
