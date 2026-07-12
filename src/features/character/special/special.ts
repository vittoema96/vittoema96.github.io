// SPECIAL
import { RawCharacter } from '@/types';
import { useMemo } from 'react';

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
