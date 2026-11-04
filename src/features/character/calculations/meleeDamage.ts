import { SpecialMap } from '@/features/character/special/special.ts';
import { TraitId } from '@/features/character/feats/traits.ts';
import { PerkId } from '@/features/character/feats/perks.ts';
import { getMeleeDamageBonus } from '@/features/character/feats/rules';
import type { Origin } from '@/features/character/origins/types.ts';


export function calculateMeleeDamage(
    special: SpecialMap, traits: TraitId[], perks: PerkId[] = [], origin?: Origin,
){
    let base = 0;
    if (special.strength >= 7) {
        base = 1;
    }
    if (special.strength >= 9) {
        base = 2;
    }
    if (special.strength >= 11) {
        base = 3;
    }
    return base + getMeleeDamageBonus(perks, traits, origin);
}
