import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitStealthBoyAddict_physiology: TraitImplementation = {
    id: 'traitStealthBoyAddict_physiology',
    getAllowedApparelCategories: () => ['raiderArmor'],
};

export default traitStealthBoyAddict_physiology;
