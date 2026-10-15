import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkIncisor: PerkImplementation = {
    id: 'perkIncisor',
    getWeaponItemEffects: (itemData, perks) => {
        if (itemData.CATEGORY !== 'meleeWeapons') {
            return [];
        }

        const rank = perkRank(perks, 'perkIncisor');
        return [`effectAdd:effectPiercing:${Math.min(rank, 2)}`];
    },
};

export default perkIncisor;
