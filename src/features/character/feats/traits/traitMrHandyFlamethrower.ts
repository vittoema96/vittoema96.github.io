import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMrHandyFlamethrower: TraitImplementation = {
    id: 'traitMrHandyFlamethrower',
    getGrantedItems: () => [{
        id: 'weaponMrHandyFlamethrower',
        quantity: 1,
        equipped: false,
        mods: [],
    }],
};

export default traitMrHandyFlamethrower;
