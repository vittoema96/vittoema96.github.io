import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';


export const perkLaserCommander: PerkImplementation = {
    id: 'perkLaserCommander',
    getDamageRatingBonus: (character, _, itemData) => {
        if(itemData.CATEGORY === 'energyWeapons'){
            return perkRank(character.perks, 'perkLaserCommander');
        }
        return 0
    }
}

export default perkLaserCommander;
