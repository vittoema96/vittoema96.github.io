import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMisterHandyRobot_immunities: TraitImplementation = {
    id: 'traitMisterHandyRobot_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitMisterHandyRobot_immunities;
