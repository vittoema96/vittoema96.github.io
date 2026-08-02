import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


export const perkLaserCommander: PerkImplementation = {
    id: 'perkLaserCommander',
    getDamageRatingBonus: (character, itemData) => {
        if(itemData.CATEGORY === 'energyWeapons'){
            return perkRank(character.perks, 'perkLaserCommander');
        }
        return 0
    }
}

export default perkLaserCommander;
