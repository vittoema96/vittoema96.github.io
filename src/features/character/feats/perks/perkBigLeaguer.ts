import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkBigLeaguer: PerkImplementation = {
    id: 'perkBigLeaguer',
    getWeaponItemEffects: itemData =>
        itemData.CATEGORY === 'meleeWeapons' && itemData.QUALITIES.includes('qualityTwoHanded')
            ? ['effectAdd:effectVicious']
            : [],
};

export default perkBigLeaguer;
