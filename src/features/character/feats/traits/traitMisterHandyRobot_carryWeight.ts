import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMisterHandyRobot_carryWeight: TraitImplementation = {
    id: 'traitMisterHandyRobot_carryWeight',
    getMaxWeightOverride: () => 75,
};

export default traitMisterHandyRobot_carryWeight;
