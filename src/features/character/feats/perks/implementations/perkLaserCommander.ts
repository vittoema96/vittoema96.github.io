import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';
import { getModifiedItemData } from '@/features/item/utils.ts';


export const perkLaserCommander: PerkImplementation = {
    id: 'perkLaserCommander',
    getDamageRatingBonus: (character, item) => {
        const itemData = getModifiedItemData(item, character.perks)!
        if(itemData.CATEGORY === 'energyWeapons'){
            return perkRank(character.perks, 'perkLaserCommander');
        }
        return 0
    }
}

export default perkLaserCommander;
