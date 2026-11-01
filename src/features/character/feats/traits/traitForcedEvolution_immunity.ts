import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitForcedEvolution_immunity: TraitImplementation = {
    id: 'traitForcedEvolution_immunity',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitForcedEvolution_immunity;
