import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { SpecialMap } from '@/features/character/special/special.ts';


export function calculateMaxLuck(special: SpecialMap, traits: TraitId[]){
    let result = special.luck;
    if (traits.includes('traitGifted')) {
        result -= 1;
    }
    return result;
}
