import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitForcedEvolution_physiology: TraitImplementation = {
    id: 'traitForcedEvolution_physiology',
    getAllowedApparelCategories: () => ['raiderArmor'],
};

export default traitForcedEvolution_physiology;
