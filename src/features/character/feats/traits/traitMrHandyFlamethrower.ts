import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyFlamethrower: TraitImplementation = {
    id: 'traitMrHandyFlamethrower',
    getGrantedItems: () => [
        {
            id: 'weaponFlamer',
            quantity: 1,
            equipped: false,
            mods: ['modMrHandyArm'],
        },
    ],
};

export default traitMrHandyFlamethrower;
