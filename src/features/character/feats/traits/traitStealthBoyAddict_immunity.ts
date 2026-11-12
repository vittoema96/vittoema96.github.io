import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitStealthBoyAddict_immunity: TraitImplementation = {
    id: 'traitStealthBoyAddict_immunity',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitStealthBoyAddict_immunity;
