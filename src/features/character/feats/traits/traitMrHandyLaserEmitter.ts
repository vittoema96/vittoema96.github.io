import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyLaserEmitter: TraitImplementation = {
    id: 'traitMrHandyLaserEmitter',
    getGrantedItems: () => [
        {
            id: 'weaponLaserGun',
            quantity: 1,
            equipped: false,
            mods: ['modMrHandyArm'],
        },
    ],
};

export default traitMrHandyLaserEmitter;
