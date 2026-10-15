import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyPliers: TraitImplementation = {
    id: 'traitMrHandyPliers',
    getGrantedItems: () => [{
        id: 'weaponMrHandyPliers',
        quantity: 1,
        equipped: false,
        mods: [],
    }],
};

export default traitMrHandyPliers;
