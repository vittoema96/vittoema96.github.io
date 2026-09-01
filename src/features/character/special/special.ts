// SPECIAL
import { Origin, ORIGINS } from '@/features/character/origin.ts';
import { hasTrait, TraitId } from '@/features/character/feats/traits/traits.ts';
import { PerkId, perkRank } from '@/features/character/feats/perks/perks.ts';

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
    const giftedBonus = hasTrait(traits,'traitGifted') ? 2 : 0;
    const intenseTrainingBonus = perkRank(perks, 'perkIntenseTraining');
    return 12 + giftedBonus + intenseTrainingBonus - usedPoints;
}
