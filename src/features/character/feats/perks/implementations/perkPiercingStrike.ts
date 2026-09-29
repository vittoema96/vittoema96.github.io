import { PerkImplementation } from '@/features/character/feats';

const perkPiercingStrike: PerkImplementation = {
    id: 'perkPiercingStrike',
    getWeaponItemEffects: (itemData) => {
        const isUnarmedOrBladed =
            itemData.CATEGORY === 'unarmed' ||
            (itemData.CATEGORY === 'meleeWeapons' && itemData.IS_BLADED === true);

        return isUnarmedOrBladed ? ['effectAdd:effectPiercing:1'] : [];
    },
};

export default perkPiercingStrike;



