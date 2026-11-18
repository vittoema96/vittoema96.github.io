import type { TraitImplementation } from '@/features/character/feats/types.ts';
import { SPECIAL } from '@/features/character/special/special.ts';
import { getSpecialBonus } from '@/features/character/feats/specialModifiers.ts';

const traitHoarder: TraitImplementation = {
    id: 'traitHoarder',
    modifyMaxWeight: currentMaxWeight => currentMaxWeight + 12.5,
    getRollSpecialModifiers: character =>
        character.currentWeight < 80 ? getSpecialBonus([...SPECIAL], -1) : [],
};

export default traitHoarder;
