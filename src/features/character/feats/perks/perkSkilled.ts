import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkSkilled: PerkImplementation = {
    id: 'perkSkilled',
    getSkillPointsBonus: perks => perkRank(perks, 'perkSkilled') * 2,
};

export default perkSkilled;
