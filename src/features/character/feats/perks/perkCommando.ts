import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

// TODO do we have to apply this AFTER firerate calculation?
const perkCommando: PerkImplementation = {
    id: 'perkCommando',
    getDamageRatingBonus: (character, _, itemData) => {
        if (itemData.CATEGORY !== 'bigGuns' && Number(itemData.FIRE_RATE) >= 3) {
            return perkRank(character.perks, 'perkCommando');
        }
        return 0;
    },
};

export default perkCommando;
