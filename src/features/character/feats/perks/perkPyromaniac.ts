import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkPyromaniac: PerkImplementation = {
    id: 'perkPyromaniac',
    getDamageRatingBonus: (character, _, itemData) =>
        itemData.TAGS.includes('fire')
            ? perkRank(character.perks, 'perkPyromaniac')
            : 0,
};

export default perkPyromaniac;
