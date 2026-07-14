// SPECIAL
import { Character, RawCharacter } from '@/types';
import { useMemo } from 'react';
import { ORIGINS } from '@/features/character/origin.ts';
import { hasTrait } from '@/features/character/feats/traits/traits.ts';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

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

export const COMPANION_SPECIAL = ['body', 'mind'] as const;
export type CompanionSpecialType = (typeof COMPANION_SPECIAL)[number];


export function isCharacterSpecial(special: any): special is SpecialType {
    return SPECIAL.includes(special);
}

export function isCompanionSpecial(special: any): special is CompanionSpecialType {
    return COMPANION_SPECIAL.includes(special);
}


export function useSpecial(raw: RawCharacter) {
    return useMemo(() => {
        return raw.special;
    }, [raw.special]);
}

export function useSpecialPoints(character: Character){
    return useMemo(() => {
        // Points can't go lower than 4 on all 7 special stats
        // Supermutants have 6 minimum in STR and END
        const baseSpecialSum =
            7 * 4 + (character.origin === ORIGINS.SUPER_MUTANT ? 4 : 0);
        const specialSum = Object.values(character.special).reduce(
            (total, value) => total + value,
            0,
        );
        const usedPoints = specialSum - baseSpecialSum;
        const giftedBonus = hasTrait(character.traits,'traitGifted') ? 2 : 0;
        const intenseTrainingBonus = perkRank(character.perks, 'perkIntenseTraining');
        return 12 + giftedBonus + intenseTrainingBonus - usedPoints;
    }, [character.origin, character.perks, character.special, character.traits]);
}
