import { RawCharacter } from '@/types';
import { SpecialMap } from '@/features/character/special/special.ts';

import { PerkId } from '@/features/character/feats/perks.ts';
import { TraitId } from '@/features/character/feats/traits.ts';
import { getMaxHpBonus } from '@/features/character/feats/rules';
import { getOriginById } from '@/features/character/origins/registry';
import type { Origin } from '@/features/character/origins/types.ts';
import { calculatePerks } from './feats/perks.ts';
import { calculateTraits } from './feats/traits.ts';

/**
 * Method used by the domain update transition behind CharacterContextValue.updateCharacter()
 * to update currentHp when maxHp changes
 */
export const adjustCurrentHp = (prev: RawCharacter, current: RawCharacter, explicitHp = false) => {
    const result: RawCharacter = { ...current };
    const prevOrigin = getOriginById(prev.origin);
    const currentOrigin = getOriginById(current.origin);
    const prevMaxHp = calculateMaxHp(
        prev.special, prev.level, calculatePerks(prev), calculateTraits(prev, prevOrigin), prevOrigin,
    );
    const currentMaxHp = calculateMaxHp(
        current.special, current.level, calculatePerks(current), calculateTraits(current, currentOrigin), currentOrigin,
    );
    const currentHp = prev.currentHp ?? prevMaxHp;
    const hpDelta = currentMaxHp - prevMaxHp;
    // TODO per ora se maxHp aumenta, currentHp aumenta di pari passo
    //      se maxHp diminuisce currentHp rimane tale (o scende a maxHp se superiore)
    if (!explicitHp && hpDelta > 0) {
        result.currentHp = currentHp + hpDelta;
    }
    result.currentHp = Math.min(result.currentHp ?? (explicitHp ? currentMaxHp : currentHp), currentMaxHp);
    return result;
};

export const calculateMaxHp = (
    special: SpecialMap,
    level: number,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number => {
    return (
        special.endurance + getMaxHpBonus(special, perks, traits, origin) +
        special.luck +
        level - 1
    );
};
