import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkToughness: PerkImplementation = {
    id: 'perkToughness',
    getLocationDRBonus: (_ , __, perks) => {
        return {physical: perkRank(perks, 'perkToughness')}
    }
}

export default perkToughness;
