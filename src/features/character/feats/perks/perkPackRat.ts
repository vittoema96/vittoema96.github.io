import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkPackRat: PerkImplementation = {
    id: 'perkPackRat',
    getItemWeightMultiplier: itemData => (itemData.CATEGORY === 'junk' ? 0.5 : 1),
};

export default perkPackRat;
