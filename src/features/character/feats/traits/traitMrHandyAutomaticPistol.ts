import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyAutomaticPistol: TraitImplementation = {
    id: 'traitMrHandyAutomaticPistol',
    getGrantedItems: () => [
        {
            id: 'weaponMrHandyAutomaticPistol',
            quantity: 1,
            equipped: false,
            mods: [],
        },
    ],
};

export default traitMrHandyAutomaticPistol;
