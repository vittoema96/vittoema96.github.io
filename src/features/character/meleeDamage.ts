import { SpecialMap } from '@/features/character/special/special.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { getMeleeDamageBonus } from '@/features/character/feats';


export function calculateMeleeDamage(special: SpecialMap, traits: TraitId[], perks: PerkId[] = []){
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
    return base + getMeleeDamageBonus(perks, traits);
}
