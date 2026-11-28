import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyAutomaticPistol: TraitImplementation = {
    id: 'traitMrHandyAutomaticPistol',
    getGrantedItems: () => [
        {
            id: 'weapon10mmPistol',
            quantity: 1,
            equipped: false,
            mods: ['modAutomatic', 'modMrHandyArm'],
        },
    ],
};

export default traitMrHandyAutomaticPistol;
