import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkToughness: PerkImplementation = {
    id: 'perkToughness',
    getLocationDRBonus: (character) => {
        return {physical: perkRank(character.perks, 'perkToughness')}
    }
}

export default perkToughness;
