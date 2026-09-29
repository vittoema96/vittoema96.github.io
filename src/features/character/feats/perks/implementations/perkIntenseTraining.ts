import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

const perkIntenseTraining: PerkImplementation = {
    id: 'perkIntenseTraining',
    getSpecialAllocationPointsBonus: (perks) => perkRank(perks, 'perkIntenseTraining'),
};

export default perkIntenseTraining;



