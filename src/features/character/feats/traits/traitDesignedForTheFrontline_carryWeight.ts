import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitDesignedForTheFrontline_carryWeight: TraitImplementation = {
    id: 'traitDesignedForTheFrontline_carryWeight',
    getMaxWeightOverride: () => 75,
};

export default traitDesignedForTheFrontline_carryWeight;
