import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';


const perkTag: PerkImplementation = {
    id: 'perkTag',
    getSpecialtyPointsBonus: (perks, _) => perkRank(perks, 'perkTag'),
};

export default perkTag;
