import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkShotgunSurgeon: PerkImplementation = {
    id: 'perkShotgunSurgeon',
    getWeaponItemEffects: itemData =>
        itemData.TAGS.includes('shotgun') ? ['effectAdd:effectPiercing:1'] : [],
};

export default perkShotgunSurgeon;
