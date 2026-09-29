import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

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


