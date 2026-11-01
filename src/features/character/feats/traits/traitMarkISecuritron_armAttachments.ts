import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMarkISecuritron_armAttachments: TraitImplementation = {
    id: 'traitMarkISecuritron_armAttachments',
    getGrantedItems: () => [
        {
            id: 'weaponLaserPistol',
            quantity: 1,
            equipped: false,
            mods: ['modAutomaticBarrel'],
        },
        {
            id: 'weaponMachineGun',
            quantity: 1,
            equipped: false,
            mods: [],
        },
    ],
};

export default traitMarkISecuritron_armAttachments;
