import { isCloseCombat } from '@/features/item/utils.ts';
import { perkRank } from '@/features/character/feats/utils.ts';
import type { PerkImplementation } from '@/features/character/feats/types.ts';

const perkGunslinger: PerkImplementation = {
    id: 'perkGunslinger',
    getDamageRatingBonus: (character, _, itemData) =>
        !isCloseCombat(itemData.CATEGORY) && !itemData.QUALITIES.includes('qualityTwoHanded')
            ? perkRank(character.perks, 'perkGunslinger')
            : 0,
    getWeaponItemEffects: itemData =>
        !isCloseCombat(itemData.CATEGORY) && !itemData.QUALITIES.includes('qualityTwoHanded')
            ? ['rerollHitLocation:true']
            : [],
};

export default perkGunslinger;
