import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkLicensedPlumber: PerkImplementation = {
    id: 'perkLicensedPlumber',
    getWeaponItemEffects: itemData =>
        itemData.TAGS.includes('pipe') ? ['qualityRemove:qualityUnreliable'] : [],
};

export default perkLicensedPlumber;
