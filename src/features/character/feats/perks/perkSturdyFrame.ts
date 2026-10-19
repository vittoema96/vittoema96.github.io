import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkSturdyFrame: PerkImplementation = {
    id: 'perkSturdyFrame',
    getItemWeightMultiplier: (itemData, perks) => {
        if (itemData.TYPE !== 'apparel' || itemData.CATEGORY === 'powerArmor') {
            return 1;
        }

        const rank = perkRank(perks, 'perkSturdyFrame');
        return 1 - rank * 0.25;
    },
};

export default perkSturdyFrame;
