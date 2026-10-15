import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';


export const perkGladiator: PerkImplementation = {
    id: 'perkGladiator',
    getDamageRatingBonus: (character, _, itemData) => {
        if(itemData.CATEGORY === 'meleeWeapons'
            && !itemData.QUALITIES.includes('qualityTwoHanded')){
            return perkRank(character.perks, 'perkGladiator');
        }
        return 0
    }
}

export default perkGladiator;
