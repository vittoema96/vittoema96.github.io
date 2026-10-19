import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';
import { isCloseCombat } from '@/features/item/utils.ts';

// TODO should we check fire rate AFTER applying fire rate bonus?
const perkRifleman: PerkImplementation = {
    id: 'perkRifleman',
    getDamageRatingBonus: (character, _, itemData) =>
        itemData.CATEGORY === 'bigGuns' ||
        isCloseCombat(itemData.CATEGORY) ||
        !itemData.QUALITIES.includes('qualityTwoHanded') ||
        Number(itemData.FIRE_RATE) < 2
            ? 0
            : perkRank(character.perks, 'perkRifleman'),
    getWeaponItemEffects: (itemData, perks) => {
        if (
            itemData.CATEGORY === 'bigGuns' ||
            isCloseCombat(itemData.CATEGORY) ||
            !itemData.QUALITIES.includes('qualityTwoHanded') ||
            Number(itemData.FIRE_RATE) < 2
        ) {
            return [];
        }
        const rank = perkRank(perks, 'perkRifleman');
        return rank >= 2 ? ['effectAdd:effectPiercing:1'] : [];
    },
};

export default perkRifleman;
