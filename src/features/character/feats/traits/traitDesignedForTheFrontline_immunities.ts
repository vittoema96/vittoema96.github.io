import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitDesignedForTheFrontline_immunities: TraitImplementation = {
    id: 'traitDesignedForTheFrontline_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitDesignedForTheFrontline_immunities;
