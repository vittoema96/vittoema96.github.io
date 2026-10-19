import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkSizeMatters: PerkImplementation = {
    id: 'perkSizeMatters',
    getDamageRatingBonus: (character, _, itemData) =>
        itemData.CATEGORY === 'bigGuns' ? perkRank(character.perks, 'perkSizeMatters') : 0,
};

export default perkSizeMatters;
