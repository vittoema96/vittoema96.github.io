import type { PerkImplementation } from '@/features/character/feats/types.ts';
import { perkRank } from '@/features/character/feats/utils.ts';

const perkLifeGiver: PerkImplementation = {
    id: 'perkLifeGiver',
    getMaxHpBonus: (special, perks) =>
        special.endurance * perkRank(perks, 'perkLifeGiver'),
};

export default perkLifeGiver;
