// SPECIAL
import { Origin, ORIGINS } from '@/features/character/origin.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { getSpecialAllocationPointsBonus } from '@/features/character/feats';

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

export function calculateSpecialPoints(special: SpecialMap, origin: Origin, perks: PerkId[], traits: TraitId[]){
    // Points can't go lower than 4 on all 7 special stats
    // Supermutants have 6 minimum in STR and END
    const baseSpecialSum =
        7 * 4 + (origin === ORIGINS.SUPER_MUTANT ? 4 : 0);
    const specialSum = Object.values(special).reduce(
        (total, value) => total + value,
        0,
    );
    const usedPoints = specialSum - baseSpecialSum;
    return 12 + getSpecialAllocationPointsBonus(perks, traits) - usedPoints;
}
