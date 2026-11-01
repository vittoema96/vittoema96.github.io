import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitProtectOrDestroy_carryWeight: TraitImplementation = {
    id: 'traitProtectOrDestroy_carryWeight',
    getMaxWeightOverride: () => 112.5,
};

export default traitProtectOrDestroy_carryWeight;
