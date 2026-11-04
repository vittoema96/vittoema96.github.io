import { TraitId } from '@/features/character/feats/traits.ts';
import { PerkId } from '@/features/character/feats/perks.ts';
import { SpecialMap } from '@/features/character/special/special.ts';
import { getMaxLuckBonus } from '@/features/character/feats/rules';
import type { Origin } from '@/features/character/origins/types.ts';


export function calculateMaxLuck(
    special: SpecialMap, perks: PerkId[], traits: TraitId[], origin?: Origin,
){
    return special.luck + getMaxLuckBonus(perks, traits, origin);
}
