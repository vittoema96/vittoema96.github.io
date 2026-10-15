import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyLaserEmitter: TraitImplementation = {
    id: 'traitMrHandyLaserEmitter',
    getGrantedItems: () => [
        {
            id: 'weaponMrHandyLaserEmitter',
            quantity: 1,
            equipped: false,
            mods: [],
        },
    ],
};

export default traitMrHandyLaserEmitter;
