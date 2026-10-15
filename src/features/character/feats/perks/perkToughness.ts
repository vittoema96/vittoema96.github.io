import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';


const perkToughness: PerkImplementation = {
    id: 'perkToughness',
    getLocationDRBonus: (_ , __, perks) => {
        return {physical: perkRank(perks, 'perkToughness')}
    }
}

export default perkToughness;
