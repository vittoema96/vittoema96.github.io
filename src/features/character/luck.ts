import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { SpecialMap } from '@/features/character/special/special.ts';
import { getMaxLuckBonus } from '@/features/character/feats';


export function calculateMaxLuck(special: SpecialMap, perks: PerkId[], traits: TraitId[]){
    return special.luck + getMaxLuckBonus(perks, traits);
}
