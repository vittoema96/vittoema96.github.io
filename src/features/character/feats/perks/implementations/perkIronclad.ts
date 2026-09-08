import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';
import { apparel } from '@/data';


const perkIronclad: PerkImplementation = {
    id: 'perkIronclad',
    getLocationDRBonus: (_ , items, perks) => {
        // TODO solo armor o apparel in generale?
        if(items.some(i => i.equipped && apparel[i.id] && apparel[i.id]?.CATEGORY !== 'powerArmor')){
            const level = perkRank(perks, 'perkIronclad')
            return {
                physical: level,
                energy: level
            }
        }
        return {}
    }
}

export default perkIronclad;
