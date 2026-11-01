import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitNecroticPostHuman_tagSkill: TraitImplementation = {
    id: 'traitNecroticPostHuman_tagSkill',
    getWhitelistedSpecialties: () => ['survival'],
    getSpecialtyPointsBonus: () => 1,
};

export default traitNecroticPostHuman_tagSkill;
