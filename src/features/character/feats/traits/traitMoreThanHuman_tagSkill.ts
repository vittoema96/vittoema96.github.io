import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMoreThanHuman_tagSkill: TraitImplementation = {
    id: 'traitMoreThanHuman_tagSkill',
    getSpecialtyPointsBonus: () => 1,
};

export default traitMoreThanHuman_tagSkill;
