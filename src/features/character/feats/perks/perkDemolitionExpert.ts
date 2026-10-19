import type { PerkImplementation } from '@/features/character/feats/types.ts';

// TODO this unlocks recipes too... We still need to implement recipes tho...
const perkDemolitionExpert: PerkImplementation = {
    id: 'perkDemolitionExpert',
    getWeaponItemEffects: itemData =>
        itemData.QUALITIES.includes('qualityBlast') ? ['effectAdd:effectVicious'] : [],
};

export default perkDemolitionExpert;
