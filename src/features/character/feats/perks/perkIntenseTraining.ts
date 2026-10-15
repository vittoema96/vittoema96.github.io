import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkIntenseTraining: PerkImplementation = {
    id: 'perkIntenseTraining',
    getSpecialAllocationPointsBonus: (perks) => perkRank(perks, 'perkIntenseTraining'),
};

export default perkIntenseTraining;

