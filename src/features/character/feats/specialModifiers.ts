import type { SpecialModifier } from './types.ts';
import type { SpecialType } from '@/features/character/special/special.ts';

export function getSpecialBonus(
    specials: SpecialType | SpecialType[],
    bonus: number,
): SpecialModifier[] {
    const affectedSpecials = Array.isArray(specials) ? specials : [specials];
    return affectedSpecials.map(special => ({
        special,
        apply: (currentValue: number) => currentValue + bonus,
    }));
}
