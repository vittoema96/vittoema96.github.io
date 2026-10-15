import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyCircularSaw: TraitImplementation = {
    id: 'traitMrHandyCircularSaw',
    getGrantedItems: () => [{
        id: 'weaponMrHandyCircularSaw',
        quantity: 1,
        equipped: false,
        mods: [],
    }],
};

export default traitMrHandyCircularSaw;
