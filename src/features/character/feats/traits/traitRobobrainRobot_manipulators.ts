import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitRobobrainRobot_manipulators: TraitImplementation = {
    id: 'traitRobobrainRobot_manipulators',
    getGrantedItems: () => [
        {
            id: 'weaponMesmetron',
            quantity: 1,
            equipped: false,
            mods: [],
        },
    ],
};

export default traitRobobrainRobot_manipulators;
