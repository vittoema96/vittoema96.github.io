import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';


const perkTag: PerkImplementation = {
    id: 'perkTag',
    getSpecialtyPointBonus: (perks, _) => perkRank(perks, 'perkTag')
};

export default perkTag;
