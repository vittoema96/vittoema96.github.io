import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

const perkSkilled: PerkImplementation = {
    id: 'perkSkilled',
    getSkillPointsBonus: perks => perkRank(perks, 'perkSkilled') * 2,
};

export default perkSkilled;

