import { RawCharacter } from '@/types';
import { SpecialMap } from '@/features/character/special/special.ts';

import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { getMaxHpBonus } from '@/features/character/feats';

/**
 * Method used on CharacterContextValue.updateCharacter()
 * to update currentHp when maxHp changes
 */
export const adjustCurrentHp = (prev: RawCharacter, current: RawCharacter) => {
    const result: RawCharacter = { ...current };
    const prevMaxHp = calculateMaxHp(prev.special, prev.level, prev.perks, prev.traits);
    const currentMaxHp = calculateMaxHp(current.special, current.level, current.perks, current.traits);
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
    perks: PerkId[],
    traits: TraitId[],
): number => {
    return (
        special.endurance + getMaxHpBonus(special, perks, traits) +
        special.luck +
        level - 1
    );
};
