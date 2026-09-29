import { TraitImplementation } from '@/features/character/feats';

const traitGifted: TraitImplementation = {
    id: 'traitGifted',
    getSpecialAllocationPointsBonus: () => 2,
    getMaxLuckBonus: () => -1,
};

export default traitGifted;


