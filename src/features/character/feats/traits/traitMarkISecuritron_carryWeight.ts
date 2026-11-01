import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMarkISecuritron_carryWeight: TraitImplementation = {
    id: 'traitMarkISecuritron_carryWeight',
    getMaxWeightOverride: () => 75,
};

export default traitMarkISecuritron_carryWeight;
