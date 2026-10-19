import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkArcher: PerkImplementation = {
    id: 'perkArcher',
    getDamageRatingBonus: (character, _, itemData) =>
        itemData.CATEGORY === 'bows' ? perkRank(character.perks, 'perkArcher') : 0,
};

export default perkArcher;
