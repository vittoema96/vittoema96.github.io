import { RawCharacter } from '@/types';
import { SpecialMap } from '@/features/character/special/special.ts';

import { PerkId, perkRank } from '@/features/character/feats/perks/perks.ts';

/**
 * Method used on CharacterContextValue.updateCharacter()
 * to update currentHp when maxHp changes
 */
export const adjustCurrentHp = (prev: RawCharacter, current: RawCharacter) => {
    const result: RawCharacter = { ...current };
    const prevMaxHp = calculateMaxHp(prev.special, prev.level, prev.perks);
    const currentMaxHp = calculateMaxHp(current.special, current.level, current.perks);
    const currentHp = prev.currentHp ?? currentMaxHp;
    const hpDelta = currentMaxHp - prevMaxHp;
    // TODO per ora se maxHp aumenta, currentHp aumenta di pari passo
    //      se maxHp diminuisce currentHp rimane tale (o scende a maxHp se superiore)
    if (hpDelta > 0) {
        result.currentHp = currentHp + hpDelta;
    }
    result.currentHp = Math.min(result.currentHp ?? currentHp, currentMaxHp);
    return result;
};

export const calculateMaxHp = (
    special: SpecialMap,
    level: number,
    perks: PerkId[]
): number => {
    const lifeGiverLevel = perkRank(perks, 'perkLifeGiver');
    return (
        special.endurance * (1 + lifeGiverLevel) +
        special.luck +
        level - 1
    );
};
