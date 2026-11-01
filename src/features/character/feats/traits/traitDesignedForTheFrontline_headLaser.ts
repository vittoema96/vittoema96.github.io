import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitDesignedForTheFrontline_headLaser: TraitImplementation = {
    id: 'traitDesignedForTheFrontline_headLaser',
    getGrantedItems: () => [
        {
            id: 'weaponAssaultronHead',
            quantity: 1,
            equipped: false,
            mods: [],
        },
    ],
};

export default traitDesignedForTheFrontline_headLaser;
