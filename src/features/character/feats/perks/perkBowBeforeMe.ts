import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkBowBeforeMe: PerkImplementation = {
    id: 'perkBowBeforeMe',
    getWeaponItemEffects: (itemData) =>
        itemData.CATEGORY === 'bows'
            ? ['effectAdd:effectPiercing:1']
            : [],
};

export default perkBowBeforeMe;
