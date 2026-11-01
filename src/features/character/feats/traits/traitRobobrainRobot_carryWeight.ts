import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitRobobrainRobot_carryWeight: TraitImplementation = {
    id: 'traitRobobrainRobot_carryWeight',
    getMaxWeightOverride: () => 75,
};

export default traitRobobrainRobot_carryWeight;
