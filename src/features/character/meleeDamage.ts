import { SpecialMap } from '@/features/character/special/special.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';


export function calculateMeleeDamage(special: SpecialMap, traits: TraitId[]){
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
    if (traits.includes('traitHeavyHanded')) {
        base += 1;
    }
    return base;
}
