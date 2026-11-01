import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitForcedEvolution_skillLimit: TraitImplementation = {
    id: 'traitForcedEvolution_skillLimit',
    getSkillMaxValue: () => 4,
};

export default traitForcedEvolution_skillLimit;
