import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitRobobrainRobot_immunities: TraitImplementation = {
    id: 'traitRobobrainRobot_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitRobobrainRobot_immunities;
