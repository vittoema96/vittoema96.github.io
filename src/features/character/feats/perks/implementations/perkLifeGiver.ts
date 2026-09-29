import { PerkImplementation } from '@/features/character/feats';
import { perkRank } from '@/features/character/feats/perks/perks.ts';

const perkLifeGiver: PerkImplementation = {
    id: 'perkLifeGiver',
    getMaxHpBonus: (special, perks) =>
        special.endurance * perkRank(perks, 'perkLifeGiver'),
};

export default perkLifeGiver;


