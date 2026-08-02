import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


export const perkGladiator: PerkImplementation = {
    id: 'perkGladiator',
    getDamageRatingBonus: (character, itemData) => {
        if(itemData.CATEGORY === 'meleeWeapons'
            && !itemData.QUALITIES.includes('qualityTwoHanded')){
            return perkRank(character.perks, 'perkGladiator');
        }
        return 0
    }
}

export default perkGladiator;
