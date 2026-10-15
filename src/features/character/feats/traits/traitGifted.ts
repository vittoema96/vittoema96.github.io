import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitGifted: TraitImplementation = {
    id: 'traitGifted',
    getSpecialAllocationPointsBonus: () => 2,
    getMaxLuckBonus: () => -1,
};

export default traitGifted;

