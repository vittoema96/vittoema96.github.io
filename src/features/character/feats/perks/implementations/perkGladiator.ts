import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';
import { getModifiedItemData } from '@/features/item/utils.ts';


export const perkGladiator: PerkImplementation = {
    id: 'perkGladiator',
    getDamageRatingBonus: (character, item) => {
        const itemData = getModifiedItemData(item, character.perks)!
        if(itemData.CATEGORY === 'meleeWeapons'
            && !itemData.QUALITIES.includes('qualityTwoHanded')){
            return perkRank(character.perks, 'perkGladiator');
        }
        return 0
    }
}

export default perkGladiator;
